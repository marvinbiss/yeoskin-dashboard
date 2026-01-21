-- ============================================================================
-- YEOSKIN - Creator Onboarding System
-- Migration 013: Applications & Commission Tiers
-- ============================================================================

-- ============================================================================
-- 1. COMMISSION TIERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS commission_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,              -- 'bronze', 'silver', 'gold'
  display_name TEXT NOT NULL,             -- 'Bronze', 'Silver', 'Gold'
  commission_rate DECIMAL(5, 4) NOT NULL, -- 0.15, 0.17, 0.20
  min_followers INT DEFAULT 0,            -- Minimum followers for auto-assign
  description TEXT,
  color TEXT DEFAULT '#CD7F32',           -- Hex color for UI
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default tiers
INSERT INTO commission_tiers (name, display_name, commission_rate, min_followers, description, color, sort_order) VALUES
  ('bronze', 'Bronze', 0.15, 0, 'Tier de démarrage - 15% commission', '#CD7F32', 1),
  ('silver', 'Silver', 0.17, 5000, 'Tier intermédiaire - 17% commission (5K+ followers)', '#C0C0C0', 2),
  ('gold', 'Gold', 0.20, 50000, 'Tier premium - 20% commission (assignation manuelle)', '#FFD700', 3)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 2. CREATOR APPLICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS creator_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Personal Info
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  country TEXT DEFAULT 'FR',
  city TEXT,

  -- Social Media
  instagram_handle TEXT,
  instagram_followers INT DEFAULT 0,
  tiktok_handle TEXT,
  tiktok_followers INT DEFAULT 0,
  youtube_handle TEXT,
  youtube_subscribers INT DEFAULT 0,
  other_platforms JSONB DEFAULT '[]'::jsonb,

  -- Calculated
  total_followers INT GENERATED ALWAYS AS (
    COALESCE(instagram_followers, 0) +
    COALESCE(tiktok_followers, 0) +
    COALESCE(youtube_subscribers, 0)
  ) STORED,

  -- Application Details
  motivation TEXT,                         -- Why they want to join
  content_type TEXT[],                     -- ['skincare', 'beauty', 'lifestyle']
  experience_level TEXT DEFAULT 'beginner' CHECK (experience_level IN ('beginner', 'intermediate', 'expert')),
  website_url TEXT,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Awaiting review
    'under_review', -- Being reviewed by admin
    'approved',     -- Accepted
    'rejected',     -- Declined
    'waitlist'      -- On waitlist
  )),

  -- Auto-approval
  auto_approved BOOLEAN DEFAULT false,
  suggested_tier_id UUID REFERENCES commission_tiers(id),

  -- Review
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  rejection_reason TEXT,

  -- Conversion
  converted_to_creator_id UUID REFERENCES creators(id),
  converted_at TIMESTAMPTZ,

  -- Tracking
  source TEXT,                             -- 'organic', 'instagram', 'referral', etc.
  referral_code TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  ip_address INET,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT at_least_one_social CHECK (
    instagram_handle IS NOT NULL OR
    tiktok_handle IS NOT NULL OR
    youtube_handle IS NOT NULL
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_applications_email ON creator_applications(email);
CREATE INDEX IF NOT EXISTS idx_applications_status ON creator_applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created ON creator_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_instagram ON creator_applications(instagram_handle) WHERE instagram_handle IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_applications_total_followers ON creator_applications(total_followers DESC);

-- ============================================================================
-- 3. ADD TIER TO CREATORS TABLE
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'creators' AND column_name = 'tier_id'
  ) THEN
    ALTER TABLE creators ADD COLUMN tier_id UUID REFERENCES commission_tiers(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'creators' AND column_name = 'application_id'
  ) THEN
    ALTER TABLE creators ADD COLUMN application_id UUID REFERENCES creator_applications(id);
  END IF;
END $$;

-- Update existing creators to bronze tier
UPDATE creators
SET tier_id = (SELECT id FROM commission_tiers WHERE name = 'bronze')
WHERE tier_id IS NULL;

