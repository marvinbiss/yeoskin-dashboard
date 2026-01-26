'use client'

/**
 * Skeleton loading components for smooth UX
 * These show placeholder content while data is loading
 */

// Base skeleton with animation
export const Skeleton = ({ className = '', animate = true }) => (
  <div
    className={`bg-gray-200 dark:bg-gray-700 rounded ${animate ? 'animate-pulse' : ''} ${className}`}
  />
)

// Text line skeleton
export const SkeletonText = ({ width = 'w-full', height = 'h-4' }) => (
  <Skeleton className={`${width} ${height}`} />
)

// Circle skeleton (for avatars)
export const SkeletonCircle = ({ size = 'w-10 h-10' }) => (
  <Skeleton className={`${size} rounded-full`} />
)

// Card skeleton
export const SkeletonCard = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 ${className}`}>
    {children}
  </div>
)

// KPI Card skeleton
export const SkeletonKPICard = () => (
  <SkeletonCard>
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="w-10 h-10 rounded-lg" />
      <Skeleton className="w-16 h-5 rounded" />
    </div>
    <Skeleton className="w-24 h-8 mb-2" />
    <Skeleton className="w-32 h-4" />
  </SkeletonCard>
)

// Table row skeleton
export const SkeletonTableRow = ({ columns = 5 }) => (
  <tr className="border-b border-gray-200 dark:border-gray-700">
    {[...Array(columns)].map((_, i) => (
      <td key={i} className="px-4 py-3">
        <Skeleton className="h-4 w-full max-w-[120px]" />
      </td>
    ))}
  </tr>
)

// Table skeleton
export const SkeletonTable = ({ rows = 5, columns = 5 }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
    {/* Header */}
    <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
      <div className="flex gap-4">
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

// Dashboard stats skeleton
export const SkeletonDashboardStats = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
    {[...Array(6)].map((_, i) => (
      <SkeletonKPICard key={i} />
    ))}
  </div>
)

// Chart skeleton
export const SkeletonChart = ({ height = 'h-64' }) => (
  <SkeletonCard className={height}>
    <Skeleton className="w-32 h-6 mb-4" />
    <div className="flex items-end justify-between gap-2 h-48">
      {[...Array(7)].map((_, i) => (
        <Skeleton
          key={i}
          className="flex-1 rounded-t"
          style={{ height: `${Math.random() * 60 + 40}%` }}
        />
      ))}
    </div>
  </SkeletonCard>
)

// Activity feed skeleton
export const SkeletonActivityFeed = ({ items = 5 }) => (
  <SkeletonCard>
    <Skeleton className="w-40 h-6 mb-4" />
    <div className="space-y-4">
      {[...Array(items)].map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <SkeletonCircle size="w-8 h-8" />
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
    <div className="flex items-center gap-4 mb-4">
      <SkeletonCircle size="w-12 h-12" />
      <div className="flex-1">
        <Skeleton className="w-32 h-5 mb-2" />
        <Skeleton className="w-24 h-4" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Skeleton className="w-16 h-3 mb-1" />
        <Skeleton className="w-20 h-5" />
      </div>
      <div>
        <Skeleton className="w-16 h-3 mb-1" />
        <Skeleton className="w-20 h-5" />
      </div>
    </div>
  </SkeletonCard>
)

// List skeleton
export const SkeletonList = ({ items = 5 }) => (
  <div className="space-y-3">
    {[...Array(items)].map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <SkeletonCircle size="w-10 h-10" />
        <div className="flex-1">
          <Skeleton className="w-3/4 h-4 mb-2" />
          <Skeleton className="w-1/2 h-3" />
        </div>
        <Skeleton className="w-16 h-8 rounded-lg" />
      </div>
    ))}
  </div>
)

// Modal skeleton
export const SkeletonModal = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
      <SkeletonCircle size="w-16 h-16" />
      <div className="flex-1">
        <Skeleton className="w-48 h-6 mb-2" />
        <Skeleton className="w-32 h-4" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i}>
          <Skeleton className="w-20 h-3 mb-2" />
          <Skeleton className="w-full h-10 rounded-lg" />
        </div>
      ))}
    </div>
  </div>
)

// Batch card skeleton
export const SkeletonBatchCard = () => (
  <SkeletonCard>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div>
          <Skeleton className="w-24 h-5 mb-1" />
          <Skeleton className="w-32 h-4" />
        </div>
      </div>
      <Skeleton className="w-20 h-6 rounded-full" />
    </div>
    <div className="flex items-center justify-between">
      <Skeleton className="w-24 h-6" />
      <Skeleton className="w-20 h-8 rounded-lg" />
    </div>
  </SkeletonCard>
)

// Full page loading skeleton
export const SkeletonPage = () => (
  <div className="space-y-6 animate-pulse">
    {/* Header */}
    <div className="flex items-center justify-between">
      <Skeleton className="w-48 h-8" />
      <div className="flex gap-2">
        <Skeleton className="w-24 h-10 rounded-lg" />
        <Skeleton className="w-24 h-10 rounded-lg" />
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
