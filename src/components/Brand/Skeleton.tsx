/**
 * Premium Skeleton Loading Components
 * Stripe/Nike level loading states
 */

import React from 'react'
import { clsx } from 'clsx'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'shimmer' | 'none'
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  animation = 'shimmer',
}: SkeletonProps) {
  const baseStyles = 'bg-neutral-200'

  const variantStyles = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
  }

  const animationStyles = {
    pulse: 'animate-pulse',
    shimmer: 'animate-shimmer bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%]',
    none: '',
  }

  const style: React.CSSProperties = {
    width: width,
    height: height || (variant === 'text' ? '1em' : undefined),
  }

  return (
    <span
      className={clsx(
        'block',
        baseStyles,
        variantStyles[variant],
        animationStyles[animation],
        className
      )}
      style={style}
    />
  )
}

// Preset skeleton components
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={clsx('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className="h-4"
          width={i === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  )
}

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return <Skeleton variant="circular" width={size} height={size} />
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={clsx('bg-white rounded-2xl border border-neutral-100 p-6', className)}>
      <div className="flex items-center gap-4 mb-6">
        <SkeletonAvatar size={48} />
        <div className="flex-1">
          <Skeleton variant="text" className="h-5 mb-2" width="50%" />
          <Skeleton variant="text" className="h-4" width="30%" />
        </div>
      </div>
      <SkeletonText lines={3} />
      <div className="flex gap-3 mt-6">
        <Skeleton variant="rounded" className="h-10" width={100} />
        <Skeleton variant="rounded" className="h-10" width={80} />
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-neutral-100 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="px-6 py-4 border-b border-neutral-50 flex gap-4 items-center"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              variant="text"
              className="h-4 flex-1"
              width={colIndex === 0 ? '70%' : '100%'}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-neutral-100 p-6">
          <Skeleton variant="text" className="h-4 mb-3" width="60%" />
          <Skeleton variant="text" className="h-8 mb-2" width="80%" />
          <Skeleton variant="text" className="h-3" width="40%" />
        </div>
      ))}
    </div>
  )
}

export default Skeleton
