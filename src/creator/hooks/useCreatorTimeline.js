import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Hook for fetching creator timeline events with explanations
 */
export const useCreatorTimeline = (creatorId = null, options = {}) => {
  const { initialLimit = 20 } = options

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [events, setEvents] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [offset, setOffset] = useState(0)
  const [limit] = useState(initialLimit)
  const [hasMore, setHasMore] = useState(false)

  // Fetch timeline
  const fetchTimeline = useCallback(async (newOffset = 0, append = false) => {
    if (!append) {
      setLoading(true)
    }
    setError(null)

    try {
      const { data, error: rpcError } = await supabase.rpc('get_creator_timeline', {
        p_creator_id: creatorId,
        p_limit: limit,
        p_offset: newOffset
      })

      if (rpcError) {
        throw rpcError
      }

      if (data) {
        const newEvents = data.events || []
        setTotalCount(data.total_count || 0)
        setOffset(newOffset)
        setHasMore(newOffset + newEvents.length < data.total_count)

        if (append) {
          setEvents(prev => [...prev, ...newEvents])
        } else {
          setEvents(newEvents)
        }
      }
    } catch (err) {
      console.error('Error fetching timeline:', err)
      setError(err.message || 'Erreur lors du chargement de la timeline')
    } finally {
      setLoading(false)
    }
  }, [creatorId, limit])

  // Initial fetch
  useEffect(() => {
    fetchTimeline(0, false)
  }, [fetchTimeline])

  // Load more events
  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchTimeline(offset + limit, true)
    }
  }, [fetchTimeline, hasMore, loading, offset, limit])

  // Refresh
  const refresh = useCallback(() => {
    setOffset(0)
    fetchTimeline(0, false)
  }, [fetchTimeline])

  // Get icon for event type
  const getEventIcon = useCallback((type) => {
    const icons = {
      commission_earned: 'plus-circle',
      commission_canceled: 'x-circle',
      payout_initiated: 'clock',
      payout_sent: 'send',
      payout_completed: 'check-circle',
      payout_failed: 'alert-circle',
      payout_fee: 'minus-circle',
    }
    return icons[type] || 'circle'
  }, [])

  // Get color for event type
  const getEventColor = useCallback((type) => {
    const colors = {
      commission_earned: 'text-green-500',
      commission_canceled: 'text-red-500',
      payout_initiated: 'text-blue-500',
      payout_sent: 'text-blue-600',
      payout_completed: 'text-green-600',
      payout_failed: 'text-red-600',
      payout_fee: 'text-orange-500',
    }
    return colors[type] || 'text-gray-500'
  }, [])

  // Check if event is positive (adds to balance)
  const isPositiveEvent = useCallback((type) => {
    const positive = ['commission_earned', 'payout_failed']
    return positive.includes(type)
  }, [])

  return {
    loading,
    error,
    events,
    totalCount,
    hasMore,
    loadMore,
    refresh,
    getEventIcon,
    getEventColor,
    isPositiveEvent,
  }
}
