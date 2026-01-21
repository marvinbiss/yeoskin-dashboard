-- ============================================================================
-- FINAL FIX: created_at column not in scope error
-- ============================================================================
-- The issue: jsonb_agg(entry ORDER BY created_at) can't see created_at
-- because the subquery only returns 'entry' (jsonb), not created_at
-- ============================================================================

-- ============================================================================
-- 1. FIX GET_CREATOR_DASHBOARD FUNCTION
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
BEGIN
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

  -- Get balance
  SELECT
    COALESCE(current_balance, 0) AS current_balance,
    COALESCE(total_earned, 0) AS total_earned,
    COALESCE(total_paid, 0) AS total_paid,
    COALESCE(total_fees, 0) AS total_fees
  INTO v_balance
  FROM creator_balances
  WHERE creator_id = v_creator_id;

  -- FIX: Include created_at in subquery so ORDER BY can reference it
  SELECT COALESCE(jsonb_agg(entry ORDER BY entry_created_at DESC), '[]'::jsonb)
  INTO v_recent_activity
  FROM (
    SELECT
      jsonb_build_object(
        'id', id,
        'type', transaction_type,
        'amount', amount,
        'balance_after', balance_after,
        'description', description,
        'created_at', created_at
      ) AS entry,
      created_at AS entry_created_at
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

  -- Get unread notifications
  SELECT COUNT(*)
  INTO v_unread_count
  FROM creator_notifications
  WHERE creator_id = v_creator_id AND read = false;

  RETURN jsonb_build_object(
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. FIX GET_CREATOR_LEDGER FUNCTION
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
  v_creator_id := COALESCE(p_creator_id, get_my_creator_id());

  IF v_creator_id IS NULL THEN
    RETURN jsonb_build_object('entries', '[]'::jsonb, 'total_count', 0, 'limit', p_limit, 'offset', p_offset);
  END IF;

  SELECT COUNT(*)
  INTO v_total_count
  FROM financial_ledger
  WHERE creator_id = v_creator_id
    AND (p_transaction_type IS NULL OR transaction_type = p_transaction_type);

  -- FIX: Include created_at in subquery for ORDER BY
  SELECT COALESCE(jsonb_agg(entry ORDER BY entry_created_at DESC), '[]'::jsonb)
  INTO v_entries
  FROM (
    SELECT
      jsonb_build_object(
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
      ) AS entry,
      created_at AS entry_created_at
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
-- 3. FIX GET_CREATOR_TIMELINE FUNCTION
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
  v_creator_id := COALESCE(p_creator_id, get_my_creator_id());

  IF v_creator_id IS NULL THEN
    RETURN jsonb_build_object('events', '[]'::jsonb, 'total_count', 0, 'limit', p_limit, 'offset', p_offset);
  END IF;

  SELECT COUNT(*)
  INTO v_total_count
  FROM creator_timeline_events
  WHERE creator_id = v_creator_id;

  -- FIX: Include event_date in subquery for ORDER BY
  SELECT COALESCE(jsonb_agg(event ORDER BY event_date_sort DESC), '[]'::jsonb)
  INTO v_events
  FROM (
    SELECT
      jsonb_build_object(
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
          WHEN 'commission_earned' THEN 'Une commande utilisant votre code a ete validee.'
          WHEN 'commission_canceled' THEN 'La commande associee a ete annulee ou remboursee.'
          WHEN 'payout_initiated' THEN 'Votre paiement est en cours de traitement.'
          WHEN 'payout_sent' THEN 'Votre paiement a ete envoye. Arrivee sous 1-3 jours.'
          WHEN 'payout_completed' THEN 'Votre paiement a ete confirme.'
          WHEN 'payout_failed' THEN 'Le paiement a echoue. Montant recredite.'
          WHEN 'payout_fee' THEN 'Frais de transfert bancaire.'
          ELSE 'Mouvement sur votre compte.'
        END
      ) AS event,
      event_date AS event_date_sort
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
-- 4. FIX GET_CREATOR_NOTIFICATIONS FUNCTION
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
  v_creator_id := COALESCE(p_creator_id, get_my_creator_id());

  IF v_creator_id IS NULL THEN
    RETURN jsonb_build_object('notifications', '[]'::jsonb, 'unread_count', 0);
  END IF;

  SELECT COUNT(*)
  INTO v_unread_count
  FROM creator_notifications
  WHERE creator_id = v_creator_id AND read = false;

  -- FIX: Include created_at in subquery for ORDER BY
  SELECT COALESCE(jsonb_agg(notif ORDER BY notif_created_at DESC), '[]'::jsonb)
  INTO v_notifications
  FROM (
    SELECT
      jsonb_build_object(
        'id', id,
        'type', type,
        'title', title,
        'message', message,
        'amount', amount,
        'reference_id', reference_id,
        'read', read,
        'created_at', created_at
      ) AS notif,
      created_at AS notif_created_at
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
-- 5. VERIFY
-- ============================================================================

SELECT 'Functions fixed!' AS status;

-- Test the functions
SELECT get_creator_dashboard(NULL) AS dashboard_test;
