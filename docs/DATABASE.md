# 🗄️ Database Schema

## Overview

Yeoskin Dashboard uses **Supabase (PostgreSQL)** with Row Level Security (RLS).

---

## Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  admin_profiles │     │    creators     │     │     orders      │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │◄────│ creator_id      │
│ user_id    ────►│     │ user_id         │     │ shopify_order_id│
│ email           │     │ email           │     │ total_amount    │
│ role            │     │ discount_code   │     │ discount_code   │
│ is_active       │     │ commission_rate │     │ status          │
└─────────────────┘     │ tier_id         │     └────────┬────────┘
                        │ status          │              │
                        └────────┬────────┘              │
                                 │                       │
                                 │              ┌────────▼────────┐
                                 │              │   commissions   │
                                 │              ├─────────────────┤
                                 └─────────────►│ creator_id      │
                                                │ order_id        │
                                                │ amount          │
                                                │ status          │
                                                │ lock_until      │
                                                └────────┬────────┘
                                                         │
┌─────────────────┐     ┌─────────────────┐     ┌────────▼────────┐
│  payout_batches │◄────│  payout_items   │◄────│payout_item_comm │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │     │ payout_item_id  │
│ name            │     │ batch_id        │     │ commission_id   │
│ status          │     │ creator_id      │     └─────────────────┘
│ total_amount    │     │ amount          │
│ approved_by     │     │ status          │
│ approved_at     │     │ wise_fee        │
└─────────────────┘     └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │ wise_transfers  │
                        ├─────────────────┤
                        │ payout_item_id  │
                        │ wise_transfer_id│
                        │ amount          │
                        │ status          │
                        └─────────────────┘
```

---

## Core Tables

### creators

Primary table for creator profiles.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Supabase auth user ID |
| `email` | TEXT | Unique email |
| `discount_code` | TEXT | Unique Shopify discount code |
| `commission_rate` | DECIMAL(5,4) | Commission percentage (0.15 = 15%) |
| `tier_id` | UUID | FK to commission_tiers |
| `status` | TEXT | `active`, `inactive`, `suspended` |
| `lock_days` | INT | Days before commission is payable |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update |

### orders

Shopify orders linked to creators.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `shopify_order_id` | TEXT | Unique Shopify order ID |
| `creator_id` | UUID | FK to creators |
| `customer_email` | TEXT | Customer email |
| `total_amount` | DECIMAL | Order total |
| `discount_code` | TEXT | Applied discount code |
| `status` | TEXT | Order status |
| `created_at` | TIMESTAMPTZ | Order date |

### commissions

Commission records for each order.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `creator_id` | UUID | FK to creators |
| `order_id` | UUID | FK to orders |
| `commission_amount` | DECIMAL | Calculated commission |
| `status` | TEXT | `pending`, `locked`, `payable`, `paid`, `canceled` |
| `lock_until` | TIMESTAMPTZ | Date when commission becomes payable |
| `created_at` | TIMESTAMPTZ | Creation date |

### payout_batches

Groups of payouts processed together.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Batch name (e.g., "Jan 2026 Payouts") |
| `status` | TEXT | `draft`, `approved`, `executing`, `sent`, `paid`, `canceled` |
| `total_amount` | DECIMAL | Sum of all payout items |
| `approved_by` | UUID | Admin who approved |
| `approved_at` | TIMESTAMPTZ | Approval timestamp |
| `created_at` | TIMESTAMPTZ | Creation date |

### payout_items

Individual creator payouts within a batch.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `payout_batch_id` | UUID | FK to payout_batches |
| `creator_id` | UUID | FK to creators |
| `amount` | DECIMAL | Net payout amount |
| `wise_fee` | DECIMAL | Transfer fee |
| `status` | TEXT | `pending`, `processing`, `sent`, `paid`, `failed` |
| `created_at` | TIMESTAMPTZ | Creation date |

### wise_transfers

Wise API transfer records.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `payout_item_id` | UUID | FK to payout_items |
| `wise_transfer_id` | TEXT | Wise API transfer ID |
| `amount` | DECIMAL | Transfer amount |
| `currency` | TEXT | Currency code |
| `status` | TEXT | Transfer status |
| `created_at` | TIMESTAMPTZ | Creation date |

---

## Admin Tables

### admin_profiles

Administrator accounts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Supabase auth user ID |
| `email` | TEXT | Admin email |
| `role` | TEXT | `super_admin`, `admin`, `viewer` |
| `is_active` | BOOLEAN | Account status |
| `last_login` | TIMESTAMPTZ | Last login time |
| `created_at` | TIMESTAMPTZ | Creation date |

### audit_logs

Action audit trail.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | User who performed action |
| `action` | TEXT | `CREATE`, `UPDATE`, `DELETE`, `APPROVE`, etc. |
| `resource_type` | TEXT | Table/resource affected |
| `resource_id` | UUID | ID of affected record |
| `metadata` | JSONB | Additional context |
| `created_at` | TIMESTAMPTZ | Action timestamp |

---

## Financial Tables

### financial_ledger

Immutable financial transaction log.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `creator_id` | UUID | FK to creators |
| `transaction_type` | TEXT | Type of transaction |
| `amount` | DECIMAL | Transaction amount |
| `reference_id` | UUID | Related record ID |
| `metadata` | JSONB | Additional data |
| `created_at` | TIMESTAMPTZ | Transaction time (immutable) |

### idempotency_keys

Prevents duplicate operations.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `operation_key` | TEXT | Unique operation identifier |
| `status` | TEXT | `pending`, `completed`, `failed` |
| `response` | JSONB | Cached response |
| `created_at` | TIMESTAMPTZ | Creation time |
| `completed_at` | TIMESTAMPTZ | Completion time |

### payment_locks

Prevents concurrent payment operations.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `lock_type` | TEXT | `creator`, `batch`, `item` |
| `resource_id` | UUID | Locked resource ID |
| `operation` | TEXT | Operation description |
| `acquired_at` | TIMESTAMPTZ | Lock acquisition time |
| `expires_at` | TIMESTAMPTZ | Lock expiration |

---

## CMS Tables

### page_content

CMS content blocks.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `page_slug` | TEXT | Page identifier |
| `section_key` | TEXT | Section identifier |
| `content` | JSONB | Content data |
| `sort_order` | INT | Display order |
| `is_published` | BOOLEAN | Published status |
| `created_at` | TIMESTAMPTZ | Creation time |
| `updated_at` | TIMESTAMPTZ | Last update |

### page_images

CMS image storage references.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `page_slug` | TEXT | Page identifier |
| `image_key` | TEXT | Image identifier |
| `storage_path` | TEXT | Supabase storage path |
| `url` | TEXT | Public URL |
| `alt_text` | TEXT | Alt text |
| `file_size` | INT | File size in bytes |
| `mime_type` | TEXT | MIME type |

---

## Views

### creator_balances

Computed creator balance summary.

```sql
SELECT
  creator_id,
  SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending,
  SUM(CASE WHEN status = 'payable' THEN amount ELSE 0 END) as available,
  SUM(CASE WHEN status = 'locked' THEN amount ELSE 0 END) as locked
