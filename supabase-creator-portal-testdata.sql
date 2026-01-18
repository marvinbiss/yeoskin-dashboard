-- ============================================================================
-- YEOSKIN CREATOR PORTAL - TEST DATA
-- ============================================================================
-- Run this AFTER supabase-creator-portal.sql
-- Creates test creators, commissions, ledger entries, and notifications
-- ============================================================================

-- ============================================================================
-- 1. CREATE TEST CREATORS
-- ============================================================================

-- Insert test creators (if not exists)
INSERT INTO creators (id, email, discount_code, commission_rate, status, lock_days, created_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'emma.martin@example.com', 'EMMA15', 0.15, 'active', 30, NOW() - INTERVAL '90 days'),
  ('22222222-2222-2222-2222-222222222222', 'lucas.dubois@example.com', 'LUCAS20', 0.20, 'active', 30, NOW() - INTERVAL '60 days'),
  ('33333333-3333-3333-3333-333333333333', 'chloe.bernard@example.com', 'CHLOE10', 0.10, 'active', 14, NOW() - INTERVAL '30 days'),
  ('44444444-4444-4444-4444-444444444444', 'hugo.petit@example.com', 'HUGO15', 0.15, 'inactive', 30, NOW() - INTERVAL '120 days')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  discount_code = EXCLUDED.discount_code,
  commission_rate = EXCLUDED.commission_rate,
  status = EXCLUDED.status;

-- ============================================================================
-- 2. CREATE BANK ACCOUNTS FOR CREATORS
-- ============================================================================

