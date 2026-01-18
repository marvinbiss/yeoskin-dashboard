import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://juqlogfujiagtpvxmeux.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1cWxvZ2Z1amlhZ3RwdnhtZXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NzQzMDgsImV4cCI6MjA4MzU1MDMwOH0.u0wxmYgn9zUgwaSpvTk9IsJ5Oyn6OoYHeW6vudgapWc'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createEmma() {
  console.log('Creating Emma via signup API...\n')

  const { data, error } = await supabase.auth.signUp({
    email: 'emma.martin@example.com',
    password: 'Test123!',
    options: {
      data: {
        full_name: 'Emma Martin'
      }
    }
  })

  if (error) {
    console.log('❌ Signup failed:', error.message)
    return
  }

  console.log('✅ Emma created successfully!')
  console.log('User ID:', data.user.id)
  console.log('Email:', data.user.email)
  console.log('Confirmed:', data.user.confirmed_at ? 'Yes' : 'No (check email settings)')

  // Now test login
  console.log('\nTesting login...')
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'emma.martin@example.com',
    password: 'Test123!'
  })

  if (loginError) {
    console.log('❌ Login failed:', loginError.message)
  } else {
    console.log('✅ Login successful!')
    console.log('\n========================================')
    console.log('Emma is ready! Credentials:')
    console.log('Email: emma.martin@example.com')
    console.log('Password: Test123!')
    console.log('========================================')
  }
}

createEmma().catch(console.error)
