import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Load .env.local
config({ path: '.env.local' })

const supabaseUrl = 'https://juqlogfujiagtpvxmeux.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceRoleKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not found in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function main() {
  console.log('=== EXECUTING WORLD-CLASS SQL ===\n')

  // Read SQL file
  const sqlFile = process.argv[2] || 'supabase-world-class.sql'
  const sql = fs.readFileSync(sqlFile, 'utf8')

  // Extract key statements to execute
  const keyStatements = [
    // Create tables
    `CREATE TABLE IF NOT EXISTS payout_batches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      executed_at TIMESTAMPTZ,
      total_amount DECIMAL(10,2) DEFAULT 0,
      total_fees DECIMAL(10,2) DEFAULT 0,
      item_count INT DEFAULT 0,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'partial')),
      n8n_execution_id TEXT,
      wise_batch_id TEXT,
      created_by UUID,
      notes TEXT
    )`,

    `CREATE TABLE IF NOT EXISTS payout_batch_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      batch_id UUID REFERENCES payout_batches(id) ON DELETE CASCADE,
      creator_id UUID REFERENCES creators(id),
      amount DECIMAL(10,2) NOT NULL,
      fee_amount DECIMAL(10,2) DEFAULT 0,
      net_amount DECIMAL(10,2),
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
      wise_transfer_id TEXT,
      wise_transfer_reference TEXT,
      wise_transfer_status TEXT,
      error_message TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      processed_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ
    )`,

    `CREATE TABLE IF NOT EXISTS creator_tiers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL UNIQUE,
      min_monthly_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
      commission_rate DECIMAL(4,3) NOT NULL DEFAULT 0.15,
      badge_color TEXT DEFAULT '#CD7F32',
      badge_icon TEXT DEFAULT 'bronze',
      benefits TEXT[] DEFAULT ARRAY[]::TEXT[],
      sort_order INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS creator_tier_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
      tier_id UUID REFERENCES creator_tiers(id),
      started_at TIMESTAMPTZ DEFAULT NOW(),
      ended_at TIMESTAMPTZ,
      monthly_revenue DECIMAL(10,2) DEFAULT 0
    )`,
  ]

  // Execute table creation
  console.log('Creating tables...')
  for (const stmt of keyStatements) {
    const { error } = await supabase.rpc('exec_sql', { sql_query: stmt }).catch(() => ({ error: null }))
    if (error) {
      // Try alternative - tables might already exist
      console.log('  Table may already exist, continuing...')
    }
  }

  // Check tables exist
  console.log('\nVerifying tables...')

  const { data: batches, error: e1 } = await supabase.from('payout_batches').select('id').limit(1)
  console.log('  payout_batches:', e1 ? 'ERROR: ' + e1.message : 'OK')

  const { data: items, error: e2 } = await supabase.from('payout_batch_items').select('id').limit(1)
  console.log('  payout_batch_items:', e2 ? 'ERROR: ' + e2.message : 'OK')

  const { data: tiers, error: e3 } = await supabase.from('creator_tiers').select('*').limit(10)
  console.log('  creator_tiers:', e3 ? 'ERROR: ' + e3.message : `OK (${tiers?.length || 0} tiers)`)

  // Insert default tiers if empty
  if (!e3 && (!tiers || tiers.length === 0)) {
    console.log('\nInserting default tiers...')
    const { error: insertErr } = await supabase.from('creator_tiers').insert([
      { name: 'Bronze', min_monthly_revenue: 0, commission_rate: 0.15, badge_color: '#CD7F32', badge_icon: 'bronze', benefits: ['Taux de base 15%', 'Support standard'], sort_order: 1 },
      { name: 'Silver', min_monthly_revenue: 500, commission_rate: 0.17, badge_color: '#C0C0C0', badge_icon: 'silver', benefits: ['Taux 17%', 'Support prioritaire'], sort_order: 2 },
      { name: 'Gold', min_monthly_revenue: 1500, commission_rate: 0.20, badge_color: '#FFD700', badge_icon: 'gold', benefits: ['Taux 20%', 'Support VIP'], sort_order: 3 },
      { name: 'Platinum', min_monthly_revenue: 3000, commission_rate: 0.25, badge_color: '#E5E4E2', badge_icon: 'platinum', benefits: ['Taux 25%', 'Account manager dedie'], sort_order: 4 },
    ])
    console.log('  Tiers inserted:', insertErr ? 'ERROR: ' + insertErr.message : 'OK')
  }

  // List final tiers
  const { data: finalTiers } = await supabase.from('creator_tiers').select('name, min_monthly_revenue, commission_rate').order('sort_order')
  if (finalTiers) {
    console.log('\nTiers disponibles:')
    finalTiers.forEach(t => {
      console.log(`  ${t.name}: ${t.min_monthly_revenue}€+ → ${(t.commission_rate * 100).toFixed(0)}%`)
    })
  }

  console.log('\n=== SQL EXECUTION COMPLETE ===')
}

main().catch(console.error)
