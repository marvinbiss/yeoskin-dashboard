-- ============================================================================
-- YEOSKIN DASHBOARD - FINANCIAL LEDGER & HARDENING
-- ============================================================================
-- ENTERPRISE-GRADE FINANCIAL INFRASTRUCTURE
-- - Immutable financial ledger (append-only)
-- - Idempotency protection
-- - Transaction locks
-- - Double-payment prevention
-- - Full auditability
-- ============================================================================
-- Execute AFTER: supabase-setup.sql, supabase-security-upgrade.sql
-- ============================================================================

-- ============================================================================
-- 0. CLEANUP - Drop existing tables if they have wrong structure
-- ============================================================================
-- Run this section ONLY if you get foreign key errors
-- Comment out after first successful run

DROP TABLE IF EXISTS financial_ledger CASCADE;
DROP TABLE IF EXISTS payout_item_commissions CASCADE;
DROP TABLE IF EXISTS payment_locks CASCADE;
DROP TABLE IF EXISTS payment_state_transitions CASCADE;
DROP TABLE IF EXISTS idempotency_keys CASCADE;
DROP TABLE IF EXISTS wise_transfers CASCADE;
DROP TABLE IF EXISTS payout_items CASCADE;
DROP TABLE IF EXISTS payout_batches CASCADE;
DROP TABLE IF EXISTS commissions CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS creator_bank_accounts CASCADE;
DROP TABLE IF EXISTS creators CASCADE;

-- ============================================================================
-- 0. BASE TABLES - Required for foreign key references
-- ============================================================================

-- Creators table
CREATE TABLE IF NOT EXISTS creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  discount_code TEXT UNIQUE NOT NULL,
  commission_rate DECIMAL(5, 4) DEFAULT 0.15,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  lock_days INT DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creators_email ON creators(email);
CREATE INDEX IF NOT EXISTS idx_creators_code ON creators(discount_code);
CREATE INDEX IF NOT EXISTS idx_creators_status ON creators(status);

-- Creator bank accounts
CREATE TABLE IF NOT EXISTS creator_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  account_type TEXT DEFAULT 'iban' CHECK (account_type IN ('iban', 'wise', 'paypal')),
  iban TEXT,
  account_holder_name TEXT,
  bank_name TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_creator ON creator_bank_accounts(creator_id);

-- Orders table (from Shopify)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_order_id TEXT UNIQUE NOT NULL,
  order_number TEXT,
  customer_email TEXT,
  total_amount DECIMAL(12, 4) NOT NULL,
  discount_code TEXT,
  creator_id UUID REFERENCES creators(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'refunded', 'canceled')),
  order_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_shopify ON orders(shopify_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_creator ON orders(creator_id);
CREATE INDEX IF NOT EXISTS idx_orders_code ON orders(discount_code);

-- Commissions table
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id),
  order_id UUID REFERENCES orders(id),
  order_total DECIMAL(12, 4) NOT NULL,
  commission_rate DECIMAL(5, 4) NOT NULL,
  commission_amount DECIMAL(12, 4) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'locked', 'payable', 'paid', 'canceled')),
  lock_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commissions_creator ON commissions(creator_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_order ON commissions(order_id);

-- Payout batches table
CREATE TABLE IF NOT EXISTS payout_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'executing', 'sent', 'paid', 'canceled')),
  total_amount DECIMAL(12, 4) DEFAULT 0,
  total_fees DECIMAL(12, 4) DEFAULT 0,
  item_count INT DEFAULT 0,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  canceled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_batches_status ON payout_batches(status);

-- Payout items table
CREATE TABLE IF NOT EXISTS payout_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_batch_id UUID REFERENCES payout_batches(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creators(id),
  amount DECIMAL(12, 4) NOT NULL,
  wise_fee DECIMAL(12, 4) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'paid', 'failed')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payout_items_batch ON payout_items(payout_batch_id);
CREATE INDEX IF NOT EXISTS idx_payout_items_creator ON payout_items(creator_id);
CREATE INDEX IF NOT EXISTS idx_payout_items_status ON payout_items(status);

-- Wise transfers table
CREATE TABLE IF NOT EXISTS wise_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_item_id UUID REFERENCES payout_items(id),
  creator_id UUID REFERENCES creators(id),
  wise_transfer_id TEXT UNIQUE,
  wise_quote_id TEXT,
  amount DECIMAL(12, 4) NOT NULL,
  fee DECIMAL(12, 4) DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'canceled')),
  recipient_name TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wise_transfers_item ON wise_transfers(payout_item_id);
