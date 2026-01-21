-- ============================================================================
-- YEOSKIN - Page CMS System
-- Migration 014: Content Management for Landing Pages
-- ============================================================================

-- ============================================================================
-- 1. PAGE CONTENT TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS page_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug TEXT NOT NULL,                    -- 'routine-hydratation', 'apply'
  section_key TEXT NOT NULL,                  -- 'hero', 'products', 'reviews'
  content JSONB NOT NULL DEFAULT '{}'::jsonb, -- Flexible content structure
  sort_order INT DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),

  CONSTRAINT unique_page_section UNIQUE(page_slug, section_key)
);

CREATE INDEX IF NOT EXISTS idx_page_content_slug ON page_content(page_slug);
CREATE INDEX IF NOT EXISTS idx_page_content_published ON page_content(page_slug, is_published);

-- ============================================================================
-- 2. PAGE IMAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS page_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug TEXT NOT NULL,
  image_key TEXT NOT NULL,                    -- 'hero-bg', 'product-1', 'review-1-avatar'
  storage_path TEXT NOT NULL,                 -- Path in Supabase Storage
  url TEXT NOT NULL,                          -- Public URL
  alt_text TEXT,
  width INT,
  height INT,
  file_size INT,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id),

  CONSTRAINT unique_page_image UNIQUE(page_slug, image_key)
);

CREATE INDEX IF NOT EXISTS idx_page_images_slug ON page_images(page_slug);

