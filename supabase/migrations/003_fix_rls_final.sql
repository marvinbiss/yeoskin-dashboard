-- ============================================================================
-- YEOSKIN - FIX RLS POLICIES FINAL
-- Adapté au schéma existant (admin_profiles.email, pas user_id)
-- ============================================================================

-- ============================================================================
-- 1. CREATOR_PROFILES - RLS POLICIES
-- ============================================================================

ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Public view active profiles" ON creator_profiles;
DROP POLICY IF EXISTS "Creators view own profile" ON creator_profiles;
DROP POLICY IF EXISTS "Creators update own profile" ON creator_profiles;
DROP POLICY IF EXISTS "Creators insert own profile" ON creator_profiles;
DROP POLICY IF EXISTS "Admin full access profiles" ON creator_profiles;
DROP POLICY IF EXISTS "Anyone can view public profiles" ON creator_profiles;

-- Policy 1: Public peut voir les profils actifs ET publics
CREATE POLICY "Public view active profiles"
ON creator_profiles FOR SELECT
TO public
USING (is_active = true AND is_public = true);

-- Policy 2: Créatrices authentifiées voient leur propre profil (même privé)
CREATE POLICY "Creators view own profile"
ON creator_profiles FOR SELECT
TO authenticated
USING (
  creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
);

-- Policy 3: Créatrices modifient leur propre profil
CREATE POLICY "Creators update own profile"
ON creator_profiles FOR UPDATE
TO authenticated
USING (
  creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
)
WITH CHECK (
  creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
);

-- Policy 4: Créatrices peuvent insérer leur profil
CREATE POLICY "Creators insert own profile"
ON creator_profiles FOR INSERT
TO authenticated
WITH CHECK (
  creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
);

-- Policy 5: Admin full access (via email dans admin_profiles)
CREATE POLICY "Admin full access profiles"
ON creator_profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE email = auth.jwt()->>'email'
    AND role IN ('admin', 'super_admin')
    AND is_active = true
  )
);

-- ============================================================================
-- 2. PROFILE_VIEWS - RLS POLICIES
-- ============================================================================

ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert views" ON profile_views;
DROP POLICY IF EXISTS "Anyone track views" ON profile_views;
DROP POLICY IF EXISTS "Creators view own analytics" ON profile_views;
DROP POLICY IF EXISTS "Admins view all analytics" ON profile_views;

-- Tout le monde peut insérer des vues (tracking public)
CREATE POLICY "Anyone can insert views"
ON profile_views FOR INSERT
TO public
WITH CHECK (true);

-- Créatrices voient leurs propres analytics
CREATE POLICY "Creators view own analytics"
ON profile_views FOR SELECT
TO authenticated
USING (
  profile_id IN (
    SELECT cp.id FROM creator_profiles cp
    JOIN creators c ON cp.creator_id = c.id
    WHERE c.user_id = auth.uid()
  )
);

-- Admins voient tout (via email)
CREATE POLICY "Admins view all analytics"
ON profile_views FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE email = auth.jwt()->>'email'
    AND is_active = true
  )
);

-- ============================================================================
-- 3. PROFILE_CLICKS - RLS POLICIES
-- ============================================================================

ALTER TABLE profile_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert clicks" ON profile_clicks;
DROP POLICY IF EXISTS "Anyone track clicks" ON profile_clicks;
DROP POLICY IF EXISTS "Creators view own clicks" ON profile_clicks;
DROP POLICY IF EXISTS "Admins view all clicks" ON profile_clicks;

-- Tout le monde peut insérer des clics (tracking public)
CREATE POLICY "Anyone can insert clicks"
ON profile_clicks FOR INSERT
TO public
WITH CHECK (true);

-- Créatrices voient leurs propres clics
CREATE POLICY "Creators view own clicks"
ON profile_clicks FOR SELECT
TO authenticated
USING (
  profile_id IN (
    SELECT cp.id FROM creator_profiles cp
    JOIN creators c ON cp.creator_id = c.id
    WHERE c.user_id = auth.uid()
  )
);

-- Admins voient tout (via email)
CREATE POLICY "Admins view all clicks"
ON profile_clicks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE email = auth.jwt()->>'email'
    AND is_active = true
  )
);

-- ============================================================================
-- 4. PRODUCTS - RLS POLICIES (si table existe)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products') THEN
    EXECUTE 'ALTER TABLE products ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Public view active products" ON products';
    EXECUTE 'DROP POLICY IF EXISTS "Admin manage all products" ON products';

    EXECUTE 'CREATE POLICY "Public view active products" ON products FOR SELECT TO public USING (is_active = true)';

    EXECUTE 'CREATE POLICY "Admin manage all products" ON products FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admin_profiles WHERE email = auth.jwt()->>''email'' AND is_active = true))';

    RAISE NOTICE 'Products RLS configured';
  END IF;
END $$;

-- ============================================================================
-- 5. CREATORS - RLS POLICIES
-- ============================================================================

ALTER TABLE creators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Creators view own data" ON creators;
DROP POLICY IF EXISTS "Admin view all creators" ON creators;

-- Créatrices voient leurs propres données
CREATE POLICY "Creators view own data"
ON creators FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins voient tout
CREATE POLICY "Admin view all creators"
ON creators FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE email = auth.jwt()->>'email'
    AND is_active = true
  )
);

-- ============================================================================
-- 6. GRANT PERMISSIONS
-- ============================================================================

-- S'assurer que authenticated peut lire creators pour les sous-requêtes RLS
GRANT SELECT ON creators TO authenticated;
GRANT SELECT ON creator_profiles TO authenticated;
GRANT SELECT ON admin_profiles TO authenticated;

-- ============================================================================
-- 7. VERIFICATION
-- ============================================================================

SELECT 'creator_profiles policies:' as info;
SELECT policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'creator_profiles';

SELECT 'creators policies:' as info;
SELECT policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'creators';

-- ============================================================================
-- DONE!
-- ============================================================================
