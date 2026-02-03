/**
 * Metrics Collection Utilities
 *
 * Simple in-memory metrics (would use proper metrics library in production)
 */

interface Metrics {
  http_requests_total: number
  http_request_duration_seconds: number[]
  active_connections: number
  errors_total: number
}

export const metrics: Metrics = {
  http_requests_total: 0,
  http_request_duration_seconds: [],
  active_connections: 0,
  errors_total: 0,
}

// Increment request counter (called from middleware)
export function incrementRequests(): void {
  metrics.http_requests_total++
}

export function recordRequestDuration(seconds: number): void {
  metrics.http_request_duration_seconds.push(seconds)
  // Keep only last 1000 measurements
  if (metrics.http_request_duration_seconds.length > 1000) {
    metrics.http_request_duration_seconds.shift()
  }
}

export function incrementErrors(): void {
  metrics.errors_total++
}

export function getMetrics(): Metrics {
  return { ...metrics }
}
