#!/usr/bin/env node
/**
 * YEOSKIN - Setup Test Creator Script
 * Creates auth user and links to creator record
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: join(__dirname, '..', '.env') })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const TEST_EMAIL = 'test.creator@yeoskin.com'
const TEST_PASSWORD = 'Test123!'

async function main() {
  console.log('🚀 YEOSKIN - Setup Test Creator')
  console.log('================================\n')

  try {
    // Step 1: Check if creator exists
    console.log('1️⃣  Checking creator...')
    let { data: creator, error: creatorError } = await supabase
      .from('creators')
      .select('id, email, user_id, status')
      .eq('email', TEST_EMAIL)
      .single()

    if (creatorError && creatorError.code !== 'PGRST116') {
      throw new Error(`Failed to check creator: ${creatorError.message}`)
    }

    if (!creator) {
      console.log('   Creator not found, creating...')
      const { data: newCreator, error: insertError } = await supabase
        .from('creators')
        .insert({
          email: TEST_EMAIL,
          discount_code: 'TESTCREATOR10',
          commission_rate: 0.10,
          status: 'active'
        })
        .select()
        .single()

      if (insertError) throw new Error(`Failed to create creator: ${insertError.message}`)
      creator = newCreator
      console.log('   ✅ Creator created:', creator.id)
    } else {
      console.log('   ✅ Creator exists:', creator.id)
    }

    // Step 2: Check/Create Auth User
    console.log('\n2️⃣  Checking auth user...')

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) throw new Error(`Failed to list users: ${listError.message}`)

    let authUser = users.find(u => u.email === TEST_EMAIL)

    if (!authUser) {
      console.log('   Auth user not found, creating...')
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        email_confirm: true
      })

      if (createError) throw new Error(`Failed to create auth user: ${createError.message}`)
      authUser = newUser.user
      console.log('   ✅ Auth user created:', authUser.id)
    } else {
      console.log('   ✅ Auth user exists:', authUser.id)
    }

    // Step 3: Link user_id if not already linked
    if (creator.user_id !== authUser.id) {
      console.log('\n3️⃣  Linking user_id to creator...')
      const { error: updateError } = await supabase
        .from('creators')
        .update({ user_id: authUser.id })
        .eq('id', creator.id)

      if (updateError) throw new Error(`Failed to link user: ${updateError.message}`)
      console.log('   ✅ Creator linked to user_id:', authUser.id)
    } else {
      console.log('\n3️⃣  User already linked:', creator.user_id)
    }

    // Step 4: Check/Create creator_profiles
    console.log('\n4️⃣  Checking creator profile...')

    const { data: profile, error: profileError } = await supabase
      .from('creator_profiles')
      .select('*')
      .eq('creator_id', creator.id)
      .single()

    if (profileError && profileError.code === 'PGRST116') {
      console.log('   Profile not found, creating...')
      const { data: newProfile, error: createProfileError } = await supabase
        .from('creator_profiles')
        .insert({
          creator_id: creator.id,
          slug: 'testcreator',
          display_name: 'Marie Test',
          bio: 'Passionnée de beauté coréenne - Compte test',
          brand_color: '#FF69B4',
          is_active: true,
          is_public: false
        })
        .select()
        .single()

      if (createProfileError) throw new Error(`Failed to create profile: ${createProfileError.message}`)
      console.log('   ✅ Profile created with slug:', newProfile.slug)
    } else if (profileError) {
      throw new Error(`Failed to check profile: ${profileError.message}`)
    } else {
      console.log('   ✅ Profile exists with slug:', profile.slug)
      // Update slug to testcreator if different
      if (profile.slug !== 'testcreator') {
        await supabase
          .from('creator_profiles')
          .update({ slug: 'testcreator' })
          .eq('id', profile.id)
        console.log('   ✅ Slug updated to: testcreator')
      }
    }

    // Step 5: Check storage bucket
    console.log('\n5️⃣  Checking storage bucket...')
    const { data: buckets } = await supabase.storage.listBuckets()
    const creatorBucket = buckets?.find(b => b.id === 'creator-profiles')
    if (creatorBucket) {
      console.log('   ✅ Bucket "creator-profiles" exists (public:', creatorBucket.public, ')')
    } else {
      console.log('   ⚠️  Bucket not found - run SQL migration')
    }

    // Summary
    console.log('\n================================')
    console.log('✅ SETUP COMPLETE!')
    console.log('================================\n')
    console.log('Test credentials:')
    console.log(`  Email:    ${TEST_EMAIL}`)
    console.log(`  Password: ${TEST_PASSWORD}`)
    console.log('')
    console.log('Test URLs:')
    console.log('  Login:    http://localhost:3009/creator/login')
    console.log('  My Page:  http://localhost:3009/creator/my-page')
    console.log('  Public:   http://localhost:3009/c/testcreator')

  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
    process.exit(1)
  }
}

main()
