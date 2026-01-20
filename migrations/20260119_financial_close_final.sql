-- ═════════════════════════════════════════════════════════════════
-- MIGRATION: Financial Close Final (VERSION PRODUCTION)
-- Date: 2026-01-19
-- Status: ✅ APPLIED TO PRODUCTION
-- Note: This migration requires the base schema to exist first.
--       Run the base schema migration before this one.
-- ═════════════════════════════════════════════════════════════════

-- PREREQUISITES:
-- 1. Base schema must exist (financial_periods, journal_entries, etc.)
-- 2. Function post_journal_entry() must exist
-- 3. Tables: commissions, payout_items, payout_batches must exist

CREATE SEQUENCE IF NOT EXISTS public.journal_entry_seq;

ALTER TABLE public.creator_statements
  ADD COLUMN IF NOT EXISTS pdf_path TEXT,
  ADD COLUMN IF NOT EXISTS csv_path TEXT;

ALTER TABLE public.journal_entries
  ADD COLUMN IF NOT EXISTS close_run_id UUID;

CREATE INDEX IF NOT EXISTS idx_journal_entries_close_run_id
  ON public.journal_entries(close_run_id)
  WHERE close_run_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.finance_period_locks (
  period_id UUID PRIMARY KEY,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_by TEXT NOT NULL,
  close_run_id UUID NOT NULL
);

CREATE OR REPLACE FUNCTION public.cleanup_dead_period_locks()
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_deleted INT;
BEGIN
  DELETE FROM finance_period_locks WHERE locked_at < now() - interval '1 hour';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  IF v_deleted > 0 THEN RAISE NOTICE 'Cleaned % dead locks', v_deleted; END IF;
  RETURN v_deleted;
END $$;

CREATE TABLE IF NOT EXISTS public.journal_entries_reference_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reference TEXT NOT NULL,
  duplicate_count INT NOT NULL,
  journal_entry_ids UUID[] NOT NULL,
  resolution_status TEXT DEFAULT 'pending' CHECK (resolution_status IN ('pending', 'resolved', 'archived')),
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'uq_journal_entries_reference_conflicts_reference'
  ) THEN
    ALTER TABLE public.journal_entries_reference_conflicts
      ADD CONSTRAINT uq_journal_entries_reference_conflicts_reference UNIQUE (reference);
  END IF;
END $$;

DO $$
DECLARE v_conflict RECORD; v_count INT := 0;
BEGIN
  FOR v_conflict IN
    SELECT reference, COUNT(*) AS dup_count, array_agg(id ORDER BY created_at) AS je_ids
    FROM journal_entries WHERE reference IS NOT NULL
    GROUP BY reference HAVING COUNT(*) > 1
  LOOP
    v_count := v_count + 1;
    INSERT INTO journal_entries_reference_conflicts (reference, duplicate_count, journal_entry_ids)
    VALUES (v_conflict.reference, v_conflict.dup_count, v_conflict.je_ids)
    ON CONFLICT (reference) DO NOTHING;
  END LOOP;
  IF v_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: % conflicts', v_count; END IF;
  RAISE NOTICE 'No conflicts ✓';
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_journal_entries_reference_unique
  ON public.journal_entries(reference);

CREATE OR REPLACE FUNCTION public.format_fec_amount(p_amount NUMERIC)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_amount IS NULL THEN RETURN '0,00'; END IF;
  RETURN REPLACE(TRIM(TO_CHAR(ROUND(p_amount, 2), 'FM999999999999990.00')), '.', ',');
END $$;

DO $$
BEGIN
  ASSERT public.format_fec_amount(NULL) = '0,00';
  ASSERT public.format_fec_amount(1234.56) = '1234,56';
  RAISE NOTICE 'format_fec_amount tests passed ✓';
END $$;

