-- ============================================================================
-- YEOSKIN DASHBOARD - FINANCIAL INTEGRITY CHECKS
-- ============================================================================
-- Lightweight integrity monitoring without over-engineering
-- Callable by N8N daily for automated alerts
-- ============================================================================

-- ============================================================================
-- 1. FUNCTION: Run all financial integrity checks
-- ============================================================================
CREATE OR REPLACE FUNCTION run_financial_integrity_checks()
RETURNS TABLE (
  check_name TEXT,
  status TEXT,
  details JSONB,
  checked_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- CHECK 1: No paid commissions without payout linkage
  -- (commissions marked 'paid' should be linked to a payout_batch via payout_item_commissions)
  RETURN QUERY
  SELECT
    'orphan_paid_commissions'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
    jsonb_build_object(
      'count', COUNT(*),
      'commission_ids', COALESCE(array_agg(c.id) FILTER (WHERE c.id IS NOT NULL), ARRAY[]::UUID[])
    ),
    v_now
  FROM commissions c
  WHERE c.status = 'paid'
    AND NOT EXISTS (
      SELECT 1 FROM payout_item_commissions pic WHERE pic.commission_id = c.id
    );

  -- CHECK 2: Ledger balance consistency
  -- For each creator, the latest balance_after should match sum of all their transactions
  RETURN QUERY
  WITH creator_computed AS (
    SELECT
      creator_id,
      SUM(CASE
        WHEN transaction_type IN ('commission_earned', 'payout_failed', 'balance_adjustment') THEN amount
        ELSE -amount
      END) AS computed_balance
    FROM financial_ledger
    GROUP BY creator_id
  ),
  creator_stored AS (
    SELECT DISTINCT ON (creator_id)
      creator_id,
      balance_after AS stored_balance
    FROM financial_ledger
    ORDER BY creator_id, entry_number DESC
  ),
  mismatches AS (
    SELECT
      cc.creator_id,
      cc.computed_balance,
      cs.stored_balance
    FROM creator_computed cc
    JOIN creator_stored cs ON cs.creator_id = cc.creator_id
    WHERE ABS(cc.computed_balance - cs.stored_balance) > 0.01
  )
  SELECT
    'ledger_balance_integrity'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
    jsonb_build_object(
      'mismatches', COUNT(*),
      'creators', COALESCE(
        (SELECT jsonb_agg(jsonb_build_object(
          'creator_id', m.creator_id,
          'computed', m.computed_balance,
          'stored', m.stored_balance,
          'diff', m.computed_balance - m.stored_balance
        )) FROM mismatches m),
        '[]'::jsonb
      )
    ),
    v_now;

  -- CHECK 3: No duplicate commissions per order (should be prevented by constraint, but verify)
  RETURN QUERY
  SELECT
    'duplicate_order_commissions'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
    jsonb_build_object(
      'duplicates', COUNT(*),
      'orders', COALESCE(
        (SELECT jsonb_agg(jsonb_build_object('order_id', order_id, 'count', cnt))
         FROM (
           SELECT order_id, COUNT(*) as cnt
           FROM commissions
           WHERE order_id IS NOT NULL
           GROUP BY order_id, creator_id
           HAVING COUNT(*) > 1
         ) dups),
        '[]'::jsonb
      )
    ),
    v_now;

  -- CHECK 4: Payout item amounts match their linked commissions
  RETURN QUERY
  WITH payout_sums AS (
    SELECT
      pi.id AS payout_item_id,
      pi.amount AS item_amount,
      COALESCE(SUM(c.commission_amount), 0) AS commission_sum
    FROM payout_items pi
    LEFT JOIN payout_item_commissions pic ON pic.payout_item_id = pi.id
    LEFT JOIN commissions c ON c.id = pic.commission_id
    WHERE pi.status IN ('sent', 'paid')
    GROUP BY pi.id, pi.amount
  ),
  mismatches AS (
    SELECT * FROM payout_sums
    WHERE ABS(item_amount - commission_sum) > 0.01
  )
  SELECT
    'payout_commission_match'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
    jsonb_build_object(
      'mismatches', COUNT(*),
      'items', COALESCE(
        (SELECT jsonb_agg(jsonb_build_object(
          'payout_item_id', m.payout_item_id,
          'item_amount', m.item_amount,
          'commission_sum', m.commission_sum,
          'diff', m.item_amount - m.commission_sum
        )) FROM mismatches m),
        '[]'::jsonb
      )
    ),
    v_now;

  -- CHECK 5: No negative balances (should be prevented by add_ledger_entry, but verify)
  RETURN QUERY
  SELECT
    'negative_balances'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
    jsonb_build_object(
      'count', COUNT(*),
      'creators', COALESCE(
        (SELECT jsonb_agg(jsonb_build_object(
          'creator_id', cb.creator_id,
          'balance', cb.current_balance
        ))
        FROM creator_balances cb
        WHERE cb.current_balance < -0.01),
        '[]'::jsonb
      )
    ),
    v_now;

  -- CHECK 6: Pending payouts not stuck (items in 'processing' for > 24h)
  RETURN QUERY
  SELECT
    'stuck_payouts'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARN' END::TEXT,
    jsonb_build_object(
      'count', COUNT(*),
      'items', COALESCE(
        (SELECT jsonb_agg(jsonb_build_object(
          'payout_item_id', pi.id,
          'creator_id', pi.creator_id,
          'amount', pi.amount,
          'created_at', pi.created_at,
          'hours_stuck', EXTRACT(EPOCH FROM (NOW() - pi.created_at)) / 3600
        ))
        FROM payout_items pi
        WHERE pi.status = 'processing'
          AND pi.created_at < NOW() - INTERVAL '24 hours'),
        '[]'::jsonb
      )
    ),
    v_now;

END;
$$;

-- ============================================================================
-- 2. FUNCTION: Quick health check (returns single JSON for N8N)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_financial_health_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_results JSONB;
  v_overall_status TEXT := 'HEALTHY';
  v_failed_checks INT := 0;
  v_warning_checks INT := 0;
BEGIN
  -- Run all checks and aggregate
  SELECT jsonb_agg(
    jsonb_build_object(
      'check', check_name,
      'status', status,
      'details', details
    )
  )
  INTO v_results
  FROM run_financial_integrity_checks();

  -- Count failures and warnings
  SELECT
    COUNT(*) FILTER (WHERE status = 'FAIL'),
    COUNT(*) FILTER (WHERE status = 'WARN')
  INTO v_failed_checks, v_warning_checks
  FROM run_financial_integrity_checks();

  -- Determine overall status
  IF v_failed_checks > 0 THEN
    v_overall_status := 'CRITICAL';
  ELSIF v_warning_checks > 0 THEN
    v_overall_status := 'WARNING';
  END IF;

  RETURN jsonb_build_object(
    'status', v_overall_status,
    'checked_at', NOW(),
    'summary', jsonb_build_object(
      'total_checks', jsonb_array_length(v_results),
      'passed', jsonb_array_length(v_results) - v_failed_checks - v_warning_checks,
      'warnings', v_warning_checks,
      'failures', v_failed_checks
    ),
    'checks', v_results
  );
END;
$$;

-- ============================================================================
-- 3. FUNCTION: Simple anomaly detection (basic velocity check)
-- ============================================================================
CREATE OR REPLACE FUNCTION check_order_velocity_anomalies(
  p_hours INT DEFAULT 24,
  p_threshold_multiplier DECIMAL DEFAULT 3.0
)
RETURNS TABLE (
  anomaly_type TEXT,
  creator_id UUID,
  creator_email TEXT,
  current_count BIGINT,
  avg_count DECIMAL,
  details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check for creators with unusually high order volume
  RETURN QUERY
  WITH recent_orders AS (
    SELECT
      c.id AS creator_id,
      c.email,
      COUNT(*) AS recent_count
    FROM orders o
    JOIN creators c ON c.id = o.creator_id
    WHERE o.created_at >= NOW() - (p_hours || ' hours')::INTERVAL
    GROUP BY c.id, c.email
  ),
  historical_avg AS (
    SELECT
      o.creator_id,
      COUNT(*)::DECIMAL / GREATEST(
        EXTRACT(EPOCH FROM (NOW() - MIN(o.created_at))) / 3600 / p_hours,
        1
      ) AS avg_per_period
    FROM orders o
    WHERE o.created_at < NOW() - (p_hours || ' hours')::INTERVAL
    GROUP BY o.creator_id
  )
  SELECT
    'high_velocity'::TEXT,
    ro.creator_id,
    ro.email,
    ro.recent_count,
    COALESCE(ha.avg_per_period, 1)::DECIMAL,
    jsonb_build_object(
      'period_hours', p_hours,
      'multiplier', ro.recent_count::DECIMAL / GREATEST(COALESCE(ha.avg_per_period, 1), 1),
      'threshold', p_threshold_multiplier
    )
  FROM recent_orders ro
  LEFT JOIN historical_avg ha ON ha.creator_id = ro.creator_id
  WHERE ro.recent_count > GREATEST(COALESCE(ha.avg_per_period, 1), 1) * p_threshold_multiplier
    AND ro.recent_count > 3; -- Minimum 3 orders to trigger

  -- Check for unusually high-value single orders
  RETURN QUERY
  WITH order_stats AS (
    SELECT
      AVG(total_amount) AS avg_amount,
      STDDEV(total_amount) AS stddev_amount
    FROM orders
    WHERE created_at >= NOW() - INTERVAL '90 days'
  )
  SELECT
    'high_value_order'::TEXT,
    c.id,
    c.email,
    1::BIGINT,
    os.avg_amount,
    jsonb_build_object(
      'order_id', o.id,
      'order_total', o.total_amount,
      'avg_order', os.avg_amount,
      'stddev', os.stddev_amount,
      'z_score', (o.total_amount - os.avg_amount) / GREATEST(os.stddev_amount, 1)
    )
  FROM orders o
  JOIN creators c ON c.id = o.creator_id
  CROSS JOIN order_stats os
  WHERE o.created_at >= NOW() - (p_hours || ' hours')::INTERVAL
    AND o.total_amount > os.avg_amount + (3 * GREATEST(os.stddev_amount, os.avg_amount * 0.5));

END;
$$;

-- ============================================================================
-- 4. GRANT PERMISSIONS
-- ============================================================================
-- Only admins and service role can run these checks
REVOKE ALL ON FUNCTION run_financial_integrity_checks() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION run_financial_integrity_checks() TO service_role;

REVOKE ALL ON FUNCTION get_financial_health_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_financial_health_status() TO service_role;

REVOKE ALL ON FUNCTION check_order_velocity_anomalies(INT, DECIMAL) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_order_velocity_anomalies(INT, DECIMAL) TO service_role;

-- ============================================================================
-- 5. VERIFICATION
-- ============================================================================
SELECT 'Financial integrity checks installed!' AS status;