CREATE INDEX IF NOT EXISTS idx_wise_transfers_creator ON wise_transfers(creator_id);
CREATE INDEX IF NOT EXISTS idx_wise_transfers_status ON wise_transfers(status);

-- Enable RLS on base tables
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wise_transfers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for base tables (authenticated users can read/write)
CREATE POLICY "Creators accessible by authenticated" ON creators FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Bank accounts accessible by authenticated" ON creator_bank_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Orders accessible by authenticated" ON orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Commissions accessible by authenticated" ON commissions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Batches accessible by authenticated" ON payout_batches FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Payout items accessible by authenticated" ON payout_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Wise transfers accessible by authenticated" ON wise_transfers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Enable realtime for base tables
ALTER PUBLICATION supabase_realtime ADD TABLE creators;
ALTER PUBLICATION supabase_realtime ADD TABLE creator_bank_accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE commissions;
ALTER PUBLICATION supabase_realtime ADD TABLE payout_batches;
ALTER PUBLICATION supabase_realtime ADD TABLE payout_items;
ALTER PUBLICATION supabase_realtime ADD TABLE wise_transfers;

-- ============================================================================
-- 1. IDEMPOTENCY KEYS TABLE - Prevent duplicate operations
-- ============================================================================
CREATE TABLE IF NOT EXISTS idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT UNIQUE NOT NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN (
    'webhook_shopify_order',
    'webhook_shopify_refund',
    'commission_create',
    'payout_execute',
    'payout_item_process',
    'wise_transfer_create',
    'batch_approve',
    'batch_execute'
  )),
  resource_type TEXT NOT NULL,
  resource_id UUID,
  external_id TEXT, -- Shopify order ID, Wise transfer ID, etc.
  request_hash TEXT, -- Hash of the request body for verification
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  response_data JSONB,
  error_message TEXT,
  attempts INT DEFAULT 1,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_idempotency_key ON idempotency_keys(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_idempotency_external ON idempotency_keys(external_id);
CREATE INDEX IF NOT EXISTS idx_idempotency_operation ON idempotency_keys(operation_type, status);
CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON idempotency_keys(expires_at) WHERE status = 'pending';

-- ============================================================================
-- 2. FINANCIAL LEDGER TABLE - Immutable append-only transaction log
-- ============================================================================
CREATE TABLE IF NOT EXISTS financial_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_number BIGSERIAL UNIQUE NOT NULL, -- Sequential, never gaps

  -- Transaction identification
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'commission_earned',      -- Commission from order
    'commission_canceled',    -- Commission canceled (refund)
    'commission_adjusted',    -- Manual adjustment
    'payout_initiated',       -- Payout started
    'payout_sent',            -- Money sent via Wise
    'payout_completed',       -- Confirmed received
    'payout_failed',          -- Payout failed, money returned to balance
    'payout_fee',             -- Wise fee deducted
    'balance_adjustment',     -- Manual balance adjustment
    'refund_processed'        -- Refund from order
  )),

  -- Parties involved
  creator_id UUID NOT NULL REFERENCES creators(id),

  -- Financial amounts (all in EUR, positive values, direction determined by type)
  amount DECIMAL(12, 4) NOT NULL CHECK (amount >= 0),
  currency TEXT DEFAULT 'EUR' NOT NULL,

  -- Running balance after this entry (computed, immutable)
  balance_after DECIMAL(12, 4) NOT NULL,

  -- Reference to source documents
  commission_id UUID REFERENCES commissions(id),
  payout_item_id UUID REFERENCES payout_items(id),
  payout_batch_id UUID REFERENCES payout_batches(id),
  wise_transfer_id UUID REFERENCES wise_transfers(id),
  order_id UUID REFERENCES orders(id),

  -- External references
  shopify_order_id TEXT,
  wise_transfer_reference TEXT,

  -- Idempotency
  idempotency_key TEXT UNIQUE,

  -- Audit trail
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Immutability constraint - no updates allowed, enforced by trigger
  is_immutable BOOLEAN DEFAULT true NOT NULL
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_ledger_creator ON financial_ledger(creator_id);
CREATE INDEX IF NOT EXISTS idx_ledger_type ON financial_ledger(transaction_type);
CREATE INDEX IF NOT EXISTS idx_ledger_created ON financial_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_commission ON financial_ledger(commission_id) WHERE commission_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ledger_payout ON financial_ledger(payout_item_id) WHERE payout_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ledger_batch ON financial_ledger(payout_batch_id) WHERE payout_batch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ledger_idempotency ON financial_ledger(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- RLS
ALTER TABLE financial_ledger ENABLE ROW LEVEL SECURITY;

-- Only super_admin can view ledger (financial audit)
CREATE POLICY "Ledger viewable by super_admin" ON financial_ledger
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE admin_profiles.id = auth.uid()
      AND admin_profiles.role IN ('super_admin', 'admin')
    )
  );

