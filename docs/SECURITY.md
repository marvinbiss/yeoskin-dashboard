# 🔐 Security Guidelines - Yeoskin Dashboard

## ⚠️ CRITICAL: Secret Management

### Never Commit Secrets

The following should **NEVER** be committed to version control:

- `.env` files (except `.env.example`)
- API keys, tokens, passwords
- Database connection strings
- Private keys or certificates
- Webhook secrets

### Environment Variables Setup

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your actual values in `.env.local`

3. **Never** edit `.env.example` with real values

### Required Secrets

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key | Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin key | Supabase Dashboard > Settings > API |
| `SHOPIFY_STOREFRONT_TOKEN` | Storefront API access | Shopify Admin > Apps > Develop apps |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | Admin API access | Shopify Admin > Apps > Develop apps |
| `RESEND_API_KEY` | Email sending | resend.com/api-keys |
| `FINANCE_WEBHOOK_SECRET` | Webhook validation | Generate: `openssl rand -hex 32` |
| `INTERNAL_API_KEY` | Internal API auth | Generate: `openssl rand -hex 32` |

---

## 🚨 If Secrets Are Exposed

### Immediate Actions (within 1 hour)

1. **Rotate ALL exposed credentials immediately**
   - Supabase: Dashboard > Settings > API > Regenerate keys
   - Shopify: Create new private app tokens
   - Resend: Create new API key, revoke old one

2. **Remove from Git history**
   ```bash
   # Install BFG Repo-Cleaner
   # https://rtyley.github.io/bfg-repo-cleaner/

   # Remove files from history
   bfg --delete-files .env
   bfg --delete-files .env.local

   # Clean up
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive

   # Force push (coordinate with team!)
   git push --force
   ```

3. **Enable GitHub Secret Scanning**
   - Go to repository Settings > Security > Secret scanning
   - Enable "Push protection"

4. **Audit access logs**
   - Check Supabase auth logs for unauthorized access
   - Review Shopify admin activity
   - Check for unusual API usage

---

## 🛡️ Security Best Practices

### Authentication

- [ ] Supabase Auth with RLS enabled
- [ ] Session timeout (30 min idle)
- [ ] 2FA available for admins
- [ ] Rate limiting on auth endpoints

### Authorization

- [ ] Row Level Security (RLS) on all tables
- [ ] Role-based access (super_admin, admin, viewer)
- [ ] Creator isolation (can only see own data)

### API Security

- [ ] Bearer token authentication
- [ ] Rate limiting (Upstash Redis)
- [ ] Input validation on all endpoints
- [ ] CORS configured properly

### Data Protection

- [ ] Sensitive fields redacted in logs
- [ ] No secrets in error messages
- [ ] Audit logging for admin actions
- [ ] Financial data encrypted at rest

---

## 🔍 Security Checks

### Run Secret Scanner
```bash
node scripts/check-secrets.js
```

### Check Git for Secrets
```bash
# Search for potential secrets in git history
git log -p | grep -E "(password|secret|key|token)" | head -50
```

### Audit npm Packages
```bash
npm audit
npm audit fix
```

---

## 📋 Security Checklist for Production

### Before Deployment

- [ ] All secrets in environment variables (not code)
- [ ] `.env*` files in `.gitignore`
- [ ] No debug endpoints exposed
- [ ] Rate limiting configured
- [ ] HTTPS enforced
- [ ] Error messages don't leak info

### After Deployment

- [ ] Secret scanning enabled on GitHub
- [ ] Monitoring for unusual activity
- [ ] Regular dependency updates
- [ ] Periodic security audits

---

## 🆘 Security Contacts

For security issues, contact:
- Internal: security@yeoskin.com
- Supabase issues: support.supabase.com
- Shopify issues: help.shopify.com

---

## 📅 Last Updated

- Date: 2026-02-03
- Author: Security Audit Phase 1
- Next Review: Monthly
