/**
 * Hook pour obtenir le tier/niveau d'un createur
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

export function useCreatorTier(creatorId) {
  const [data, setData] = useState({
    current: null,
    next: null,
    monthlyRevenue: 0,
    progress: 0,
    remaining: 0,
    loading: true,
    error: null,
  })

  const fetchTier = useCallback(async () => {
    if (!creatorId) {
      setData(prev => ({ ...prev, loading: false }))
      return
    }

    try {
      // Get all tiers
      const { data: tiers, error: tiersError } = await supabase
        .from('creator_tiers')
        .select('*')
        .order('min_monthly_revenue', { ascending: true })

      if (tiersError) throw tiersError

      // Get creator with tier
      const { data: creator, error: creatorError } = await supabase
        .from('creators')
        .select('current_tier_id')
        .eq('id', creatorId)
        .single()

      if (creatorError) throw creatorError

      // Calculate monthly revenue
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { data: commissions } = await supabase
        .from('commissions')
        .select('commission_amount')
        .eq('creator_id', creatorId)
        .gte('created_at', startOfMonth.toISOString())
        .neq('status', 'canceled')

      const monthlyRevenue = (commissions || []).reduce(
        (sum, c) => sum + Number(c.commission_amount),
        0
      )

      // Find current tier
      let currentTier = tiers.find(t => t.id === creator.current_tier_id)
      if (!currentTier) {
        // Default to first tier (Bronze)
        currentTier = tiers[0]
      }

      // Find next tier
      const nextTier = tiers.find(t => t.min_monthly_revenue > (currentTier?.min_monthly_revenue || 0))

      // Calculate progress
      const progress = nextTier
        ? Math.min(100, Math.round((monthlyRevenue / nextTier.min_monthly_revenue) * 100))
        : 100

      const remaining = nextTier
        ? Math.max(0, nextTier.min_monthly_revenue - monthlyRevenue)
        : 0

      setData({
        current: currentTier,
        next: nextTier,
        monthlyRevenue,
        progress,
        remaining,
        loading: false,
        error: null,
      })
    } catch (error) {
      console.error('Error fetching tier:', error)
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message,
      }))
    }
  }, [creatorId])

  useEffect(() => {
    fetchTier()
  }, [fetchTier])

  return {
    ...data,
    refetch: fetchTier,
  }
}

export default useCreatorTier
