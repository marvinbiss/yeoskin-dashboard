/**
 * Monitoring and Error Tracking Utilities
 *
 * Provides centralized error tracking, performance monitoring,
 * and alerting capabilities.
 */

import { logger } from './logger'

// ============================================
// ERROR TRACKING
// ============================================

interface ErrorContext {
  userId?: string
  email?: string
  action?: string
  metadata?: Record<string, unknown>
}

interface PerformanceMetric {
  name: string
  duration: number
  metadata?: Record<string, unknown>
}

/**
 * Track an error for monitoring and alerting
 */
export function trackError(
  error: Error,
  context?: ErrorContext
): void {
  const errorData = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...context,
    timestamp: new Date().toISOString(),
  }

  // Log to console/Pino
  logger.error(errorData, 'Error tracked')

  // If Sentry is configured, send there too
  if (typeof window !== 'undefined' && (window as unknown as { Sentry?: { captureException: (e: Error) => void } }).Sentry) {
    (window as unknown as { Sentry: { captureException: (e: Error) => void } }).Sentry.captureException(error)
  }

  // Could also send to other services:
  // - Datadog
  // - New Relic
  // - Custom webhook
}

/**
 * Track a performance metric
 */
export function trackPerformance(metric: PerformanceMetric): void {
  logger.info(
    {
      type: 'performance',
      metric: metric.name,
      duration: metric.duration,
      ...metric.metadata,
    },
    `Performance: ${metric.name}`
  )
}

/**
 * Create a performance timer
 */
export function createTimer(name: string) {
  const start = performance.now()

  return {
    end: (metadata?: Record<string, unknown>) => {
      const duration = performance.now() - start
      trackPerformance({ name, duration, metadata })
      return duration
    },
  }
}

// ============================================
// ALERTING
// ============================================

type AlertSeverity = 'info' | 'warning' | 'error' | 'critical'

interface Alert {
  title: string
  message: string
  severity: AlertSeverity
  metadata?: Record<string, unknown>
}

/**
 * Send an alert for critical issues
 */
export async function sendAlert(alert: Alert): Promise<void> {
  const alertData = {
    ...alert,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  }

  // Log the alert
  const logFn = alert.severity === 'critical' || alert.severity === 'error'
    ? logger.error
    : alert.severity === 'warning'
      ? logger.warn
      : logger.info

  logFn.call(logger, alertData, `Alert: ${alert.title}`)

  // Send to alerting service (Slack, PagerDuty, etc.)
  const webhookUrl = process.env.ALERT_WEBHOOK_URL
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `[${alert.severity.toUpperCase()}] ${alert.title}`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*${alert.title}*\n${alert.message}`,
              },
            },
          ],
        }),
      })
    } catch (error) {
      logger.error({ error }, 'Failed to send alert webhook')
    }
  }
}

// ============================================
// METRICS
// ============================================

interface MetricData {
  name: string
  value: number
  tags?: Record<string, string>
}

const metricsBuffer: MetricData[] = []
const FLUSH_INTERVAL = 60000 // 1 minute

/**
 * Record a metric value
 */
export function recordMetric(metric: MetricData): void {
  metricsBuffer.push({
    ...metric,
  })

  // Log immediately in development
  if (process.env.NODE_ENV === 'development') {
    logger.debug(metric, `Metric: ${metric.name}`)
  }
}

/**
 * Flush metrics to external service
 */
export async function flushMetrics(): Promise<void> {
  if (metricsBuffer.length === 0) return

  const metrics = [...metricsBuffer]
  metricsBuffer.length = 0

  // Send to metrics service if configured
  const metricsUrl = process.env.METRICS_ENDPOINT
  if (metricsUrl) {
    try {
      await fetch(metricsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics }),
      })
    } catch (error) {
      logger.error({ error }, 'Failed to flush metrics')
    }
  }
}

// Auto-flush metrics periodically (server-side only)
if (typeof window === 'undefined') {
  setInterval(flushMetrics, FLUSH_INTERVAL)
}

// ============================================
// HEALTH CHECKS
// ============================================

interface HealthCheck {
  name: string
  check: () => Promise<boolean>
}

const healthChecks: HealthCheck[] = []

/**
 * Register a health check
 */
export function registerHealthCheck(check: HealthCheck): void {
  healthChecks.push(check)
}

/**
 * Run all health checks
 */
export async function runHealthChecks(): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {}

  await Promise.all(
    healthChecks.map(async (check) => {
      try {
        results[check.name] = await check.check()
      } catch {
        results[check.name] = false
      }
    })
  )

  return results
}

// ============================================
// REQUEST TRACKING
// ============================================

/**
 * Track an API request for analytics
 */
export function trackRequest(data: {
  method: string
  path: string
  status: number
  duration: number
  userId?: string
}): void {
  recordMetric({
    name: 'api_request',
    value: data.duration,
    tags: {
      method: data.method,
      path: data.path,
      status: data.status.toString(),
    },
  })
}

// ============================================
// EXPORTS
// ============================================

export const monitoring = {
  trackError,
  trackPerformance,
  createTimer,
  sendAlert,
  recordMetric,
  flushMetrics,
  registerHealthCheck,
  runHealthChecks,
  trackRequest,
}

export default monitoring
