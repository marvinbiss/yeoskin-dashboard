/**
 * YEOSKIN DASHBOARD - Session Management Hook
 * Enterprise-grade session handling with timeout and device management
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

// Session timeout in milliseconds (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000
// Activity check interval (1 minute)
const ACTIVITY_CHECK_INTERVAL = 60 * 1000
// Warning before timeout (5 minutes)
const TIMEOUT_WARNING = 5 * 60 * 1000

/**
 * Get device information
 */
const getDeviceInfo = () => {
  const userAgent = navigator.userAgent

  let deviceType = 'unknown'
  let deviceName = 'Unknown Device'
  let browser = 'Unknown'
  let os = 'Unknown'

  // Detect device type and name
  if (/iPhone/.test(userAgent)) {
    deviceType = 'mobile'
    deviceName = 'iPhone'
  } else if (/iPad/.test(userAgent)) {
    deviceType = 'tablet'
    deviceName = 'iPad'
  } else if (/Android/.test(userAgent)) {
    deviceType = /Mobile/.test(userAgent) ? 'mobile' : 'tablet'
    deviceName = 'Android Device'
  } else if (/Windows/.test(userAgent)) {
    deviceType = 'desktop'
    deviceName = 'Windows PC'
  } else if (/Mac/.test(userAgent)) {
    deviceType = 'desktop'
    deviceName = 'Mac'
  } else if (/Linux/.test(userAgent)) {
    deviceType = 'desktop'
    deviceName = 'Linux PC'
  }

  // Detect browser
  if (userAgent.includes('Firefox')) browser = 'Firefox'
  else if (userAgent.includes('Edg')) browser = 'Edge'
  else if (userAgent.includes('Chrome')) browser = 'Chrome'
  else if (userAgent.includes('Safari')) browser = 'Safari'

  // Detect OS
  if (userAgent.includes('Windows NT 10')) os = 'Windows 10/11'
  else if (userAgent.includes('Windows')) os = 'Windows'
  else if (userAgent.includes('Mac OS X')) os = 'macOS'
  else if (userAgent.includes('Linux')) os = 'Linux'
  else if (userAgent.includes('Android')) os = 'Android'
  else if (userAgent.includes('iOS') || userAgent.includes('iPhone')) os = 'iOS'

  return {
    device_name: deviceName,
    device_type: deviceType,
    browser,
    os,
    user_agent: userAgent,
  }
}

/**
 * Session management hook
 */
