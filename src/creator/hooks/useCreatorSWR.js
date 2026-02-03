import useSWR from 'swr'
import { supabase } from '../../lib/supabase'

/**
 * SWR configuration for creator dashboard
 */
export const creatorSwrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 30000, // 30 seconds
  errorRetryCount: 2,
}

/**
 * Generic Supabase RPC fetcher
 */
const rpcFetcher = async ([rpcName, params]) => {
  const { data, error } = await supabase.rpc(rpcName, params)
  if (error) throw error
  return data
}

/**
 * Generic Supabase query fetcher
 */
const queryFetcher = async ([table, query]) => {
  const { data, error } = await supabase.from(table).select(query.select)
  if (error) throw error
  return data
}

/**
 * Hook for creator dashboard data with SWR caching
 */
export const useCreatorDashboardSWR = (creatorId) => {
  const { data: dashboard, error: dashboardError, isLoading: dashboardLoading, mutate: mutateDashboard } = useSWR(
    creatorId ? ['get_creator_dashboard', { p_creator_id: creatorId }] : null,
    rpcFetcher,
    {
      ...creatorSwrConfig,
      refreshInterval: 60000, // 1 minute
      fallbackData: {
        balance: { current_balance: 0, total_earned: 0, total_paid: 0, total_fees: 0 },
        recent_activity: [],
        pending_commissions: { count: 0, amount: 0 },
        locked_commissions: { count: 0, amount: 0 },
        payable_commissions: { count: 0, amount: 0 },
        paid_commissions: { count: 0, amount: 0 },
        unread_notifications: 0,
      },
    }
  )

  const { data: forecast, error: forecastError, isLoading: forecastLoading, mutate: mutateForecast } = useSWR(
    creatorId ? ['get_payout_forecast', { p_creator_id: creatorId }] : null,
    rpcFetcher,
    {
      ...creatorSwrConfig,
      refreshInterval: 120000, // 2 minutes
      fallbackData: {
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
      },
    }
  )

  return {
    dashboard: dashboard || {},
    forecast: forecast || {},
    balance: dashboard?.balance || { current_balance: 0, total_earned: 0, total_paid: 0, total_fees: 0 },
    recentActivity: dashboard?.recent_activity || [],
    pendingCommissions: dashboard?.pending_commissions || { count: 0, amount: 0 },
    lockedCommissions: dashboard?.locked_commissions || { count: 0, amount: 0 },
    payableCommissions: dashboard?.payable_commissions || { count: 0, amount: 0 },
    paidCommissions: dashboard?.paid_commissions || { count: 0, amount: 0 },
    loading: dashboardLoading || forecastLoading,
    error: dashboardError?.message || forecastError?.message || null,
    refresh: () => {
      mutateDashboard()
      mutateForecast()
    },
  }
}

/**
 * Hook for creator's assigned routine with SWR
 */
export const useCreatorRoutineSWR = (creatorId) => {
  const { data, error, isLoading, mutate } = useSWR(
    creatorId ? `creator-routine-${creatorId}` : null,
    async () => {
      const { data, error } = await supabase
        .from('creator_routines')
        .select('routine_id, routines(id, title, slug, objective, base_price, image_url)')
        .eq('creator_id', creatorId)
        .eq('is_active', true)
        .maybeSingle()

      if (error) throw error
      return data?.routines || null
    },
    {
      ...creatorSwrConfig,
      refreshInterval: 300000, // 5 minutes
    }
  )

  return {
    routine: data,
    loading: isLoading,
    error: error?.message || null,
    mutate,
  }
}

/**
 * Hook for available routines with SWR
 */
export const useAvailableRoutinesSWR = (enabled = true) => {
  const { data, error, isLoading } = useSWR(
    enabled ? 'available-routines' : null,
    async () => {
      const { data, error } = await supabase
        .from('routines')
        .select('id, title, slug, objective, base_price, image_url')
        .eq('is_active', true)
        .order('title')

      if (error) throw error
      return data || []
    },
    {
      ...creatorSwrConfig,
      refreshInterval: 300000, // 5 minutes
    }
  )

  return {
    routines: data || [],
    loading: isLoading,
    error: error?.message || null,
  }
}

/**
 * Hook for creator tier info with SWR
 */
export const useCreatorTierSWR = (creatorId) => {
  const { data, error, isLoading } = useSWR(
    creatorId ? `creator-tier-${creatorId}` : null,
    async () => {
      const { data, error } = await supabase
        .from('creators')
        .select(`
          tier_id,
          commission_rate,
          tier:commission_tiers(
            id,
            name,
            display_name,
            color,
            commission_rate,
            min_followers,
            perks
          )
        `)
        .eq('id', creatorId)
        .single()

      if (error) throw error
      return data
    },
    {
      ...creatorSwrConfig,
      refreshInterval: 300000, // 5 minutes
    }
  )

  return {
    tier: data?.tier || null,
    commissionRate: data?.commission_rate || 0,
    loading: isLoading,
    error: error?.message || null,
  }
}

/**
 * Hook for payout status with SWR
 */
export const usePayoutStatusSWR = (creatorId) => {
  const { data, error, isLoading } = useSWR(
    creatorId ? `payout-status-${creatorId}` : null,
    async () => {
      const { data, error } = await supabase
        .from('payout_batches')
        .select('id, status, amount, created_at')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      return data
    },
    {
      ...creatorSwrConfig,
      refreshInterval: 60000, // 1 minute
    }
  )

  return {
    lastPayout: data,
    loading: isLoading,
    error: error?.message || null,
  }
}

/**
 * Hook for routine breakdown with SWR
 */
export const useRoutineBreakdownSWR = (creatorId) => {
  const { data, error, isLoading } = useSWR(
    creatorId ? `routine-breakdown-${creatorId}` : null,
    async () => {
      const { data, error } = await supabase.rpc('get_creator_routine_breakdown', {
        p_creator_id: creatorId,
      })

      if (error) throw error
      return data || []
    },
    {
      ...creatorSwrConfig,
      refreshInterval: 120000, // 2 minutes
    }
  )

  return {
    breakdown: data || [],
    loading: isLoading,
    error: error?.message || null,
  }
}
