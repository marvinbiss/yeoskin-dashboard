# n8n Workflows

## ⚠️ Configuration Required

These workflow JSON files contain placeholders that must be configured in n8n:

### Secrets to Configure

Replace `{{FINANCE_WEBHOOK_SECRET}}` with your actual webhook secret in n8n's credential manager.

**DO NOT** hardcode secrets in these JSON files.

### How to Import

1. Open n8n dashboard
2. Go to Workflows > Import
3. Upload the JSON file
4. Configure credentials:
   - Set `FINANCE_WEBHOOK_SECRET` in n8n credentials
   - Update API URLs if needed

### Workflows

| File | Description |
|------|-------------|
| `export_commissions_v1.json` | Export commission data |
| `export_payouts_v1.json` | Export payout batches |
| `export_fec_v1.json` | French accounting export |
| `generate_creator_statements_v1.json` | Monthly creator statements |
| `financial_close_monthly_v1.json` | Monthly financial close |

### Environment

- Production: `https://yeoskin.app.n8n.cloud`
- Webhook endpoints: Configure in Vercel env vars
