'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// ============================================================================
// FOCUS MANAGEMENT
// ============================================================================

/**
 * Hook to manage focus within a container
 */
export function useFocusWithin() {
  const [hasFocusWithin, setHasFocusWithin] = useState(false)
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleFocusIn = () => setHasFocusWithin(true)
    const handleFocusOut = (e: FocusEvent) => {
      if (!container.contains(e.relatedTarget as Node)) {
        setHasFocusWithin(false)
      }
    }

    container.addEventListener('focusin', handleFocusIn)
    container.addEventListener('focusout', handleFocusOut)

    return () => {
      container.removeEventListener('focusin', handleFocusIn)
      container.removeEventListener('focusout', handleFocusOut)
    }
  }, [])

  return { ref: containerRef, hasFocusWithin }
}

/**
 * Hook to return focus to a specific element
 */
export function useReturnFocus(shouldReturn = true) {
  const returnToRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (shouldReturn) {
      returnToRef.current = document.activeElement as HTMLElement
    }

    return () => {
      if (shouldReturn && returnToRef.current) {
        returnToRef.current.focus()
      }
    }
  }, [shouldReturn])

  return returnToRef
}

// ============================================================================
// KEYBOARD NAVIGATION
// ============================================================================

/**
 * Hook for roving tabindex pattern
 * Used for toolbars, menus, and other composite widgets
 */
export function useRovingTabIndex<T extends HTMLElement>(
  items: T[],
  options: {
    orientation?: 'horizontal' | 'vertical' | 'both'
    loop?: boolean
  } = {}
) {
  const { orientation = 'horizontal', loop = true } = options
  const [focusedIndex, setFocusedIndex] = useState(0)

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const { key } = event
      const count = items.length

      let nextIndex = focusedIndex

      const isHorizontal = orientation === 'horizontal' || orientation === 'both'
      const isVertical = orientation === 'vertical' || orientation === 'both'

      switch (key) {
        case 'ArrowRight':
          if (isHorizontal) {
            event.preventDefault()
            nextIndex = loop
              ? (focusedIndex + 1) % count
              : Math.min(focusedIndex + 1, count - 1)
          }
          break
        case 'ArrowLeft':
          if (isHorizontal) {
            event.preventDefault()
            nextIndex = loop
              ? (focusedIndex - 1 + count) % count
              : Math.max(focusedIndex - 1, 0)
          }
          break
        case 'ArrowDown':
          if (isVertical) {
            event.preventDefault()
            nextIndex = loop
              ? (focusedIndex + 1) % count
              : Math.min(focusedIndex + 1, count - 1)
          }
          break
        case 'ArrowUp':
          if (isVertical) {
            event.preventDefault()
            nextIndex = loop
              ? (focusedIndex - 1 + count) % count
              : Math.max(focusedIndex - 1, 0)
          }
          break
        case 'Home':
          event.preventDefault()
          nextIndex = 0
          break
        case 'End':
          event.preventDefault()
          nextIndex = count - 1
          break
      }

      if (nextIndex !== focusedIndex) {
        setFocusedIndex(nextIndex)
        items[nextIndex]?.focus()
      }
    },
    [focusedIndex, items, loop, orientation]
  )

  return {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown,
    getTabIndex: (index: number) => (index === focusedIndex ? 0 : -1),
  }
}

// ============================================================================
// REDUCED MOTION
// ============================================================================

/**
 * Hook to detect reduced motion preference
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

// ============================================================================
// HIGH CONTRAST
// ============================================================================

/**
 * Hook to detect high contrast mode preference
 */
export function usePrefersHighContrast(): boolean {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: more)')
    setPrefersHighContrast(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersHighContrast(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersHighContrast
}

// ============================================================================
// ARIA UTILITIES
// ============================================================================

/**
 * Generate unique IDs for ARIA relationships
 */
let idCounter = 0
export function useId(prefix = 'yeoskin'): string {
  const idRef = useRef<string | null>(null)

  if (idRef.current === null) {
    idRef.current = `${prefix}-${++idCounter}`
  }

  return idRef.current
}

/**
 * Hook to announce content to screen readers
 */
export function useAnnounce() {
  const announce = useCallback((message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    const liveRegion = document.querySelector(`[aria-live="${politeness}"]`)

    if (liveRegion) {
      liveRegion.textContent = message
      // Clear after delay
      setTimeout(() => {
        liveRegion.textContent = ''
      }, 1000)
    } else {
      // Fallback: create temporary live region
      const tempRegion = document.createElement('div')
      tempRegion.setAttribute('aria-live', politeness)
      tempRegion.setAttribute('aria-atomic', 'true')
      tempRegion.className = 'sr-only'
      tempRegion.textContent = message
      document.body.appendChild(tempRegion)

      setTimeout(() => {
        document.body.removeChild(tempRegion)
      }, 1000)
    }
  }, [])

  return announce
}

// ============================================================================
// FOCUS VISIBLE
// ============================================================================

/**
 * Hook to track focus-visible state
 */
export function useFocusVisible(): boolean {
  const [isFocusVisible, setIsFocusVisible] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsFocusVisible(true)
      }
    }

    const handleMouseDown = () => {
      setIsFocusVisible(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  return isFocusVisible
}

// ============================================================================
// ESCAPE KEY HANDLER
// ============================================================================

/**
 * Hook to handle Escape key press
 */
export function useEscapeKey(callback: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        callback()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [callback, enabled])
}
