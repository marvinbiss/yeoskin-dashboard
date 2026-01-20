# FEC Export (Fichier des Ecritures Comptables)

## Overview

The FEC (Fichier des Ecritures Comptables) is a mandatory French accounting file format required for tax audits. This export generates a compliant file from posted journal entries.

## Legal Requirements

- **Mandatory since**: January 1, 2014
- **Authority**: Direction Générale des Finances Publiques (DGFiP)
- **Regulation**: Article L.47 A-I du Livre des procédures fiscales
- **Penalty for non-compliance**: Up to €5,000 per fiscal year

## File Format Specification

### File Naming Convention

```
{SIREN}FEC{YYYYMMDD}.txt
```

Example: `123456789FEC20260119.txt`

### Encoding

- Character set: ISO-8859-1 (Latin-1) or UTF-8 with BOM
- Line endings: CRLF (`\r\n`)
- Field delimiter: Pipe (`|`)

### Required Columns (18 mandatory fields)

| # | Column | Description | Format |
|---|--------|-------------|--------|
| 1 | JournalCode | Journal identifier | Text |
| 2 | JournalLib | Journal name | Text |
| 3 | EcritureNum | Entry number | Text (unique) |
| 4 | EcritureDate | Entry date | YYYYMMDD |
| 5 | CompteNum | Account number | Text |
| 6 | CompteLib | Account name | Text |
| 7 | CompAuxNum | Auxiliary account number | Text (optional) |
| 8 | CompAuxLib | Auxiliary account name | Text (optional) |
| 9 | PieceRef | Document reference | Text |
| 10 | PieceDate | Document date | YYYYMMDD |
| 11 | EcritureLib | Entry description | Text |
| 12 | Debit | Debit amount | Numeric (comma decimal) |
| 13 | Credit | Credit amount | Numeric (comma decimal) |
| 14 | EcritureLet | Lettering code | Text (optional) |
| 15 | DateLet | Lettering date | YYYYMMDD (optional) |
| 16 | ValidDate | Validation date | YYYYMMDD |
| 17 | Montantdevise | Foreign currency amount | Numeric (optional) |
| 18 | Idevise | Currency code | ISO 4217 |

## Amount Formatting

The `format_fec_amount()` SQL function formats amounts according to FEC requirements:

```sql
SELECT format_fec_amount(1234.56);
-- Returns: '1234,56'

SELECT format_fec_amount(-1234.56);
-- Returns: '1234,56' (absolute value)

SELECT format_fec_amount(NULL);
-- Returns: '0,00'
```

Rules:
- No thousands separator
- Comma as decimal separator
- Always 2 decimal places
- Absolute value (no negative amounts)

## Export Request

### Endpoint

```bash
curl -X POST https://yeoskin.app.n8n.cloud/webhook/export-fec \
  -H "Content-Type: application/json" \
  -H "x-secret: $FINANCE_WEBHOOK_SECRET" \
  -d '{
    "period_id": "uuid-here",
    "siren": "123456789",
    "fiscal_year": 2026
  }'
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| period_id | UUID | Yes | Financial period to export |
| siren | TEXT | No | Company SIREN (default: 000000000) |
| fiscal_year | INT | No | Fiscal year (default: current) |

### Response

```
JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|...
VT|Ventes|0000000001|20260115|622000|Commissions sur ventes|...
VT|Ventes|0000000001|20260115|401100|Fournisseurs - Créateurs|...
```

### Response Headers

| Header | Value |
|--------|-------|
| Content-Type | `text/plain; charset=utf-8` |
| Content-Disposition | `attachment; filename="{SIREN}FEC{DATE}.txt"` |
| X-Total-Count | Number of lines |
| X-FEC-SIREN | SIREN used |
| X-FEC-Fiscal-Year | Fiscal year |

## Account Mapping

| Account | Code | Description |
|---------|------|-------------|
| Commission Expense | 622000 | Commissions sur ventes |
| Creator Payable | 401100 | Fournisseurs - Créateurs |
| Bank | 512000 | Banque |

## Journal Codes

| Code | Description | Usage |
|------|-------------|-------|
| VT | Ventes | Sales/commission entries |
| BQ | Banque | Bank/payout entries |
| OD | Opérations Diverses | Adjustments |

## Validation Checklist

Before submitting to tax authorities, verify:

- [ ] File opens correctly in text editor
- [ ] Encoding is correct (no garbled characters)
- [ ] All 18 columns present in header
- [ ] Entry numbers are sequential and unique
- [ ] Dates are in YYYYMMDD format
- [ ] Amounts use comma as decimal separator
- [ ] Debit/Credit balance per entry equals zero
- [ ] SIREN matches company registration

## SQL Query

The export uses this query to generate FEC data:

```sql
SELECT
  je.entry_number AS JournalCode,
  je.entry_number AS JournalLib,
  LPAD(je.entry_number::text, 10, '0') AS EcritureNum,
  TO_CHAR(je.entry_date, 'YYYYMMDD') AS EcritureDate,
  al.account_code AS CompteNum,
  al.account_name AS CompteLib,
  '' AS CompAuxNum,
  '' AS CompAuxLib,
  je.reference AS PieceRef,
  TO_CHAR(je.entry_date, 'YYYYMMDD') AS PieceDate,
  je.description AS EcritureLib,
  format_fec_amount(al.debit) AS Debit,
  format_fec_amount(al.credit) AS Credit,
  '' AS EcritureLet,
  '' AS DateLet,
  TO_CHAR(je.created_at, 'YYYYMMDD') AS ValidDate,
  format_fec_amount(al.debit - al.credit) AS Montantdevise,
  'EUR' AS Idevise
FROM journal_entries je
JOIN accounting_lines al ON al.journal_entry_id = je.id
WHERE je.period_id = $1
  AND je.status = 'posted'
ORDER BY je.entry_number, al.id;
```

## Compliance Resources

- [Official FEC Specification (PDF)](https://www.impots.gouv.fr/portail/files/media/1_metier/2_professionnel/EV/4_diffusion_externe/fec_structure.pdf)
- [BOFiP-Impôts Documentation](https://bofip.impots.gouv.fr/bofip/9028-PGP.html)
- [DGFiP FEC Validation Tool](https://www.impots.gouv.fr/portail/test-des-fichiers-des-ecritures-comptables-fec)
