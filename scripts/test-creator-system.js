#!/usr/bin/env node
/**
 * YEOSKIN - Test Creator System
 * Automated tests for creator profiles, RLS, storage
 *
 * Usage: node scripts/test-creator-system.js
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env
config({ path: join(__dirname, '..', '.env') })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

// Public client (anon key) - simulates frontend
const anonClient = createClient(SUPABASE_URL, ANON_KEY)

// Admin client (if available)
const adminClient = SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null

const TEST_EMAIL = 'test.creator@yeoskin.com'
const TEST_PASSWORD = 'Test123!'

let passed = 0
let failed = 0

function logTest(name, success, details = '') {
  if (success) {
    console.log(`  ✅ ${name}`, details ? `- ${details}` : '')
    passed++
  } else {
    console.log(`  ❌ ${name}`, details ? `- ${details}` : '')
    failed++
  }
}

async function main() {
  console.log('🧪 YEOSKIN - Creator System Tests')
  console.log('==================================\n')

  // ============================================
  // TEST 1: Public Profile Access (RLS)
  // ============================================
  console.log('📋 Test 1: Public Profile Access (RLS)')

  // 1a. Public profiles should be visible
  const { data: publicProfiles, error: publicError } = await anonClient
    .from('creator_profiles')
    .select('slug, display_name, is_public, is_active')
    .eq('is_public', true)
    .eq('is_active', true)

  logTest(
    'Fetch public profiles',
    !publicError,
    publicError ? publicError.message : `Found ${publicProfiles?.length || 0} public profiles`
  )

  // 1b. Private profiles should NOT be visible to anon
  const { data: allProfiles, error: allError } = await anonClient
    .from('creator_profiles')
    .select('slug, is_public')

  const privateVisible = allProfiles?.filter(p => !p.is_public) || []
  logTest(
    'Private profiles hidden from anon',
    privateVisible.length === 0,
    privateVisible.length > 0 ? `${privateVisible.length} private profiles leaked!` : 'OK'
  )

  // 1c. Check testcreator profile
  const { data: testProfile, error: testError } = await anonClient
    .from('creator_profiles')
    .select('*')
    .eq('slug', 'testcreator')
    .single()

  // testcreator is_public=false, so should NOT be visible to anon
  logTest(
    'testcreator (private) hidden from anon',
    testError?.code === 'PGRST116' || !testProfile,
    testProfile ? 'LEAKED - profile is visible!' : 'Correctly hidden'
  )

  // ============================================
  // TEST 2: Authenticated Creator Access
  // ============================================
  console.log('\n📋 Test 2: Authenticated Creator Access')

  // Login as test creator
  const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  })

  logTest(
    'Login as test.creator',
    !authError && authData?.user,
    authError ? authError.message : `User ID: ${authData?.user?.id?.slice(0, 8)}...`
  )

  if (authData?.user) {
    // Create authenticated client
    const authClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`
        }
      }
    })

    // 2a. Creator can see their own profile
    const { data: ownProfile, error: ownError } = await authClient
      .from('creator_profiles')
      .select('*')
      .eq('slug', 'testcreator')
      .single()

    logTest(
      'Creator can view own profile',
      !ownError && ownProfile,
      ownError ? ownError.message : `slug: ${ownProfile?.slug}`
    )

    // 2b. Creator can update their profile
    if (ownProfile) {
      const newBio = `Test bio updated at ${new Date().toISOString()}`
      const { data: updated, error: updateError } = await authClient
        .from('creator_profiles')
        .update({ bio: newBio })
        .eq('id', ownProfile.id)
        .select()
        .single()

      logTest(
        'Creator can update own profile',
        !updateError && updated?.bio === newBio,
        updateError ? updateError.message : 'Bio updated'
      )

      // Revert bio
      await authClient
        .from('creator_profiles')
        .update({ bio: 'Passionnée de beauté coréenne - Compte test' })
        .eq('id', ownProfile.id)
    }

    // 2c. Test is_public toggle
    if (ownProfile) {
      const originalPublic = ownProfile.is_public

      // Toggle to public
      const { error: toggleError } = await authClient
        .from('creator_profiles')
        .update({ is_public: true })
        .eq('id', ownProfile.id)

      logTest(
        'Creator can toggle is_public',
        !toggleError,
        toggleError ? toggleError.message : 'Toggled to public'
      )

      // Now check if anon can see it
      const { data: nowPublic } = await anonClient
        .from('creator_profiles')
        .select('slug')
        .eq('slug', 'testcreator')
        .single()

      logTest(
        'Public profile now visible to anon',
        !!nowPublic,
        nowPublic ? 'Visible!' : 'Still hidden'
      )

      // Revert to original
      await authClient
        .from('creator_profiles')
        .update({ is_public: originalPublic })
        .eq('id', ownProfile.id)
    }

    // Sign out
    await anonClient.auth.signOut()
  }

  // ============================================
  // TEST 3: Storage Bucket
  // ============================================
  console.log('\n📋 Test 3: Storage Bucket')

  // 3a. Check bucket exists
  if (adminClient) {
    const { data: buckets } = await adminClient.storage.listBuckets()
    const bucket = buckets?.find(b => b.id === 'creator-profiles')

    logTest(
      'Bucket "creator-profiles" exists',
      !!bucket,
      bucket ? `public: ${bucket.public}` : 'Not found'
    )

    // 3b. Test upload (requires auth)
    const { data: authData2 } = await anonClient.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    })

    if (authData2?.session) {
      const authClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: {
          headers: {
            Authorization: `Bearer ${authData2.session.access_token}`
          }
        }
      })

      // Create a test image (1x1 red PNG)
      const testPng = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
        'base64'
      )

      const testFilename = `test-${Date.now()}.png`
      const { data: uploadData, error: uploadError } = await authClient.storage
        .from('creator-profiles')
        .upload(`test/${testFilename}`, testPng, {
          contentType: 'image/png'
        })

      logTest(
        'Authenticated user can upload',
        !uploadError,
        uploadError ? uploadError.message : `Uploaded: ${uploadData?.path}`
      )

      // 3c. Get public URL
      if (uploadData) {
        const { data: urlData } = authClient.storage
          .from('creator-profiles')
          .getPublicUrl(`test/${testFilename}`)

        logTest(
          'Can get public URL',
          !!urlData?.publicUrl,
          urlData?.publicUrl?.slice(0, 50) + '...'
        )

        // Cleanup - delete test file
        await authClient.storage.from('creator-profiles').remove([`test/${testFilename}`])
      }

      await anonClient.auth.signOut()
    }
  } else {
    console.log('  ⚠️  Skipping storage tests (no SERVICE_ROLE_KEY)')
  }

  // ============================================
  // TEST 4: Analytics Tables
  // ============================================
  console.log('\n📋 Test 4: Analytics (Views/Clicks)')

  // 4a. Insert view (should work for anon)
  const { data: profiles } = await anonClient
    .from('creator_profiles')
    .select('id')
    .eq('is_public', true)
    .limit(1)
    .single()

  if (profiles?.id) {
    const { error: viewError } = await anonClient
      .from('profile_views')
      .insert({
        profile_id: profiles.id,
        device_type: 'desktop',
        referrer: 'test-script'
      })

    logTest(
      'Anon can insert profile_views',
      !viewError,
      viewError ? viewError.message : 'View tracked'
    )

    // 4b. Insert click
    const { error: clickError } = await anonClient
      .from('profile_clicks')
      .insert({
        profile_id: profiles.id,
        link_type: 'test'
      })

    logTest(
      'Anon can insert profile_clicks',
      !clickError,
      clickError ? clickError.message : 'Click tracked'
    )
  } else {
    console.log('  ⚠️  No public profiles to test analytics')
  }

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n==================================')
  console.log(`📊 Results: ${passed} passed, ${failed} failed`)
  console.log('==================================\n')

  process.exit(failed > 0 ? 1 : 0)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
