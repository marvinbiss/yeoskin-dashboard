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

  // Link creator to user by email
  const linkCreatorByEmail = useCallback(async (userId, email) => {
    try {
      const { data, error } = await supabase.rpc('link_creator_to_user', {
        p_user_id: userId,
        p_email: email
      })

      if (error) {
        console.warn('Could not link creator:', error.message)
        return null
      }

      return data
    } catch (err) {
      console.error('Error linking creator:', err)
      return null
    }
  }, [])

  // Fetch creator profile
  const fetchCreatorProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_my_creator_profile')

      if (error) {
        console.warn('Error fetching creator profile:', error.message)
        setCreator(null)
        return null
      }

      if (data?.found) {
        setCreator(data)
        return data
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
          // Try to link creator if not already linked
          await linkCreatorByEmail(currentSession.user.id, currentSession.user.email)
          // Fetch creator profile
          await fetchCreatorProfile()
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
          await linkCreatorByEmail(newSession.user.id, newSession.user.email)
          await fetchCreatorProfile()
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
  }, [linkCreatorByEmail, fetchCreatorProfile])

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
    return await fetchCreatorProfile()
  }, [fetchCreatorProfile])

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
