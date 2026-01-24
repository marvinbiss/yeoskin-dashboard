'use client'

import { Navigate, useLocation, useNavigate } from '@/lib/navigation'
import { useCreatorAuth } from '../contexts/CreatorAuthContext'
import { Loader2, UserX } from 'lucide-react'

/**
 * Loading screen while checking auth
 */
const LoadingScreen = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="w-10 h-10 animate-spin text-primary-600 mx-auto" />
      <p className="mt-4 text-gray-500 dark:text-gray-400">
        Verification de la session...
      </p>
    </div>
  </div>
)

/**
 * Screen shown when user is authenticated but not linked to a creator profile
 */
const NotLinkedScreen = ({ onLogout, userEmail }) => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
    <div className="text-center max-w-md">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-50 dark:bg-yellow-900/20 mb-4">
        <UserX className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Compte non associe
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-2">
        Votre compte ({userEmail}) n'est pas associe a un profil createur.
      </p>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Veuillez contacter le support pour activer votre acces.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href="mailto:support@yeoskin.com"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
        >
          Contacter le support
        </a>
        <button
          onClick={onLogout}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Se deconnecter
        </button>
      </div>
    </div>
  </div>
)

/**
 * Protected route for creator pages
 * Requires authenticated user with linked creator profile
 */
export const CreatorProtectedRoute = ({ children }) => {
  const { isAuthenticated, isCreator, loading, signOut, user } = useCreatorAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    window.location.href = '/creator/login'
  }

  // Show loading while checking auth
  if (loading) {
    return <LoadingScreen />
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/creator/login" state={{ from: location }} replace />
  }

  // Show not linked screen if authenticated but no creator profile
  if (!isCreator) {
    return <NotLinkedScreen onLogout={handleLogout} userEmail={user?.email} />
  }

  return children
}
