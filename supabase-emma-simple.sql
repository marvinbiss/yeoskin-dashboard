-- ============================================================================
-- EMMA SIMPLE SETUP - Minimal version without auth.users
-- ============================================================================
-- This creates Emma as a creator with test data
-- For login, use Supabase Dashboard > Authentication > Users > Add User
-- ============================================================================

-- 1. Add user_id column if missing
ALTER TABLE creators ADD COLUMN IF NOT EXISTS user_id UUID;

-- 2. Create Emma as a creator
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

-- 3. Create orders
INSERT INTO orders (id, shopify_order_id, order_number, customer_email, total_amount, discount_code, creator_id, status, order_date)
VALUES
  ('ord11111-0001-0001-0001-000000000001', 'SHOP-1001', '#1001', 'client1@test.com', 150.00, 'EMMA15', '11111111-1111-1111-1111-111111111111', 'confirmed', NOW() - INTERVAL '45 days'),
  ('ord11111-0001-0001-0001-000000000002', 'SHOP-1002', '#1002', 'client2@test.com', 89.99, 'EMMA15', '11111111-1111-1111-1111-111111111111', 'confirmed', NOW() - INTERVAL '10 days'),
  ('ord11111-0001-0001-0001-000000000003', 'SHOP-1003', '#1003', 'client3@test.com', 200.00, 'EMMA15', '11111111-1111-1111-1111-111111111111', 'confirmed', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- 4. Create commissions
INSERT INTO commissions (id, creator_id, order_id, order_total, commission_rate, commission_amount, status, lock_until)
VALUES
  ('com11111-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', 'ord11111-0001-0001-0001-000000000001', 150.00, 0.15, 22.50, 'paid', NULL),
  ('com11111-0001-0001-0001-000000000002', '11111111-1111-1111-1111-111111111111', 'ord11111-0001-0001-0001-000000000002', 89.99, 0.15, 13.50, 'payable', NULL),
  ('com11111-0001-0001-0001-000000000003', '11111111-1111-1111-1111-111111111111', 'ord11111-0001-0001-0001-000000000003', 200.00, 0.15, 30.00, 'locked', NOW() + INTERVAL '27 days')
ON CONFLICT (id) DO NOTHING;

-- 5. Create financial ledger entries (check if table exists first)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'financial_ledger') THEN
    INSERT INTO financial_ledger (id, transaction_type, creator_id, amount, balance_after, commission_id, order_id, shopify_order_id, description, created_at)
    VALUES
      ('led11111-0001-0001-0001-000000000001', 'commission_earned', '11111111-1111-1111-1111-111111111111', 22.50, 22.50, 'com11111-0001-0001-0001-000000000001', 'ord11111-0001-0001-0001-000000000001', 'SHOP-1001', 'Commission from order #1001', NOW() - INTERVAL '45 days'),
      ('led11111-0001-0001-0001-000000000002', 'payout_sent', '11111111-1111-1111-1111-111111111111', 22.50, 0, NULL, NULL, NULL, 'Payout sent via Wise', NOW() - INTERVAL '20 days'),
      ('led11111-0001-0001-0001-000000000003', 'commission_earned', '11111111-1111-1111-1111-111111111111', 13.50, 13.50, 'com11111-0001-0001-0001-000000000002', 'ord11111-0001-0001-0001-000000000002', 'SHOP-1002', 'Commission from order #1002', NOW() - INTERVAL '10 days'),
      ('led11111-0001-0001-0001-000000000004', 'commission_earned', '11111111-1111-1111-1111-111111111111', 30.00, 43.50, 'com11111-0001-0001-0001-000000000003', 'ord11111-0001-0001-0001-000000000003', 'SHOP-1003', 'Commission from order #1003', NOW() - INTERVAL '3 days')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- 6. Create notifications (check if table exists first)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'creator_notifications') THEN
    INSERT INTO creator_notifications (id, creator_id, type, title, message, amount, read, created_at)
    VALUES
      ('notif111-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', 'commission_earned', 'Nouvelle commission !', 'Vous avez gagne 30.00 EUR', 30.00, false, NOW() - INTERVAL '3 days'),
      ('notif111-0001-0001-0001-000000000002', '11111111-1111-1111-1111-111111111111', 'commission_earned', 'Nouvelle commission !', 'Vous avez gagne 13.50 EUR', 13.50, false, NOW() - INTERVAL '10 days'),
      ('notif111-0001-0001-0001-000000000003', '11111111-1111-1111-1111-111111111111', 'payout_completed', 'Paiement recu !', 'Votre paiement a ete confirme', 22.50, true, NOW() - INTERVAL '18 days')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- 7. Verify setup
SELECT '=== VERIFICATION ===' as info;
SELECT 'Creators:' as info, COUNT(*) as count FROM creators;
SELECT 'Orders:' as info, COUNT(*) as count FROM orders;
SELECT 'Commissions:' as info, COUNT(*) as count FROM commissions;

SELECT 'Emma Creator:' as info, id, email, discount_code FROM creators WHERE email = 'emma.martin@example.com';

SELECT '✅ Data setup complete!' as status;
SELECT '⚠️ Pour le login: Allez dans Supabase Dashboard > Authentication > Users > Add User' as next_step;
SELECT 'Email: emma.martin@example.com, Password: Test123!' as credentials;
