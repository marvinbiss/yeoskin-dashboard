/**
 * YEOSKIN DASHBOARD - Hook useCreators
 * Gestion CRUD complète des créateurs
 * Fixed: Race condition in realtime subscription
 * Fixed: Memory leaks with proper cleanup
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, TABLES } from '../lib/supabase'

/**
 * Hook pour la gestion complète des créateurs
 * @param {object} options - Options de configuration
 * @param {number} [options.limit=100] - Limite de résultats
 * @param {string|null} [options.status=null] - Filtrer par statut (null = tous)
 */
export const useCreators = (options = {}) => {
  const { limit = 100, status = null } = options

  const [creators, setCreators] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Récupérer tous les créateurs avec leurs données enrichies
   */
  const fetchCreators = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from(TABLES.CREATORS)
        .select(`
          *,
          commissions (
            commission_amount,
            status
          ),
          creator_bank_accounts (
            id,
            account_type,
            iban,
            is_verified,
            created_at
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      // Filtrer par statut si spécifié
      if (status) {
        query = query.eq('status', status)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      // Enrichir les données avec des champs calculés
      const enrichedCreators = data?.map(creator => {
        const totalEarned = creator.commissions
          ?.filter(c => c.status === 'paid')
          .reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0

        const pendingAmount = creator.commissions
          ?.filter(c => ['pending', 'locked', 'payable'].includes(c.status))
          .reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0

        const commissionsCount = creator.commissions?.length || 0

        return {
          ...creator,
          totalEarned,
          pendingAmount,
          commissionsCount,
          hasBankAccount: creator.creator_bank_accounts?.length > 0,
          bankVerified: creator.creator_bank_accounts?.some(b => b.is_verified),
          bankAccount: creator.creator_bank_accounts?.[0] || null,
        }
      }) || []

      setCreators(enrichedCreators)
    } catch (err) {
      console.error('Error fetching creators:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [limit, status])

  /**
   * Créer un nouveau créateur
   * @param {object} creatorData - Données du créateur
   * @returns {Promise<object>} Le créateur créé
   */
  const createCreator = async (creatorData) => {
    setActionLoading(true)
    setError(null)

    try {
      // Validation des champs requis
      if (!creatorData.email) {
        throw new Error('L\'email est obligatoire')
      }

      if (!creatorData.discount_code) {
        throw new Error('Le code promo est obligatoire')
      }

      // Vérifier si l'email existe déjà
      const { data: existingEmail } = await supabase
        .from(TABLES.CREATORS)
        .select('id')
        .eq('email', creatorData.email.toLowerCase().trim())
        .maybeSingle()

      if (existingEmail) {
        throw new Error('Un créateur avec cet email existe déjà')
      }

      // Vérifier si le code promo existe déjà
      const { data: existingCode } = await supabase
        .from(TABLES.CREATORS)
        .select('id')
        .eq('discount_code', creatorData.discount_code.toUpperCase().trim())
        .maybeSingle()

      if (existingCode) {
        throw new Error('Un créateur avec ce code promo existe déjà')
      }

      // Préparer les données
      const insertData = {
        email: creatorData.email.toLowerCase().trim(),
        discount_code: creatorData.discount_code.toUpperCase().trim(),
        commission_rate: creatorData.commission_rate || 0.15,
        status: creatorData.status || 'active',
        lock_days: creatorData.lock_days || 30,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Insérer le créateur
      const { data, error: insertError } = await supabase
        .from(TABLES.CREATORS)
        .insert(insertData)
        .select()
        .single()

      if (insertError) throw insertError

      // Si un compte bancaire est fourni, l'ajouter
      if (creatorData.iban) {
        await supabase
          .from(TABLES.CREATOR_BANK_ACCOUNTS)
          .insert({
            creator_id: data.id,
            account_type: creatorData.account_type || 'iban',
            iban: creatorData.iban.replace(/\s/g, '').toUpperCase(),
            is_verified: false,
            created_at: new Date().toISOString(),
          })
      }

      await fetchCreators()
      return data
    } catch (err) {
      console.error('Error creating creator:', err)
      setError(err.message)
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  /**
   * Mettre à jour un créateur existant
   * @param {string} creatorId - ID du créateur
   * @param {object} updateData - Données à mettre à jour
   * @returns {Promise<object>} Le créateur mis à jour
   */
  const updateCreator = async (creatorId, updateData) => {
    setActionLoading(true)
    setError(null)

    try {
      if (!creatorId) {
        throw new Error('ID du créateur manquant')
      }

      // Vérifier si l'email est déjà utilisé par un autre créateur
      if (updateData.email) {
        const { data: existingEmail } = await supabase
          .from(TABLES.CREATORS)
          .select('id')
          .eq('email', updateData.email.toLowerCase().trim())
          .neq('id', creatorId)
          .maybeSingle()

        if (existingEmail) {
          throw new Error('Un autre créateur utilise déjà cet email')
        }
      }

      // Vérifier si le code promo est déjà utilisé par un autre créateur
      if (updateData.discount_code) {
        const { data: existingCode } = await supabase
          .from(TABLES.CREATORS)
          .select('id')
          .eq('discount_code', updateData.discount_code.toUpperCase().trim())
          .neq('id', creatorId)
          .maybeSingle()

        if (existingCode) {
          throw new Error('Un autre créateur utilise déjà ce code promo')
        }
      }

      // Préparer les données de mise à jour
      const dataToUpdate = {
        updated_at: new Date().toISOString(),
      }

      if (updateData.email) {
        dataToUpdate.email = updateData.email.toLowerCase().trim()
      }
      if (updateData.discount_code) {
        dataToUpdate.discount_code = updateData.discount_code.toUpperCase().trim()
      }
      if (updateData.commission_rate !== undefined) {
        dataToUpdate.commission_rate = updateData.commission_rate
      }
      if (updateData.status) {
        dataToUpdate.status = updateData.status
      }
      if (updateData.lock_days !== undefined) {
        dataToUpdate.lock_days = updateData.lock_days
      }

      // Mettre à jour le créateur
      const { data, error: updateError } = await supabase
        .from(TABLES.CREATORS)
        .update(dataToUpdate)
        .eq('id', creatorId)
        .select()
        .single()

      if (updateError) throw updateError

      // Gérer le compte bancaire si fourni
      if (updateData.iban !== undefined) {
        // Récupérer le compte existant
        const { data: existingAccount } = await supabase
          .from(TABLES.CREATOR_BANK_ACCOUNTS)
          .select('id')
          .eq('creator_id', creatorId)
          .maybeSingle()

        if (updateData.iban) {
          // Créer ou mettre à jour
          if (existingAccount) {
            await supabase
              .from(TABLES.CREATOR_BANK_ACCOUNTS)
              .update({
                iban: updateData.iban.replace(/\s/g, '').toUpperCase(),
                account_type: updateData.account_type || 'iban',
                is_verified: false, // Reset verification on change
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingAccount.id)
          } else {
            await supabase
              .from(TABLES.CREATOR_BANK_ACCOUNTS)
              .insert({
                creator_id: creatorId,
                account_type: updateData.account_type || 'iban',
                iban: updateData.iban.replace(/\s/g, '').toUpperCase(),
                is_verified: false,
                created_at: new Date().toISOString(),
              })
          }
        } else if (existingAccount) {
          // Supprimer le compte si iban est vide
          await supabase
            .from(TABLES.CREATOR_BANK_ACCOUNTS)
            .delete()
            .eq('id', existingAccount.id)
        }
      }

      await fetchCreators()
      return data
    } catch (err) {
      console.error('Error updating creator:', err)
      setError(err.message)
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  /**
   * Supprimer un créateur (soft delete - passe en inactif)
   * @param {string} creatorId - ID du créateur
   * @returns {Promise<void>}
   */
  const deleteCreator = async (creatorId) => {
    setActionLoading(true)
    setError(null)

    try {
      if (!creatorId) {
        throw new Error('ID du créateur manquant')
      }

      // Vérifier s'il y a des commissions en attente
      const { data: pendingCommissions } = await supabase
        .from(TABLES.COMMISSIONS)
        .select('id')
        .eq('creator_id', creatorId)
        .in('status', ['pending', 'locked', 'payable'])
        .limit(1)

      if (pendingCommissions && pendingCommissions.length > 0) {
        throw new Error('Impossible de supprimer un créateur avec des commissions en attente')
      }

      // Soft delete - passer le statut en "deleted" ou "inactive"
      const { error: deleteError } = await supabase
        .from(TABLES.CREATORS)
        .update({
          status: 'inactive',
          updated_at: new Date().toISOString(),
        })
        .eq('id', creatorId)

      if (deleteError) throw deleteError

      await fetchCreators()
    } catch (err) {
      console.error('Error deleting creator:', err)
      setError(err.message)
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  /**
   * Supprimer définitivement un créateur (hard delete)
   * @param {string} creatorId - ID du créateur
   * @returns {Promise<void>}
   */
  const hardDeleteCreator = async (creatorId) => {
    setActionLoading(true)
    setError(null)

    try {
      if (!creatorId) {
        throw new Error('ID du créateur manquant')
      }

      // Vérifier s'il y a des commissions
      const { data: commissions } = await supabase
        .from(TABLES.COMMISSIONS)
        .select('id')
        .eq('creator_id', creatorId)
        .limit(1)

      if (commissions && commissions.length > 0) {
        throw new Error('Impossible de supprimer définitivement un créateur avec des commissions')
      }

      // Supprimer d'abord les comptes bancaires
      await supabase
        .from(TABLES.CREATOR_BANK_ACCOUNTS)
        .delete()
        .eq('creator_id', creatorId)

      // Supprimer le créateur
      const { error: deleteError } = await supabase
        .from(TABLES.CREATORS)
        .delete()
        .eq('id', creatorId)

      if (deleteError) throw deleteError

      await fetchCreators()
    } catch (err) {
      console.error('Error hard deleting creator:', err)
      setError(err.message)
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  /**
   * Changer le statut d'un créateur (actif/inactif)
   * @param {string} creatorId - ID du créateur
   * @returns {Promise<object>} Résultat avec le nouveau statut
   */
  const toggleCreatorStatus = async (creatorId) => {
    setActionLoading(true)
    setError(null)

    try {
      // Récupérer le statut actuel
      const { data: creator, error: fetchError } = await supabase
        .from(TABLES.CREATORS)
        .select('status')
        .eq('id', creatorId)
        .single()

      if (fetchError) throw fetchError

      const newStatus = creator.status === 'active' ? 'inactive' : 'active'

      const { error: updateError } = await supabase
        .from(TABLES.CREATORS)
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', creatorId)

      if (updateError) throw updateError

      await fetchCreators()
      return { creatorId, newStatus }
    } catch (err) {
      console.error('Error toggling creator status:', err)
      setError(err.message)
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  /**
   * Vérifier/activer un compte bancaire
   * @param {string} creatorId - ID du créateur
   * @param {boolean} verified - Statut de vérification
   */
  const verifyBankAccount = async (creatorId, verified = true) => {
    setActionLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from(TABLES.CREATOR_BANK_ACCOUNTS)
        .update({
          is_verified: verified,
          updated_at: new Date().toISOString(),
        })
        .eq('creator_id', creatorId)

      if (updateError) throw updateError

      await fetchCreators()
    } catch (err) {
      console.error('Error verifying bank account:', err)
      setError(err.message)
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  /**
   * Obtenir les statistiques des créateurs
   */
  const getStats = useCallback(() => {
    const total = creators.length
    const active = creators.filter(c => c.status === 'active').length
    const inactive = creators.filter(c => c.status === 'inactive').length
    const withBank = creators.filter(c => c.hasBankAccount).length
    const verifiedBank = creators.filter(c => c.bankVerified).length
    const totalEarned = creators.reduce((sum, c) => sum + (c.totalEarned || 0), 0)
    const totalPending = creators.reduce((sum, c) => sum + (c.pendingAmount || 0), 0)

    return {
      total,
      active,
      inactive,
      withBank,
      verifiedBank,
      totalEarned,
      totalPending,
    }
  }, [creators])

  // Refs for preventing stale closures and memory leaks
  const mountedRef = useRef(true)
  const fetchCreatorsRef = useRef(fetchCreators)
  const subscriptionRef = useRef(null)

  // Keep fetchCreators ref updated
  useEffect(() => {
    fetchCreatorsRef.current = fetchCreators
  }, [fetchCreators])

  // Charger les créateurs au montage
  useEffect(() => {
    mountedRef.current = true
    fetchCreators()

    return () => {
      mountedRef.current = false
    }
  }, []) // Only run on mount - fetchCreators is stable via useCallback

  // Souscrire aux changements en temps réel (separate effect to avoid recreation)
  useEffect(() => {
    // Clean up any existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
    }

    const subscription = supabase
      .channel(`creators-changes-${Date.now()}`) // Unique channel name
      .on('postgres_changes',
        { event: '*', schema: 'public', table: TABLES.CREATORS },
        () => {
          // Use ref to avoid stale closure
          if (mountedRef.current) {
            fetchCreatorsRef.current()
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('[useCreators] Subscription error:', err)
        } else if (status === 'SUBSCRIBED') {
          console.log('[useCreators] Subscribed to creators changes')
        }
      })

    subscriptionRef.current = subscription

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    }
  }, []) // Only run on mount

  return {
    // Data
    creators,
    loading,
    actionLoading,
    error,

    // Actions
    refresh: fetchCreators,
    createCreator,
    updateCreator,
    deleteCreator,
    hardDeleteCreator,
    toggleCreatorStatus,
    verifyBankAccount,

    // Helpers
    getStats,
  }
}

export default useCreators
