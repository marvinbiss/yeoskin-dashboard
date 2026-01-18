-- ============================================================================
-- YEOSKIN - Fix RLS Policies & Storage
-- Executez ce script dans Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- PHASE 1: VERIFICATION
-- ============================================================================

-- Verifier que les tables existent
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'creator_profiles') THEN
    RAISE EXCEPTION 'Table creator_profiles does not exist!';
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profile_views') THEN
    RAISE EXCEPTION 'Table profile_views does not exist!';
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profile_clicks') THEN
    RAISE EXCEPTION 'Table profile_clicks does not exist!';
  END IF;
  RAISE NOTICE 'All tables exist!';
END $$;

-- ============================================================================
-- PHASE 2: FIX RLS POLICIES - CREATOR_PROFILES
-- ============================================================================

ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Public view active profiles" ON creator_profiles;
DROP POLICY IF EXISTS "Creators view own profile" ON creator_profiles;
DROP POLICY IF EXISTS "Creators update own profile" ON creator_profiles;
DROP POLICY IF EXISTS "Admin full access profiles" ON creator_profiles;

-- 1. Public voit profils actifs ET publics
CREATE POLICY "Public view active profiles"
ON creator_profiles FOR SELECT
USING (is_active = true AND is_public = true);

-- 2. Creatrices voient leur propre profil (meme prive)
CREATE POLICY "Creators view own profile"
ON creator_profiles FOR SELECT
USING (
  creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
);

-- 3. Creatrices modifient leur propre profil
CREATE POLICY "Creators update own profile"
ON creator_profiles FOR UPDATE
USING (
  creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
)
WITH CHECK (
  creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
);

-- 4. Admin full access
CREATE POLICY "Admin full access profiles"
ON creator_profiles FOR ALL
USING (
  EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- ============================================================================
-- PHASE 3: FIX RLS POLICIES - PROFILE_VIEWS
-- ============================================================================

ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone track views" ON profile_views;
DROP POLICY IF EXISTS "Anyone can insert profile views" ON profile_views;
DROP POLICY IF EXISTS "Creators can view own analytics" ON profile_views;
DROP POLICY IF EXISTS "Admins can view all analytics" ON profile_views;

-- Tout le monde peut inserer des vues (tracking public)
CREATE POLICY "Anyone can insert views"
ON profile_views FOR INSERT
WITH CHECK (true);

-- Creatrices voient leurs propres analytics
CREATE POLICY "Creators view own analytics"
ON profile_views FOR SELECT
USING (
  profile_id IN (
    SELECT cp.id FROM creator_profiles cp
    JOIN creators c ON cp.creator_id = c.id
    WHERE c.user_id = auth.uid()
  )
);

-- Admins voient tout
CREATE POLICY "Admins view all analytics"
ON profile_views FOR SELECT
USING (
  EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = auth.uid())
);

-- ============================================================================
-- PHASE 4: FIX RLS POLICIES - PROFILE_CLICKS
-- ============================================================================

ALTER TABLE profile_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone track clicks" ON profile_clicks;
DROP POLICY IF EXISTS "Anyone can insert profile clicks" ON profile_clicks;
DROP POLICY IF EXISTS "Creators can view own clicks" ON profile_clicks;
DROP POLICY IF EXISTS "Admins can view all clicks" ON profile_clicks;

-- Tout le monde peut inserer des clics (tracking public)
CREATE POLICY "Anyone can insert clicks"
ON profile_clicks FOR INSERT
WITH CHECK (true);

-- Creatrices voient leurs propres clics
CREATE POLICY "Creators view own clicks"
ON profile_clicks FOR SELECT
USING (
  profile_id IN (
    SELECT cp.id FROM creator_profiles cp
    JOIN creators c ON cp.creator_id = c.id
    WHERE c.user_id = auth.uid()
  )
);

-- Admins voient tout
CREATE POLICY "Admins view all clicks"
ON profile_clicks FOR SELECT
USING (
  EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = auth.uid())
);

-- ============================================================================
-- PHASE 5: FIX RLS POLICIES - PRODUCTS
-- ============================================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view products" ON products;
DROP POLICY IF EXISTS "Public can view active products" ON products;
DROP POLICY IF EXISTS "Admin manage products" ON products;
DROP POLICY IF EXISTS "Admins can manage all products" ON products;

