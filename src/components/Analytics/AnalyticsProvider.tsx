'use client'

import { createContext, useContext, useEffect, ReactNode } from 'react'
import {
  usePageTracking,
  useErrorTracking,
  useSessionTracking,
  useIdentify,
} from '@/hooks/useAnalytics'
import { analytics } from '@/lib/analytics'

// ============================================================================
// CONTEXT
// ============================================================================

interface AnalyticsContextValue {
  identify: ReturnType<typeof useIdentify>
  trackEvent: (name: string, options?: Record<string, unknown>) => void
  trackClick: (element: string, metadata?: Record<string, unknown>) => void
  trackFormSubmit: (formName: string, success: boolean) => void
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null)

/**
 * Hook to access analytics functions
 */
export function useAnalytics() {
  const context = useContext(AnalyticsContext)
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider')
  }
  return context
}

// ============================================================================
// PROVIDER
// ============================================================================

interface AnalyticsProviderProps {
  children: ReactNode
}

/**
 * Analytics Provider
 *
 * Wraps the app to provide analytics tracking functionality.
 * Automatically tracks page views, errors, and session duration.
 */
export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  // Auto-track page views
  usePageTracking()

  // Auto-track errors
  useErrorTracking()

  // Auto-track session
  useSessionTracking()

  // User identification
  const identify = useIdentify()

  // Track event helper
  const trackEvent = (name: string, options?: Record<string, unknown>) => {
    analytics.track(name, options || {})
  }

  // Track click helper
  const trackClick = (element: string, metadata?: Record<string, unknown>) => {
    analytics.track('click', {
      category: 'interaction',
      action: 'click',
      label: element,
      metadata,
    })
  }

  // Track form submit helper
  const trackFormSubmit = (formName: string, success: boolean) => {
    analytics.track('form_submit', {
      category: 'form',
      action: success ? 'success' : 'error',
      label: formName,
    })
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      analytics.flush()
    }
  }, [])

  const value: AnalyticsContextValue = {
    identify,
    trackEvent,
    trackClick,
    trackFormSubmit,
  }

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export default AnalyticsProvider
