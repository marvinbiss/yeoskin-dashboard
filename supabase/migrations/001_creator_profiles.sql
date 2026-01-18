-- ============================================================================
-- YEOSKIN - Creator Profiles System
-- Execute in Supabase SQL Editor
-- ============================================================================

-- Creator profiles (content public)
CREATE TABLE creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES creators(id) UNIQUE NOT NULL,

  slug TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  tagline TEXT,
  bio TEXT DEFAULT '',
  profile_image_url TEXT,
  banner_image_url TEXT,
  brand_color TEXT DEFAULT '#FF69B4',

  instagram_handle TEXT,
  tiktok_handle TEXT,
  youtube_handle TEXT,

  featured_products UUID[] DEFAULT ARRAY[]::UUID[],
  custom_message TEXT,

  views_count INT DEFAULT 0,
  clicks_count INT DEFAULT 0,
  orders_count INT DEFAULT 0,

  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false,

  meta_title TEXT,
  meta_description TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,

  CONSTRAINT bio_length CHECK (char_length(bio) <= 500),
  CONSTRAINT tagline_length CHECK (char_length(tagline) <= 100)
);

-- Tracking
CREATE TABLE profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES creator_profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  referrer TEXT,
  ip_hash TEXT,
  device_type TEXT,
  session_id TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT
);

CREATE TABLE profile_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES creator_profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  session_id TEXT,
  converted BOOLEAN DEFAULT false,
  order_id UUID,
  conversion_value DECIMAL(10,2)
);

