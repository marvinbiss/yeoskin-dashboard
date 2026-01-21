-- ============================================================================
-- YEOSKIN - Product Packs System
-- Admin creates packs, assigns to creators, creators choose from assigned packs
-- ============================================================================

-- ============================================================================
-- 1. PRODUCT PACKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 2. PACK PRODUCTS (which products are in each pack)
-- ============================================================================

CREATE TABLE IF NOT EXISTS pack_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES product_packs(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(pack_id, product_id)
);

-- ============================================================================
-- 3. CREATOR PACKS (which packs are assigned to each creator)
-- ============================================================================

CREATE TABLE IF NOT EXISTS creator_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  pack_id UUID NOT NULL REFERENCES product_packs(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID,
  UNIQUE(creator_id, pack_id)
);

-- Add selected_pack_id to creator_profiles
ALTER TABLE creator_profiles
ADD COLUMN IF NOT EXISTS selected_pack_id UUID REFERENCES product_packs(id);

-- ============================================================================
-- 4. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_pack_products_pack_id ON pack_products(pack_id);
CREATE INDEX IF NOT EXISTS idx_pack_products_product_id ON pack_products(product_id);
CREATE INDEX IF NOT EXISTS idx_creator_packs_creator_id ON creator_packs(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_packs_pack_id ON creator_packs(pack_id);

-- ============================================================================
-- 5. RLS POLICIES
-- ============================================================================

ALTER TABLE product_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pack_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_packs ENABLE ROW LEVEL SECURITY;

-- Public can view active packs
DROP POLICY IF EXISTS "public_read_packs" ON product_packs;
CREATE POLICY "public_read_packs" ON product_packs
FOR SELECT TO public USING (is_active = true);

-- Authenticated can manage packs
DROP POLICY IF EXISTS "auth_all_packs" ON product_packs;
CREATE POLICY "auth_all_packs" ON product_packs
FOR ALL TO authenticated USING (true);

-- Public can view pack products
DROP POLICY IF EXISTS "public_read_pack_products" ON pack_products;
CREATE POLICY "public_read_pack_products" ON pack_products
FOR SELECT TO public USING (true);

-- Authenticated can manage pack products
DROP POLICY IF EXISTS "auth_all_pack_products" ON pack_products;
CREATE POLICY "auth_all_pack_products" ON pack_products
FOR ALL TO authenticated USING (true);

-- Authenticated can view/manage creator packs
DROP POLICY IF EXISTS "auth_all_creator_packs" ON creator_packs;
CREATE POLICY "auth_all_creator_packs" ON creator_packs
FOR ALL TO authenticated USING (true);

-- ============================================================================
-- 6. SAMPLE PACKS
-- ============================================================================

INSERT INTO product_packs (name, slug, description, sort_order) VALUES
  ('Pack Debutant', 'pack-debutant', 'Selection ideale pour debuter en K-Beauty', 1),
  ('Pack Hydratation', 'pack-hydratation', 'Produits hydratants essentiels', 2),
  ('Pack Anti-Age', 'pack-anti-age', 'Routine anti-age complete', 3),
  ('Pack Best Sellers', 'pack-best-sellers', 'Nos produits les plus populaires', 4)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- DONE
-- ============================================================================

SELECT 'Packs created:' as info, COUNT(*) as count FROM product_packs;
