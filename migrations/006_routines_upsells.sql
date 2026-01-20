-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Créer enum variant type (avec namespace check)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'routine_variant' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.routine_variant AS ENUM ('base', 'upsell_1', 'upsell_2');
  END IF;
END $$;

-- ============================================================================
-- Ajouter user_id à creators si absent
-- ============================================================================
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_creators_user_id ON public.creators(user_id);

-- ============================================================================
-- Créer admin_users (user_id UUID, PAS email)
-- ============================================================================
-- ⚠️ IMPORTANT: Cette migration assume qu'aucune table admin_users n'existe.
-- Si une ancienne table admin_users(email) existe, créer d'abord une migration
-- de transition (ex: 005_admin_users_transition.sql) pour renommer l'ancienne
-- en admin_users_legacy et migrer les données.
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Table ROUTINES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Info
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  objective TEXT NOT NULL,
  objective_color TEXT DEFAULT '#FF69B4',
  description TEXT NOT NULL,
  long_description TEXT,
  image_url TEXT,

  -- BASE (3 produits)
  base_products JSONB NOT NULL,
  base_price NUMERIC(10,2) NOT NULL,
  base_shopify_variant_ids BIGINT[] NOT NULL,

  -- UPSELL +1 (4 produits)
  upsell_1_product JSONB NOT NULL,
  upsell_1_price NUMERIC(10,2) NOT NULL,
  upsell_1_original_price NUMERIC(10,2) NOT NULL,
  upsell_1_savings NUMERIC(10,2) GENERATED ALWAYS AS (upsell_1_original_price - upsell_1_price) STORED,
  upsell_1_shopify_variant_ids BIGINT[] NOT NULL,

  -- UPSELL +2 (5 produits)
  upsell_2_products JSONB NOT NULL,
  upsell_2_price NUMERIC(10,2) NOT NULL,
  upsell_2_original_price NUMERIC(10,2) NOT NULL,
  upsell_2_savings NUMERIC(10,2) GENERATED ALWAYS AS (upsell_2_original_price - upsell_2_price) STORED,
  upsell_2_shopify_variant_ids BIGINT[] NOT NULL,

  -- Stats
  total_views INT DEFAULT 0,
  total_carts INT DEFAULT 0,
  total_orders INT DEFAULT 0,

  base_carts INT DEFAULT 0,
  base_orders INT DEFAULT 0,
  upsell_1_carts INT DEFAULT 0,
  upsell_1_orders INT DEFAULT 0,
  upsell_2_carts INT DEFAULT 0,
  upsell_2_orders INT DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,

  -- Marketing
  expected_results TEXT[],
  meta_title TEXT,
  meta_description TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contraintes
  CONSTRAINT base_products_count CHECK (jsonb_array_length(base_products) = 3),
  CONSTRAINT upsell_2_products_count CHECK (jsonb_array_length(upsell_2_products) = 2),
  CONSTRAINT base_variant_ids_count CHECK (array_length(base_shopify_variant_ids, 1) = 3),
  CONSTRAINT upsell_1_variant_ids_count CHECK (array_length(upsell_1_shopify_variant_ids, 1) = 4),
  CONSTRAINT upsell_2_variant_ids_count CHECK (array_length(upsell_2_shopify_variant_ids, 1) = 5)
);

-- ============================================================================
-- Table CREATOR_ROUTINES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.creator_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,

  custom_intro TEXT,

  base_views INT DEFAULT 0,
  base_carts INT DEFAULT 0,
  base_orders INT DEFAULT 0,
  base_revenue NUMERIC(10,2) DEFAULT 0,

  upsell_1_views INT DEFAULT 0,
  upsell_1_carts INT DEFAULT 0,
  upsell_1_orders INT DEFAULT 0,
  upsell_1_revenue NUMERIC(10,2) DEFAULT 0,

  upsell_2_views INT DEFAULT 0,
  upsell_2_carts INT DEFAULT 0,
  upsell_2_orders INT DEFAULT 0,
  upsell_2_revenue NUMERIC(10,2) DEFAULT 0,

  is_active BOOLEAN DEFAULT true,
  selected_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(creator_id)
);

-- ============================================================================
-- Table ROUTINE_CHECKOUTS (avec UNIQUE cart_id)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.routine_checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES public.routines(id),
  creator_id UUID NOT NULL REFERENCES public.creators(id),
  variant public.routine_variant NOT NULL,
  cart_id TEXT NOT NULL UNIQUE,
  checkout_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Ajouter colonnes attribution dans orders
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'orders'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS routine_id UUID REFERENCES public.routines(id);

    -- Ajouter colonne variant avec type enum
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'routine_variant'
    ) THEN
      ALTER TABLE public.orders ADD COLUMN routine_variant public.routine_variant;
    END IF;

    CREATE INDEX IF NOT EXISTS idx_orders_routine ON public.orders(routine_id);
    CREATE INDEX IF NOT EXISTS idx_orders_routine_variant ON public.orders(routine_variant);
  END IF;
END $$;

