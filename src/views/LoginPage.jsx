'use client'

import { useState } from 'react'
import { useNavigate, useLocation, useSearchParams } from '@/lib/navigation'
import { Mail, Lock, AlertCircle, Loader2, Shield } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../contexts/AuthContext'

export const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const searchParams = useSearchParams()

  const from = searchParams.get('from') || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await signIn(email, password)

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Email ou mot de passe incorrect')
        } else if (error.message.includes('Email not confirmed')) {
          setError('Veuillez confirmer votre email avant de vous connecter')
        } else {
          setError(error.message)
        }
        return
      }

      navigate(from, { replace: true })
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-lavender-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-brand-glow">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            Yeoskin Admin
          </h1>
          <p className="text-neutral-400 mt-2">
            Tableau de bord d'administration
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-soft-2xl p-8 border border-neutral-100">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-neutral-900">
              Connexion
            </h2>
            <p className="text-neutral-500 mt-1 text-sm">
              Accédez au panneau d'administration
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Message d'erreur */}
            {error && (
              <div className={clsx(
                'flex items-center gap-3 p-4 rounded-xl',
                'bg-error-50 border border-error-200'
              )}>
                <AlertCircle className="w-5 h-5 text-error-600 flex-shrink-0" />
                <span className="text-sm text-error-700">{error}</span>
              </div>
            )}

            {/* Champ Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-neutral-700 mb-2"
              >
                Adresse email
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
                  placeholder="admin@yeoskin.com"
                  required
                  disabled={loading}
                  autoComplete="email"
                  className={clsx(
                    'w-full pl-11 pr-4 py-3 rounded-xl border bg-white',
                    'text-neutral-900 placeholder-neutral-400',
                    'focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500',
                    'transition-all duration-200',
                    'border-neutral-200',
                    'disabled:bg-neutral-50 disabled:cursor-not-allowed'
                  )}
                />
              </div>
            </div>

            {/* Champ Mot de passe */}
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
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  className={clsx(
                    'w-full pl-11 pr-4 py-3 rounded-xl border bg-white',
                    'text-neutral-900 placeholder-neutral-400',
                    'focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500',
                    'transition-all duration-200',
                    'border-neutral-200',
                    'disabled:bg-neutral-50 disabled:cursor-not-allowed'
                  )}
                />
              </div>
            </div>

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={loading}
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

          {/* Forgot password */}
          <div className="mt-6 text-center">
            <a
              href="/auth/forgot-password"
              className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
            >
              Mot de passe oublié ?
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-neutral-500 mt-8">
          Yeoskin Operations Dashboard &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
