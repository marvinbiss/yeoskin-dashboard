import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://juqlogfujiagtpvxmeux.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1cWxvZ2Z1amlhZ3RwdnhtZXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NzQzMDgsImV4cCI6MjA4MzU1MDMwOH0.u0wxmYgn9zUgwaSpvTk9IsJ5Oyn6OoYHeW6vudgapWc'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function check() {
  // Login
  await supabase.auth.signInWithPassword({
    email: 'emma.martin@example.com',
    password: 'Test123!'
  })

  // Raw query - no filter, no .single()
  console.log('1. All creators (no filter):')
  const { data: all, error: allErr } = await supabase.from('creators').select('*')
  console.log('   Error:', allErr?.message || 'none')
  console.log('   Count:', all?.length)
  console.log('   Data:', JSON.stringify(all, null, 2))

  // Try with email filter but no .single()
  console.log('\n2. Filter by email (no .single()):')
  const { data: byEmail, error: emailErr } = await supabase
    .from('creators')
    .select('*')
    .eq('email', 'emma.martin@example.com')
  console.log('   Error:', emailErr?.message || 'none')
  console.log('   Count:', byEmail?.length)
  console.log('   Data:', JSON.stringify(byEmail, null, 2))
}

check().catch(console.error)
