-- ============================================================================
-- YEOSKIN DASHBOARD - FINANCIAL CLOSE SYSTEM
-- ============================================================================
-- Bank-grade monthly close infrastructure:
-- 1. Period locking (pessimistic)
-- 2. Journal entry building (commissions + payouts)
-- 3. Entry posting with guardrails
-- 4. Rollback capability
-- 5. FEC DGFIP export format
-- ============================================================================

-- ============================================================================
-- 1. SEQUENCE: Journal entry numbering
-- ============================================================================
CREATE SEQUENCE IF NOT EXISTS public.journal_entry_seq START 1;

-- ============================================================================
-- 2. ALTER: Add close_run_id to journal_entries for audit trail
-- ============================================================================
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS close_run_id UUID;

CREATE INDEX IF NOT EXISTS idx_journal_entries_close_run_id
  ON journal_entries(close_run_id)
  WHERE close_run_id IS NOT NULL;

-- ============================================================================
-- 3. ALTER: Add pdf_path and csv_path to creator_statements
-- ============================================================================
ALTER TABLE creator_statements ADD COLUMN IF NOT EXISTS pdf_path TEXT;
ALTER TABLE creator_statements ADD COLUMN IF NOT EXISTS csv_path TEXT;
ALTER TABLE creator_statements ADD COLUMN IF NOT EXISTS content_hash_sha256 TEXT;

-- ============================================================================
-- 4. TABLE: Period locks (pessimistic locking for close process)
-- ============================================================================
CREATE TABLE IF NOT EXISTS finance_period_locks (
  period_id UUID PRIMARY KEY REFERENCES financial_periods(id),
  locked_at TIMESTAMPTZ DEFAULT NOW(),
  locked_by TEXT NOT NULL,
  close_run_id UUID NOT NULL
);

COMMENT ON TABLE finance_period_locks IS
'Pessimistic lock for financial close. Only one close process per period at a time.
Auto-cleanup after 1 hour via cleanup_dead_period_locks().';

-- ============================================================================
-- 5. FUNCTION: Cleanup dead period locks
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_dead_period_locks()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM finance_period_locks
  WHERE locked_at < NOW() - INTERVAL '1 hour';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- ============================================================================
-- 6. TABLE: Journal entries reference conflicts (duplicate detection)
-- ============================================================================
CREATE TABLE IF NOT EXISTS journal_entries_reference_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  reference TEXT NOT NULL,
  duplicate_count INT NOT NULL,
  journal_entry_ids UUID[] NOT NULL,
  resolution_status TEXT DEFAULT 'pending' CHECK (resolution_status IN ('pending', 'resolved', 'archived')),
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id)
);

-- Add unique constraint on reference for idempotent conflict detection
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_journal_entries_reference_conflicts_reference'
  ) THEN
    ALTER TABLE journal_entries_reference_conflicts
      ADD CONSTRAINT uq_journal_entries_reference_conflicts_reference UNIQUE (reference);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_je_conflicts_status
  ON journal_entries_reference_conflicts(resolution_status)
  WHERE resolution_status = 'pending';

-- ============================================================================
-- 7. FUNCTION: Format amount for FEC DGFIP (French decimal format)
-- ============================================================================
CREATE OR REPLACE FUNCTION format_fec_amount(p_amount NUMERIC)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF p_amount IS NULL THEN
    RETURN '0,00';
  END IF;
  RETURN REPLACE(
    TRIM(TO_CHAR(ROUND(p_amount, 2), 'FM999999999999990.00')),
    '.',
    ','
  );
END;
$$;

-- Test format_fec_amount
DO $$
BEGIN
  ASSERT format_fec_amount(NULL) = '0,00', 'format_fec_amount(NULL) failed';
  ASSERT format_fec_amount(0) = '0,00', 'format_fec_amount(0) failed';
  ASSERT format_fec_amount(1234.56) = '1234,56', 'format_fec_amount(1234.56) failed';
  ASSERT format_fec_amount(1234.5) = '1234,50', 'format_fec_amount(1234.5) failed';
  ASSERT format_fec_amount(-99.99) = '-99,99', 'format_fec_amount(-99.99) failed';
  RAISE NOTICE 'format_fec_amount tests passed';
