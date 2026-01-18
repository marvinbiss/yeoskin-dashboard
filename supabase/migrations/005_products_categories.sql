-- ============================================================================
-- YEOSKIN - Products & Categories Schema
-- MODULE 2: E-commerce
-- ============================================================================

-- ============================================================================
-- 1. PRODUCT CATEGORIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES product_categories(id),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 2. PRODUCTS TABLE (if not exists, update if exists)
-- ============================================================================

DO $$
BEGIN
  -- Add missing columns to products if table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products') THEN
    -- Add columns if they don't exist
    ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_at_price DECIMAL(10,2);
    ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 10;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS categories UUID[];
    ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT[];
    ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[];
    ALTER TABLE products ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT false;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_title TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_description TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS affiliate_url TEXT;

    RAISE NOTICE 'Products table updated with new columns';
  ELSE
    -- Create products table
    CREATE TABLE products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      slug TEXT UNIQUE,
      short_description TEXT,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      compare_at_price DECIMAL(10,2),
      sku TEXT UNIQUE,
      stock_quantity INTEGER DEFAULT 0,
      low_stock_threshold INTEGER DEFAULT 10,
      categories UUID[],
      tags TEXT[],
      image_url TEXT,
      images TEXT[],
      is_active BOOLEAN DEFAULT false,
      is_bestseller BOOLEAN DEFAULT false,
      meta_title TEXT,
      meta_description TEXT,
      affiliate_url TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    RAISE NOTICE 'Products table created';
  END IF;
END $$;

-- Create index for better search performance
CREATE INDEX IF NOT EXISTS idx_products_name ON products USING gin(to_tsvector('french', name));
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_categories ON products USING gin(categories);

-- ============================================================================
-- 3. STORAGE BUCKET FOR PRODUCTS
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880;

-- Storage policies for products bucket
DROP POLICY IF EXISTS "Public view product images" ON storage.objects;
CREATE POLICY "Public view product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

DROP POLICY IF EXISTS "Admin upload product images" ON storage.objects;
CREATE POLICY "Admin upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

DROP POLICY IF EXISTS "Admin update product images" ON storage.objects;
CREATE POLICY "Admin update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'products');

DROP POLICY IF EXISTS "Admin delete product images" ON storage.objects;
CREATE POLICY "Admin delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'products');

-- ============================================================================
-- 4. RLS POLICIES FOR PRODUCTS
-- ============================================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Public can view active products
DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products" ON products
FOR SELECT TO public
USING (is_active = true);

-- Authenticated users have full access (for admin)
DROP POLICY IF EXISTS "auth_all_products" ON products;
CREATE POLICY "auth_all_products" ON products
FOR ALL TO authenticated
USING (true);

-- Public can view active categories
DROP POLICY IF EXISTS "public_read_categories" ON product_categories;
CREATE POLICY "public_read_categories" ON product_categories
FOR SELECT TO public
USING (is_active = true);

-- Authenticated users have full access to categories
DROP POLICY IF EXISTS "auth_all_categories" ON product_categories;
CREATE POLICY "auth_all_categories" ON product_categories
FOR ALL TO authenticated
USING (true);

-- ============================================================================
-- 5. SAMPLE CATEGORIES
-- ============================================================================

INSERT INTO product_categories (name, slug, description, sort_order) VALUES
  ('Nettoyants', 'nettoyants', 'Huiles démaquillantes, mousses et gels nettoyants', 1),
  ('Toners', 'toners', 'Lotions toniques et essences', 2),
  ('Sérums', 'serums', 'Sérums et ampoules concentrées', 3),
  ('Crèmes', 'cremes', 'Crèmes hydratantes et anti-âge', 4),
  ('Masques', 'masques', 'Sheet masks et masques de nuit', 5),
  ('Solaires', 'solaires', 'Protection solaire SPF', 6),
  ('Maquillage', 'maquillage', 'BB crèmes, cushions et lip tints', 7)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 6. SAMPLE PRODUCTS (for testing)
-- ============================================================================

INSERT INTO products (name, slug, short_description, price, compare_at_price, sku, stock_quantity, is_active, is_bestseller, image_url) VALUES
  ('COSRX Snail Mucin Essence', 'cosrx-snail-mucin', 'Essence à la bave d''escargot hydratante', 23.90, 29.90, 'COSRX-001', 50, true, true, NULL),
  ('Beauty of Joseon Glow Serum', 'boj-glow-serum', 'Sérum au propolis et niacinamide', 18.50, NULL, 'BOJ-001', 35, true, true, NULL),
  ('SOME BY MI AHA BHA PHA Toner', 'sbm-aha-bha-pha', 'Toner miracle 30 jours', 15.90, 19.90, 'SBM-001', 45, true, false, NULL),
  ('Isntree Hyaluronic Acid Toner', 'isntree-ha-toner', 'Toner hydratant à l''acide hyaluronique', 21.00, NULL, 'ISN-001', 28, true, false, NULL),
  ('Round Lab Dokdo Cleanser', 'roundlab-dokdo', 'Gel nettoyant doux aux minéraux de Dokdo', 16.90, NULL, 'RL-001', 40, true, true, NULL)
ON CONFLICT (sku) DO NOTHING;

-- ============================================================================
-- DONE
-- ============================================================================
