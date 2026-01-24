import { Suspense } from 'react'
import CreatorProfileSettings from '@/creator/pages/CreatorProfileSettings'

// Force dynamic rendering to avoid useSearchParams SSR issues
export const dynamic = 'force-dynamic'

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  )
}

export default function CreatorMyPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CreatorProfileSettings />
    </Suspense>
  )
}
