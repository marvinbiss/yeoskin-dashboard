/**
 * Premium Card Component
 * Stripe/Nike level design system
 */

import React from 'react'
import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost'
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10',
}

const variantStyles = {
  default: 'bg-white border border-neutral-100 shadow-card',
  elevated: 'bg-white shadow-soft-lg',
  outlined: 'bg-white border border-neutral-200',
  ghost: 'bg-neutral-50/50',
}

export function Card({
  children,
  className,
  hover = false,
  padding = 'md',
  variant = 'default',
}: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-2xl',
        variantStyles[variant],
        paddingStyles[padding],
        hover && 'transition-shadow duration-300 hover:shadow-card-hover',
        className
      )}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

export function CardHeader({ title, subtitle, action, className }: CardHeaderProps) {
  return (
    <div className={clsx('flex items-start justify-between', className)}>
      <div>
        <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
        {subtitle && (
          <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0 ml-4">{action}</div>}
    </div>
  )
}

interface CardContentProps {
  children: React.ReactNode
  className?: string
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={clsx('mt-4', className)}>{children}</div>
}

interface CardFooterProps {
  children: React.ReactNode
  className?: string
  border?: boolean
}

export function CardFooter({ children, className, border = true }: CardFooterProps) {
  return (
    <div
      className={clsx(
        'mt-6 flex items-center',
        border && 'pt-6 border-t border-neutral-100',
        className
      )}
    >
      {children}
    </div>
  )
}

export default Card
