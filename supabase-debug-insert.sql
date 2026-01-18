-- ============================================================================
-- DEBUG INSERT - Test basic inserts step by step
-- ============================================================================
-- Run each section separately and check for errors
-- ============================================================================

-- STEP 1: Check if creators table exists and its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'creators'
ORDER BY ordinal_position;

-- STEP 2: Check if user_id column exists (added by creator-portal.sql)
SELECT column_name FROM information_schema.columns
WHERE table_name = 'creators' AND column_name = 'user_id';

-- STEP 3: Simple insert into creators (no auth linking)
INSERT INTO creators (id, email, discount_code, commission_rate, status, lock_days, created_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'emma.martin@example.com',
  'EMMA15',
  0.15,
  'active',
  30,
  NOW()
) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

-- STEP 4: Verify the insert
SELECT id, email, discount_code, status FROM creators WHERE id = '11111111-1111-1111-1111-111111111111';

-- STEP 5: Count all creators
SELECT COUNT(*) as total_creators FROM creators;
