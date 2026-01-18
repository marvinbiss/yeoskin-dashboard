import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://juqlogfujiagtpvxmeux.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1cWxvZ2Z1amlhZ3RwdnhtZXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NzQzMDgsImV4cCI6MjA4MzU1MDMwOH0.u0wxmYgn9zUgwaSpvTk9IsJ5Oyn6OoYHeW6vudgapWc'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function check() {
  // Login first
  await supabase.auth.signInWithPassword({
    email: 'emma.martin@example.com',
    password: 'Test123!'
  })

  // Check all creators
  const { data: creators, error } = await supabase
    .from('creators')
    .select('*')

  console.log('Creators in database:')
  if (error) {
    console.log('Error:', error.message)
  } else {
    console.log('Count:', creators.length)
    creators.forEach(c => console.log(c))
  }

  // Check RLS function
  const { data: myId } = await supabase.rpc('get_my_creator_id')
  console.log('\nget_my_creator_id():', myId)
}

check().catch(console.error)
