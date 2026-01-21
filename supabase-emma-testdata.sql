-- ============================================================================
-- DONNÉES TEST POUR EMMA
-- ============================================================================

-- Récupérer l'ID d'Emma
DO $$
DECLARE
  v_emma_id UUID;
BEGIN
  SELECT id INTO v_emma_id FROM creators WHERE email = 'emma.martin@example.com';
  RAISE NOTICE 'Emma ID: %', v_emma_id;
END $$;

-- ============================================================================
-- 1. COMMISSIONS (5 commissions variées)
-- ============================================================================

INSERT INTO commissions (id, creator_id, order_amount, commission_amount, status, shopify_order_id, created_at, lock_until)
SELECT
  gen_random_uuid(),
  c.id,
  125.00,
  18.75,
  'paid',
  'SHOP-1001',
  NOW() - INTERVAL '45 days',
  NOW() - INTERVAL '31 days'
FROM creators c WHERE c.email = 'emma.martin@example.com';

INSERT INTO commissions (id, creator_id, order_amount, commission_amount, status, shopify_order_id, created_at, lock_until)
SELECT
  gen_random_uuid(),
  c.id,
  89.99,
  13.50,
  'paid',
  'SHOP-1042',
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '16 days'
FROM creators c WHERE c.email = 'emma.martin@example.com';

INSERT INTO commissions (id, creator_id, order_amount, commission_amount, status, shopify_order_id, created_at, lock_until)
SELECT
  gen_random_uuid(),
  c.id,
  210.00,
  31.50,
  'payable',
  'SHOP-1089',
  NOW() - INTERVAL '20 days',
  NOW() - INTERVAL '6 days'
FROM creators c WHERE c.email = 'emma.martin@example.com';

INSERT INTO commissions (id, creator_id, order_amount, commission_amount, status, shopify_order_id, created_at, lock_until)
SELECT
  gen_random_uuid(),
  c.id,
  156.50,
  23.48,
  'locked',
  'SHOP-1156',
  NOW() - INTERVAL '7 days',
  NOW() + INTERVAL '7 days'
FROM creators c WHERE c.email = 'emma.martin@example.com';

INSERT INTO commissions (id, creator_id, order_amount, commission_amount, status, shopify_order_id, created_at, lock_until)
SELECT
  gen_random_uuid(),
  c.id,
  78.00,
  11.70,
  'pending',
  'SHOP-1198',
  NOW() - INTERVAL '2 days',
  NOW() + INTERVAL '12 days'
FROM creators c WHERE c.email = 'emma.martin@example.com';

-- ============================================================================
-- 2. FINANCIAL LEDGER (Historique des transactions)
-- ============================================================================

-- Commission 1 gagnée (il y a 45 jours)
INSERT INTO financial_ledger (id, transaction_type, creator_id, amount, balance_after, description, shopify_order_id, created_at)
SELECT
  gen_random_uuid(),
  'commission_earned',
  c.id,
  18.75,
  18.75,
  'Commission sur commande SHOP-1001',
  'SHOP-1001',
  NOW() - INTERVAL '45 days'
FROM creators c WHERE c.email = 'emma.martin@example.com';

-- Commission 2 gagnée (il y a 30 jours)
INSERT INTO financial_ledger (id, transaction_type, creator_id, amount, balance_after, description, shopify_order_id, created_at)
SELECT
  gen_random_uuid(),
  'commission_earned',
  c.id,
  13.50,
  32.25,
  'Commission sur commande SHOP-1042',
  'SHOP-1042',
  NOW() - INTERVAL '30 days'
FROM creators c WHERE c.email = 'emma.martin@example.com';

-- Paiement envoyé (il y a 25 jours) - Premier paiement
INSERT INTO financial_ledger (id, transaction_type, creator_id, amount, balance_after, description, wise_transfer_reference, created_at)
SELECT
  gen_random_uuid(),
  'payout_sent',
  c.id,
  30.00,
  2.25,
  'Virement bancaire - Wise',
  'WISE-TR-001',
  NOW() - INTERVAL '25 days'
FROM creators c WHERE c.email = 'emma.martin@example.com';

-- Frais de transfert
INSERT INTO financial_ledger (id, transaction_type, creator_id, amount, balance_after, description, wise_transfer_reference, created_at)
SELECT
  gen_random_uuid(),
  'payout_fee',
  c.id,
  1.50,
  0.75,
  'Frais de transfert Wise',
  'WISE-TR-001',
  NOW() - INTERVAL '25 days'
FROM creators c WHERE c.email = 'emma.martin@example.com';

-- Commission 3 gagnée (il y a 20 jours)
INSERT INTO financial_ledger (id, transaction_type, creator_id, amount, balance_after, description, shopify_order_id, created_at)
SELECT
  gen_random_uuid(),
  'commission_earned',
  c.id,
  31.50,
  32.25,
  'Commission sur commande SHOP-1089',
  'SHOP-1089',
  NOW() - INTERVAL '20 days'
FROM creators c WHERE c.email = 'emma.martin@example.com';

-- Commission 4 gagnée (il y a 7 jours) - Encore en période de lock
INSERT INTO financial_ledger (id, transaction_type, creator_id, amount, balance_after, description, shopify_order_id, created_at)
SELECT
  gen_random_uuid(),
  'commission_earned',
  c.id,
  23.48,
  55.73,
  'Commission sur commande SHOP-1156',
  'SHOP-1156',
  NOW() - INTERVAL '7 days'
