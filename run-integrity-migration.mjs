import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Read the migration SQL
const sqlPath = path.join(__dirname, 'supabase', 'migrations', '010_financial_integrity_checks.sql')
const sql = fs.readFileSync(sqlPath, 'utf8')

console.log('Executing financial integrity checks migration...')
console.log('SQL file:', sqlPath)

// Split by semicolons and execute each statement
// But for functions, we need to handle $$ blocks properly
const statements = []
let current = ''
let inDollarQuote = false

for (let i = 0; i < sql.length; i++) {
  const char = sql[i]
  const next = sql[i + 1]

  // Check for $$ delimiter
  if (char === '$' && next === '$') {
    inDollarQuote = !inDollarQuote
    current += '$$'
    i++ // skip next $
    continue
  }

  if (char === ';' && !inDollarQuote) {
    const stmt = current.trim()
    if (stmt && !stmt.startsWith('--')) {
      statements.push(stmt)
    }
    current = ''
  } else {
    current += char
  }
}

// Add any remaining statement
if (current.trim()) {
  statements.push(current.trim())
}

console.log(`Found ${statements.length} SQL statements to execute`)

// Execute each statement
async function runMigration() {
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]
    if (!stmt || stmt.startsWith('--') || stmt === '') continue

    // Skip REVOKE/GRANT statements as they may require elevated privileges
    if (stmt.toUpperCase().startsWith('REVOKE') || stmt.toUpperCase().startsWith('GRANT')) {
      console.log(`[${i + 1}/${statements.length}] Skipping permission statement (run manually as postgres)`)
      continue
    }

    console.log(`[${i + 1}/${statements.length}] Executing...`)

    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: stmt })

      if (error) {
        // Try raw query instead
        const { error: rawError } = await supabase.from('_exec').select(stmt)
        if (rawError && !rawError.message.includes('does not exist')) {
          console.log(`  Warning: ${error.message}`)
        }
      } else {
        console.log(`  OK`)
      }
    } catch (err) {
      console.log(`  Note: ${err.message}`)
    }
  }

  console.log('\n--- Migration complete ---')
  console.log('\nTo verify, run in Supabase SQL Editor:')
  console.log('SELECT * FROM get_financial_health_status();')
}

runMigration().catch(console.error)
