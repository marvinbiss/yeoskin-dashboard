# 🚀 CI/CD Setup Guide

## GitHub Actions Pipeline

The project includes automated CI/CD with the following stages:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Security   │───▶│    Lint     │───▶│    Test     │───▶│    Build    │
│    Scan     │    │  TypeCheck  │    │  Coverage   │    │   Verify    │
└─────────────┘    └─────────────┘    └─────────────┘    └──────┬──────┘
                                                                │
                   ┌─────────────────────────────────────────────┘
                   │
         ┌────────▼────────┐              ┌────────────────────┐
         │  Deploy Preview │──(PR only)──▶│ Vercel Preview URL │
         └────────┬────────┘              └────────────────────┘
                  │
         ┌────────▼────────┐              ┌────────────────────┐
         │ Deploy Prod     │──(main)────▶│   yeoskin.fr       │
         └─────────────────┘              └────────────────────┘
```

---

## Required GitHub Secrets

Go to: **Repository Settings > Secrets and variables > Actions**

### Required Secrets

| Secret | Description | How to Get |
|--------|-------------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Supabase Dashboard > Settings > API |
| `VERCEL_TOKEN` | Vercel API token | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Your Vercel org ID | `.vercel/project.json` or Vercel dashboard |
| `VERCEL_PROJECT_ID` | Project ID in Vercel | `.vercel/project.json` or Vercel dashboard |

### Optional Secrets

| Secret | Description | Purpose |
|--------|-------------|---------|
| `CODECOV_TOKEN` | Codecov upload token | Code coverage reports |
| `SENTRY_AUTH_TOKEN` | Sentry release token | Source map uploads |

---

## Setting Up Vercel

### 1. Get Vercel Token

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Get token from: https://vercel.com/account/tokens
```

### 2. Get Project/Org IDs

```bash
# Link project (creates .vercel/project.json)
vercel link

# View the IDs
cat .vercel/project.json
```

Output:
```json
{
  "projectId": "prj_xxxxxxxxxxxx",
  "orgId": "team_xxxxxxxxxxxx"
}
```

### 3. Add Secrets to GitHub

```bash
# Using GitHub CLI
gh secret set VERCEL_TOKEN --body "your-token"
gh secret set VERCEL_ORG_ID --body "team_xxxx"
gh secret set VERCEL_PROJECT_ID --body "prj_xxxx"
```

---

## Workflow Files

### Main CI Pipeline (`.github/workflows/ci.yml`)

Runs on: Push to `main`/`develop`, Pull Requests

**Jobs:**
1. **Security** - Scans for secrets, npm audit
2. **Lint** - ESLint + TypeScript check
3. **Test** - Jest tests with coverage
4. **Build** - Next.js production build
5. **Deploy Preview** - Vercel preview (PRs only)
6. **Deploy Production** - Vercel prod (main only)

### CodeQL Security (`.github/workflows/codeql.yml`)

Runs on: Push to `main`, Weekly schedule

- Analyzes JavaScript/TypeScript for vulnerabilities
- Reports appear in Security tab

### Dependabot (`.github/dependabot.yml`)

- Updates npm dependencies weekly
- Updates GitHub Actions weekly
- Groups minor/patch updates together
- Ignores major React updates (review manually)

---

## Branch Protection Rules

Recommended settings for `main` branch:

1. **Require pull request reviews**
   - Required approving reviews: 1
   - Dismiss stale reviews

2. **Require status checks to pass**
   - Required checks:
     - `Security Scan`
     - `Lint & TypeCheck`
     - `Tests`
     - `Build`

3. **Require branches to be up to date**

4. **Do not allow bypassing**

### Setup via GitHub CLI

```bash
gh api repos/{owner}/{repo}/branches/main/protection -X PUT \
  -F required_status_checks='{"strict":true,"contexts":["security","lint","test","build"]}' \
  -F enforce_admins=true \
  -F required_pull_request_reviews='{"required_approving_review_count":1}'
```

---

## Environment Setup

### Production Environment

1. Go to **Settings > Environments > New environment**
2. Name: `production`
3. Add protection rules:
   - Required reviewers (optional)
   - Wait timer (optional)
4. Add secrets specific to production

### Preview Environment

Vercel automatically creates preview URLs for each PR.

---

## Local Development

### Run CI Checks Locally

```bash
# Full validation (like CI)
npm run validate

# Individual checks
npm run security:check  # Scan for secrets
npm run lint            # ESLint
npm run typecheck       # TypeScript
npm run test            # Jest tests
npm run build           # Production build
```

### Pre-commit Hook

The project includes a precommit script:

```bash
npm run precommit
```

To enable as a git hook:

```bash
# Install husky (optional)
npm install -D husky
npx husky init
echo "npm run precommit" > .husky/pre-commit
```

---

## Troubleshooting

### Build Fails in CI

1. **Missing env variables:**
   - Check all `NEXT_PUBLIC_*` secrets are set
   - Verify secret names match exactly

2. **TypeScript errors:**
   - Run `npm run typecheck` locally
   - Fix errors before pushing

3. **Test failures:**
   - Run `npm test` locally
   - Check for flaky tests

### Deployment Fails

1. **Vercel token expired:**
   - Generate new token at vercel.com
   - Update `VERCEL_TOKEN` secret

2. **Wrong project ID:**
   - Run `vercel link` locally
   - Copy IDs from `.vercel/project.json`

3. **Build timeout:**
   - Check for infinite loops
   - Optimize build process

### Security Scan Fails

1. **Secrets detected:**
   - Remove hardcoded secrets
   - Use environment variables

2. **npm audit issues:**
   - Run `npm audit fix`
   - Review and update packages

---

## Monitoring Deployments

### Vercel Dashboard

- View all deployments: [vercel.com/dashboard](https://vercel.com/dashboard)
- Check build logs
- Rollback if needed

### GitHub Actions

- View runs: Repository > Actions tab
- Re-run failed jobs
- Download artifacts

### Notifications

Set up notifications in GitHub:
- **Settings > Notifications**
- Enable for workflow failures

---

## Quick Reference

```bash
# Deploy manually
vercel                    # Preview
vercel --prod            # Production

# Check deployment status
vercel ls

# View logs
vercel logs [deployment-url]

# Rollback
vercel rollback [deployment-url]
```
