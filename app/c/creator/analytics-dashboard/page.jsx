'use client'

import dynamic from 'next/dynamic'

const CreatorAnalyticsDashboard = dynamic(
  () => import('@/creator/pages/CreatorAnalyticsDashboard'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    ),
  }
)

export default function CreatorAnalyticsDashboardPage() {
  return <CreatorAnalyticsDashboard />
}
