# Creator Statements

## Overview

Creator statements are automatically generated PDF and CSV documents that summarize a creator's financial activity for a given period. They include commissions earned and payouts received.

## Statement Generation Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Close Workflow │────▶│  Statement      │────▶│  PDF Render     │
│  (Trigger)      │     │  Workflow       │     │  API            │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │                        │
                                ▼                        ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │  Supabase DB    │     │  Supabase       │
                        │  (Records)      │     │  Storage        │
                        └─────────────────┘     └─────────────────┘
```

## Statement Content

### PDF Statement Sections

1. **Header**
   - Yeoskin logo/branding
   - Period name and date range
   - Creator information

2. **Commissions Table**
   - Date
   - Order reference
   - Product name
   - Amount

3. **Payouts Table**
   - Date
   - Wise transfer reference
   - Payment method
   - Amount

4. **Summary**
   - Total commissions
   - Total payouts
   - Current balance

5. **Footer**
   - Generation timestamp
   - Document reference

### CSV Export Columns

```csv
Date,Type,Reference,Description,Debit,Credit,Currency
2026-01-15,Commission,ORD-123,Product XYZ,,45.00,EUR
2026-01-20,Payout,WISE-456,Bank Transfer,200.00,,EUR
```

## Storage Structure

Statements are stored in Supabase Storage under the `finance` bucket:

```
finance/
└── statements/
    └── {period_id}/
        ├── {creator_id}.pdf
        └── {creator_id}.csv
```

## Database Schema

### `creator_statements` Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| creator_id | UUID | FK to creator_profiles |
| period_id | UUID | FK to financial_periods |
| total_commissions | NUMERIC | Sum of commissions |
| total_payouts | NUMERIC | Sum of payouts |
| balance | NUMERIC | commissions - payouts |
| pdf_path | TEXT | Storage path to PDF |
| csv_path | TEXT | Storage path to CSV |
| status | TEXT | generated/sent/downloaded |
| created_at | TIMESTAMPTZ | Generation timestamp |
| updated_at | TIMESTAMPTZ | Last update |

## Downloading Statements

### API Endpoint

```
GET /api/finance/statements/download?id={statement_id}&type={pdf|csv}
```

### Authentication & Authorization

1. User must be authenticated via Supabase session
2. Access allowed if:
   - User is the statement owner (creator_id matches)
   - User has admin role (`admin` or `finance`)
3. Returns 404 for unauthorized access (anti-enumeration)

### Rate Limiting

- 10 requests per minute per IP
- Uses Upstash Redis sliding window algorithm
- Returns 429 with `Retry-After` header when exceeded

### Response

- Redirects (302) to signed Supabase Storage URL
- Signed URL expires after 1 hour (3600 seconds)

## PDF Rendering

### API Endpoint

```
POST /api/finance/pdf/render
```

### Request

```json
{
  "html": "<html>...</html>",
  "options": {
    "format": "A4",
    "landscape": false,
    "margin": {
      "top": "20mm",
      "right": "15mm",
      "bottom": "20mm",
      "left": "15mm"
    }
  }
}
```

### Response

```json
{
  "pdf_base64": "JVBERi0xLjQK..."
}
```

### Technical Details

- Uses `puppeteer-core` + `@sparticuz/chromium`
- Runs on Vercel Edge Functions (nodejs runtime)
- Max duration: 60 seconds
- HTML size limit: 5MB
- Authenticated via `x-api-key` header (internal use only)

## Triggering Statement Generation

### Via n8n Webhook

```bash
curl -X POST https://yeoskin.app.n8n.cloud/webhook/generate-creator-statements \
  -H "Content-Type: application/json" \
  -H "x-secret: $FINANCE_WEBHOOK_SECRET" \
  -d '{
    "period_id": "uuid-here",
    "close_run_id": "uuid-here"
  }'
```

### Response

```json
{
  "success": true,
  "statements_generated": 42
}
```

## Statement Lifecycle

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ generated │────▶│   sent   │────▶│downloaded│
└──────────┘     └──────────┘     └──────────┘
      │
      │ (if email fails)
      ▼
┌──────────┐
│  failed  │
└──────────┘
```

## Localization

Statements are generated in French (fr-FR) with:
- Date format: DD/MM/YYYY
- Number format: 1 234,56
- Currency: EUR
