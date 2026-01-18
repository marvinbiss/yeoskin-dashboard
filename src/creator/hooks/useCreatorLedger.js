import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Hook for paginated creator ledger entries
 */
export const useCreatorLedger = (creatorId = null, options = {}) => {
  const { initialLimit = 50, initialTransactionType = null } = options

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [entries, setEntries] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [offset, setOffset] = useState(0)
  const [limit, setLimit] = useState(initialLimit)
  const [transactionType, setTransactionType] = useState(initialTransactionType)
  const [hasMore, setHasMore] = useState(false)

  // Fetch ledger entries
  const fetchLedger = useCallback(async (newOffset = 0, append = false) => {
    if (!append) {
      setLoading(true)
    }
    setError(null)

    try {
      const { data, error: rpcError } = await supabase.rpc('get_creator_ledger', {
        p_creator_id: creatorId,
        p_limit: limit,
        p_offset: newOffset,
        p_transaction_type: transactionType
      })

      if (rpcError) {
        throw rpcError
      }

      if (data) {
        const newEntries = data.entries || []
        setTotalCount(data.total_count || 0)
        setOffset(newOffset)
        setHasMore(newOffset + newEntries.length < data.total_count)

        if (append) {
          setEntries(prev => [...prev, ...newEntries])
        } else {
          setEntries(newEntries)
        }
      }
    } catch (err) {
      console.error('Error fetching ledger:', err)
      setError(err.message || 'Erreur lors du chargement du journal')
    } finally {
      setLoading(false)
    }
  }, [creatorId, limit, transactionType])

  // Initial fetch
  useEffect(() => {
    fetchLedger(0, false)
  }, [fetchLedger])

  // Load more entries
  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchLedger(offset + limit, true)
    }
  }, [fetchLedger, hasMore, loading, offset, limit])

  // Change filter
  const filterByType = useCallback((type) => {
    setTransactionType(type)
    setOffset(0)
  }, [])

  // Refresh
  const refresh = useCallback(() => {
    setOffset(0)
    fetchLedger(0, false)
  }, [fetchLedger])

  // Transaction type labels (French)
  const transactionTypeLabels = {
    commission_earned: 'Commission gagnee',
    commission_canceled: 'Commission annulee',
    commission_adjusted: 'Ajustement',
    payout_initiated: 'Paiement initie',
    payout_sent: 'Paiement envoye',
    payout_completed: 'Paiement confirme',
    payout_failed: 'Paiement echoue',
    payout_fee: 'Frais',
    balance_adjustment: 'Ajustement de solde',
    refund_processed: 'Remboursement',
  }

  // Get label for transaction type
  const getTypeLabel = useCallback((type) => {
    return transactionTypeLabels[type] || type
  }, [])

  // Get color class for transaction type
  const getTypeColor = useCallback((type) => {
    const colors = {
      commission_earned: 'text-green-600 bg-green-50',
      commission_canceled: 'text-red-600 bg-red-50',
      payout_sent: 'text-blue-600 bg-blue-50',
      payout_completed: 'text-green-600 bg-green-50',
      payout_failed: 'text-red-600 bg-red-50',
      payout_fee: 'text-orange-600 bg-orange-50',
    }
    return colors[type] || 'text-gray-600 bg-gray-50'
  }, [])

  return {
    loading,
    error,
    entries,
    totalCount,
    hasMore,
    loadMore,
    filterByType,
    refresh,
    transactionType,
    setTransactionType: filterByType,
    getTypeLabel,
    getTypeColor,
    transactionTypeLabels,
  }
}
