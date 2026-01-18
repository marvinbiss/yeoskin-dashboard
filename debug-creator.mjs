import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://juqlogfujiagtpvxmeux.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1cWxvZ2Z1amlhZ3RwdnhtZXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NzQzMDgsImV4cCI6MjA4MzU1MDMwOH0.u0wxmYgn9zUgwaSpvTk9IsJ5Oyn6OoYHeW6vudgapWc'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debug() {
  // Login
  const { data: login } = await supabase.auth.signInWithPassword({
    email: 'emma.martin@example.com',
    password: 'Test123!'
  })
  console.log('Logged in as:', login.user.id)
  console.log('Email:', login.user.email)

  // Test 1: Query by user_id (no .single())
  console.log('\n1. Query by user_id:')
  const { data: byUserId, error: e1 } = await supabase
    .from('creators')
    .select('*')
    .eq('user_id', login.user.id)
  console.log('   Error:', e1?.message || 'none')
  console.log('   Results:', byUserId?.length || 0)
  if (byUserId?.length) console.log('   Data:', byUserId)

  // Test 2: Query by email (no .single())
  console.log('\n2. Query by email:')
  const { data: byEmail, error: e2 } = await supabase
    .from('creators')
    .select('*')
    .eq('email', 'emma.martin@example.com')
  console.log('   Error:', e2?.message || 'none')
  console.log('   Results:', byEmail?.length || 0)
  if (byEmail?.length) console.log('   Data:', byEmail)

  // Test 3: Get all creators (check RLS)
  console.log('\n3. All creators (RLS test):')
  const { data: all, error: e3 } = await supabase
    .from('creators')
    .select('id, email, user_id')
  console.log('   Error:', e3?.message || 'none')
  console.log('   Results:', all?.length || 0)
  if (all?.length) all.forEach(c => console.log('   -', c.email, '| user_id:', c.user_id))

  // Test 4: Check auth.uid() via RPC
  console.log('\n4. Check if get_my_creator_id exists:')
  const { data: myId, error: e4 } = await supabase.rpc('get_my_creator_id')
  console.log('   Result:', myId, '| Error:', e4?.message || 'none')
}

debug().catch(console.error)
