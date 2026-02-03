'use client'

/**
 * Premium Skeleton loading components
 * Brand-consistent loading states with shimmer animation
 */

import clsx from 'clsx'

// Base skeleton with shimmer animation
export const Skeleton = ({ className = '', variant = 'default' }) => {
  const variants = {
    default: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
  }

  return (
    <div
      className={clsx(
        'bg-neutral-200 animate-shimmer',
        'bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200',
        'bg-[length:200%_100%]',
        variants[variant],
        className
      )}
    />
  )
}

// Text line skeleton
export const SkeletonText = ({ width = 'w-full', height = 'h-4', lines = 1, className }) => (
  <div className={clsx('space-y-3', className)}>
    {[...Array(lines)].map((_, i) => (
      <Skeleton
        key={i}
        className={clsx(height, i === lines - 1 && lines > 1 ? 'w-3/5' : width)}
      />
    ))}
  </div>
)

// Circle skeleton (for avatars)
export const SkeletonCircle = ({ size = 'w-10 h-10' }) => (
  <Skeleton variant="circular" className={size} />
)

// Card skeleton
export const SkeletonCard = ({ children, className = '' }) => (
  <div className={clsx(
    'bg-white rounded-2xl shadow-soft-sm border border-neutral-100 p-6',
    className
  )}>
    {children}
  </div>
)

// KPI Card skeleton - Premium stat card loading
export const SkeletonKPICard = () => (
  <SkeletonCard>
    <div className="flex items-center justify-between mb-4">
      <Skeleton variant="rounded" className="w-12 h-12" />
      <Skeleton className="w-16 h-5 rounded-full" />
    </div>
    <Skeleton className="w-24 h-8 mb-2" />
    <Skeleton className="w-32 h-4" />
  </SkeletonCard>
)

// Table row skeleton
export const SkeletonTableRow = ({ columns = 5 }) => (
  <tr className="border-b border-neutral-50">
    {[...Array(columns)].map((_, i) => (
      <td key={i} className="px-6 py-4">
        <Skeleton className="h-4 w-full max-w-[120px]" />
      </td>
    ))}
  </tr>
)

// Table skeleton - Premium data table loading
export const SkeletonTable = ({ rows = 5, columns = 5 }) => (
  <div className="bg-white rounded-2xl shadow-soft-sm border border-neutral-100 overflow-hidden">
    {/* Header */}
    <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-100">
      <div className="flex gap-6">
        {[...Array(columns)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-20" />
        ))}
      </div>
    </div>
    {/* Rows */}
    <table className="w-full">
      <tbody>
        {[...Array(rows)].map((_, i) => (
          <SkeletonTableRow key={i} columns={columns} />
        ))}
      </tbody>
    </table>
  </div>
)

// Dashboard stats skeleton - Premium stats grid loading
export const SkeletonDashboardStats = ({ count = 4 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {[...Array(count)].map((_, i) => (
      <SkeletonKPICard key={i} />
    ))}
  </div>
)

// Chart skeleton - Premium chart loading
export const SkeletonChart = ({ height = 'h-64' }) => (
  <SkeletonCard className={height}>
    <Skeleton className="w-32 h-6 mb-6" />
    <div className="flex items-end justify-between gap-3 h-48">
      {[...Array(7)].map((_, i) => (
        <Skeleton
          key={i}
          variant="rounded"
          className="flex-1"
          style={{ height: `${Math.random() * 60 + 40}%` }}
        />
      ))}
    </div>
  </SkeletonCard>
)

// Activity feed skeleton
export const SkeletonActivityFeed = ({ items = 5 }) => (
  <SkeletonCard>
    <Skeleton className="w-40 h-6 mb-6" />
    <div className="space-y-5">
      {[...Array(items)].map((_, i) => (
        <div key={i} className="flex items-start gap-4">
          <SkeletonCircle size="w-10 h-10" />
          <div className="flex-1">
            <Skeleton className="w-3/4 h-4 mb-2" />
            <Skeleton className="w-1/2 h-3" />
          </div>
        </div>
      ))}
    </div>
  </SkeletonCard>
)

// Creator card skeleton
export const SkeletonCreatorCard = () => (
  <SkeletonCard>
    <div className="flex items-center gap-4 mb-6">
      <SkeletonCircle size="w-14 h-14" />
      <div className="flex-1">
        <Skeleton className="w-32 h-5 mb-2" />
        <Skeleton className="w-24 h-4" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Skeleton className="w-16 h-3 mb-2" />
        <Skeleton className="w-20 h-6" />
      </div>
      <div>
        <Skeleton className="w-16 h-3 mb-2" />
        <Skeleton className="w-20 h-6" />
      </div>
    </div>
  </SkeletonCard>
)

// List skeleton
export const SkeletonList = ({ items = 5 }) => (
  <div className="space-y-3">
    {[...Array(items)].map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-4 p-4 bg-white rounded-xl border border-neutral-100 shadow-soft-sm"
      >
        <SkeletonCircle size="w-12 h-12" />
        <div className="flex-1">
          <Skeleton className="w-3/4 h-4 mb-2" />
          <Skeleton className="w-1/2 h-3" />
        </div>
        <Skeleton variant="rounded" className="w-20 h-9" />
      </div>
    ))}
  </div>
)

// Modal skeleton
export const SkeletonModal = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-4 pb-6 border-b border-neutral-100">
      <SkeletonCircle size="w-16 h-16" />
      <div className="flex-1">
        <Skeleton className="w-48 h-6 mb-2" />
        <Skeleton className="w-32 h-4" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i}>
          <Skeleton className="w-20 h-3 mb-2" />
          <Skeleton variant="rounded" className="w-full h-11" />
        </div>
      ))}
    </div>
  </div>
)

// Batch card skeleton
export const SkeletonBatchCard = () => (
  <SkeletonCard>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-4">
        <Skeleton variant="rounded" className="w-12 h-12" />
        <div>
          <Skeleton className="w-24 h-5 mb-2" />
          <Skeleton className="w-32 h-4" />
        </div>
      </div>
      <Skeleton className="w-20 h-6 rounded-full" />
    </div>
    <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
      <Skeleton className="w-24 h-6" />
      <Skeleton variant="rounded" className="w-24 h-10" />
    </div>
  </SkeletonCard>
)

// Full page loading skeleton
export const SkeletonPage = () => (
  <div className="space-y-8">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div>
        <Skeleton className="w-48 h-8 mb-2" />
        <Skeleton className="w-64 h-4" />
      </div>
      <div className="flex gap-3">
        <Skeleton variant="rounded" className="w-28 h-10" />
        <Skeleton variant="rounded" className="w-28 h-10" />
      </div>
    </div>

    {/* Stats */}
    <SkeletonDashboardStats />

    {/* Content */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SkeletonChart />
      <SkeletonActivityFeed />
    </div>

    {/* Table */}
    <SkeletonTable rows={5} columns={6} />
  </div>
)

export default Skeleton