-- ============================================================================
-- 3. CONTENT VERSION HISTORY
-- ============================================================================
CREATE TABLE IF NOT EXISTS page_content_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_content_id UUID NOT NULL REFERENCES page_content(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_history ON page_content_history(page_content_id, created_at DESC);

-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

-- Auto-update timestamp
DROP TRIGGER IF EXISTS update_page_content_updated_at ON page_content;
CREATE TRIGGER update_page_content_updated_at
  BEFORE UPDATE ON page_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Save version history on update
CREATE OR REPLACE FUNCTION save_content_history()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    INSERT INTO page_content_history (page_content_id, content, changed_by)
    VALUES (OLD.id, OLD.content, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_save_content_history ON page_content;
CREATE TRIGGER trigger_save_content_history
  BEFORE UPDATE ON page_content
  FOR EACH ROW
  EXECUTE FUNCTION save_content_history();

-- ============================================================================
-- 5. RLS POLICIES
-- ============================================================================
ALTER TABLE page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_content_history ENABLE ROW LEVEL SECURITY;

-- Public read for published content
DROP POLICY IF EXISTS "Public read published content" ON page_content;
CREATE POLICY "Public read published content"
  ON page_content FOR SELECT
  USING (is_published = true);

-- Admin full access
DROP POLICY IF EXISTS "Admin full access content" ON page_content;
CREATE POLICY "Admin full access content"
  ON page_content FOR ALL
  USING (true);

-- Public read images
DROP POLICY IF EXISTS "Public read images" ON page_images;
CREATE POLICY "Public read images"
  ON page_images FOR SELECT
  USING (true);

-- Admin manage images
DROP POLICY IF EXISTS "Admin manage images" ON page_images;
CREATE POLICY "Admin manage images"
  ON page_images FOR ALL
  USING (true);

-- Admin read history
DROP POLICY IF EXISTS "Admin read history" ON page_content_history;
CREATE POLICY "Admin read history"
  ON page_content_history FOR SELECT
  USING (true);

-- ============================================================================
-- 6. DEFAULT CONTENT FOR ROUTINE HYDRATATION
-- ============================================================================
INSERT INTO page_content (page_slug, section_key, content, sort_order) VALUES

-- Hero Section
('routine-hydratation', 'hero', '{
  "badge": "BEST-SELLER 2025",
  "title": "Routine Hydratation",
  "subtitle": "K-Beauty en 3 Gestes",
  "description": "Le trio essentiel pour une peau éclatante. Nettoyage + Soin + Hydratation en 3 minutes chrono.",
  "stats": {
    "rating": 4.9,
    "reviews": 2847,
    "repurchase_rate": 94
  },
  "urgency": {
    "enabled": true,
    "stock_left": 23,
    "message": "Plus que {stock} en stock"
  }
}'::jsonb, 1),

-- Pricing Section
('routine-hydratation', 'pricing', '{
  "base": {
    "price": 79,
    "original_price": 110,
    "label": "Pack Essentiel",
    "products_count": 3
  },
  "upsell_1": {
    "price": 99,
    "original_price": 140,
    "label": "+1 Produit",
    "badge": "POPULAIRE",
    "extra_product": "Plum Skin Refining Toner"
  },
  "upsell_2": {
    "price": 119,
    "original_price": 170,
    "label": "+2 Produits",
    "badge": "MEILLEURE OFFRE",
    "extra_products": ["Plum Skin Refining Toner", "Revive Eye Serum"]
  }
}'::jsonb, 2),

-- Products Section
('routine-hydratation', 'products', '{
  "section_title": "Votre Routine Complète",
  "section_subtitle": "3 gestes simples pour une peau transformée",
  "items": [
    {
      "id": 1,
      "name": "Low pH Good Morning Gel Cleanser",
      "brand": "COSRX",
      "step": 1,
      "time": "MATIN & SOIR",
      "description": "Nettoie en douceur sans décaper. Formule pH 5.5 qui respecte la barrière cutanée.",
      "ingredients": ["Tea Tree Oil", "BHA 0.5%", "Betaine Salicylate"],
      "satisfaction": 94,
      "duration": "150ml - 4 mois",
      "image_key": "product-1"
    },
    {
      "id": 2,
      "name": "Glow Deep Serum",
      "brand": "Beauty of Joseon",
      "step": 2,
      "time": "MATIN & SOIR",
      "description": "Essence concentrée à base de propolis et niacinamide. Booste l éclat et unifie le teint.",
      "ingredients": ["Propolis 60%", "Niacinamide 2%", "Probiotics"],
      "satisfaction": 97,
      "duration": "30ml - 3 mois",
      "image_key": "product-2"
    },
    {
      "id": 3,
      "name": "Advanced Snail 92 Cream",
      "brand": "COSRX",
      "step": 3,
      "time": "MATIN & SOIR",
      "description": "Nourrit et protège toute la journée. Texture légère, absorption rapide.",
      "ingredients": ["Snail Secretion 92%", "Betaine", "Allantoin"],
      "satisfaction": 89,
      "duration": "100ml - 3 mois",
      "image_key": "product-3"
    }
  ]
}'::jsonb, 3),

-- Reviews Section
('routine-hydratation', 'reviews', '{
  "section_title": "Elles ont transformé leur peau",
  "items": [
    {
      "id": 1,
      "name": "Claire M.",
      "age": 28,
      "skin_type": "Mixte",
      "rating": 5,
      "title": "Ma peau na jamais été aussi belle",
      "text": "Après 3 semaines, ma peau est transformée. Les rougeurs ont disparu et mon teint est unifié.",
      "verified": true,
      "image_key": "review-1"
    },
    {
      "id": 2,
      "name": "Julie R.",
      "age": 34,
      "skin_type": "Sèche",
      "rating": 5,
      "title": "Routine parfaite pour débutantes",
      "text": "Simple, efficace, et les résultats sont visibles dès la première semaine.",
      "verified": true,
      "image_key": "review-2"
    },
    {
      "id": 3,
      "name": "Marie L.",
      "age": 25,
      "skin_type": "Grasse",
      "rating": 5,
      "title": "Fini les brillances",
      "text": "Le cleanser est incroyable, ma peau est matifiée sans être desséchée.",
      "verified": true,
      "image_key": "review-3"
    },
    {
      "id": 4,
      "name": "Sophie D.",
      "age": 31,
      "skin_type": "Sensible",
      "rating": 5,
      "title": "Enfin des produits qui ne m irritent pas",
      "text": "J ai la peau très réactive et ces produits sont ultra doux. Je recommande à 100%.",
      "verified": true,
      "image_key": "review-4"
    }
  ]
}'::jsonb, 4),

-- FAQ Section
('routine-hydratation', 'faq', '{
  "section_title": "Questions Fréquentes",
  "items": [
    {
      "question": "Pour quel type de peau ?",
      "answer": "Cette routine convient à tous les types de peau : normale, mixte, grasse ou sèche. Les formules sont douces et non-comédogènes."
    },
    {
      "question": "Combien de temps durent les produits ?",
      "answer": "Utilisés matin et soir, le pack dure environ 3-4 mois. C est l équivalent de 0.66 euro par jour pour une peau éclatante."
    },
    {
      "question": "Quand vais-je voir les résultats ?",
      "answer": "Les premiers résultats sont visibles dès 7 jours : peau plus souple et teint plus lumineux. Les résultats optimaux apparaissent après 4-6 semaines."
    },
    {
      "question": "Les produits sont-ils naturels ?",
      "answer": "Oui, les formules sont clean et contiennent des ingrédients naturels coréens : propolis, bave d escargot, tea tree. Sans parabènes ni sulfates."
    },
    {
      "question": "Puis-je utiliser avec d autres produits ?",
      "answer": "Absolument. Cette routine de base peut être complétée avec vos sérums ou crèmes solaires habituels."
    }
  ]
}'::jsonb, 5),

-- Guarantees Section
('routine-hydratation', 'guarantees', '{
  "items": [
    {"icon": "truck", "title": "Livraison Offerte", "description": "Dès 50 euros d achat"},
    {"icon": "refresh", "title": "Satisfait ou Remboursé", "description": "30 jours pour changer d avis"},
    {"icon": "shield", "title": "Paiement Sécurisé", "description": "Cryptage SSL"},
    {"icon": "clock", "title": "Expédition 24h", "description": "Commande avant 14h"}
  ]
}'::jsonb, 6),

-- CTA Section
('routine-hydratation', 'cta', '{
  "title": "Prête à transformer ta peau ?",
  "subtitle": "Rejoins +10 000 clientes satisfaites",
  "button_text": "Commander ma routine",
  "urgency_text": "Livraison gratuite aujourd hui"
}'::jsonb, 7)

ON CONFLICT (page_slug, section_key) DO NOTHING;

-- ============================================================================
-- DONE
-- ============================================================================
SELECT 'Migration 014: Page CMS System - Complete!' as status;
