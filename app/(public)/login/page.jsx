import { Suspense } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import { LoginPage } from '@/views'

export const dynamic = 'force-dynamic'

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  )
}

export default function Login() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </Suspense>
  )
}
