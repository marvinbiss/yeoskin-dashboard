'use client'

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

  // Fetch creator profile - direct query by user_id or email
  const fetchCreatorProfile = useCallback(async (authUser) => {
    if (!authUser?.id || !authUser?.email) {
      return null
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('creators')
        .select(`
          id, email, discount_code, commission_rate, status, user_id, tier_id,
          tier:commission_tiers(id, name, display_name, color, commission_rate)
        `)
        .or(`user_id.eq.${authUser.id},email.ilike.${authUser.email}`)
        .limit(1)
        .maybeSingle()

      if (fetchError) {
        console.error('Error fetching creator:', fetchError.message)
        return null
      }

      return data ? { ...data, found: true } : null
    } catch (err) {
      console.error('Creator fetch error:', err.message)
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
      setUser(null)
      setSession(null)
      setCreator(null)
      await supabase.auth.signOut({ scope: 'global' })
      return { error: null }
    } catch (error) {
      // Even if signOut API fails, clear local state
      setUser(null)
      setSession(null)
      setCreator(null)
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
