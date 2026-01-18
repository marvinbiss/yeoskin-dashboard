import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://juqlogfujiagtpvxmeux.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1cWxvZ2Z1amlhZ3RwdnhtZXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NzQzMDgsImV4cCI6MjA4MzU1MDMwOH0.u0wxmYgn9zUgwaSpvTk9IsJ5Oyn6OoYHeW6vudgapWc'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testProduction() {
  console.log('=== Testing Production Creator Login ===\n')

  // 1. Test login
  console.log('1. Testing login...')
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'emma.martin@example.com',
    password: 'Test123!'
  })

  if (loginError) {
    console.log('   ❌ Login failed:', loginError.message)
    return
  }
  console.log('   ✅ Login successful!')
  console.log('   User ID:', loginData.user.id)

  // 2. Check creator profile
  console.log('\n2. Checking creator profile...')
  const { data: creator, error: creatorError } = await supabase
    .from('creators')
    .select('id, email, discount_code, commission_rate, status, user_id')
    .eq('email', 'emma.martin@example.com')
    .single()

  if (creatorError) {
    console.log('   ❌ Creator not found:', creatorError.message)
    return
  }
  console.log('   ✅ Creator found!')
  console.log('   Creator ID:', creator.id)
  console.log('   Discount Code:', creator.discount_code)
  console.log('   Commission Rate:', (creator.commission_rate * 100) + '%')
  console.log('   Status:', creator.status)
  console.log('   Linked to auth:', creator.user_id === loginData.user.id ? '✅ Yes' : '❌ No')

  // 3. Test dashboard RPC
  console.log('\n3. Testing dashboard RPC...')
  const { data: dashboard, error: dashError } = await supabase.rpc('get_creator_dashboard')

  if (dashError) {
    console.log('   ❌ Dashboard RPC failed:', dashError.message)
  } else {
    console.log('   ✅ Dashboard data retrieved!')
    if (dashboard?.balance) {
      console.log('   Balance:', dashboard.balance)
    }
  }

  // 4. Check commissions
  console.log('\n4. Checking commissions...')
  const { data: commissions, error: commError } = await supabase
    .from('commissions')
    .select('id, commission_amount, status')
    .eq('creator_id', creator.id)

  if (commError) {
    console.log('   ❌ Commissions error:', commError.message)
  } else {
    console.log('   ✅ Found', commissions.length, 'commissions')
    commissions.forEach(c => console.log('      -', c.commission_amount, 'EUR (', c.status, ')'))
  }

  console.log('\n========================================')
  console.log('✅ Production test complete!')
  console.log('========================================')
  console.log('\nLogin URL: https://yeoskin-dashboard.vercel.app/creator/login')
  console.log('Email: emma.martin@example.com')
  console.log('Password: Test123!')
}

testProduction().catch(console.error)
