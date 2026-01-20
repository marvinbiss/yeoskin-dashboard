-- ============================================================================
-- YEOSKIN DASHBOARD - PAYOUT CONFIG & WISE WEBHOOK SECURITY
-- ============================================================================
-- Delta implementation:
-- 1. payout_config - Centralized configuration
-- 2. wise_webhook_ips - Dynamic IP allowlist for Wise webhooks
-- 3. compute_batch_status() - Automatic batch status calculation
-- ============================================================================

-- ============================================================================
-- 1. PAYOUT CONFIG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS payout_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Seed default configuration
INSERT INTO payout_config (key, value, description) VALUES
  ('default_delay_hours', '48', 'Délai entre création batch et exécution (heures)'),
  ('min_payout_amount', '10.00', 'Montant minimum par créateur pour déclencher payout (EUR)'),
  ('wise_environment', 'sandbox', 'sandbox | production'),
  ('batch_max_creators', '100', 'Nombre maximum de créateurs par batch'),
  ('retry_max_attempts', '3', 'Nombre maximum de retries pour item failed'),
  ('wise_webhook_validation', 'signature', 'signature | ip | signature+ip | none (dev only)'),
  ('wise_api_rate_limit', '10', 'Nombre max appels Wise API simultanés'),
  ('payout_enabled', 'true', 'Active/désactive le système de payout')
ON CONFLICT (key) DO NOTHING;

-- RLS
ALTER TABLE payout_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Payout config readable by authenticated" ON payout_config
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Payout config writable by admins" ON payout_config
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE admin_profiles.id = auth.uid()
      AND admin_profiles.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE admin_profiles.id = auth.uid()
      AND admin_profiles.role IN ('super_admin', 'admin')
    )
  );

COMMENT ON TABLE payout_config IS 'Configuration centralisée du système de payout. Modifiable par admins.';

-- ============================================================================
-- 2. WISE WEBHOOK IPS TABLE (Dynamic Allowlist)
-- ============================================================================
CREATE TABLE IF NOT EXISTS wise_webhook_ips (
  ip_cidr TEXT PRIMARY KEY,
  description TEXT,
  active BOOLEAN DEFAULT true,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ
);

-- Seed official Wise webhook IPs (verify at https://api-docs.wise.com)
INSERT INTO wise_webhook_ips (ip_cidr, description) VALUES
  ('52.58.95.0/24', 'Wise EU webhook IP range'),
  ('3.123.25.203/32', 'Wise EU webhook IP'),
  ('52.29.72.0/24', 'Wise EU backup range'),
  ('18.184.0.0/15', 'Wise EU extended range'),
  ('52.49.220.0/24', 'Wise webhook range (documented)'),
  ('52.51.78.0/24', 'Wise webhook range (documented)')
ON CONFLICT (ip_cidr) DO NOTHING;

CREATE INDEX idx_wise_webhook_ips_active ON wise_webhook_ips(active) WHERE active = true;

-- RLS
ALTER TABLE wise_webhook_ips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Wise IPs readable by authenticated" ON wise_webhook_ips
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Wise IPs writable by admins" ON wise_webhook_ips
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE admin_profiles.id = auth.uid()
      AND admin_profiles.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE admin_profiles.id = auth.uid()
      AND admin_profiles.role IN ('super_admin', 'admin')
    )
  );

COMMENT ON TABLE wise_webhook_ips IS
'Wise webhook IP allowlist dynamique.
Mettre à jour depuis https://api-docs.wise.com/api-reference/webhook
Les IPs inconnues sont loggées pour review admin.';

