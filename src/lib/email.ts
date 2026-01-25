/**
 * Email Service using Resend
 * Handles all transactional emails for Yeoskin
 */

import { Resend } from 'resend'

// Initialize Resend client
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

// Email sender configuration
const FROM_EMAIL = process.env.EMAIL_FROM || 'Yeoskin <creators@yeoskin.com>'
const REPLY_TO = process.env.EMAIL_REPLY_TO || 'creators@yeoskin.com'

// Types
interface EmailResult {
  success: boolean
  id?: string
  error?: string
}

interface ApplicationEmailData {
  to: string
  firstName: string
  lastName: string
  applicationId: string
  autoApproved: boolean
  totalFollowers: number
  tierName?: string
}

/**
 * Send application confirmation email
 */
export async function sendApplicationConfirmation(data: ApplicationEmailData): Promise<EmailResult> {
  if (!resend) {
    console.warn('[Email] Resend not configured, skipping email')
    return { success: true, id: 'skipped' }
  }

  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      replyTo: REPLY_TO,
      subject: data.autoApproved
        ? '🎉 Bienvenue chez Yeoskin !'
        : '✅ Candidature reçue - Yeoskin',
      html: data.autoApproved
        ? getAutoApprovedEmailHtml(data)
        : getPendingEmailHtml(data),
    })

    if (error) {
      console.error('[Email] Failed to send confirmation:', error)
      return { success: false, error: error.message }
    }

    console.info('[Email] Confirmation sent:', result?.id)
    return { success: true, id: result?.id }
  } catch (err) {
    const error = err as Error
    console.error('[Email] Error sending confirmation:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send application approval email
 */
export async function sendApprovalEmail(data: {
  to: string
  firstName: string
  tierName: string
  commissionRate: number
  discountCode: string
}): Promise<EmailResult> {
  if (!resend) {
    console.warn('[Email] Resend not configured, skipping email')
    return { success: true, id: 'skipped' }
  }

  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      replyTo: REPLY_TO,
      subject: '🎉 Ta candidature Yeoskin a été approuvée !',
      html: getApprovalEmailHtml(data),
    })

    if (error) {
      console.error('[Email] Failed to send approval:', error)
      return { success: false, error: error.message }
    }

    return { success: true, id: result?.id }
  } catch (err) {
    const error = err as Error
    console.error('[Email] Error sending approval:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send application rejection email
 */
export async function sendRejectionEmail(data: {
  to: string
  firstName: string
  reason?: string
}): Promise<EmailResult> {
  if (!resend) {
    console.warn('[Email] Resend not configured, skipping email')
    return { success: true, id: 'skipped' }
  }

  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      replyTo: REPLY_TO,
      subject: 'Mise à jour de ta candidature Yeoskin',
      html: getRejectionEmailHtml(data),
    })

    if (error) {
      console.error('[Email] Failed to send rejection:', error)
      return { success: false, error: error.message }
    }

    return { success: true, id: result?.id }
  } catch (err) {
    const error = err as Error
    console.error('[Email] Error sending rejection:', error)
    return { success: false, error: error.message }
  }
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

