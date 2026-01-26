'use client'

import { RefreshCw } from 'lucide-react'

/**
 * Subtle refresh indicator that shows when data is being revalidated
 * Shows only during background refreshes, not initial loads
 */
export const RefreshIndicator = ({ refreshing, className = '' }) => {
  if (!refreshing) return null

  return (
    <div className={`inline-flex items-center gap-1.5 text-xs text-gray-400 ${className}`}>
      <RefreshCw className="w-3 h-3 animate-spin" />
      <span>Mise à jour...</span>
    </div>
  )
}

/**
 * Card with built-in refresh indicator
 */
export const RefreshingCard = ({ children, refreshing, title, className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      {refreshing && (
        <div className="absolute top-2 right-2 z-10">
          <RefreshIndicator refreshing={refreshing} />
        </div>
      )}
      {children}
    </div>
  )
}

/**
 * Page-level refresh indicator (top bar)
 */
export const PageRefreshIndicator = ({ refreshing }) => {
  if (!refreshing) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-primary-100 overflow-hidden">
      <div className="h-full bg-primary-500 animate-progress-bar" />
    </div>
  )
}

export default RefreshIndicator