FROM creators c WHERE c.email = 'emma.martin@example.com';

-- Commission 5 gagnée (il y a 2 jours) - Pending
INSERT INTO financial_ledger (id, transaction_type, creator_id, amount, balance_after, description, shopify_order_id, created_at)
SELECT
  gen_random_uuid(),
  'commission_earned',
  c.id,
  11.70,
  67.43,
  'Commission sur commande SHOP-1198',
  'SHOP-1198',
  NOW() - INTERVAL '2 days'
FROM creators c WHERE c.email = 'emma.martin@example.com';

-- ============================================================================
-- 3. NOTIFICATIONS
-- ============================================================================

INSERT INTO creator_notifications (id, creator_id, type, title, message, amount, read, created_at)
SELECT
  gen_random_uuid(),
  c.id,
  'welcome',
  'Bienvenue sur Yeoskin!',
  'Votre compte créateur est maintenant actif. Partagez votre code EMMA15 pour commencer à gagner des commissions.',
  NULL,
  true,
  NOW() - INTERVAL '60 days'
FROM creators c WHERE c.email = 'emma.martin@example.com';

INSERT INTO creator_notifications (id, creator_id, type, title, message, amount, read, created_at)
SELECT
  gen_random_uuid(),
  c.id,
  'commission_earned',
  'Nouvelle commission!',
  'Vous avez gagné une commission sur la commande SHOP-1001.',
  18.75,
  true,
  NOW() - INTERVAL '45 days'
FROM creators c WHERE c.email = 'emma.martin@example.com';

INSERT INTO creator_notifications (id, creator_id, type, title, message, amount, read, created_at)
SELECT
  gen_random_uuid(),
  c.id,
  'commission_earned',
  'Nouvelle commission!',
  'Vous avez gagné une commission sur la commande SHOP-1042.',
  13.50,
  true,
  NOW() - INTERVAL '30 days'
FROM creators c WHERE c.email = 'emma.martin@example.com';

INSERT INTO creator_notifications (id, creator_id, type, title, message, amount, read, created_at)
SELECT
  gen_random_uuid(),
  c.id,
  'payout_sent',
  'Paiement envoyé!',
  'Votre paiement de 30,00 € a été envoyé. Il arrivera sous 1-3 jours ouvrables.',
  30.00,
  true,
  NOW() - INTERVAL '25 days'
FROM creators c WHERE c.email = 'emma.martin@example.com';

INSERT INTO creator_notifications (id, creator_id, type, title, message, amount, read, created_at)
SELECT
  gen_random_uuid(),
  c.id,
  'payout_completed',
  'Paiement reçu!',
  'Votre paiement de 30,00 € a été confirmé comme reçu.',
  30.00,
  true,
  NOW() - INTERVAL '23 days'
FROM creators c WHERE c.email = 'emma.martin@example.com';

INSERT INTO creator_notifications (id, creator_id, type, title, message, amount, read, created_at)
SELECT
  gen_random_uuid(),
  c.id,
  'commission_earned',
  'Nouvelle commission!',
  'Vous avez gagné une commission sur la commande SHOP-1089.',
  31.50,
  false,
  NOW() - INTERVAL '20 days'
FROM creators c WHERE c.email = 'emma.martin@example.com';

INSERT INTO creator_notifications (id, creator_id, type, title, message, amount, read, created_at)
SELECT
  gen_random_uuid(),
  c.id,
  'commission_payable',
  'Commission disponible!',
  'Votre commission de 31,50 € est maintenant disponible pour paiement.',
  31.50,
  false,
  NOW() - INTERVAL '6 days'
FROM creators c WHERE c.email = 'emma.martin@example.com';

INSERT INTO creator_notifications (id, creator_id, type, title, message, amount, read, created_at)
SELECT
  gen_random_uuid(),
  c.id,
  'commission_earned',
  'Nouvelle commission!',
  'Vous avez gagné une commission sur la commande SHOP-1156.',
  23.48,
  false,
  NOW() - INTERVAL '7 days'
FROM creators c WHERE c.email = 'emma.martin@example.com';

INSERT INTO creator_notifications (id, creator_id, type, title, message, amount, read, created_at)
SELECT
  gen_random_uuid(),
  c.id,
  'commission_earned',
  'Nouvelle commission!',
  'Vous avez gagné une commission sur la commande SHOP-1198.',
  11.70,
  false,
  NOW() - INTERVAL '2 days'
FROM creators c WHERE c.email = 'emma.martin@example.com';

-- ============================================================================
-- 4. VÉRIFICATION
-- ============================================================================

SELECT 'Données Emma ajoutées!' AS status;

SELECT 'Commissions:' AS info, COUNT(*) AS count, SUM(commission_amount) AS total
FROM commissions c
JOIN creators cr ON c.creator_id = cr.id
WHERE cr.email = 'emma.martin@example.com';

SELECT 'Ledger entries:' AS info, COUNT(*) AS count
FROM financial_ledger fl
JOIN creators cr ON fl.creator_id = cr.id
WHERE cr.email = 'emma.martin@example.com';

SELECT 'Notifications:' AS info, COUNT(*) AS total, SUM(CASE WHEN read = false THEN 1 ELSE 0 END) AS unread
FROM creator_notifications cn
JOIN creators cr ON cn.creator_id = cr.id
WHERE cr.email = 'emma.martin@example.com';

-- Test du dashboard
SELECT get_creator_dashboard(
  (SELECT id FROM creators WHERE email = 'emma.martin@example.com')
) AS emma_dashboard;
