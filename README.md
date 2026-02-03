# Yeoskin Dashboard

**Enterprise-grade creator management platform** built with Next.js 15, Supabase, and TypeScript.

[![CI](https://github.com/yeoskin/dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/yeoskin/dashboard/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)

---

## Overview

Yeoskin Dashboard is a comprehensive platform for managing creator partnerships, commissions, payouts, and e-commerce integrations.

### Key Features

- **Creator Management** - Onboard, track, and manage creator partnerships
- **Commission Tracking** - Automatic commission calculation from Shopify orders
- **Payout System** - Batch payouts with Wise integration
- **Financial Ledger** - Enterprise-grade accounting with audit trails
- **CMS** - Content management for creator pages
- **Multi-tenant** - Separate admin, creator, and public portals

---

## Quick Start

### Prerequisites

- Node.js 20+
- npm 9+
- Supabase account
- Shopify store (for e-commerce features)

### Installation

```bash
# Clone the repository
git clone https://github.com/yeoskin/dashboard.git
cd dashboard

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Documentation

| Document | Description |
|----------|-------------|
| [Onboarding Guide](docs/ONBOARDING.md) | New developer setup |
| [Architecture](docs/ARCHITECTURE.md) | System design & patterns |
| [API Reference](docs/API.md) | All API endpoints |
| [Database Schema](docs/DATABASE.md) | Tables & relationships |
| [Security](docs/SECURITY.md) | Security guidelines |
| [Monitoring](docs/MONITORING.md) | Observability setup |
| [CI/CD Setup](docs/CI_CD_SETUP.md) | GitHub Actions & Vercel |
| [Contributing](CONTRIBUTING.md) | How to contribute |

---

## Project Structure

```
yeoskin-dashboard/
├── app/                    # Next.js App Router
│   ├── (admin)/           # Admin dashboard routes
│   ├── (public)/          # Public pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   └── c/                 # Creator portal
├── src/
│   ├── components/        # React components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilities & services
│   └── views/             # Page-level components
├── supabase/              # Database migrations
├── docs/                  # Documentation
└── scripts/               # Utility scripts
```

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5.9 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Styling | Tailwind CSS |
| State | SWR + React Context |
| Email | Resend |
| Payments | Wise API |
| E-commerce | Shopify Storefront/Admin API |
| Rate Limiting | Upstash Redis |
| Monitoring | Pino, Sentry (optional) |
| CI/CD | GitHub Actions + Vercel |

---

## Scripts

```bash
# Development
npm run dev           # Start dev server
npm run build         # Production build
npm run start         # Start production server

# Quality
npm run lint          # ESLint
npm run typecheck     # TypeScript check
npm run test          # Jest tests
npm run test:coverage # Tests with coverage
npm run validate      # Full validation (lint + typecheck + test)

# Security
npm run security:check # Scan for secrets

# Database
npm run migrate       # Run migrations
```

---

## Environment Variables

See [.env.example](.env.example) for all required variables.

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `SHOPIFY_STOREFRONT_TOKEN` - Shopify Storefront API token
- `RESEND_API_KEY` - Email service API key

---

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker

```bash
docker build -t yeoskin-dashboard .
docker run -p 3000:3000 yeoskin-dashboard
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes, then validate
npm run validate

# Commit with conventional format
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/my-feature
```

---

## License

Proprietary - Yeoskin © 2026

---

## Support

- **Issues**: [GitHub Issues](https://github.com/yeoskin/dashboard/issues)
- **Email**: tech@yeoskin.com
