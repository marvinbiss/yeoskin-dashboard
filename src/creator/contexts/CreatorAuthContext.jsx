import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
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
  const initRef = useRef(false)

  // Fetch creator profile by user_id or email (non-blocking, with timeout)
  const fetchCreatorProfile = useCallback(async (authUser) => {
    if (!authUser) {
      setCreator(null)
      return null
    }

    try {
      // First try by user_id (fast path)
      let { data, error } = await supabase
        .from('creators')
        .select('id, email, discount_code, commission_rate, status, user_id')
        .eq('user_id', authUser.id)
        .maybeSingle()

      // If not found by user_id, try by email
      if (!data && !error) {
        const emailResult = await supabase
          .from('creators')
          .select('id, email, discount_code, commission_rate, status, user_id')
          .eq('email', authUser.email.toLowerCase())
          .maybeSingle()

        data = emailResult.data
        error = emailResult.error
      }

      if (error) {
        console.warn('Error fetching creator:', error.message)
        setCreator(null)
        return null
      }

      if (data) {
        const creatorData = { ...data, found: true }
        setCreator(creatorData)
        return creatorData
      }

      setCreator(null)
      return null
    } catch (err) {
      console.warn('Creator fetch failed:', err.message)
      setCreator(null)
      return null
    }
  }, [])

  // Initialize session - runs once
  useEffect(() => {
    // Prevent double initialization in strict mode
    if (initRef.current) return
    initRef.current = true

    let mounted = true

    const initSession = async () => {
      // Set a hard timeout to ensure loading stops
      const loadingTimeout = setTimeout(() => {
        if (mounted) {
          console.warn('Auth init timeout - forcing loading to false')
          setLoading(false)
          setInitialized(true)
        }
      }, 3000)

      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) {
          console.error('Session error:', error)
        } else {
          setSession(currentSession)
          setUser(currentSession?.user ?? null)

          // Fetch creator profile in background (don't await)
          if (currentSession?.user) {
            fetchCreatorProfile(currentSession.user)
          }
        }
      } catch (error) {
        console.error('Init error:', error)
      } finally {
        clearTimeout(loadingTimeout)
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
          // Fetch in background, don't block
          fetchCreatorProfile(newSession.user)
        }

        if (event === 'SIGNED_OUT') {
          setCreator(null)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // Empty deps - only run once

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