INSERT INTO creator_bank_accounts (id, creator_id, account_type, iban, account_holder_name, bank_name, is_verified, created_at)
VALUES
  ('aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'iban', 'FR7630006000011234567890189', 'Emma Martin', 'BNP Paribas', true, NOW() - INTERVAL '85 days'),
  ('aaaa2222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'iban', 'FR7630004000031234567890143', 'Lucas Dubois', 'Credit Agricole', true, NOW() - INTERVAL '55 days'),
  ('aaaa3333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'iban', 'FR7610107001011234567890129', 'Chloe Bernard', 'Societe Generale', false, NOW() - INTERVAL '25 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. CREATE TEST ORDERS
-- ============================================================================

INSERT INTO orders (id, shopify_order_id, order_number, customer_email, total_amount, discount_code, creator_id, status, order_date, created_at)
VALUES
  -- Emma's orders
  ('ord11111-1111-1111-1111-111111111111', 'SHOP-1001', '#1001', 'client1@example.com', 150.00, 'EMMA15', '11111111-1111-1111-1111-111111111111', 'confirmed', NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days'),
  ('ord11111-1111-1111-1111-111111111112', 'SHOP-1002', '#1002', 'client2@example.com', 89.99, 'EMMA15', '11111111-1111-1111-1111-111111111111', 'confirmed', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
  ('ord11111-1111-1111-1111-111111111113', 'SHOP-1003', '#1003', 'client3@example.com', 210.50, 'EMMA15', '11111111-1111-1111-1111-111111111111', 'confirmed', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
  ('ord11111-1111-1111-1111-111111111114', 'SHOP-1004', '#1004', 'client4@example.com', 75.00, 'EMMA15', '11111111-1111-1111-1111-111111111111', 'confirmed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  ('ord11111-1111-1111-1111-111111111115', 'SHOP-1005', '#1005', 'client5@example.com', 320.00, 'EMMA15', '11111111-1111-1111-1111-111111111111', 'confirmed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

  -- Lucas's orders
  ('ord22222-2222-2222-2222-222222222221', 'SHOP-2001', '#2001', 'client6@example.com', 199.99, 'LUCAS20', '22222222-2222-2222-2222-222222222222', 'confirmed', NOW() - INTERVAL '40 days', NOW() - INTERVAL '40 days'),
  ('ord22222-2222-2222-2222-222222222222', 'SHOP-2002', '#2002', 'client7@example.com', 450.00, 'LUCAS20', '22222222-2222-2222-2222-222222222222', 'confirmed', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
  ('ord22222-2222-2222-2222-222222222223', 'SHOP-2003', '#2003', 'client8@example.com', 125.50, 'LUCAS20', '22222222-2222-2222-2222-222222222222', 'confirmed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

  -- Chloe's orders
  ('ord33333-3333-3333-3333-333333333331', 'SHOP-3001', '#3001', 'client9@example.com', 85.00, 'CHLOE10', '33333333-3333-3333-3333-333333333333', 'confirmed', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
  ('ord33333-3333-3333-3333-333333333332', 'SHOP-3002', '#3002', 'client10@example.com', 299.99, 'CHLOE10', '33333333-3333-3333-3333-333333333333', 'confirmed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),

  -- Refunded order
  ('ord11111-1111-1111-1111-111111111199', 'SHOP-1099', '#1099', 'client99@example.com', 50.00, 'EMMA15', '11111111-1111-1111-1111-111111111111', 'refunded', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. CREATE TEST COMMISSIONS
-- ============================================================================

INSERT INTO commissions (id, creator_id, order_id, order_total, commission_rate, commission_amount, status, lock_until, created_at)
VALUES
  -- Emma's commissions (mix of statuses)
  ('com11111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'ord11111-1111-1111-1111-111111111111', 150.00, 0.15, 22.50, 'paid', NOW() - INTERVAL '15 days', NOW() - INTERVAL '45 days'),
  ('com11111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'ord11111-1111-1111-1111-111111111112', 89.99, 0.15, 13.50, 'payable', NULL, NOW() - INTERVAL '30 days'),
  ('com11111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111111', 'ord11111-1111-1111-1111-111111111113', 210.50, 0.15, 31.58, 'payable', NULL, NOW() - INTERVAL '15 days'),
  ('com11111-1111-1111-1111-111111111114', '11111111-1111-1111-1111-111111111111', 'ord11111-1111-1111-1111-111111111114', 75.00, 0.15, 11.25, 'locked', NOW() + INTERVAL '25 days', NOW() - INTERVAL '5 days'),
  ('com11111-1111-1111-1111-111111111115', '11111111-1111-1111-1111-111111111111', 'ord11111-1111-1111-1111-111111111115', 320.00, 0.15, 48.00, 'locked', NOW() + INTERVAL '28 days', NOW() - INTERVAL '2 days'),
  ('com11111-1111-1111-1111-111111111199', '11111111-1111-1111-1111-111111111111', 'ord11111-1111-1111-1111-111111111199', 50.00, 0.15, 7.50, 'canceled', NULL, NOW() - INTERVAL '25 days'),

  -- Lucas's commissions
  ('com22222-2222-2222-2222-222222222221', '22222222-2222-2222-2222-222222222222', 'ord22222-2222-2222-2222-222222222221', 199.99, 0.20, 40.00, 'paid', NULL, NOW() - INTERVAL '40 days'),
  ('com22222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'ord22222-2222-2222-2222-222222222222', 450.00, 0.20, 90.00, 'payable', NULL, NOW() - INTERVAL '20 days'),
  ('com22222-2222-2222-2222-222222222223', '22222222-2222-2222-2222-222222222222', 'ord22222-2222-2222-2222-222222222223', 125.50, 0.20, 25.10, 'locked', NOW() + INTERVAL '27 days', NOW() - INTERVAL '3 days'),

  -- Chloe's commissions
  ('com33333-3333-3333-3333-333333333331', '33333333-3333-3333-3333-333333333333', 'ord33333-3333-3333-3333-333333333331', 85.00, 0.10, 8.50, 'payable', NULL, NOW() - INTERVAL '20 days'),
  ('com33333-3333-3333-3333-333333333332', '33333333-3333-3333-3333-333333333333', 'ord33333-3333-3333-3333-333333333332', 299.99, 0.10, 30.00, 'locked', NOW() + INTERVAL '4 days', NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. CREATE TEST PAYOUT BATCHES
-- ============================================================================

INSERT INTO payout_batches (id, name, status, total_amount, total_fees, item_count, approved_at, created_at)
VALUES
  ('batch1111-1111-1111-1111-111111111111', 'Batch Janvier 2025', 'paid', 62.50, 2.50, 2, NOW() - INTERVAL '20 days', NOW() - INTERVAL '25 days'),
  ('batch2222-2222-2222-2222-222222222222', 'Batch Fevrier 2025', 'draft', 0, 0, 0, NULL, NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. CREATE TEST PAYOUT ITEMS
-- ============================================================================

INSERT INTO payout_items (id, payout_batch_id, creator_id, amount, wise_fee, status, sent_at, created_at)
VALUES
  ('item1111-1111-1111-1111-111111111111', 'batch1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 22.50, 1.25, 'paid', NOW() - INTERVAL '18 days', NOW() - INTERVAL '20 days'),
  ('item2222-2222-2222-2222-222222222222', 'batch1111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 40.00, 1.25, 'paid', NOW() - INTERVAL '18 days', NOW() - INTERVAL '20 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 7. CREATE FINANCIAL LEDGER ENTRIES
-- ============================================================================

-- Note: We insert directly with SECURITY DEFINER bypass for test data
-- In production, use add_ledger_entry() function

-- Emma's ledger entries
INSERT INTO financial_ledger (id, transaction_type, creator_id, amount, balance_after, commission_id, payout_item_id, payout_batch_id, order_id, shopify_order_id, description, created_at)
VALUES
  -- Commission earned entries
  ('led11111-0001-0001-0001-000000000001', 'commission_earned', '11111111-1111-1111-1111-111111111111', 22.50, 22.50, 'com11111-1111-1111-1111-111111111111', NULL, NULL, 'ord11111-1111-1111-1111-111111111111', 'SHOP-1001', 'Commission from order #1001', NOW() - INTERVAL '45 days'),
  ('led11111-0001-0001-0001-000000000002', 'commission_earned', '11111111-1111-1111-1111-111111111111', 13.50, 36.00, 'com11111-1111-1111-1111-111111111112', NULL, NULL, 'ord11111-1111-1111-1111-111111111112', 'SHOP-1002', 'Commission from order #1002', NOW() - INTERVAL '30 days'),
  ('led11111-0001-0001-0001-000000000003', 'commission_earned', '11111111-1111-1111-1111-111111111111', 7.50, 43.50, 'com11111-1111-1111-1111-111111111199', NULL, NULL, 'ord11111-1111-1111-1111-111111111199', 'SHOP-1099', 'Commission from order #1099', NOW() - INTERVAL '25 days'),
  ('led11111-0001-0001-0001-000000000004', 'commission_canceled', '11111111-1111-1111-1111-111111111111', 7.50, 36.00, 'com11111-1111-1111-1111-111111111199', NULL, NULL, 'ord11111-1111-1111-1111-111111111199', 'SHOP-1099', 'Commission canceled - order refunded #1099', NOW() - INTERVAL '23 days'),

  -- Payout entries for Emma
  ('led11111-0001-0001-0001-000000000005', 'payout_sent', '11111111-1111-1111-1111-111111111111', 22.50, 13.50, NULL, 'item1111-1111-1111-1111-111111111111', 'batch1111-1111-1111-1111-111111111111', NULL, NULL, 'Payout sent via Wise', NOW() - INTERVAL '18 days'),
  ('led11111-0001-0001-0001-000000000006', 'payout_fee', '11111111-1111-1111-1111-111111111111', 1.25, 12.25, NULL, 'item1111-1111-1111-1111-111111111111', 'batch1111-1111-1111-1111-111111111111', NULL, NULL, 'Wise transfer fee', NOW() - INTERVAL '18 days'),
  ('led11111-0001-0001-0001-000000000007', 'payout_completed', '11111111-1111-1111-1111-111111111111', 0, 12.25, NULL, 'item1111-1111-1111-1111-111111111111', 'batch1111-1111-1111-1111-111111111111', NULL, NULL, 'Payout confirmed received', NOW() - INTERVAL '16 days'),

  -- More recent commissions for Emma
  ('led11111-0001-0001-0001-000000000008', 'commission_earned', '11111111-1111-1111-1111-111111111111', 31.58, 43.83, 'com11111-1111-1111-1111-111111111113', NULL, NULL, 'ord11111-1111-1111-1111-111111111113', 'SHOP-1003', 'Commission from order #1003', NOW() - INTERVAL '15 days'),
  ('led11111-0001-0001-0001-000000000009', 'commission_earned', '11111111-1111-1111-1111-111111111111', 11.25, 55.08, 'com11111-1111-1111-1111-111111111114', NULL, NULL, 'ord11111-1111-1111-1111-111111111114', 'SHOP-1004', 'Commission from order #1004', NOW() - INTERVAL '5 days'),
  ('led11111-0001-0001-0001-000000000010', 'commission_earned', '11111111-1111-1111-1111-111111111111', 48.00, 103.08, 'com11111-1111-1111-1111-111111111115', NULL, NULL, 'ord11111-1111-1111-1111-111111111115', 'SHOP-1005', 'Commission from order #1005', NOW() - INTERVAL '2 days'),

  -- Lucas's ledger entries
  ('led22222-0001-0001-0001-000000000001', 'commission_earned', '22222222-2222-2222-2222-222222222222', 40.00, 40.00, 'com22222-2222-2222-2222-222222222221', NULL, NULL, 'ord22222-2222-2222-2222-222222222221', 'SHOP-2001', 'Commission from order #2001', NOW() - INTERVAL '40 days'),
  ('led22222-0001-0001-0001-000000000002', 'payout_sent', '22222222-2222-2222-2222-222222222222', 40.00, 0, NULL, 'item2222-2222-2222-2222-222222222222', 'batch1111-1111-1111-1111-111111111111', NULL, NULL, 'Payout sent via Wise', NOW() - INTERVAL '18 days'),
  ('led22222-0001-0001-0001-000000000003', 'payout_fee', '22222222-2222-2222-2222-222222222222', 1.25, -1.25, NULL, 'item2222-2222-2222-2222-222222222222', 'batch1111-1111-1111-1111-111111111111', NULL, NULL, 'Wise transfer fee', NOW() - INTERVAL '18 days'),
  ('led22222-0001-0001-0001-000000000004', 'payout_completed', '22222222-2222-2222-2222-222222222222', 0, -1.25, NULL, 'item2222-2222-2222-2222-222222222222', 'batch1111-1111-1111-1111-111111111111', NULL, NULL, 'Payout confirmed received', NOW() - INTERVAL '16 days'),
  ('led22222-0001-0001-0001-000000000005', 'commission_earned', '22222222-2222-2222-2222-222222222222', 90.00, 88.75, 'com22222-2222-2222-2222-222222222222', NULL, NULL, 'ord22222-2222-2222-2222-222222222222', 'SHOP-2002', 'Commission from order #2002', NOW() - INTERVAL '20 days'),
  ('led22222-0001-0001-0001-000000000006', 'commission_earned', '22222222-2222-2222-2222-222222222222', 25.10, 113.85, 'com22222-2222-2222-2222-222222222223', NULL, NULL, 'ord22222-2222-2222-2222-222222222223', 'SHOP-2003', 'Commission from order #2003', NOW() - INTERVAL '3 days'),

  -- Chloe's ledger entries
  ('led33333-0001-0001-0001-000000000001', 'commission_earned', '33333333-3333-3333-3333-333333333333', 8.50, 8.50, 'com33333-3333-3333-3333-333333333331', NULL, NULL, 'ord33333-3333-3333-3333-333333333331', 'SHOP-3001', 'Commission from order #3001', NOW() - INTERVAL '20 days'),
  ('led33333-0001-0001-0001-000000000002', 'commission_earned', '33333333-3333-3333-3333-333333333333', 30.00, 38.50, 'com33333-3333-3333-3333-333333333332', NULL, NULL, 'ord33333-3333-3333-3333-333333333332', 'SHOP-3002', 'Commission from order #3002', NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 8. CREATE TEST NOTIFICATIONS
-- ============================================================================

INSERT INTO creator_notifications (id, creator_id, type, title, message, amount, reference_id, read, created_at)
VALUES
  -- Emma's notifications
  ('notif111-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', 'welcome', 'Bienvenue !', 'Bienvenue sur le portail createurs Yeoskin.', NULL, NULL, true, NOW() - INTERVAL '90 days'),
  ('notif111-0001-0001-0001-000000000002', '11111111-1111-1111-1111-111111111111', 'commission_earned', 'Nouvelle commission !', 'Vous avez gagne 22.50 EUR', 22.50, 'led11111-0001-0001-0001-000000000001', true, NOW() - INTERVAL '45 days'),
  ('notif111-0001-0001-0001-000000000003', '11111111-1111-1111-1111-111111111111', 'payout_sent', 'Paiement envoye', 'Un paiement de 22.50 EUR a ete envoye', 22.50, 'led11111-0001-0001-0001-000000000005', true, NOW() - INTERVAL '18 days'),
  ('notif111-0001-0001-0001-000000000004', '11111111-1111-1111-1111-111111111111', 'payout_completed', 'Paiement recu !', 'Votre paiement de 22.50 EUR a ete confirme', 22.50, 'led11111-0001-0001-0001-000000000007', true, NOW() - INTERVAL '16 days'),
  ('notif111-0001-0001-0001-000000000005', '11111111-1111-1111-1111-111111111111', 'commission_earned', 'Nouvelle commission !', 'Vous avez gagne 48.00 EUR', 48.00, 'led11111-0001-0001-0001-000000000010', false, NOW() - INTERVAL '2 days'),
  ('notif111-0001-0001-0001-000000000006', '11111111-1111-1111-1111-111111111111', 'commission_earned', 'Nouvelle commission !', 'Vous avez gagne 11.25 EUR', 11.25, 'led11111-0001-0001-0001-000000000009', false, NOW() - INTERVAL '5 days'),
  ('notif111-0001-0001-0001-000000000007', '11111111-1111-1111-1111-111111111111', 'info', 'Rappel', 'Pensez a verifier vos coordonnees bancaires.', NULL, NULL, false, NOW() - INTERVAL '1 day'),

  -- Lucas's notifications
  ('notif222-0001-0001-0001-000000000001', '22222222-2222-2222-2222-222222222222', 'welcome', 'Bienvenue !', 'Bienvenue sur le portail createurs Yeoskin.', NULL, NULL, true, NOW() - INTERVAL '60 days'),
  ('notif222-0001-0001-0001-000000000002', '22222222-2222-2222-2222-222222222222', 'commission_earned', 'Nouvelle commission !', 'Vous avez gagne 90.00 EUR', 90.00, 'led22222-0001-0001-0001-000000000005', false, NOW() - INTERVAL '20 days'),
  ('notif222-0001-0001-0001-000000000003', '22222222-2222-2222-2222-222222222222', 'commission_earned', 'Nouvelle commission !', 'Vous avez gagne 25.10 EUR', 25.10, 'led22222-0001-0001-0001-000000000006', false, NOW() - INTERVAL '3 days'),

  -- Chloe's notifications
  ('notif333-0001-0001-0001-000000000001', '33333333-3333-3333-3333-333333333333', 'welcome', 'Bienvenue !', 'Bienvenue sur le portail createurs Yeoskin.', NULL, NULL, true, NOW() - INTERVAL '30 days'),
  ('notif333-0001-0001-0001-000000000002', '33333333-3333-3333-3333-333333333333', 'commission_earned', 'Nouvelle commission !', 'Vous avez gagne 30.00 EUR', 30.00, 'led33333-0001-0001-0001-000000000002', false, NOW() - INTERVAL '10 days'),
  ('notif333-0001-0001-0001-000000000003', '33333333-3333-3333-3333-333333333333', 'info', 'Compte bancaire', 'Votre compte bancaire est en attente de verification.', NULL, NULL, false, NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 9. CREATE TEST AUTH USER AND LINK TO CREATOR
-- ============================================================================
-- Note: You need to create users in Supabase Auth first, then run this to link them
-- Example: If you create a user with email 'emma.martin@example.com' in Auth,
-- then run: SELECT link_creator_to_user('<user_uuid>', 'emma.martin@example.com');

-- ============================================================================
-- 10. VERIFICATION QUERIES
-- ============================================================================

-- Check creators
SELECT 'Creators:' AS info;
SELECT id, email, discount_code, commission_rate, status FROM creators ORDER BY created_at;

-- Check balances
SELECT 'Creator Balances:' AS info;
SELECT * FROM creator_balances;

-- Check commissions by status
SELECT 'Commissions by Status:' AS info;
SELECT status, COUNT(*), SUM(commission_amount) as total
FROM commissions
GROUP BY status
ORDER BY status;

-- Check ledger entries
SELECT 'Ledger Entry Count:' AS info;
SELECT creator_id, COUNT(*) as entries,
       MAX(balance_after) as current_balance
FROM financial_ledger
GROUP BY creator_id;

-- Check notifications
SELECT 'Unread Notifications:' AS info;
SELECT creator_id, COUNT(*) as unread
FROM creator_notifications
WHERE read = false
GROUP BY creator_id;

-- Test dashboard function for Emma
SELECT 'Emma Dashboard:' AS info;
SELECT get_creator_dashboard('11111111-1111-1111-1111-111111111111');

-- Test forecast function for Emma
SELECT 'Emma Forecast:' AS info;
SELECT get_payout_forecast('11111111-1111-1111-1111-111111111111');

SELECT '✅ Test data created successfully!' AS status;
