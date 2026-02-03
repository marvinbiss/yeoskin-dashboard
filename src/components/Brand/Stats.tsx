/**
 * Premium Stats Card Component
 * Stripe/Nike level metric displays
 */

import React from 'react'
import { clsx } from 'clsx'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease' | 'neutral'
    period?: string
  }
  icon?: React.ReactNode
  variant?: 'default' | 'brand' | 'success' | 'warning'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const variantStyles = {
  default: {
    icon: 'bg-neutral-100 text-neutral-600',
    value: 'text-neutral-900',
  },
  brand: {
    icon: 'bg-brand-100 text-brand-600',
    value: 'text-brand-600',
  },
  success: {
    icon: 'bg-mint-100 text-mint-600',
    value: 'text-mint-600',
  },
  warning: {
    icon: 'bg-warning-100 text-warning-600',
    value: 'text-warning-600',
  },
}

const sizeStyles = {
  sm: {
    container: 'p-4',
    icon: 'w-10 h-10',
    label: 'text-xs',
    value: 'text-xl',
    change: 'text-xs',
  },
  md: {
    container: 'p-6',
    icon: 'w-12 h-12',
    label: 'text-sm',
    value: 'text-2xl',
    change: 'text-sm',
  },
  lg: {
    container: 'p-8',
    icon: 'w-14 h-14',
    label: 'text-sm',
    value: 'text-3xl',
    change: 'text-sm',
  },
}

export function StatCard({
  label,
  value,
  change,
  icon,
  variant = 'default',
  size = 'md',
  className,
}: StatCardProps) {
  const variantStyle = variantStyles[variant]
  const sizeStyle = sizeStyles[size]

  const changeColors = {
    increase: 'text-mint-600',
    decrease: 'text-error-600',
    neutral: 'text-neutral-500',
  }

  const ChangeIcon = {
    increase: TrendingUp,
    decrease: TrendingDown,
    neutral: Minus,
  }

  return (
    <div
      className={clsx(
        'bg-white rounded-2xl border border-neutral-100',
        'shadow-soft-sm hover:shadow-soft-md transition-shadow duration-200',
        sizeStyle.container,
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <span
          className={clsx(
            'font-medium text-neutral-500',
            sizeStyle.label
          )}
        >
          {label}
        </span>
        {icon && (
          <div
            className={clsx(
              'rounded-xl flex items-center justify-center',
              sizeStyle.icon,
              variantStyle.icon
            )}
          >
            {icon}
          </div>
        )}
      </div>
      <div
        className={clsx(
          'font-bold tracking-tight',
          sizeStyle.value,
          variantStyle.value
        )}
      >
        {value}
      </div>
      {change && (
        <div
          className={clsx(
            'flex items-center gap-1 mt-2',
            sizeStyle.change,
            changeColors[change.type]
          )}
        >
          {React.createElement(ChangeIcon[change.type], {
            className: 'w-4 h-4',
          })}
          <span className="font-medium">
            {change.type === 'increase' && '+'}
            {change.value}%
          </span>
          {change.period && (
            <span className="text-neutral-400">vs {change.period}</span>
          )}
        </div>
      )}
    </div>
  )
}

// Stats Grid
interface StatsGridProps {
  children: React.ReactNode
  columns?: 2 | 3 | 4
  className?: string
}

export function StatsGrid({
  children,
  columns = 4,
  className,
}: StatsGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div className={clsx('grid gap-4', gridCols[columns], className)}>
      {children}
    </div>
  )
}

// Inline Stat for compact displays
interface InlineStatProps {
  label: string
  value: string | number
  suffix?: string
  className?: string
}

export function InlineStat({
  label,
  value,
  suffix,
  className,
}: InlineStatProps) {
  return (
    <div className={clsx('flex items-baseline gap-2', className)}>
      <span className="text-2xl font-bold text-neutral-900">{value}</span>
      {suffix && <span className="text-sm text-neutral-500">{suffix}</span>}
      <span className="text-sm text-neutral-400">{label}</span>
    </div>
  )
}

export default StatCard
