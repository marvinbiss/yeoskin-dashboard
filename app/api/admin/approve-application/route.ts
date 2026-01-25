import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM_EMAIL = process.env.EMAIL_FROM || 'Yeoskin <creators@yeoskin.com>'
const REPLY_TO = process.env.EMAIL_REPLY_TO || 'creators@yeoskin.com'

// Verify admin session
async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return false

  const token = authHeader.replace('Bearer ', '')
  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user } } = await userClient.auth.getUser(token)
  if (!user) return false

  const { data: admin } = await supabase
    .from('admin_profiles')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  return !!admin
}

// POST: Send approval email + Supabase invite
export async function POST(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { email, firstName, tierName, commissionRate, discountCode } = await req.json()

  if (!email || !firstName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const results = {
    approvalEmail: { success: false, error: null as string | null },
    supabaseInvite: { success: false, error: null as string | null, userId: null as string | null },
  }

  // 1. Send approval email via Resend
  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        replyTo: REPLY_TO,
        subject: '🎉 Ta candidature Yeoskin a été approuvée !',
        html: getApprovalEmailHtml({ firstName, tierName, commissionRate, discountCode }),
      })

      if (error) {
        console.error('[Email] Approval email error:', error)
        results.approvalEmail.error = error.message
      } else {
        results.approvalEmail.success = true
        console.info('[Email] Approval email sent:', data?.id)
      }
    } catch (err) {
      const error = err as Error
      console.error('[Email] Approval email exception:', error)
      results.approvalEmail.error = error.message
    }
  } else {
    console.warn('[Email] Resend not configured')
    results.approvalEmail.error = 'Email service not configured'
  }

  // 2. Send Supabase invite for password setup
  try {
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: 'https://yeoskin.fr/auth/set-password',
    })

    if (error) {
      console.error('[Auth] Invite error:', error)
      results.supabaseInvite.error = error.message
    } else {
      results.supabaseInvite.success = true
      results.supabaseInvite.userId = data.user.id
      console.info('[Auth] Invite sent, user:', data.user.id)

      // Link the auth user to the creator
      if (data.user.id) {
        const { error: linkError } = await supabase
          .from('creators')
          .update({ user_id: data.user.id })
          .eq('email', email.toLowerCase())

        if (linkError) {
          console.error('[Auth] Failed to link user to creator:', linkError)
        }
      }
    }
  } catch (err) {
    const error = err as Error
    console.error('[Auth] Invite exception:', error)
    results.supabaseInvite.error = error.message
  }

  // Return combined results
  const success = results.approvalEmail.success || results.supabaseInvite.success

  return NextResponse.json({
    success,
    results,
    message: success
      ? 'Emails envoyés'
      : 'Erreur lors de l\'envoi des emails',
  })
}

// Email template
function getApprovalEmailHtml(data: {
  firstName: string
  tierName?: string
  commissionRate?: number
  discountCode?: string
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Candidature approuvée - Yeoskin</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fdf2f8;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Header -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); border-radius: 16px 16px 0 0; padding: 40px 30px; text-align: center;">
          <tr>
            <td>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🎉 Candidature approuvée !</h1>
            </td>
          </tr>
        </table>

        <!-- Content -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px;">
          <tr>
            <td>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Félicitations ${data.firstName} ! Ta candidature a été approuvée par notre équipe.
              </p>

              ${data.tierName ? `
              <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; padding: 24px; margin: 20px 0; text-align: center;">
                <p style="margin: 0 0 12px; color: #065f46; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Ton tier</p>
                <p style="margin: 0 0 8px; color: #047857; font-size: 32px; font-weight: bold;">${data.tierName}</p>
                ${data.commissionRate ? `<p style="margin: 0; color: #059669; font-size: 18px;">${Math.round(data.commissionRate * 100)}% de commission</p>` : ''}
              </div>
              ` : ''}

              ${data.discountCode ? `
              <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
                <p style="margin: 0 0 8px; color: #92400e; font-size: 14px;">Ton code promo unique</p>
                <p style="margin: 0; color: #78350f; font-size: 24px; font-weight: bold; font-family: monospace;">${data.discountCode}</p>
              </div>
              ` : ''}

              <div style="background: #eff6ff; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                <p style="margin: 0 0 8px; color: #1e40af; font-weight: 600;">📧 Email de configuration</p>
                <p style="margin: 0; color: #1d4ed8; font-size: 14px;">Tu vas recevoir un second email pour définir ton mot de passe et accéder à ton dashboard.</p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://yeoskin.fr/auth/set-password" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 16px;">
                  Configurer mon compte →
                </a>
              </div>

              <p style="color: #6b7280; font-size: 14px; margin: 30px 0 0; text-align: center;">
                Bienvenue dans la famille Yeoskin ! 💖
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding: 30px 0; text-align: center;">
          <tr>
            <td>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Yeoskin. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}
