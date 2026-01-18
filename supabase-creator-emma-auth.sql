-- ============================================================================
-- CREATE AUTH USER FOR EMMA AND LINK TO CREATOR
-- ============================================================================
-- Run this AFTER supabase-creator-portal-testdata.sql
-- ============================================================================

-- Create auth user for Emma
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
  crypt('TestPassword123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Emma Martin"}',
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Create identity for the user
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  created_at,
  updated_at,
  last_sign_in_at
) VALUES (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  '{"sub": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee", "email": "emma.martin@example.com"}',
  'email',
  'emma.martin@example.com',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (provider, provider_id) DO NOTHING;

-- Link Emma's creator profile to auth user
UPDATE creators
SET user_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    updated_at = NOW()
WHERE email = 'emma.martin@example.com';

-- Verify the link
SELECT
  c.id as creator_id,
  c.email,
  c.discount_code,
  c.user_id,
  u.email as auth_email
FROM creators c
LEFT JOIN auth.users u ON u.id = c.user_id
WHERE c.email = 'emma.martin@example.com';

SELECT '✅ Emma auth user created!' AS status;
SELECT 'Login: emma.martin@example.com / TestPassword123!' AS credentials;
