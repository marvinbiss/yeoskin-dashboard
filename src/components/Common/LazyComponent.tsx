'use client'

import { useEffect, useRef, useState, ReactNode } from 'react'
import { Skeleton } from '../Brand/Skeleton'

interface LazyComponentProps {
  children: ReactNode
  /** Placeholder to show before component is visible */
  placeholder?: ReactNode
  /** Root margin for intersection observer */
  rootMargin?: string
  /** Threshold for intersection observer */
  threshold?: number
  /** Minimum height for placeholder */
  minHeight?: number | string
  /** Whether to keep the component mounted after first view */
  keepMounted?: boolean
  /** Custom class name */
  className?: string
}

/**
 * LazyComponent - Renders children only when visible in viewport
 *
 * Uses IntersectionObserver for efficient lazy loading of heavy components.
 * Perfect for charts, tables, and other expensive renders below the fold.
 */
export function LazyComponent({
  children,
  placeholder,
  rootMargin = '200px',
  threshold = 0,
  minHeight = 200,
  keepMounted = true,
  className = '',
}: LazyComponentProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasBeenVisible, setHasBeenVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // If IntersectionObserver not supported, show immediately
    if (!('IntersectionObserver' in window)) {
      setIsVisible(true)
      setHasBeenVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            setHasBeenVisible(true)
            if (keepMounted) {
              observer.disconnect()
            }
          } else if (!keepMounted) {
            setIsVisible(false)
          }
        })
      },
      { rootMargin, threshold }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [rootMargin, threshold, keepMounted])

  const shouldRender = keepMounted ? hasBeenVisible : isVisible

  return (
    <div
      ref={ref}
      className={className}
      style={{ minHeight: !shouldRender ? minHeight : undefined }}
    >
      {shouldRender ? (
        children
      ) : (
        placeholder || (
          <div className="flex items-center justify-center h-full">
            <Skeleton className="w-full h-full min-h-[200px] rounded-xl" />
          </div>
        )
      )}
    </div>
  )
}

/**
 * LazyChart - Optimized wrapper for chart components
 */
export function LazyChart({
  children,
  height = 300,
  className = '',
}: {
  children: ReactNode
  height?: number
  className?: string
}) {
  return (
    <LazyComponent
      minHeight={height}
      className={className}
      placeholder={
        <div
          className="flex items-center justify-center bg-neutral-50 rounded-xl animate-pulse"
          style={{ height }}
        >
          <div className="text-neutral-400 text-sm">Chargement du graphique...</div>
        </div>
      }
    >
      {children}
    </LazyComponent>
  )
}

/**
 * LazyTable - Optimized wrapper for table components
 */
export function LazyTable({
  children,
  rows = 5,
  className = '',
}: {
  children: ReactNode
  rows?: number
  className?: string
}) {
  return (
    <LazyComponent
      minHeight={rows * 60}
      className={className}
      placeholder={
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      }
    >
      {children}
    </LazyComponent>
  )
}

export default LazyComponent
