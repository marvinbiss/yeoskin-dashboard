-- ============================================================================
-- YEOSKIN DASHBOARD - TEST DATA
-- ============================================================================
-- Execute this AFTER all other SQL scripts to populate test data
-- ============================================================================

-- ============================================================================
-- 1. TEST CREATORS
-- ============================================================================
INSERT INTO creators (email, discount_code, commission_rate, status, lock_days) VALUES
  ('emma.beauty@gmail.com', 'EMMA15', 0.15, 'active', 30),
  ('lucas.skincare@gmail.com', 'LUCAS20', 0.20, 'active', 30),
  ('chloe.glow@gmail.com', 'CHLOE10', 0.10, 'active', 14),
  ('hugo.derma@gmail.com', 'HUGO15', 0.15, 'active', 30),
  ('lea.cosmetics@gmail.com', 'LEA25', 0.25, 'active', 45),
  ('thomas.skin@gmail.com', 'THOMAS15', 0.15, 'inactive', 30),
  ('julie.beauty@gmail.com', 'JULIE20', 0.20, 'active', 30),
  ('maxime.care@gmail.com', 'MAXIME10', 0.10, 'active', 14),
  ('camille.glow@gmail.com', 'CAMILLE15', 0.15, 'suspended', 30),
  ('antoine.derm@gmail.com', 'ANTOINE20', 0.20, 'active', 30)
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- 2. BANK ACCOUNTS FOR CREATORS
-- ============================================================================
INSERT INTO creator_bank_accounts (creator_id, account_type, iban, account_holder_name, is_verified)
SELECT
  id,
  'iban',
  'FR76' || LPAD(FLOOR(RANDOM() * 10000000000)::TEXT, 10, '0') || LPAD(FLOOR(RANDOM() * 10000000000)::TEXT, 10, '0') || LPAD(FLOOR(RANDOM() * 100)::TEXT, 2, '0'),
  SPLIT_PART(email, '@', 1),
  RANDOM() > 0.3
FROM creators
WHERE NOT EXISTS (
  SELECT 1 FROM creator_bank_accounts WHERE creator_bank_accounts.creator_id = creators.id
);

-- ============================================================================
-- 3. TEST ORDERS
-- ============================================================================
INSERT INTO orders (shopify_order_id, order_number, customer_email, total_amount, discount_code, creator_id, status, order_date)
SELECT
  'SHOP-' || LPAD(ROW_NUMBER() OVER ()::TEXT, 6, '0'),
  '#' || (1000 + ROW_NUMBER() OVER ())::TEXT,
  'customer' || ROW_NUMBER() OVER () || '@example.com',
  (RANDOM() * 200 + 50)::DECIMAL(12,4),
  c.discount_code,
  c.id,
  CASE WHEN RANDOM() > 0.1 THEN 'confirmed' ELSE 'pending' END,
  NOW() - (RANDOM() * 60 || ' days')::INTERVAL
FROM creators c
CROSS JOIN generate_series(1, 5) AS s
WHERE c.status = 'active'
ON CONFLICT (shopify_order_id) DO NOTHING;

-- ============================================================================
-- 4. TEST COMMISSIONS (based on orders)
-- ============================================================================
INSERT INTO commissions (creator_id, order_id, order_total, commission_rate, commission_amount, status, lock_until)
SELECT
  o.creator_id,
  o.id,
  o.total_amount,
  c.commission_rate,
  (o.total_amount * c.commission_rate)::DECIMAL(12,4),
  CASE
    WHEN RANDOM() < 0.3 THEN 'pending'
    WHEN RANDOM() < 0.5 THEN 'locked'
    WHEN RANDOM() < 0.7 THEN 'payable'
    ELSE 'paid'
  END,
  CASE
    WHEN RANDOM() < 0.5 THEN NOW() + (c.lock_days || ' days')::INTERVAL
    ELSE NOW() - (10 || ' days')::INTERVAL
  END