-- ============================================================================
-- Ajouter colonnes attribution dans commissions
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'commissions'
  ) THEN
    ALTER TABLE public.commissions ADD COLUMN IF NOT EXISTS routine_id UUID REFERENCES public.routines(id);

    -- Ajouter colonne variant avec type enum
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'commissions' AND column_name = 'routine_variant'
    ) THEN
      ALTER TABLE public.commissions ADD COLUMN routine_variant public.routine_variant;
    END IF;

    CREATE INDEX IF NOT EXISTS idx_commissions_routine ON public.commissions(routine_id);
  END IF;
END $$;

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_routines_slug ON public.routines(slug);
CREATE INDEX IF NOT EXISTS idx_routines_active ON public.routines(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_routines_featured ON public.routines(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_creator_routines_creator ON public.creator_routines(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_routines_routine ON public.creator_routines(routine_id);
CREATE INDEX IF NOT EXISTS idx_routine_checkouts_routine ON public.routine_checkouts(routine_id);
CREATE INDEX IF NOT EXISTS idx_routine_checkouts_creator ON public.routine_checkouts(creator_id);
CREATE INDEX IF NOT EXISTS idx_routine_checkouts_variant ON public.routine_checkouts(variant);

-- ============================================================================
-- TRIGGER updated_at (SANS SECURITY DEFINER)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.routines_set_updated_at()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS routines_updated_at ON public.routines;
CREATE TRIGGER routines_updated_at
  BEFORE UPDATE ON public.routines
  FOR EACH ROW
  EXECUTE FUNCTION public.routines_set_updated_at();

-- ============================================================================
-- FUNCTION increment_routine_cart (BANK-GRADE TOP 0.01%)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.increment_routine_cart(
  p_routine_id UUID,
  p_creator_id UUID,
  p_variant public.routine_variant
)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 🔒 GUARD ROBUSTE: JWT claim OU current_user (évite faux négatifs)
  IF COALESCE(
    current_setting('request.jwt.claim.role', true),
    current_user
  ) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Access denied: service_role required';
  END IF;

  -- Updates globaux
  UPDATE public.routines
  SET total_carts = total_carts + 1
  WHERE id = p_routine_id;

  -- Updates par variant
  CASE p_variant
    WHEN 'base' THEN
      UPDATE public.routines
      SET base_carts = base_carts + 1
      WHERE id = p_routine_id;

      UPDATE public.creator_routines
      SET base_carts = base_carts + 1
      WHERE routine_id = p_routine_id AND creator_id = p_creator_id;

    WHEN 'upsell_1' THEN
      UPDATE public.routines
      SET upsell_1_carts = upsell_1_carts + 1
      WHERE id = p_routine_id;

      UPDATE public.creator_routines
      SET upsell_1_carts = upsell_1_carts + 1
      WHERE routine_id = p_routine_id AND creator_id = p_creator_id;

    WHEN 'upsell_2' THEN
      UPDATE public.routines
      SET upsell_2_carts = upsell_2_carts + 1
      WHERE id = p_routine_id;

      UPDATE public.creator_routines
      SET upsell_2_carts = upsell_2_carts + 1
      WHERE routine_id = p_routine_id AND creator_id = p_creator_id;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- 🔒 REVOKE COMPLET: PUBLIC + authenticated + anon
REVOKE EXECUTE ON FUNCTION public.increment_routine_cart(UUID, UUID, public.routine_variant) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_routine_cart(UUID, UUID, public.routine_variant) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_routine_cart(UUID, UUID, public.routine_variant) FROM anon;

-- ✅ GRANT service_role ONLY
GRANT EXECUTE ON FUNCTION public.increment_routine_cart(UUID, UUID, public.routine_variant) TO service_role;

-- ============================================================================
-- RLS POLICIES (BANK-GRADE)
-- ============================================================================

ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_checkouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- ROUTINES
DROP POLICY IF EXISTS "anon_read_active_routines" ON public.routines;
CREATE POLICY "anon_read_active_routines" ON public.routines
  FOR SELECT TO anon
  USING (is_active = true);

DROP POLICY IF EXISTS "auth_read_routines" ON public.routines;
CREATE POLICY "auth_read_routines" ON public.routines
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "service_all_routines" ON public.routines;
CREATE POLICY "service_all_routines" ON public.routines
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "admin_write_routines" ON public.routines;
CREATE POLICY "admin_write_routines" ON public.routines
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- CREATOR_ROUTINES
DROP POLICY IF EXISTS "anon_read_creator_routines" ON public.creator_routines;
CREATE POLICY "anon_read_creator_routines" ON public.creator_routines
  FOR SELECT TO anon
  USING (is_active = true);

DROP POLICY IF EXISTS "creators_manage_own_routine" ON public.creator_routines;
CREATE POLICY "creators_manage_own_routine" ON public.creator_routines
  FOR ALL TO authenticated
  USING (
    creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid())
  )
  WITH CHECK (
    creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "service_all_creator_routines" ON public.creator_routines;
CREATE POLICY "service_all_creator_routines" ON public.creator_routines
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ROUTINE_CHECKOUTS
DROP POLICY IF EXISTS "service_all_checkouts" ON public.routine_checkouts;
CREATE POLICY "service_all_checkouts" ON public.routine_checkouts
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ADMIN_USERS
DROP POLICY IF EXISTS "service_all_admin_users" ON public.admin_users;
CREATE POLICY "service_all_admin_users" ON public.admin_users
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
