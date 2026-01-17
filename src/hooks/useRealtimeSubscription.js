/**
 * YEOSKIN DASHBOARD - Realtime Subscription Hook
 * ============================================================================
 * Robust Supabase realtime subscription management with:
 * - Automatic reconnection
 * - Error handling
 * - Cleanup on unmount
 * - Connection state tracking
 * ============================================================================
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// Subscription states
export const SUBSCRIPTION_STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
  RECONNECTING: 'reconnecting'
}

/**
 * Hook for managing Supabase realtime subscriptions with error handling
 * @param {object} options - Subscription options
 * @param {string} options.channel - Channel name
 * @param {string} options.table - Table to subscribe to
 * @param {string} options.event - Event type ('*', 'INSERT', 'UPDATE', 'DELETE')
 * @param {string} options.filter - Optional filter (e.g., 'id=eq.123')
 * @param {function} options.onPayload - Callback for received payloads
 * @param {function} options.onError - Callback for errors
 * @param {function} options.onStatusChange - Callback for status changes
 * @param {boolean} options.enabled - Enable/disable subscription
 * @returns {object} Subscription state and controls
 */
export const useRealtimeSubscription = (options) => {
  const {
    channel: channelName,
    table,
    event = '*',
    filter = null,
    onPayload,
    onError,
    onStatusChange,
    enabled = true
  } = options

  const [status, setStatus] = useState(SUBSCRIPTION_STATUS.DISCONNECTED)
  const [error, setError] = useState(null)
  const [lastPayload, setLastPayload] = useState(null)
  const subscriptionRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const mountedRef = useRef(true)
  const reconnectAttemptsRef = useRef(0)
  const MAX_RECONNECT_ATTEMPTS = 5
  const RECONNECT_BASE_DELAY = 1000

  // Update status safely (checks if mounted)
  const updateStatus = useCallback((newStatus) => {
    if (mountedRef.current) {
      setStatus(newStatus)
      onStatusChange?.(newStatus)
    }
  }, [onStatusChange])

  // Handle errors safely
  const handleError = useCallback((err) => {
    if (!mountedRef.current) return

    const errorMessage = err?.message || 'Unknown subscription error'
    console.error(`[Realtime] Subscription error on ${channelName}:`, errorMessage)

    setError(errorMessage)
    updateStatus(SUBSCRIPTION_STATUS.ERROR)
    onError?.(err)
  }, [channelName, updateStatus, onError])

  // Handle payload safely
  const handlePayload = useCallback((payload) => {
    if (!mountedRef.current) return

    setLastPayload(payload)
    onPayload?.(payload)
  }, [onPayload])

  // Reconnect with exponential backoff
  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current || !enabled) return
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error(`[Realtime] Max reconnection attempts reached for ${channelName}`)
      handleError(new Error('Max reconnection attempts reached'))
      return
    }

    const delay = RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttemptsRef.current)
    reconnectAttemptsRef.current++

    console.log(`[Realtime] Scheduling reconnect for ${channelName} in ${delay}ms (attempt ${reconnectAttemptsRef.current})`)

    updateStatus(SUBSCRIPTION_STATUS.RECONNECTING)

    reconnectTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current && enabled) {
        subscribe()
      }
    }, delay)
  }, [channelName, enabled, handleError, updateStatus])

  // Main subscription function
  const subscribe = useCallback(() => {
    if (!enabled || !mountedRef.current) return

    // Clean up existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
      subscriptionRef.current = null
    }

    updateStatus(SUBSCRIPTION_STATUS.CONNECTING)
    setError(null)

    try {
      // Build channel configuration
      const channelConfig = {
        event: 'postgres_changes',
        schema: 'public',
        table
      }

      if (filter) {
        channelConfig.filter = filter
      }

      // Create subscription
      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', channelConfig, (payload) => {
          // Reset reconnect counter on successful message
          reconnectAttemptsRef.current = 0
          handlePayload(payload)
        })
        .on('system', {}, (status) => {
          console.log(`[Realtime] System status for ${channelName}:`, status)
        })
        .subscribe((status, err) => {
          if (!mountedRef.current) return

          if (status === 'SUBSCRIBED') {
            console.log(`[Realtime] Subscribed to ${channelName}`)
            reconnectAttemptsRef.current = 0
            updateStatus(SUBSCRIPTION_STATUS.CONNECTED)
          } else if (status === 'CLOSED') {
            console.log(`[Realtime] Connection closed for ${channelName}`)
            updateStatus(SUBSCRIPTION_STATUS.DISCONNECTED)
            scheduleReconnect()
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`[Realtime] Channel error for ${channelName}:`, err)
            handleError(err || new Error('Channel error'))
            scheduleReconnect()
          } else if (status === 'TIMED_OUT') {
            console.warn(`[Realtime] Connection timed out for ${channelName}`)
            handleError(new Error('Connection timed out'))
            scheduleReconnect()
          }
        })

      subscriptionRef.current = channel

    } catch (err) {
      handleError(err)
      scheduleReconnect()
    }
  }, [channelName, table, event, filter, enabled, handlePayload, handleError, updateStatus, scheduleReconnect])

  // Unsubscribe function
  const unsubscribe = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (subscriptionRef.current) {
      console.log(`[Realtime] Unsubscribing from ${channelName}`)
      subscriptionRef.current.unsubscribe()
      subscriptionRef.current = null
    }

    if (mountedRef.current) {
      updateStatus(SUBSCRIPTION_STATUS.DISCONNECTED)
    }
  }, [channelName, updateStatus])

  // Manual reconnect
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0
    unsubscribe()
    subscribe()
  }, [subscribe, unsubscribe])

  // Effect for subscription lifecycle
  useEffect(() => {
    mountedRef.current = true

    if (enabled) {
      subscribe()
    }

    return () => {
      mountedRef.current = false
      unsubscribe()
    }
  }, [enabled, subscribe, unsubscribe])

  return {
    status,
    error,
    lastPayload,
    isConnected: status === SUBSCRIPTION_STATUS.CONNECTED,
    isConnecting: status === SUBSCRIPTION_STATUS.CONNECTING || status === SUBSCRIPTION_STATUS.RECONNECTING,
    isError: status === SUBSCRIPTION_STATUS.ERROR,
    reconnect,
    unsubscribe
  }
}

/**
 * Hook for subscribing to multiple tables at once
 * @param {Array<object>} subscriptions - Array of subscription configs
 * @param {object} options - Shared options
 * @returns {object} Combined subscription state
 */
export const useMultipleSubscriptions = (subscriptions, options = {}) => {
  const { enabled = true } = options
  const [states, setStates] = useState({})

  useEffect(() => {
    if (!enabled) return

    const channels = subscriptions.map((config, index) => {
      const channelName = config.channel || `multi-sub-${index}`

      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: config.event || '*',
          schema: 'public',
          table: config.table,
          filter: config.filter
        }, (payload) => {
          config.onPayload?.(payload)
        })
        .subscribe((status, err) => {
          setStates(prev => ({
            ...prev,
            [channelName]: { status, error: err }
          }))
        })

      return channel
    })

    return () => {
      channels.forEach(channel => {
        channel.unsubscribe()
      })
    }
  }, [subscriptions, enabled])

  const allConnected = Object.values(states).every(s => s.status === 'SUBSCRIBED')
  const anyError = Object.values(states).some(s => s.error)

  return {
    states,
    allConnected,
    anyError
  }
}

export default useRealtimeSubscription
