'use client'

import { useCallback, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { analytics, trackClick, trackFormSubmit, trackSearch, trackFeatureUsage } from '@/lib/analytics'

// ============================================================================
// PAGE VIEW TRACKING
// ============================================================================

/**
 * Hook to automatically track page views
 */
export function usePageTracking() {
  const pathname = usePathname()
  const previousPath = useRef<string | null>(null)

  useEffect(() => {
    if (pathname && pathname !== previousPath.current) {
      const title = typeof document !== 'undefined' ? document.title : pathname
      analytics.pageView(pathname, title)
      previousPath.current = pathname
    }
  }, [pathname])
}

// ============================================================================
// EVENT TRACKING
// ============================================================================

/**
 * Hook for tracking events
 */
export function useTrackEvent() {
  const trackEvent = useCallback(
    (
      eventName: string,
      options?: {
        category?: string
        action?: string
        label?: string
        value?: number
        metadata?: Record<string, unknown>
      }
    ) => {
      analytics.track(eventName, options || {})
    },
    []
  )

  return trackEvent
}

/**
 * Hook for tracking clicks
 */
export function useTrackClick() {
  return useCallback((elementName: string, metadata?: Record<string, unknown>) => {
    trackClick(elementName, metadata)
  }, [])
}

/**
 * Hook for tracking form submissions
 */
export function useTrackForm() {
  return useCallback((formName: string, success: boolean) => {
    trackFormSubmit(formName, success)
  }, [])
}

/**
 * Hook for tracking searches
 */
export function useTrackSearch() {
  return useCallback((query: string, resultsCount: number) => {
    trackSearch(query, resultsCount)
  }, [])
}

/**
 * Hook for tracking feature usage
 */
export function useTrackFeature() {
  return useCallback((featureName: string, action: string) => {
    trackFeatureUsage(featureName, action)
  }, [])
}

// ============================================================================
// USER FLOW TRACKING
// ============================================================================

/**
 * Hook for tracking user flows
 */
export function useUserFlow(flowName: string) {
  const started = useRef(false)
  const currentStep = useRef(0)

  const startFlow = useCallback(
    (initialStep: string = 'start') => {
      if (!started.current) {
        analytics.startFlow(flowName, initialStep)
        started.current = true
        currentStep.current = 0
      }
    },
    [flowName]
  )

  const nextStep = useCallback(
    (stepName: string) => {
      if (started.current) {
        currentStep.current += 1
        analytics.flowStep(flowName, stepName, currentStep.current)
      }
    },
    [flowName]
  )

  const completeFlow = useCallback(
    (success: boolean = true) => {
      if (started.current) {
        analytics.completeFlow(flowName, success)
        started.current = false
        currentStep.current = 0
      }
    },
    [flowName]
  )

  const abandonFlow = useCallback(() => {
    completeFlow(false)
  }, [completeFlow])

  return {
    startFlow,
    nextStep,
    completeFlow,
    abandonFlow,
    currentStep: currentStep.current,
    isActive: started.current,
  }
}

// ============================================================================
// TIMING TRACKING
// ============================================================================

/**
 * Hook for tracking timing/performance
 */
export function useTiming(category: string) {
  const startTime = useRef<number | null>(null)

  const start = useCallback(() => {
    startTime.current = performance.now()
  }, [])

  const end = useCallback(
    (variable: string, label?: string) => {
      if (startTime.current !== null) {
        const duration = performance.now() - startTime.current
        analytics.trackTiming(category, variable, duration, label)
        startTime.current = null
        return duration
      }
      return 0
    },
    [category]
  )

  return { start, end }
}

// ============================================================================
// ERROR TRACKING
// ============================================================================

/**
 * Hook for error tracking
 */
export function useErrorTracking() {
  const trackError = useCallback((error: Error, context?: Record<string, unknown>) => {
    analytics.trackError(error, context)
  }, [])

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      trackError(event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      })
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        { type: 'unhandledRejection' }
      )
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [trackError])

  return trackError
}

// ============================================================================
// SCROLL DEPTH TRACKING
// ============================================================================

/**
 * Hook for tracking scroll depth
 */
export function useScrollDepthTracking() {
  const trackedDepths = useRef<Set<number>>(new Set())

  useEffect(() => {
    const depths = [25, 50, 75, 100]

    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0

      depths.forEach((depth) => {
        if (scrollPercent >= depth && !trackedDepths.current.has(depth)) {
          trackedDepths.current.add(depth)
          analytics.track('scroll_depth', {
            category: 'engagement',
            action: 'scroll',
            label: `${depth}%`,
            value: depth,
          })
        }
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
}

// ============================================================================
// SESSION TRACKING
// ============================================================================

/**
 * Hook for session duration tracking
 */
export function useSessionTracking() {
  const sessionStart = useRef(Date.now())

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const duration = Date.now() - sessionStart.current
        analytics.trackTiming('session', 'duration', duration)
      }
    }

    const handleBeforeUnload = () => {
      const duration = Date.now() - sessionStart.current
      analytics.trackTiming('session', 'duration', duration)
      analytics.flush()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])
}

// ============================================================================
// USER IDENTIFICATION
// ============================================================================

/**
 * Hook for user identification
 */
export function useIdentify() {
  return useCallback(
    (properties: { userId?: string; role?: string; creatorId?: string }) => {
      analytics.identify(properties)
    },
    []
  )
}
