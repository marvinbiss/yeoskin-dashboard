/**
 * Test system_health view directly
 */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const SUPABASE_URL = 'https://juqlogfujiagtpvxmeux.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  db: { schema: 'public' }
})

async function testHealth() {
  console.log('Testing system_health and creator_tiers...\n')

  // Test 1: Direct RPC call to check if view exists
  console.log('1. Test via RPC (raw SQL):')
  const { data: healthRpc, error: healthRpcError } = await supabase.rpc('get_system_health').maybeSingle()

  if (healthRpcError) {
    console.log('   RPC not available, trying raw query...')

    // Try raw SQL via postgres
    const { data: rawHealth, error: rawError } = await supabase
      .from('system_health')
      .select('*')
      .maybeSingle()

    if (rawError) {
      console.log('   Error:', rawError.message)
      console.log('   Hint:', rawError.hint || 'none')
    } else {
      console.log('   Success! Data:', rawHealth)
    }
  } else {
    console.log('   Success! Data:', healthRpc)
  }

  // Test 2: Check creator_tiers
  console.log('\n2. Test creator_tiers:')
  const { data: tiers, error: tiersError } = await supabase
    .from('creator_tiers')
    .select('*')
    .order('sort_order')

  if (tiersError) {
    console.log('   Error:', tiersError.message)

    // Check if table exists via information_schema
    console.log('\n   Checking if table exists in DB...')
  } else {
    console.log('   Success! Tiers:')
    tiers.forEach(t => {
      console.log(`   - ${t.name}: ${(t.commission_rate * 100).toFixed(0)}% (min: ${t.min_monthly_revenue}€)`)
    })
  }

  // Test 3: Check error_logs table
  console.log('\n3. Test error_logs:')
  const { data: errors, error: errorsError } = await supabase
    .from('error_logs')
    .select('*')
    .limit(5)

  if (errorsError) {
    console.log('   Error:', errorsError.message)
  } else {
    console.log(`   Success! ${errors.length} error logs found`)
  }

  // Test 4: Check payout_batch_items
  console.log('\n4. Test payout_batch_items:')
  const { data: payoutItems, error: payoutError } = await supabase
    .from('payout_batch_items')
    .select('*')
    .limit(5)

  if (payoutError) {
    console.log('   Error:', payoutError.message)
  } else {
    console.log(`   Success! ${payoutItems.length} payout items found`)
  }

  console.log('\n---')
  console.log('Note: Si les tables/vues ne sont pas trouvées dans le cache,')
  console.log('va dans Supabase Dashboard > Settings > API > "Reload Schema"')
}

testHealth().catch(console.error)
