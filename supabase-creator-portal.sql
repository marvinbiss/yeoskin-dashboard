-- ============================================================================
-- YEOSKIN DASHBOARD - CREATOR PORTAL
-- ============================================================================
-- Creator Experience Platform - Read-only portal for creators
-- - Secure data isolation via RLS
-- - Dashboard, timeline, ledger, notifications
-- - No execution power (read-only)
-- ============================================================================
-- Execute AFTER: supabase-financial-ledger.sql
-- ============================================================================

-- ============================================================================
-- 1. LINK CREATORS TO AUTH USERS
-- ============================================================================

-- Add user_id to creators for authentication
ALTER TABLE creators ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_creators_user_id ON creators(user_id);

-- Function to link creator on first login (by email)
CREATE OR REPLACE FUNCTION link_creator_to_user(p_user_id UUID, p_email TEXT)
RETURNS UUID AS $$
  UPDATE creators SET user_id = p_user_id, updated_at = NOW()
  WHERE LOWER(email) = LOWER(p_email) AND user_id IS NULL
  RETURNING id;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================================
-- 2. RLS HELPER FUNCTIONS
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
-- 3. CREATOR NOTIFICATIONS TABLE
-- ============================================================================

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

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE creator_notifications;

-- ============================================================================
-- 4. RLS POLICIES - DROP EXISTING FIRST
-- ============================================================================

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Creators accessible by authenticated" ON creators;
DROP POLICY IF EXISTS "Commissions accessible by authenticated" ON commissions;
DROP POLICY IF EXISTS "Ledger viewable by super_admin" ON financial_ledger;
DROP POLICY IF EXISTS "Payout items accessible by authenticated" ON payout_items;

-- ============================================================================
-- 5. NEW RLS POLICIES FOR CREATORS TABLE
-- ============================================================================

-- Admins have full access to creators
CREATE POLICY "Admin full access to creators" ON creators
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Creators can only read their own profile
CREATE POLICY "Creators read own profile" ON creators
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- ============================================================================
-- 6. RLS POLICIES FOR COMMISSIONS TABLE
-- ============================================================================

-- Admins have full access to commissions
CREATE POLICY "Admin full access to commissions" ON commissions
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Creators can only read their own commissions
CREATE POLICY "Creators read own commissions" ON commissions
  FOR SELECT TO authenticated
  USING (creator_id = get_my_creator_id() OR is_admin());

-- ============================================================================
-- 7. RLS POLICIES FOR FINANCIAL LEDGER
-- ============================================================================

-- Drop the old policy and recreate
DROP POLICY IF EXISTS "Ledger insertable via functions only" ON financial_ledger;

-- Admins can read all ledger entries
CREATE POLICY "Admin read all ledger" ON financial_ledger
  FOR SELECT TO authenticated
  USING (is_admin());

-- Creators can read only their own ledger entries
CREATE POLICY "Creators read own ledger" ON financial_ledger
  FOR SELECT TO authenticated
  USING (creator_id = get_my_creator_id());

-- Insert only via functions (SECURITY DEFINER)
CREATE POLICY "Ledger insert via functions" ON financial_ledger
  FOR INSERT TO authenticated
  WITH CHECK (false); -- Blocked - use functions instead

-- ============================================================================
-- 8. RLS POLICIES FOR PAYOUT ITEMS
-- ============================================================================

-- Admins have full access to payout_items
CREATE POLICY "Admin full access to payout_items" ON payout_items
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Creators can only read their own payout items
CREATE POLICY "Creators read own payout_items" ON payout_items
  FOR SELECT TO authenticated
  USING (creator_id = get_my_creator_id() OR is_admin());

-- ============================================================================
-- 9. RLS POLICIES FOR CREATOR NOTIFICATIONS
-- ============================================================================

-- Admins can read all notifications
CREATE POLICY "Admin read all notifications" ON creator_notifications
  FOR SELECT TO authenticated
  USING (is_admin());

-- Creators can read their own notifications
CREATE POLICY "Creators read own notifications" ON creator_notifications
  FOR SELECT TO authenticated
  USING (creator_id = get_my_creator_id());

-- Creators can update (mark as read) their own notifications
CREATE POLICY "Creators update own notifications" ON creator_notifications
  FOR UPDATE TO authenticated
  USING (creator_id = get_my_creator_id())
  WITH CHECK (creator_id = get_my_creator_id());