CREATE OR REPLACE FUNCTION public.finance_close_build_entries(
  p_period_id UUID, p_period_start DATE, p_period_end DATE, p_close_run_id UUID
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp 
AS $$
DECLARE
  v_created_comm INT := 0; v_created_pay INT := 0;
  v_lines_comm INT := 0; v_lines_pay INT := 0;
  v_total INT; v_posted INT; v_skipped INT; v_missing_run INT;
BEGIN
  -- COMMISSIONS
  WITH ins AS (
    INSERT INTO journal_entries (
      entry_number, entry_date, period_id, entry_type, reference, description, 
      close_run_id, status, total_debit, total_credit, created_by
    )
    SELECT
      'JE-' || to_char(p_period_start, 'YYYYMM') || '-' || LPAD(nextval('journal_entry_seq')::TEXT, 6, '0'),
      c.created_at::date, p_period_id, 'commission',
      'PERIOD-' || p_period_id::text || '-COMMISSION-' || c.id::text,
      'Commission (commission_id ' || c.id::text || ', period ' || p_period_id::text || ', close_run ' || p_close_run_id::text || ')',
      p_close_run_id, 'draft', c.commission_amount, c.commission_amount, 'system'
    FROM commissions c
    WHERE c.created_at::date BETWEEN p_period_start AND p_period_end 
      AND c.status IN ('paid', 'payable', 'locked')
    ORDER BY c.created_at, c.id
    ON CONFLICT (reference) DO NOTHING
    RETURNING id
  ) SELECT COUNT(*) INTO v_created_comm FROM ins;
  
  WITH ce AS (
    SELECT je.id je_id, je.total_debit, SUBSTRING(je.reference FROM 'COMMISSION-(.*)$') cid
    FROM journal_entries je
    WHERE je.reference LIKE 'PERIOD-' || p_period_id::text || '-COMMISSION-%' 
      AND je.close_run_id = p_close_run_id
      AND NOT EXISTS (SELECT 1 FROM accounting_lines WHERE journal_entry_id = je.id)
  )
  INSERT INTO accounting_lines (journal_entry_id, line_number, account_code, account_name, debit, credit, description, reference)
  SELECT ce.je_id, 1, '624000', 'Commissions créateurs', ce.total_debit, 0, 'Commission ' || ce.cid, ce.cid FROM ce
  UNION ALL 
  SELECT ce.je_id, 2, '467000', 'Créditeurs divers', 0, ce.total_debit, 'Commission ' || ce.cid, ce.cid FROM ce;
  GET DIAGNOSTICS v_lines_comm = ROW_COUNT;
  
  -- PAYOUTS (uses sent_at, not paid_at)
  WITH ins AS (
    INSERT INTO journal_entries (
      entry_number, entry_date, period_id, entry_type, reference, description, 
      close_run_id, status, total_debit, total_credit, created_by
    )
    SELECT
      'JE-' || to_char(p_period_start, 'YYYYMM') || '-' || LPAD(nextval('journal_entry_seq')::TEXT, 6, '0'),
      pi.sent_at::date, p_period_id, 'payout',
      'PERIOD-' || p_period_id::text || '-PAYOUT-' || pi.id::text,
      'Payout (payout_item_id ' || pi.id::text || ', period ' || p_period_id::text || ', close_run ' || p_close_run_id::text || ')',
      p_close_run_id, 'draft', pi.amount, pi.amount, 'system'
    FROM payout_items pi 
    WHERE pi.status = 'sent' 
      AND pi.sent_at IS NOT NULL
      AND pi.sent_at::date BETWEEN p_period_start AND p_period_end
    ORDER BY pi.sent_at, pi.id
    ON CONFLICT (reference) DO NOTHING
    RETURNING id
  ) SELECT COUNT(*) INTO v_created_pay FROM ins;
  
  WITH pe AS (
    SELECT je.id je_id, je.total_debit, SUBSTRING(je.reference FROM 'PAYOUT-(.*)$') pid
    FROM journal_entries je
    WHERE je.reference LIKE 'PERIOD-' || p_period_id::text || '-PAYOUT-%' 
      AND je.close_run_id = p_close_run_id
      AND NOT EXISTS (SELECT 1 FROM accounting_lines WHERE journal_entry_id = je.id)
  )
  INSERT INTO accounting_lines (journal_entry_id, line_number, account_code, account_name, debit, credit, description, reference)
  SELECT pe.je_id, 1, '467000', 'Créditeurs divers', pe.total_debit, 0, 'Payout ' || pe.pid, pe.pid FROM pe
  UNION ALL 
  SELECT pe.je_id, 2, '512000', 'Banque Wise', 0, pe.total_debit, 'Payout ' || pe.pid, pe.pid FROM pe;
  GET DIAGNOSTICS v_lines_pay = ROW_COUNT;
  
  SELECT COUNT(*) INTO v_missing_run FROM journal_entries
  WHERE reference LIKE 'PERIOD-' || p_period_id::text || '%' AND close_run_id IS NULL;
  IF v_missing_run > 0 THEN RAISE EXCEPTION 'Audit: % NULL close_run_id', v_missing_run; END IF;
  
  SELECT COUNT(*) INTO v_total FROM journal_entries WHERE reference LIKE 'PERIOD-' || p_period_id::text || '%';
  SELECT COUNT(*) INTO v_posted FROM journal_entries WHERE reference LIKE 'PERIOD-' || p_period_id::text || '%' AND status = 'posted';
  v_skipped := v_total - v_posted - (v_created_comm + v_created_pay);
  
  RETURN jsonb_build_object(
    'status', 'success', 'created_commissions', v_created_comm, 'created_payouts', v_created_pay,
    'created_total', v_created_comm + v_created_pay, 'lines_commissions', v_lines_comm, 
    'lines_payouts', v_lines_pay, 'skipped_draft', v_skipped, 'already_posted', v_posted, 'total', v_total
  );
END $$;

CREATE OR REPLACE FUNCTION public.finance_close_post_entries(p_close_run_id UUID, p_period_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp 
AS $$
DECLARE
  v_je UUID; v_posted INT := 0; v_already INT; v_total INT;
  v_lines_exp INT; v_lines_act INT; v_debit NUMERIC; v_credit NUMERIC;
BEGIN
  BEGIN
    INSERT INTO finance_period_locks (period_id, locked_by, close_run_id)
    VALUES (p_period_id, 'finance_close_post_entries', p_close_run_id);
  EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'Lock exists for period %', p_period_id::text; END;
  
  BEGIN
    SET LOCAL statement_timeout = '600000';
    SELECT COUNT(*) INTO v_already FROM journal_entries WHERE reference LIKE 'PERIOD-' || p_period_id::text || '%' AND status = 'posted';
    IF v_already > 0 THEN RAISE WARNING 'Found % posted (idempotent)', v_already; END IF;
    
    SELECT COUNT(*) INTO v_total FROM journal_entries WHERE reference LIKE 'PERIOD-' || p_period_id::text || '%' AND status = 'draft';
    IF v_total = 0 THEN
      DELETE FROM finance_period_locks WHERE period_id = p_period_id;
      IF v_already > 0 THEN RETURN jsonb_build_object('status', 'success', 'posted_count', v_already, 'note', 'Idempotent');
      ELSE RAISE EXCEPTION 'No drafts for %', p_period_id::text; END IF;
    END IF;
    
    v_lines_exp := v_total * 2;
    SELECT COUNT(*) INTO v_lines_act FROM accounting_lines al JOIN journal_entries je ON je.id = al.journal_entry_id
    WHERE je.reference LIKE 'PERIOD-' || p_period_id::text || '%' AND je.status = 'draft';
    IF v_lines_act != v_lines_exp THEN RAISE EXCEPTION 'Lines: % != %', v_lines_exp, v_lines_act; END IF;
    
    SELECT COALESCE(SUM(al.debit), 0), COALESCE(SUM(al.credit), 0) INTO v_debit, v_credit
    FROM accounting_lines al JOIN journal_entries je ON je.id = al.journal_entry_id
    WHERE je.reference LIKE 'PERIOD-' || p_period_id::text || '%' AND je.status = 'draft';
    IF v_debit != v_credit THEN RAISE EXCEPTION 'Balance: % != %', v_debit, v_credit; END IF;
    
    FOR v_je IN SELECT id FROM journal_entries WHERE reference LIKE 'PERIOD-' || p_period_id::text || '%' AND status = 'draft' ORDER BY entry_number
    LOOP PERFORM post_journal_entry(v_je); v_posted := v_posted + 1; END LOOP;
    
    DELETE FROM finance_period_locks WHERE period_id = p_period_id;
    RETURN jsonb_build_object('status', 'success', 'posted_count', v_posted, 'total', v_posted + v_already);
  EXCEPTION WHEN OTHERS THEN DELETE FROM finance_period_locks WHERE period_id = p_period_id; RAISE; END;
END $$;

CREATE OR REPLACE FUNCTION public.finance_close_rollback(p_close_run_id UUID, p_period_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp 
AS $$
DECLARE v_status TEXT; v_draft INT; v_posted INT; v_mapped INT;
BEGIN
  SELECT status INTO v_status FROM financial_periods WHERE id = p_period_id;
  IF v_status = 'closed' THEN RAISE EXCEPTION 'Period closed'; END IF;
  SELECT COUNT(*) INTO v_mapped FROM period_entity_map WHERE period_id = p_period_id;
  IF v_mapped > 0 THEN RAISE EXCEPTION '% mapped entities', v_mapped; END IF;
  DELETE FROM journal_entries WHERE reference LIKE 'PERIOD-' || p_period_id::text || '%' AND status = 'draft';
  GET DIAGNOSTICS v_draft = ROW_COUNT;
  DELETE FROM journal_entries WHERE reference LIKE 'PERIOD-' || p_period_id::text || '%' AND status = 'posted';
  GET DIAGNOSTICS v_posted = ROW_COUNT;
  IF v_posted > 0 THEN RAISE WARNING 'Deleted % posted', v_posted; END IF;
  DELETE FROM finance_period_locks WHERE period_id = p_period_id;
  RETURN jsonb_build_object('status', 'success', 'deleted_draft', v_draft, 'deleted_posted', v_posted);
END $$;

CREATE INDEX IF NOT EXISTS idx_journal_entries_period_status ON journal_entries(period_id, status);
CREATE INDEX IF NOT EXISTS idx_journal_entries_ref_pattern ON journal_entries(reference text_pattern_ops) WHERE reference LIKE 'PERIOD-%';
CREATE INDEX IF NOT EXISTS idx_commissions_created_status ON commissions(created_at, status) WHERE status IN ('paid', 'payable', 'locked');
CREATE INDEX IF NOT EXISTS idx_payout_items_sent_status ON payout_items(sent_at, status) WHERE status = 'sent';

DO $$
BEGIN
  REVOKE EXECUTE ON FUNCTION public.format_fec_amount(NUMERIC) FROM PUBLIC;
  REVOKE EXECUTE ON FUNCTION public.finance_close_build_entries(UUID, DATE, DATE, UUID) FROM PUBLIC;
  REVOKE EXECUTE ON FUNCTION public.finance_close_post_entries(UUID, UUID) FROM PUBLIC;
  REVOKE EXECUTE ON FUNCTION public.finance_close_rollback(UUID, UUID) FROM PUBLIC;
  REVOKE EXECUTE ON FUNCTION public.cleanup_dead_period_locks() FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.format_fec_amount(NUMERIC) TO service_role, postgres;
  GRANT EXECUTE ON FUNCTION public.finance_close_build_entries(UUID, DATE, DATE, UUID) TO service_role, postgres;
  GRANT EXECUTE ON FUNCTION public.finance_close_post_entries(UUID, UUID) TO service_role, postgres;
  GRANT EXECUTE ON FUNCTION public.finance_close_rollback(UUID, UUID) TO service_role, postgres;
  GRANT EXECUTE ON FUNCTION public.cleanup_dead_period_locks() TO service_role, postgres;
END $$;