END $$;

-- ============================================================================
-- 8. FUNCTION: Build journal entries for period close
-- ============================================================================
CREATE OR REPLACE FUNCTION finance_close_build_entries(
  p_period_id UUID,
  p_period_start DATE,
  p_period_end DATE,
  p_close_run_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_created_comm INT := 0;
  v_created_pay INT := 0;
  v_lines_comm INT := 0;
  v_lines_pay INT := 0;
  v_total INT := 0;
  v_posted INT := 0;
  v_skipped INT := 0;
  v_missing_run INT := 0;
BEGIN
  -- 1. Create journal entries for COMMISSIONS
  WITH ins AS (
    INSERT INTO journal_entries (
      entry_number,
      entry_date,
      period_id,
      entry_type,
      reference,
      description,
      close_run_id,
      status,
      total_debit,
      total_credit,
      created_by
    )
    SELECT
      'JE-' || TO_CHAR(p_period_start, 'YYYYMM') || '-' || LPAD(NEXTVAL('journal_entry_seq')::TEXT, 6, '0'),
      c.created_at::DATE,
      p_period_id,
      'commission',
      'PERIOD-' || p_period_id::TEXT || '-COMMISSION-' || c.id::TEXT,
      'Commission order ' || COALESCE(c.shopify_order_id, 'N/A') ||
        ' (commission_id ' || c.id::TEXT || ', period ' || p_period_id::TEXT || ')',
      p_close_run_id,
      'draft',
      c.commission_amount,
      c.commission_amount,
      'system'
    FROM commissions c
    WHERE c.created_at::DATE BETWEEN p_period_start AND p_period_end
      AND c.status IN ('paid', 'payable', 'locked')
    ORDER BY c.created_at, c.id
    ON CONFLICT (reference) DO NOTHING
    RETURNING id
  )
  SELECT COUNT(*) INTO v_created_comm FROM ins;

  -- 2. Create accounting lines for COMMISSIONS
  WITH comm_entries AS (
    SELECT
      je.id AS je_id,
      je.total_debit,
      SUBSTRING(je.reference FROM 'COMMISSION-(.*)$') AS cid
    FROM journal_entries je
    WHERE je.reference LIKE 'PERIOD-' || p_period_id::TEXT || '-COMMISSION-%'
      AND je.close_run_id = p_close_run_id
      AND NOT EXISTS (SELECT 1 FROM accounting_lines WHERE journal_entry_id = je.id)
  )
  INSERT INTO accounting_lines (journal_entry_id, line_number, account_code, account_name, debit, credit, description, reference)
  SELECT ce.je_id, 1, '624000', 'Commissions créateurs', ce.total_debit, 0, 'Commission ' || ce.cid, ce.cid FROM comm_entries ce
  UNION ALL
  SELECT ce.je_id, 2, '467000', 'Créditeurs divers - Créateurs', 0, ce.total_debit, 'Commission ' || ce.cid, ce.cid FROM comm_entries ce;

  GET DIAGNOSTICS v_lines_comm = ROW_COUNT;

  -- 3. Create journal entries for PAYOUTS
  WITH ins AS (
    INSERT INTO journal_entries (
      entry_number,
      entry_date,
      period_id,
      entry_type,
      reference,
      description,
      close_run_id,
      status,
      total_debit,
      total_credit,
      created_by
    )
    SELECT
      'JE-' || TO_CHAR(p_period_start, 'YYYYMM') || '-' || LPAD(NEXTVAL('journal_entry_seq')::TEXT, 6, '0'),
      pi.paid_at::DATE,
      p_period_id,
      'payout',
      'PERIOD-' || p_period_id::TEXT || '-PAYOUT-' || pi.id::TEXT,
      'Payout batch ' || COALESCE(pb.name, pb.id::TEXT) ||
        ' (payout_item_id ' || pi.id::TEXT || ', period ' || p_period_id::TEXT || ')',
      p_close_run_id,
      'draft',
      pi.amount,
      pi.amount,
      'system'
    FROM payout_items pi
    JOIN payout_batches pb ON pb.id = pi.payout_batch_id
    WHERE pi.status = 'paid'
      AND pi.paid_at::DATE BETWEEN p_period_start AND p_period_end
    ORDER BY pi.paid_at, pi.id
    ON CONFLICT (reference) DO NOTHING
    RETURNING id
  )
  SELECT COUNT(*) INTO v_created_pay FROM ins;

  -- 4. Create accounting lines for PAYOUTS
  WITH payout_entries AS (
    SELECT
      je.id AS je_id,
      je.total_debit,
      SUBSTRING(je.reference FROM 'PAYOUT-(.*)$') AS pid
    FROM journal_entries je
    WHERE je.reference LIKE 'PERIOD-' || p_period_id::TEXT || '-PAYOUT-%'
      AND je.close_run_id = p_close_run_id
      AND NOT EXISTS (SELECT 1 FROM accounting_lines WHERE journal_entry_id = je.id)
  )
  INSERT INTO accounting_lines (journal_entry_id, line_number, account_code, account_name, debit, credit, description, reference)
  SELECT pe.je_id, 1, '467000', 'Créditeurs divers - Créateurs', pe.total_debit, 0, 'Payout ' || pe.pid, pe.pid FROM payout_entries pe
  UNION ALL
  SELECT pe.je_id, 2, '512000', 'Banque', 0, pe.total_debit, 'Payout ' || pe.pid, pe.pid FROM payout_entries pe;

  GET DIAGNOSTICS v_lines_pay = ROW_COUNT;

  -- 5. Validation: Check all entries have close_run_id
  SELECT COUNT(*) INTO v_missing_run
  FROM journal_entries
  WHERE reference LIKE 'PERIOD-' || p_period_id::TEXT || '-%'
    AND close_run_id IS NULL;

  IF v_missing_run > 0 THEN
    RAISE EXCEPTION 'Audit failure: % entries with NULL close_run_id', v_missing_run;
  END IF;

  -- 6. Get metrics
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'posted'),
    COUNT(*) FILTER (WHERE status = 'draft')
  INTO v_total, v_posted, v_skipped
  FROM journal_entries
  WHERE reference LIKE 'PERIOD-' || p_period_id::TEXT || '-%';

  RETURN jsonb_build_object(
    'status', 'success',
    'close_run_id', p_close_run_id,
    'created_commissions', v_created_comm,
    'created_payouts', v_created_pay,
    'created_total', v_created_comm + v_created_pay,
    'lines_commissions', v_lines_comm,
    'lines_payouts', v_lines_pay,
    'already_posted', v_posted,
    'draft_entries', v_skipped,
    'total_entries', v_total
  );