-- ============================================================================
-- 10. CREATOR DASHBOARD FUNCTION
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
    RAISE EXCEPTION 'Creator not found';
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
    'unread_notifications', v_unread_count
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 11. PAYOUT FORECAST FUNCTION
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
    RAISE EXCEPTION 'Creator not found';
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
  v_has_verified_bank := v_creator.bank_verified;

  -- Build result
  v_result := jsonb_build_object(
    'payable_now', v_payable_now,
    'locked_amount', v_locked_amount,
    'pending_amount', v_pending_amount,
    'next_unlock_date', v_next_unlock_date,
    'risk_indicators', jsonb_build_object(
      'has_unverified_bank', NOT v_has_verified_bank,
      'has_locked_commissions', v_locked_amount > 0,
      'days_to_full_payout', CASE
        WHEN v_next_unlock_date IS NULL THEN 0
        ELSE EXTRACT(DAY FROM (v_next_unlock_date - NOW()))
      END
    ),
    'can_receive_payout', v_payable_now > 0 AND v_has_verified_bank AND v_creator.status = 'active'
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 12. PAGINATED LEDGER FUNCTION
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
    RAISE EXCEPTION 'Creator not found';
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
-- 13. TIMELINE EVENTS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW creator_timeline_events AS
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
-- 14. GET CREATOR TIMELINE FUNCTION
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
    RAISE EXCEPTION 'Creator not found';
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
-- 15. GET CREATOR NOTIFICATIONS FUNCTION
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
    RAISE EXCEPTION 'Creator not found';
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
    'unread_count', v_unread_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 16. MARK NOTIFICATION AS READ
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
-- 17. MARK ALL NOTIFICATIONS AS READ
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
-- 18. NOTIFICATION TRIGGER ON LEDGER EVENTS
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_creator_on_ledger_event()
RETURNS TRIGGER AS $$
DECLARE
  v_title TEXT;
  v_message TEXT;
  v_type TEXT;
BEGIN
  -- Determine notification type and content
  CASE NEW.transaction_type
    WHEN 'commission_earned' THEN
      v_type := 'commission_earned';
      v_title := 'Nouvelle commission !';
      v_message := format('Vous avez gagne %.2f EUR', NEW.amount);
    WHEN 'payout_sent' THEN
      v_type := 'payout_sent';
      v_title := 'Paiement envoye';
      v_message := format('Un paiement de %.2f EUR a ete envoye', NEW.amount);
    WHEN 'payout_completed' THEN
      v_type := 'payout_completed';
      v_title := 'Paiement recu !';
      v_message := format('Votre paiement de %.2f EUR a ete confirme', NEW.amount);
    WHEN 'payout_failed' THEN
      v_type := 'payout_failed';
      v_title := 'Echec du paiement';
      v_message := format('Le paiement de %.2f EUR a echoue. Le montant a ete recredite.', NEW.amount);
    ELSE
      -- Don't create notification for other types
      RETURN NEW;
  END CASE;

  -- Create notification
  INSERT INTO creator_notifications (
    creator_id,
    type,
    title,
    message,
    amount,
    reference_id
  ) VALUES (
    NEW.creator_id,
    v_type,
    v_title,
    v_message,
    NEW.amount,
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS tr_notify_creator_on_ledger ON financial_ledger;
CREATE TRIGGER tr_notify_creator_on_ledger
  AFTER INSERT ON financial_ledger
  FOR EACH ROW
  EXECUTE FUNCTION notify_creator_on_ledger_event();

-- ============================================================================
-- 19. GET CREATOR PROFILE (for display)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_my_creator_profile()
RETURNS JSONB AS $$
DECLARE
  v_creator RECORD;
  v_bank RECORD;
BEGIN
  -- Get creator
  SELECT * INTO v_creator
  FROM creators
  WHERE user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  -- Get bank account
  SELECT * INTO v_bank
  FROM creator_bank_accounts
  WHERE creator_id = v_creator.id
  LIMIT 1;

  RETURN jsonb_build_object(
    'found', true,
    'id', v_creator.id,
    'email', v_creator.email,
    'discount_code', v_creator.discount_code,
    'commission_rate', v_creator.commission_rate,
    'status', v_creator.status,
    'lock_days', v_creator.lock_days,
    'created_at', v_creator.created_at,
    'has_bank_account', v_bank.id IS NOT NULL,
    'bank_verified', COALESCE(v_bank.is_verified, false)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 20. VERIFICATION
-- ============================================================================

SELECT
  'Creator Portal SQL installed!' AS status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'creator_notifications') AS has_notifications,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name = 'get_creator_dashboard') AS has_dashboard_fn,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name = 'get_payout_forecast') AS has_forecast_fn,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name = 'get_creator_ledger') AS has_ledger_fn;
