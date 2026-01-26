/**
 * Script pour envoyer l'invitation à un créateur
 * Usage: node send-invite.mjs email@example.com
 */

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import dotenv from 'dotenv'

// Charger .env.local en priorité
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const email = process.argv[2] || 'marvin.bissohong@yeoskin.com'

console.log(`\n📧 Envoi de l'invitation à: ${email}\n`)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.EMAIL_FROM || 'Yeoskin <creators@yeoskin.com>'
const REPLY_TO = process.env.EMAIL_REPLY_TO || 'creators@yeoskin.com'

async function main() {
  // 1. Récupérer les infos du créateur
  console.log('1. Récupération des infos du créateur...')
  const { data: creator, error: creatorError } = await supabase
    .from('creators')
    .select(`
      *,
      commission_tiers (
        name,
        commission_rate
      )
    `)
    .eq('email', email.toLowerCase())
    .maybeSingle()

  if (creatorError || !creator) {
    console.error('❌ Créateur non trouvé:', creatorError?.message || 'Email inconnu')
    process.exit(1)
  }

  console.log(`   ✓ Créateur trouvé: ${creator.first_name} ${creator.last_name || ''}`)
  console.log(`   - Status: ${creator.status}`)
  console.log(`   - Tier: ${creator.commission_tiers?.name || 'N/A'}`)
  console.log(`   - Code: ${creator.discount_code}`)

  if (creator.status !== 'active') {
    console.error('❌ Le créateur doit être actif pour recevoir l\'invitation')
    process.exit(1)
  }

  // 2. Générer le lien d'invitation
  console.log('\n2. Génération du lien d\'invitation...')

  let passwordSetupLink = null
  let userId = creator.user_id

  if (creator.user_id) {
    // User existe, utiliser magic link
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: 'https://yeoskin.fr/auth/set-password',
      },
    })

    if (error) {
      console.error('❌ Erreur génération magic link:', error.message)
      process.exit(1)
    }

    passwordSetupLink = data.properties.action_link
    console.log('   ✓ Magic link généré (user existant)')
  } else {
    // User n'existe pas, créer invitation
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'invite',
      email,
      options: {
        redirectTo: 'https://yeoskin.fr/auth/set-password',
      },
    })

    if (error) {
      console.error('❌ Erreur génération invite:', error.message)
      process.exit(1)
    }

    passwordSetupLink = data.properties.action_link
    userId = data.user.id

    // Lier le user au créateur
    await supabase
      .from('creators')
      .update({ user_id: data.user.id })
      .eq('id', creator.id)

    console.log('   ✓ Invitation générée et user lié')
  }

  // 3. Envoyer l'email
  console.log('\n3. Envoi de l\'email de bienvenue...')

  const { data: emailResult, error: emailError } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    replyTo: REPLY_TO,
    subject: '🎉 Bienvenue chez Yeoskin - Configure ton mot de passe !',
    html: getWelcomeEmailHtml({
      firstName: creator.first_name,
      tierName: creator.commission_tiers?.name,
      commissionRate: creator.commission_tiers?.commission_rate,
      discountCode: creator.discount_code,
      passwordSetupLink,
    }),
  })

  if (emailError) {
    console.error('❌ Erreur envoi email:', emailError.message)
    process.exit(1)
  }

  console.log(`   ✓ Email envoyé! ID: ${emailResult.id}`)
  console.log('\n✅ Invitation envoyée avec succès!')
  console.log(`   Le créateur peut maintenant configurer son mot de passe.\n`)
}

