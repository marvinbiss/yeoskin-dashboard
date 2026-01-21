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
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fdf2f8;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Header -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); border-radius: 16px 16px 0 0; padding: 40px 30px; text-align: center;">
          <tr>
            <td>
              <div style="width: 60px; height: 60px; background: white; border-radius: 12px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 24px; font-weight: bold; color: #ec4899;">Y</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Bienvenue ${data.firstName} ! 🎉</h1>
            </td>
          </tr>
        </table>

        <!-- Content -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px;">
          <tr>
            <td>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Félicitations ! Ta candidature a été <strong style="color: #059669;">automatiquement approuvée</strong> grâce à ton audience de ${data.totalFollowers.toLocaleString()} followers.
              </p>

              <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0 0 8px; color: #065f46; font-weight: 600;">✨ Tu fais maintenant partie du tier ${data.tierName || 'Silver'}</p>
                <p style="margin: 0; color: #047857; font-size: 14px;">Profite de tes avantages exclusifs dès maintenant !</p>
              </div>

              <h2 style="color: #111827; font-size: 18px; margin: 30px 0 16px;">Prochaines étapes</h2>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                    <span style="color: #ec4899; font-weight: bold; margin-right: 12px;">1.</span>
                    <span style="color: #374151;">Connecte-toi à ton dashboard créateur</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                    <span style="color: #ec4899; font-weight: bold; margin-right: 12px;">2.</span>
                    <span style="color: #374151;">Configure ton profil public</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                    <span style="color: #ec4899; font-weight: bold; margin-right: 12px;">3.</span>
                    <span style="color: #374151;">Ajoute tes informations bancaires</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <span style="color: #ec4899; font-weight: bold; margin-right: 12px;">4.</span>
                    <span style="color: #374151;">Commence à partager et gagner !</span>
                  </td>
                </tr>
              </table>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://dashboard.yeoskin.com" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 16px;">
                  Accéder à mon dashboard →
                </a>
              </div>

              <p style="color: #6b7280; font-size: 14px; margin: 30px 0 0; text-align: center;">
                Des questions ? Réponds simplement à cet email.
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

function getPendingEmailHtml(data: ApplicationEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Candidature reçue - Yeoskin</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fdf2f8;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Header -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); border-radius: 16px 16px 0 0; padding: 40px 30px; text-align: center;">
          <tr>
            <td>
              <div style="width: 60px; height: 60px; background: white; border-radius: 12px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 24px; font-weight: bold; color: #ec4899;">Y</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Merci ${data.firstName} ! ✅</h1>
            </td>
          </tr>
        </table>

        <!-- Content -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px;">
          <tr>
            <td>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Nous avons bien reçu ta candidature pour rejoindre le programme créateur Yeoskin.
              </p>

              <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <p style="margin: 0 0 8px; color: #92400e; font-weight: 600;">⏳ En cours d'examen</p>
                <p style="margin: 0; color: #a16207; font-size: 14px;">Notre équipe va examiner ta candidature sous 48-72h.</p>
              </div>

              <div style="background: #f9fafb; border-radius: 12px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                  <strong>ID de candidature :</strong> <code style="background: #e5e7eb; padding: 2px 8px; border-radius: 4px; font-family: monospace;">${data.applicationId}</code>
                </p>
              </div>

              <h2 style="color: #111827; font-size: 18px; margin: 30px 0 16px;">En attendant...</h2>

              <ul style="color: #374151; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0;">
                <li>Suis-nous sur <a href="https://instagram.com/yeoskin" style="color: #ec4899;">Instagram</a> pour les dernières news</li>
                <li>Découvre nos produits sur <a href="https://yeoskin.com" style="color: #ec4899;">yeoskin.com</a></li>
                <li>Prépare ton contenu K-Beauty !</li>
              </ul>

              <p style="color: #6b7280; font-size: 14px; margin: 30px 0 0; text-align: center;">
                Des questions ? Réponds simplement à cet email.
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

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://dashboard.yeoskin.com" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 16px;">
                  Accéder à mon dashboard →
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
