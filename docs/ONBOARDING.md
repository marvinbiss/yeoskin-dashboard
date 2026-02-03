# 🚀 Developer Onboarding Guide

Welcome to the Yeoskin Dashboard team! This guide will help you get up and running quickly.

---

## Prerequisites

Before starting, ensure you have:

- [ ] **Node.js 20+** - [Download](https://nodejs.org/)
- [ ] **Git** - [Download](https://git-scm.com/)
- [ ] **VS Code** (recommended) - [Download](https://code.visualstudio.com/)
- [ ] Access to **Supabase** project (ask team lead)
- [ ] Access to **GitHub** repository

### Recommended VS Code Extensions

- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- Tailwind CSS IntelliSense (`bradlc.vscode-tailwindcss`)
- TypeScript (`ms-vscode.vscode-typescript-next`)

---

## Step 1: Clone & Install

```bash
# Clone the repository
git clone https://github.com/yeoskin/dashboard.git
cd dashboard

# Install dependencies
npm install

# Verify installation
npm run typecheck
```

---

## Step 2: Environment Setup

### Get Credentials

Contact your team lead for:
1. Supabase project access
2. Development API keys
3. Shopify development store access

### Configure Environment

```bash
# Copy example environment file
cp .env.example .env.local

# Open and edit with your credentials
code .env.local
```

### Minimum Required Variables

```bash
# Supabase (get from Supabase Dashboard > Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# For local development, you can leave these empty:
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## Step 3: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Available URLs

| URL | Description |
|-----|-------------|
| `localhost:3000` | Main application |
| `localhost:3000/auth/login` | Admin login |
| `localhost:3000/apply` | Creator application form |
| `localhost:3000/api/health` | Health check endpoint |

---

## Step 4: Understand the Codebase

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `app/` | Next.js pages and API routes |
| `app/(admin)/` | Admin dashboard (protected) |
| `app/api/` | Backend API endpoints |
| `src/components/` | Reusable React components |
| `src/contexts/` | React Context providers |
| `src/hooks/` | Custom React hooks |
| `src/lib/` | Utilities and services |

### Key Files

| File | Purpose |
|------|---------|
| `middleware.ts` | Multi-domain routing |
| `src/contexts/AuthContext.jsx` | Authentication state |
| `src/hooks/useSWROptimized.js` | Data fetching |
| `src/lib/auth-middleware.ts` | API authentication |

---

## Step 5: Development Workflow

### Create a Feature Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/my-feature
```

### Validate Before Committing

```bash
npm run validate
```

### Commit with Conventional Format

```bash
git commit -m "feat(creators): add bulk export"
git commit -m "fix(auth): resolve timeout issue"
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

---

## Step 6: Common Tasks

### Add a New API Route

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth, unauthorizedResponse } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request)
  if (!auth.authenticated) {
    return unauthorizedResponse(auth.error)
  }
  return NextResponse.json({ data: 'example' })
}
```

### Use Data Fetching

```tsx
import { useCreatorsOptimized } from '@/hooks/useSWROptimized'

function CreatorList() {
  const { data, error, isLoading } = useCreatorsOptimized()
  if (isLoading) return <Skeleton />
  return <ul>{data?.map(c => <li key={c.id}>{c.name}</li>)}</ul>
}
```

### Access Authentication

```tsx
import { useAuth } from '@/contexts/AuthContext'

function AdminPanel() {
  const { user, isAdmin, signOut } = useAuth()
  if (!isAdmin) return <Unauthorized />
  return <div>Welcome, {user.email}</div>
}
```

---

## Troubleshooting

### "Module not found" Error
```bash
rm -rf .next && npm run dev
```

### TypeScript Errors
```bash
npm run typecheck
```

### Database Issues
- Check `NEXT_PUBLIC_SUPABASE_URL` is correct
- Verify API keys in Supabase Dashboard

---

## Checklist

Before your first PR:

- [ ] Environment is set up and running
- [ ] Can access localhost:3000
- [ ] Understand project structure
- [ ] Run `npm run validate` successfully
- [ ] Created a test branch
- [ ] Made a small change and committed

---

## Next Steps

1. Read [ARCHITECTURE.md](ARCHITECTURE.md)
2. Read [API.md](API.md)
3. Pick a small issue to start with

Welcome aboard! 🎉