// Template email
function getWelcomeEmailHtml(data) {
  const tierColors = {
    'Bronze': { bg: '#fef3e2', text: '#92400e', accent: '#cd7f32' },
    'Silver': { bg: '#f3f4f6', text: '#374151', accent: '#9ca3af' },
    'Gold': { bg: '#fef9c3', text: '#854d0e', accent: '#eab308' },
  }
  const tier = tierColors[data.tierName] || tierColors['Bronze']

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Bienvenue chez Yeoskin</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fdf2f8;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fdf2f8;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">

          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <img src="https://yeoskin.fr/logo.png" alt="Yeoskin" width="150" />
            </td>
          </tr>

          <tr>
            <td>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

                <tr>
                  <td style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #6366f1 100%); padding: 50px 40px; text-align: center;">
                    <div style="font-size: 60px; margin-bottom: 16px;">🎉</div>
                    <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">Bienvenue ${data.firstName} !</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0; font-size: 18px;">Tu fais partie de l'équipe Yeoskin</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 40px;">

                    <p style="color: #4b5563; font-size: 16px; line-height: 1.7; margin: 0 0 30px; text-align: center;">
                      Bienvenue dans le programme créateur Yeoskin ! Tu fais maintenant partie d'une communauté passionnée de K-Beauty.
                    </p>

                    ${data.tierName ? `
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: ${tier.bg}; border-radius: 16px; margin-bottom: 24px; border: 2px solid ${tier.accent};">
                      <tr>
                        <td style="padding: 30px; text-align: center;">
                          <div style="display: inline-block; background: ${tier.accent}; color: white; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase;">Ton niveau</div>
                          <h2 style="color: ${tier.text}; margin: 12px 0 8px; font-size: 36px; font-weight: 800;">${data.tierName}</h2>
                          ${data.commissionRate ? `<p style="color: ${tier.text}; margin: 0; font-size: 20px; font-weight: 600;">${Math.round(data.commissionRate * 100)}% de commission</p>` : ''}
                        </td>
                      </tr>
                    </table>
                    ` : ''}

                    ${data.discountCode ? `
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 16px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 30px; text-align: center;">
                          <p style="color: #92400e; margin: 0 0 12px; font-size: 14px; font-weight: 500;">Ton code promo exclusif</p>
                          <div style="background: white; display: inline-block; padding: 16px 32px; border-radius: 12px; border: 2px dashed #d97706;">
                            <span style="color: #b45309; font-size: 28px; font-weight: 800; font-family: monospace;">${data.discountCode}</span>
                          </div>
                          <p style="color: #a16207; margin: 16px 0 0; font-size: 13px;">Ce code sera automatiquement appliqué sur ta page créateur</p>
                          <p style="color: #92400e; margin: 10px 0 0; font-size: 12px;">Tu pourras personnaliser l'URL de ta page dans ton dashboard (ex: yeoskin.fr/c/tonnom)</p>
                        </td>
                      </tr>
                    </table>
                    ` : ''}

                    ${data.passwordSetupLink ? `
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 16px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 30px; text-align: center;">
                          <div style="font-size: 40px; margin-bottom: 12px;">🔐</div>
                          <h3 style="color: #065f46; margin: 0 0 12px; font-size: 20px; font-weight: 700;">Configure ton mot de passe</h3>
                          <p style="color: #047857; margin: 0 0 20px; font-size: 14px; line-height: 1.6;">
                            Clique sur le bouton ci-dessous pour créer ton mot de passe et accéder à ton espace créateur.
                          </p>
                          <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                            <tr>
                              <td align="center" bgcolor="#059669" style="border-radius: 50px;">
                                <a href="${data.passwordSetupLink}" target="_blank" style="display: inline-block; color: #ffffff; text-decoration: none; padding: 16px 40px; font-weight: 600; font-size: 16px;">
                                  Créer mon mot de passe
                                </a>
                              </td>
                            </tr>
                          </table>
                          <p style="color: #6b7280; margin: 16px 0 0; font-size: 12px;">Ce lien expire dans 24 heures</p>
                        </td>
                      </tr>
                    </table>
                    ` : ''}

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center" style="padding: 10px 0 30px;">
                          <p style="color: #6b7280; margin: 0 0 12px; font-size: 14px;">Une fois ton mot de passe créé :</p>
                          <table role="presentation" cellspacing="0" cellpadding="0">
                            <tr>
                              <td align="center" bgcolor="#ec4899" style="border-radius: 50px;">
                                <a href="https://yeoskin.fr/c/creator" target="_blank" style="display: inline-block; color: #ffffff; text-decoration: none; padding: 18px 48px; font-weight: 600; font-size: 16px;">
                                  Accéder à mon dashboard
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

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

          <tr>
            <td style="padding: 40px 20px; text-align: center;">
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

main().catch(console.error)
