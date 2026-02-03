# 📊 Monitoring & Observability

## Overview

Yeoskin Dashboard includes built-in monitoring capabilities:

- **Health Checks**: `/api/health` - Service status and dependencies
- **Metrics**: `/api/metrics` - Prometheus-compatible metrics
- **Error Tracking**: Sentry integration (optional)
- **Logging**: Pino structured logging

---

## Health Check Endpoint

### `GET /api/health`

Returns the health status of all system components.

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

**Status Codes:**
- `200` - Healthy or Degraded
- `503` - Unhealthy (all checks failed)

**Use Cases:**
- Load balancer health checks
- Kubernetes liveness/readiness probes
- Uptime monitoring (UptimeRobot, Pingdom)

---

## Metrics Endpoint

### `GET /api/metrics`

Prometheus-compatible metrics endpoint.

**Authentication:** Requires `x-api-key` header with `INTERNAL_API_KEY`

**Example:**
```bash
curl -H "x-api-key: your-internal-key" https://yeoskin.fr/api/metrics
```

**Available Metrics:**
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request latency
- `errors_total` - Total errors
- `nodejs_heap_size_bytes` - Memory usage
- `process_uptime_seconds` - Process uptime

---

## Error Tracking (Sentry)

### Setup

1. Install Sentry:
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard@latest -i nextjs
   ```

2. Add to `.env.local`:
   ```
   NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
   SENTRY_AUTH_TOKEN=your-auth-token
   ```

3. Sentry will automatically capture:
   - Unhandled exceptions
   - API route errors
   - Client-side errors
   - Performance transactions

### Manual Error Tracking

```typescript
import { captureException } from '@/lib/sentry'

try {
  await riskyOperation()
} catch (error) {
  captureException(error, { userId: user.id, action: 'riskyOperation' })
}
```

---

## Logging

### Configuration

Set log level via environment variable:
```
LOG_LEVEL=info  # debug, info, warn, error
```

### Usage

```typescript
import { logger } from '@/lib/logger'

logger.info({ userId, action: 'login' }, 'User logged in')
logger.warn({ requestId }, 'Rate limit approaching')
logger.error({ error: err.message }, 'Payment failed')
```

### Log Format

```json
{
  "level": "INFO",
  "time": "2026-02-03T12:00:00.000Z",
  "service": "yeoskin-finance",
  "env": "production",
  "userId": "uuid",
  "msg": "User logged in"
}
```

**Sensitive Data:** Automatically redacted:
- `email`, `password`, `token`, `api_key`
- Authorization headers

---

## Alerting

### Slack/Discord Webhooks

Set `ALERT_WEBHOOK_URL` to receive critical alerts:

```typescript
import { sendAlert } from '@/lib/monitoring'

await sendAlert({
  title: 'Payment Failed',
  message: 'Wise transfer failed for batch #123',
  severity: 'critical',
  metadata: { batchId: 123, error: 'Insufficient funds' }
})
```

### Alert Severity Levels

| Level | Use Case |
|-------|----------|
| `info` | Informational events |
| `warning` | Potential issues |
| `error` | Errors requiring attention |
| `critical` | Immediate action needed |

---

## Performance Monitoring

### Custom Timers

```typescript
import { createTimer } from '@/lib/monitoring'

const timer = createTimer('shopify_checkout')
await processCheckout()
timer.end({ orderId: order.id })
```

### Metrics Recording

```typescript
import { recordMetric } from '@/lib/monitoring'

recordMetric({
  name: 'payout_amount',
  value: 150.00,
  tags: { currency: 'EUR', status: 'completed' }
})
```

---

## Recommended External Services

### Free Tier Options

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| **Sentry** | Error tracking | 5K errors/month |
| **UptimeRobot** | Uptime monitoring | 50 monitors |
| **Grafana Cloud** | Metrics dashboards | 10K series |
| **Logtail** | Log aggregation | 1GB/month |

### Setup Checklist

- [ ] Configure Sentry DSN
- [ ] Add UptimeRobot monitor for `/api/health`
- [ ] Set up Grafana dashboard (optional)
- [ ] Configure alert webhooks

---

## Environment Variables

Add to `.env.local`:

```bash
# Monitoring
LOG_LEVEL=info
ALERT_WEBHOOK_URL=https://hooks.slack.com/services/xxx

# Sentry (optional)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=xxx

# Metrics (optional)
METRICS_ENDPOINT=https://your-metrics-collector.com/push
```

---

## Kubernetes / Docker

### Health Probes

```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

### Prometheus Scrape Config

```yaml
scrape_configs:
  - job_name: 'yeoskin-dashboard'
    static_configs:
      - targets: ['yeoskin.fr']
    metrics_path: '/api/metrics'
    bearer_token: 'your-internal-api-key'
```

---

## Troubleshooting

### Common Issues

**Health check returns 503:**
- Check Supabase connectivity
- Verify environment variables are set
- Check database RLS policies

**Metrics endpoint returns 401:**
- Verify `INTERNAL_API_KEY` is set
- Pass `x-api-key` header in requests

**Logs not appearing:**
- Check `LOG_LEVEL` environment variable
- Verify Pino is imported correctly

---

## Dashboard Recommendations

### Grafana Dashboard Panels

1. **Request Rate** - `rate(http_requests_total[5m])`
2. **Error Rate** - `rate(errors_total[5m])`
3. **Latency P95** - `http_request_duration_seconds{quantile="0.95"}`
4. **Memory Usage** - `nodejs_heap_size_bytes`
5. **Uptime** - Based on health check status

### Key Metrics to Alert On

| Metric | Threshold | Action |
|--------|-----------|--------|
| Error rate | > 5% | Investigate |
| P95 latency | > 2s | Optimize |
| Health check | Failed 3x | Page on-call |
| Memory | > 80% | Scale/restart |
