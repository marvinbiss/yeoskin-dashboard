import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Spinner } from '../Common'
import { ShieldX } from 'lucide-react'

/**
 * Loading screen component
 */
const LoadingScreen = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <Spinner size="lg" />
      <p className="mt-4 text-gray-500 dark:text-gray-400">
        Vérification de la session...
      </p>
    </div>
  </div>
)

/**
 * Unauthorized access screen
 */
const UnauthorizedScreen = ({ requiredRole }) => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
    <div className="text-center max-w-md">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-danger-50 dark:bg-danger-500/20 mb-4">
        <ShieldX className="w-8 h-8 text-danger-600 dark:text-danger-400" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Accès refusé
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        {requiredRole && (
          <span className="block mt-2 text-sm">
            Rôle requis : <span className="font-medium text-gray-700 dark:text-gray-300">{requiredRole}</span>
          </span>
        )}
      </p>
      <a
        href="/"
        className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
      >
        Retour au tableau de bord
      </a>
    </div>
  </div>
)

/**
 * Protected Route Component
 * Protects routes by requiring authentication and optionally a specific role
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string} [props.requiredRole] - Required role to access this route (super_admin, admin, viewer)
 */
export const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, loading, hasRole } = useAuth()
  const location = useLocation()

  // Show loading screen while checking session
  if (loading) {
    return <LoadingScreen />
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check role if required
  if (requiredRole && !hasRole(requiredRole)) {
    return <UnauthorizedScreen requiredRole={requiredRole} />
  }

  return children
}
