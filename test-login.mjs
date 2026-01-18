import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://juqlogfujiagtpvxmeux.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1cWxvZ2Z1amlhZ3RwdnhtZXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NzQzMDgsImV4cCI6MjA4MzU1MDMwOH0.u0wxmYgn9zUgwaSpvTk9IsJ5Oyn6OoYHeW6vudgapWc'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testLogin() {
  console.log('Testing login for emma.martin@example.com...\n')

  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'emma.martin@example.com',
    password: 'Test123!'
  })

  if (error) {
    console.log('❌ Login failed:', error.message)
    return
  }

  console.log('✅ Login successful!')
  console.log('User ID:', data.user.id)
  console.log('Email:', data.user.email)

  // Check if creator profile exists and is linked
  console.log('\nChecking creator profile...')
  const { data: creator, error: creatorError } = await supabase
    .from('creators')
    .select('id, email, discount_code, user_id')
    .eq('email', 'emma.martin@example.com')
    .single()

  if (creatorError) {
    console.log('❌ Creator not found:', creatorError.message)
    console.log('\n⚠️  You need to run the SQL to create Emma as a creator and link to auth user')
    return
  }

  console.log('Creator ID:', creator.id)
  console.log('Discount Code:', creator.discount_code)
  console.log('Linked User ID:', creator.user_id)

  if (creator.user_id === data.user.id) {
    console.log('\n✅ Creator is properly linked to auth user!')
  } else if (!creator.user_id) {
    console.log('\n⚠️  Creator exists but NOT linked to auth user')
    console.log('Run this SQL to link them:')
    console.log(`UPDATE creators SET user_id = '${data.user.id}' WHERE email = 'emma.martin@example.com';`)
  } else {
    console.log('\n⚠️  Creator is linked to a different user!')
  }
}

testLogin().catch(console.error)
