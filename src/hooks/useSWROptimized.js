import useSWR, { useSWRConfig } from 'swr'
import { supabase, TABLES, BATCH_STATUS } from '../lib/supabase'

// SWR Configuration for optimal performance
export const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 5000, // Dedupe requests within 5s
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  shouldRetryOnError: true,
}

// Cache keys
export const CACHE_KEYS = {
  DASHBOARD_STATS: 'dashboard-stats',
  BATCHES: 'batches',
  CREATORS: 'creators',
  CREATORS_ALL: 'creators-all',
  TRANSFERS: 'transfers',
  COMMISSIONS: 'commissions',
  APPLICATIONS: 'applications',
  ADMINS: 'admins',
}

// Fetchers
const fetchDashboardStats = async () => {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  // Run all queries in parallel for maximum speed
  const [paidResult, creatorsResult, batchesResult, transfersResult, commissionsResult, feesResult] = await Promise.all([
    supabase
      .from(TABLES.PAYOUT_ITEMS)
      .select('amount')
      .in('status', ['sent', 'paid'])
      .gte('sent_at', startOfMonth.toISOString()),
    supabase
      .from(TABLES.CREATORS)
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from(TABLES.PAYOUT_BATCHES)
      .select('*', { count: 'exact', head: true })
      .in('status', ['draft', 'approved']),
    supabase
      .from(TABLES.WISE_TRANSFERS)
      .select('status')
      .gte('created_at', startOfMonth.toISOString()),
    supabase
      .from(TABLES.COMMISSIONS)
      .select('commission_amount')
      .in('status', ['pending', 'locked', 'payable']),
    supabase
      .from(TABLES.PAYOUT_ITEMS)
      .select('wise_fee')
      .not('wise_fee', 'is', null)
      .limit(100),
  ])

  const totalPaidThisMonth = paidResult.data?.reduce((sum, item) => sum + Number(item.amount), 0) || 0
  const totalTransfers = transfersResult.data?.length || 0
  const successfulTransfers = transfersResult.data?.filter(t =>
    ['completed', 'processing', 'sent'].includes(t.status)
  ).length || 0
  const successRate = totalTransfers > 0
    ? Math.round((successfulTransfers / totalTransfers) * 100)
    : 100
  const totalCommissions = commissionsResult.data?.reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0
  const avgFee = feesResult.data?.length > 0
    ? feesResult.data.reduce((sum, f) => sum + Number(f.wise_fee), 0) / feesResult.data.length
    : 0

  return {
    totalPaidThisMonth,
    activeCreators: creatorsResult.count || 0,
    pendingBatches: batchesResult.count || 0,
    successRate,
    totalCommissions,
    avgFee: Math.round(avgFee * 100) / 100,
  }
}

