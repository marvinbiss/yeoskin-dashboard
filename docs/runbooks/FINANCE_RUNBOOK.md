# Finance Operations Runbook

## Monthly Close Procedure

### Prerequisites

Before initiating a monthly close:

1. **Verify all commissions are validated**
   ```sql
   SELECT COUNT(*) FROM commissions
   WHERE status = 'pending'
   AND created_at >= '2026-01-01'
   AND created_at < '2026-02-01';
   -- Must be 0
   ```

2. **Verify all payouts are completed or failed**
   ```sql
   SELECT COUNT(*) FROM payouts
   WHERE status = 'processing'
   AND executed_at >= '2026-01-01'
   AND executed_at < '2026-02-01';
   -- Must be 0
   ```

3. **Verify period exists and is open**
   ```sql
   SELECT id, name, status FROM financial_periods
   WHERE name = 'January 2026';
   -- status must be 'open'
   ```

### Execute Close

```bash
curl -X POST https://yeoskin.app.n8n.cloud/webhook/finance-close \
  -H "Content-Type: application/json" \
  -H "x-secret: $FINANCE_WEBHOOK_SECRET" \
  -d '{"period_id": "uuid-of-january-2026"}'
```

### Verify Close Success

```sql
-- Check period is closed
SELECT status, closed_at FROM financial_periods
WHERE id = 'period-uuid';

-- Verify journal entries
SELECT COUNT(*), SUM(total_debit), SUM(total_credit)
FROM (
  SELECT je.id,
    SUM(al.debit) as total_debit,
    SUM(al.credit) as total_credit
  FROM journal_entries je
  JOIN accounting_lines al ON al.journal_entry_id = je.id
  WHERE je.period_id = 'period-uuid'
  GROUP BY je.id
) t;
-- total_debit must equal total_credit

-- Check statements generated
SELECT COUNT(*) FROM creator_statements
WHERE period_id = 'period-uuid';
```

---

## Troubleshooting

### Issue: Close fails with LOCK_FAILED

**Cause**: Another close process is running or a previous close crashed.

**Resolution**:
```sql
-- Check for existing locks
SELECT * FROM finance_period_locks WHERE period_id = 'uuid';

-- If lock is stale (> 1 hour old), clean up
SELECT cleanup_dead_period_locks();

-- Or manually delete
DELETE FROM finance_period_locks WHERE period_id = 'uuid';
```

### Issue: Close fails with PENDING_COMMISSIONS

**Cause**: Unvalidated commissions exist in the period.

**Resolution**:
```sql
-- Find pending commissions
SELECT id, creator_id, amount, created_at
FROM commissions
WHERE status = 'pending'
AND created_at >= 'period-start'
AND created_at < 'period-end';

-- Options:
-- 1. Validate them: UPDATE commissions SET status = 'validated' WHERE id IN (...);
-- 2. Cancel them: UPDATE commissions SET status = 'cancelled' WHERE id IN (...);
-- 3. Adjust period dates to exclude them
```

### Issue: Duplicate reference error

**Cause**: Journal entry reference already exists (usually from failed partial close).

**Resolution**:
```sql
-- Check conflicts table
SELECT * FROM journal_entries_reference_conflicts
WHERE resolution_status = 'pending';

-- Option 1: Delete duplicate entries and retry
DELETE FROM accounting_lines
WHERE journal_entry_id IN (SELECT id FROM journal_entries WHERE reference = 'duplicate-ref');
DELETE FROM journal_entries WHERE reference = 'duplicate-ref';

-- Option 2: Mark conflict as resolved
UPDATE journal_entries_reference_conflicts
SET resolution_status = 'resolved',
    resolution_notes = 'Manually cleaned up',
    resolved_at = NOW()
WHERE reference = 'duplicate-ref';
```

### Issue: Statements not generating

**Cause**: PDF render API failing or storage upload failing.

**Resolution**:
1. Check Vercel function logs for `/api/finance/pdf/render`
2. Verify `INTERNAL_API_KEY` is set correctly
3. Check Supabase Storage bucket `finance` permissions
4. Manually trigger statement generation:
   ```bash
   curl -X POST https://yeoskin.app.n8n.cloud/webhook/generate-creator-statements \
     -H "x-secret: $FINANCE_WEBHOOK_SECRET" \
     -d '{"period_id": "uuid", "close_run_id": "uuid"}'
   ```

