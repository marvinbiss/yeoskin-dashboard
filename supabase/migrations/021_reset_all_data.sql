-- ============================================================================
-- Migration 021: RESET ALL DATA - Clean slate
-- Run in Supabase SQL Editor
-- ============================================================================

-- Disable the immutable trigger on financial_ledger
DROP TRIGGER IF EXISTS prevent_ledger_delete ON financial_ledger;
DROP TRIGGER IF EXISTS prevent_ledger_update ON financial_ledger;

-- Delete in FK-safe order
DELETE FROM payout_items;
DELETE FROM financial_ledger;
DELETE FROM financial_periods;
DELETE FROM commissions;
DELETE FROM orders;
DELETE FROM routine_checkouts;
DELETE FROM creator_routines;
DELETE FROM creator_bank_accounts;
DELETE FROM creator_profiles;
DELETE FROM creators;
DELETE FROM notifications;
DELETE FROM audit_logs;
DELETE FROM page_content_history;

-- Recreate immutable triggers on financial_ledger
CREATE OR REPLACE FUNCTION prevent_ledger_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Financial ledger entries are immutable and cannot be %', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_ledger_delete
  BEFORE DELETE ON financial_ledger
  FOR EACH ROW
  EXECUTE FUNCTION prevent_ledger_modification();

CREATE TRIGGER prevent_ledger_update
  BEFORE UPDATE ON financial_ledger
  FOR EACH ROW
  EXECUTE FUNCTION prevent_ledger_modification();

-- Reset sequences if any
-- (UUID primary keys don't need sequence resets)

SELECT 'All data cleared successfully - software is like new!' as status;
