-- ============================================================
-- FIX RLS POLICIES FOR CREATOR_TIERS AND SYSTEM_HEALTH
-- ============================================================

-- 1. Verifier si creator_tiers existe, sinon la creer
CREATE TABLE IF NOT EXISTS creator_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  min_monthly_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
  commission_rate DECIMAL(4,3) NOT NULL DEFAULT 0.15,
  badge_color TEXT DEFAULT '#C0C0C0',
  badge_icon TEXT DEFAULT 'silver',
  benefits TEXT[] DEFAULT ARRAY[]::TEXT[],
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Inserer les tiers par defaut
INSERT INTO creator_tiers (name, min_monthly_revenue, commission_rate, badge_color, badge_icon, benefits, sort_order) VALUES
('Silver', 0, 0.15, '#C0C0C0', 'silver', ARRAY['Taux 15%', 'Support standard'], 1),
('Gold', 1000, 0.17, '#FFD700', 'gold', ARRAY['Taux 17%', 'Support prioritaire'], 2),
('Platinum', 3000, 0.20, '#E5E4E2', 'platinum', ARRAY['Taux 20%', 'Account manager dedie', 'Support VIP'], 3)
ON CONFLICT (name) DO NOTHING;

-- 3. Enable RLS et policies
ALTER TABLE creator_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read tiers" ON creator_tiers;
CREATE POLICY "Anyone can read tiers" ON creator_tiers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role full access tiers" ON creator_tiers;
CREATE POLICY "Service role full access tiers" ON creator_tiers FOR ALL USING (true);

-- 4. Error logs table
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type TEXT NOT NULL,
  error_source TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_details JSONB,
  user_id UUID,
  creator_id UUID,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read errors" ON error_logs;
CREATE POLICY "Anyone can read errors" ON error_logs FOR SELECT USING (true);

-- 5. Payout batch items (si n'existe pas)
CREATE TABLE IF NOT EXISTS payout_batch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID,
  creator_id UUID,
  amount DECIMAL(10,2) NOT NULL,
  fee_amount DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(10,2),
  status TEXT DEFAULT 'pending',
  wise_transfer_id TEXT,
  wise_transfer_reference TEXT,
  wise_transfer_status TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

ALTER TABLE payout_batch_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read payout items" ON payout_batch_items;
CREATE POLICY "Anyone can read payout items" ON payout_batch_items FOR SELECT USING (true);

-- 6. Recreer la vue system_health
DROP VIEW IF EXISTS system_health;
CREATE OR REPLACE VIEW system_health AS
SELECT
  (SELECT COUNT(*) FROM error_logs WHERE severity = 'critical' AND NOT resolved) as critical_errors,
  (SELECT COUNT(*) FROM error_logs WHERE created_at >= NOW() - INTERVAL '24 hours') as errors_24h,
  (SELECT COUNT(*) FROM payout_batch_items WHERE status = 'failed') as failed_payouts,
  (SELECT COUNT(*) FROM payout_batch_items WHERE status = 'processing' AND created_at < NOW() - INTERVAL '48 hours') as stuck_payouts,
  (SELECT COUNT(*) FROM creators c WHERE NOT EXISTS (SELECT 1 FROM creator_bank_accounts WHERE creator_id = c.id AND iban IS NOT NULL)) as creators_without_iban,
  CASE
    WHEN (SELECT COUNT(*) FROM error_logs WHERE severity = 'critical' AND NOT resolved) > 0 THEN 'CRITICAL'
    WHEN (SELECT COUNT(*) FROM error_logs WHERE created_at >= NOW() - INTERVAL '1 hour') > 5 THEN 'WARNING'
    ELSE 'HEALTHY'
  END as overall_status;

-- 7. Grant select on view
GRANT SELECT ON system_health TO anon, authenticated;

-- Done
SELECT 'FIX RLS COMPLETE!' as status;
SELECT * FROM creator_tiers;
SELECT * FROM system_health;
