/**
 * YEOSKIN DASHBOARD - Notification Center Component
 * Real-time notifications with dropdown panel
 */

import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Bell,
  X,
  Check,
  CheckCheck,
  AlertCircle,
  Info,
  AlertTriangle,
  DollarSign,
  Users,
  FileText,
  Trash2
} from 'lucide-react'
import clsx from 'clsx'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

// Notification types with icons and colors
const NOTIFICATION_TYPES = {
  info: { icon: Info, color: 'text-primary-600', bg: 'bg-primary-100 dark:bg-primary-900/30' },
  success: { icon: Check, color: 'text-success-600', bg: 'bg-success-100 dark:bg-success-900/30' },
  warning: { icon: AlertTriangle, color: 'text-warning-600', bg: 'bg-warning-100 dark:bg-warning-900/30' },
  error: { icon: AlertCircle, color: 'text-danger-600', bg: 'bg-danger-100 dark:bg-danger-900/30' },
  payment: { icon: DollarSign, color: 'text-success-600', bg: 'bg-success-100 dark:bg-success-900/30' },
  user: { icon: Users, color: 'text-primary-600', bg: 'bg-primary-100 dark:bg-primary-900/30' },
  batch: { icon: FileText, color: 'text-primary-600', bg: 'bg-primary-100 dark:bg-primary-900/30' },
}

export const NotificationCenter = () => {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const panelRef = useRef(null)

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        // Table might not exist yet
        console.warn('Notifications fetch skipped:', error.message)
        setNotifications(getDemoNotifications())
        return
      }

      setNotifications(data || [])
    } catch (err) {
      console.error('Notifications error:', err)
      setNotifications(getDemoNotifications())
    } finally {
      setLoading(false)
    }
  }

  // Demo notifications when table doesn't exist
  const getDemoNotifications = () => [
    {
      id: '1',
      type: 'payment',
      title: 'Paiement réussi',
      message: 'Le batch #123 a été envoyé avec succès',
      read: false,
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      type: 'user',
      title: 'Nouveau créateur',
      message: 'jean@example.com a rejoint la plateforme',
      read: true,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      type: 'info',
      title: 'Mise à jour système',
      message: 'De nouvelles fonctionnalités sont disponibles',
      read: true,
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ]

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user) return

    fetchNotifications()

    // Subscribe to new notifications
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev])
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Mark as read
  const markAsRead = async (id) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
    } catch (err) {
      // Demo mode - just update locally
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      )
    } catch (err) {
      // Demo mode
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      )
    }
  }

  // Delete notification
  const deleteNotification = async (id) => {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', id)

      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (err) {
      // Demo mode
      setNotifications(prev => prev.filter(n => n.id !== id))
    }
  }

  // Count unread
  const unreadCount = notifications.filter(n => !n.read).length

  // Get notification type config
  const getTypeConfig = (type) => NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.info

  // Format time
  const formatTime = (date) => {
    const now = new Date()
    const notifDate = new Date(date)
    const diffMs = now - notifDate
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays < 7) return `Il y a ${diffDays}j`
    return format(notifDate, 'dd MMM', { locale: fr })
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-danger-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" />
                  Tout marquer lu
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Aucune notification</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const config = getTypeConfig(notification.type)
                const Icon = config.icon

                return (
                  <div
                    key={notification.id}
                    className={clsx(
                      'px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
                      !notification.read && 'bg-primary-50/50 dark:bg-primary-900/10'
                    )}
                  >
                    <div className="flex gap-3">
                      <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', config.bg)}>
                        <Icon className={clsx('w-4 h-4', config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={clsx(
                            'text-sm',
                            notification.read
                              ? 'text-gray-700 dark:text-gray-300'
                              : 'text-gray-900 dark:text-white font-medium'
                          )}>
                            {notification.title}
                          </p>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {formatTime(notification.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-primary-600 hover:text-primary-700"
                            >
                              Marquer lu
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-xs text-gray-400 hover:text-danger-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-center">
              <button className="text-xs text-primary-600 hover:text-primary-700">
                Voir toutes les notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationCenter
