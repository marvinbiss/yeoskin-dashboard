'use client'

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from '@/lib/navigation'
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import { useCreatorAuth } from '../contexts/CreatorAuthContext'
import { useCreatorAuthActions } from '../hooks/useCreatorAuth'

/**
 * Creator Login Page
 */
export const CreatorLogin = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isCreator, loading: authLoading } = useCreatorAuth()
  const { signIn, loading, error, clearError } = useCreatorAuthActions()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && isCreator) {
      const from = location.state?.from?.pathname || '/c/creator'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, isCreator, navigate, location])

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()

    const result = await signIn(email, password)
    if (result.success) {
      navigate('/c/creator', { replace: true })
    }
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <img src="https://cdn.shopify.com/s/files/1/0870/9573/8716/files/Copie_de_LogoOK_1.png?v=1742078138" alt="Yeoskin" className="h-12 w-auto mx-auto" />
          <p className="text-gray-600 dark:text-gray-400 mt-2">Portail Createurs</p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Connexion
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Accedez a votre espace createur
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeOff key="eye-off" className="w-5 h-5" />
                  ) : (
                    <Eye key="eye-on" className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading && (
                <Loader2 key="loader" className="w-5 h-5 animate-spin" />
              )}
              <span key="text">{loading ? 'Connexion...' : 'Se connecter'}</span>
            </button>
          </form>

          {/* Forgot password link */}
          <div className="mt-4 text-center">
            <a
              href="/auth/forgot-password"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Mot de passe oublié ?
            </a>
          </div>

          {/* Help text */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Probleme de connexion ?{' '}
              <a
                href="mailto:support@yeoskin.com"
                className="text-primary-600 hover:text-primary-700"
              >
                Contactez le support
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
          &copy; {new Date().getFullYear()} Yeoskin. Tous droits reserves.
        </p>
      </div>
    </div>
  )
}
