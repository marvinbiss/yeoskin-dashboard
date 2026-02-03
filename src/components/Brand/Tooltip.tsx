/**
 * Premium Tooltip Component
 * Stripe/Nike level tooltips
 */

import React, { useState, useRef, useEffect } from 'react'
import { clsx } from 'clsx'

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  position?: TooltipPosition
  delay?: number
  className?: string
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 200,
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  const arrowStyles = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-neutral-900',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-neutral-900',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-neutral-900',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-neutral-900',
  }

  const arrowBorderStyles = {
    top: 'border-t-4 border-x-4 border-x-transparent border-b-0',
    bottom: 'border-b-4 border-x-4 border-x-transparent border-t-0',
    left: 'border-l-4 border-y-4 border-y-transparent border-r-0',
    right: 'border-r-4 border-y-4 border-y-transparent border-l-0',
  }

  return (
    <div
      ref={triggerRef}
      className={clsx('relative inline-flex', className)}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div
          className={clsx(
            'absolute z-50 px-3 py-2 text-sm text-white bg-neutral-900 rounded-lg',
            'whitespace-nowrap shadow-soft-lg',
            'animate-fade-in',
            positionStyles[position]
          )}
          role="tooltip"
        >
          {content}
          <div
            className={clsx(
              'absolute w-0 h-0',
              arrowStyles[position],
              arrowBorderStyles[position]
            )}
          />
        </div>
      )}
    </div>
  )
}

export default Tooltip
