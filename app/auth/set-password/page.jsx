'use client'

import { useState, useEffect, useCallback } from 'react'
import { Eye, EyeOff, AlertCircle, Loader2, CheckCircle } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

// Client Supabase isolé pour cette page uniquement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
  },
})

export default function SetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [hasValidSession, setHasValidSession] = useState(false)

  // Initialiser : détecter le token dans l'URL hash et établir la session
  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      // Vérifier si c'est un lien de recovery via le hash
      const hash = window.location.hash
      const isRecoveryLink = hash.includes('type=recovery') || hash.includes('type=invite')

      // Écouter les changements d'auth (le token dans le hash sera détecté automatiquement)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (!mounted) return
        console.log('[SetPassword] Auth event:', event)
        // Accepter PASSWORD_RECOVERY, SIGNED_IN (pour invite), ou session existante avec lien recovery
        if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || (session && isRecoveryLink)) {
          setHasValidSession(true)
          setInitializing(false)
        }
      })

      // Attendre un court instant pour que le hash soit traité
      await new Promise(resolve => setTimeout(resolve, 1500))

      if (!mounted) return

      // Vérifier si une session a été établie ET si c'est un lien recovery/invite
      const { data: { session } } = await supabase.auth.getSession()
      if (session && isRecoveryLink) {
        setHasValidSession(true)
      }
      setInitializing(false)

      return () => {
        mounted = false
        subscription.unsubscribe()
      }
    }

    initialize()

    return () => { mounted = false }
  }, [])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setLoading(true)

    try {
      // Vérifier la session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Session expirée ou invalide. Demandez un nouveau lien d\'invitation à votre administrateur.')
        setLoading(false)
        return
      }

      // Mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }

      // Lier le créateur au user_id si pas encore fait
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        await supabase
          .from('creators')
          .update({ user_id: user.id })
          .eq('email', user.email.toLowerCase())
          .is('user_id', null)
      }

      setSuccess(true)

      // Rediriger vers le dashboard créateur après 2s
      setTimeout(() => {
        window.location.href = '/c/creator'
      }, 2000)
    } catch (err) {
      setError(err.message || 'Une erreur est survenue')
      setLoading(false)
    }
  }, [password, confirmPassword])

  // Phase d'initialisation : traitement du token
  if (initializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
          <p className="mt-4 text-gray-600">Vérification de votre lien...</p>
        </div>
      </div>
    )
  }

  // Pas de session valide
  if (!hasValidSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Lien expiré ou invalide</h2>
          <p className="text-gray-500 mb-6">
            Ce lien n'est plus valide. Contactez votre administrateur pour recevoir un nouveau lien d'invitation.
          </p>
          <a
            href="mailto:contact@yeoskin.com"
            className="inline-block px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            Contacter le support
          </a>
        </div>
      </div>
    )
  }

  // Succès
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Mot de passe défini !</h2>
          <p className="text-gray-500">Redirection vers votre espace créateur...</p>
        </div>
      </div>
    )
  }

  // Formulaire
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-purple-600">Yeoskin</h1>
          <p className="text-gray-600 mt-2">Bienvenue dans l'équipe !</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Créez votre mot de passe</h2>
            <p className="text-gray-500 mt-1">Ce mot de passe vous servira à accéder à votre espace créateur</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le mot de passe
              </label>
              <input
                id="confirm"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retapez votre mot de passe"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {loading ? 'Enregistrement...' : 'Créer mon mot de passe'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          &copy; {new Date().getFullYear()} Yeoskin. Tous droits réservés.
        </p>
      </div>
    </div>
  )
}
