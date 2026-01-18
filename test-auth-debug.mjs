import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://juqlogfujiagtpvxmeux.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1cWxvZ2Z1amlhZ3RwdnhtZXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NzQzMDgsImV4cCI6MjA4MzU1MDMwOH0.u0wxmYgn9zUgwaSpvTk9IsJ5Oyn6OoYHeW6vudgapWc'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugAuth() {
  // Test 1: Check if we can reach Supabase
  console.log('1. Testing Supabase connection...')
  const { data: healthData, error: healthError } = await supabase.from('creators').select('count').limit(1)
  if (healthError) {
    console.log('   ❌ Cannot reach database:', healthError.message)
  } else {
    console.log('   ✅ Database reachable')
  }

  // Test 2: Try signup with a new test user
  console.log('\n2. Testing signup with new user...')
  const testEmail = `test${Date.now()}@example.com`
  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email: testEmail,
    password: 'Test123!'
  })
  if (signupError) {
    console.log('   ❌ Signup failed:', signupError.message)
  } else {
    console.log('   ✅ Signup works, user created:', signupData.user?.id)
  }

  // Test 3: Try login with emma
  console.log('\n3. Testing login emma.martin@example.com / Test123!...')
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'emma.martin@example.com',
    password: 'Test123!'
  })
  if (loginError) {
    console.log('   ❌ Login failed:', loginError.message)
    console.log('   Error code:', loginError.status)
  } else {
    console.log('   ✅ Login success:', loginData.user?.id)
  }

  // Test 4: Check auth settings
  console.log('\n4. Checking if email provider is enabled...')
  const { data: session } = await supabase.auth.getSession()
  console.log('   Current session:', session?.session ? 'Active' : 'None')

  // Test 5: Try password recovery to verify email exists
  console.log('\n5. Testing if emma email exists (password recovery)...')
  const { error: recoveryError } = await supabase.auth.resetPasswordForEmail('emma.martin@example.com')
  if (recoveryError) {
    console.log('   ❌ Recovery failed:', recoveryError.message)
  } else {
    console.log('   ✅ Recovery email sent (email exists in system)')
  }
}

debugAuth().catch(console.error)
