# Financial Close System

## Overview

The financial close system provides bank-grade, audit-proof period closing for the Yeoskin platform. It automates the generation of journal entries, validates data integrity, and produces compliant financial records.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  n8n Workflow   │────▶│  SQL Functions  │────▶│  Supabase DB    │
│  (Orchestrator) │     │  (Business      │     │  (Persistence)  │
│                 │     │   Logic)        │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                                │
        │                                                │
        ▼                                                ▼
┌─────────────────┐                              ┌─────────────────┐
│  Next.js API    │                              │  Supabase       │
│  (PDF Render)   │                              │  Storage        │
└─────────────────┘                              └─────────────────┘
```

## Close Process Flow

### 1. Pre-Close Validation (6 Blocking Checks)

| Check | Description | Error Code |
|-------|-------------|------------|
| 1 | Period exists in database | `PERIOD_NOT_FOUND` |
| 2 | Period status is `open` | `PERIOD_NOT_OPEN` |
| 3 | No pending commissions in date range | `PENDING_COMMISSIONS` |
| 4 | No processing payouts in date range | `PROCESSING_PAYOUTS` |
| 5 | Period not already locked | `LOCK_FAILED` |
| 6 | Lock successfully acquired | `LOCK_FAILED` |

### 2. Lock Acquisition

```sql
INSERT INTO finance_period_locks (period_id, locked_by, close_run_id)
VALUES (p_period_id, user_id, gen_random_uuid())
ON CONFLICT (period_id) DO NOTHING
RETURNING *;
```

- Pessimistic locking prevents concurrent close operations
- Locks automatically cleaned up after 1 hour via `cleanup_dead_period_locks()`
- Each close run has a unique `close_run_id` for tracking

### 3. Journal Entry Generation

The `finance_close_build_entries()` function creates double-entry journal entries:

**Commission Entries:**
```
DR 622000 Commissions sur ventes    €XX.XX
    CR 401100 Fournisseurs - Créateurs    €XX.XX
```

**Payout Entries:**
```
DR 401100 Fournisseurs - Créateurs    €XX.XX
    CR 512000 Banque                      €XX.XX
```

### 4. Entry Posting & Validation

The `finance_close_post_entries()` function:

1. Verifies lock is still held
2. Counts expected accounting lines (entries × 2)
3. Validates `SUM(debit) = SUM(credit)`
4. Updates entries from `draft` to `posted`

### 5. Post-Close Operations

- Refresh `general_ledger` materialized view
- Map entities to period via `period_entity_map`
- Generate creator statements (triggers separate workflow)
- Update period status to `closed`
- Release period lock

## Reference Format

Journal entry references follow a strict format:

```
PERIOD-{period_id}-COMMISSION-{commission_id}
PERIOD-{period_id}-PAYOUT-{payout_id}
```

The unique index `idx_journal_entries_reference_unique` prevents duplicates.

## Rollback Procedure

If any step fails, `finance_close_rollback()` is automatically invoked:

```sql
SELECT finance_close_rollback(close_run_id, period_id);
```

This:
1. Deletes all accounting lines for the close run
2. Deletes all journal entries for the close run
3. Releases the period lock

## Database Tables

### `finance_period_locks`
| Column | Type | Description |
|--------|------|-------------|
| period_id | UUID | FK to financial_periods (PK) |
| locked_at | TIMESTAMPTZ | Lock acquisition time |
| locked_by | UUID | User who initiated close |
| close_run_id | UUID | Unique close run identifier |

### `journal_entries_reference_conflicts`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| reference | TEXT | Duplicate reference (UNIQUE) |
| duplicate_count | INT | Number of duplicates |
| journal_entry_ids | UUID[] | Array of conflicting IDs |
| resolution_status | TEXT | pending/resolved/ignored |
| resolution_notes | TEXT | Admin notes |
| resolved_at | TIMESTAMPTZ | Resolution timestamp |
| resolved_by | UUID | Admin who resolved |

## Triggering a Close

### Via n8n Webhook

```bash
curl -X POST https://yeoskin.app.n8n.cloud/webhook/finance-close \
  -H "Content-Type: application/json" \
  -H "x-secret: $FINANCE_WEBHOOK_SECRET" \
  -d '{"period_id": "uuid-here"}'
```

### Response (Success)

```json
{
  "success": true,
  "period_id": "uuid",
  "close_run_id": "uuid",
  "build_result": {
    "commission_entries": 150,
    "payout_entries": 45,
    "total_entries": 195,
    "expected_lines": 390
  },
  "post_result": {
    "posted_count": 195,
    "line_count": 390,
    "total_debit": 12500.00,
    "total_credit": 12500.00,
    "balanced": true
  }
}
```

## Security

- Functions use `SECURITY DEFINER` with restricted `search_path`
- `REVOKE EXECUTE FROM PUBLIC` on all sensitive functions
- Only `service_role` and `postgres` can execute close functions
- Webhook authenticated via `x-secret` header
