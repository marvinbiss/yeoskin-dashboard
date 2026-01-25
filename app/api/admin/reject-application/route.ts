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

// POST: Send rejection email
export async function POST(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { email, firstName, reason } = await req.json()

  if (!email || !firstName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!resend) {
    console.warn('[Email] Resend not configured')
    return NextResponse.json({
      success: false,
      error: 'Email service not configured',
    })
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      replyTo: REPLY_TO,
      subject: 'Mise à jour de ta candidature Yeoskin',
      html: getRejectionEmailHtml({ firstName, reason }),
    })

    if (error) {
      console.error('[Email] Rejection email error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
      })
    }

    console.info('[Email] Rejection email sent:', data?.id)
    return NextResponse.json({
      success: true,
      emailId: data?.id,
    })
  } catch (err) {
    const error = err as Error
    console.error('[Email] Rejection email exception:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
    })
  }
}

// Email template
function getRejectionEmailHtml(data: {
  firstName: string
  reason?: string
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Mise à jour candidature - Yeoskin</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Header -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #374151; border-radius: 16px 16px 0 0; padding: 40px 30px; text-align: center;">
          <tr>
            <td>
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">Mise à jour de ta candidature</h1>
            </td>
          </tr>
        </table>

        <!-- Content -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px;">
          <tr>
            <td>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Bonjour ${data.firstName},
              </p>

              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Merci pour l'intérêt que tu portes à Yeoskin. Après examen de ta candidature, nous ne sommes malheureusement pas en mesure de l'accepter pour le moment.
              </p>

              ${data.reason ? `
              <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0; color: #4b5563; font-size: 14px;">
                  <strong>Raison :</strong> ${data.reason}
                </p>
              </div>
              ` : ''}

              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                N'hésite pas à recandidater dans quelques mois si ta situation évolue. En attendant, continue de partager ta passion pour la K-Beauty !
              </p>

              <p style="color: #6b7280; font-size: 14px; margin: 30px 0 0;">
                L'équipe Yeoskin
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
