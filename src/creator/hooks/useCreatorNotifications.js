import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Hook for managing creator notifications with real-time updates
 */
export const useCreatorNotifications = (creatorId = null, options = {}) => {
  const { initialLimit = 20, unreadOnly = false } = options

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: rpcError } = await supabase.rpc('get_creator_notifications', {
        p_creator_id: creatorId,
        p_limit: initialLimit,
        p_unread_only: unreadOnly
      })

      if (rpcError) {
        throw rpcError
      }

      if (data) {
        setNotifications(data.notifications || [])
        setUnreadCount(data.unread_count || 0)
      }
    } catch (err) {
      console.error('Error fetching notifications:', err)
      setError(err.message || 'Erreur lors du chargement des notifications')
    } finally {
      setLoading(false)
    }
  }, [creatorId, initialLimit, unreadOnly])

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const { error: rpcError } = await supabase.rpc('mark_notification_read', {
        p_notification_id: notificationId
      })

      if (rpcError) {
        throw rpcError
      }

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))

      return { success: true }
    } catch (err) {
      console.error('Error marking notification as read:', err)
      return { success: false, error: err.message }
    }
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const { data, error: rpcError } = await supabase.rpc('mark_all_notifications_read')

      if (rpcError) {
        throw rpcError
      }

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      )
      setUnreadCount(0)

      return { success: true, count: data }
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
      return { success: false, error: err.message }
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Real-time subscription for new notifications
  useEffect(() => {
    const channel = supabase
      .channel('creator-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'creator_notifications',
        },
        (payload) => {
          // Add new notification to the list
          if (!creatorId || payload.new.creator_id === creatorId) {
            const newNotif = {
              id: payload.new.id,
              type: payload.new.type,
              title: payload.new.title,
              message: payload.new.message,
              amount: payload.new.amount,
              reference_id: payload.new.reference_id,
              read: payload.new.read,
              created_at: payload.new.created_at,
            }

            setNotifications(prev => [newNotif, ...prev])
            setUnreadCount(prev => prev + 1)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [creatorId])

  // Get icon for notification type
  const getNotificationIcon = useCallback((type) => {
    const icons = {
      commission_earned: 'plus-circle',
      commission_locked: 'lock',
      commission_payable: 'unlock',
      payout_scheduled: 'calendar',
      payout_sent: 'send',
      payout_completed: 'check-circle',
      payout_failed: 'alert-circle',
      welcome: 'star',
      info: 'info',
    }
    return icons[type] || 'bell'
  }, [])

  // Get color for notification type
  const getNotificationColor = useCallback((type) => {
    const colors = {
      commission_earned: 'text-green-500 bg-green-50',
      commission_locked: 'text-yellow-500 bg-yellow-50',
      commission_payable: 'text-blue-500 bg-blue-50',
      payout_scheduled: 'text-blue-500 bg-blue-50',
      payout_sent: 'text-blue-600 bg-blue-50',
      payout_completed: 'text-green-600 bg-green-50',
      payout_failed: 'text-red-600 bg-red-50',
      welcome: 'text-purple-500 bg-purple-50',
      info: 'text-gray-500 bg-gray-50',
    }
    return colors[type] || 'text-gray-500 bg-gray-50'
  }, [])

  return {
    loading,
    error,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
    getNotificationIcon,
    getNotificationColor,
  }
}
