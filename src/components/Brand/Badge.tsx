/**
 * Premium Badge Component
 * Stripe/Nike level design system
 */

import React from 'react'
import { clsx } from 'clsx'

type BadgeVariant = 'default' | 'brand' | 'success' | 'warning' | 'error' | 'info'
type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-neutral-100 text-neutral-700',
  brand: 'bg-brand-100 text-brand-700',
  success: 'bg-mint-100 text-mint-700',
  warning: 'bg-warning-100 text-warning-700',
  error: 'bg-error-100 text-error-700',
  info: 'bg-lavender-100 text-lavender-700',
}

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-neutral-500',
  brand: 'bg-brand-500',
  success: 'bg-mint-500',
  warning: 'bg-warning-500',
  error: 'bg-error-500',
  info: 'bg-lavender-500',
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-sm',
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full mr-1.5',
            dotColors[variant]
          )}
        />
      )}
      {children}
    </span>
  )
}

export default Badge
