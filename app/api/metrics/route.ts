/**
 * GET /api/metrics
 * Prometheus-compatible metrics endpoint
 *
 * Protected: Requires internal API key
 */

import { NextRequest, NextResponse } from 'next/server'
import { metrics } from '@/lib/metrics'

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Check for internal API key
  const apiKey = request.headers.get('x-api-key')
  const expectedKey = process.env.INTERNAL_API_KEY

  if (expectedKey && apiKey !== expectedKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Calculate statistics
  const durations = metrics.http_request_duration_seconds
  const avgDuration = durations.length > 0
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0
  const p95Duration = durations.length > 0
    ? durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)] || 0
    : 0

  // Prometheus format
  const prometheusMetrics = `
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total ${metrics.http_requests_total}

# HELP http_request_duration_seconds HTTP request duration in seconds
# TYPE http_request_duration_seconds summary
http_request_duration_seconds_sum ${durations.reduce((a, b) => a + b, 0)}
http_request_duration_seconds_count ${durations.length}
http_request_duration_seconds{quantile="0.5"} ${avgDuration.toFixed(4)}
http_request_duration_seconds{quantile="0.95"} ${p95Duration.toFixed(4)}

# HELP errors_total Total number of errors
# TYPE errors_total counter
errors_total ${metrics.errors_total}

# HELP nodejs_heap_size_bytes Node.js heap size
# TYPE nodejs_heap_size_bytes gauge
nodejs_heap_size_bytes ${process.memoryUsage?.()?.heapUsed || 0}

# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds ${process.uptime?.() || 0}
`.trim()

  return new NextResponse(prometheusMetrics, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
