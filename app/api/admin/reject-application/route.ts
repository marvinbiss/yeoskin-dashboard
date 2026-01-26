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
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Mise à jour candidature - Yeoskin</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">

          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <img src="https://cdn.shopify.com/s/files/1/0870/9573/8716/files/Copie_de_LogoOK_1.png?v=1742078138" alt="Yeoskin" width="150" style="display: block; max-width: 150px;" />
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">

                <!-- Header Banner -->
                <tr>
                  <td style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 40px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 700;">Mise à jour de ta candidature</h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">

                    <p style="color: #374151; font-size: 17px; line-height: 1.7; margin: 0 0 24px;">
                      Bonjour ${data.firstName},
                    </p>

                    <p style="color: #4b5563; font-size: 16px; line-height: 1.7; margin: 0 0 24px;">
                      Merci pour l'intérêt que tu portes à Yeoskin et pour le temps que tu as consacré à ta candidature.
                    </p>

                    <p style="color: #4b5563; font-size: 16px; line-height: 1.7; margin: 0 0 24px;">
                      Après un examen attentif de ton profil, nous ne sommes malheureusement pas en mesure de retenir ta candidature pour le moment.
                    </p>

                    ${data.reason ? `
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #fef2f2; border-radius: 12px; border-left: 4px solid #ef4444; margin: 24px 0;">
                      <tr>
                        <td style="padding: 20px 24px;">
                          <p style="color: #991b1b; margin: 0 0 6px; font-size: 14px; font-weight: 600;">Motif</p>
                          <p style="color: #b91c1c; margin: 0; font-size: 15px; line-height: 1.6;">${data.reason}</p>
                        </td>
                      </tr>
                    </table>
                    ` : ''}

                    <!-- Encouragement Box -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); border-radius: 16px; margin: 30px 0;">
                      <tr>
                        <td style="padding: 28px; text-align: center;">
                          <div style="font-size: 32px; margin-bottom: 12px;">💪</div>
                          <p style="color: #9d174d; margin: 0 0 8px; font-size: 16px; font-weight: 600;">Ne te décourage pas !</p>
                          <p style="color: #be185d; margin: 0; font-size: 14px; line-height: 1.6;">
                            Tu peux recandidater dans quelques mois si ta situation évolue.<br/>
                            Continue de partager ta passion pour la K-Beauty !
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center" style="padding: 10px 0 20px;">
                          <a href="https://yeoskin.fr" style="display: inline-block; background: #f3f4f6; color: #374151; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 15px;">
                            Découvrir nos produits →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Signature -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 20px;">
                      <tr>
                        <td>
                          <p style="color: #6b7280; font-size: 15px; margin: 0;">
                            À bientôt,<br/>
                            <strong style="color: #374151;">L'équipe Yeoskin</strong>
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
