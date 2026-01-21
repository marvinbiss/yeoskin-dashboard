/**
 * SCRIPT: Créer les auth users pour tous les créateurs
 *
 * USAGE:
 * 1. Récupérer la service_role_key depuis Supabase Dashboard > Settings > API
 * 2. Exécuter: node create-auth-users.mjs
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://juqlogfujiagtpvxmeux.supabase.co'

// ⚠️ REMPLACER PAR VOTRE SERVICE_ROLE_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'REMPLACER_PAR_VOTRE_SERVICE_ROLE_KEY'

if (serviceRoleKey === 'REMPLACER_PAR_VOTRE_SERVICE_ROLE_KEY') {
  console.error('❌ Erreur: Définissez SUPABASE_SERVICE_ROLE_KEY')
  console.log('')
  console.log('Pour trouver votre service_role_key:')
  console.log('1. Allez sur https://supabase.com/dashboard/project/juqlogfujiagtpvxmeux/settings/api')
  console.log('2. Copiez "service_role" (pas anon!)')
  console.log('3. Exécutez: SUPABASE_SERVICE_ROLE_KEY=eyJ... node create-auth-users.mjs')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const DEFAULT_PASSWORD = 'Test123!'

async function main() {
  console.log('🚀 Création des auth users pour les créateurs...\n')

  // 1. Récupérer tous les créateurs sans user_id
  const { data: creators, error: fetchError } = await supabaseAdmin
    .from('creators')
    .select('id, email, user_id')
    .is('user_id', null)

  if (fetchError) {
    console.error('❌ Erreur lors de la récupération des créateurs:', fetchError)
    process.exit(1)
  }

  console.log(`📋 ${creators.length} créateurs sans auth user trouvés\n`)

  if (creators.length === 0) {
    console.log('✅ Tous les créateurs ont déjà un auth user!')
    return
  }

  // 2. Créer un auth user pour chaque créateur
  let successCount = 0
  let errorCount = 0

  for (const creator of creators) {
    console.log(`📧 Traitement: ${creator.email}`)

    // Créer l'auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: creator.email,
      password: DEFAULT_PASSWORD,
      email_confirm: true
    })

    if (authError) {
      // Si l'user existe déjà, récupérer son ID
      if (authError.message.includes('already been registered')) {
        console.log(`   ⚠️ User existe déjà, récupération de l'ID...`)

        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = existingUsers?.users?.find(u => u.email === creator.email)

        if (existingUser) {
          // Lier le user_id
          const { error: updateError } = await supabaseAdmin
            .from('creators')
            .update({ user_id: existingUser.id })
            .eq('id', creator.id)

          if (updateError) {
            console.log(`   ❌ Erreur de liaison: ${updateError.message}`)
            errorCount++
          } else {
            console.log(`   ✅ Lié à l'user existant: ${existingUser.id}`)
            successCount++
          }
        }
      } else {
        console.log(`   ❌ Erreur: ${authError.message}`)
        errorCount++
      }
      continue
    }

    // 3. Lier le user_id dans creators
    const { error: updateError } = await supabaseAdmin
      .from('creators')
      .update({ user_id: authData.user.id })
      .eq('id', creator.id)

    if (updateError) {
      console.log(`   ❌ Erreur de liaison: ${updateError.message}`)
      errorCount++
    } else {
      console.log(`   ✅ Créé et lié: ${authData.user.id}`)
      successCount++
    }
  }

  // 4. Résumé
  console.log('\n' + '='.repeat(50))
  console.log('📊 RÉSUMÉ')
  console.log('='.repeat(50))
  console.log(`✅ Succès: ${successCount}`)
  console.log(`❌ Erreurs: ${errorCount}`)
  console.log(`📧 Mot de passe pour tous: ${DEFAULT_PASSWORD}`)
  console.log('='.repeat(50))

  // 5. Vérification finale
  const { data: finalCheck } = await supabaseAdmin
    .from('creators')
    .select('email, user_id')
    .order('email')

  console.log('\n📋 État final des créateurs:')
  for (const c of finalCheck) {
    const status = c.user_id ? '✅' : '❌'
    console.log(`   ${status} ${c.email}`)
  }
}

main().catch(console.error)
