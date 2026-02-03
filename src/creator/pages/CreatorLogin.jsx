'use client'

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from '@/lib/navigation'
import { Eye, EyeOff, AlertCircle, Loader2, Mail, Lock } from 'lucide-react'
import clsx from 'clsx'
import { useCreatorAuth } from '../contexts/CreatorAuthContext'
import { useCreatorAuthActions } from '../hooks/useCreatorAuth'

/**
 * Creator Login Page - Premium Brand Style
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
      <div className="min-h-screen bg-gradient-brand-subtle flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          <p className="text-neutral-500 text-sm">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-brand-subtle flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-lavender-200/30 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-brand-glow">
            <span className="text-white font-bold text-2xl">Y</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Yeoskin</h1>
          <p className="text-neutral-500 mt-1">Portail Créateurs</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-soft-xl p-8 border border-neutral-100">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-neutral-900">
              Bienvenue
            </h2>
            <p className="text-neutral-500 mt-1 text-sm">
              Connectez-vous à votre espace créateur
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className={clsx(
              'mb-6 p-4 rounded-xl flex items-start gap-3',
              'bg-error-50 border border-error-200'
            )}>
              <AlertCircle className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-error-700">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-neutral-700 mb-2"
              >
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-neutral-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  className={clsx(
                    'w-full pl-11 pr-4 py-3 rounded-xl border bg-white',
                    'text-neutral-900 placeholder-neutral-400',
                    'focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500',
                    'transition-all duration-200',
                    'border-neutral-200'
                  )}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-neutral-700 mb-2"
              >
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-neutral-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={clsx(
                    'w-full pl-11 pr-12 py-3 rounded-xl border bg-white',
                    'text-neutral-900 placeholder-neutral-400',
                    'focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500',
                    'transition-all duration-200',
                    'border-neutral-200'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
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
              className={clsx(
                'w-full py-3.5 px-4 rounded-xl font-medium',
                'flex items-center justify-center gap-2',
                'transition-all duration-200',
                'bg-brand-500 text-white',
                'hover:bg-brand-600 active:bg-brand-700',
                'disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed',
                'shadow-button hover:shadow-button-hover',
                'disabled:shadow-none'
              )}
            >
              {loading && (
                <Loader2 key="loader" className="w-5 h-5 animate-spin" />
              )}
              <span key="text">{loading ? 'Connexion...' : 'Se connecter'}</span>
            </button>
          </form>

          {/* Forgot password link */}
          <div className="mt-6 text-center">
            <a
              href="/auth/forgot-password"
              className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
            >
              Mot de passe oublié ?
            </a>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="text-xs text-neutral-400 uppercase">ou</span>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>

          {/* Help text */}
          <div className="text-center">
            <p className="text-sm text-neutral-500">
              Problème de connexion ?{' '}
              <a
                href="mailto:support@yeoskin.com"
                className="text-brand-600 hover:text-brand-700 font-medium transition-colors"
              >
                Contactez le support
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-neutral-400 mt-8">
          &copy; {new Date().getFullYear()} Yeoskin. Tous droits réservés.
        </p>
      </div>
    </div>
  )
}
