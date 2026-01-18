import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

const CreatorAuthContext = createContext(null)

export const useCreatorAuth = () => {
  const context = useContext(CreatorAuthContext)
  if (!context) {
    throw new Error('useCreatorAuth must be used within a CreatorAuthProvider')
  }
  return context
}

export const CreatorAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [creator, setCreator] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // Fetch creator profile by user_id or email
  const fetchCreatorProfile = useCallback(async (authUser) => {
    if (!authUser) {
      setCreator(null)
      return null
    }

    try {
      // First try to find by user_id
      let { data, error } = await supabase
        .from('creators')
        .select('id, email, discount_code, commission_rate, status, user_id')
        .eq('user_id', authUser.id)
        .maybeSingle()

      if (error) {
        console.warn('Error fetching creator by user_id:', error.message)
      }

      // If not found by user_id, try by email and link
      if (!data) {
        const { data: emailData, error: emailError } = await supabase
          .from('creators')
          .select('id, email, discount_code, commission_rate, status, user_id')
          .eq('email', authUser.email.toLowerCase())
          .maybeSingle()

        if (emailError) {
          console.warn('Error fetching creator by email:', emailError.message)
        }

        if (emailData && !emailData.user_id) {
          // Link the creator to this auth user
          const { error: updateError } = await supabase
            .from('creators')
            .update({ user_id: authUser.id })
            .eq('id', emailData.id)

          if (!updateError) {
            data = { ...emailData, user_id: authUser.id }
          }
        } else {
          data = emailData
        }
      }

      if (data) {
        const creatorData = { ...data, found: true }
        setCreator(creatorData)
        return creatorData
      }

      setCreator(null)
      return null
    } catch (err) {
      console.error('Error in fetchCreatorProfile:', err)
      setCreator(null)
      return null
    }
  }, [])

  // Initialize session
  useEffect(() => {
    let mounted = true

    const initSession = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) {
          console.error('Session error:', error)
          setLoading(false)
          setInitialized(true)
          return
        }

        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        if (currentSession?.user) {
          // Fetch creator profile (will auto-link by email if needed)
          await fetchCreatorProfile(currentSession.user)
        }
      } catch (error) {
        console.error('Init error:', error)
      } finally {
        if (mounted) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    initSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return

        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (event === 'SIGNED_IN' && newSession?.user) {
          await fetchCreatorProfile(newSession.user)
        }

        if (event === 'SIGNED_OUT') {
          setCreator(null)
        }

        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchCreatorProfile])

  // Sign in
  const signIn = useCallback(async (email, password) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }, [])

  // Sign out
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      setSession(null)
      setCreator(null)

      return { error: null }
    } catch (error) {
      return { error }
    }
  }, [])

  // Refresh creator profile
  const refreshProfile = useCallback(async () => {
    if (user) {
      return await fetchCreatorProfile(user)
    }
    return null
  }, [fetchCreatorProfile, user])

  const value = {
    user,
    session,
    creator,
    loading,
    initialized,
    signIn,
    signOut,
    refreshProfile,
    isAuthenticated: !!session,
    isCreator: !!creator?.found,
    creatorId: creator?.id || null,
  }

  return (
    <CreatorAuthContext.Provider value={value}>
      {children}
    </CreatorAuthContext.Provider>
  )
}
