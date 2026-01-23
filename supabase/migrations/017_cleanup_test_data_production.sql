-- ============================================================================
-- Migration 017: Cleanup Test Data + Production Content
-- Removes all test data and sets production values for routine-hydratation
-- ============================================================================

-- ============================================================================
-- 1. CLEANUP TEST DATA (order matters for FK constraints)
-- ============================================================================

-- 1a. Delete all routine_checkouts (test records)
DELETE FROM routine_checkouts;

-- 1b. Delete all creator_routines (test assignments)
DELETE FROM creator_routines;

-- 1c. Delete test routine (slug = 'hydratation', the one with fake variant IDs)
DELETE FROM routines WHERE slug = 'hydratation';

-- 1d. Delete all test creators
DELETE FROM creators;

-- ============================================================================
-- 2. UPDATE PRODUCTION ROUTINE (routine-hydratation)
-- ============================================================================

UPDATE routines SET
  base_price = 59.90,
  upsell_1_price = 69.90,
  upsell_1_original_price = 89.80,
  upsell_2_price = 79.90,
  upsell_2_original_price = 111.75,
  base_products = '[
    {"name": "Advanced Snail 96 Mucin Essence", "brand": "COSRX"},
    {"name": "Advanced Snail 92 All In One Cream", "brand": "COSRX"},
    {"name": "Oil-Free Ultra-Moisturizing Lotion", "brand": "COSRX"}
  ]'::jsonb,
  upsell_1_product = '{"name": "Revive Serum Ginseng+Snail Mucin", "brand": "Beauty of Joseon"}'::jsonb,
  upsell_2_products = '[
    {"name": "Glow Deep Serum Rice+Alpha Arbutin", "brand": "Beauty of Joseon"},
    {"name": "Relief Sun Rice+Probiotics", "brand": "Beauty of Joseon"}
  ]'::jsonb,
  title = 'Routine Hydratation K-Beauty',
  updated_at = NOW()
WHERE slug = 'routine-hydratation';

-- ============================================================================
-- 3. UPDATE CMS CONTENT (page_content) - Production values
-- ============================================================================

-- 3a. Hero Section
UPDATE page_content SET
  content = '{
    "badge": "BEST-SELLER 2025",
    "title": "Routine Hydratation K-Beauty",
    "subtitle": "3 Produits Essentiels",
    "description": "Transforme ta peau en 4 semaines avec une routine coréenne approuvée par +2000 personnes.",
    "stats": {
      "rating": 4.9,
      "reviews": 2847,
      "repurchase_rate": 94
    }
  }'::jsonb,
  updated_at = NOW()
WHERE page_slug = 'routine-hydratation' AND section_key = 'hero';

-- 3b. Pricing Section
UPDATE page_content SET
  content = '{
    "base": {
      "price": 59.90,
      "original_price": 70.85,
      "label": "Pack Essentiel",
      "products_count": 3
    },
    "upsell_1": {
      "price": 69.90,
      "original_price": 89.80,
      "label": "+1 Produit",
      "badge": "POPULAIRE",
      "extra_product": "Revive Serum Ginseng+Snail Mucin"
    },
    "upsell_2": {
      "price": 79.90,
      "original_price": 111.75,
      "label": "+2 Produits",
      "badge": "MEILLEURE OFFRE",
      "extra_products": ["Glow Deep Serum Rice+Alpha Arbutin", "Relief Sun Rice+Probiotics"]
    }
  }'::jsonb,
  updated_at = NOW()
WHERE page_slug = 'routine-hydratation' AND section_key = 'pricing';

-- 3c. Products Section
UPDATE page_content SET
  content = '{
    "section_title": "Votre Routine Complète",
    "section_subtitle": "3 gestes simples pour une peau transformée",
    "items": [
      {
        "id": 1,
        "name": "Advanced Snail 96 Mucin Essence",
        "brand": "COSRX",
        "step": 1,
        "time": "MATIN & SOIR",
        "description": "Essence légère à 96% de mucine d escargot. Hydrate en profondeur et répare la barrière cutanée.",
        "ingredients": ["Snail Mucin 96%", "Hyaluronic Acid", "Allantoin"],
        "satisfaction": 97,
        "duration": "100ml - 3 mois",
        "image_key": "product-1"
      },
      {
        "id": 2,
        "name": "Advanced Snail 92 All In One Cream",
        "brand": "COSRX",
        "step": 2,
        "time": "MATIN & SOIR",
        "description": "Crème tout-en-un enrichie en mucine d escargot. Nourrit, répare et protège la peau.",
        "ingredients": ["Snail Secretion 92%", "Betaine", "Allantoin"],
        "satisfaction": 94,
        "duration": "100ml - 3 mois",
        "image_key": "product-2"
      },
      {
        "id": 3,
        "name": "Oil-Free Ultra-Moisturizing Lotion",
        "brand": "COSRX",
        "step": 3,
        "time": "MATIN & SOIR",
        "description": "Lotion hydratante sans huile à base de sève de bouleau. Hydratation longue durée, fini mat.",
        "ingredients": ["Birch Sap 70%", "Hyaluronic Acid", "Betaine"],
        "satisfaction": 91,
        "duration": "100ml - 3 mois",
        "image_key": "product-3"
      }
    ]
  }'::jsonb,
  updated_at = NOW()
