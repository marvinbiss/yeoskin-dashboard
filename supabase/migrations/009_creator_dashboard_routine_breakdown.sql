-- ============================================================================
-- YEOSKIN DASHBOARD - CREATOR DASHBOARD ROUTINE BREAKDOWN
-- ============================================================================
-- Adds routine + variant breakdown to creator dashboard
-- Performance-optimized for 10,000+ creators
-- ============================================================================

-- ============================================================================
-- 1. UPDATE get_creator_dashboard TO INCLUDE LOCKED COMMISSIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_creator_dashboard(p_creator_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  v_creator_id UUID;
  v_balance RECORD;
  v_recent_activity JSONB;
  v_pending RECORD;
  v_locked RECORD;
  v_payable RECORD;
  v_paid RECORD;
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

  -- Get locked commissions (NEW)
  SELECT COUNT(*), COALESCE(SUM(commission_amount), 0)
  INTO v_locked
  FROM commissions
  WHERE creator_id = v_creator_id AND status = 'locked';

  -- Get payable commissions
  SELECT COUNT(*), COALESCE(SUM(commission_amount), 0)
  INTO v_payable
  FROM commissions
  WHERE creator_id = v_creator_id AND status = 'payable';

  -- Get paid commissions (NEW)
  SELECT COUNT(*), COALESCE(SUM(commission_amount), 0)
  INTO v_paid
  FROM commissions
  WHERE creator_id = v_creator_id AND status = 'paid';

  -- Get unread notifications count
  SELECT COUNT(*)
  INTO v_unread_count
  FROM creator_notifications
  WHERE creator_id = v_creator_id AND read = false;

  -- Build result with ALL status breakdowns
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
    'locked_commissions', jsonb_build_object(
      'count', COALESCE(v_locked.count, 0),
      'amount', COALESCE(v_locked.sum, 0)
    ),
    'payable_commissions', jsonb_build_object(
      'count', COALESCE(v_payable.count, 0),
      'amount', COALESCE(v_payable.sum, 0)
    ),
    'paid_commissions', jsonb_build_object(
      'count', COALESCE(v_paid.count, 0),
      'amount', COALESCE(v_paid.sum, 0)
    ),
    'unread_notifications', v_unread_count
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. GET ROUTINE BREAKDOWN FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_routine_breakdown(p_creator_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  v_creator_id UUID;
  v_breakdown JSONB;
  v_total_stats RECORD;
BEGIN
  -- Get creator_id
  v_creator_id := COALESCE(p_creator_id, get_my_creator_id());

  IF v_creator_id IS NULL THEN
    RAISE EXCEPTION 'Creator not found';
  END IF;

  -- Get breakdown by routine + variant
  SELECT COALESCE(jsonb_agg(row_data ORDER BY total_commission DESC), '[]'::jsonb)
  INTO v_breakdown
  FROM (
    SELECT jsonb_build_object(
      'routine_id', c.routine_id,
      'routine_name', COALESCE(r.title, 'Sans routine'),
      'variant', COALESCE(c.routine_variant::TEXT, 'base'),
      'order_count', COUNT(DISTINCT c.order_id),
      'total_revenue', SUM(c.order_total),
      'total_commission', SUM(c.commission_amount),
      'avg_commission_rate', AVG(c.commission_rate),
      'pending_count', COUNT(*) FILTER (WHERE c.status = 'pending'),
      'locked_count', COUNT(*) FILTER (WHERE c.status = 'locked'),
      'payable_count', COUNT(*) FILTER (WHERE c.status = 'payable'),
      'paid_count', COUNT(*) FILTER (WHERE c.status = 'paid')
    ) AS row_data,
    SUM(c.commission_amount) AS total_commission
    FROM commissions c
    LEFT JOIN routines r ON r.id = c.routine_id
    WHERE c.creator_id = v_creator_id
    GROUP BY c.routine_id, r.title, c.routine_variant
  ) sub;

  -- Get total stats
  SELECT
    COUNT(DISTINCT order_id) AS total_orders,
    COALESCE(SUM(order_total), 0) AS total_revenue,
    COALESCE(SUM(commission_amount), 0) AS total_commission,
    COALESCE(AVG(commission_rate), 0) AS avg_rate
  INTO v_total_stats
  FROM commissions
  WHERE creator_id = v_creator_id;

  -- Calculate upsell rate
  RETURN jsonb_build_object(
    'breakdown', v_breakdown,
    'totals', jsonb_build_object(
      'total_orders', v_total_stats.total_orders,
      'total_revenue', v_total_stats.total_revenue,
      'total_commission', v_total_stats.total_commission,
      'avg_commission_rate', v_total_stats.avg_rate,
      'upsell_rate', (
        SELECT CASE
          WHEN COUNT(*) = 0 THEN 0
          ELSE ROUND(
            COUNT(*) FILTER (WHERE routine_variant IN ('upsell_1', 'upsell_2'))::NUMERIC /
            NULLIF(COUNT(*), 0) * 100, 1
          )
        END
        FROM commissions
        WHERE creator_id = v_creator_id AND routine_id IS NOT NULL
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. GET COMMISSIONS HISTORY WITH ROUTINE INFO
-- ============================================================================

CREATE OR REPLACE FUNCTION get_commissions_history(
  p_creator_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_status TEXT DEFAULT NULL,
  p_routine_id UUID DEFAULT NULL,
  p_variant TEXT DEFAULT NULL
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

  -- Get total count with filters
  SELECT COUNT(*)
  INTO v_total_count
  FROM commissions c
  WHERE c.creator_id = v_creator_id
    AND (p_status IS NULL OR c.status = p_status)
    AND (p_routine_id IS NULL OR c.routine_id = p_routine_id)
    AND (p_variant IS NULL OR c.routine_variant::TEXT = p_variant);

  -- Get entries with routine info
  SELECT COALESCE(jsonb_agg(entry ORDER BY created_at DESC), '[]'::jsonb)
  INTO v_entries
  FROM (
    SELECT jsonb_build_object(
      'id', c.id,
      'order_id', c.order_id,
      'routine_id', c.routine_id,
      'routine_name', COALESCE(r.title, 'Sans routine'),
      'routine_variant', COALESCE(c.routine_variant::TEXT, 'base'),
      'order_total', c.order_total,
      'commission_rate', c.commission_rate,
      'commission_amount', c.commission_amount,
      'status', c.status,
      'lock_until', c.lock_until,
      'created_at', c.created_at
    ) AS entry,
    c.created_at
    FROM commissions c
    LEFT JOIN routines r ON r.id = c.routine_id
    WHERE c.creator_id = v_creator_id
      AND (p_status IS NULL OR c.status = p_status)
      AND (p_routine_id IS NULL OR c.routine_id = p_routine_id)
      AND (p_variant IS NULL OR c.routine_variant::TEXT = p_variant)
    ORDER BY c.created_at DESC
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
-- 4. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for routine breakdown queries
CREATE INDEX IF NOT EXISTS idx_commissions_routine_breakdown
ON commissions(creator_id, routine_id, routine_variant, status);

-- Index for commission history queries
CREATE INDEX IF NOT EXISTS idx_commissions_history
ON commissions(creator_id, created_at DESC);

-- Composite index for filtered queries
CREATE INDEX IF NOT EXISTS idx_commissions_status_routine
ON commissions(creator_id, status, routine_id);

-- ============================================================================
-- 5. GRANT EXECUTE PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_routine_breakdown(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_commissions_history(UUID, INT, INT, TEXT, UUID, TEXT) TO authenticated;
