/**
 * Script to run SQL in Supabase
 * Uses pg module with direct PostgreSQL connection
 */
import { config } from 'dotenv'
import { readFileSync } from 'fs'
import pg from 'pg'

config({ path: '.env.local' })

const { Client } = pg

// Supabase connection - use the session pooler
const SUPABASE_PROJECT = 'juqlogfujiagtpvxmeux'
const DB_PASSWORD = 'Lovemusic59;' // Your Supabase database password

async function runSQL() {
  // Try transaction pooler first (port 6543)
  const connectionString = `postgresql://postgres.${SUPABASE_PROJECT}:${DB_PASSWORD}@aws-0-eu-west-3.pooler.supabase.com:6543/postgres`

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })

  try {
    console.log('Connecting to Supabase PostgreSQL...')
    await client.connect()
    console.log('Connected!\n')

    // Read SQL file
    const sql = readFileSync('sql-to-run.sql', 'utf8')

    console.log('Executing SQL...\n')
    console.log('---SQL Preview---')
    console.log(sql.substring(0, 500) + '...\n')
    console.log('-----------------\n')

    const result = await client.query(sql)
    console.log('SQL executed successfully!')

    if (Array.isArray(result)) {
      result.forEach((r, i) => {
        if (r.rows && r.rows.length > 0) {
          console.log(`Result ${i + 1}:`, r.rows)
        }
      })
    } else if (result.rows && result.rows.length > 0) {
      console.log('Result:', result.rows)
    }

  } catch (error) {
    console.error('Error:', error.message)

    if (error.message.includes('password')) {
      console.log('\nNote: You may need to update the DB_PASSWORD in this script.')
      console.log('Find it in: Supabase Dashboard > Settings > Database > Connection string')
    }
  } finally {
    await client.end()
    console.log('\nConnection closed.')
  }
}

runSQL()
