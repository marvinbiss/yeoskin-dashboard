'use client'

/**
 * Skeleton loading components for Creator Dashboard
 */

export const SkeletonPulse = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
)

export const SkeletonBalanceCard = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
    <div className="flex items-center justify-between mb-4">
      <SkeletonPulse className="h-5 w-24" />
      <SkeletonPulse className="h-8 w-8 rounded-lg" />
    </div>
    <SkeletonPulse className="h-10 w-32 mb-2" />
    <SkeletonPulse className="h-4 w-40" />
  </div>
)

export const SkeletonForecastCard = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
    <div className="flex items-center justify-between mb-4">
      <SkeletonPulse className="h-5 w-32" />
      <SkeletonPulse className="h-8 w-8 rounded-lg" />
    </div>
    <div className="space-y-3">
      <div className="flex justify-between">
        <SkeletonPulse className="h-4 w-20" />
        <SkeletonPulse className="h-4 w-16" />
      </div>
      <div className="flex justify-between">
        <SkeletonPulse className="h-4 w-24" />
        <SkeletonPulse className="h-4 w-16" />
      </div>
      <div className="flex justify-between">
        <SkeletonPulse className="h-4 w-20" />
        <SkeletonPulse className="h-4 w-16" />
      </div>
    </div>
  </div>
)

export const SkeletonTierCard = () => (
  <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
    <div className="flex items-center gap-4">
      <SkeletonPulse className="w-16 h-16 rounded-full" />
      <div className="flex-1">
        <SkeletonPulse className="h-6 w-24 mb-2" />
        <SkeletonPulse className="h-4 w-32" />
      </div>
      <SkeletonPulse className="h-10 w-20 rounded-lg" />
    </div>
  </div>
)

export const SkeletonRoutineCard = () => (
  <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl p-4 sm:p-6 border border-violet-200 dark:border-violet-800">
    <div className="flex items-center gap-3 mb-3">
      <SkeletonPulse className="w-10 h-10 rounded-lg" />
      <div>
        <SkeletonPulse className="h-5 w-24 mb-1" />
        <SkeletonPulse className="h-4 w-32" />
      </div>
    </div>
    <SkeletonPulse className="h-6 w-48 mb-4" />
    <div className="flex gap-3">
      <SkeletonPulse className="h-10 w-36 rounded-lg" />
      <SkeletonPulse className="h-10 w-28 rounded-lg" />
    </div>
  </div>
)

export const SkeletonStatCard = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
    <SkeletonPulse className="h-4 w-16 mb-2" />
    <SkeletonPulse className="h-6 w-12" />
  </div>
)

export const SkeletonActivityItem = () => (
  <div className="flex items-center gap-3 p-3">
    <SkeletonPulse className="w-10 h-10 rounded-full" />
    <div className="flex-1">
      <SkeletonPulse className="h-4 w-48 mb-1" />
      <SkeletonPulse className="h-3 w-24" />
    </div>
    <SkeletonPulse className="h-5 w-16" />
  </div>
)

export const SkeletonActivityFeed = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <SkeletonPulse className="h-5 w-32" />
    </div>
    <div className="divide-y divide-gray-100 dark:divide-gray-700">
      {[1, 2, 3, 4].map((i) => (
        <SkeletonActivityItem key={i} />
      ))}
    </div>
  </div>
)

export const SkeletonDashboard = () => (
  <div className="space-y-4 sm:space-y-6 animate-fade-in">
    {/* Tier Card */}
    <SkeletonTierCard />

    {/* Routine Card */}
    <SkeletonRoutineCard />

    {/* Balance and Forecast */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <SkeletonBalanceCard />
      <SkeletonForecastCard />
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <SkeletonStatCard key={i} />
      ))}
    </div>

    {/* Activity Feed */}
    <SkeletonActivityFeed />
  </div>
)

export default SkeletonDashboard
