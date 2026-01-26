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

// POST: Resend welcome email with password setup link
export async function POST(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { email } = await req.json()

  if (!email) {
    return NextResponse.json({ error: 'Email requis' }, { status: 400 })
  }

  // Get creator info from database
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
    return NextResponse.json({ error: 'Créateur non trouvé' }, { status: 404 })
  }

  if (creator.status !== 'active') {
    return NextResponse.json({ error: 'Le créateur doit être actif pour recevoir l\'invitation' }, { status: 400 })
  }

  let passwordSetupLink: string | null = null
  let userId: string | null = creator.user_id

  // Generate invite or magic link
  try {
    // Check if user already exists in auth
    if (creator.user_id) {
      // User exists, use magic link
      const { data, error } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: {
          redirectTo: 'https://yeoskin.fr/auth/set-password',
        },
      })

      if (error) {
        console.error('[Auth] Magic link error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      passwordSetupLink = data.properties.action_link
    } else {
      // User doesn't exist, create invite
      const { data, error } = await supabase.auth.admin.generateLink({
        type: 'invite',
        email,
        options: {
          redirectTo: 'https://yeoskin.fr/auth/set-password',
        },
      })

      if (error) {
        console.error('[Auth] Invite error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      passwordSetupLink = data.properties.action_link
      userId = data.user.id

      // Link user to creator
      await supabase
        .from('creators')
        .update({ user_id: data.user.id })
        .eq('id', creator.id)
    }
  } catch (err) {
    const error = err as Error
    console.error('[Auth] Link generation exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Send welcome email
  if (!resend) {
    return NextResponse.json({ error: 'Service email non configuré' }, { status: 500 })
  }

  try {
    const { data, error } = await resend.emails.send({
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

    if (error) {
      console.error('[Email] Welcome email error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.info('[Email] Welcome email resent to:', email, 'emailId:', data?.id)

    return NextResponse.json({
      success: true,
      message: 'Email de bienvenue renvoyé',
      userId,
    })
  } catch (err) {
    const error = err as Error
    console.error('[Email] Exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Email template (same as approve-application)
function getWelcomeEmailHtml(data: {
  firstName: string
  tierName?: string
  commissionRate?: number
  discountCode?: string
  passwordSetupLink?: string | null
}): string {
  const tierColors: Record<string, { bg: string; text: string; accent: string }> = {
    'Bronze': { bg: '#fef3e2', text: '#92400e', accent: '#cd7f32' },
    'Silver': { bg: '#f3f4f6', text: '#374151', accent: '#9ca3af' },
    'Gold': { bg: '#fef9c3', text: '#854d0e', accent: '#eab308' },
  }
  const tier = tierColors[data.tierName || ''] || tierColors['Bronze']

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
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
              <img src="https://cdn.shopify.com/s/files/1/0870/9573/8716/files/Copie_de_LogoOK_1.png?v=1742078138" alt="Yeoskin" width="150" style="display: block; max-width: 150px;" />
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
                    <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">Bienvenue ${data.firstName} !</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0; font-size: 18px; font-weight: 400;">Tu fais partie de l'équipe Yeoskin</p>
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
                          <p style="color: #a16207; margin: 16px 0 0; font-size: 13px;">Ce code sera automatiquement appliqué sur ta page créateur</p>
                          <p style="color: #92400e; margin: 10px 0 0; font-size: 12px;">Tu pourras personnaliser l'URL de ta page dans ton dashboard (ex: yeoskin.fr/c/tonnom)</p>
                        </td>
                      </tr>
                    </table>
                    ` : ''}

                    <!-- Password Setup CTA -->
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
                                <a href="${data.passwordSetupLink}" target="_blank" style="display: inline-block; color: #ffffff; text-decoration: none; padding: 16px 40px; font-weight: 600; font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
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

                    <!-- Secondary CTA - Dashboard -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center" style="padding: 10px 0 30px;">
                          <p style="color: #6b7280; margin: 0 0 12px; font-size: 14px;">Une fois ton mot de passe créé :</p>
                          <table role="presentation" cellspacing="0" cellpadding="0">
                            <tr>
                              <td align="center" bgcolor="#ec4899" style="border-radius: 50px;">
                                <a href="https://yeoskin.fr/c/creator" target="_blank" style="display: inline-block; color: #ffffff; text-decoration: none; padding: 18px 48px; font-weight: 600; font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                                  Accéder à mon dashboard
                                </a>
                              </td>
                            </tr>
                          </table>
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
                Tu reçois cet email car tu fais partie du programme créateur Yeoskin.
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
