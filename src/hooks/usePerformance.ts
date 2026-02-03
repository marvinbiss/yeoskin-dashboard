'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { debounce, throttle, collectWebVitals, type PerformanceMetrics } from '@/lib/performance'

// ============================================================================
// DEBOUNCED VALUE HOOK
// ============================================================================

/**
 * Returns a debounced version of the value
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

// ============================================================================
// DEBOUNCED CALLBACK HOOK
// ============================================================================

/**
 * Returns a debounced version of the callback
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  return useMemo(
    () => debounce((...args: Parameters<T>) => callbackRef.current(...args), delay) as T,
    [delay]
  )
}

// ============================================================================
// THROTTLED CALLBACK HOOK
// ============================================================================

/**
 * Returns a throttled version of the callback
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  limit: number
): T {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  return useMemo(
    () => throttle((...args: Parameters<T>) => callbackRef.current(...args), limit) as T,
    [limit]
  )
}

// ============================================================================
// INTERSECTION OBSERVER HOOK
// ============================================================================

interface UseInViewOptions {
  root?: Element | null
  rootMargin?: string
  threshold?: number | number[]
  triggerOnce?: boolean
}

/**
 * Hook to detect when element is in viewport
 */
export function useInView(
  options: UseInViewOptions = {}
): [React.RefObject<HTMLDivElement | null>, boolean] {
  const { root = null, rootMargin = '0px', threshold = 0, triggerOnce = false } = options
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const triggered = useRef(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    if (triggerOnce && triggered.current) return

    if (!('IntersectionObserver' in window)) {
      setInView(true)
      triggered.current = true
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting
        setInView(isIntersecting)

        if (isIntersecting && triggerOnce) {
          triggered.current = true
          observer.disconnect()
        }
      },
      { root, rootMargin, threshold }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [root, rootMargin, threshold, triggerOnce])

  return [ref, inView]
}

// ============================================================================
// PERFORMANCE METRICS HOOK
// ============================================================================

/**
 * Hook to collect and monitor Web Vitals
 */
export function useWebVitals(): PerformanceMetrics {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({})

  useEffect(() => {
    collectWebVitals(setMetrics)
  }, [])

  return metrics
}

// ============================================================================
// PREVIOUS VALUE HOOK
// ============================================================================

/**
 * Hook to track previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>()

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

// ============================================================================
// STABLE CALLBACK HOOK
// ============================================================================

/**
 * Returns a stable callback reference
 */
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  })

  return useCallback(
    ((...args: Parameters<T>) => callbackRef.current(...args)) as T,
    []
  )
}

// ============================================================================
// MOUNT STATE HOOK
// ============================================================================

/**
 * Hook to track if component is mounted
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return mounted
}

// ============================================================================
// IDLE CALLBACK HOOK
// ============================================================================

/**
 * Execute callback during idle periods
 */
export function useIdleCallback(
  callback: () => void,
  options: { timeout?: number } = {}
): void {
  const { timeout = 1000 } = options
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (typeof window === 'undefined') return

    let handle: number | ReturnType<typeof setTimeout>

    const win = window as typeof window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
      cancelIdleCallback?: (id: number) => void
    }

    if (win.requestIdleCallback) {
      handle = win.requestIdleCallback(
        () => callbackRef.current(),
        { timeout }
      )
    } else {
      handle = setTimeout(callbackRef.current, 1)
    }

    return () => {
      if (win.cancelIdleCallback && typeof handle === 'number') {
        win.cancelIdleCallback(handle)
      } else {
        clearTimeout(handle as ReturnType<typeof setTimeout>)
      }
    }
  }, [timeout])
}

// ============================================================================
// RENDER COUNT HOOK (DEV ONLY)
// ============================================================================

/**
 * Track render count for debugging
 */
export function useRenderCount(componentName: string): number {
  const renderCount = useRef(0)
  renderCount.current += 1

  if (process.env.NODE_ENV === 'development') {
    console.log(`[${componentName}] Render count: ${renderCount.current}`)
  }

  return renderCount.current
}

// ============================================================================
// WINDOW SIZE HOOK (THROTTLED)
// ============================================================================

interface WindowSize {
  width: number
  height: number
}

/**
 * Hook to track window size with throttling
 */
export function useWindowSize(throttleMs = 100): WindowSize {
  const [size, setSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = throttle(() => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }, throttleMs)

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [throttleMs])

  return size
}
