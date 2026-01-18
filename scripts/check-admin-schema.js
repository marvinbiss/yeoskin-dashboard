#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: join(__dirname, '..', '.env') })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  console.log('Checking admin_profiles schema...\n')

  const { data, error } = await supabase
    .from('admin_profiles')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error:', error.message)
    console.log('\nTrying to get table info via RPC...')
  }

  if (data && data.length > 0) {
    console.log('Columns in admin_profiles:')
    Object.keys(data[0]).forEach(col => console.log(`  - ${col}: ${typeof data[0][col]}`))
  } else {
    console.log('No rows or table might not exist')
  }

  // Also list all tables
  console.log('\nListing tables that contain "admin" or "profile":')
}

main()
