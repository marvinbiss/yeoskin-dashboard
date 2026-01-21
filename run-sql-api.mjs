/**
 * Execute SQL via Supabase Management API
 */
import { config } from 'dotenv'
import { readFileSync } from 'fs'

config({ path: '.env.local' })

const PROJECT_REF = 'juqlogfujiagtpvxmeux'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// The Management API requires a different token (access token from dashboard)
// But we can use the pg_graphql or postgres REST endpoints

async function testConnection() {
  // Test if we can connect via REST API
  const url = `https://${PROJECT_REF}.supabase.co/rest/v1/creators?select=id&limit=1`

  console.log('Testing Supabase connection...')

  const response = await fetch(url, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    }
  })

  if (response.ok) {
    console.log('Connection OK! API is working.\n')
    return true
  } else {
    console.log('Connection failed:', response.status, await response.text())
    return false
  }
}

async function checkExistingTables() {
  // Check if tables already exist
  const tables = ['payout_batch_items', 'creator_tiers', 'creator_tier_history']

  console.log('Checking existing tables...')

  for (const table of tables) {
    const url = `https://${PROJECT_REF}.supabase.co/rest/v1/${table}?select=id&limit=1`
    const response = await fetch(url, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      }
    })

    if (response.ok) {
      console.log(`  ✓ ${table} exists`)
    } else if (response.status === 404) {
      console.log(`  ✗ ${table} does not exist (needs to be created)`)
    } else {
      console.log(`  ? ${table}: ${response.status}`)
    }
  }

  console.log('')
}

async function main() {
  const connected = await testConnection()
  if (!connected) {
    console.log('Cannot connect to Supabase. Check your service role key.')
    return
  }

  await checkExistingTables()

  console.log('='.repeat(60))
  console.log('To execute the SQL, please:')
  console.log('1. Open: https://supabase.com/dashboard/project/juqlogfujiagtpvxmeux/sql/new')
  console.log('2. Paste the contents of sql-to-run.sql')
  console.log('3. Click "Run"')
  console.log('='.repeat(60))
  console.log('\nAlternatively, copy this SQL and paste in the SQL Editor:\n')

  const sql = readFileSync('sql-to-run.sql', 'utf8')
  console.log(sql)
}

main().catch(console.error)
