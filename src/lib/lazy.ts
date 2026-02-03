/**
 * Lazy Loading Utilities
 *
 * Provides optimized dynamic imports for heavy components
 * to improve initial bundle size and load time.
 */

import dynamic from 'next/dynamic'
import { ComponentType, ReactNode } from 'react'

// ============================================================================
// LAZY LOADING CONFIG
// ============================================================================

interface LazyOptions {
  ssr?: boolean
  loading?: () => ReactNode
}

/**
 * Create a lazy-loaded component with Next.js dynamic import
 */
export function lazyLoad<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: LazyOptions = {}
) {
  return dynamic(importFn, {
    ssr: options.ssr ?? true,
    loading: options.loading,
  })
}

/**
 * Create a lazy-loaded component that only loads on client
 */
export function clientOnly<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  loading?: () => ReactNode
) {
  return dynamic(importFn, {
    ssr: false,
    loading,
  })
}

// ============================================================================
// PRELOAD UTILITIES
// ============================================================================

/**
 * Preload a component when user hovers or focuses on trigger
 */
export function preloadComponent(
  importFn: () => Promise<unknown>
): () => void {
  let loaded = false
  return () => {
    if (!loaded) {
      loaded = true
      importFn()
    }
  }
}

/**
 * Preload components after initial page load
 */
export function preloadOnIdle(
  importFns: Array<() => Promise<unknown>>
): void {
  if (typeof window === 'undefined') return

  const load = () => {
    importFns.forEach(fn => fn())
  }

  const win = window as typeof window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
  }

  if (win.requestIdleCallback) {
    win.requestIdleCallback(load, { timeout: 2000 })
  } else {
    setTimeout(load, 1000)
  }
}

// ============================================================================
// INTERSECTION OBSERVER LAZY LOADING
// ============================================================================

/**
 * Check if IntersectionObserver is available
 */
export const hasIntersectionObserver = typeof window !== 'undefined' && 'IntersectionObserver' in window

/**
 * Create observer options for lazy loading
 */
export const defaultObserverOptions: IntersectionObserverInit = {
  root: null,
  rootMargin: '200px', // Start loading 200px before visible
  threshold: 0,
}
