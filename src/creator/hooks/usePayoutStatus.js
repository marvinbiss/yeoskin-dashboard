/**
 * Hook pour obtenir le statut des paiements d'un createur
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

export function usePayoutStatus(creatorId) {
  const [data, setData] = useState({
    current: null,
    last: null,
    history: [],
    loading: true,
    error: null,
  })

  const fetchPayoutStatus = useCallback(async () => {
    if (!creatorId) {
      setData(prev => ({ ...prev, loading: false }))
      return
    }

    try {
      // Fetch payout items for this creator
      const { data: items, error } = await supabase
        .from('payout_items')
        .select(`
          id,
          amount,
          wise_fee,
          status,
          wise_transfer_id,
          sent_at,
          created_at
        `)
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      const payouts = items || []

      setData({
        current: payouts.find(p => p.status === 'processing') || null,
        last: payouts.find(p => p.status === 'completed') || null,
        history: payouts,
        loading: false,
        error: null,
      })
    } catch (error) {
      console.error('Error fetching payout status:', error)
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message,
      }))
    }
  }, [creatorId])

  useEffect(() => {
    fetchPayoutStatus()

    // Refetch every 30 seconds if there's a processing payout
    const interval = setInterval(() => {
      if (data.current?.status === 'processing') {
        fetchPayoutStatus()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchPayoutStatus, data.current?.status])

  return {
    ...data,
    refetch: fetchPayoutStatus,
  }
}

export default usePayoutStatus