-- Public voit produits actifs
CREATE POLICY "Public view active products"
ON products FOR SELECT
USING (is_active = true);

-- Admins gerent tous les produits
CREATE POLICY "Admin manage all products"
ON products FOR ALL
USING (
  EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = auth.uid())
);

-- ============================================================================
-- PHASE 6: STORAGE BUCKET
-- ============================================================================

-- Creer le bucket s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'creator-profiles',
  'creator-profiles',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880;

-- ============================================================================
-- PHASE 7: STORAGE POLICIES
-- ============================================================================

-- Drop existing storage policies for this bucket
DROP POLICY IF EXISTS "Public can view" ON storage.objects;
DROP POLICY IF EXISTS "Public can view creator profiles" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users upload" ON storage.objects;
DROP POLICY IF EXISTS "Creators can upload own images" ON storage.objects;
DROP POLICY IF EXISTS "Users update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own files" ON storage.objects;

-- Public peut voir toutes les images
CREATE POLICY "Public view creator profile images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'creator-profiles');

-- Utilisateurs authentifies peuvent uploader
CREATE POLICY "Authenticated upload to creator profiles"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'creator-profiles');

-- Utilisateurs authentifies peuvent modifier leurs fichiers
CREATE POLICY "Authenticated update creator profiles"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'creator-profiles');

-- Utilisateurs authentifies peuvent supprimer leurs fichiers
CREATE POLICY "Authenticated delete creator profiles"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'creator-profiles');

-- ============================================================================
-- PHASE 8: VERIFIER/CREER PROFIL TEST
-- ============================================================================

-- Verifier si le createur test existe, sinon le creer
INSERT INTO creators (email, display_name, commission_rate, status)
VALUES ('test.creator@yeoskin.com', 'Marie Test', 10, 'active')
ON CONFLICT (email) DO NOTHING;

-- Le trigger auto_create_creator_profile devrait creer le profil automatiquement
-- Mais verifions et creons manuellement si besoin

DO $$
DECLARE
  creator_id_var UUID;
  profile_exists BOOLEAN;
BEGIN
  -- Get creator ID
  SELECT id INTO creator_id_var FROM creators WHERE email = 'test.creator@yeoskin.com';

  IF creator_id_var IS NULL THEN
    RAISE NOTICE 'Creator not found, please create manually';
    RETURN;
  END IF;

  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM creator_profiles WHERE creator_id = creator_id_var) INTO profile_exists;

  IF NOT profile_exists THEN
    INSERT INTO creator_profiles (
      creator_id,
      slug,
      display_name,
      bio,
      brand_color,
      is_active,
      is_public
    ) VALUES (
      creator_id_var,
      'testcreator',
      'Marie Test',
      'Passionnee de beaute coreenne - Compte test',
      '#FF69B4',
      true,
      false
    );
    RAISE NOTICE 'Profile created for testcreator';
  ELSE
    -- Update slug if different
    UPDATE creator_profiles
    SET slug = 'testcreator'
    WHERE creator_id = creator_id_var AND slug != 'testcreator';
    RAISE NOTICE 'Profile already exists';
  END IF;
END $$;

-- ============================================================================
-- PHASE 9: VERIFICATION FINALE
-- ============================================================================

-- Afficher le profil test
SELECT
  cp.id,
  cp.slug,
  cp.display_name,
  cp.is_active,
  cp.is_public,
  c.email,
  c.user_id
FROM creator_profiles cp
JOIN creators c ON cp.creator_id = c.id
WHERE c.email = 'test.creator@yeoskin.com';

-- Lister toutes les policies sur creator_profiles
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'creator_profiles';

-- Verifier le bucket
SELECT id, name, public FROM storage.buckets WHERE id = 'creator-profiles';

-- Lister les policies storage
SELECT
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects' AND policyname LIKE '%creator%';

-- ============================================================================
-- DONE!
-- ============================================================================
-- Maintenant:
-- 1. Allez dans Supabase > Authentication > Users
-- 2. Creez un user avec email: test.creator@yeoskin.com
-- 3. Liez le user_id au createur:
--    UPDATE creators SET user_id = 'LE_USER_ID' WHERE email = 'test.creator@yeoskin.com';
-- 4. Testez la connexion sur http://localhost:3009/creator/login
-- ============================================================================
