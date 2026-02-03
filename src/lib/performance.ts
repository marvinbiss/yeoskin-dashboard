/**
 * Performance Monitoring & Optimization Utilities
 *
 * Provides tools for measuring and improving application performance.
 */

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

export interface PerformanceMetrics {
  fcp?: number  // First Contentful Paint
  lcp?: number  // Largest Contentful Paint
  fid?: number  // First Input Delay
  cls?: number  // Cumulative Layout Shift
  ttfb?: number // Time to First Byte
}

/**
 * Collect Core Web Vitals metrics
 */
export function collectWebVitals(callback: (metrics: PerformanceMetrics) => void): void {
  if (typeof window === 'undefined') return

  const metrics: PerformanceMetrics = {}

  // First Contentful Paint
  const paintEntries = performance.getEntriesByType('paint')
  const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint')
  if (fcpEntry) {
    metrics.fcp = fcpEntry.startTime
  }

  // Largest Contentful Paint
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        const lastEntry = entries[entries.length - 1]
        metrics.lcp = lastEntry.startTime
        callback(metrics)
      })
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
    } catch (e) {
      // LCP not supported
    }

    // First Input Delay
    try {
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        entries.forEach((entry: any) => {
          metrics.fid = entry.processingStart - entry.startTime
          callback(metrics)
        })
      })
      fidObserver.observe({ type: 'first-input', buffered: true })
    } catch (e) {
      // FID not supported
    }

    // Cumulative Layout Shift
    try {
      let clsValue = 0
      const clsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
            metrics.cls = clsValue
            callback(metrics)
          }
        })
      })
      clsObserver.observe({ type: 'layout-shift', buffered: true })
    } catch (e) {
      // CLS not supported
    }
  }

  // Time to First Byte
  const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
  if (navEntry) {
    metrics.ttfb = navEntry.responseStart - navEntry.requestStart
  }

  // Initial callback
  setTimeout(() => callback(metrics), 0)
}

// ============================================================================
// DEBOUNCE & THROTTLE
// ============================================================================

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

// ============================================================================
// MEMOIZATION
// ============================================================================

/**
 * Simple memoization for expensive computations
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: { maxSize?: number } = {}
): T {
  const { maxSize = 100 } = options
  const cache = new Map<string, ReturnType<T>>()

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args)

    if (cache.has(key)) {
      return cache.get(key)!
    }

    const result = fn(...args)

    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value
      if (firstKey !== undefined) {
        cache.delete(firstKey)
      }
    }

    cache.set(key, result)
    return result
  }) as T
}

// ============================================================================
// REQUEST IDLE CALLBACK POLYFILL
// ============================================================================

type IdleCallback = (deadline: IdleDeadline) => void

interface IdleDeadline {
  didTimeout: boolean
  timeRemaining: () => number
}

/**
 * Schedule work during idle periods
 */
export function scheduleIdleWork(callback: IdleCallback, timeout = 1000): void {
  if (typeof window === 'undefined') {
    setTimeout(() => {
      callback({
        didTimeout: true,
        timeRemaining: () => 0,
      })
    }, 0)
    return
  }

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(callback, { timeout })
  } else {
    setTimeout(() => {
      const start = Date.now()
      callback({
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
      })
    }, 1)
  }
}

// ============================================================================
// RESOURCE HINTS
// ============================================================================

/**
 * Add DNS prefetch hint
 */
export function dnsPrefetch(hostname: string): void {
  if (typeof document === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'dns-prefetch'
  link.href = hostname
  document.head.appendChild(link)
}

/**
 * Add preconnect hint
 */
export function preconnect(url: string, crossOrigin = true): void {
  if (typeof document === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'preconnect'
  link.href = url
  if (crossOrigin) {
    link.crossOrigin = 'anonymous'
  }
  document.head.appendChild(link)
}

/**
 * Preload a resource
 */
export function preload(url: string, as: string): void {
  if (typeof document === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = url
  link.as = as
  document.head.appendChild(link)
}

// ============================================================================
// BUNDLE SIZE TRACKING
// ============================================================================

/**
 * Log component render for debugging
 */
export function logRender(componentName: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Render] ${componentName}`, new Date().toISOString())
  }
}

/**
 * Measure async operation duration
 */
export async function measureAsync<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  const start = performance.now()
  try {
    const result = await operation()
    const duration = performance.now() - start
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`)
    }
    return result
  } catch (error) {
    const duration = performance.now() - start
    if (process.env.NODE_ENV === 'development') {
      console.error(`[Performance] ${name} failed after ${duration.toFixed(2)}ms`)
    }
    throw error
  }
}
