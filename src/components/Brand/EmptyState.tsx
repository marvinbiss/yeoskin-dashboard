/**
 * Premium Empty State Component
 * Stripe/Nike level empty states
 */

import React from 'react'
import { clsx } from 'clsx'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeStyles = {
  sm: {
    container: 'py-8',
    icon: 'w-12 h-12',
    title: 'text-lg',
    description: 'text-sm',
  },
  md: {
    container: 'py-12',
    icon: 'w-16 h-16',
    title: 'text-xl',
    description: 'text-base',
  },
  lg: {
    container: 'py-16',
    icon: 'w-20 h-20',
    title: 'text-2xl',
    description: 'text-base',
  },
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
  className,
}: EmptyStateProps) {
  const styles = sizeStyles[size]

  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center text-center',
        styles.container,
        className
      )}
    >
      {icon && (
        <div
          className={clsx(
            'flex items-center justify-center mb-4',
            'bg-neutral-100 rounded-2xl p-4',
            'text-neutral-400'
          )}
        >
          <div className={styles.icon}>{icon}</div>
        </div>
      )}
      <h3
        className={clsx(
          'font-semibold text-neutral-900 mb-2',
          styles.title
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={clsx(
            'text-neutral-500 max-w-sm mb-6',
            styles.description
          )}
        >
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {action && (
            <Button onClick={action.onClick} leftIcon={action.icon}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// Preset empty states
export function NoResults({
  searchQuery,
  onClear,
}: {
  searchQuery?: string
  onClear?: () => void
}) {
  return (
    <EmptyState
      icon={
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="w-full h-full"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
      }
      title="No results found"
      description={
        searchQuery
          ? `We couldn't find anything matching "${searchQuery}". Try adjusting your search.`
          : 'Try adjusting your filters or search terms.'
      }
      secondaryAction={
        onClear
          ? {
              label: 'Clear search',
              onClick: onClear,
            }
          : undefined
      }
    />
  )
}

export function NoData({
  title = 'No data yet',
  description = "When you have data, it will appear here.",
  action,
}: {
  title?: string
  description?: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <EmptyState
      icon={
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="w-full h-full"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
          />
        </svg>
      }
      title={title}
      description={description}
      action={action}
    />
  )
}

export function ErrorState({
  title = 'Something went wrong',
  description = "We're having trouble loading this content. Please try again.",
  onRetry,
}: {
  title?: string
  description?: string
  onRetry?: () => void
}) {
  return (
    <EmptyState
      icon={
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="w-full h-full text-error-400"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      }
      title={title}
      description={description}
      action={
        onRetry
          ? {
              label: 'Try again',
              onClick: onRetry,
            }
          : undefined
      }
    />
  )
}

export default EmptyState
