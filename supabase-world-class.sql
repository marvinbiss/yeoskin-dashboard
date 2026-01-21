-- ============================================================================
-- YEOSKIN WORLD-CLASS - WISE + N8N + ANALYTICS + VIP TIERS
-- ============================================================================

-- ============================================================================
-- PHASE 1: PAYOUT BATCH TABLES
-- ============================================================================

-- Batches de paiements
CREATE TABLE IF NOT EXISTS payout_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  executed_at TIMESTAMPTZ,
  total_amount DECIMAL(10,2) DEFAULT 0,
  total_fees DECIMAL(10,2) DEFAULT 0,
  item_count INT DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'partial')),
  n8n_execution_id TEXT,
  wise_batch_id TEXT,
  created_by UUID,
  notes TEXT
);

-- Items individuels du batch
CREATE TABLE IF NOT EXISTS payout_batch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES payout_batches(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES creators(id),
  amount DECIMAL(10,2) NOT NULL,
  fee_amount DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(10,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
  wise_transfer_id TEXT,
  wise_transfer_reference TEXT,
  wise_transfer_status TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_payout_batches_status ON payout_batches(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payout_batches_created ON payout_batches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payout_batch_items_batch ON payout_batch_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_payout_batch_items_creator ON payout_batch_items(creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payout_batch_items_status ON payout_batch_items(status);

-- ============================================================================
-- PHASE 2: VIP TIER TABLES
-- ============================================================================

-- Tiers des createurs
CREATE TABLE IF NOT EXISTS creator_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  min_monthly_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
  commission_rate DECIMAL(4,3) NOT NULL DEFAULT 0.15,
  badge_color TEXT DEFAULT '#CD7F32',
  badge_icon TEXT DEFAULT 'bronze',
  benefits TEXT[] DEFAULT ARRAY[]::TEXT[],
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default tiers
INSERT INTO creator_tiers (name, min_monthly_revenue, commission_rate, badge_color, badge_icon, benefits, sort_order) VALUES
('Bronze', 0, 0.15, '#CD7F32', 'bronze', ARRAY['Taux de base 15%', 'Support standard'], 1),
('Silver', 500, 0.17, '#C0C0C0', 'silver', ARRAY['Taux 17%', 'Support prioritaire', 'Acces early aux nouveaux produits'], 2),
('Gold', 1500, 0.20, '#FFD700', 'gold', ARRAY['Taux 20%', 'Support VIP', 'Produits gratuits mensuels'], 3),
('Platinum', 3000, 0.25, '#E5E4E2', 'platinum', ARRAY['Taux 25%', 'Account manager dedie', 'Collaboration exclusive'], 4)
ON CONFLICT (name) DO NOTHING;

-- Ajouter colonne tier aux createurs si pas existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'creators' AND column_name = 'current_tier_id') THEN
    ALTER TABLE creators ADD COLUMN current_tier_id UUID REFERENCES creator_tiers(id);
  END IF;
END $$;

-- Historique des tiers
CREATE TABLE IF NOT EXISTS creator_tier_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  tier_id UUID REFERENCES creator_tiers(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  monthly_revenue DECIMAL(10,2) DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_tier_history_creator ON creator_tier_history(creator_id, started_at DESC);

-- ============================================================================
-- PHASE 3: ANALYTICS VIEWS
-- ============================================================================

-- Vue analytics mensuelle
CREATE OR REPLACE VIEW analytics_monthly AS
SELECT
  DATE_TRUNC('month', c.created_at)::DATE as month,
  COUNT(DISTINCT c.creator_id) as active_creators,
  COUNT(c.id) as total_commissions,
  COALESCE(SUM(c.order_total), 0) as total_sales,
  COALESCE(SUM(c.commission_amount), 0) as total_commissions_amount,
  COALESCE(AVG(c.commission_amount), 0) as avg_commission,
  COUNT(CASE WHEN c.status = 'paid' THEN 1 END) as paid_commissions,
  COUNT(CASE WHEN c.status = 'pending' THEN 1 END) as pending_commissions
FROM commissions c
WHERE c.status != 'canceled'
GROUP BY DATE_TRUNC('month', c.created_at)
ORDER BY month DESC;

-- Vue analytics par createur
CREATE OR REPLACE VIEW analytics_by_creator AS
SELECT
  c.id as creator_id,
  c.email,
  c.discount_code,
  c.status as creator_status,
  c.commission_rate,
  COUNT(co.id) as total_commissions,
  COALESCE(SUM(co.order_total), 0) as total_sales,
  COALESCE(SUM(co.commission_amount), 0) as total_earned,
  COALESCE(AVG(co.commission_amount), 0) as avg_commission,
  COUNT(CASE WHEN co.status = 'paid' THEN 1 END) as paid_commissions,
  COUNT(CASE WHEN co.status = 'pending' THEN 1 END) as pending_commissions,
  COUNT(CASE WHEN co.status = 'payable' THEN 1 END) as payable_commissions,
  MAX(co.created_at) as last_commission_at
FROM creators c
LEFT JOIN commissions co ON c.id = co.creator_id
GROUP BY c.id, c.email, c.discount_code, c.status, c.commission_rate;

-- ============================================================================
-- PHASE 4: FUNCTIONS
-- ============================================================================

-- Fonction top createurs
CREATE OR REPLACE FUNCTION get_top_creators(limit_count INT DEFAULT 10)
RETURNS TABLE (
  creator_id UUID,
  email TEXT,
  discount_code TEXT,
  total_sales DECIMAL,
  total_commissions DECIMAL,
  commission_count BIGINT,
  paid_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.email,
    c.discount_code,
    COALESCE(SUM(co.order_total), 0)::DECIMAL as total_sales,
    COALESCE(SUM(co.commission_amount), 0)::DECIMAL as total_commissions,
    COUNT(co.id) as commission_count,
    COUNT(CASE WHEN co.status = 'paid' THEN 1 END) as paid_count
  FROM creators c
  LEFT JOIN commissions co ON c.id = co.creator_id
  GROUP BY c.id, c.email, c.discount_code
  ORDER BY total_commissions DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction stats createur pour son dashboard
CREATE OR REPLACE FUNCTION get_creator_analytics(p_creator_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_monthly JSONB;
  v_this_month DECIMAL;
  v_last_month DECIMAL;
BEGIN
  -- Stats ce mois
  SELECT COALESCE(SUM(commission_amount), 0) INTO v_this_month
  FROM commissions
  WHERE creator_id = p_creator_id
  AND created_at >= DATE_TRUNC('month', NOW())
  AND status != 'canceled';

  -- Stats mois dernier
  SELECT COALESCE(SUM(commission_amount), 0) INTO v_last_month
  FROM commissions
  WHERE creator_id = p_creator_id
  AND created_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
  AND created_at < DATE_TRUNC('month', NOW())
  AND status != 'canceled';

  -- Stats mensuelles (6 derniers mois)
  SELECT COALESCE(jsonb_agg(row_to_json(m) ORDER BY m.month DESC), '[]'::jsonb)
  INTO v_monthly
  FROM (
    SELECT
      DATE_TRUNC('month', created_at)::DATE as month,
      COUNT(*) as commissions,
      SUM(commission_amount) as revenue
    FROM commissions
    WHERE creator_id = p_creator_id
    AND created_at >= NOW() - INTERVAL '6 months'
    AND status != 'canceled'
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month DESC
  ) m;

  v_result := jsonb_build_object(
    'this_month', v_this_month,
    'last_month', v_last_month,
    'change', v_this_month - v_last_month,
    'change_percent', CASE WHEN v_last_month > 0 THEN ROUND((v_this_month - v_last_month) / v_last_month * 100, 1) ELSE 0 END,
    'monthly', v_monthly
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les createurs payables (pour admin payouts)
CREATE OR REPLACE FUNCTION get_payable_creators(min_amount DECIMAL DEFAULT 0)
RETURNS TABLE (
  creator_id UUID,
  email TEXT,
  discount_code TEXT,
  payable_amount DECIMAL,
  payable_count BIGINT,
  has_bank_account BOOLEAN,
  bank_verified BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.email,
    c.discount_code,
    COALESCE(SUM(co.commission_amount), 0)::DECIMAL as payable_amount,
    COUNT(co.id) as payable_count,
    EXISTS(SELECT 1 FROM creator_bank_accounts ba WHERE ba.creator_id = c.id) as has_bank_account,
    COALESCE((SELECT ba.is_verified FROM creator_bank_accounts ba WHERE ba.creator_id = c.id LIMIT 1), false) as bank_verified
  FROM creators c
  LEFT JOIN commissions co ON c.id = co.creator_id AND co.status = 'payable'
  WHERE c.status = 'active'
  GROUP BY c.id, c.email, c.discount_code
  HAVING COALESCE(SUM(co.commission_amount), 0) >= min_amount
  ORDER BY payable_amount DESC;
END;
$$ LANGUAGE plpgsql;

-- Fonction mise a jour tiers
CREATE OR REPLACE FUNCTION update_creator_tier(p_creator_id UUID)
RETURNS UUID AS $$
DECLARE
  v_monthly_revenue DECIMAL;
  v_new_tier_id UUID;
  v_current_tier_id UUID;
BEGIN
  -- Calculer revenus du mois
  SELECT COALESCE(SUM(commission_amount), 0) INTO v_monthly_revenue
  FROM commissions
  WHERE creator_id = p_creator_id
  AND created_at >= DATE_TRUNC('month', NOW())
  AND status != 'canceled';

  -- Trouver le tier appropriate
  SELECT id INTO v_new_tier_id
  FROM creator_tiers
  WHERE min_monthly_revenue <= v_monthly_revenue
  ORDER BY min_monthly_revenue DESC
  LIMIT 1;

  -- Obtenir tier actuel
  SELECT current_tier_id INTO v_current_tier_id
  FROM creators
  WHERE id = p_creator_id;

  -- Si changement
  IF v_new_tier_id IS DISTINCT FROM v_current_tier_id THEN
    -- Fermer l'ancien historique
    UPDATE creator_tier_history
    SET ended_at = NOW()
    WHERE creator_id = p_creator_id AND ended_at IS NULL;

    -- Creer nouveau historique
    INSERT INTO creator_tier_history (creator_id, tier_id, monthly_revenue)
    VALUES (p_creator_id, v_new_tier_id, v_monthly_revenue);

    -- Mettre a jour createur
    UPDATE creators
    SET current_tier_id = v_new_tier_id
    WHERE id = p_creator_id;

    -- Notification si upgrade
    IF v_current_tier_id IS NOT NULL AND v_new_tier_id != v_current_tier_id THEN
      INSERT INTO creator_notifications (creator_id, type, title, message, read)
      VALUES (
        p_creator_id,
        'tier_change',
        'Changement de niveau !',
        'Tu es passe au niveau ' || (SELECT name FROM creator_tiers WHERE id = v_new_tier_id),
        false
      );
    END IF;
  END IF;

  RETURN v_new_tier_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir le tier d'un createur avec details
CREATE OR REPLACE FUNCTION get_creator_tier(p_creator_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_current_tier RECORD;
  v_next_tier RECORD;
  v_monthly_revenue DECIMAL;
BEGIN
  -- Revenus du mois
  SELECT COALESCE(SUM(commission_amount), 0) INTO v_monthly_revenue
  FROM commissions
  WHERE creator_id = p_creator_id
  AND created_at >= DATE_TRUNC('month', NOW())
  AND status != 'canceled';

  -- Tier actuel
  SELECT t.* INTO v_current_tier
  FROM creator_tiers t
  JOIN creators c ON c.current_tier_id = t.id
  WHERE c.id = p_creator_id;

  -- Si pas de tier, prendre Bronze
  IF v_current_tier IS NULL THEN
    SELECT * INTO v_current_tier
    FROM creator_tiers
    ORDER BY min_monthly_revenue ASC
    LIMIT 1;
  END IF;

  -- Prochain tier
  SELECT * INTO v_next_tier
  FROM creator_tiers
  WHERE min_monthly_revenue > v_current_tier.min_monthly_revenue
  ORDER BY min_monthly_revenue ASC
  LIMIT 1;

  v_result := jsonb_build_object(
    'current', jsonb_build_object(
      'id', v_current_tier.id,
      'name', v_current_tier.name,
      'commission_rate', v_current_tier.commission_rate,
      'badge_color', v_current_tier.badge_color,
      'badge_icon', v_current_tier.badge_icon,
      'benefits', v_current_tier.benefits
    ),
    'next', CASE WHEN v_next_tier IS NOT NULL THEN jsonb_build_object(
      'id', v_next_tier.id,
      'name', v_next_tier.name,
      'min_revenue', v_next_tier.min_monthly_revenue,
      'commission_rate', v_next_tier.commission_rate
    ) ELSE NULL END,
    'monthly_revenue', v_monthly_revenue,
    'progress', CASE WHEN v_next_tier IS NOT NULL
      THEN LEAST(100, ROUND((v_monthly_revenue / v_next_tier.min_monthly_revenue) * 100, 1))
      ELSE 100
    END,
    'remaining', CASE WHEN v_next_tier IS NOT NULL
      THEN GREATEST(0, v_next_tier.min_monthly_revenue - v_monthly_revenue)
      ELSE 0
    END
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PHASE 5: RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE payout_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_batch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_tier_history ENABLE ROW LEVEL SECURITY;

-- Policies pour payout_batches (admin only read)
DROP POLICY IF EXISTS "Admin can read payout_batches" ON payout_batches;
CREATE POLICY "Admin can read payout_batches" ON payout_batches
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service can manage payout_batches" ON payout_batches;
CREATE POLICY "Service can manage payout_batches" ON payout_batches
  FOR ALL USING (true);

-- Policies pour payout_batch_items
DROP POLICY IF EXISTS "Admin can read payout_batch_items" ON payout_batch_items;
CREATE POLICY "Admin can read payout_batch_items" ON payout_batch_items
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Creator can read own payout_items" ON payout_batch_items;
CREATE POLICY "Creator can read own payout_items" ON payout_batch_items
  FOR SELECT USING (
    creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Service can manage payout_batch_items" ON payout_batch_items;
CREATE POLICY "Service can manage payout_batch_items" ON payout_batch_items
  FOR ALL USING (true);

-- Policies pour creator_tiers (public read)
DROP POLICY IF EXISTS "Anyone can read tiers" ON creator_tiers;
CREATE POLICY "Anyone can read tiers" ON creator_tiers
  FOR SELECT USING (true);

-- Policies pour creator_tier_history
DROP POLICY IF EXISTS "Creator can read own tier history" ON creator_tier_history;
CREATE POLICY "Creator can read own tier history" ON creator_tier_history
  FOR SELECT USING (
    creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
  );

-- ============================================================================
-- INITIALISATION: Set Bronze tier for all creators without tier
-- ============================================================================
UPDATE creators
SET current_tier_id = (SELECT id FROM creator_tiers WHERE name = 'Bronze')
WHERE current_tier_id IS NULL;

-- ============================================================================
-- DONE
-- ============================================================================
SELECT 'World-Class SQL Complete!' as status;
