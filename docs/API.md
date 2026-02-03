# 📡 API Reference

## Overview

All API routes are located in `app/api/`. Authentication is required for most endpoints.

### Base URL

- **Production**: `https://yeoskin.fr/api`
- **Development**: `http://localhost:3000/api`

### Authentication

Most endpoints require a Bearer token:

```bash
curl -H "Authorization: Bearer <token>" https://yeoskin.fr/api/endpoint
```

Get token from Supabase Auth session.

---

## Public Endpoints

### Health Check

```
GET /api/health
```

Returns system health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-03T12:00:00.000Z",
  "version": "2.0.0",
  "uptime": 3600,
  "checks": {
    "database": { "status": "ok", "latency": 45 },
    "auth": { "status": "ok", "latency": 32 },
    "storage": { "status": "ok", "latency": 28 }
  }
}
```

### Metrics (Protected)

```
GET /api/metrics
Headers: x-api-key: <INTERNAL_API_KEY>
```

Prometheus-compatible metrics endpoint.

---

## Admin Endpoints

All admin endpoints require admin authentication.

### Applications

#### Approve Application

```
POST /api/admin/approve-application
```

**Request:**
```json
{
  "email": "creator@example.com",
  "firstName": "Emma",
  "tierName": "Gold",
  "commissionRate": 0.15,
  "discountCode": "EMMA10"
}
```

**Response:**
```json
{
  "success": true,
  "results": {
    "welcomeEmail": { "success": true },
    "supabaseInvite": { "success": true, "userId": "uuid" },
    "shopifyDiscount": { "success": true, "shopifyCodeId": "123" }
  }
}
```

#### Reject Application

```
POST /api/admin/reject-application
```

**Request:**
```json
{
  "email": "creator@example.com",
  "reason": "Incomplete profile"
}
```

#### Resend Invite

```
POST /api/admin/resend-invite
```

**Request:**
```json
{
  "email": "creator@example.com"
}
```

---

### Bank Accounts

```
GET /api/admin/bank-accounts?creator_id=<uuid>
POST /api/admin/bank-accounts
PUT /api/admin/bank-accounts
DELETE /api/admin/bank-accounts?id=<uuid>
```

Manage creator bank accounts for payouts.

---

## CMS Endpoints

### Content

#### Get Content

```
GET /api/cms/content?page_slug=home&section_key=hero
```

Public for published content, admin-only for unpublished.

**Query Params:**
- `page_slug` - Page identifier
- `section_key` - Section identifier
- `include_unpublished` - Include draft content (admin only)

**Response:**
```json
{
  "content": [
    {
      "id": "uuid",
      "page_slug": "home",
      "section_key": "hero",
      "content": { "title": "Welcome" },
      "is_published": true
    }
  ],
  "images": {
    "hero-bg": "https://storage.supabase.co/..."
  }
}
```

#### Update Content (Admin)

```
PUT /api/cms/content
```

**Request:**
```json
{
  "page_slug": "home",
  "section_key": "hero",
  "content": { "title": "New Title" },
  "is_published": true
}
```

#### Create Section (Admin)

```
POST /api/cms/content
```

#### Delete Section (Admin)

```
DELETE /api/cms/content?id=<uuid>
```

### Upload Image (Admin)

```
POST /api/cms/upload
Content-Type: multipart/form-data
```

**Form Data:**
- `file` - Image file (JPG, PNG, WebP, GIF, max 5MB)
- `page_slug` - Page identifier
- `image_key` - Unique image identifier

**Response:**
```json
{
  "success": true,
  "url": "https://storage.supabase.co/...",
  "path": "pages/home/hero-1234567890.jpg"
}
```

---

## Creator Application

### Submit Application

```
POST /api/apply
```

Rate limited: 20 requests/minute per IP.

**Request:**
```json
{
  "firstName": "Emma",
  "lastName": "Johnson",
  "email": "emma@example.com",
  "phone": "+33612345678",
  "instagramHandle": "@emma_beauty",
  "tiktokHandle": "@emma_beauty",
  "youtubeHandle": "EmmaBeauty",
  "followerCount": "10k-50k",
  "contentType": "skincare",
  "message": "I love Yeoskin products!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Application submitted successfully"
}
```

---

## Routines & Checkout

### Checkout

```
POST /api/routines/checkout
```

Rate limited: 5 requests/minute per IP.

**Request:**
```json
{
  "creator_slug": "emma",
  "variant": "base",
  "routine_slug": "hydratation"
}
```

**Variants:** `base`, `upsell_1`, `upsell_2`

**Response:**
```json
{
  "success": true,
  "checkoutUrl": "https://shop.yeoskin.com/cart/..."
}
```

### Health Check

```
GET /api/routines/checkout
```

Returns checkout service status and circuit breaker state.

### Assignments (Admin)

```
GET /api/routines/assignments?routine_id=<uuid>
POST /api/routines/assignments
DELETE /api/routines/assignments
```

Manage creator-routine assignments.

---

## Finance Endpoints

### Statements Download

```
GET /api/finance/statements/download?id=<uuid>&type=pdf
```

Download creator statements. Requires creator or admin auth.

**Query Params:**
- `id` - Statement UUID
- `type` - `pdf` or `csv`

### PDF Render

```
POST /api/finance/pdf/render
```

Generate PDF from HTML content.

---

## Auth Endpoints

### Reset Password

```
POST /api/auth/reset-password
```

**Request:**
```json
{
  "email": "user@example.com"
}
```

---

## Webhooks

### Shopify Webhook

```
POST /api/webhooks/shopify
Headers: X-Shopify-Hmac-Sha256: <signature>
```

Receives Shopify order events for commission tracking.

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "details": "Additional information (if available)"
}
```

### Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| `/api/apply` | 20 req/min |
| `/api/routines/checkout` | 5 req/min |
| General API | 10 req/min |

Rate limit headers:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`
- `Retry-After` (when limited)

---

## SDK Examples

### JavaScript/TypeScript

```typescript
// Using fetch
const response = await fetch('/api/admin/approve-application', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  },
  body: JSON.stringify({ email, firstName, tierName }),
})

const data = await response.json()
```

### With SWR

```typescript
import useSWR from 'swr'

const fetcher = (url) => fetch(url, {
  headers: { Authorization: `Bearer ${token}` }
}).then(r => r.json())

const { data, error } = useSWR('/api/cms/content?page_slug=home', fetcher)
```