END;
$$;

COMMENT ON FUNCTION finance_close_build_entries IS
'Build journal entries for period close.
- Creates entries for commissions (624000 DR / 467000 CR)
- Creates entries for payouts (467000 DR / 512000 CR)
- Idempotent: ON CONFLICT DO NOTHING on reference
- All entries tagged with close_run_id for audit';

-- ============================================================================
-- 9. FUNCTION: Post journal entries for period close
-- ============================================================================
CREATE OR REPLACE FUNCTION finance_close_post_entries(
  p_close_run_id UUID,
  p_period_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total INT := 0;
  v_posted INT := 0;
  v_already INT := 0;
  v_lines_expected INT := 0;
  v_lines_actual INT := 0;
  v_total_debit NUMERIC := 0;
  v_total_credit NUMERIC := 0;
  v_je RECORD;
BEGIN
  -- 1. Acquire lock
  BEGIN
    INSERT INTO finance_period_locks (period_id, locked_by, close_run_id)
    VALUES (p_period_id, 'finance_close_post_entries', p_close_run_id);
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'Lock already exists for period %', p_period_id::TEXT;
  END;

  -- Set timeout for long operations
  SET LOCAL statement_timeout = '600000'; -- 10 minutes

  -- 2. Check for already posted entries (idempotence)
  SELECT COUNT(*) INTO v_already
  FROM journal_entries
  WHERE reference LIKE 'PERIOD-' || p_period_id::TEXT || '-%'
    AND status = 'posted';

  IF v_already > 0 THEN
    RAISE WARNING 'Found % already posted entries for period %', v_already, p_period_id::TEXT;
  END IF;

  -- 3. Count draft entries to post
  SELECT COUNT(*) INTO v_total
  FROM journal_entries
  WHERE reference LIKE 'PERIOD-' || p_period_id::TEXT || '-%'
    AND status = 'draft';

  IF v_total = 0 THEN
    -- Release lock and return
    DELETE FROM finance_period_locks WHERE period_id = p_period_id;

    IF v_already > 0 THEN
      RETURN jsonb_build_object(
        'status', 'idempotent',
        'message', 'No draft entries, already posted',
        'already_posted', v_already
      );
    ELSE
      RAISE EXCEPTION 'No draft entries found for period %', p_period_id::TEXT;
    END IF;
  END IF;

  -- 4. Guardrail: Check line count (should be 2× entries)
  v_lines_expected := v_total * 2;

  SELECT COUNT(*) INTO v_lines_actual
  FROM accounting_lines al
  JOIN journal_entries je ON je.id = al.journal_entry_id
  WHERE je.reference LIKE 'PERIOD-' || p_period_id::TEXT || '-%'
    AND je.status = 'draft';

  IF v_lines_actual != v_lines_expected THEN
    DELETE FROM finance_period_locks WHERE period_id = p_period_id;
    RAISE EXCEPTION 'Line count mismatch: expected %, got %', v_lines_expected, v_lines_actual;
  END IF;

  -- 5. Guardrail: Check debit = credit balance
  SELECT
    COALESCE(SUM(al.debit), 0),
    COALESCE(SUM(al.credit), 0)
  INTO v_total_debit, v_total_credit
  FROM accounting_lines al
  JOIN journal_entries je ON je.id = al.journal_entry_id
  WHERE je.reference LIKE 'PERIOD-' || p_period_id::TEXT || '-%'
    AND je.status = 'draft';

  IF v_total_debit != v_total_credit THEN
    DELETE FROM finance_period_locks WHERE period_id = p_period_id;
    RAISE EXCEPTION 'Balance mismatch: debit=%, credit=%', v_total_debit, v_total_credit;
  END IF;

  -- 6. Post all draft entries
  FOR v_je IN
    SELECT id
    FROM journal_entries
    WHERE reference LIKE 'PERIOD-' || p_period_id::TEXT || '-%'
      AND status = 'draft'
    ORDER BY entry_number
  LOOP
    -- Update status to posted
    UPDATE journal_entries
    SET status = 'posted', posted_at = NOW(), updated_at = NOW()
    WHERE id = v_je.id;

    v_posted := v_posted + 1;
  END LOOP;

  -- 7. Release lock
  DELETE FROM finance_period_locks WHERE period_id = p_period_id;

  RETURN jsonb_build_object(
    'status', 'success',
    'posted_count', v_posted,
    'already_posted', v_already,
    'total', v_posted + v_already,
    'total_debit', v_total_debit,
    'total_credit', v_total_credit
  );

EXCEPTION WHEN OTHERS THEN
  -- Release lock on error
  DELETE FROM finance_period_locks WHERE period_id = p_period_id;
  RAISE;
END;
$$;

COMMENT ON FUNCTION finance_close_post_entries IS
'Post all draft journal entries for a period.
Guardrails:
- Lock acquisition (pessimistic)
- Line count check (2× entries)
- Debit = Credit balance check
- 10 minute timeout
Idempotent: returns success if already posted.';

-- ============================================================================
-- 10. FUNCTION: Rollback period close (emergency use only)
-- ============================================================================
CREATE OR REPLACE FUNCTION finance_close_rollback(
  p_close_run_id UUID,
  p_period_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
  v_mapped INT := 0;
  v_draft INT := 0;
  v_posted INT := 0;
BEGIN
  -- 1. Check period status
  SELECT status INTO v_status
  FROM financial_periods
  WHERE id = p_period_id;

  IF v_status = 'closed' THEN
    RAISE EXCEPTION 'Cannot rollback closed period %', p_period_id::TEXT;
  END IF;

  -- 2. Check for mapped entities
  SELECT COUNT(*) INTO v_mapped
  FROM period_entity_map
  WHERE period_id = p_period_id;

  IF v_mapped > 0 THEN
    RAISE EXCEPTION 'Cannot rollback: % entities mapped to period', v_mapped;
  END IF;

  -- 3. Delete draft entries (safe)
  DELETE FROM journal_entries
  WHERE reference LIKE 'PERIOD-' || p_period_id::TEXT || '-%'
    AND status = 'draft';

  GET DIAGNOSTICS v_draft = ROW_COUNT;

  -- 4. Delete posted entries (with warning)
  DELETE FROM journal_entries
  WHERE reference LIKE 'PERIOD-' || p_period_id::TEXT || '-%'
    AND status = 'posted';

  GET DIAGNOSTICS v_posted = ROW_COUNT;

  IF v_posted > 0 THEN
    RAISE WARNING 'Deleted % posted entries - this should be reviewed', v_posted;
  END IF;

  -- 5. Release any locks
  DELETE FROM finance_period_locks WHERE period_id = p_period_id;

  -- 6. Reset period status if it was 'closing'
  UPDATE financial_periods
  SET status = 'open', updated_at = NOW()
  WHERE id = p_period_id AND status = 'closing';

  RETURN jsonb_build_object(
    'status', 'success',
    'deleted_draft', v_draft,
    'deleted_posted', v_posted,
    'warning', CASE WHEN v_posted > 0 THEN 'Posted entries were deleted' ELSE NULL END
  );
END;
$$;

COMMENT ON FUNCTION finance_close_rollback IS
'Emergency rollback of period close.
- Cannot rollback if period is closed
- Cannot rollback if entities are mapped
- Deletes draft and posted entries
- Releases locks
- Resets period to open status';

-- ============================================================================
-- 11. FUNCTION: Pre-close validation checks
-- ============================================================================
CREATE OR REPLACE FUNCTION finance_close_validate(
  p_period_id UUID,
  p_period_start DATE,
  p_period_end DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_checks JSONB := '[]'::JSONB;
  v_count INT;
  v_all_pass BOOLEAN := true;
BEGIN
  -- Check 1: No unpaid/pending commissions
  SELECT COUNT(*) INTO v_count
  FROM commissions
  WHERE created_at::DATE BETWEEN p_period_start AND p_period_end
    AND status NOT IN ('paid', 'payable', 'locked', 'refunded', 'canceled');

  v_checks := v_checks || jsonb_build_object(
    'check', 'unpaid_commissions',
    'status', CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END,
    'count', v_count,
    'message', CASE WHEN v_count = 0 THEN 'All commissions are in final state'
               ELSE v_count || ' commissions still pending' END
  );
  IF v_count > 0 THEN v_all_pass := false; END IF;

  -- Check 2: Paid commissions have payout linkage
  SELECT COUNT(*) INTO v_count
  FROM commissions c
  LEFT JOIN payout_item_commissions pic ON pic.commission_id = c.id
  WHERE c.created_at::DATE BETWEEN p_period_start AND p_period_end
    AND c.status = 'paid'
    AND pic.id IS NULL;

  v_checks := v_checks || jsonb_build_object(
    'check', 'paid_without_payout',
    'status', CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END,
    'count', v_count,
    'message', CASE WHEN v_count = 0 THEN 'All paid commissions linked to payouts'
               ELSE v_count || ' paid commissions without payout linkage' END
  );
  IF v_count > 0 THEN v_all_pass := false; END IF;

  -- Check 3: No pending payout items
  SELECT COUNT(*) INTO v_count
  FROM payout_items pi
  JOIN payout_item_commissions pic ON pic.payout_item_id = pi.id
  JOIN commissions c ON c.id = pic.commission_id
  WHERE c.created_at::DATE BETWEEN p_period_start AND p_period_end
    AND pi.status IN ('pending', 'processing', 'scheduled');

  v_checks := v_checks || jsonb_build_object(
    'check', 'pending_payouts',
    'status', CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END,
    'count', v_count,
    'message', CASE WHEN v_count = 0 THEN 'No pending payout items'
               ELSE v_count || ' payout items still processing' END
  );
  IF v_count > 0 THEN v_all_pass := false; END IF;

  -- Check 4: No incomplete batches
  SELECT COUNT(DISTINCT pb.id) INTO v_count
  FROM payout_batches pb
  JOIN payout_items pi ON pi.payout_batch_id = pb.id
  JOIN payout_item_commissions pic ON pic.payout_item_id = pi.id
  JOIN commissions c ON c.id = pic.commission_id
  WHERE c.created_at::DATE BETWEEN p_period_start AND p_period_end
    AND pb.status NOT IN ('paid', 'sent', 'canceled');

  v_checks := v_checks || jsonb_build_object(
    'check', 'incomplete_batches',
    'status', CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END,
    'count', v_count,
    'message', CASE WHEN v_count = 0 THEN 'All batches completed'
               ELSE v_count || ' batches incomplete' END
  );
  IF v_count > 0 THEN v_all_pass := false; END IF;

  -- Check 5: No orphan draft entries
  SELECT COUNT(*) INTO v_count
  FROM journal_entries
  WHERE period_id = p_period_id
    AND status = 'draft'
    AND close_run_id IS NULL;

  v_checks := v_checks || jsonb_build_object(
    'check', 'orphan_drafts',
    'status', CASE WHEN v_count = 0 THEN 'PASS' ELSE 'WARN' END,
    'count', v_count,
    'message', CASE WHEN v_count = 0 THEN 'No orphan draft entries'
               ELSE v_count || ' draft entries without close_run_id' END
  );

  -- Check 6: Balanced entries
  SELECT COUNT(*) INTO v_count
  FROM (
    SELECT al.journal_entry_id
    FROM accounting_lines al
    JOIN journal_entries je ON je.id = al.journal_entry_id
    WHERE je.period_id = p_period_id
    GROUP BY al.journal_entry_id
    HAVING SUM(al.debit) != SUM(al.credit)
  ) unbalanced;

  v_checks := v_checks || jsonb_build_object(
    'check', 'unbalanced_entries',
    'status', CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END,
    'count', v_count,
    'message', CASE WHEN v_count = 0 THEN 'All entries balanced'
               ELSE v_count || ' unbalanced entries' END
  );
  IF v_count > 0 THEN v_all_pass := false; END IF;

  RETURN jsonb_build_object(
    'status', CASE WHEN v_all_pass THEN 'PASS' ELSE 'FAIL' END,
    'checks', v_checks,
    'can_close', v_all_pass
  );
END;
$$;

COMMENT ON FUNCTION finance_close_validate IS
'Run all pre-close validation checks:
1. No unpaid/pending commissions
2. Paid commissions have payout linkage
3. No pending payout items
4. No incomplete batches
5. No orphan draft entries
6. All entries balanced';

-- ============================================================================
-- 12. PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_journal_entries_period_status
  ON journal_entries(period_id, status);

CREATE INDEX IF NOT EXISTS idx_journal_entries_ref_pattern
  ON journal_entries(reference text_pattern_ops)
  WHERE reference LIKE 'PERIOD-%';

CREATE INDEX IF NOT EXISTS idx_commissions_created_status
  ON commissions(created_at, status)
  WHERE status IN ('paid', 'payable', 'locked');

CREATE INDEX IF NOT EXISTS idx_payout_items_status
  ON payout_items(status)
  WHERE status = 'paid';

CREATE INDEX IF NOT EXISTS idx_accounting_lines_je
  ON accounting_lines(journal_entry_id);

-- ============================================================================
-- 13. GRANTS
-- ============================================================================
REVOKE EXECUTE ON FUNCTION format_fec_amount FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION finance_close_build_entries FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION finance_close_post_entries FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION finance_close_rollback FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION finance_close_validate FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION cleanup_dead_period_locks FROM PUBLIC;

-- Grant to service_role
GRANT EXECUTE ON FUNCTION format_fec_amount TO service_role;
GRANT EXECUTE ON FUNCTION finance_close_build_entries TO service_role;
GRANT EXECUTE ON FUNCTION finance_close_post_entries TO service_role;
GRANT EXECUTE ON FUNCTION finance_close_rollback TO service_role;
GRANT EXECUTE ON FUNCTION finance_close_validate TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_dead_period_locks TO service_role;

-- ============================================================================
-- 14. VERIFICATION
-- ============================================================================
SELECT 'Financial close system installed!' AS status;