FROM commissions
GROUP BY creator_id
```

---

## Row Level Security

### Admin Access

```sql
CREATE POLICY "Admin full access" ON creators
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);
```

### Creator Access

```sql
CREATE POLICY "Creators view own data" ON commissions
FOR SELECT TO authenticated
USING (
  creator_id IN (
    SELECT id FROM creators
    WHERE user_id = auth.uid()
  )
);
```

---

## Indexes

Key indexes for performance:

```sql
-- Creators
CREATE INDEX idx_creators_email ON creators(email);
CREATE INDEX idx_creators_status ON creators(status);
CREATE INDEX idx_creators_discount_code ON creators(discount_code);

-- Orders
CREATE INDEX idx_orders_creator_id ON orders(creator_id);
CREATE INDEX idx_orders_shopify_id ON orders(shopify_order_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Commissions
CREATE INDEX idx_commissions_creator_id ON commissions(creator_id);
CREATE INDEX idx_commissions_status ON commissions(status);
CREATE INDEX idx_commissions_lock_until ON commissions(lock_until);

-- Payout Batches
CREATE INDEX idx_batches_status ON payout_batches(status);
CREATE INDEX idx_batches_created_at ON payout_batches(created_at);
```

---

## Migrations

Migrations are in `supabase/migrations/` and `migrations/`:

```
migrations/
├── 001_initial.sql
├── 002_rls_policies.sql
├── 003_fix_rls_final.sql
├── 006_routines_upsells.sql
├── 007_routine_checkout_idempotency.sql
├── ...
└── 023_shopify_discount_tracking.sql
```

Run migrations:

```bash
npm run migrate -- migrations/001_initial.sql
```

Or use Supabase Dashboard > SQL Editor.

---

## Backup & Recovery

### Supabase Backups

- Automatic daily backups (Pro plan)
- Point-in-time recovery available
- Access via Supabase Dashboard

### Manual Backup

```bash
pg_dump $DATABASE_URL > backup.sql
```

### Restore

```bash
psql $DATABASE_URL < backup.sql
```