FROM orders o
JOIN creators c ON c.id = o.creator_id
WHERE o.status = 'confirmed'
AND NOT EXISTS (
  SELECT 1 FROM commissions WHERE commissions.order_id = o.id
);

-- ============================================================================
-- 5. TEST PAYOUT BATCHES
-- ============================================================================
INSERT INTO payout_batches (name, status, total_amount, item_count, created_at) VALUES
  ('Batch Janvier 2025 - Semaine 1', 'paid', 1250.00, 5, NOW() - INTERVAL '30 days'),
  ('Batch Janvier 2025 - Semaine 2', 'paid', 890.50, 3, NOW() - INTERVAL '23 days'),
  ('Batch Janvier 2025 - Semaine 3', 'sent', 2100.75, 8, NOW() - INTERVAL '16 days'),
  ('Batch Janvier 2025 - Semaine 4', 'approved', 750.25, 4, NOW() - INTERVAL '9 days'),
  ('Batch Fevrier 2025 - Semaine 1', 'draft', 1500.00, 6, NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. TEST PAYOUT ITEMS
-- ============================================================================
INSERT INTO payout_items (payout_batch_id, creator_id, amount, wise_fee, status, sent_at)
SELECT
  pb.id,
  c.id,
  (RANDOM() * 300 + 50)::DECIMAL(12,4),
  (RANDOM() * 5 + 1)::DECIMAL(12,4),
  CASE pb.status
    WHEN 'draft' THEN 'pending'
    WHEN 'approved' THEN 'pending'
    WHEN 'executing' THEN 'processing'
    WHEN 'sent' THEN 'sent'
    WHEN 'paid' THEN 'paid'
    ELSE 'pending'
  END,
  CASE WHEN pb.status IN ('sent', 'paid') THEN pb.created_at + INTERVAL '1 day' ELSE NULL END
FROM payout_batches pb
CROSS JOIN LATERAL (
  SELECT id FROM creators WHERE status = 'active' ORDER BY RANDOM() LIMIT 3
) c
WHERE NOT EXISTS (
  SELECT 1 FROM payout_items pi WHERE pi.payout_batch_id = pb.id AND pi.creator_id = c.id
);

-- ============================================================================
-- 7. UPDATE BATCH TOTALS
-- ============================================================================
UPDATE payout_batches pb SET
  total_amount = (SELECT COALESCE(SUM(amount), 0) FROM payout_items WHERE payout_batch_id = pb.id),
  total_fees = (SELECT COALESCE(SUM(wise_fee), 0) FROM payout_items WHERE payout_batch_id = pb.id),
  item_count = (SELECT COUNT(*) FROM payout_items WHERE payout_batch_id = pb.id);

-- ============================================================================
-- 8. ADD FINANCIAL LEDGER ENTRIES FOR PAID COMMISSIONS
-- ============================================================================
INSERT INTO financial_ledger (
  transaction_type,
  creator_id,
  amount,
  balance_after,
  commission_id,
  description,
  created_at
)
SELECT
  'commission_earned',
  c.creator_id,
  c.commission_amount,
  c.commission_amount,
  c.id,
  'Commission from order ' || o.order_number,
  c.created_at
FROM commissions c
JOIN orders o ON o.id = c.order_id
WHERE NOT EXISTS (
  SELECT 1 FROM financial_ledger fl WHERE fl.commission_id = c.id
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 9. VERIFICATION
-- ============================================================================
SELECT
  'Test data created!' AS status,
  (SELECT COUNT(*) FROM creators) AS creators,
  (SELECT COUNT(*) FROM creator_bank_accounts) AS bank_accounts,
  (SELECT COUNT(*) FROM orders) AS orders,
  (SELECT COUNT(*) FROM commissions) AS commissions,
  (SELECT COUNT(*) FROM payout_batches) AS batches,
  (SELECT COUNT(*) FROM payout_items) AS payout_items,
  (SELECT COUNT(*) FROM financial_ledger) AS ledger_entries;
