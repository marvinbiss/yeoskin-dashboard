/**
 * Test script to verify generated data
 */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const SUPABASE_URL = 'https://juqlogfujiagtpvxmeux.supabase.co'
// Use service role key for full access
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function testData() {
  console.log('=' .repeat(60))
  console.log('VERIFICATION DES DONNEES YEOSKIN')
  console.log('='.repeat(60))
  console.log('')

  // 1. Test creators with tiers
  console.log('1. CREATEURS ET TIERS')
  console.log('-'.repeat(40))

  const { data: creators, error: creatorsError } = await supabase
    .from('creators')
    .select('id, email, discount_code, commission_rate, status')
    .order('email')

  if (creatorsError) {
    console.log('Erreur creators:', creatorsError.message)
  } else {
    console.log(`Total createurs: ${creators.length}`)
    console.log('')
    for (const c of creators) {
      // Get commission count for this creator
      const { count } = await supabase
        .from('commissions')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', c.id)

      const rate = ((c.commission_rate || 0.15) * 100).toFixed(0)
      console.log(`  ${c.email}`)
      console.log(`    Code: ${c.discount_code} | Taux: ${rate}% | Status: ${c.status} | Commissions: ${count || 0}`)
    }
  }
  console.log('')

  // 2. Test commissions
  console.log('2. COMMISSIONS')
  console.log('-'.repeat(40))

  const { data: commissions, error: commissionsError } = await supabase
    .from('commissions')
    .select('id, creator_id, order_total, commission_amount, status, created_at')
    .order('created_at', { ascending: false })
    .limit(20)

  if (commissionsError) {
    console.log('Erreur commissions:', commissionsError.message)
  } else {
    console.log(`Total commissions (affichees): ${commissions.length}`)

    // Count by status
    const { data: statusCount } = await supabase
      .from('commissions')
      .select('status')

    const statusCounts = {}
    statusCount?.forEach(c => {
      statusCounts[c.status] = (statusCounts[c.status] || 0) + 1
    })

    console.log('Par statut:')
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`)
    })
  }
  console.log('')

  // 3. Test financial ledger
  console.log('3. FINANCIAL LEDGER')
  console.log('-'.repeat(40))

  const { data: ledger, error: ledgerError } = await supabase
    .from('financial_ledger')
    .select('id, creator_id, transaction_type, amount, balance_after, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  if (ledgerError) {
    console.log('Erreur ledger:', ledgerError.message)
  } else {
    console.log(`Dernieres entrees: ${ledger.length}`)
    ledger.slice(0, 5).forEach(l => {
      console.log(`  ${l.transaction_type}: ${l.amount}€ (balance: ${l.balance_after}€)`)
    })
  }
  console.log('')

  // 4. Test system health
  console.log('4. SYSTEM HEALTH')
  console.log('-'.repeat(40))

  const { data: health, error: healthError } = await supabase
    .from('system_health')
    .select('*')
    .single()

  if (healthError) {
    console.log('Erreur system_health:', healthError.message)
  } else {
    console.log(`Status global: ${health.overall_status}`)
    console.log(`Erreurs critiques: ${health.critical_errors}`)
    console.log(`Erreurs (24h): ${health.errors_24h}`)
    console.log(`Paiements echoues: ${health.failed_payouts}`)
    console.log(`Paiements bloques: ${health.stuck_payouts}`)
    console.log(`Createurs sans IBAN: ${health.creators_without_iban}`)
  }
  console.log('')

  // 5. Test creator tiers
  console.log('5. TIERS CONFIGURES')
  console.log('-'.repeat(40))

  const { data: tiers, error: tiersError } = await supabase
    .from('creator_tiers')
    .select('*')
    .order('sort_order')

  if (tiersError) {
    console.log('Erreur tiers:', tiersError.message)
  } else {
    tiers.forEach(t => {
      console.log(`  ${t.name}: ${(t.commission_rate * 100).toFixed(0)}% (min: ${t.min_monthly_revenue}€)`)
    })
  }
  console.log('')

  // 6. Summary per creator
  console.log('6. RESUME PAR CREATEUR')
  console.log('-'.repeat(40))

  for (const creator of creators || []) {
    const { data: creatorCommissions } = await supabase
      .from('commissions')
      .select('commission_amount, status')
      .eq('creator_id', creator.id)

    const total = creatorCommissions?.reduce((sum, c) => sum + Number(c.commission_amount || 0), 0) || 0
    const count = creatorCommissions?.length || 0

    if (count > 0) {
      console.log(`  ${creator.email}: ${count} commissions, ${total.toFixed(2)}€ total`)
    }
  }
  console.log('')

  console.log('='.repeat(60))
  console.log('VERIFICATION TERMINEE')
  console.log('='.repeat(60))
}

testData().catch(console.error)
