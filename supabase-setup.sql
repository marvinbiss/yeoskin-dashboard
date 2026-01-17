-- ============================================================================
-- YEOSKIN DASHBOARD - SETUP COMPLET SUPABASE
-- ============================================================================
-- Exécutez ce script dans Supabase SQL Editor
-- https://supabase.com/dashboard/project/juqlogfujiagtpvxmeux/sql/new
-- ============================================================================

-- ============================================================================
-- 1. TABLE: admin_profiles
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('super_admin', 'admin', 'viewer')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id)
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_admin_profiles_email ON admin_profiles(email);
CREATE INDEX IF NOT EXISTS idx_admin_profiles_role ON admin_profiles(role);
CREATE INDEX IF NOT EXISTS idx_admin_profiles_is_active ON admin_profiles(is_active);

-- ============================================================================
-- 2. ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Admin profiles are viewable by authenticated users" ON admin_profiles;
DROP POLICY IF EXISTS "Admin profiles can be inserted by authenticated users" ON admin_profiles;
DROP POLICY IF EXISTS "Admin profiles can be updated by authenticated users" ON admin_profiles;
DROP POLICY IF EXISTS "read" ON admin_profiles;
DROP POLICY IF EXISTS "insert" ON admin_profiles;
DROP POLICY IF EXISTS "update" ON admin_profiles;

-- Créer les nouvelles policies
CREATE POLICY "Admin profiles are viewable by authenticated users"
  ON admin_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin profiles can be inserted by authenticated users"
  ON admin_profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin profiles can be updated by authenticated users"
  ON admin_profiles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin profiles can be deleted by authenticated users"
  ON admin_profiles FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- 3. FONCTION: Mise à jour automatique de updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour admin_profiles
DROP TRIGGER IF EXISTS update_admin_profiles_updated_at ON admin_profiles;
CREATE TRIGGER update_admin_profiles_updated_at
  BEFORE UPDATE ON admin_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. FONCTION: Créer automatiquement un profil admin à l'inscription
-- ============================================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admin_profiles (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer'),
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer le profil automatiquement
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- 5. AJOUTER LE PREMIER SUPER ADMIN
-- ============================================================================
-- Ajoute le premier utilisateur existant comme super_admin
INSERT INTO admin_profiles (id, email, full_name, role, is_active)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'Super Admin'),
  'super_admin',
  true
FROM auth.users
ORDER BY created_at ASC
LIMIT 1
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  is_active = true,
  updated_at = NOW();

-- ============================================================================
-- 6. ACTIVER REALTIME POUR admin_profiles
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE admin_profiles;

-- ============================================================================
-- 7. VÉRIFICATION
-- ============================================================================
SELECT
  'Setup terminé!' AS status,
  (SELECT COUNT(*) FROM admin_profiles) AS total_admins,
  (SELECT COUNT(*) FROM admin_profiles WHERE role = 'super_admin') AS super_admins;
