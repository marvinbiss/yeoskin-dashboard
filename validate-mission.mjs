import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://juqlogfujiagtpvxmeux.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function main() {
  console.log('=' .repeat(60))
  console.log('🔍 VALIDATION FINALE - MISSION INTERCONNEXION')
  console.log('='.repeat(60))
  console.log('')

  // Test 1: All creators have auth
  const { data: creators } = await supabase
    .from('creators')
    .select('email, user_id, discount_code')
    .order('email')

  const withAuth = creators.filter(c => c.user_id)
  const withoutAuth = creators.filter(c => !c.user_id)

  console.log('📊 TEST 1: Créateurs avec auth')
  console.log(`   Total: ${creators.length}`)
  console.log(`   ✅ Avec auth: ${withAuth.length}`)
  console.log(`   ❌ Sans auth: ${withoutAuth.length}`)
  console.log('')

  // Test 2: Ledger vs Notifications
  const { count: ledgerCount } = await supabase
    .from('financial_ledger')
    .select('*', { count: 'exact', head: true })

  const { count: notifCount } = await supabase
    .from('creator_notifications')
    .select('*', { count: 'exact', head: true })

  console.log('📊 TEST 2: Ledger & Notifications')
  console.log(`   📜 Ledger entries: ${ledgerCount}`)
  console.log(`   🔔 Notifications: ${notifCount}`)
  console.log('')

  // Test 3: Dashboard for each creator
  console.log('📊 TEST 3: Dashboard par créateur')
  for (const creator of creators) {
    const { data: dashboard, error } = await supabase
      .rpc('get_creator_dashboard', { p_creator_id: creator.user_id })

    if (error) {
      console.log(`   ❌ ${creator.email}: ${error.message}`)
    } else {
      const balance = dashboard?.balance?.current_balance || 0
      const activity = dashboard?.recent_activity?.length || 0
      console.log(`   ✅ ${creator.email}: ${balance.toFixed(2)}€, ${activity} activités`)
    }
  }
  console.log('')

  // Test 4: Commissions summary
  const { data: commissions } = await supabase
    .from('commissions')
    .select('status, commission_amount')

  const byStatus = {}
  for (const c of commissions || []) {
    byStatus[c.status] = (byStatus[c.status] || 0) + 1
  }

  console.log('📊 TEST 4: Commissions')
  console.log(`   Total: ${commissions?.length || 0}`)
  for (const [status, count] of Object.entries(byStatus)) {
    console.log(`   - ${status}: ${count}`)
  }
  console.log('')

  // Final summary
  console.log('='.repeat(60))
  console.log('📋 RÉSUMÉ MISSION')
  console.log('='.repeat(60))
  console.log(`✅ ${withAuth.length}/11 créateurs peuvent se connecter`)
  console.log(`✅ ${ledgerCount} entrées ledger`)
  console.log(`✅ ${notifCount} notifications`)
  console.log(`✅ ${commissions?.length || 0} commissions`)
  console.log('')
  console.log('🔐 Credentials pour tous les créateurs:')
  console.log('   Password: Test123!')
  console.log('')
  console.log('🌐 URL: https://yeoskin-dashboard.vercel.app/creator/login')
  console.log('='.repeat(60))
}

main()