CREATE TABLE profile_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES creator_profiles(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES auth.users(id),
  changed_by_type TEXT CHECK (changed_by_type IN ('creator', 'admin', 'system')),
  action TEXT CHECK (action IN ('create', 'update', 'delete', 'publish', 'unpublish')),
  field_changed TEXT,
  old_value JSONB,
  new_value JSONB,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Products (si pas existe)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  image_url TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  category TEXT,
  stock_quantity INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_creator_profiles_slug ON creator_profiles(slug);
CREATE INDEX idx_creator_profiles_creator ON creator_profiles(creator_id);
CREATE INDEX idx_creator_profiles_active ON creator_profiles(is_active, is_public)
  WHERE is_active = true AND is_public = true;
CREATE INDEX idx_profile_views_profile ON profile_views(profile_id, viewed_at DESC);
CREATE INDEX idx_profile_clicks_profile ON profile_clicks(profile_id, clicked_at DESC);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true;

-- Fonctions
CREATE OR REPLACE FUNCTION generate_unique_slug(base_slug TEXT)
RETURNS TEXT AS $$
DECLARE
  final_slug TEXT;
  counter INT := 1;
BEGIN
  final_slug := LOWER(base_slug);
  final_slug := REGEXP_REPLACE(final_slug, '[^a-z0-9]', '', 'g');
  final_slug := SUBSTRING(final_slug FROM 1 FOR 20);

  WHILE EXISTS (SELECT 1 FROM creator_profiles WHERE slug = final_slug) LOOP
    final_slug := SUBSTRING(base_slug FROM 1 FOR 17) || counter::TEXT;
    counter := counter + 1;
  END LOOP;

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Auto-creer profile
CREATE OR REPLACE FUNCTION auto_create_creator_profile()
RETURNS TRIGGER AS $$
DECLARE
  new_slug TEXT;
  display_name TEXT;
BEGIN
  new_slug := generate_unique_slug(SPLIT_PART(NEW.email, '@', 1));
  display_name := INITCAP(SPLIT_PART(NEW.email, '@', 1));

  INSERT INTO creator_profiles (
    creator_id, slug, display_name, bio, is_active, is_public
  ) VALUES (
    NEW.id, new_slug, display_name,
    'Passionnee de beaute coreenne',
    true, false
  );

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_create_profile ON creators;
CREATE TRIGGER trigger_auto_create_profile
  AFTER INSERT ON creators
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_creator_profile();

-- Creer profiles pour createurs existants
DO $$
DECLARE
  creator_record RECORD;
  new_slug TEXT;
  display_name TEXT;
BEGIN
  FOR creator_record IN
    SELECT c.id, c.email
    FROM creators c
    LEFT JOIN creator_profiles cp ON c.id = cp.creator_id
    WHERE cp.id IS NULL
  LOOP
    new_slug := generate_unique_slug(SPLIT_PART(creator_record.email, '@', 1));
    display_name := INITCAP(SPLIT_PART(creator_record.email, '@', 1));

    INSERT INTO creator_profiles (
      creator_id, slug, display_name, bio, is_active, is_public
    ) VALUES (
      creator_record.id, new_slug, display_name,
      'Passionnee de beaute coreenne', true, false
    );
  END LOOP;
END $$;

-- Increment counters
CREATE OR REPLACE FUNCTION increment_profile_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE creator_profiles SET views_count = views_count + 1
  WHERE id = NEW.profile_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_views ON profile_views;
CREATE TRIGGER trigger_increment_views
  AFTER INSERT ON profile_views
  FOR EACH ROW EXECUTE FUNCTION increment_profile_views();

CREATE OR REPLACE FUNCTION increment_profile_clicks()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE creator_profiles SET clicks_count = clicks_count + 1
  WHERE id = NEW.profile_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_clicks ON profile_clicks;
CREATE TRIGGER trigger_increment_clicks
  AFTER INSERT ON profile_clicks
  FOR EACH ROW EXECUTE FUNCTION increment_profile_clicks();

-- Audit log
CREATE OR REPLACE FUNCTION log_profile_changes()
RETURNS TRIGGER AS $$
DECLARE
  changed_by_id UUID;
  changed_by_type TEXT;
BEGIN
  changed_by_id := auth.uid();

  IF EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = changed_by_id) THEN
    changed_by_type := 'admin';
  ELSIF EXISTS (SELECT 1 FROM creators WHERE user_id = changed_by_id AND id = NEW.creator_id) THEN
    changed_by_type := 'creator';
  ELSE
    changed_by_type := 'system';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.bio IS DISTINCT FROM NEW.bio THEN
      INSERT INTO profile_audit_log (profile_id, changed_by, changed_by_type, action, field_changed, old_value, new_value)
      VALUES (NEW.id, changed_by_id, changed_by_type, 'update', 'bio', to_jsonb(OLD.bio), to_jsonb(NEW.bio));
    END IF;

    IF OLD.is_public = false AND NEW.is_public = true THEN
      UPDATE creator_profiles SET published_at = NOW() WHERE id = NEW.id;
      INSERT INTO profile_audit_log (profile_id, changed_by, changed_by_type, action, field_changed, new_value)
      VALUES (NEW.id, changed_by_id, changed_by_type, 'publish', 'is_public', to_jsonb(true));
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_profile_changes ON creator_profiles;
CREATE TRIGGER trigger_log_profile_changes
  AFTER UPDATE ON creator_profiles
  FOR EACH ROW EXECUTE FUNCTION log_profile_changes();

-- RLS
ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view active profiles" ON creator_profiles;
CREATE POLICY "Public view active profiles"
  ON creator_profiles FOR SELECT
  USING (is_active = true AND is_public = true);

DROP POLICY IF EXISTS "Creators view own profile" ON creator_profiles;
CREATE POLICY "Creators view own profile"
  ON creator_profiles FOR SELECT
  USING (creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Creators update own profile" ON creator_profiles;
CREATE POLICY "Creators update own profile"
  ON creator_profiles FOR UPDATE
  USING (creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid()))
  WITH CHECK (creator_id = (SELECT id FROM creators WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admin full access profiles" ON creator_profiles;
CREATE POLICY "Admin full access profiles"
  ON creator_profiles FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Anyone track views" ON profile_views;
CREATE POLICY "Anyone track views"
  ON profile_views FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone track clicks" ON profile_clicks;
CREATE POLICY "Anyone track clicks"
  ON profile_clicks FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public view products" ON products;
CREATE POLICY "Public view products"
  ON products FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admin manage products" ON products;
CREATE POLICY "Admin manage products"
  ON products FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = auth.uid()));
