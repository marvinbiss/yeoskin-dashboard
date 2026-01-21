-- ============================================================================
-- MISSION CRITIQUE : INTERCONNEXION 100% YEOSKIN
-- ============================================================================
-- Exécuter ce script en entier dans Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : CRÉER LES NOTIFICATIONS MANQUANTES
-- ============================================================================

INSERT INTO creator_notifications (id, creator_id, type, title, message, amount, read, created_at)
SELECT
  gen_random_uuid(),
  fl.creator_id,
  CASE fl.transaction_type
    WHEN 'commission_earned' THEN 'commission_earned'
    WHEN 'payout_sent' THEN 'payout_sent'
    WHEN 'payout_completed' THEN 'payout_completed'
    WHEN 'payout_fee' THEN 'info'
    ELSE 'info'
  END,
  CASE fl.transaction_type
    WHEN 'commission_earned' THEN 'Commission gagnée'
    WHEN 'payout_sent' THEN 'Paiement envoyé'
    WHEN 'payout_completed' THEN 'Paiement reçu'
    WHEN 'payout_fee' THEN 'Frais de transfert'
    ELSE 'Transaction'
  END,
  fl.description,
  fl.amount,
  true,
  fl.created_at
FROM financial_ledger fl
WHERE NOT EXISTS (
  SELECT 1 FROM creator_notifications cn
  WHERE cn.creator_id = fl.creator_id
  AND cn.amount = fl.amount
  AND DATE_TRUNC('minute', cn.created_at) = DATE_TRUNC('minute', fl.created_at)
);

SELECT 'Étape 1: Notifications créées' AS status;

-- ============================================================================
-- ÉTAPE 2 : CRÉER AUTH USERS POUR LES 10 CRÉATEURS
-- ============================================================================
-- NOTE: Cette partie utilise une approche SQL directe
-- Le mot de passe sera "Test123!" pour tous

-- Insérer dans auth.users (format Supabase)
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
  is_super_admin,
  role,
  aud,
  confirmation_token
)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  c.email,
  crypt('Test123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{}'::jsonb,
  false,
  'authenticated',
  'authenticated',
  ''
FROM creators c
WHERE c.user_id IS NULL
AND c.email != 'emma.martin@example.com'
ON CONFLICT (email) DO NOTHING;

SELECT 'Étape 2: Auth users créés' AS status;

-- ============================================================================
-- ÉTAPE 3 : LIER LES USER_ID
-- ============================================================================

UPDATE creators c
SET user_id = u.id
FROM auth.users u
WHERE LOWER(c.email) = LOWER(u.email)
AND c.user_id IS NULL;

SELECT 'Étape 3: User IDs liés' AS status;

-- ============================================================================
-- ÉTAPE 4 : CRÉER auth.identities (requis pour le login)
-- ============================================================================

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  created_at,
  updated_at,
  last_sign_in_at
)
SELECT
  gen_random_uuid(),
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  u.id::text,
  NOW(),
  NOW(),
  NOW()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM auth.identities i WHERE i.user_id = u.id
);

SELECT 'Étape 4: Identities créées' AS status;

-- ============================================================================
-- VALIDATION FINALE
-- ============================================================================

SELECT '=== VALIDATION ===' AS section;

-- Test 1: Créateurs avec auth
SELECT
  'Test 1: Créateurs avec auth' AS test,
  COUNT(*) AS total_creators,
  COUNT(user_id) AS with_auth,
  COUNT(*) - COUNT(user_id) AS without_auth
FROM creators;

-- Test 2: Notifications vs Ledger
SELECT
  'Test 2: Notifications' AS test,
  (SELECT COUNT(*) FROM financial_ledger) AS ledger_entries,
  (SELECT COUNT(*) FROM creator_notifications) AS notifications;

-- Test 3: Liste des créateurs
SELECT
  'Test 3: Créateurs' AS test,
  c.email,
  CASE WHEN c.user_id IS NOT NULL THEN '✅' ELSE '❌' END AS auth_linked,
  CASE WHEN u.id IS NOT NULL THEN '✅' ELSE '❌' END AS user_exists
FROM creators c
LEFT JOIN auth.users u ON c.user_id = u.id
ORDER BY c.email;

-- Test 4: Dashboard test pour chaque créateur
SELECT
  'Test 4: Dashboards' AS test,
  c.email,
  (get_creator_dashboard(c.id))->>'balance' IS NOT NULL AS dashboard_ok
FROM creators c;

SELECT '=== MISSION COMPLETE ===' AS status;
