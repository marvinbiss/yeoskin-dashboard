/**
 * Sentry Configuration
 *
 * To enable Sentry error tracking:
 * 1. Install: npm install @sentry/nextjs
 * 2. Run: npx @sentry/wizard@latest -i nextjs
 * 3. Set NEXT_PUBLIC_SENTRY_DSN in environment
 *
 * This file provides a fallback when Sentry is not configured.
 */

// Check if Sentry is available
const hasSentry = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN

/**
 * Initialize Sentry (call in _app.tsx or layout.tsx)
 */
export function initSentry(): void {
  if (!hasSentry) {
    console.info('[Sentry] Not configured - set NEXT_PUBLIC_SENTRY_DSN to enable')
    return
  }

  // Sentry will be initialized by @sentry/nextjs automatically
  console.info('[Sentry] Initialized')
}

/**
 * Capture an exception
 */
export function captureException(error: Error, context?: Record<string, unknown>): void {
  if (hasSentry) {
    // @sentry/nextjs handles this automatically when installed
    console.error('[Sentry] Would capture:', error.message, context)
  } else {
    console.error('[Error]', error.message, context)
  }
}

/**
 * Capture a message
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  if (hasSentry) {
    console.log(`[Sentry] Would capture ${level}:`, message)
  } else {
    console.log(`[${level.toUpperCase()}]`, message)
  }
}

/**
 * Set user context
 */
export function setUser(user: { id: string; email?: string; role?: string } | null): void {
  if (hasSentry) {
    console.log('[Sentry] Would set user:', user?.id)
  }
}

/**
 * Add breadcrumb
 */
export function addBreadcrumb(breadcrumb: {
  category: string
  message: string
  level?: 'info' | 'warning' | 'error'
  data?: Record<string, unknown>
}): void {
  if (hasSentry) {
    console.log('[Sentry] Breadcrumb:', breadcrumb.category, breadcrumb.message)
  }
}

/**
 * Start a transaction for performance monitoring
 */
export function startTransaction(name: string, op: string): { finish: () => void } {
  const start = performance.now()

  return {
    finish: () => {
      const duration = performance.now() - start
      if (hasSentry) {
        console.log(`[Sentry] Transaction ${name} (${op}): ${duration.toFixed(2)}ms`)
      }
    },
  }
}

export default {
  initSentry,
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
  startTransaction,
}