WHERE page_slug = 'routine-hydratation' AND section_key = 'products';

-- 3d. Reviews Section
UPDATE page_content SET
  content = '{
    "section_title": "Elles ont transformé leur peau",
    "items": [
      {
        "id": 1,
        "name": "Marie L.",
        "age": 28,
        "skin_type": "Mixte",
        "rating": 5,
        "title": "Ma peau a changé en 2 semaines",
        "text": "Je suis bluffée. Mes pores sont resserrés, mon teint est plus uniforme et j ai enfin trouvé une routine simple qui fonctionne.",
        "verified": true
      },
      {
        "id": 2,
        "name": "Sophie K.",
        "age": 34,
        "skin_type": "Sèche",
        "rating": 5,
        "title": "Bye bye tiraillements",
        "text": "Enfin une crème qui hydrate vraiment sans laisser de film gras. La texture de l essence est parfaite, absorption instantanée.",
        "verified": true
      },
      {
        "id": 3,
        "name": "Emma R.",
        "age": 25,
        "skin_type": "Grasse",
        "rating": 5,
        "title": "Routine game changer",
        "text": "J avais peur que ce soit trop riche pour ma peau grasse mais pas du tout. La lotion oil-free est parfaite, ma peau est matifiée mais confortable.",
        "verified": true
      },
      {
        "id": 4,
        "name": "Léa M.",
        "age": 31,
        "skin_type": "Sensible",
        "rating": 4,
        "title": "Doux et efficace",
        "text": "Super routine pour les peaux sensibles comme la mienne. Aucune réaction, et ma peau est plus éclatante après 1 mois.",
        "verified": true
      }
    ]
  }'::jsonb,
  updated_at = NOW()
WHERE page_slug = 'routine-hydratation' AND section_key = 'reviews';

-- 3e. FAQ Section
UPDATE page_content SET
  content = '{
    "section_title": "Questions Fréquentes",
    "items": [
      {
        "question": "Pour quel type de peau ?",
        "answer": "Tous types : grasse, sèche, mixte, sensible. Les formules sont non-comédogènes et hypoallergéniques, testées dermatologiquement."
      },
      {
        "question": "Combien de temps dure le pack ?",
        "answer": "3-4 mois avec utilisation quotidienne matin et soir. C est l un des meilleurs rapports qualité-prix du marché K-beauty."
      },
      {
        "question": "Quand vais-je voir des résultats ?",
        "answer": "Hydratation immédiate dès la première application. Éclat visible en 1 semaine. Texture significativement améliorée en 4 semaines."
      },
      {
        "question": "Puis-je l utiliser avec d autres produits ?",
        "answer": "Oui, cette routine est une base parfaite. Tu peux ajouter un SPF le matin et un sérum ciblé (vitamine C, rétinol) selon tes besoins."
      },
      {
        "question": "Livraison et retours ?",
        "answer": "Livraison gratuite en France métropolitaine, expédition sous 24h. 30 jours satisfait ou remboursé, même si les produits sont entamés."
      }
    ]
  }'::jsonb,
  updated_at = NOW()
WHERE page_slug = 'routine-hydratation' AND section_key = 'faq';

-- 3f. CTA Section
UPDATE page_content SET
  content = '{
    "title": "Prête à transformer ta peau ?",
    "subtitle": "Rejoins +2000 clientes satisfaites",
    "button_text": "Commander ma routine",
    "urgency_text": "Livraison gratuite aujourd hui"
  }'::jsonb,
  updated_at = NOW()
WHERE page_slug = 'routine-hydratation' AND section_key = 'cta';

-- ============================================================================
-- DONE
-- ============================================================================
SELECT 'Migration 017: Cleanup test data + Production content - Complete!' as status;
