import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { validateAdminForm, sanitizeEmail, sanitizeName, ADMIN_ROLES } from '../lib/adminValidation'

/**
 * Hook pour gérer les utilisateurs admin
 * Fournit les opérations CRUD avec mises à jour en temps réel
 * Fixed: Race condition and memory leaks with proper cleanup
 */
export const useAdmins = (options = {}) => {
  const { limit = 50 } = options

  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Refs for preventing stale closures and memory leaks
  const mountedRef = useRef(true)
  const fetchAdminsRef = useRef(null)
  const subscriptionRef = useRef(null)

  /**
   * Récupérer tous les profils admin
   */
  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('admin_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (fetchError) {
        // Si la table n'existe pas, retourner une liste vide
        if (fetchError.code === '42P01') {
          console.warn('Table admin_profiles non trouvée')
          setAdmins([])
          return
        }
        throw fetchError
      }

      setAdmins(data || [])
    } catch (err) {
      console.error('Erreur fetch admins:', err)
      setError(err.message)
      setAdmins([])
    } finally {
      setLoading(false)
    }
  }, [limit])

  /**
   * Créer un nouvel admin
   */
  const createAdmin = useCallback(async (adminData) => {
    const { email, password, fullName, role } = adminData

    // Valider les données
    const validation = validateAdminForm({ email, password, fullName, role }, false)
    if (!validation.valid) {
      throw new Error(Object.values(validation.errors)[0])
    }

    setActionLoading(true)
    try {
      const cleanEmail = sanitizeEmail(email)
      const cleanName = sanitizeName(fullName)

      // Récupérer l'utilisateur courant
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      // Créer l'utilisateur auth
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            role: role,
          },
        },
      })

      if (signupError) throw signupError

      if (!authData.user) {
        throw new Error('Erreur lors de la création de l\'utilisateur')
      }

      // Créer le profil admin
      const { error: profileError } = await supabase
        .from('admin_profiles')
        .insert({
          id: authData.user.id,
          email: cleanEmail,
          full_name: cleanName,
          role: role,
          is_active: true,
          created_by: currentUser?.id || null,
        })

      if (profileError) {
        console.error('Erreur création profil:', profileError)
        throw new Error('Erreur lors de la création du profil admin')
      }

      await fetchAdmins()
      return { success: true, user: authData.user }
    } catch (err) {
      console.error('Erreur création admin:', err)
      throw err
    } finally {
      setActionLoading(false)
    }
  }, [fetchAdmins])

  /**
   * Mettre à jour un admin
   */
  const updateAdmin = useCallback(async (adminId, updates) => {
    if (!adminId) throw new Error('ID admin requis')

    setActionLoading(true)
    try {
      const updateData = {
        updated_at: new Date().toISOString(),
      }

      if (updates.fullName) updateData.full_name = sanitizeName(updates.fullName)
      if (updates.role) updateData.role = updates.role
      if (typeof updates.is_active === 'boolean') updateData.is_active = updates.is_active

      const { error: updateError } = await supabase
        .from('admin_profiles')
        .update(updateData)
        .eq('id', adminId)

      if (updateError) throw updateError

      await fetchAdmins()
      return { success: true }
    } catch (err) {
      console.error('Erreur mise à jour admin:', err)
      throw err
    } finally {
      setActionLoading(false)
    }
  }, [fetchAdmins])

  /**
   * Basculer le statut actif/inactif
   */
  const toggleAdminStatus = useCallback(async (adminId) => {
    if (!adminId) throw new Error('ID admin requis')

    setActionLoading(true)
    try {
      const admin = admins.find(a => a.id === adminId)
      if (!admin) throw new Error('Admin non trouvé')

      const { error: updateError } = await supabase
        .from('admin_profiles')
        .update({
          is_active: !admin.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', adminId)

      if (updateError) throw updateError

      await fetchAdmins()
      return { success: true, newStatus: !admin.is_active }
    } catch (err) {
      console.error('Erreur toggle statut:', err)
      throw err
    } finally {
      setActionLoading(false)
    }
  }, [admins, fetchAdmins])

  /**
   * Supprimer un admin (soft delete)
   */
  const deleteAdmin = useCallback(async (adminId) => {
    if (!adminId) throw new Error('ID admin requis')

    setActionLoading(true)
    try {
      const { error: updateError } = await supabase
        .from('admin_profiles')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', adminId)

      if (updateError) throw updateError

      await fetchAdmins()
      return { success: true }
    } catch (err) {
      console.error('Erreur suppression admin:', err)
      throw err
    } finally {
      setActionLoading(false)
    }
  }, [fetchAdmins])

  /**
   * Obtenir les statistiques
   */
  const getStats = useCallback(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return {
      total: admins.length,
      active: admins.filter(a => a.is_active).length,
      inactive: admins.filter(a => !a.is_active).length,
      superAdmins: admins.filter(a => a.role === ADMIN_ROLES.SUPER_ADMIN).length,
      admins: admins.filter(a => a.role === ADMIN_ROLES.ADMIN).length,
      viewers: admins.filter(a => a.role === ADMIN_ROLES.VIEWER).length,
      createdToday: admins.filter(a => new Date(a.created_at) >= today).length,
    }
  }, [admins])

  // Keep fetchAdmins ref updated to prevent stale closures
  useEffect(() => {
    fetchAdminsRef.current = fetchAdmins
  }, [fetchAdmins])

  // Chargement initial au montage
  useEffect(() => {
    mountedRef.current = true
    fetchAdmins()

    return () => {
      mountedRef.current = false
    }
  }, []) // Only run on mount

  // Abonnement realtime (separate effect to avoid recreation)
  useEffect(() => {
    // Clean up any existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
    }

    const channel = supabase
      .channel(`admin-profiles-changes-${Date.now()}`) // Unique channel name
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_profiles',
        },
        () => {
          // Use ref to avoid stale closure
          if (mountedRef.current) {
            fetchAdminsRef.current?.()
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('[useAdmins] Subscription error:', err)
        } else if (status === 'SUBSCRIBED') {
          console.log('[useAdmins] Subscribed to admin profiles changes')
        }
      })

    subscriptionRef.current = channel

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    }
  }, []) // Only run on mount

  return {
    admins,
    loading,
    error,
    actionLoading,
    refresh: fetchAdmins,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    toggleAdminStatus,
    getStats,
  }
}

/**
 * Hook pour obtenir un admin spécifique
 */
export const useAdminDetail = (adminId) => {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAdmin = useCallback(async () => {
    if (!adminId) {
      setAdmin(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('admin_profiles')
        .select('*')
        .eq('id', adminId)
        .maybeSingle()

      if (fetchError) throw fetchError

      setAdmin(data)
    } catch (err) {
      console.error('Erreur fetch admin:', err)
      setError(err.message)
      setAdmin(null)
    } finally {
      setLoading(false)
    }
  }, [adminId])

  useEffect(() => {
    fetchAdmin()
  }, [fetchAdmin])

  return { admin, loading, error, refresh: fetchAdmin }
}
