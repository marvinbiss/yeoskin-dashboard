-- ============================================================================
-- QUICK TEST SETUP - ALL IN ONE
-- ============================================================================
-- Creates Emma creator + auth user + test data in one go
-- ============================================================================

-- 1. Create Emma as a creator
INSERT INTO creators (id, email, discount_code, commission_rate, status, lock_days, created_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'emma.martin@example.com',
  'EMMA15',
  0.15,
  'active',
  30,
  NOW() - INTERVAL '90 days'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  discount_code = EXCLUDED.discount_code;

-- 2. Create bank account for Emma
INSERT INTO creator_bank_accounts (id, creator_id, account_type, iban, account_holder_name, bank_name, is_verified)
VALUES (
  'aaaa1111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  'iban',
  'FR7630006000011234567890189',
  'Emma Martin',
  'BNP Paribas',
  true
) ON CONFLICT (id) DO NOTHING;

-- 3. Create test orders
INSERT INTO orders (id, shopify_order_id, order_number, customer_email, total_amount, discount_code, creator_id, status, order_date)
VALUES
  ('ord11111-0001-0001-0001-000000000001', 'SHOP-1001', '#1001', 'client1@test.com', 150.00, 'EMMA15', '11111111-1111-1111-1111-111111111111', 'confirmed', NOW() - INTERVAL '45 days'),
  ('ord11111-0001-0001-0001-000000000002', 'SHOP-1002', '#1002', 'client2@test.com', 89.99, 'EMMA15', '11111111-1111-1111-1111-111111111111', 'confirmed', NOW() - INTERVAL '10 days'),
  ('ord11111-0001-0001-0001-000000000003', 'SHOP-1003', '#1003', 'client3@test.com', 200.00, 'EMMA15', '11111111-1111-1111-1111-111111111111', 'confirmed', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- 4. Create test commissions
INSERT INTO commissions (id, creator_id, order_id, order_total, commission_rate, commission_amount, status, lock_until)
VALUES
  ('com11111-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', 'ord11111-0001-0001-0001-000000000001', 150.00, 0.15, 22.50, 'paid', NULL),
  ('com11111-0001-0001-0001-000000000002', '11111111-1111-1111-1111-111111111111', 'ord11111-0001-0001-0001-000000000002', 89.99, 0.15, 13.50, 'payable', NULL),
  ('com11111-0001-0001-0001-000000000003', '11111111-1111-1111-1111-111111111111', 'ord11111-0001-0001-0001-000000000003', 200.00, 0.15, 30.00, 'locked', NOW() + INTERVAL '27 days')
ON CONFLICT (id) DO NOTHING;

-- 5. Create financial ledger entries
INSERT INTO financial_ledger (id, transaction_type, creator_id, amount, balance_after, commission_id, order_id, shopify_order_id, description, created_at)
VALUES
  ('led11111-0001-0001-0001-000000000001', 'commission_earned', '11111111-1111-1111-1111-111111111111', 22.50, 22.50, 'com11111-0001-0001-0001-000000000001', 'ord11111-0001-0001-0001-000000000001', 'SHOP-1001', 'Commission from order #1001', NOW() - INTERVAL '45 days'),
  ('led11111-0001-0001-0001-000000000002', 'payout_sent', '11111111-1111-1111-1111-111111111111', 22.50, 0, NULL, NULL, NULL, 'Payout sent via Wise', NOW() - INTERVAL '20 days'),
  ('led11111-0001-0001-0001-000000000003', 'commission_earned', '11111111-1111-1111-1111-111111111111', 13.50, 13.50, 'com11111-0001-0001-0001-000000000002', 'ord11111-0001-0001-0001-000000000002', 'SHOP-1002', 'Commission from order #1002', NOW() - INTERVAL '10 days'),
  ('led11111-0001-0001-0001-000000000004', 'commission_earned', '11111111-1111-1111-1111-111111111111', 30.00, 43.50, 'com11111-0001-0001-0001-000000000003', 'ord11111-0001-0001-0001-000000000003', 'SHOP-1003', 'Commission from order #1003', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- 6. Create notifications
INSERT INTO creator_notifications (id, creator_id, type, title, message, amount, read, created_at)
VALUES
  ('notif111-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', 'commission_earned', 'Nouvelle commission !', 'Vous avez gagne 30.00 EUR', 30.00, false, NOW() - INTERVAL '3 days'),
  ('notif111-0001-0001-0001-000000000002', '11111111-1111-1111-1111-111111111111', 'commission_earned', 'Nouvelle commission !', 'Vous avez gagne 13.50 EUR', 13.50, false, NOW() - INTERVAL '10 days'),
  ('notif111-0001-0001-0001-000000000003', '11111111-1111-1111-1111-111111111111', 'payout_completed', 'Paiement recu !', 'Votre paiement a ete confirme', 22.50, true, NOW() - INTERVAL '18 days')
ON CONFLICT (id) DO NOTHING;

-- 7. Create auth user for Emma
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  '00000000-0000-0000-0000-000000000000',
  'emma.martin@example.com',
  crypt('Test123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Emma Martin"}',
  'authenticated',
  'authenticated'
) ON CONFLICT (email) DO UPDATE SET
  encrypted_password = crypt('Test123!', gen_salt('bf')),
  updated_at = NOW();

-- 8. Create identity
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  jsonb_build_object('sub', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'email', 'emma.martin@example.com'),
  'email',
  'emma.martin@example.com',
  NOW(),
  NOW()
) ON CONFLICT (provider, provider_id) DO NOTHING;

-- 9. Link creator to auth user
UPDATE creators
SET user_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
WHERE id = '11111111-1111-1111-1111-111111111111';

-- 10. Verify setup
SELECT '=== VERIFICATION ===' as info;

SELECT 'Creator:' as info, email, discount_code, user_id IS NOT NULL as linked
FROM creators WHERE id = '11111111-1111-1111-1111-111111111111';

SELECT 'Balance:' as info, current_balance, total_earned, total_paid
FROM creator_balances WHERE creator_id = '11111111-1111-1111-1111-111111111111';

SELECT 'Auth User:' as info, id, email FROM auth.users WHERE email = 'emma.martin@example.com';

SELECT '✅ Setup complete!' as status;
SELECT 'Login: emma.martin@example.com / Test123!' as credentials;
