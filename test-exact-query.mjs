import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://juqlogfujiagtpvxmeux.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1cWxvZ2Z1amlhZ3RwdnhtZXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NzQzMDgsImV4cCI6MjA4MzU1MDMwOH0.u0wxmYgn9zUgwaSpvTk9IsJ5Oyn6OoYHeW6vudgapWc'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  const { data: login } = await supabase.auth.signInWithPassword({
    email: 'emma.martin@example.com',
    password: 'Test123!'
  })

  const authUser = login.user
  console.log('User ID:', authUser.id)
  console.log('Email:', authUser.email)

  // Test exact query from CreatorAuthContext
  console.log('\nTesting exact app query:')
  console.log(`Query: .or('user_id.eq.${authUser.id},email.ilike.${authUser.email}')`)

  const { data, error } = await supabase
    .from('creators')
    .select('id, email, discount_code, commission_rate, status, user_id')
    .or(`user_id.eq.${authUser.id},email.ilike.${authUser.email}`)
    .limit(1)
    .single()

  console.log('Error:', error?.message || 'none')
  console.log('Data:', data)
}

test().catch(console.error)