const fetchBatches = async (limit = 10, status = null) => {
  let query = supabase
    .from(TABLES.PAYOUT_BATCHES)
    .select(`
      *,
      payout_items (
        id,
        amount,
        status,
        creator_id
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw error

  return data?.map(batch => ({
    ...batch,
    itemCount: batch.payout_items?.length || 0,
    totalAmount: batch.payout_items?.reduce((sum, item) => sum + Number(item.amount), 0) || 0,
    pendingItems: batch.payout_items?.filter(i => i.status === 'pending').length || 0,
  })) || []
}

const fetchCreators = async (limit = 100, status = null) => {
  let query = supabase
    .from(TABLES.CREATORS)
    .select(`
      *,
      commission_tiers (id, name, display_name, color, commission_rate),
      creator_bank_accounts (id, account_type, is_verified)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw error

  return data?.map(creator => ({
    ...creator,
    tier: creator.commission_tiers,
    hasBankAccount: creator.creator_bank_accounts?.length > 0,
    bankVerified: creator.creator_bank_accounts?.some(b => b.is_verified),
  })) || []
}

const fetchTransfers = async (limit = 10) => {
  const { data, error } = await supabase
    .from(TABLES.WISE_TRANSFERS)
    .select(`
      *,
      creators (email, discount_code)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

const fetchCommissions = async (limit = 50, status = null, creatorId = null) => {
  let query = supabase
    .from(TABLES.COMMISSIONS)
    .select(`
      *,
      creators (email, discount_code),
      orders (order_number, shopify_order_id)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status) query = query.eq('status', status)
  if (creatorId) query = query.eq('creator_id', creatorId)

  const { data, error } = await query
  if (error) throw error
  return data || []
}

const fetchApplications = async () => {
  const { data, error } = await supabase
    .from(TABLES.CREATORS)
    .select(`
      *,
      commission_tiers (id, name, display_name, color, commission_rate)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error
  return data || []
}

const fetchAdmins = async () => {
  const { data, error } = await supabase
    .from('admin_profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data || []
}

// Optimized hooks with SWR
export const useDashboardStatsOptimized = () => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    CACHE_KEYS.DASHBOARD_STATS,
    fetchDashboardStats,
    {
      ...swrConfig,
      refreshInterval: 300000, // Refresh every 5 minutes instead of 30s
      fallbackData: {
        totalPaidThisMonth: 0,
        activeCreators: 0,
        pendingBatches: 0,
        successRate: 100,
        totalCommissions: 0,
        avgFee: 0,
      },
    }
  )

  return {
    stats: data,
    loading: isLoading,
    refreshing: isValidating && !isLoading,
    error: error?.message,
    refresh: () => mutate(),
  }
}

export const useBatchesOptimized = (options = {}) => {
  const { limit = 10, status = null } = options
  const { mutate: globalMutate } = useSWRConfig()

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    [CACHE_KEYS.BATCHES, limit, status],
    () => fetchBatches(limit, status),
    {
      ...swrConfig,
      refreshInterval: 60000, // Refresh every minute
      fallbackData: [],
    }
  )

  const approveBatch = async (batchId) => {
    // Optimistic update
    const optimisticData = data?.map(batch =>
      batch.id === batchId
        ? { ...batch, status: BATCH_STATUS.APPROVED, approved_at: new Date().toISOString() }
        : batch
    )

    mutate(optimisticData, false)

    const { error } = await supabase
      .from(TABLES.PAYOUT_BATCHES)
      .update({
        status: BATCH_STATUS.APPROVED,
        approved_at: new Date().toISOString()
      })
      .eq('id', batchId)
      .eq('status', BATCH_STATUS.DRAFT)

    if (error) {
      mutate() // Revert on error
      throw error
    }

    // Revalidate related caches
    globalMutate(CACHE_KEYS.DASHBOARD_STATS)
  }

  return {
    batches: data || [],
    loading: isLoading,
    refreshing: isValidating && !isLoading,
    error: error?.message,
    refresh: () => mutate(),
    approveBatch,
  }
}

export const useCreatorsOptimized = (options = {}) => {
  const { limit = 100, status = null } = options

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    [CACHE_KEYS.CREATORS, limit, status],
    () => fetchCreators(limit, status),
    {
      ...swrConfig,
      refreshInterval: 120000, // Refresh every 2 minutes
      fallbackData: [],
    }
  )

  return {
    creators: data || [],
    loading: isLoading,
    refreshing: isValidating && !isLoading,
    error: error?.message,
    refresh: () => mutate(),
  }
}

export const useTransfersOptimized = (limit = 10) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    [CACHE_KEYS.TRANSFERS, limit],
    () => fetchTransfers(limit),
    {
      ...swrConfig,
      refreshInterval: 60000,
      fallbackData: [],
    }
  )

  return {
    transfers: data || [],
    loading: isLoading,
    refreshing: isValidating && !isLoading,
    error: error?.message,
    refresh: () => mutate(),
  }
}

export const useCommissionsOptimized = (options = {}) => {
  const { limit = 50, status = null, creatorId = null } = options

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    [CACHE_KEYS.COMMISSIONS, limit, status, creatorId],
    () => fetchCommissions(limit, status, creatorId),
    {
      ...swrConfig,
      refreshInterval: 120000,
      fallbackData: [],
    }
  )

  return {
    commissions: data || [],
    loading: isLoading,
    refreshing: isValidating && !isLoading,
    error: error?.message,
    refresh: () => mutate(),
  }
}

export const useApplicationsOptimized = () => {
  const { mutate: globalMutate } = useSWRConfig()

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    CACHE_KEYS.APPLICATIONS,
    fetchApplications,
    {
      ...swrConfig,
      refreshInterval: 60000,
      fallbackData: [],
    }
  )

  const approveApplication = async (creatorId, tierData) => {
    // Optimistic update - remove from list
    const optimisticData = data?.filter(app => app.id !== creatorId)
    mutate(optimisticData, false)

    const { error } = await supabase
      .from(TABLES.CREATORS)
      .update({
        status: 'active',
        tier_id: tierData.tierId,
        commission_rate: tierData.commissionRate,
        approved_at: new Date().toISOString(),
      })
      .eq('id', creatorId)

    if (error) {
      mutate() // Revert
      throw error
    }

    globalMutate(CACHE_KEYS.DASHBOARD_STATS)
    globalMutate([CACHE_KEYS.CREATORS, 100, null])
  }

  const rejectApplication = async (creatorId) => {
    const optimisticData = data?.filter(app => app.id !== creatorId)
    mutate(optimisticData, false)

    const { error } = await supabase
      .from(TABLES.CREATORS)
      .update({ status: 'rejected' })
      .eq('id', creatorId)

    if (error) {
      mutate()
      throw error
    }
  }

  return {
    applications: data || [],
    loading: isLoading,
    refreshing: isValidating && !isLoading,
    error: error?.message,
    refresh: () => mutate(),
    approveApplication,
    rejectApplication,
  }
}

export const useAdminsOptimized = () => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    CACHE_KEYS.ADMINS,
    fetchAdmins,
    {
      ...swrConfig,
      refreshInterval: 300000, // 5 minutes
      fallbackData: [],
    }
  )

  return {
    admins: data || [],
    loading: isLoading,
    refreshing: isValidating && !isLoading,
    error: error?.message,
    refresh: () => mutate(),
  }
}

// Prefetch functions for faster navigation
export const prefetchDashboardData = async (mutate) => {
  await Promise.all([
    mutate(CACHE_KEYS.DASHBOARD_STATS, fetchDashboardStats()),
    mutate([CACHE_KEYS.BATCHES, 10, null], fetchBatches(10)),
    mutate([CACHE_KEYS.TRANSFERS, 10], fetchTransfers(10)),
  ])
}

export const prefetchCreators = async (mutate) => {
  await mutate([CACHE_KEYS.CREATORS, 100, null], fetchCreators(100))
}

export const prefetchApplications = async (mutate) => {
  await mutate(CACHE_KEYS.APPLICATIONS, fetchApplications())
}