-- ============================================================================
-- 4. APPLICATION STATUS HISTORY
-- ============================================================================
CREATE TABLE IF NOT EXISTS application_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES creator_applications(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_status_history_app ON application_status_history(application_id, created_at DESC);

-- ============================================================================
-- 5. FUNCTIONS
-- ============================================================================

-- Auto-suggest tier based on followers
CREATE OR REPLACE FUNCTION suggest_tier_for_application()
RETURNS TRIGGER AS $$
DECLARE
  suggested_tier UUID;
BEGIN
  -- Find the best matching tier based on followers
  SELECT id INTO suggested_tier
  FROM commission_tiers
  WHERE is_active = true
    AND min_followers <= NEW.total_followers
    AND name != 'gold'  -- Gold is manual only
  ORDER BY min_followers DESC
  LIMIT 1;

  -- Default to bronze if no match
  IF suggested_tier IS NULL THEN
    SELECT id INTO suggested_tier FROM commission_tiers WHERE name = 'bronze';
  END IF;

  NEW.suggested_tier_id := suggested_tier;

  -- Auto-approve if >= 5000 followers
  IF NEW.total_followers >= 5000 THEN
    NEW.auto_approved := true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_suggest_tier ON creator_applications;
CREATE TRIGGER trigger_suggest_tier
  BEFORE INSERT OR UPDATE OF instagram_followers, tiktok_followers, youtube_subscribers
  ON creator_applications
  FOR EACH ROW
  EXECUTE FUNCTION suggest_tier_for_application();

-- Log status changes
CREATE OR REPLACE FUNCTION log_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO application_status_history (
      application_id, old_status, new_status, changed_by
    ) VALUES (
      NEW.id, OLD.status, NEW.status, auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_status_change ON creator_applications;
CREATE TRIGGER trigger_log_status_change
  AFTER UPDATE ON creator_applications
  FOR EACH ROW
  EXECUTE FUNCTION log_application_status_change();

-- Update timestamp
DROP TRIGGER IF EXISTS update_applications_updated_at ON creator_applications;
CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON creator_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. CONVERT APPLICATION TO CREATOR
-- ============================================================================
CREATE OR REPLACE FUNCTION convert_application_to_creator(
  p_application_id UUID,
  p_tier_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_app RECORD;
  v_creator_id UUID;
  v_discount_code TEXT;
  v_tier_id UUID;
  v_user_id UUID;
BEGIN
  -- Get application
  SELECT * INTO v_app FROM creator_applications WHERE id = p_application_id;

  IF v_app IS NULL THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  IF v_app.status != 'approved' THEN
    RAISE EXCEPTION 'Application must be approved first';
  END IF;

  IF v_app.converted_to_creator_id IS NOT NULL THEN
    RAISE EXCEPTION 'Application already converted';
  END IF;

  -- Use provided tier or suggested tier
  v_tier_id := COALESCE(p_tier_id, v_app.suggested_tier_id);

  -- Generate discount code
  v_discount_code := UPPER(
    SUBSTRING(v_app.first_name FROM 1 FOR 3) ||
    SUBSTRING(MD5(v_app.email || NOW()::TEXT) FROM 1 FOR 5)
  );

  -- Get commission rate from tier
  DECLARE
    v_commission_rate DECIMAL(5,4);
  BEGIN
    SELECT commission_rate INTO v_commission_rate
    FROM commission_tiers WHERE id = v_tier_id;

    -- Create creator
    INSERT INTO creators (
      email,
      discount_code,
      commission_rate,
      tier_id,
      application_id,
      status
    ) VALUES (
      v_app.email,
      v_discount_code,
      v_commission_rate,
      v_tier_id,
      p_application_id,
      'active'
    ) RETURNING id INTO v_creator_id;
  END;

  -- Update application
  UPDATE creator_applications
  SET
    converted_to_creator_id = v_creator_id,
    converted_at = NOW()
  WHERE id = p_application_id;

  RETURN v_creator_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE commission_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_status_history ENABLE ROW LEVEL SECURITY;

-- Commission tiers: public read, admin write
DROP POLICY IF EXISTS "Public can view tiers" ON commission_tiers;
CREATE POLICY "Public can view tiers"
  ON commission_tiers FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admin manage tiers" ON commission_tiers;
CREATE POLICY "Admin manage tiers"
  ON commission_tiers FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = auth.uid()));

-- Applications: public insert, admin full access
DROP POLICY IF EXISTS "Anyone can submit application" ON creator_applications;
CREATE POLICY "Anyone can submit application"
  ON creator_applications FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Applicants view own application" ON creator_applications;
CREATE POLICY "Applicants view own application"
  ON creator_applications FOR SELECT
  USING (email = auth.jwt()->>'email');

DROP POLICY IF EXISTS "Admin full access applications" ON creator_applications;
CREATE POLICY "Admin full access applications"
  ON creator_applications FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = auth.uid()));

-- Status history: admin only
DROP POLICY IF EXISTS "Admin view status history" ON application_status_history;
CREATE POLICY "Admin view status history"
  ON application_status_history FOR SELECT
  USING (EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = auth.uid()));

-- ============================================================================
-- 8. USEFUL VIEWS
-- ============================================================================
CREATE OR REPLACE VIEW v_applications_with_tier AS
SELECT
  a.*,
  t.name as tier_name,
  t.display_name as tier_display_name,
  t.commission_rate as tier_commission_rate,
  t.color as tier_color
FROM creator_applications a
LEFT JOIN commission_tiers t ON a.suggested_tier_id = t.id;

CREATE OR REPLACE VIEW v_application_stats AS
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'approved') as approved,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
  COUNT(*) FILTER (WHERE status = 'under_review') as under_review,
  COUNT(*) FILTER (WHERE auto_approved = true) as auto_approved,
  AVG(total_followers) as avg_followers,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as last_7_days,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as last_30_days
FROM creator_applications;

-- ============================================================================
-- DONE
-- ============================================================================
SELECT 'Migration 013: Creator Onboarding System - Complete!' as status;
