import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, TABLES, BATCH_STATUS } from '../lib/supabase'

/**
 * Hook pour les statistiques du dashboard
 */
export const useDashboardStats = () => {
  const [stats, setStats] = useState({
    totalPaidThisMonth: 0,
    activeCreators: 0,
    pendingBatches: 0,
    successRate: 0,
    totalCommissions: 0,
    avgFee: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      
      // Get start of current month
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      
      // Total paid this month
      const { data: paidItems } = await supabase
        .from(TABLES.PAYOUT_ITEMS)
        .select('amount')
        .in('status', ['sent', 'paid'])
        .gte('sent_at', startOfMonth.toISOString())
      
      const totalPaidThisMonth = paidItems?.reduce((sum, item) => sum + Number(item.amount), 0) || 0
      
      // Active creators
      const { count: activeCreators } = await supabase
        .from(TABLES.CREATORS)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
      
      // Pending batches
      const { count: pendingBatches } = await supabase
        .from(TABLES.PAYOUT_BATCHES)
        .select('*', { count: 'exact', head: true })
        .in('status', ['draft', 'approved'])
      
      // Success rate from wise_transfers
      const { data: transfers } = await supabase
        .from(TABLES.WISE_TRANSFERS)
        .select('status')
        .gte('created_at', startOfMonth.toISOString())
      
      const totalTransfers = transfers?.length || 0
      const successfulTransfers = transfers?.filter(t => 
        ['completed', 'processing', 'sent'].includes(t.status)
      ).length || 0
      const successRate = totalTransfers > 0 
        ? Math.round((successfulTransfers / totalTransfers) * 100) 
        : 100
      
      // Total commissions pending
      const { data: commissions } = await supabase
        .from(TABLES.COMMISSIONS)
        .select('commission_amount')
        .in('status', ['pending', 'locked', 'payable'])
      
      const totalCommissions = commissions?.reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0
      
      // Average Wise fee
      const { data: fees } = await supabase
        .from(TABLES.PAYOUT_ITEMS)
        .select('wise_fee')
        .not('wise_fee', 'is', null)
        .limit(100)
      
      const avgFee = fees?.length > 0
        ? fees.reduce((sum, f) => sum + Number(f.wise_fee), 0) / fees.length
        : 0
      
      setStats({
        totalPaidThisMonth,
        activeCreators: activeCreators || 0,
        pendingBatches: pendingBatches || 0,
        successRate,
        totalCommissions,
        avgFee: Math.round(avgFee * 100) / 100,
      })
      
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [fetchStats])

  return { stats, loading, error, refresh: fetchStats }
}

/**
 * Hook pour les batches
 * Fixed: Race condition and memory leaks with proper cleanup
 */
export const useBatches = (options = {}) => {
  const { limit = 10, status = null } = options
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Refs for preventing stale closures and memory leaks
  const mountedRef = useRef(true)
  const fetchBatchesRef = useRef(null)
  const subscriptionRef = useRef(null)

  const fetchBatches = useCallback(async () => {
    try {
      setLoading(true)

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

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      // Enrich with computed fields
      const enrichedBatches = data?.map(batch => ({
        ...batch,
        itemCount: batch.payout_items?.length || 0,
        totalAmount: batch.payout_items?.reduce((sum, item) => sum + Number(item.amount), 0) || 0,
        pendingItems: batch.payout_items?.filter(i => i.status === 'pending').length || 0,
      })) || []

      if (mountedRef.current) {
        setBatches(enrichedBatches)
        setError(null)
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message)
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [limit, status])

  // Approve batch
  const approveBatch = async (batchId) => {
    const { error } = await supabase
      .from(TABLES.PAYOUT_BATCHES)
      .update({
        status: BATCH_STATUS.APPROVED,
        approved_at: new Date().toISOString()
      })
      .eq('id', batchId)
      .eq('status', BATCH_STATUS.DRAFT)

    if (error) throw error
    await fetchBatches()
  }

  // Keep fetchBatches ref updated
  useEffect(() => {
    fetchBatchesRef.current = fetchBatches
  }, [fetchBatches])

  // Initial fetch on mount
  useEffect(() => {
    mountedRef.current = true
    fetchBatches()

    return () => {
      mountedRef.current = false
    }
  }, []) // Only run on mount

  // Realtime subscription (separate effect)
  useEffect(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
    }

    const subscription = supabase
      .channel(`batches-changes-${Date.now()}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: TABLES.PAYOUT_BATCHES },
        () => {
          if (mountedRef.current) {
            fetchBatchesRef.current?.()
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('[useBatches] Subscription error:', err)
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

  return { batches, loading, error, refresh: fetchBatches, approveBatch }
}

/**
 * Hook pour un batch spécifique avec ses items
 */
export const useBatchDetail = (batchId) => {
  const [batch, setBatch] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchBatchDetail = useCallback(async () => {
    if (!batchId) return
    
    try {
      setLoading(true)
      
      // Fetch batch
      const { data: batchData, error: batchError } = await supabase
        .from(TABLES.PAYOUT_BATCHES)
        .select('*')
        .eq('id', batchId)
        .single()
      
      if (batchError) throw batchError
      
      // Fetch items with creator info
      const { data: itemsData, error: itemsError } = await supabase
        .from(TABLES.PAYOUT_ITEMS)
        .select(`
          *,
          creators (
            id,
            email,
            discount_code
          )
        `)
        .eq('payout_batch_id', batchId)
        .order('created_at', { ascending: false })
      
      if (itemsError) throw itemsError
      
      setBatch(batchData)
      setItems(itemsData || [])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [batchId])

  useEffect(() => {
    fetchBatchDetail()
  }, [fetchBatchDetail])

  return { batch, items, loading, error, refresh: fetchBatchDetail }
}

/**
 * Hook pour les créateurs
 */
export const useCreators = (options = {}) => {
  const { limit = 50, status = 'active' } = options
  const [creators, setCreators] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCreators = useCallback(async () => {
    try {
      setLoading(true)
      
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
            is_verified
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (status) {
        query = query.eq('status', status)
      }
      
      const { data, error: fetchError } = await query
      
      if (fetchError) throw fetchError
      
      // Enrich with computed fields
      const enrichedCreators = data?.map(creator => {
        const totalEarned = creator.commissions
          ?.filter(c => c.status === 'paid')
          .reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0
        
        const pendingAmount = creator.commissions
          ?.filter(c => ['pending', 'locked', 'payable'].includes(c.status))
          .reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0
        
        return {
          ...creator,
          totalEarned,
          pendingAmount,
          hasBankAccount: creator.creator_bank_accounts?.length > 0,
          bankVerified: creator.creator_bank_accounts?.some(b => b.is_verified),
        }
      }) || []
      
      setCreators(enrichedCreators)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [limit, status])

  useEffect(() => {
    fetchCreators()
  }, [fetchCreators])

  return { creators, loading, error, refresh: fetchCreators }
}

/**
 * Hook pour les transferts récents
 * Fixed: Race condition and memory leaks with proper cleanup
 */
export const useRecentTransfers = (limit = 10) => {
  const [transfers, setTransfers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Refs for preventing stale closures and memory leaks
  const mountedRef = useRef(true)
  const fetchTransfersRef = useRef(null)
  const subscriptionRef = useRef(null)

  const fetchTransfers = useCallback(async () => {
    try {
      setLoading(true)

      const { data, error: fetchError } = await supabase
        .from(TABLES.WISE_TRANSFERS)
        .select(`
          *,
          creators (
            email,
            discount_code
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (fetchError) throw fetchError

      if (mountedRef.current) {
        setTransfers(data || [])
        setError(null)
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message)
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [limit])

  // Keep fetchTransfers ref updated
  useEffect(() => {
    fetchTransfersRef.current = fetchTransfers
  }, [fetchTransfers])

  // Initial fetch on mount
  useEffect(() => {
    mountedRef.current = true
    fetchTransfers()

    return () => {
      mountedRef.current = false
    }
  }, []) // Only run on mount

  // Realtime subscription (separate effect)
  useEffect(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
    }

    const subscription = supabase
      .channel(`transfers-changes-${Date.now()}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: TABLES.WISE_TRANSFERS },
        () => {
          if (mountedRef.current) {
            fetchTransfersRef.current?.()
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('[useRecentTransfers] Subscription error:', err)
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

  return { transfers, loading, error, refresh: fetchTransfers }
}

/**
 * Hook pour les commissions
 */
export const useCommissions = (options = {}) => {
  const { limit = 50, status = null, creatorId = null } = options
  const [commissions, setCommissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCommissions = useCallback(async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from(TABLES.COMMISSIONS)
        .select(`
          *,
          creators (
            email,
            discount_code
          ),
          orders (
            order_number,
            shopify_order_id
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (status) {
        query = query.eq('status', status)
      }
      
      if (creatorId) {
        query = query.eq('creator_id', creatorId)
      }
      
      const { data, error: fetchError } = await query
      
      if (fetchError) throw fetchError
      
      setCommissions(data || [])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [limit, status, creatorId])

  useEffect(() => {
    fetchCommissions()
  }, [fetchCommissions])

  return { commissions, loading, error, refresh: fetchCommissions }
}