function getAutoApprovedEmailHtml(data: ApplicationEmailData): string {
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

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <img src="https://yeoskin.fr/logo.png" alt="Yeoskin" width="150" style="display: block;" />
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">

                <!-- Hero -->
                <tr>
                  <td style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #6366f1 100%); padding: 50px 40px; text-align: center;">
                    <div style="font-size: 60px; margin-bottom: 16px;">🎉</div>
                    <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">Bienvenue ${data.firstName} !</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0; font-size: 18px;">Tu es officiellement créateur Yeoskin</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">

                    <!-- Auto-approval badge -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 16px; margin-bottom: 30px;">
                      <tr>
                        <td style="padding: 24px; text-align: center;">
                          <div style="display: inline-block; background: #059669; color: white; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Auto-approuvé</div>
                          <p style="color: #065f46; margin: 0; font-size: 16px; line-height: 1.6;">
                            Grâce à ton audience de <strong>${data.totalFollowers.toLocaleString()} followers</strong>,<br/>
                            tu rejoins directement le tier <strong>${data.tierName || 'Silver'}</strong> !
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Steps -->
                    <h2 style="color: #111827; font-size: 20px; margin: 0 0 20px; text-align: center;">Prochaines étapes</h2>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                      <tr>
                        <td style="padding: 16px; background: #fdf2f8; border-radius: 12px; margin-bottom: 8px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                            <tr>
                              <td width="40" style="vertical-align: top;">
                                <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #ec4899, #8b5cf6); border-radius: 50%; text-align: center; line-height: 32px; color: white; font-weight: bold;">1</div>
                              </td>
                              <td style="padding-left: 12px;">
                                <p style="margin: 0; color: #374151; font-weight: 600;">Configure ton mot de passe</p>
                                <p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">Un email de configuration va arriver</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr><td style="height: 8px;"></td></tr>
                      <tr>
                        <td style="padding: 16px; background: #fdf2f8; border-radius: 12px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                            <tr>
                              <td width="40" style="vertical-align: top;">
                                <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #ec4899, #8b5cf6); border-radius: 50%; text-align: center; line-height: 32px; color: white; font-weight: bold;">2</div>
                              </td>
                              <td style="padding-left: 12px;">
                                <p style="margin: 0; color: #374151; font-weight: 600;">Complète ton profil</p>
                                <p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">Ajoute ta bio, photo et réseaux sociaux</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr><td style="height: 8px;"></td></tr>
                      <tr>
                        <td style="padding: 16px; background: #fdf2f8; border-radius: 12px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                            <tr>
                              <td width="40" style="vertical-align: top;">
                                <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #ec4899, #8b5cf6); border-radius: 50%; text-align: center; line-height: 32px; color: white; font-weight: bold;">3</div>
                              </td>
                              <td style="padding-left: 12px;">
                                <p style="margin: 0; color: #374151; font-weight: 600;">Partage et gagne</p>
                                <p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">Utilise ton code promo et touche tes commissions</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center" style="padding: 10px 0 20px;">
                          <table role="presentation" cellspacing="0" cellpadding="0">
                            <tr>
                              <td align="center" bgcolor="#ec4899" style="border-radius: 50px;">
                                <a href="https://yeoskin.fr/dashboard" target="_blank" style="display: inline-block; color: #ffffff; text-decoration: none; padding: 18px 48px; font-weight: 600; font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                            Accéder à mon dashboard →
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <p style="color: #9ca3af; font-size: 14px; text-align: center; margin: 20px 0 0;">
                      Des questions ? Réponds simplement à cet email.
                    </p>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 40px 20px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 20px;">
                <tr>
                  <td style="padding: 0 8px;"><a href="https://instagram.com/yeoskin" style="display: inline-block; width: 36px; height: 36px; background: #e5e7eb; border-radius: 50%; text-align: center; line-height: 36px;"><img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="Instagram" width="18" style="vertical-align: middle;" /></a></td>
                  <td style="padding: 0 8px;"><a href="https://tiktok.com/@yeoskin" style="display: inline-block; width: 36px; height: 36px; background: #e5e7eb; border-radius: 50%; text-align: center; line-height: 36px;"><img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" alt="TikTok" width="18" style="vertical-align: middle;" /></a></td>
                  <td style="padding: 0 8px;"><a href="https://yeoskin.fr" style="display: inline-block; width: 36px; height: 36px; background: #e5e7eb; border-radius: 50%; text-align: center; line-height: 36px;"><img src="https://cdn-icons-png.flaticon.com/512/1006/1006771.png" alt="Website" width="18" style="vertical-align: middle;" /></a></td>
                </tr>
              </table>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Yeoskin. Tous droits réservés.</p>
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

function getPendingEmailHtml(data: ApplicationEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Candidature reçue - Yeoskin</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fdf2f8; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fdf2f8;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <img src="https://yeoskin.fr/logo.png" alt="Yeoskin" width="150" style="display: block;" />
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">

                <!-- Hero -->
                <tr>
                  <td style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #6366f1 100%); padding: 50px 40px; text-align: center;">
                    <div style="font-size: 60px; margin-bottom: 16px;">✨</div>
                    <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">Merci ${data.firstName} !</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0; font-size: 18px;">Ta candidature a bien été reçue</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">

                    <p style="color: #4b5563; font-size: 16px; line-height: 1.7; margin: 0 0 30px; text-align: center;">
                      Nous sommes ravis de ton intérêt pour rejoindre la communauté créateurs Yeoskin !
                    </p>

                    <!-- Status Card -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 16px; margin-bottom: 30px;">
                      <tr>
                        <td style="padding: 28px; text-align: center;">
                          <div style="font-size: 40px; margin-bottom: 12px;">⏳</div>
                          <p style="color: #92400e; margin: 0 0 8px; font-size: 18px; font-weight: 700;">En cours d'examen</p>
                          <p style="color: #a16207; margin: 0; font-size: 14px; line-height: 1.6;">
                            Notre équipe examine ta candidature.<br/>
                            Tu recevras une réponse sous <strong>48-72h</strong>.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Application ID -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f9fafb; border-radius: 12px; margin-bottom: 30px;">
                      <tr>
                        <td style="padding: 16px 20px; text-align: center;">
                          <p style="margin: 0; color: #6b7280; font-size: 13px;">
                            Référence de candidature : <code style="background: #e5e7eb; padding: 4px 10px; border-radius: 6px; font-family: 'SF Mono', Monaco, monospace; color: #374151; font-size: 12px;">${data.applicationId.slice(0, 8).toUpperCase()}</code>
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- What to do -->
                    <h2 style="color: #111827; font-size: 18px; margin: 0 0 20px; text-align: center;">En attendant...</h2>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                      <tr>
                        <td style="padding: 14px 16px; background: #fdf2f8; border-radius: 12px; margin-bottom: 8px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                            <tr>
                              <td width="36" style="vertical-align: middle;">
                                <span style="font-size: 20px;">📸</span>
                              </td>
                              <td style="padding-left: 8px;">
                                <a href="https://instagram.com/yeoskin.fr" style="color: #be185d; text-decoration: none; font-weight: 500;">Suis-nous sur Instagram</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr><td style="height: 8px;"></td></tr>
                      <tr>
                        <td style="padding: 14px 16px; background: #fdf2f8; border-radius: 12px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                            <tr>
                              <td width="36" style="vertical-align: middle;">
                                <span style="font-size: 20px;">🛍️</span>
                              </td>
                              <td style="padding-left: 8px;">
                                <a href="https://yeoskin.fr" style="color: #be185d; text-decoration: none; font-weight: 500;">Découvre nos produits K-Beauty</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr><td style="height: 8px;"></td></tr>
                      <tr>
                        <td style="padding: 14px 16px; background: #fdf2f8; border-radius: 12px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                            <tr>
                              <td width="36" style="vertical-align: middle;">
                                <span style="font-size: 20px;">💡</span>
                              </td>
                              <td style="padding-left: 8px;">
                                <span style="color: #374151; font-weight: 500;">Prépare tes idées de contenu K-Beauty</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <p style="color: #9ca3af; font-size: 14px; text-align: center; margin: 0;">
                      Des questions ? Réponds simplement à cet email.
                    </p>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 40px 20px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 20px;">
                <tr>
                  <td style="padding: 0 8px;"><a href="https://instagram.com/yeoskin.fr" style="display: inline-block; width: 36px; height: 36px; background: #e5e7eb; border-radius: 50%; text-align: center; line-height: 36px;"><img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="Instagram" width="18" style="vertical-align: middle;" /></a></td>
                  <td style="padding: 0 8px;"><a href="https://tiktok.com/@yeoskin.fr" style="display: inline-block; width: 36px; height: 36px; background: #e5e7eb; border-radius: 50%; text-align: center; line-height: 36px;"><img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" alt="TikTok" width="18" style="vertical-align: middle;" /></a></td>
                  <td style="padding: 0 8px;"><a href="https://yeoskin.fr" style="display: inline-block; width: 36px; height: 36px; background: #e5e7eb; border-radius: 50%; text-align: center; line-height: 36px;"><img src="https://cdn-icons-png.flaticon.com/512/1006/1006771.png" alt="Website" width="18" style="vertical-align: middle;" /></a></td>
                </tr>
              </table>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Yeoskin. Tous droits réservés.</p>
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

function getApprovalEmailHtml(data: {
  firstName: string
  tierName: string
  commissionRate: number
  discountCode: string
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

              <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; padding: 24px; margin: 20px 0; text-align: center;">
                <p style="margin: 0 0 12px; color: #065f46; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Ton tier</p>
                <p style="margin: 0 0 8px; color: #047857; font-size: 32px; font-weight: bold;">${data.tierName}</p>
                <p style="margin: 0; color: #059669; font-size: 18px;">${(data.commissionRate * 100).toFixed(0)}% de commission</p>
              </div>

              <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
                <p style="margin: 0 0 8px; color: #92400e; font-size: 14px;">Ton code promo unique</p>
                <p style="margin: 0; color: #78350f; font-size: 24px; font-weight: bold; font-family: monospace;">${data.discountCode}</p>
              </div>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center" bgcolor="#ec4899" style="border-radius: 50px;">
                          <a href="https://yeoskin.fr/dashboard" target="_blank" style="display: inline-block; color: #ffffff; text-decoration: none; padding: 14px 32px; font-weight: 600; font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                  Accéder à mon dashboard →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

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
