import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Hook for fetching creator dashboard data
 * Includes real-time updates for balance and notifications
 */
export const useCreatorDashboard = (creatorId = null) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dashboard, setDashboard] = useState({
    balance: {
      current_balance: 0,
      total_earned: 0,
      total_paid: 0,
      total_fees: 0,
    },
    recentActivity: [],
    pendingCommissions: { count: 0, amount: 0 },
    lockedCommissions: { count: 0, amount: 0 },
    payableCommissions: { count: 0, amount: 0 },
    paidCommissions: { count: 0, amount: 0 },
    unreadNotifications: 0,
  })
  const [forecast, setForecast] = useState({
    payable_now: 0,
    locked_amount: 0,
    pending_amount: 0,
    next_unlock_date: null,
    risk_indicators: {
      has_unverified_bank: true,
      has_locked_commissions: false,
      days_to_full_payout: 0,
    },
    can_receive_payout: false,
  })

  // Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: rpcError } = await supabase.rpc('get_creator_dashboard', {
        p_creator_id: creatorId
      })

      if (rpcError) {
        throw rpcError
      }

      if (data) {
        setDashboard({
          balance: data.balance || {
            current_balance: 0,
            total_earned: 0,
            total_paid: 0,
            total_fees: 0,
          },
          recentActivity: data.recent_activity || [],
          pendingCommissions: data.pending_commissions || { count: 0, amount: 0 },
          lockedCommissions: data.locked_commissions || { count: 0, amount: 0 },
          payableCommissions: data.payable_commissions || { count: 0, amount: 0 },
          paidCommissions: data.paid_commissions || { count: 0, amount: 0 },
          unreadNotifications: data.unread_notifications || 0,
        })
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err)
      setError(err.message || 'Erreur lors du chargement du tableau de bord')
    } finally {
      setLoading(false)
    }
  }, [creatorId])

  // Fetch payout forecast
  const fetchForecast = useCallback(async () => {
    try {
      const { data, error: rpcError } = await supabase.rpc('get_payout_forecast', {
        p_creator_id: creatorId
      })

      if (rpcError) {
        throw rpcError
      }

      if (data) {
        setForecast(data)
      }
    } catch (err) {
      console.error('Error fetching forecast:', err)
    }
  }, [creatorId])

  // Initial fetch
  useEffect(() => {
    fetchDashboard()
    fetchForecast()
  }, [fetchDashboard, fetchForecast])

  // Real-time subscription for ledger changes
  useEffect(() => {
    const channel = supabase
      .channel('creator-dashboard-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'financial_ledger',
        },
        (payload) => {
          // Refresh dashboard when new ledger entry is added for this creator
          if (!creatorId || payload.new.creator_id === creatorId) {
            fetchDashboard()
            fetchForecast()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'creator_notifications',
        },
        (payload) => {
          // Increment notification count
          if (!creatorId || payload.new.creator_id === creatorId) {
            setDashboard(prev => ({
              ...prev,
              unreadNotifications: prev.unreadNotifications + 1
            }))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [creatorId, fetchDashboard, fetchForecast])

  return {
    loading,
    error,
    dashboard,
    forecast,
    balance: dashboard.balance,
    recentActivity: dashboard.recentActivity,
    pendingCommissions: dashboard.pendingCommissions,
    lockedCommissions: dashboard.lockedCommissions,
    payableCommissions: dashboard.payableCommissions,
    paidCommissions: dashboard.paidCommissions,
    unreadNotifications: dashboard.unreadNotifications,
    refresh: fetchDashboard,
    refreshForecast: fetchForecast,
  }
}
