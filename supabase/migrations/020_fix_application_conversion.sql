-- ============================================================================
-- YEOSKIN - Fix Application to Creator Conversion
-- Migration 020: Add missing columns and fix RPC function
-- ============================================================================

-- 1. Add missing columns to creator_applications
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'creator_applications' AND column_name = 'converted_to_creator_id') THEN
    ALTER TABLE creator_applications ADD COLUMN converted_to_creator_id UUID;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'creator_applications' AND column_name = 'converted_at') THEN
    ALTER TABLE creator_applications ADD COLUMN converted_at TIMESTAMPTZ;
  END IF;
END $$;

-- 2. Add missing application_id column to creators
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'creators' AND column_name = 'application_id') THEN
    ALTER TABLE creators ADD COLUMN application_id UUID;
  END IF;
END $$;

-- 3. Recreate RPC function with fixes (null-safe, slug generation, uniqueness checks)
CREATE OR REPLACE FUNCTION convert_application_to_creator(
  p_application_id UUID,
  p_tier_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_app RECORD;
  v_creator_id UUID;
  v_discount_code TEXT;
  v_slug TEXT;
  v_tier_id UUID;
  v_commission_rate DECIMAL(5,4);
BEGIN
  -- Get application
  SELECT * INTO v_app FROM creator_applications WHERE id = p_application_id;

  IF v_app IS NULL THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  IF v_app.status != 'approved' THEN
    RAISE EXCEPTION 'Application must be approved first';
  END IF;

  -- Check if already converted
  IF v_app.converted_to_creator_id IS NOT NULL THEN
    RETURN v_app.converted_to_creator_id;
  END IF;

  -- Check if creator with this email already exists
  SELECT id INTO v_creator_id FROM creators WHERE email = v_app.email;
  IF v_creator_id IS NOT NULL THEN
    UPDATE creator_applications
    SET converted_to_creator_id = v_creator_id, converted_at = NOW()
    WHERE id = p_application_id;
    RETURN v_creator_id;
  END IF;

  -- Use provided tier or suggested tier
  v_tier_id := COALESCE(p_tier_id, v_app.suggested_tier_id);

  -- Get commission rate (default 0.15 if tier not found)
  IF v_tier_id IS NOT NULL THEN
    SELECT commission_rate INTO v_commission_rate
    FROM commission_tiers WHERE id = v_tier_id;
  END IF;

  v_commission_rate := COALESCE(v_commission_rate, 0.15);

  -- Generate unique discount code
  v_discount_code := UPPER(
    SUBSTRING(COALESCE(v_app.first_name, 'YEO') FROM 1 FOR 3) ||
    SUBSTRING(MD5(v_app.email || NOW()::TEXT) FROM 1 FOR 5)
  );

  WHILE EXISTS (SELECT 1 FROM creators WHERE discount_code = v_discount_code) LOOP
    v_discount_code := UPPER(
      SUBSTRING(COALESCE(v_app.first_name, 'YEO') FROM 1 FOR 3) ||
      SUBSTRING(MD5(v_app.email || NOW()::TEXT || random()::TEXT) FROM 1 FOR 5)
    );
  END LOOP;

  -- Generate slug
  v_slug := LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        COALESCE(v_app.first_name, '') || '-' || COALESCE(v_app.last_name, ''),
        '[^a-zA-Z0-9-]', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
  v_slug := TRIM(BOTH '-' FROM v_slug);

  IF EXISTS (SELECT 1 FROM creators WHERE slug = v_slug) THEN
    v_slug := v_slug || '-' || SUBSTRING(MD5(random()::TEXT) FROM 1 FOR 4);
  END IF;

  -- Create creator
  INSERT INTO creators (
    email,
    discount_code,
    commission_rate,
    tier_id,
    application_id,
    slug,
    status
  ) VALUES (
    v_app.email,
    v_discount_code,
    v_commission_rate,
    v_tier_id,
    p_application_id,
    v_slug,
    'active'
  ) RETURNING id INTO v_creator_id;

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
SELECT 'Migration 020: Fix Application Conversion - Complete!' as status;
