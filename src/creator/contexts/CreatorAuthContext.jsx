import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

// Debug: Log Supabase connection info
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Supabase Key set:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)

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

  // Fetch creator profile - simple query
  const fetchCreatorProfile = useCallback(async (authUser) => {
    console.log('fetchCreatorProfile called with:', authUser?.id, authUser?.email)

    if (!authUser?.id || !authUser?.email) {
      console.log('No authUser, returning null')
      return null
    }

    try {
      // Try simple query first - just get all and filter
      console.log('Fetching all creators...')
      const { data: allCreators, error: allError } = await supabase
        .from('creators')
        .select('id, email, discount_code, commission_rate, status, user_id')

      console.log('All creators result:', allCreators?.length, 'error:', allError?.message)

      if (allError) {
        console.log('Error fetching creators:', allError.message)
        return null
      }

      // Find matching creator
      const userEmail = authUser.email.toLowerCase()
      const userId = authUser.id

      console.log('Looking for creator with user_id:', userId, 'or email:', userEmail)

      const found = allCreators?.find(c =>
        c.user_id === userId ||
        c.email?.toLowerCase() === userEmail
      )

      console.log('Found creator:', found)

      return found ? { ...found, found: true } : null
    } catch (err) {
      console.log('Creator fetch error:', err.message)
      return null
    }
  }, [])

  // Initialize on mount
  useEffect(() => {
    let isMounted = true

    const init = async () => {
      try {
        // Get current session
        const { data: { session: currentSession } } = await supabase.auth.getSession()

        if (!isMounted) return

        if (currentSession?.user) {
          setSession(currentSession)
          setUser(currentSession.user)

          // Fetch creator profile
          const creatorData = await fetchCreatorProfile(currentSession.user)
          if (isMounted) {
            setCreator(creatorData)
          }
        }
      } catch (err) {
        console.error('Init error:', err)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    // Hard timeout - ensure loading stops after 5 seconds
    const timeout = setTimeout(() => {
      if (isMounted) {
        setLoading(false)
      }
    }, 5000)

    init()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return

        console.log('Auth event:', event)

        if (event === 'SIGNED_IN' && newSession?.user) {
          setSession(newSession)
          setUser(newSession.user)

          // Fetch creator and update state
          const creatorData = await fetchCreatorProfile(newSession.user)
          if (isMounted) {
            setCreator(creatorData)
          }
        }

        if (event === 'SIGNED_OUT') {
          setSession(null)
          setUser(null)
          setCreator(null)
        }
      }
    )

    return () => {
      isMounted = false
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [fetchCreatorProfile])

  // Sign out
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
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
      const creatorData = await fetchCreatorProfile(user)
      setCreator(creatorData)
      return creatorData
    }
    return null
  }, [fetchCreatorProfile, user])

  const value = {
    user,
    session,
    creator,
    loading,
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
