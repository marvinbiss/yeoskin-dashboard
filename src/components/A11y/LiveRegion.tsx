'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react'

/**
 * Live Region for Screen Reader Announcements
 *
 * Implements ARIA live regions for dynamic content announcements.
 * WCAG 2.1 Success Criterion 4.1.3.
 */

type Politeness = 'polite' | 'assertive' | 'off'

interface Announcement {
  id: number
  message: string
  politeness: Politeness
}

interface LiveRegionContextValue {
  announce: (message: string, politeness?: Politeness) => void
  announcePolite: (message: string) => void
  announceAssertive: (message: string) => void
}

const LiveRegionContext = createContext<LiveRegionContextValue | null>(null)

/**
 * Hook to access live region announcements
 */
export function useLiveRegion() {
  const context = useContext(LiveRegionContext)
  if (!context) {
    throw new Error('useLiveRegion must be used within a LiveRegionProvider')
  }
  return context
}

/**
 * Live Region Provider
 *
 * Wrap your app with this to enable screen reader announcements.
 */
export function LiveRegionProvider({ children }: { children: ReactNode }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const idCounter = useRef(0)

  const announce = useCallback((message: string, politeness: Politeness = 'polite') => {
    const id = ++idCounter.current
    setAnnouncements((prev) => [...prev, { id, message, politeness }])

    // Clear announcement after delay
    setTimeout(() => {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id))
    }, 5000)
  }, [])

  const announcePolite = useCallback((message: string) => {
    announce(message, 'polite')
  }, [announce])

  const announceAssertive = useCallback((message: string) => {
    announce(message, 'assertive')
  }, [announce])

  const value: LiveRegionContextValue = {
    announce,
    announcePolite,
    announceAssertive,
  }

  return (
    <LiveRegionContext.Provider value={value}>
      {children}

      {/* Polite live region */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {announcements
          .filter((a) => a.politeness === 'polite')
          .map((a) => (
            <p key={a.id}>{a.message}</p>
          ))}
      </div>

      {/* Assertive live region */}
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        role="alert"
      >
        {announcements
          .filter((a) => a.politeness === 'assertive')
          .map((a) => (
            <p key={a.id}>{a.message}</p>
          ))}
      </div>
    </LiveRegionContext.Provider>
  )
}

/**
 * Visually Hidden Component
 *
 * Content that is hidden visually but accessible to screen readers.
 */
export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>
}

/**
 * Screen Reader Only Text
 *
 * Alias for VisuallyHidden with different semantics.
 */
export function SrOnly({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>
}

export default LiveRegionProvider
