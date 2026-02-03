/**
 * Analytics & Tracking Utilities
 *
 * Provides comprehensive tracking for user flows, events,
 * and performance monitoring.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface AnalyticsEvent {
  name: string
  category: string
  action: string
  label?: string
  value?: number
  metadata?: Record<string, unknown>
  timestamp: number
}

export interface PageView {
  path: string
  title: string
  referrer: string
  timestamp: number
  duration?: number
}

export interface UserProperties {
  userId?: string
  role?: string
  creatorId?: string
  sessionId: string
}

// ============================================================================
// ANALYTICS CONFIGURATION
// ============================================================================

interface AnalyticsConfig {
  debug: boolean
  sendToServer: boolean
  apiEndpoint: string
  batchSize: number
  flushInterval: number
}

const defaultConfig: AnalyticsConfig = {
  debug: process.env.NODE_ENV === 'development',
  sendToServer: process.env.NODE_ENV === 'production',
  apiEndpoint: '/api/analytics',
  batchSize: 10,
  flushInterval: 30000, // 30 seconds
}

// ============================================================================
// ANALYTICS CLASS
// ============================================================================

class Analytics {
  private config: AnalyticsConfig
  private eventQueue: AnalyticsEvent[] = []
  private pageViews: PageView[] = []
  private userProperties: UserProperties | null = null
  private sessionId: string
  private flushTimer: ReturnType<typeof setInterval> | null = null
  private currentPageStart: number = Date.now()

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
    this.sessionId = this.generateSessionId()
    this.startFlushTimer()
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private startFlushTimer(): void {
    if (typeof window === 'undefined') return

    this.flushTimer = setInterval(() => {
      this.flush()
    }, this.config.flushInterval)
  }

  // ============================================================================
  // USER IDENTIFICATION
  // ============================================================================

  identify(properties: Omit<UserProperties, 'sessionId'>): void {
    this.userProperties = {
      ...properties,
      sessionId: this.sessionId,
    }

    if (this.config.debug) {
      console.log('[Analytics] User identified:', this.userProperties)
    }
  }

  reset(): void {
    this.userProperties = null
    this.sessionId = this.generateSessionId()
    this.eventQueue = []
    this.pageViews = []
  }

  // ============================================================================
  // EVENT TRACKING
  // ============================================================================

  track(
    name: string,
    options: {
      category?: string
      action?: string
      label?: string
      value?: number
      metadata?: Record<string, unknown>
    } = {}
  ): void {
    const event: AnalyticsEvent = {
      name,
      category: options.category || 'general',
      action: options.action || name,
      label: options.label,
      value: options.value,
      metadata: {
        ...options.metadata,
        ...this.userProperties,
      },
      timestamp: Date.now(),
    }

    this.eventQueue.push(event)

    if (this.config.debug) {
      console.log('[Analytics] Event tracked:', event)
    }

    // Auto-flush if queue is full
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush()
    }
  }

  // ============================================================================
  // PAGE TRACKING
  // ============================================================================

  pageView(path: string, title: string): void {
    // Calculate duration of previous page
    if (this.pageViews.length > 0) {
      const lastPage = this.pageViews[this.pageViews.length - 1]
      lastPage.duration = Date.now() - this.currentPageStart
    }

    const pageView: PageView = {
      path,
      title,
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      timestamp: Date.now(),
    }

    this.pageViews.push(pageView)
    this.currentPageStart = Date.now()

    if (this.config.debug) {
      console.log('[Analytics] Page view:', pageView)
    }

    // Track as event too
    this.track('page_view', {
      category: 'navigation',
      action: 'view',
      label: path,
      metadata: { title, referrer: pageView.referrer },
    })
  }

  // ============================================================================
  // USER FLOW TRACKING
  // ============================================================================

  startFlow(flowName: string, stepName: string): void {
    this.track(`${flowName}_started`, {
      category: 'user_flow',
      action: 'start',
      label: stepName,
      metadata: { flowName, step: stepName },
    })
  }

  flowStep(flowName: string, stepName: string, stepNumber: number): void {
    this.track(`${flowName}_step`, {
      category: 'user_flow',
      action: 'step',
      label: stepName,
      value: stepNumber,
      metadata: { flowName, step: stepName, stepNumber },
    })
  }

  completeFlow(flowName: string, success: boolean): void {
    this.track(`${flowName}_completed`, {
      category: 'user_flow',
      action: success ? 'success' : 'failure',
      label: flowName,
      metadata: { flowName, success },
    })
  }

  // ============================================================================
  // ERROR TRACKING
  // ============================================================================

  trackError(error: Error, context?: Record<string, unknown>): void {
    this.track('error', {
      category: 'error',
      action: error.name,
      label: error.message,
      metadata: {
        stack: error.stack,
        ...context,
      },
    })
  }

  // ============================================================================
  // PERFORMANCE TRACKING
  // ============================================================================

  trackTiming(
    category: string,
    variable: string,
    timeMs: number,
    label?: string
  ): void {
    this.track('timing', {
      category: 'performance',
      action: variable,
      label: label || category,
      value: Math.round(timeMs),
      metadata: { category, variable, timeMs },
    })
  }

  // ============================================================================
  // E-COMMERCE TRACKING
  // ============================================================================

  trackTransaction(
    transactionId: string,
    amount: number,
    currency: string = 'EUR'
  ): void {
    this.track('transaction', {
      category: 'ecommerce',
      action: 'purchase',
      label: transactionId,
      value: Math.round(amount * 100), // Store in cents
      metadata: { transactionId, amount, currency },
    })
  }

  // ============================================================================
  // FLUSH & SEND
  // ============================================================================

  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return

    const eventsToSend = [...this.eventQueue]
    this.eventQueue = []

    if (this.config.sendToServer) {
      try {
        await fetch(this.config.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            events: eventsToSend,
            pageViews: this.pageViews,
            user: this.userProperties,
            sessionId: this.sessionId,
          }),
        })

        if (this.config.debug) {
          console.log('[Analytics] Flushed events:', eventsToSend.length)
        }
      } catch (error) {
        // Put events back in queue on failure
        this.eventQueue = [...eventsToSend, ...this.eventQueue]
        console.error('[Analytics] Failed to send events:', error)
      }
    }
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    this.flush()
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const analytics = new Analytics()

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Track a click event
 */
export function trackClick(elementName: string, metadata?: Record<string, unknown>): void {
  analytics.track('click', {
    category: 'interaction',
    action: 'click',
    label: elementName,
    metadata,
  })
}

/**
 * Track a form submission
 */
export function trackFormSubmit(formName: string, success: boolean): void {
  analytics.track('form_submit', {
    category: 'form',
    action: success ? 'success' : 'error',
    label: formName,
  })
}

/**
 * Track a search query
 */
export function trackSearch(query: string, resultsCount: number): void {
  analytics.track('search', {
    category: 'search',
    action: 'query',
    label: query,
    value: resultsCount,
  })
}

/**
 * Track feature usage
 */
export function trackFeatureUsage(featureName: string, action: string): void {
  analytics.track('feature_usage', {
    category: 'feature',
    action,
    label: featureName,
  })
}

export default analytics
