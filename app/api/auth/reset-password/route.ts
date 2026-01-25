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

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  if (!email) {
    return NextResponse.json({ error: 'Email requis' }, { status: 400 })
  }

  if (!resend) {
    return NextResponse.json({ error: 'Service email non configuré' }, { status: 500 })
  }

  try {
    // Générer un lien de récupération via Supabase Admin
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: 'https://yeoskin.fr/auth/set-password',
      },
    })

    if (error) {
      console.error('[Auth] Generate link error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const recoveryLink = data.properties?.action_link
    if (!recoveryLink) {
      return NextResponse.json({ error: 'Impossible de générer le lien' }, { status: 500 })
    }

    // Envoyer l'email via Resend
    const { error: emailError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Réinitialise ton mot de passe Yeoskin',
      html: getResetPasswordEmailHtml(recoveryLink),
    })

    if (emailError) {
      console.error('[Email] Reset password email error:', emailError)
      return NextResponse.json({ error: emailError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const error = err as Error
    console.error('[Auth] Reset password exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function getResetPasswordEmailHtml(resetLink: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Réinitialisation mot de passe - Yeoskin</title>
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

                <!-- Header Banner -->
                <tr>
                  <td style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 40px; text-align: center;">
                    <div style="font-size: 40px; margin-bottom: 12px;">🔐</div>
                    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Réinitialisation de mot de passe</h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">

                    <p style="color: #4b5563; font-size: 16px; line-height: 1.7; margin: 0 0 24px;">
                      Tu as demandé à réinitialiser ton mot de passe. Clique sur le bouton ci-dessous pour en définir un nouveau :
                    </p>

                    <!-- CTA Button -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <table role="presentation" cellspacing="0" cellpadding="0">
                            <tr>
                              <td align="center" bgcolor="#ec4899" style="border-radius: 50px;">
                                <a href="${resetLink}" target="_blank" style="display: inline-block; color: #ffffff; text-decoration: none; padding: 18px 48px; font-weight: 600; font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                                  Définir mon nouveau mot de passe
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Info Box -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #fef3c7; border-radius: 12px; border-left: 4px solid #f59e0b; margin: 24px 0;">
                      <tr>
                        <td style="padding: 16px 20px;">
                          <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.6;">
                            ⏰ Ce lien expire dans 24 heures. Si tu n'as pas demandé cette réinitialisation, ignore cet email.
                          </p>
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
              <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px;">
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
