#!/usr/bin/env node
/**
 * YEOSKIN - Complete Test Suite
 * Run after SQL migrations are applied
 *
 * Usage: node scripts/test-all.js
 */

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

const TEST_EMAIL = 'test.creator@yeoskin.com'
const TEST_PASSWORD = 'Test123!'

let passed = 0
let failed = 0

function test(name, success, detail = '') {
  if (success) {
    console.log(`  ✅ ${name}`, detail ? `(${detail})` : '')
    passed++
  } else {
    console.log(`  ❌ ${name}`, detail ? `(${detail})` : '')
    failed++
  }
}

async function main() {
  console.log('🧪 YEOSKIN - Complete Test Suite')
  console.log('='.repeat(50) + '\n')

  // ============================
  // TEST 1: Public Access
  // ============================
  console.log('📋 TEST 1: Public Profile Access')

  const { data: publicProfiles, error: pubErr } = await anonClient
    .from('creator_profiles')
    .select('slug, display_name, is_public')
    .eq('is_public', true)
    .eq('is_active', true)

  test('Anon can fetch public profiles', !pubErr, pubErr?.message || `${publicProfiles?.length || 0} found`)

  const { data: testPub } = await anonClient
    .from('creator_profiles')
    .select('slug')
    .eq('slug', 'testcreator')
    .single()

  test('testcreator is publicly visible', !!testPub, testPub ? 'visible' : 'hidden')

  // ============================
  // TEST 2: Creator Auth
  // ============================
  console.log('\n📋 TEST 2: Creator Authentication')

  const { data: auth, error: authErr } = await anonClient.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  })

  test('Login as test.creator', !authErr && !!auth?.user, authErr?.message || auth?.user?.id?.slice(0,8))

  if (auth?.session) {
    const authClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${auth.session.access_token}` } }
    })

    // ============================
    // TEST 3: Creator Profile Access
    // ============================
    console.log('\n📋 TEST 3: Creator Profile Access')

    const { data: ownProfile, error: ownErr } = await authClient
      .from('creator_profiles')
      .select('*')
      .eq('slug', 'testcreator')
      .single()

    test('Creator can view own profile', !ownErr && !!ownProfile, ownErr?.message)

    // ============================
    // TEST 4: Creator Profile Update
    // ============================
    console.log('\n📋 TEST 4: Creator Profile Update')

    if (ownProfile) {
      const testBio = `Test update at ${new Date().toISOString().slice(11,19)}`
      const { error: updateErr } = await authClient
        .from('creator_profiles')
        .update({ bio: testBio })
        .eq('id', ownProfile.id)

      test('Creator can update bio', !updateErr, updateErr?.message)

      // Test toggle is_public
      const { error: toggleErr } = await authClient
        .from('creator_profiles')
        .update({ is_public: !ownProfile.is_public })
        .eq('id', ownProfile.id)

      test('Creator can toggle is_public', !toggleErr, toggleErr?.message)

      // Restore original
      await authClient
        .from('creator_profiles')
        .update({ bio: ownProfile.bio, is_public: ownProfile.is_public })
        .eq('id', ownProfile.id)
    }

    // ============================
    // TEST 5: Storage Upload
    // ============================
    console.log('\n📋 TEST 5: Storage Upload')

    const testPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
      'base64'
    )
    const testFilename = `test-${Date.now()}.png`

    const { data: upload, error: uploadErr } = await authClient.storage
      .from('creator-profiles')
      .upload(`test/${testFilename}`, testPng, { contentType: 'image/png' })

    test('Upload image to storage', !uploadErr, uploadErr?.message || upload?.path)

    if (upload) {
      const { data: urlData } = authClient.storage
        .from('creator-profiles')
        .getPublicUrl(`test/${testFilename}`)

      test('Get public URL', !!urlData?.publicUrl, urlData?.publicUrl?.slice(-30))

      // Cleanup
      await authClient.storage.from('creator-profiles').remove([`test/${testFilename}`])
    }

    // ============================
    // TEST 6: Analytics Tracking
    // ============================
    console.log('\n📋 TEST 6: Analytics Tracking')

    if (ownProfile) {
      const { error: viewErr } = await anonClient
        .from('profile_views')
        .insert({
          profile_id: ownProfile.id,
          device_type: 'desktop',
          referrer: 'test-script'
        })

      test('Anon can track views', !viewErr, viewErr?.message)

      const { error: clickErr } = await anonClient
        .from('profile_clicks')
        .insert({
          profile_id: ownProfile.id,
          link_type: 'test'
        })

      test('Anon can track clicks', !clickErr, clickErr?.message)

      // Creator can see own analytics
      const { data: views, error: viewsReadErr } = await authClient
        .from('profile_views')
        .select('id')
        .eq('profile_id', ownProfile.id)
        .limit(5)

      test('Creator can read own views', !viewsReadErr, viewsReadErr?.message || `${views?.length} views`)
    }

    await anonClient.auth.signOut()
  }

  // ============================
  // SUMMARY
  // ============================
  console.log('\n' + '='.repeat(50))
  console.log(`📊 RESULTS: ${passed} passed, ${failed} failed`)
  console.log('='.repeat(50))

  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!')
    console.log('\nTest URLs:')
    console.log('  🔐 Login:  http://localhost:3009/creator/login')
    console.log('  ✏️  Editor: http://localhost:3009/creator/my-page')
    console.log('  🌐 Public: http://localhost:3009/c/testcreator')
  } else {
    console.log('\n⚠️  Some tests failed. Check RLS policies.')
  }

  process.exit(failed > 0 ? 1 : 0)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
