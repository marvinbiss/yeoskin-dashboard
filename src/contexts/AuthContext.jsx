'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { ADMIN_ROLES, hasRequiredRole } from '../lib/adminValidation'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [adminProfile, setAdminProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Charger le profil admin
  const fetchAdminProfile = useCallback(async (userId) => {
    if (!userId) {
      setAdminProfile(null)
      return null
    }

    try {
      const { data, error } = await supabase
        .from('admin_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.warn('[Auth] Erreur profil admin:', error.message)
        setAdminProfile(null)
        return null
      }

      setAdminProfile(data)
      return data
    } catch (error) {
      console.error('[Auth] Erreur fetchAdminProfile:', error)
      setAdminProfile(null)
      return null
    }
  }, [])

  // Initialiser la session
  useEffect(() => {
    let mounted = true

    console.log('[Auth] Initialisation...')

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('[Auth] Event:', event, 'Session:', !!newSession)

        if (!mounted) return

        if (newSession) {
          setSession(newSession)
          setUser(newSession.user)
          // Fetch profile in background, don't block
          fetchAdminProfile(newSession.user.id)
        } else {
          setSession(null)
          setUser(null)
          setAdminProfile(null)
        }

        setLoading(false)
      }
    )

    // Récupérer la session initiale
    supabase.auth.getSession().then(({ data: { session: currentSession }, error }) => {
      console.log('[Auth] getSession:', !!currentSession, 'Error:', error?.message)

      if (!mounted) return

      if (error) {
        console.error('[Auth] Erreur getSession:', error)
        setLoading(false)
        return
      }

      if (currentSession) {
        setSession(currentSession)
        setUser(currentSession.user)
        fetchAdminProfile(currentSession.user.id)
      }

      setLoading(false)
    }).catch(err => {
      console.error('[Auth] Catch getSession:', err)
      if (mounted) setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchAdminProfile])

  // Connexion
  const signIn = useCallback(async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) throw error

      // La mise à jour se fera via onAuthStateChange
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }, [])

  // Déconnexion
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error }
    }
  }, [])

  // Helpers
  const getUserDisplayName = useCallback(() => {
    if (!user) return null
    return adminProfile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur'
  }, [user, adminProfile])

  const getUserEmail = useCallback(() => user?.email || null, [user])

  const getUserInitials = useCallback(() => {
    const name = getUserDisplayName()
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.charAt(0).toUpperCase()
  }, [getUserDisplayName])

  const getUserRole = useCallback(() => {
    if (!adminProfile) return null
    if (!adminProfile.is_active) return null
    return adminProfile.role
  }, [adminProfile])

  const hasRole = useCallback((requiredRole) => {
    const role = getUserRole()
    if (!role) return false
    return hasRequiredRole(role, requiredRole)
  }, [getUserRole])

  const isAuthorizedAdmin = !!adminProfile && adminProfile.is_active
  const isAdmin = useCallback(() => hasRole(ADMIN_ROLES.ADMIN), [hasRole])
  const isSuperAdmin = useCallback(() => getUserRole() === ADMIN_ROLES.SUPER_ADMIN, [getUserRole])
  const isViewer = useCallback(() => getUserRole() === ADMIN_ROLES.VIEWER, [getUserRole])

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchAdminProfile(user.id)
    }
  }, [user, fetchAdminProfile])

  const value = {
    user,
    session,
    adminProfile,
    loading,
    signIn,
    signOut,
    getUserDisplayName,
    getUserEmail,
    getUserInitials,
    getUserRole,
    hasRole,
    isAuthorizedAdmin,
    isAdmin,
    isSuperAdmin,
    isViewer,
    refreshProfile,
    isAuthenticated: !!session,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
