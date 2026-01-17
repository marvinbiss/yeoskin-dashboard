/**
 * YEOSKIN DASHBOARD - Audit Logging Hook
 * Enterprise-grade audit trail system
 */

import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// Action types
export const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  VIEW: 'VIEW',
  EXPORT: 'EXPORT',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  ROLE_CHANGE: 'ROLE_CHANGE',
  APPROVE: 'APPROVE',
  EXECUTE: 'EXECUTE',
}

// Resource types
export const RESOURCE_TYPES = {
  ADMIN: 'admin',
  CREATOR: 'creator',
  BATCH: 'batch',
  TRANSFER: 'transfer',
  COMMISSION: 'commission',
  SETTINGS: 'settings',
  SESSION: 'session',
  SYSTEM: 'system',
}

/**
 * Get client information for logging
 */
const getClientInfo = () => {
  const userAgent = navigator.userAgent
  let deviceType = 'unknown'
  let browser = 'unknown'
  let os = 'unknown'

  // Detect device type
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
    deviceType = /iPad/.test(userAgent) ? 'tablet' : 'mobile'
  } else {
    deviceType = 'desktop'
  }

  // Detect browser
  if (userAgent.includes('Firefox')) browser = 'Firefox'
  else if (userAgent.includes('Chrome')) browser = 'Chrome'
  else if (userAgent.includes('Safari')) browser = 'Safari'
  else if (userAgent.includes('Edge')) browser = 'Edge'

  // Detect OS
  if (userAgent.includes('Windows')) os = 'Windows'
  else if (userAgent.includes('Mac')) os = 'macOS'
  else if (userAgent.includes('Linux')) os = 'Linux'
  else if (userAgent.includes('Android')) os = 'Android'
  else if (userAgent.includes('iOS')) os = 'iOS'

  return { userAgent, deviceType, browser, os }
}

/**
 * Hook for audit logging
 */
export const useAuditLog = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Log an audit action
   */
  const logAction = useCallback(async ({
    action,
    resourceType,
    resourceId = null,
    resourceName = null,
    oldValues = null,
    newValues = null,
    metadata = {},
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const clientInfo = getClientInfo()

      const { data, error: insertError } = await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          user_email: user.email,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          resource_name: resourceName,
          old_values: oldValues,
          new_values: newValues,
          user_agent: clientInfo.userAgent,
          metadata: {
            ...metadata,
            client: clientInfo,
          },
        })
        .select()
        .single()

      if (insertError) {
        console.error('Audit log error:', insertError)
        return null
      }

      return data
    } catch (err) {
      console.error('Audit log exception:', err)
      return null
    }
  }, [])

  /**
   * Fetch audit logs with filters
   */
  const fetchAuditLogs = useCallback(async ({
    page = 1,
    pageSize = 50,
    action = null,
    resourceType = null,
    resourceId = null,
    userId = null,
    startDate = null,
    endDate = null,
  } = {}) => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (action) query = query.eq('action', action)
      if (resourceType) query = query.eq('resource_type', resourceType)
      if (resourceId) query = query.eq('resource_id', resourceId)
      if (userId) query = query.eq('user_id', userId)
      if (startDate) query = query.gte('created_at', startDate)
      if (endDate) query = query.lte('created_at', endDate)

      const { data, error: fetchError, count } = await query

      if (fetchError) throw fetchError

      return {
        logs: data || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      }
    } catch (err) {
      setError(err.message)
      return { logs: [], total: 0, page: 1, pageSize, totalPages: 0 }
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Get audit statistics
   */
  const getAuditStats = useCallback(async (days = 7) => {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error: fetchError } = await supabase
        .from('audit_logs')
        .select('action, resource_type, created_at')
        .gte('created_at', startDate.toISOString())

      if (fetchError) throw fetchError

      // Calculate stats
      const stats = {
        totalActions: data?.length || 0,
        byAction: {},
        byResource: {},
        byDay: {},
      }

      data?.forEach(log => {
        // By action
        stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1
        // By resource
        stats.byResource[log.resource_type] = (stats.byResource[log.resource_type] || 0) + 1
        // By day
        const day = new Date(log.created_at).toISOString().split('T')[0]
        stats.byDay[day] = (stats.byDay[day] || 0) + 1
      })

      return stats
    } catch (err) {
      console.error('Audit stats error:', err)
      return null
    }
  }, [])

  // Convenience methods for common actions
  const logCreate = (resourceType, resourceId, resourceName, newValues, metadata) =>
    logAction({ action: AUDIT_ACTIONS.CREATE, resourceType, resourceId, resourceName, newValues, metadata })

  const logUpdate = (resourceType, resourceId, resourceName, oldValues, newValues, metadata) =>
    logAction({ action: AUDIT_ACTIONS.UPDATE, resourceType, resourceId, resourceName, oldValues, newValues, metadata })

  const logDelete = (resourceType, resourceId, resourceName, oldValues, metadata) =>
    logAction({ action: AUDIT_ACTIONS.DELETE, resourceType, resourceId, resourceName, oldValues, metadata })

  const logView = (resourceType, resourceId, resourceName, metadata) =>
    logAction({ action: AUDIT_ACTIONS.VIEW, resourceType, resourceId, resourceName, metadata })

  const logExport = (resourceType, metadata) =>
    logAction({ action: AUDIT_ACTIONS.EXPORT, resourceType, metadata })

  const logLogin = (success = true, metadata = {}) =>
    logAction({
      action: success ? AUDIT_ACTIONS.LOGIN : AUDIT_ACTIONS.LOGIN_FAILED,
      resourceType: RESOURCE_TYPES.SESSION,
      metadata,
    })

  const logLogout = (metadata = {}) =>
    logAction({
      action: AUDIT_ACTIONS.LOGOUT,
      resourceType: RESOURCE_TYPES.SESSION,
      metadata,
    })

  return {
    loading,
    error,
    logAction,
    logCreate,
    logUpdate,
    logDelete,
    logView,
    logExport,
    logLogin,
    logLogout,
    fetchAuditLogs,
    getAuditStats,
    AUDIT_ACTIONS,
    RESOURCE_TYPES,
  }
}

export default useAuditLog
