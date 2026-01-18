/**
 * Hook for fetching system health data
 */
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useSystemHealth = () => {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchHealth = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('system_health')
        .select('*')
        .single()

      if (fetchError) throw fetchError

      setHealth(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching system health:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()

    // Refresh every 30 seconds
    const interval = setInterval(fetchHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  return {
    health,
    loading,
    error,
    refresh: fetchHealth
  }
}