-- Insert only via functions (SECURITY DEFINER)
CREATE POLICY "Ledger insertable via functions only" ON financial_ledger
  FOR INSERT TO authenticated
  WITH CHECK (false); -- Blocked - use functions instead

-- ============================================================================
-- 3. CREATOR BALANCES VIEW - Computed from ledger
-- ============================================================================
CREATE OR REPLACE VIEW creator_balances AS
SELECT
  c.id AS creator_id,
  c.email,
  c.discount_code,
  c.status,
  COALESCE(
    (SELECT balance_after
     FROM financial_ledger fl
     WHERE fl.creator_id = c.id
     ORDER BY entry_number DESC
     LIMIT 1),
    0
  ) AS current_balance,
  COALESCE(
    (SELECT SUM(amount)
     FROM financial_ledger fl
     WHERE fl.creator_id = c.id
     AND fl.transaction_type = 'commission_earned'),
    0
  ) AS total_earned,
  COALESCE(
    (SELECT SUM(amount)
     FROM financial_ledger fl
     WHERE fl.creator_id = c.id
     AND fl.transaction_type IN ('payout_sent', 'payout_completed')),
    0
  ) AS total_paid,
  COALESCE(
    (SELECT SUM(amount)
     FROM financial_ledger fl
     WHERE fl.creator_id = c.id
     AND fl.transaction_type = 'payout_fee'),
    0
  ) AS total_fees,
  COALESCE(
    (SELECT SUM(amount)
     FROM financial_ledger fl
     WHERE fl.creator_id = c.id
     AND fl.transaction_type = 'commission_canceled'),
    0
  ) AS total_canceled
FROM creators c;

-- ============================================================================
-- 4. PAYMENT LOCKS TABLE - Prevent concurrent payment operations
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lock_type TEXT NOT NULL CHECK (lock_type IN ('creator', 'batch', 'item')),
  resource_id UUID NOT NULL,
  operation TEXT NOT NULL,
  locked_by UUID REFERENCES auth.users(id),
  locked_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '5 minutes'),
  released_at TIMESTAMPTZ,
  UNIQUE (lock_type, resource_id) -- Only one lock per resource
);

