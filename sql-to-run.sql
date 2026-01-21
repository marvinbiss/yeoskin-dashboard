-- ============================================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- https://supabase.com/dashboard/project/juqlogfujiagtpvxmeux/sql/new
-- ============================================================

-- 1. payout_batch_items (manquante)
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

-- 2. creator_tiers
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

-- 3. Insert default tiers (3 niveaux: Silver, Gold, Platinum)
INSERT INTO creator_tiers (name, min_monthly_revenue, commission_rate, badge_color, badge_icon, benefits, sort_order) VALUES
('Silver', 0, 0.15, '#C0C0C0', 'silver', ARRAY['Taux 15%', 'Support standard'], 1),
('Gold', 1000, 0.17, '#FFD700', 'gold', ARRAY['Taux 17%', 'Support prioritaire'], 2),
('Platinum', 3000, 0.20, '#E5E4E2', 'platinum', ARRAY['Taux 20%', 'Account manager dedie', 'Support VIP'], 3)
ON CONFLICT (name) DO NOTHING;

-- 4. creator_tier_history
CREATE TABLE IF NOT EXISTS creator_tier_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  tier_id UUID REFERENCES creator_tiers(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  monthly_revenue DECIMAL(10,2) DEFAULT 0
);

-- 5. Add tier column to creators
ALTER TABLE creators ADD COLUMN IF NOT EXISTS current_tier_id UUID REFERENCES creator_tiers(id);

-- 6. Set Silver tier for all creators (tier de base)
UPDATE creators
SET current_tier_id = (SELECT id FROM creator_tiers WHERE name = 'Silver')
WHERE current_tier_id IS NULL;

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_payout_batch_items_batch ON payout_batch_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_payout_batch_items_creator ON payout_batch_items(creator_id);
CREATE INDEX IF NOT EXISTS idx_tier_history_creator ON creator_tier_history(creator_id);

-- 8. Enable RLS
ALTER TABLE payout_batch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_tier_history ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies
CREATE POLICY "Anyone can read tiers" ON creator_tiers FOR SELECT USING (true);
CREATE POLICY "Read own payout items" ON payout_batch_items FOR SELECT USING (true);
CREATE POLICY "Read own tier history" ON creator_tier_history FOR SELECT USING (true);

-- Done!
SELECT 'Tables created successfully!' as status;