-- ============================================================================
-- 3. FUNCTION: Get payout config value
-- ============================================================================
CREATE OR REPLACE FUNCTION get_payout_config(p_key TEXT, p_default TEXT DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_value TEXT;
BEGIN
  SELECT value INTO v_value
  FROM payout_config
  WHERE key = p_key;

  RETURN COALESCE(v_value, p_default);
END;
$$;

-- ============================================================================
-- 4. FUNCTION: Check if IP is in Wise allowlist
-- ============================================================================
CREATE OR REPLACE FUNCTION is_wise_ip_allowed(p_ip TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_allowed BOOLEAN := false;
BEGIN
  -- Check if IP matches any active CIDR range
  SELECT EXISTS (
    SELECT 1 FROM wise_webhook_ips
    WHERE active = true
    AND (
      -- Exact match
      ip_cidr = p_ip
      OR ip_cidr = p_ip || '/32'
      -- CIDR match using PostgreSQL inet operators
      OR p_ip::inet <<= ip_cidr::inet
    )
  ) INTO v_allowed;

  -- Update last_seen_at if allowed
  IF v_allowed THEN
    UPDATE wise_webhook_ips
    SET last_seen_at = NOW()
    WHERE active = true
    AND (ip_cidr = p_ip OR ip_cidr = p_ip || '/32' OR p_ip::inet <<= ip_cidr::inet);
  END IF;

  RETURN v_allowed;
END;
$$;

-- ============================================================================
-- 5. FUNCTION: Compute batch status from items
-- ============================================================================
CREATE OR REPLACE FUNCTION compute_batch_status(p_batch_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_items INT;
  v_paid_items INT;
  v_failed_items INT;
  v_processing_items INT;
  v_scheduled_items INT;
  v_status TEXT;
BEGIN
  -- Count items by status
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'paid'),
    COUNT(*) FILTER (WHERE status = 'failed'),
    COUNT(*) FILTER (WHERE status = 'processing'),
    COUNT(*) FILTER (WHERE status IN ('pending', 'scheduled'))
  INTO v_total_items, v_paid_items, v_failed_items, v_processing_items, v_scheduled_items
  FROM payout_items
  WHERE payout_batch_id = p_batch_id;

  -- Determine status
  IF v_total_items = 0 THEN
    v_status := 'draft';
  ELSIF v_paid_items = v_total_items THEN
    v_status := 'paid';
  ELSIF v_paid_items = 0 AND v_failed_items = v_total_items THEN
    v_status := 'failed';
  ELSIF v_paid_items > 0 AND (v_paid_items + v_failed_items) = v_total_items THEN
    v_status := 'completed_partial';
  ELSIF v_processing_items > 0 THEN
    v_status := 'executing';
  ELSIF v_scheduled_items > 0 THEN
    v_status := 'approved';
  ELSE
    v_status := 'executing';
  END IF;

  -- Update batch with computed values
  UPDATE payout_batches
  SET
    item_count = v_total_items,
    status = v_status,
    updated_at = NOW()
  WHERE id = p_batch_id;

  RETURN v_status;
END;
$$;

COMMENT ON FUNCTION compute_batch_status IS
'Calcule le statut du batch basé sur ses items.
- paid: tous items paid
- failed: tous items failed
- completed_partial: mix paid/failed (alerte obligatoire)
- executing: items en processing
- approved: items scheduled';

-- ============================================================================
-- 6. FUNCTION: Generate unique batch reference
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_batch_reference()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_timestamp TEXT;
  v_random TEXT;
  v_reference TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Format: PAYOUT-YYYYMMDD-HHmmss-XXXX
    v_timestamp := TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS');
    v_random := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
    v_reference := 'PAYOUT-' || v_timestamp || '-' || v_random;

    -- Check uniqueness
    SELECT EXISTS (
      SELECT 1 FROM payout_batches WHERE name = v_reference
    ) INTO v_exists;

    EXIT WHEN NOT v_exists;
  END LOOP;

  RETURN v_reference;
END;
$$;

COMMENT ON FUNCTION generate_batch_reference IS
'Génère une référence unique anti-collision: PAYOUT-YYYYMMDD-HHmmss-XXXX';

-- ============================================================================
-- 7. FUNCTION: Get payable commissions grouped by creator
-- ============================================================================
CREATE OR REPLACE FUNCTION get_payable_commissions_by_creator()
RETURNS TABLE (
  creator_id UUID,
  creator_email TEXT,
  wise_recipient_id TEXT,
  total_amount DECIMAL(12,4),
  commission_count BIGINT,
  commission_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_min_amount DECIMAL(12,4);
BEGIN
  -- Get minimum payout amount from config
  v_min_amount := COALESCE(
    (SELECT value::DECIMAL FROM payout_config WHERE key = 'min_payout_amount'),
    10.00
  );

  RETURN QUERY
  SELECT
    c.creator_id,
    cr.email AS creator_email,
    cba.iban AS wise_recipient_id,  -- Or actual Wise recipient ID if stored
    SUM(c.commission_amount) AS total_amount,
    COUNT(*) AS commission_count,
    ARRAY_AGG(c.id ORDER BY c.created_at ASC) AS commission_ids
  FROM commissions c
  INNER JOIN creators cr ON cr.id = c.creator_id
  LEFT JOIN creator_bank_accounts cba ON cba.creator_id = c.creator_id AND cba.is_verified = true
  WHERE c.status = 'payable'
    AND cr.status = 'active'
    -- Not already in a pending payout
    AND NOT EXISTS (
      SELECT 1 FROM payout_item_commissions pic
      INNER JOIN payout_items pi ON pi.id = pic.payout_item_id
      WHERE pic.commission_id = c.id
        AND pi.status IN ('pending', 'processing', 'scheduled')
    )
  GROUP BY c.creator_id, cr.email, cba.iban
  HAVING SUM(c.commission_amount) >= v_min_amount
  ORDER BY SUM(c.commission_amount) DESC;
END;
$$;

COMMENT ON FUNCTION get_payable_commissions_by_creator IS
'Retourne les commissions payables groupées par créateur.
Filtre: status=payable, creator actif, montant >= min_payout_amount, pas déjà dans batch pending.';

-- ============================================================================
-- 8. TABLE: Webhook logs for unknown IPs
-- ============================================================================
CREATE TABLE IF NOT EXISTS wise_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_ip TEXT NOT NULL,
  is_allowed BOOLEAN NOT NULL,
  validation_method TEXT,
  headers JSONB,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wise_webhook_logs_ip ON wise_webhook_logs(source_ip);
CREATE INDEX idx_wise_webhook_logs_created ON wise_webhook_logs(created_at DESC);
CREATE INDEX idx_wise_webhook_logs_not_allowed ON wise_webhook_logs(source_ip) WHERE is_allowed = false;

-- RLS
ALTER TABLE wise_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Webhook logs readable by admins" ON wise_webhook_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE admin_profiles.id = auth.uid()
      AND admin_profiles.role IN ('super_admin', 'admin')
    )
  );

COMMENT ON TABLE wise_webhook_logs IS
'Logs des webhooks Wise reçus. Utile pour identifier nouvelles IPs légitimes.';

-- ============================================================================
-- 9. FUNCTION: Log Wise webhook
-- ============================================================================
CREATE OR REPLACE FUNCTION log_wise_webhook(
  p_source_ip TEXT,
  p_is_allowed BOOLEAN,
  p_validation_method TEXT,
  p_headers JSONB DEFAULT NULL,
  p_payload JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO wise_webhook_logs (source_ip, is_allowed, validation_method, headers, payload)
  VALUES (p_source_ip, p_is_allowed, p_validation_method, p_headers, p_payload)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- ============================================================================
-- 10. VIEW: Payout dashboard stats
-- ============================================================================
CREATE OR REPLACE VIEW payout_dashboard_stats AS
SELECT
  -- Pending payouts
  (SELECT COUNT(*) FROM payout_batches WHERE status IN ('draft', 'approved')) AS pending_batches,
  (SELECT COALESCE(SUM(total_amount), 0) FROM payout_batches WHERE status IN ('draft', 'approved')) AS pending_amount,

  -- Processing payouts
  (SELECT COUNT(*) FROM payout_batches WHERE status = 'executing') AS processing_batches,
  (SELECT COALESCE(SUM(total_amount), 0) FROM payout_batches WHERE status = 'executing') AS processing_amount,

  -- Completed this month
  (SELECT COUNT(*) FROM payout_batches
   WHERE status IN ('paid', 'sent')
   AND created_at >= DATE_TRUNC('month', NOW())) AS completed_batches_month,
  (SELECT COALESCE(SUM(total_amount), 0) FROM payout_batches
   WHERE status IN ('paid', 'sent')
   AND created_at >= DATE_TRUNC('month', NOW())) AS completed_amount_month,

  -- Failed items needing attention
  (SELECT COUNT(*) FROM payout_items WHERE status = 'failed') AS failed_items,

  -- Payable commissions waiting
  (SELECT COUNT(*) FROM commissions WHERE status = 'payable') AS payable_commissions,
  (SELECT COALESCE(SUM(commission_amount), 0) FROM commissions WHERE status = 'payable') AS payable_amount,

  -- Unknown webhook IPs (last 24h)
  (SELECT COUNT(DISTINCT source_ip) FROM wise_webhook_logs
   WHERE is_allowed = false
   AND created_at >= NOW() - INTERVAL '24 hours') AS unknown_ips_24h;

-- ============================================================================
-- 11. VERIFICATION
-- ============================================================================
SELECT 'Payout config and Wise security installed!' AS status;
