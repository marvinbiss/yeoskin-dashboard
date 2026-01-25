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
  const tierColors: Record<string, { bg: string; text: string; accent: string }> = {
    'Bronze': { bg: '#fef3e2', text: '#92400e', accent: '#cd7f32' },
    'Silver': { bg: '#f3f4f6', text: '#374151', accent: '#9ca3af' },
    'Gold': { bg: '#fef9c3', text: '#854d0e', accent: '#eab308' },
  }
  const tier = tierColors[data.tierName || ''] || tierColors['Bronze']

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Bienvenue chez Yeoskin</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fdf2f8; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fdf2f8;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">

          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <img src="https://yeoskin.fr/logo.png" alt="Yeoskin" width="150" style="display: block; max-width: 150px;" />
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">

                <!-- Hero Banner -->
                <tr>
                  <td style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #6366f1 100%); padding: 50px 40px; text-align: center;">
                    <div style="font-size: 60px; margin-bottom: 16px;">🎉</div>
                    <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">Félicitations ${data.firstName} !</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0; font-size: 18px; font-weight: 400;">Ta candidature a été approuvée</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">

                    <p style="color: #4b5563; font-size: 16px; line-height: 1.7; margin: 0 0 30px; text-align: center;">
                      Bienvenue dans le programme créateur Yeoskin ! Tu fais maintenant partie d'une communauté passionnée de K-Beauty.
                    </p>

                    <!-- Tier & Commission Card -->
                    ${data.tierName ? `
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: ${tier.bg}; border-radius: 16px; margin-bottom: 24px; border: 2px solid ${tier.accent};">
                      <tr>
                        <td style="padding: 30px; text-align: center;">
                          <div style="display: inline-block; background: ${tier.accent}; color: white; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Ton niveau</div>
                          <h2 style="color: ${tier.text}; margin: 12px 0 8px; font-size: 36px; font-weight: 800;">${data.tierName}</h2>
                          ${data.commissionRate ? `<p style="color: ${tier.text}; margin: 0; font-size: 20px; font-weight: 600;">${Math.round(data.commissionRate * 100)}% de commission</p>` : ''}
                        </td>
                      </tr>
                    </table>
                    ` : ''}

                    <!-- Discount Code Card -->
                    ${data.discountCode ? `
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 16px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 30px; text-align: center;">
                          <p style="color: #92400e; margin: 0 0 12px; font-size: 14px; font-weight: 500;">Ton code promo exclusif</p>
                          <div style="background: white; display: inline-block; padding: 16px 32px; border-radius: 12px; border: 2px dashed #d97706;">
                            <span style="color: #b45309; font-size: 28px; font-weight: 800; font-family: 'SF Mono', Monaco, monospace; letter-spacing: 2px;">${data.discountCode}</span>
                          </div>
                          <p style="color: #a16207; margin: 16px 0 0; font-size: 13px;">Partage ce code avec ta communauté pour leur offrir une réduction</p>
                        </td>
                      </tr>
                    </table>
                    ` : ''}

                    <!-- Info Box -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f0f9ff; border-radius: 12px; border-left: 4px solid #0ea5e9; margin-bottom: 30px;">
                      <tr>
                        <td style="padding: 20px 24px;">
                          <p style="color: #0369a1; margin: 0 0 6px; font-size: 15px; font-weight: 600;">📧 Prochaine étape</p>
                          <p style="color: #0c4a6e; margin: 0; font-size: 14px; line-height: 1.6;">Tu vas recevoir un email pour définir ton mot de passe et accéder à ton dashboard créateur.</p>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA Button -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center" style="padding: 10px 0 30px;">
                          <a href="https://yeoskin.fr/dashboard" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 18px 48px; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(236, 72, 153, 0.4);">
                            Accéder à mon dashboard →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Divider -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="border-top: 1px solid #e5e7eb; padding-top: 30px;">
                          <p style="color: #9ca3af; font-size: 14px; text-align: center; margin: 0;">
                            Bienvenue dans la famille Yeoskin ! 💖
                          </p>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 40px 20px; text-align: center;">
              <!-- Social Links -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 20px;">
                <tr>
                  <td style="padding: 0 8px;">
                    <a href="https://instagram.com/yeoskin" style="display: inline-block; width: 36px; height: 36px; background: #e5e7eb; border-radius: 50%; text-align: center; line-height: 36px; text-decoration: none;">
                      <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="Instagram" width="18" style="vertical-align: middle;" />
                    </a>
                  </td>
                  <td style="padding: 0 8px;">
                    <a href="https://tiktok.com/@yeoskin" style="display: inline-block; width: 36px; height: 36px; background: #e5e7eb; border-radius: 50%; text-align: center; line-height: 36px; text-decoration: none;">
                      <img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" alt="TikTok" width="18" style="vertical-align: middle;" />
                    </a>
                  </td>
                  <td style="padding: 0 8px;">
                    <a href="https://yeoskin.fr" style="display: inline-block; width: 36px; height: 36px; background: #e5e7eb; border-radius: 50%; text-align: center; line-height: 36px; text-decoration: none;">
                      <img src="https://cdn-icons-png.flaticon.com/512/1006/1006771.png" alt="Website" width="18" style="vertical-align: middle;" />
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px;">
                © ${new Date().getFullYear()} Yeoskin. Tous droits réservés.
              </p>
              <p style="color: #d1d5db; font-size: 11px; margin: 0;">
                Tu reçois cet email car tu as postulé au programme créateur Yeoskin.
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
