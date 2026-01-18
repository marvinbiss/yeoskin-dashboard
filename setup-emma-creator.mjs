import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://juqlogfujiagtpvxmeux.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1cWxvZ2Z1amlhZ3RwdnhtZXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NzQzMDgsImV4cCI6MjA4MzU1MDMwOH0.u0wxmYgn9zUgwaSpvTk9IsJ5Oyn6OoYHeW6vudgapWc'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function setupEmmaCreator() {
  // Get Emma's auth user ID
  const { data: loginData } = await supabase.auth.signInWithPassword({
    email: 'emma.martin@example.com',
    password: 'Test123!'
  })

  const userId = loginData.user.id
  console.log('Emma auth user ID:', userId)

  // The creator data needs to be inserted via SQL since we need admin access
  console.log('\n⚠️  Run this SQL in Supabase to create Emma as a creator:\n')
  console.log(`
-- Create Emma as creator and link to auth user
INSERT INTO creators (id, email, discount_code, commission_rate, status, lock_days, user_id, created_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'emma.martin@example.com',
  'EMMA15',
  0.15,
  'active',
  30,
  '${userId}',
  NOW() - INTERVAL '90 days'
) ON CONFLICT (id) DO UPDATE SET user_id = '${userId}';

-- Create test orders
INSERT INTO orders (id, shopify_order_id, order_number, customer_email, total_amount, discount_code, creator_id, status, order_date)
VALUES
  ('ord11111-0001-0001-0001-000000000001', 'SHOP-1001', '#1001', 'client1@test.com', 150.00, 'EMMA15', '11111111-1111-1111-1111-111111111111', 'confirmed', NOW() - INTERVAL '45 days'),
  ('ord11111-0001-0001-0001-000000000002', 'SHOP-1002', '#1002', 'client2@test.com', 89.99, 'EMMA15', '11111111-1111-1111-1111-111111111111', 'confirmed', NOW() - INTERVAL '10 days'),
  ('ord11111-0001-0001-0001-000000000003', 'SHOP-1003', '#1003', 'client3@test.com', 200.00, 'EMMA15', '11111111-1111-1111-1111-111111111111', 'confirmed', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- Create commissions
INSERT INTO commissions (id, creator_id, order_id, order_total, commission_rate, commission_amount, status, lock_until)
VALUES
  ('com11111-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', 'ord11111-0001-0001-0001-000000000001', 150.00, 0.15, 22.50, 'paid', NULL),
  ('com11111-0001-0001-0001-000000000002', '11111111-1111-1111-1111-111111111111', 'ord11111-0001-0001-0001-000000000002', 89.99, 0.15, 13.50, 'payable', NULL),
  ('com11111-0001-0001-0001-000000000003', '11111111-1111-1111-1111-111111111111', 'ord11111-0001-0001-0001-000000000003', 200.00, 0.15, 30.00, 'locked', NOW() + INTERVAL '27 days')
ON CONFLICT (id) DO NOTHING;

-- Verify
SELECT 'Creator linked!' as status, id, email, user_id FROM creators WHERE email = 'emma.martin@example.com';
  `)
}

setupEmmaCreator().catch(console.error)
