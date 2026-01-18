import { useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Hook for creator authentication operations
 * Use this for sign-in forms and auth-related actions
 * For accessing auth state, use useCreatorAuth from context
 */
export const useCreatorAuthActions = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Sign in with email and password
  const signIn = useCallback(async (email, password) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (authError) {
        setError(authError.message)
        return { success: false, error: authError.message }
      }

      // Try to link creator profile
      if (data.user) {
        await supabase.rpc('link_creator_to_user', {
          p_user_id: data.user.id,
          p_email: email.trim().toLowerCase()
        })
      }

      return { success: true, user: data.user }
    } catch (err) {
      const message = err.message || 'Une erreur est survenue'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [])

  // Sign out
  const signOut = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { error: authError } = await supabase.auth.signOut()

      if (authError) {
        setError(authError.message)
        return { success: false, error: authError.message }
      }

      return { success: true }
    } catch (err) {
      const message = err.message || 'Une erreur est survenue'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [])

  // Request password reset
  const requestPasswordReset = useCallback(async (email) => {
    setLoading(true)
    setError(null)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/creator/reset-password` }
      )

      if (resetError) {
        setError(resetError.message)
        return { success: false, error: resetError.message }
      }

      return { success: true }
    } catch (err) {
      const message = err.message || 'Une erreur est survenue'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    signIn,
    signOut,
    requestPasswordReset,
    clearError: () => setError(null),
  }
}
