/**
 * Script to run SQL in Supabase
 * Uses the Supabase REST API with service role key
 */
require('dotenv').config({ path: '.env.local' })
const fs = require('fs')

const SUPABASE_URL = 'https://juqlogfujiagtpvxmeux.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

// Read SQL file
const sql = fs.readFileSync('sql-to-run.sql', 'utf8')

// Split SQL into individual statements (simple split by semicolon)
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'))

async function runSQL() {
  console.log('Running SQL statements in Supabase...\n')

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]
    if (!stmt || stmt.startsWith('--')) continue

    // Skip comments-only statements
    const lines = stmt.split('\n').filter(l => !l.trim().startsWith('--') && l.trim().length > 0)
    if (lines.length === 0) continue

    const preview = lines[0].substring(0, 60) + (lines[0].length > 60 ? '...' : '')
    console.log(`[${i + 1}/${statements.length}] ${preview}`)

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ query: stmt + ';' })
      })

      if (!response.ok) {
        // Try alternative approach - direct query
        const text = await response.text()
        if (text.includes('function') || text.includes('404')) {
          // exec_sql function doesn't exist, need to use pg module
          throw new Error('exec_sql function not available')
        }
        throw new Error(`HTTP ${response.status}: ${text}`)
      }

      console.log('   OK')
    } catch (error) {
      console.log(`   Error: ${error.message}`)
      // Continue with next statement
    }
  }

  console.log('\nDone!')
}

// Alternative: Use pg module directly
async function runSQLWithPg() {
  const { Client } = require('pg')

  // Supabase connection string format
  const connectionString = `postgresql://postgres.juqlogfujiagtpvxmeux:${process.env.SUPABASE_DB_PASSWORD || 'Lovemusic59;'}@aws-0-eu-west-3.pooler.supabase.com:6543/postgres`

  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('Connected to Supabase PostgreSQL\n')

    // Read and execute SQL
    const sql = fs.readFileSync('sql-to-run.sql', 'utf8')

    console.log('Executing SQL...\n')
    const result = await client.query(sql)
    console.log('SQL executed successfully!')
    console.log('Result:', result)

  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await client.end()
  }
}

// Try pg module first (more reliable for DDL)
runSQLWithPg().catch(() => {
  console.log('\nFallback: Trying REST API...\n')
  runSQL()
})
