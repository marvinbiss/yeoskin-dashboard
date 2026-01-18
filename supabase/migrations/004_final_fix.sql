-- ============================================================================
-- YEOSKIN - FINAL FIX - Execute this ONCE
-- ============================================================================

-- ============================================================================
-- 1. DROP ALL PROBLEMATIC TRIGGERS
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_log_profile_changes ON creator_profiles;
DROP TRIGGER IF EXISTS trigger_increment_views ON profile_views;
DROP TRIGGER IF EXISTS trigger_increment_clicks ON profile_clicks;

-- ============================================================================
-- 2. FIX ALL FUNCTIONS (SECURITY DEFINER bypasses RLS)
-- ============================================================================

CREATE OR REPLACE FUNCTION log_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profile_audit_log (profile_id, changed_by, changes, changed_at)
  VALUES (NEW.id, auth.uid(), jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)), now());
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_profile_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE creator_profiles SET views_count = views_count + 1 WHERE id = NEW.profile_id;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_profile_clicks()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE creator_profiles SET clicks_count = clicks_count + 1 WHERE id = NEW.profile_id;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. RECREATE TRIGGERS
-- ============================================================================
CREATE TRIGGER trigger_log_profile_changes
  AFTER UPDATE ON creator_profiles
  FOR EACH ROW EXECUTE FUNCTION log_profile_changes();

CREATE TRIGGER trigger_increment_views
  AFTER INSERT ON profile_views
  FOR EACH ROW EXECUTE FUNCTION increment_profile_views();

CREATE TRIGGER trigger_increment_clicks
  AFTER INSERT ON profile_clicks
  FOR EACH ROW EXECUTE FUNCTION increment_profile_clicks();

-- ============================================================================
-- 4. FIX profile_clicks SCHEMA (add link_type if missing)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profile_clicks' AND column_name = 'link_type') THEN
    ALTER TABLE profile_clicks ADD COLUMN link_type TEXT DEFAULT 'product';
  END IF;
END $$;

-- ============================================================================
-- 5. DROP ALL REMAINING auth.users POLICIES
-- ============================================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE qual LIKE '%auth.users%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    RAISE NOTICE 'Dropped policy: % on %.%', r.policyname, r.schemaname, r.tablename;
  END LOOP;
END $$;

-- ============================================================================
-- 6. RECREATE ALL ADMIN POLICIES CORRECTLY
-- ============================================================================

-- creators
DROP POLICY IF EXISTS "Admin full access creators" ON creators;
DROP POLICY IF EXISTS "Admin manage all creators" ON creators;
CREATE POLICY "Admin full access creators" ON creators FOR ALL TO authenticated
USING (auth.jwt()->>'email' IN (SELECT email FROM admin_profiles WHERE is_active = true));

-- creator_profiles
DROP POLICY IF EXISTS "Admin full access profiles" ON creator_profiles;
CREATE POLICY "Admin full access profiles" ON creator_profiles FOR ALL TO authenticated
USING (auth.jwt()->>'email' IN (SELECT email FROM admin_profiles WHERE is_active = true));

-- products
DROP POLICY IF EXISTS "Admin manage products" ON products;
DROP POLICY IF EXISTS "Admin manage all products" ON products;
CREATE POLICY "Admin manage products" ON products FOR ALL TO authenticated
USING (auth.jwt()->>'email' IN (SELECT email FROM admin_profiles WHERE is_active = true));

-- profile_views
DROP POLICY IF EXISTS "Admins view all analytics" ON profile_views;
CREATE POLICY "Admins view all analytics" ON profile_views FOR SELECT TO authenticated
USING (auth.jwt()->>'email' IN (SELECT email FROM admin_profiles WHERE is_active = true));

-- profile_clicks
DROP POLICY IF EXISTS "Admins view all clicks" ON profile_clicks;
CREATE POLICY "Admins view all clicks" ON profile_clicks FOR SELECT TO authenticated
USING (auth.jwt()->>'email' IN (SELECT email FROM admin_profiles WHERE is_active = true));

-- profile_audit_log
DROP POLICY IF EXISTS "Admins view all audits" ON profile_audit_log;
DROP POLICY IF EXISTS "Admin view all audits" ON profile_audit_log;
CREATE POLICY "Admins view all audits" ON profile_audit_log FOR SELECT TO authenticated
USING (auth.jwt()->>'email' IN (SELECT email FROM admin_profiles WHERE is_active = true));

-- ============================================================================
-- 7. VERIFY NO MORE auth.users REFERENCES
-- ============================================================================
SELECT COUNT(*) as remaining_issues FROM pg_policies WHERE qual LIKE '%auth.users%';

-- ============================================================================
-- DONE
-- ============================================================================
