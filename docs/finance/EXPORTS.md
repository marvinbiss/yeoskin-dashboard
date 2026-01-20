# Financial Data Exports

## Overview

The export system provides CSV and JSON exports of financial data for reporting, analysis, and integration with external systems.

## Available Exports

| Export | Endpoint | Description |
|--------|----------|-------------|
| Commissions | `/webhook/export-commissions` | All commission records |
| Payouts | `/webhook/export-payouts` | All payout records |
| FEC | `/webhook/export-fec` | French accounting standard |

## Commission Export

### Request

```bash
curl -X POST https://yeoskin.app.n8n.cloud/webhook/export-commissions \
  -H "Content-Type: application/json" \
  -H "x-secret: $FINANCE_WEBHOOK_SECRET" \
  -d '{
    "start_date": "2026-01-01",
    "end_date": "2026-01-31",
    "status": "validated",
    "format": "csv"
  }'
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| start_date | DATE | Yes | Period start (inclusive) |
| end_date | DATE | Yes | Period end (inclusive) |
| status | TEXT | No | Filter by status |
| format | TEXT | No | `csv` (default) or `json` |

### CSV Columns

```
ID,Date Creation,Creator ID,Creator Name,Creator Email,Order ID,
Product ID,Product Name,Commission Rate,Amount,Currency,Status,
Validated At,Customer Email,Order Total
```

### JSON Response

```json
{
  "success": true,
  "count": 150,
  "data": [
    {
      "id": "uuid",
      "creator_id": "uuid",
      "creator_name": "John Doe",
      "amount": "45.00",
      "currency": "EUR",
      "status": "validated"
    }
  ]
}
```

## Payout Export

### Request

```bash
curl -X POST https://yeoskin.app.n8n.cloud/webhook/export-payouts \
  -H "Content-Type: application/json" \
  -H "x-secret: $FINANCE_WEBHOOK_SECRET" \
  -d '{
    "start_date": "2026-01-01",
    "end_date": "2026-01-31",
    "status": "completed",
    "format": "csv"
  }'
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| start_date | DATE | Yes | Period start (inclusive) |
| end_date | DATE | Yes | Period end (inclusive) |
| status | TEXT | No | Filter by status |
| format | TEXT | No | `csv` (default) or `json` |

### CSV Columns

```
ID,Creator ID,Creator Name,Creator Email,Amount,Currency,
Payment Method,Status,Wise Transfer ID,Wise Quote ID,
Bank Account Hash,Batch ID,Requested At,Executed At,
Failed At,Failure Reason,Idempotency Key
```

## Response Headers

All export endpoints return these headers:

| Header | Description |
|--------|-------------|
| `Content-Type` | `text/csv` or `application/json` |
| `Content-Disposition` | Filename for download |
| `X-Total-Count` | Number of records |

## Data Filtering

### Status Values

**Commissions:**
- `pending` - Awaiting validation
- `validated` - Confirmed, ready for payout
- `cancelled` - Voided commission

**Payouts:**
- `pending` - Requested, not yet processed
- `processing` - Being executed via Wise
- `completed` - Successfully transferred
- `failed` - Transfer failed

### Date Range

- `start_date` is inclusive (>= start of day)
- `end_date` is inclusive (< end of day + 1)
- Uses `created_at` for commissions
- Uses `executed_at` for payouts

## Integration Examples

### Import to Excel

```bash
# Download CSV and open in Excel
curl -X POST .../export-commissions \
  -H "x-secret: $SECRET" \
  -d '{"start_date":"2026-01-01","end_date":"2026-01-31"}' \
  -o commissions_jan2026.csv
```

### Import to Python/Pandas

```python
import pandas as pd
import requests

response = requests.post(
    "https://yeoskin.app.n8n.cloud/webhook/export-commissions",
    headers={"x-secret": SECRET},
    json={
        "start_date": "2026-01-01",
        "end_date": "2026-01-31",
        "format": "json"
    }
)

df = pd.DataFrame(response.json()["data"])
```

### Automated Reporting

```javascript
// n8n Code node example
const response = await $http.request({
  method: 'POST',
  url: `${$env.N8N_BASE_URL}/webhook/export-commissions`,
  headers: { 'x-secret': $env.FINANCE_WEBHOOK_SECRET },
  body: {
    start_date: '2026-01-01',
    end_date: '2026-01-31',
    format: 'json'
  }
});

const totalCommissions = response.data.reduce(
  (sum, c) => sum + parseFloat(c.amount), 0
);
```

## Security

- All endpoints require `x-secret` header authentication
- Secret stored in `FINANCE_WEBHOOK_SECRET` environment variable
- No PII redaction in exports (admin-only access)
- Exports logged for audit trail
