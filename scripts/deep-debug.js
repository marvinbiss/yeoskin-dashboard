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

const anonClient = createClient(SUPABASE_URL, ANON_KEY)

async function main() {
  console.log('🔍 Deep Debug\n')

  // Login
  const { data: auth } = await anonClient.auth.signInWithPassword({
    email: 'test.creator@yeoskin.com',
    password: 'Test123!'
  })

  if (!auth?.session) {
    console.log('❌ Login failed')
    return
  }

  const authClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${auth.session.access_token}` } }
  })

  // Test 1: Simple SELECT
  console.log('1. SELECT creator_profiles...')
  const { data: p1, error: e1 } = await authClient
    .from('creator_profiles')
    .select('id, bio')
    .eq('slug', 'testcreator')
    .single()
  console.log('   ', e1 ? `❌ ${e1.message}` : `✅ id=${p1.id}`)

  // Test 2: UPDATE without trigger
  if (p1) {
    console.log('2. UPDATE creator_profiles...')
    const { error: e2 } = await authClient
      .from('creator_profiles')
      .update({ bio: 'test' })
      .eq('id', p1.id)
    console.log('   ', e2 ? `❌ ${e2.message}` : '✅ OK')
  }

  // Test 3: INSERT profile_views as ANON
  console.log('3. INSERT profile_views as ANON...')
  await anonClient.auth.signOut()

  const { error: e3 } = await anonClient
    .from('profile_views')
    .insert({ profile_id: p1?.id, device_type: 'test' })
  console.log('   ', e3 ? `❌ ${e3.message}` : '✅ OK')

  // Test 4: Check profile_views columns
  console.log('4. Check profile_views schema...')
  const { data: views } = await anonClient
    .from('profile_views')
    .select('*')
    .limit(0)
  console.log('   Schema check done')

  // Test 5: Check profile_clicks columns
  console.log('5. Check profile_clicks schema...')
  const { data: clicks, error: e5 } = await anonClient
    .from('profile_clicks')
    .select('*')
    .limit(0)
  console.log('   ', e5 ? `❌ ${e5.message}` : '✅ OK')
}

main().catch(console.error)
