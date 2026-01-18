#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: join(__dirname, '..', '.env') })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function main() {
  console.log('🔧 Direct Update Test\n')

  // 1. Test with SERVICE ROLE (bypasses everything)
  console.log('1. UPDATE with SERVICE_ROLE...')
  const adminClient = createClient(SUPABASE_URL, SERVICE_KEY)
  const { error: e1 } = await adminClient
    .from('creator_profiles')
    .update({ bio: 'Test service role ' + Date.now() })
    .eq('slug', 'testcreator')
  console.log('   ', e1 ? `❌ ${e1.message}` : '✅ OK')

  // 2. Test with fresh authenticated client
  console.log('\n2. Fresh login + UPDATE...')
  const freshClient = createClient(SUPABASE_URL, ANON_KEY)
  const { data: auth } = await freshClient.auth.signInWithPassword({
    email: 'test.creator@yeoskin.com',
    password: 'Test123!'
  })

  if (auth?.session) {
    const { error: e2 } = await freshClient
      .from('creator_profiles')
      .update({ bio: 'Test auth ' + Date.now() })
      .eq('slug', 'testcreator')
    console.log('   ', e2 ? `❌ ${e2.message}` : '✅ OK')
  }

  // 3. Check if there's a view instead of table
  console.log('\n3. Check table type...')
  const { data, error: e3 } = await adminClient.rpc('exec_sql', {
    sql: "SELECT table_type FROM information_schema.tables WHERE table_name = 'creator_profiles'"
  })
  console.log('   Result:', data || e3?.message)

  // 4. Try raw SQL update via RPC
  console.log('\n4. Raw SQL update test...')
  const { error: e4 } = await adminClient.rpc('exec_sql', {
    sql: "UPDATE creator_profiles SET bio = 'raw test' WHERE slug = 'testcreator'"
  })
  console.log('   ', e4 ? `❌ ${e4.message}` : '✅ OK')
}

main().catch(console.error)
