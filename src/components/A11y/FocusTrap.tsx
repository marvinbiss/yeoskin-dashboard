'use client'

import { useEffect, useRef, ReactNode, KeyboardEvent } from 'react'

/**
 * Focus Trap Component
 *
 * Traps focus within a container, useful for modals and dialogs.
 * Implements WCAG 2.1 Success Criterion 2.4.3.
 */
interface FocusTrapProps {
  /** Content to trap focus within */
  children: ReactNode
  /** Whether the focus trap is active */
  active?: boolean
  /** Callback when escape is pressed */
  onEscape?: () => void
  /** Auto-focus first focusable element */
  autoFocus?: boolean
  /** Restore focus to trigger element on unmount */
  restoreFocus?: boolean
}

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ')

export function FocusTrap({
  children,
  active = true,
  onEscape,
  autoFocus = true,
  restoreFocus = true,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Store the previously focused element
  useEffect(() => {
    if (active && restoreFocus) {
      previousActiveElement.current = document.activeElement as HTMLElement
    }

    return () => {
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
    }
  }, [active, restoreFocus])

  // Auto-focus first focusable element
  useEffect(() => {
    if (active && autoFocus && containerRef.current) {
      const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
      if (focusableElements.length > 0) {
        focusableElements[0].focus()
      }
    }
  }, [active, autoFocus])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!active) return

    // Handle Escape
    if (event.key === 'Escape' && onEscape) {
      event.preventDefault()
      onEscape()
      return
    }

    // Handle Tab for focus trapping
    if (event.key === 'Tab' && containerRef.current) {
      const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
      const firstFocusable = focusableElements[0]
      const lastFocusable = focusableElements[focusableElements.length - 1]

      if (!firstFocusable) return

      if (event.shiftKey) {
        // Shift + Tab: Move to last element if on first
        if (document.activeElement === firstFocusable) {
          event.preventDefault()
          lastFocusable.focus()
        }
      } else {
        // Tab: Move to first element if on last
        if (document.activeElement === lastFocusable) {
          event.preventDefault()
          firstFocusable.focus()
        }
      }
    }
  }

  return (
    <div ref={containerRef} onKeyDown={handleKeyDown}>
      {children}
    </div>
  )
}

export default FocusTrap
