import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://juqlogfujiagtpvxmeux.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1cWxvZ2Z1amlhZ3RwdnhtZXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NzQzMDgsImV4cCI6MjA4MzU1MDMwOH0.u0wxmYgn9zUgwaSpvTk9IsJ5Oyn6OoYHeW6vudgapWc'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debug() {
  // Check if there are any custom functions that might be failing
  console.log('Checking for potential issues...\n')

  // Test basic database access
  const { data: creators, error: creatorsErr } = await supabase
    .from('creators')
    .select('id, email')
    .limit(5)

  console.log('1. Creators in database:')
  if (creatorsErr) {
    console.log('   Error:', creatorsErr.message)
  } else {
    console.log('   Count:', creators.length)
    creators.forEach(c => console.log('   -', c.email))
  }

  // Check if link_creator_to_user function exists
  console.log('\n2. Testing RPC functions...')
  const { data: rpcTest, error: rpcErr } = await supabase.rpc('get_my_creator_id')
  if (rpcErr) {
    console.log('   get_my_creator_id:', rpcErr.message)
  } else {
    console.log('   get_my_creator_id: OK (returned', rpcTest, ')')
  }

  // Try a simpler signup with different email
  console.log('\n3. Testing signup with different email...')
  const testEmail = `test${Date.now()}@test.local`
  const { data: signupData, error: signupErr } = await supabase.auth.signUp({
    email: testEmail,
    password: 'TestPass123!'
  })
  if (signupErr) {
    console.log('   Signup error:', signupErr.message)
    console.log('   This confirms auth.users INSERT is blocked')
  } else {
    console.log('   Signup OK! User:', signupData.user?.id)
  }
}

debug().catch(console.error)
