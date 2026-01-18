import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://juqlogfujiagtpvxmeux.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1cWxvZ2Z1amlhZ3RwdnhtZXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NzQzMDgsImV4cCI6MjA4MzU1MDMwOH0.u0wxmYgn9zUgwaSpvTk9IsJ5Oyn6OoYHeW6vudgapWc'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function check() {
  console.log('1. Without login (anon):')
  const { data: anon, error: anonErr } = await supabase.from('creators').select('id, email')
  console.log('   Creators:', anon?.length || 0, anonErr?.message || '')

  console.log('\n2. With login:')
  const { data: login } = await supabase.auth.signInWithPassword({
    email: 'emma.martin@example.com',
    password: 'Test123!'
  })
  console.log('   Logged in as:', login.user.id)

  const { data: auth, error: authErr } = await supabase.from('creators').select('id, email, user_id')
  console.log('   Creators:', auth?.length || 0, authErr?.message || '')
  if (auth?.length) auth.forEach(c => console.log('   ', c))

  console.log('\n3. Check get_my_creator_id():')
  const { data: myId, error: myIdErr } = await supabase.rpc('get_my_creator_id')
  console.log('   Result:', myId, myIdErr?.message || '')

  console.log('\n4. Check is_creator():')
  const { data: isCreator, error: isCreatorErr } = await supabase.rpc('is_creator')
  console.log('   Result:', isCreator, isCreatorErr?.message || '')
}

check().catch(console.error)
