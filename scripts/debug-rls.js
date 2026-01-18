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
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const anonClient = createClient(SUPABASE_URL, ANON_KEY)
const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function main() {
  console.log('🔍 Debug RLS Issues\n')

  // Login as creator
  const { data: auth } = await anonClient.auth.signInWithPassword({
    email: 'test.creator@yeoskin.com',
    password: 'Test123!'
  })

  if (!auth?.session) {
    console.log('❌ Login failed')
    return
  }

  console.log('✅ Logged in as:', auth.user.email)
  console.log('   User ID:', auth.user.id)

  const authClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${auth.session.access_token}` } }
  })

  // Test 1: Can auth user access creators table?
  console.log('\n📋 Test: Access creators table')
  const { data: creator, error: creatorErr } = await authClient
    .from('creators')
    .select('id, email, user_id')
    .eq('user_id', auth.user.id)
    .single()

  if (creatorErr) {
    console.log('   ❌ Error:', creatorErr.message)
  } else {
    console.log('   ✅ Found creator:', creator.id)
  }

  // Test 2: Can auth user access creator_profiles directly by creator_id?
  console.log('\n📋 Test: Access creator_profiles by creator_id')
  if (creator) {
    const { data: profile, error: profileErr } = await authClient
      .from('creator_profiles')
      .select('id, slug, creator_id')
      .eq('creator_id', creator.id)
      .single()

    if (profileErr) {
      console.log('   ❌ Error:', profileErr.message)
    } else {
      console.log('   ✅ Found profile:', profile.slug)
    }
  }

  // Test 3: Check what the service role sees
  console.log('\n📋 Admin view: creator_profiles for this creator')
  const { data: adminProfile } = await adminClient
    .from('creator_profiles')
    .select('id, slug, creator_id')
    .eq('slug', 'testcreator')
    .single()

  if (adminProfile) {
    console.log('   Profile ID:', adminProfile.id)
    console.log('   Creator ID:', adminProfile.creator_id)
  }

  // Test 4: Check creator record
  console.log('\n📋 Admin view: creators table')
  const { data: adminCreator } = await adminClient
    .from('creators')
    .select('id, email, user_id')
    .eq('email', 'test.creator@yeoskin.com')
    .single()

  if (adminCreator) {
    console.log('   Creator ID:', adminCreator.id)
    console.log('   User ID:', adminCreator.user_id)
    console.log('   Match auth.uid?', adminCreator.user_id === auth.user.id ? '✅ YES' : '❌ NO')
  }

  // Test 5: Try a raw query via RPC if available
  console.log('\n📋 Checking if creator_id matches...')
  if (adminCreator && adminProfile) {
    console.log('   creator_profiles.creator_id:', adminProfile.creator_id)
    console.log('   creators.id:', adminCreator.id)
    console.log('   Match?', adminProfile.creator_id === adminCreator.id ? '✅ YES' : '❌ NO')
  }

  await anonClient.auth.signOut()
}

main().catch(console.error)
