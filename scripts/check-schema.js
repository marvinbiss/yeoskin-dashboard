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
  console.log('Checking creators table schema...\n')

  // Get one row to see columns
  const { data, error } = await supabase
    .from('creators')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error:', error.message)
    return
  }

  if (data && data.length > 0) {
    console.log('Columns in creators table:')
    Object.keys(data[0]).forEach(col => console.log(`  - ${col}`))
  } else {
    console.log('No rows in creators table, checking via RPC...')
  }

  // Also check creator_profiles
  console.log('\nChecking creator_profiles table...')
  const { data: profiles, error: profileError } = await supabase
    .from('creator_profiles')
    .select('*')
    .limit(1)

  if (profileError) {
    console.error('Error:', profileError.message)
    return
  }

  if (profiles && profiles.length > 0) {
    console.log('Columns in creator_profiles table:')
    Object.keys(profiles[0]).forEach(col => console.log(`  - ${col}`))
  }

  // Check existing test creator
  console.log('\nChecking for test.creator@yeoskin.com...')
  const { data: testCreator, error: testError } = await supabase
    .from('creators')
    .select('*')
    .eq('email', 'test.creator@yeoskin.com')
    .single()

  if (testError && testError.code !== 'PGRST116') {
    console.error('Error:', testError.message)
  } else if (testCreator) {
    console.log('Found:', JSON.stringify(testCreator, null, 2))
  } else {
    console.log('Not found')
  }
}

main()
