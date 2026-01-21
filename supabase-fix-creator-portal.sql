-- ============================================================================
-- YEOSKIN - FIX CREATOR PORTAL
-- ============================================================================
-- Execute this file in Supabase SQL Editor to fix all creator portal issues
-- Run this ONCE to fix missing columns and recreate functions
-- ============================================================================

-- ============================================================================
-- 1. FIX FINANCIAL_LEDGER TABLE - Add missing columns
-- ============================================================================

-- Add created_at column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'financial_ledger' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE financial_ledger ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;
  END IF;
END $$;

-- Add entry_number if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'financial_ledger' AND column_name = 'entry_number'
  ) THEN
    ALTER TABLE financial_ledger ADD COLUMN entry_number BIGSERIAL UNIQUE NOT NULL;
  END IF;
END $$;

-- Add is_immutable if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'financial_ledger' AND column_name = 'is_immutable'
  ) THEN
    ALTER TABLE financial_ledger ADD COLUMN is_immutable BOOLEAN DEFAULT true NOT NULL;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ledger_created ON financial_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_creator ON financial_ledger(creator_id);
CREATE INDEX IF NOT EXISTS idx_ledger_type ON financial_ledger(transaction_type);

-- ============================================================================
-- 2. FIX CREATOR_NOTIFICATIONS TABLE
-- ============================================================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS creator_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'commission_earned',
    'commission_locked',
    'commission_payable',
    'payout_scheduled',
    'payout_sent',
    'payout_completed',
    'payout_failed',
    'welcome',
    'info'
  )),
  title TEXT NOT NULL,
  message TEXT,
  amount DECIMAL(12,4),
  reference_id UUID,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_notifications_creator ON creator_notifications(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_notifications_read ON creator_notifications(creator_id, read);
CREATE INDEX IF NOT EXISTS idx_creator_notifications_created ON creator_notifications(created_at DESC);

-- Enable RLS
ALTER TABLE creator_notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. FIX CREATOR_BALANCES VIEW
-- ============================================================================

CREATE OR REPLACE VIEW creator_balances AS
SELECT
  c.id AS creator_id,
  c.email,
  c.discount_code,
  COALESCE(
    (SELECT SUM(CASE
      WHEN fl.transaction_type IN ('commission_earned', 'payout_failed') THEN fl.amount
      ELSE -fl.amount
    END)
    FROM financial_ledger fl WHERE fl.creator_id = c.id),
    0
  ) AS current_balance,
  COALESCE(
    (SELECT SUM(fl.amount) FROM financial_ledger fl
     WHERE fl.creator_id = c.id AND fl.transaction_type = 'commission_earned'),
    0
  ) AS total_earned,
  COALESCE(
    (SELECT SUM(fl.amount) FROM financial_ledger fl
     WHERE fl.creator_id = c.id AND fl.transaction_type IN ('payout_sent', 'payout_completed')),
    0
  ) AS total_paid,
  COALESCE(
    (SELECT SUM(fl.amount) FROM financial_ledger fl
     WHERE fl.creator_id = c.id AND fl.transaction_type = 'payout_fee'),
    0
  ) AS total_fees
FROM creators c;

-- ============================================================================
-- 4. FIX CREATOR_TIMELINE_EVENTS VIEW
-- ============================================================================

DROP VIEW IF EXISTS creator_timeline_events;
CREATE VIEW creator_timeline_events AS
SELECT
  fl.id,
  fl.creator_id,
  fl.created_at AS event_date,
  fl.transaction_type,
  CASE fl.transaction_type
    WHEN 'commission_earned' THEN 'Commission gagnee'
    WHEN 'commission_canceled' THEN 'Commission annulee'
    WHEN 'commission_adjusted' THEN 'Commission ajustee'
    WHEN 'payout_initiated' THEN 'Paiement initie'
    WHEN 'payout_sent' THEN 'Paiement envoye'
    WHEN 'payout_completed' THEN 'Paiement confirme'
    WHEN 'payout_failed' THEN 'Paiement echoue'
    WHEN 'payout_fee' THEN 'Frais de transfert'
    WHEN 'balance_adjustment' THEN 'Ajustement de solde'
    WHEN 'refund_processed' THEN 'Remboursement traite'
    ELSE fl.transaction_type
  END AS event_label,
  fl.amount,
  fl.balance_after,
  fl.description AS reason,
  fl.shopify_order_id,
  fl.wise_transfer_reference
FROM financial_ledger fl;

-- ============================================================================
-- 5. RLS HELPER FUNCTIONS
-- ============================================================================

-- Get the creator_id for the currently authenticated user
CREATE OR REPLACE FUNCTION get_my_creator_id() RETURNS UUID AS $$
  SELECT id FROM creators WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is a creator
CREATE OR REPLACE FUNCTION is_creator() RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM creators WHERE user_id = auth.uid());
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is an admin
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid() AND is_active = true);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- 6. FIX GET_CREATOR_DASHBOARD FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_creator_dashboard(p_creator_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  v_creator_id UUID;
  v_balance RECORD;
  v_recent_activity JSONB;
  v_pending RECORD;
  v_payable RECORD;
  v_unread_count INT;
  v_result JSONB;
BEGIN
  -- Get creator_id (use provided or current user's)
  v_creator_id := COALESCE(p_creator_id, get_my_creator_id());

  IF v_creator_id IS NULL THEN
    RETURN jsonb_build_object(
      'balance', jsonb_build_object('current_balance', 0, 'total_earned', 0, 'total_paid', 0, 'total_fees', 0),
      'recent_activity', '[]'::jsonb,
      'pending_commissions', jsonb_build_object('count', 0, 'amount', 0),
      'payable_commissions', jsonb_build_object('count', 0, 'amount', 0),
      'unread_notifications', 0
    );
  END IF;

  -- Get balance from view
  SELECT
    COALESCE(current_balance, 0) AS current_balance,
    COALESCE(total_earned, 0) AS total_earned,
    COALESCE(total_paid, 0) AS total_paid,
    COALESCE(total_fees, 0) AS total_fees
  INTO v_balance
  FROM creator_balances
  WHERE creator_id = v_creator_id;

  -- Get recent activity (last 10 ledger entries)
  SELECT COALESCE(jsonb_agg(entry ORDER BY created_at DESC), '[]'::jsonb)
  INTO v_recent_activity
  FROM (
    SELECT jsonb_build_object(
      'id', id,
      'type', transaction_type,
      'amount', amount,
      'balance_after', balance_after,
      'description', description,
      'created_at', created_at
    ) AS entry
    FROM financial_ledger
    WHERE creator_id = v_creator_id
    ORDER BY created_at DESC
    LIMIT 10
  ) sub;

  -- Get pending commissions
  SELECT COUNT(*), COALESCE(SUM(commission_amount), 0)
  INTO v_pending
  FROM commissions
  WHERE creator_id = v_creator_id AND status = 'pending';

  -- Get payable commissions
  SELECT COUNT(*), COALESCE(SUM(commission_amount), 0)
  INTO v_payable
  FROM commissions
  WHERE creator_id = v_creator_id AND status = 'payable';

  -- Get unread notifications count
  SELECT COUNT(*)
  INTO v_unread_count
  FROM creator_notifications
  WHERE creator_id = v_creator_id AND read = false;

  -- Build result
  v_result := jsonb_build_object(
    'balance', jsonb_build_object(
      'current_balance', COALESCE(v_balance.current_balance, 0),
      'total_earned', COALESCE(v_balance.total_earned, 0),
      'total_paid', COALESCE(v_balance.total_paid, 0),
      'total_fees', COALESCE(v_balance.total_fees, 0)
    ),
    'recent_activity', v_recent_activity,
    'pending_commissions', jsonb_build_object(
      'count', COALESCE(v_pending.count, 0),
      'amount', COALESCE(v_pending.sum, 0)
    ),
    'payable_commissions', jsonb_build_object(
      'count', COALESCE(v_payable.count, 0),
      'amount', COALESCE(v_payable.sum, 0)
    ),
    'unread_notifications', COALESCE(v_unread_count, 0)
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. FIX GET_PAYOUT_FORECAST FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_payout_forecast(p_creator_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  v_creator_id UUID;
  v_creator RECORD;
  v_payable_now DECIMAL(12,4);
  v_locked_amount DECIMAL(12,4);
  v_pending_amount DECIMAL(12,4);
  v_next_unlock_date TIMESTAMPTZ;
  v_has_verified_bank BOOLEAN;
  v_result JSONB;
BEGIN
  -- Get creator_id
  v_creator_id := COALESCE(p_creator_id, get_my_creator_id());

  IF v_creator_id IS NULL THEN
    RETURN jsonb_build_object(
      'payable_now', 0,
      'locked_amount', 0,
      'pending_amount', 0,
      'next_unlock_date', null,
      'risk_indicators', jsonb_build_object(
        'has_unverified_bank', true,
        'has_locked_commissions', false,
        'days_to_full_payout', 0
      ),
      'can_receive_payout', false
    );
  END IF;

  -- Get creator info
  SELECT c.*,
    COALESCE(cba.is_verified, false) AS bank_verified
  INTO v_creator
  FROM creators c
  LEFT JOIN creator_bank_accounts cba ON cba.creator_id = c.id
  WHERE c.id = v_creator_id;

  -- Get payable amount (commissions ready to pay)
  SELECT COALESCE(SUM(commission_amount), 0)
  INTO v_payable_now
  FROM commissions
  WHERE creator_id = v_creator_id AND status = 'payable';

  -- Get locked amount (commissions in lock period)
  SELECT COALESCE(SUM(commission_amount), 0)
  INTO v_locked_amount
  FROM commissions
  WHERE creator_id = v_creator_id
    AND status = 'locked'
    AND lock_until > NOW();

  -- Get pending amount (awaiting confirmation)
  SELECT COALESCE(SUM(commission_amount), 0)
  INTO v_pending_amount
  FROM commissions
  WHERE creator_id = v_creator_id AND status = 'pending';

  -- Get next unlock date
  SELECT MIN(lock_until)
  INTO v_next_unlock_date
  FROM commissions
  WHERE creator_id = v_creator_id
    AND status = 'locked'
    AND lock_until > NOW();

  -- Check if creator has verified bank account
  v_has_verified_bank := COALESCE(v_creator.bank_verified, false);

  -- Build result
  v_result := jsonb_build_object(
    'payable_now', COALESCE(v_payable_now, 0),
    'locked_amount', COALESCE(v_locked_amount, 0),
    'pending_amount', COALESCE(v_pending_amount, 0),
    'next_unlock_date', v_next_unlock_date,
    'risk_indicators', jsonb_build_object(
      'has_unverified_bank', NOT v_has_verified_bank,
      'has_locked_commissions', COALESCE(v_locked_amount, 0) > 0,
      'days_to_full_payout', CASE
        WHEN v_next_unlock_date IS NULL THEN 0
        ELSE GREATEST(0, EXTRACT(DAY FROM (v_next_unlock_date - NOW())))
      END
    ),
    'can_receive_payout', COALESCE(v_payable_now, 0) > 0 AND v_has_verified_bank AND v_creator.status = 'active'
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. FIX GET_CREATOR_LEDGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_creator_ledger(
  p_creator_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_transaction_type TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_creator_id UUID;
  v_entries JSONB;
  v_total_count INT;
BEGIN
  -- Get creator_id
  v_creator_id := COALESCE(p_creator_id, get_my_creator_id());

  IF v_creator_id IS NULL THEN
    RETURN jsonb_build_object('entries', '[]'::jsonb, 'total_count', 0, 'limit', p_limit, 'offset', p_offset);
  END IF;

  -- Get total count
  SELECT COUNT(*)
  INTO v_total_count
  FROM financial_ledger
  WHERE creator_id = v_creator_id
    AND (p_transaction_type IS NULL OR transaction_type = p_transaction_type);

  -- Get entries
  SELECT COALESCE(jsonb_agg(entry ORDER BY created_at DESC), '[]'::jsonb)
  INTO v_entries
  FROM (
    SELECT jsonb_build_object(
      'id', id,
      'entry_number', entry_number,
      'transaction_type', transaction_type,
      'amount', amount,
      'balance_after', balance_after,
      'description', description,
      'shopify_order_id', shopify_order_id,
      'wise_transfer_reference', wise_transfer_reference,
      'metadata', metadata,
      'created_at', created_at
    ) AS entry
    FROM financial_ledger
    WHERE creator_id = v_creator_id
      AND (p_transaction_type IS NULL OR transaction_type = p_transaction_type)
    ORDER BY created_at DESC
    LIMIT p_limit
    OFFSET p_offset
  ) sub;

  RETURN jsonb_build_object(
    'entries', v_entries,
    'total_count', v_total_count,
    'limit', p_limit,
    'offset', p_offset
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. FIX GET_CREATOR_TIMELINE FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_creator_timeline(
  p_creator_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
  v_creator_id UUID;
  v_events JSONB;
  v_total_count INT;
BEGIN
  -- Get creator_id
  v_creator_id := COALESCE(p_creator_id, get_my_creator_id());

  IF v_creator_id IS NULL THEN
    RETURN jsonb_build_object('events', '[]'::jsonb, 'total_count', 0, 'limit', p_limit, 'offset', p_offset);
  END IF;

  -- Get total count
  SELECT COUNT(*)
  INTO v_total_count
  FROM creator_timeline_events
  WHERE creator_id = v_creator_id;

  -- Get events with explanations
  SELECT COALESCE(jsonb_agg(event ORDER BY event_date DESC), '[]'::jsonb)
  INTO v_events
  FROM (
    SELECT jsonb_build_object(
      'id', id,
      'event_date', event_date,
      'transaction_type', transaction_type,
      'event_label', event_label,
      'amount', amount,
      'balance_after', balance_after,
      'reason', reason,
      'shopify_order_id', shopify_order_id,
      'wise_transfer_reference', wise_transfer_reference,
      'explanation', CASE transaction_type
        WHEN 'commission_earned' THEN 'Une commande utilisant votre code a ete validee. La commission sera disponible apres la periode de verification.'
        WHEN 'commission_canceled' THEN 'La commande associee a ete annulee ou remboursee.'
        WHEN 'payout_initiated' THEN 'Votre paiement est en cours de traitement.'
        WHEN 'payout_sent' THEN 'Votre paiement a ete envoye. Il devrait arriver sous 1-3 jours ouvrables.'
        WHEN 'payout_completed' THEN 'Votre paiement a ete confirme comme recu.'
        WHEN 'payout_failed' THEN 'Le paiement a echoue. Le montant a ete recredite a votre solde.'
        WHEN 'payout_fee' THEN 'Frais de transfert bancaire deduits du paiement.'
        ELSE 'Mouvement sur votre compte.'
      END
    ) AS event
    FROM creator_timeline_events
    WHERE creator_id = v_creator_id
    ORDER BY event_date DESC
    LIMIT p_limit
    OFFSET p_offset
  ) sub;

  RETURN jsonb_build_object(
    'events', v_events,
    'total_count', v_total_count,
    'limit', p_limit,
    'offset', p_offset
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 10. FIX GET_CREATOR_NOTIFICATIONS FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_creator_notifications(
  p_creator_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 20,
  p_unread_only BOOLEAN DEFAULT FALSE
)
RETURNS JSONB AS $$
DECLARE
  v_creator_id UUID;
  v_notifications JSONB;
  v_unread_count INT;
BEGIN
  -- Get creator_id
  v_creator_id := COALESCE(p_creator_id, get_my_creator_id());

  IF v_creator_id IS NULL THEN
    RETURN jsonb_build_object('notifications', '[]'::jsonb, 'unread_count', 0);
  END IF;

  -- Get unread count
  SELECT COUNT(*)
  INTO v_unread_count
  FROM creator_notifications
  WHERE creator_id = v_creator_id AND read = false;

  -- Get notifications
  SELECT COALESCE(jsonb_agg(notif ORDER BY created_at DESC), '[]'::jsonb)
  INTO v_notifications
  FROM (
    SELECT jsonb_build_object(
      'id', id,
      'type', type,
      'title', title,
      'message', message,
      'amount', amount,
      'reference_id', reference_id,
      'read', read,
      'created_at', created_at
    ) AS notif
    FROM creator_notifications
    WHERE creator_id = v_creator_id
      AND (NOT p_unread_only OR read = false)
    ORDER BY created_at DESC
    LIMIT p_limit
  ) sub;

  RETURN jsonb_build_object(
    'notifications', v_notifications,
    'unread_count', COALESCE(v_unread_count, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 11. FIX MARK_NOTIFICATION_READ FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE creator_notifications
  SET read = true
  WHERE id = p_notification_id
    AND creator_id = get_my_creator_id();

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 12. FIX MARK_ALL_NOTIFICATIONS_READ FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE creator_notifications
  SET read = true
  WHERE creator_id = get_my_creator_id()
    AND read = false;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 13. FIX RLS POLICIES FOR CREATORS TABLE
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admin full access to creators" ON creators;
DROP POLICY IF EXISTS "Creators read own profile" ON creators;
DROP POLICY IF EXISTS "Creators accessible by authenticated" ON creators;

-- Recreate policies
CREATE POLICY "Creators read own profile" ON creators
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Admin full access to creators" ON creators
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- 14. FIX RLS POLICIES FOR FINANCIAL_LEDGER
-- ============================================================================

DROP POLICY IF EXISTS "Admin read all ledger" ON financial_ledger;
DROP POLICY IF EXISTS "Creators read own ledger" ON financial_ledger;
DROP POLICY IF EXISTS "Ledger viewable by super_admin" ON financial_ledger;

CREATE POLICY "Admin read all ledger" ON financial_ledger
  FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "Creators read own ledger" ON financial_ledger
  FOR SELECT TO authenticated
  USING (creator_id = get_my_creator_id());

-- ============================================================================
-- 15. FIX RLS POLICIES FOR CREATOR_NOTIFICATIONS
-- ============================================================================

DROP POLICY IF EXISTS "Admin read all notifications" ON creator_notifications;
DROP POLICY IF EXISTS "Creators read own notifications" ON creator_notifications;
DROP POLICY IF EXISTS "Creators update own notifications" ON creator_notifications;

CREATE POLICY "Admin read all notifications" ON creator_notifications
  FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "Creators read own notifications" ON creator_notifications
  FOR SELECT TO authenticated
  USING (creator_id = get_my_creator_id());

CREATE POLICY "Creators update own notifications" ON creator_notifications
  FOR UPDATE TO authenticated
  USING (creator_id = get_my_creator_id())
  WITH CHECK (creator_id = get_my_creator_id());

-- ============================================================================
-- 16. LINK ALL CREATORS TO AUTH USERS
-- ============================================================================

-- Link creators to auth users by email
UPDATE creators c
SET user_id = u.id
FROM auth.users u
WHERE LOWER(c.email) = LOWER(u.email)
AND c.user_id IS DISTINCT FROM u.id;

-- ============================================================================
-- 17. VERIFICATION
-- ============================================================================

SELECT 'Creator Portal SQL Fix Complete!' AS status;

SELECT
  (SELECT COUNT(*) FROM creators) AS total_creators,
  (SELECT COUNT(*) FROM creators WHERE user_id IS NOT NULL) AS linked_creators,
  (SELECT COUNT(*) FROM financial_ledger) AS ledger_entries,
  (SELECT COUNT(*) FROM creator_notifications) AS notifications;
