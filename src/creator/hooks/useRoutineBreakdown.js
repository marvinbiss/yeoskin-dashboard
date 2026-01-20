import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Hook for fetching creator's routine breakdown data
 * Shows commission performance by routine + variant
 */
export const useRoutineBreakdown = (creatorId = null) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState({
    breakdown: [],
    totals: {
      total_orders: 0,
      total_revenue: 0,
      total_commission: 0,
      avg_commission_rate: 0,
      upsell_rate: 0,
    },
  })

  const fetchBreakdown = useCallback(async () => {
    if (!creatorId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: result, error: rpcError } = await supabase.rpc('get_routine_breakdown', {
        p_creator_id: creatorId
      })

      if (rpcError) {
        throw rpcError
      }

      if (result) {
        setData({
          breakdown: result.breakdown || [],
          totals: result.totals || {
            total_orders: 0,
            total_revenue: 0,
            total_commission: 0,
            avg_commission_rate: 0,
            upsell_rate: 0,
          },
        })
      }
    } catch (err) {
      console.error('Error fetching routine breakdown:', err)
      setError(err.message || 'Erreur lors du chargement des donnees')
    } finally {
      setLoading(false)
    }
  }, [creatorId])

  useEffect(() => {
    fetchBreakdown()
  }, [fetchBreakdown])

  // Real-time subscription for commission changes
  useEffect(() => {
    if (!creatorId) return

    const channel = supabase
      .channel('routine-breakdown-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'commissions',
          filter: `creator_id=eq.${creatorId}`,
        },
        () => {
          fetchBreakdown()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [creatorId, fetchBreakdown])

  return {
    loading,
    error,
    breakdown: data.breakdown,
    totals: data.totals,
    refresh: fetchBreakdown,
  }
}