export const useSession = (options = {}) => {
  const {
    timeout = SESSION_TIMEOUT,
    warningTime = TIMEOUT_WARNING,
    onTimeout = null,
    onWarning = null,
    enabled = true,
  } = options

  const [sessions, setSessions] = useState([])
  const [currentSession, setCurrentSession] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)
  const [remainingTime, setRemainingTime] = useState(null)

  const lastActivityRef = useRef(Date.now())
  const timeoutIdRef = useRef(null)
  const warningIdRef = useRef(null)
  const intervalIdRef = useRef(null)
  const mountedRef = useRef(true) // Track mounted state for timer safety

  /**
   * Update last activity timestamp
   * Fixed: Added mountedRef check to prevent callback execution after unmount
   */
  const updateActivity = useCallback(() => {
    if (!mountedRef.current) return

    lastActivityRef.current = Date.now()
    setShowTimeoutWarning(false)

    // Reset timers
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current)
    if (warningIdRef.current) clearTimeout(warningIdRef.current)

    // Set warning timer with mounted check
    warningIdRef.current = setTimeout(() => {
      if (!mountedRef.current) return
      setShowTimeoutWarning(true)
      if (onWarning) onWarning()
    }, timeout - warningTime)

    // Set timeout timer with mounted check
    timeoutIdRef.current = setTimeout(() => {
      if (!mountedRef.current) return
      if (onTimeout) onTimeout()
    }, timeout)
  }, [timeout, warningTime, onTimeout, onWarning])

  /**
   * Create a new session record
   */
  const createSession = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const deviceInfo = getDeviceInfo()

      const { data, error: insertError } = await supabase
        .from('user_sessions')
        .insert({
          user_id: user.id,
          session_token: crypto.randomUUID(),
          ...deviceInfo,
          is_current: true,
          last_activity: new Date().toISOString(),
          expires_at: new Date(Date.now() + timeout).toISOString(),
        })
        .select()
        .single()

      if (insertError) {
        // Table might not exist yet, fail silently
        console.warn('Session creation skipped:', insertError.message)
        return null
      }

      setCurrentSession(data)
      return data
    } catch (err) {
      console.error('Session creation error:', err)
      return null
    }
  }, [timeout])

  /**
   * Fetch all active sessions for current user
   */
  const fetchSessions = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setSessions([])
        return []
      }

      const { data, error: fetchError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_activity', { ascending: false })

      if (fetchError) {
        // Table might not exist yet
        console.warn('Sessions fetch skipped:', fetchError.message)
        return []
      }

      setSessions(data || [])
      return data || []
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Update session last activity
   */
  const updateSessionActivity = useCallback(async () => {
    if (!currentSession?.id) return

    try {
      await supabase
        .from('user_sessions')
        .update({
          last_activity: new Date().toISOString(),
        })
        .eq('id', currentSession.id)
    } catch (err) {
      console.warn('Session activity update failed:', err)
    }
  }, [currentSession])

  /**
   * Terminate a specific session
   */
  const terminateSession = useCallback(async (sessionId) => {
    try {
      const { error: updateError } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', sessionId)

      if (updateError) throw updateError

      // If terminating current session, trigger logout
      if (sessionId === currentSession?.id) {
        await supabase.auth.signOut()
      } else {
        // Refresh sessions list
        await fetchSessions()
      }

      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [currentSession, fetchSessions])

  /**
   * Terminate all other sessions
   */
  const terminateOtherSessions = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { error: updateError } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true)
        .neq('id', currentSession?.id)

      if (updateError) throw updateError

      await fetchSessions()
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [currentSession, fetchSessions])

  /**
   * Extend current session
   */
  const extendSession = useCallback(() => {
    updateActivity()
    setShowTimeoutWarning(false)
    updateSessionActivity()
  }, [updateActivity, updateSessionActivity])

  // Set up activity listeners
  // Fixed: Proper mountedRef management to prevent timer leaks
  useEffect(() => {
    if (!enabled) return

    mountedRef.current = true
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']

    const handleActivity = () => {
      if (mountedRef.current) {
        updateActivity()
      }
    }

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    // Initial activity
    updateActivity()

    // Periodic session activity update with mounted check
    intervalIdRef.current = setInterval(() => {
      if (mountedRef.current) {
        updateSessionActivity()
      }
    }, ACTIVITY_CHECK_INTERVAL)

    return () => {
      mountedRef.current = false
      events.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current)
      if (warningIdRef.current) clearTimeout(warningIdRef.current)
      if (intervalIdRef.current) clearInterval(intervalIdRef.current)
    }
  }, [enabled, updateActivity, updateSessionActivity])

  // Update remaining time for warning display
  useEffect(() => {
    if (!showTimeoutWarning) {
      setRemainingTime(null)
      return
    }

    const updateRemaining = () => {
      const elapsed = Date.now() - lastActivityRef.current
      const remaining = Math.max(0, timeout - elapsed)
      setRemainingTime(Math.ceil(remaining / 1000))
    }

    updateRemaining()
    const interval = setInterval(updateRemaining, 1000)

    return () => clearInterval(interval)
  }, [showTimeoutWarning, timeout])

  return {
    sessions,
    currentSession,
    loading,
    error,
    showTimeoutWarning,
    remainingTime,
    createSession,
    fetchSessions,
    terminateSession,
    terminateOtherSessions,
    extendSession,
    updateActivity,
  }
}

export default useSession