### Issue: Unbalanced entries detected

**Cause**: Data integrity issue - debits don't equal credits.

**Resolution**:
```sql
-- Find unbalanced entries
SELECT je.id, je.reference,
  SUM(al.debit) as total_debit,
  SUM(al.credit) as total_credit,
  SUM(al.debit) - SUM(al.credit) as difference
FROM journal_entries je
JOIN accounting_lines al ON al.journal_entry_id = je.id
WHERE je.close_run_id = 'close-run-uuid'
GROUP BY je.id, je.reference
HAVING SUM(al.debit) != SUM(al.credit);

-- Rollback the close run
SELECT finance_close_rollback('close-run-uuid', 'period-uuid');

-- Investigate and fix source data, then retry
```

---

## Emergency Procedures

### Rollback a Closed Period

**Warning**: Only use in case of critical errors. Requires manual re-close after.

```sql
-- 1. Reopen the period
UPDATE financial_periods
SET status = 'open', closed_at = NULL
WHERE id = 'period-uuid';

-- 2. Delete journal entries for the period
DELETE FROM accounting_lines
WHERE journal_entry_id IN (
  SELECT id FROM journal_entries WHERE period_id = 'period-uuid'
);
DELETE FROM journal_entries WHERE period_id = 'period-uuid';

-- 3. Delete statements
DELETE FROM creator_statements WHERE period_id = 'period-uuid';

-- 4. Clear entity map
DELETE FROM period_entity_map WHERE period_id = 'period-uuid';
```

### Regenerate Statements Only

If entries are correct but statements need regeneration:

```bash
# Get close_run_id from the period's entries
psql -c "SELECT DISTINCT close_run_id FROM journal_entries WHERE period_id = 'uuid' LIMIT 1"

# Trigger statement regeneration
curl -X POST https://yeoskin.app.n8n.cloud/webhook/generate-creator-statements \
  -H "x-secret: $FINANCE_WEBHOOK_SECRET" \
  -d '{"period_id": "uuid", "close_run_id": "close-run-uuid"}'
```

### Force Release All Locks

```sql
-- Nuclear option: release all locks
TRUNCATE finance_period_locks;
```

---

## Monitoring & Alerts

### Key Metrics to Monitor

| Metric | Warning Threshold | Critical Threshold |
|--------|-------------------|-------------------|
| Pending commissions at month end | > 10 | > 50 |
| Processing payouts at month end | > 0 | > 5 |
| Close duration | > 5 min | > 15 min |
| Statement generation failures | > 1 | > 5 |
| Stale locks (> 1 hour) | > 0 | > 1 |

### Health Check Query

```sql
SELECT
  (SELECT COUNT(*) FROM finance_period_locks WHERE locked_at < NOW() - INTERVAL '1 hour') as stale_locks,
  (SELECT COUNT(*) FROM journal_entries_reference_conflicts WHERE resolution_status = 'pending') as unresolved_conflicts,
  (SELECT COUNT(*) FROM financial_periods WHERE status = 'open' AND end_date < CURRENT_DATE) as overdue_periods;
```

---

## Scheduled Tasks

### Daily (via n8n Schedule)

- **8:00 AM**: Clean up stale locks
  ```sql
  SELECT cleanup_dead_period_locks();
  ```

### Monthly (Manual trigger)

- **1st of month, 10:00 AM**: Close previous month
- **1st of month, 11:00 AM**: Verify close and statements
- **5th of month**: Generate FEC export for accountant

---

## Contacts

| Role | Contact | Escalation |
|------|---------|------------|
| Finance Lead | finance@yeoskin.com | First responder |
| Platform Engineering | eng@yeoskin.com | Technical issues |
| Database Admin | dba@yeoskin.com | Data integrity issues |

---

## Audit Trail

All financial operations are logged in `audit_logs` table:

```sql
SELECT * FROM audit_logs
WHERE resource_type = 'financial_period'
AND resource_id = 'period-uuid'
ORDER BY created_at DESC;
```

Logged events:
- `period.lock_acquired`
- `period.entries_built`
- `period.entries_posted`
- `period.statements_generated`
- `period.closed`
- `period.rollback`
