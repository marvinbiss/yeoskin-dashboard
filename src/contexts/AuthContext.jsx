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
  const [initialized, setInitialized] = useState(false)

  // Charger le profil admin depuis la base de données
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
        .maybeSingle() // Utiliser maybeSingle au lieu de single pour éviter l'erreur 406

      if (error) {
        console.warn('Erreur profil admin:', error.message)
        setAdminProfile(null)
        return null
      }

      if (data) {
        setAdminProfile(data)
        return data
      }

      // Pas de profil trouvé - créer un profil par défaut super_admin pour le premier utilisateur
      setAdminProfile(null)
      return null
    } catch (error) {
      console.error('Erreur fetchAdminProfile:', error)
      setAdminProfile(null)
      return null
    }
  }, [])

  // Initialiser la session au chargement
  useEffect(() => {
    let mounted = true

    const initSession = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) {
          console.error('Erreur session:', error)
          setLoading(false)
          setInitialized(true)
          return
        }

        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        if (currentSession?.user) {
          await fetchAdminProfile(currentSession.user.id)
        }
      } catch (error) {
        console.error('Erreur initialisation:', error)
      } finally {
        if (mounted) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    initSession()

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return

        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (event === 'SIGNED_IN' && newSession?.user) {
          await fetchAdminProfile(newSession.user.id)
        }

        if (event === 'SIGNED_OUT') {
          setAdminProfile(null)
        }

        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchAdminProfile])

  // Connexion
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

  // Déconnexion
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      setSession(null)
      setAdminProfile(null)

      return { error: null }
    } catch (error) {
      return { error }
    }
  }, [])

  // Helpers utilisateur
  const getUserDisplayName = useCallback(() => {
    if (!user) return null
    return adminProfile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur'
  }, [user, adminProfile])

  const getUserEmail = useCallback(() => {
    return user?.email || null
  }, [user])

  const getUserInitials = useCallback(() => {
    const name = getUserDisplayName()
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.charAt(0).toUpperCase()
  }, [getUserDisplayName])

  // Gestion des rôles - SUPER_ADMIN par défaut si pas de profil (mode développement)
  const getUserRole = useCallback(() => {
    if (adminProfile?.role) {
      return adminProfile.role
    }
    // Mode dev: donner super_admin à tout utilisateur connecté sans profil
    if (user) {
      return ADMIN_ROLES.SUPER_ADMIN
    }
    return ADMIN_ROLES.VIEWER
  }, [user, adminProfile])

  const hasRole = useCallback((requiredRole) => {
    const userRole = getUserRole()
    return hasRequiredRole(userRole, requiredRole)
  }, [getUserRole])

  const isAdmin = useCallback(() => {
    return hasRole(ADMIN_ROLES.ADMIN)
  }, [hasRole])

  const isSuperAdmin = useCallback(() => {
    return getUserRole() === ADMIN_ROLES.SUPER_ADMIN
  }, [getUserRole])

  const isViewer = useCallback(() => {
    return getUserRole() === ADMIN_ROLES.VIEWER
  }, [getUserRole])

  // Rafraîchir le profil
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
    initialized,
    signIn,
    signOut,
    getUserDisplayName,
    getUserEmail,
    getUserInitials,
    getUserRole,
    hasRole,
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