CREATE INDEX IF NOT EXISTS idx_payment_locks_resource ON payment_locks(lock_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_payment_locks_expires ON payment_locks(expires_at) WHERE released_at IS NULL;

-- ============================================================================
-- 5. PAYMENT STATE MACHINE - Valid state transitions
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_state_transitions (
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  requires_lock BOOLEAN DEFAULT true,
  PRIMARY KEY (from_status, to_status)
);

-- Valid commission transitions
INSERT INTO payment_state_transitions (from_status, to_status, requires_lock) VALUES
  ('pending', 'locked', false),
  ('locked', 'payable', false),
  ('payable', 'processing', true),  -- Requires lock
  ('processing', 'paid', true),      -- Requires lock
  ('processing', 'failed', true),    -- Requires lock
  ('pending', 'canceled', false),
  ('locked', 'canceled', false),
  ('payable', 'canceled', true)      -- Requires lock if in payable state
ON CONFLICT DO NOTHING;

-- Valid batch transitions
INSERT INTO payment_state_transitions (from_status, to_status, requires_lock) VALUES
  ('draft', 'approved', true),
  ('approved', 'executing', true),
  ('executing', 'sent', true),
  ('sent', 'paid', true),
  ('approved', 'canceled', true),
  ('draft', 'canceled', false)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. FUNCTION: Acquire payment lock (with timeout)
-- ============================================================================
CREATE OR REPLACE FUNCTION acquire_payment_lock(
  p_lock_type TEXT,
  p_resource_id UUID,
  p_operation TEXT,
  p_timeout_seconds INT DEFAULT 300
)
RETURNS UUID AS $$
DECLARE
  v_lock_id UUID;
  v_existing_lock RECORD;
BEGIN
  -- Clean up expired locks first
  DELETE FROM payment_locks
  WHERE expires_at < NOW() AND released_at IS NULL;

  -- Check for existing lock
  SELECT * INTO v_existing_lock
  FROM payment_locks
  WHERE lock_type = p_lock_type
    AND resource_id = p_resource_id
    AND released_at IS NULL
    AND expires_at > NOW()
  FOR UPDATE SKIP LOCKED;

  IF v_existing_lock.id IS NOT NULL THEN
    RAISE EXCEPTION 'Resource is locked by another operation: % (locked at %)',
      v_existing_lock.operation, v_existing_lock.locked_at;
  END IF;

  -- Acquire the lock
  INSERT INTO payment_locks (lock_type, resource_id, operation, locked_by, expires_at)
  VALUES (p_lock_type, p_resource_id, p_operation, auth.uid(), NOW() + (p_timeout_seconds || ' seconds')::INTERVAL)
  RETURNING id INTO v_lock_id;

  RETURN v_lock_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. FUNCTION: Release payment lock
-- ============================================================================
CREATE OR REPLACE FUNCTION release_payment_lock(p_lock_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE payment_locks
  SET released_at = NOW()
  WHERE id = p_lock_id
    AND released_at IS NULL;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. FUNCTION: Check/create idempotency key (returns existing or creates new)
-- ============================================================================
CREATE OR REPLACE FUNCTION check_idempotency(
  p_idempotency_key TEXT,
  p_operation_type TEXT,
  p_resource_type TEXT,
  p_external_id TEXT DEFAULT NULL,
  p_request_hash TEXT DEFAULT NULL
)
RETURNS TABLE (
  is_duplicate BOOLEAN,
  existing_status TEXT,
  existing_response JSONB,
  idempotency_id UUID
) AS $$
DECLARE
  v_existing RECORD;
  v_new_id UUID;
BEGIN
  -- Check for existing key
  SELECT * INTO v_existing
  FROM idempotency_keys ik
  WHERE ik.idempotency_key = p_idempotency_key
  FOR UPDATE;

  IF v_existing.id IS NOT NULL THEN
    -- Key exists - check if completed or still processing
    IF v_existing.status = 'completed' THEN
      RETURN QUERY SELECT
        true::BOOLEAN,
        v_existing.status,
        v_existing.response_data,
        v_existing.id;
      RETURN;
    ELSIF v_existing.status = 'processing' AND v_existing.last_attempt_at > NOW() - INTERVAL '5 minutes' THEN
      -- Still processing recently
      RAISE EXCEPTION 'Operation in progress for idempotency key: %', p_idempotency_key;
    ELSE
      -- Failed or stale - allow retry
      UPDATE idempotency_keys
      SET
        status = 'processing',
        attempts = attempts + 1,
        last_attempt_at = NOW()
      WHERE id = v_existing.id;

      RETURN QUERY SELECT
        false::BOOLEAN,
        'retrying'::TEXT,
        NULL::JSONB,
        v_existing.id;
      RETURN;
    END IF;
  END IF;

  -- Create new idempotency key
  INSERT INTO idempotency_keys (
    idempotency_key,
    operation_type,
    resource_type,
    external_id,
    request_hash,
    status,
    created_by
  ) VALUES (
    p_idempotency_key,
    p_operation_type,
    p_resource_type,
    p_external_id,
    p_request_hash,
    'processing',
    auth.uid()
  )
  RETURNING id INTO v_new_id;

  RETURN QUERY SELECT
    false::BOOLEAN,
    'new'::TEXT,
    NULL::JSONB,
    v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. FUNCTION: Complete idempotency key
-- ============================================================================
CREATE OR REPLACE FUNCTION complete_idempotency(
  p_idempotency_id UUID,
  p_status TEXT,
  p_response_data JSONB DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE idempotency_keys
  SET
    status = p_status,
    response_data = p_response_data,
    error_message = p_error_message,
    resource_id = COALESCE(p_resource_id, resource_id),
    completed_at = CASE WHEN p_status IN ('completed', 'failed') THEN NOW() ELSE NULL END
  WHERE id = p_idempotency_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 10. FUNCTION: Add ledger entry (the ONLY way to add entries)
-- ============================================================================
CREATE OR REPLACE FUNCTION add_ledger_entry(
  p_transaction_type TEXT,
  p_creator_id UUID,
  p_amount DECIMAL(12, 4),
  p_description TEXT,
  p_commission_id UUID DEFAULT NULL,
  p_payout_item_id UUID DEFAULT NULL,
  p_payout_batch_id UUID DEFAULT NULL,
  p_wise_transfer_id UUID DEFAULT NULL,
  p_order_id UUID DEFAULT NULL,
  p_shopify_order_id TEXT DEFAULT NULL,
  p_wise_transfer_reference TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_entry_id UUID;
  v_current_balance DECIMAL(12, 4);
  v_new_balance DECIMAL(12, 4);
  v_amount_sign INT;
BEGIN
  -- Check idempotency if key provided
  IF p_idempotency_key IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM financial_ledger WHERE idempotency_key = p_idempotency_key) THEN
      SELECT id INTO v_entry_id FROM financial_ledger WHERE idempotency_key = p_idempotency_key;
      RETURN v_entry_id;
    END IF;
  END IF;

  -- Get current balance (lock the creator row)
  SELECT COALESCE(
    (SELECT balance_after
     FROM financial_ledger
     WHERE creator_id = p_creator_id
     ORDER BY entry_number DESC
     LIMIT 1),
    0
  ) INTO v_current_balance;

  -- Determine sign based on transaction type
  v_amount_sign := CASE
    WHEN p_transaction_type IN ('commission_earned', 'payout_failed', 'balance_adjustment') THEN 1
    WHEN p_transaction_type IN ('commission_canceled', 'payout_sent', 'payout_completed', 'payout_fee', 'payout_initiated', 'refund_processed') THEN -1
    ELSE 0
  END;

  -- Calculate new balance
  v_new_balance := v_current_balance + (p_amount * v_amount_sign);

  -- Prevent negative balance for payouts
  IF p_transaction_type IN ('payout_sent', 'payout_initiated') AND v_new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient balance for creator %. Current: %, Requested: %',
      p_creator_id, v_current_balance, p_amount;
  END IF;

  -- Insert the ledger entry
  INSERT INTO financial_ledger (
    transaction_type,
    creator_id,
    amount,
    balance_after,
    commission_id,
    payout_item_id,
    payout_batch_id,
    wise_transfer_id,
    order_id,
    shopify_order_id,
    wise_transfer_reference,
    idempotency_key,
    description,
    metadata,
    created_by
  ) VALUES (
    p_transaction_type,
    p_creator_id,
    p_amount,
    v_new_balance,
    p_commission_id,
    p_payout_item_id,
    p_payout_batch_id,
    p_wise_transfer_id,
    p_order_id,
    p_shopify_order_id,
    p_wise_transfer_reference,
    p_idempotency_key,
    p_description,
    p_metadata,
    auth.uid()
  )
  RETURNING id INTO v_entry_id;

  RETURN v_entry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 11. TRIGGER: Prevent updates/deletes on financial_ledger
-- ============================================================================
CREATE OR REPLACE FUNCTION prevent_ledger_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'Financial ledger entries are immutable and cannot be updated';
  ELSIF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Financial ledger entries are immutable and cannot be deleted';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_prevent_ledger_modification ON financial_ledger;
CREATE TRIGGER tr_prevent_ledger_modification
  BEFORE UPDATE OR DELETE ON financial_ledger
  FOR EACH ROW
  EXECUTE FUNCTION prevent_ledger_modification();

-- ============================================================================
-- 12. FUNCTION: Safe commission creation with ledger
-- ============================================================================
CREATE OR REPLACE FUNCTION create_commission_with_ledger(
  p_creator_id UUID,
  p_order_id UUID,
  p_shopify_order_id TEXT,
  p_order_total DECIMAL(12, 4),
  p_commission_rate DECIMAL(5, 4),
  p_idempotency_key TEXT
)
RETURNS UUID AS $$
DECLARE
  v_commission_id UUID;
  v_commission_amount DECIMAL(12, 4);
  v_idemp_result RECORD;
BEGIN
  -- Check idempotency
  SELECT * INTO v_idemp_result
  FROM check_idempotency(
    p_idempotency_key,
    'commission_create',
    'commission',
    p_shopify_order_id
  );

  IF v_idemp_result.is_duplicate THEN
    RETURN (v_idemp_result.existing_response->>'commission_id')::UUID;
  END IF;

  -- Calculate commission
  v_commission_amount := p_order_total * p_commission_rate;

  -- Create commission record
  INSERT INTO commissions (
    creator_id,
    order_id,
    order_total,
    commission_rate,
    commission_amount,
    status,
    created_at
  ) VALUES (
    p_creator_id,
    p_order_id,
    p_order_total,
    p_commission_rate,
    v_commission_amount,
    'pending',
    NOW()
  )
  RETURNING id INTO v_commission_id;

  -- Add ledger entry
  PERFORM add_ledger_entry(
    'commission_earned',
    p_creator_id,
    v_commission_amount,
    format('Commission from order %s', p_shopify_order_id),
    v_commission_id,
    NULL, NULL, NULL,
    p_order_id,
    p_shopify_order_id,
    NULL,
    p_idempotency_key || '_ledger',
    jsonb_build_object('order_total', p_order_total, 'rate', p_commission_rate)
  );

  -- Complete idempotency
  PERFORM complete_idempotency(
    v_idemp_result.idempotency_id,
    'completed',
    jsonb_build_object('commission_id', v_commission_id, 'amount', v_commission_amount)
  );

  RETURN v_commission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 13. FUNCTION: Safe payout execution with locking
-- ============================================================================
CREATE OR REPLACE FUNCTION execute_payout_item(
  p_payout_item_id UUID,
  p_idempotency_key TEXT,
  p_wise_transfer_reference TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_item RECORD;
  v_lock_id UUID;
  v_idemp_result RECORD;
  v_ledger_id UUID;
BEGIN
  -- Check idempotency first
  SELECT * INTO v_idemp_result
  FROM check_idempotency(
    p_idempotency_key,
    'payout_item_process',
    'payout_item',
    p_payout_item_id::TEXT
  );

  IF v_idemp_result.is_duplicate THEN
    RETURN v_idemp_result.existing_response;
  END IF;

  -- Get item with FOR UPDATE lock
  SELECT pi.*, c.id as creator_id, c.email as creator_email
  INTO v_item
  FROM payout_items pi
  JOIN creators c ON c.id = pi.creator_id
  WHERE pi.id = p_payout_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    PERFORM complete_idempotency(v_idemp_result.idempotency_id, 'failed', NULL, 'Payout item not found');
    RAISE EXCEPTION 'Payout item not found: %', p_payout_item_id;
  END IF;

  -- Validate state transition
  IF v_item.status NOT IN ('pending', 'processing') THEN
    PERFORM complete_idempotency(
      v_idemp_result.idempotency_id,
      'failed',
      NULL,
      format('Invalid status for execution: %s', v_item.status)
    );
    RAISE EXCEPTION 'Cannot execute payout item in status: %', v_item.status;
  END IF;

  -- Acquire lock
  v_lock_id := acquire_payment_lock('item', p_payout_item_id, 'payout_execute');

  BEGIN
    -- Update item status
    UPDATE payout_items
    SET
      status = 'processing',
      wise_transfer_ref = p_wise_transfer_reference,
      updated_at = NOW()
    WHERE id = p_payout_item_id;

    -- Add ledger entry for payout initiated
    v_ledger_id := add_ledger_entry(
      'payout_initiated',
      v_item.creator_id,
      v_item.amount,
      format('Payout initiated for %s', v_item.creator_email),
      NULL,
      p_payout_item_id,
      v_item.payout_batch_id,
      NULL,
      NULL,
      NULL,
      p_wise_transfer_reference,
      p_idempotency_key || '_ledger',
      jsonb_build_object('batch_id', v_item.payout_batch_id)
    );

    -- Release lock
    PERFORM release_payment_lock(v_lock_id);

    -- Complete idempotency
    PERFORM complete_idempotency(
      v_idemp_result.idempotency_id,
      'completed',
      jsonb_build_object(
        'payout_item_id', p_payout_item_id,
        'status', 'processing',
        'ledger_entry_id', v_ledger_id
      ),
      NULL,
      p_payout_item_id
    );

    RETURN jsonb_build_object(
      'success', true,
      'payout_item_id', p_payout_item_id,
      'status', 'processing',
      'ledger_entry_id', v_ledger_id
    );

  EXCEPTION WHEN OTHERS THEN
    -- Release lock on error
    PERFORM release_payment_lock(v_lock_id);

    PERFORM complete_idempotency(
      v_idemp_result.idempotency_id,
      'failed',
      NULL,
      SQLERRM
    );

    RAISE;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 14. FUNCTION: Complete payout (mark as sent/paid)
-- ============================================================================
CREATE OR REPLACE FUNCTION complete_payout_item(
  p_payout_item_id UUID,
  p_wise_transfer_id TEXT,
  p_wise_fee DECIMAL(12, 4) DEFAULT 0,
  p_new_status TEXT DEFAULT 'sent'
)
RETURNS JSONB AS $$
DECLARE
  v_item RECORD;
  v_lock_id UUID;
  v_idempotency_key TEXT;
BEGIN
  v_idempotency_key := format('complete_%s_%s', p_payout_item_id, p_new_status);

  -- Get item with lock
  SELECT pi.*, c.id as creator_id, c.email as creator_email
  INTO v_item
  FROM payout_items pi
  JOIN creators c ON c.id = pi.creator_id
  WHERE pi.id = p_payout_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payout item not found: %', p_payout_item_id;
  END IF;

  -- Validate state transition
  IF p_new_status = 'sent' AND v_item.status != 'processing' THEN
    RAISE EXCEPTION 'Cannot mark as sent from status: %', v_item.status;
  END IF;

  IF p_new_status = 'paid' AND v_item.status NOT IN ('processing', 'sent') THEN
    RAISE EXCEPTION 'Cannot mark as paid from status: %', v_item.status;
  END IF;

  -- Acquire lock
  v_lock_id := acquire_payment_lock('item', p_payout_item_id, 'payout_complete');

  BEGIN
    -- Update item status
    UPDATE payout_items
    SET
      status = p_new_status,
      wise_transfer_id = p_wise_transfer_id,
      wise_fee = p_wise_fee,
      sent_at = CASE WHEN p_new_status IN ('sent', 'paid') THEN NOW() ELSE sent_at END,
      updated_at = NOW()
    WHERE id = p_payout_item_id;

    -- Add ledger entry for payout sent
    IF p_new_status = 'sent' THEN
      PERFORM add_ledger_entry(
        'payout_sent',
        v_item.creator_id,
        v_item.amount,
        format('Payout sent to %s via Wise', v_item.creator_email),
        NULL,
        p_payout_item_id,
        v_item.payout_batch_id,
        NULL, NULL, NULL,
        p_wise_transfer_id,
        v_idempotency_key || '_sent',
        jsonb_build_object('wise_transfer_id', p_wise_transfer_id)
      );

      -- Add fee entry if applicable
      IF p_wise_fee > 0 THEN
        PERFORM add_ledger_entry(
          'payout_fee',
          v_item.creator_id,
          p_wise_fee,
          format('Wise transfer fee for payout to %s', v_item.creator_email),
          NULL,
          p_payout_item_id,
          v_item.payout_batch_id,
          NULL, NULL, NULL,
          p_wise_transfer_id,
          v_idempotency_key || '_fee',
          jsonb_build_object('wise_transfer_id', p_wise_transfer_id)
        );
      END IF;
    END IF;

    -- Mark related commissions as paid
    UPDATE commissions
    SET status = 'paid', updated_at = NOW()
    WHERE creator_id = v_item.creator_id
      AND status = 'payable'
      AND id IN (
        SELECT commission_id FROM payout_item_commissions WHERE payout_item_id = p_payout_item_id
      );

    -- Release lock
    PERFORM release_payment_lock(v_lock_id);

    RETURN jsonb_build_object(
      'success', true,
      'payout_item_id', p_payout_item_id,
      'status', p_new_status
    );

  EXCEPTION WHEN OTHERS THEN
    PERFORM release_payment_lock(v_lock_id);
    RAISE;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 15. FUNCTION: Fail payout item (reverse ledger entry)
-- ============================================================================
CREATE OR REPLACE FUNCTION fail_payout_item(
  p_payout_item_id UUID,
  p_error_message TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_item RECORD;
  v_lock_id UUID;
BEGIN
  -- Get item with lock
  SELECT pi.*, c.id as creator_id, c.email as creator_email
  INTO v_item
  FROM payout_items pi
  JOIN creators c ON c.id = pi.creator_id
  WHERE pi.id = p_payout_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payout item not found: %', p_payout_item_id;
  END IF;

  -- Acquire lock
  v_lock_id := acquire_payment_lock('item', p_payout_item_id, 'payout_fail');

  BEGIN
    -- Update item status
    UPDATE payout_items
    SET
      status = 'failed',
      error_message = p_error_message,
      updated_at = NOW()
    WHERE id = p_payout_item_id;

    -- Add ledger entry to reverse the balance (payout_failed credits back)
    PERFORM add_ledger_entry(
      'payout_failed',
      v_item.creator_id,
      v_item.amount,
      format('Payout failed: %s', p_error_message),
      NULL,
      p_payout_item_id,
      v_item.payout_batch_id,
      NULL, NULL, NULL, NULL,
      format('fail_%s_%s', p_payout_item_id, extract(epoch from now())),
      jsonb_build_object('error', p_error_message)
    );

    -- Revert commissions to payable status
    UPDATE commissions
    SET status = 'payable', updated_at = NOW()
    WHERE creator_id = v_item.creator_id
      AND status = 'paid'
      AND id IN (
        SELECT commission_id FROM payout_item_commissions WHERE payout_item_id = p_payout_item_id
      );

    PERFORM release_payment_lock(v_lock_id);

    RETURN jsonb_build_object(
      'success', true,
      'payout_item_id', p_payout_item_id,
      'status', 'failed',
      'balance_restored', true
    );

  EXCEPTION WHEN OTHERS THEN
    PERFORM release_payment_lock(v_lock_id);
    RAISE;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 16. TABLE: Link payout items to commissions
-- ============================================================================
CREATE TABLE IF NOT EXISTS payout_item_commissions (
  payout_item_id UUID REFERENCES payout_items(id) ON DELETE CASCADE,
  commission_id UUID REFERENCES commissions(id) ON DELETE CASCADE,
  PRIMARY KEY (payout_item_id, commission_id)
);

CREATE INDEX IF NOT EXISTS idx_pic_item ON payout_item_commissions(payout_item_id);
CREATE INDEX IF NOT EXISTS idx_pic_commission ON payout_item_commissions(commission_id);

-- ============================================================================
-- 17. ADD COLUMNS TO EXISTING TABLES (if missing)
-- ============================================================================
ALTER TABLE payout_items
  ADD COLUMN IF NOT EXISTS wise_transfer_ref TEXT,
  ADD COLUMN IF NOT EXISTS wise_transfer_id TEXT,
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE payout_batches
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS executed_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS executed_at TIMESTAMPTZ;

ALTER TABLE commissions
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================================
-- 18. UNIQUE CONSTRAINT: Prevent duplicate commissions per order
-- ============================================================================
ALTER TABLE commissions
  DROP CONSTRAINT IF EXISTS commissions_unique_order_creator;

ALTER TABLE commissions
  ADD CONSTRAINT commissions_unique_order_creator
  UNIQUE (order_id, creator_id);

-- ============================================================================
-- 19. FINANCIAL SUMMARY VIEW (for dashboard)
-- ============================================================================
CREATE OR REPLACE VIEW financial_summary AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  transaction_type,
  COUNT(*) as transaction_count,
  SUM(amount) as total_amount,
  COUNT(DISTINCT creator_id) as unique_creators
FROM financial_ledger
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', created_at), transaction_type
ORDER BY date DESC, transaction_type;

-- ============================================================================
-- 20. ENABLE REALTIME FOR NEW TABLES
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE financial_ledger;
ALTER PUBLICATION supabase_realtime ADD TABLE idempotency_keys;
ALTER PUBLICATION supabase_realtime ADD TABLE payment_locks;

-- ============================================================================
-- 21. CLEANUP: Remove expired idempotency keys (scheduled function)
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_expired_idempotency_keys()
RETURNS INT AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM idempotency_keys
  WHERE expires_at < NOW()
    AND status IN ('completed', 'failed');

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 22. VERIFICATION
-- ============================================================================
SELECT
  'Financial ledger infrastructure installed!' AS status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'financial_ledger') AS has_ledger,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'idempotency_keys') AS has_idempotency,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'payment_locks') AS has_locks,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'payout_item_commissions') AS has_pic;
