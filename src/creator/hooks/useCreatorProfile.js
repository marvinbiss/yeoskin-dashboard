/**
 * useCreatorProfile - Hook for managing creator profile
 * Handles profile fetching, updating, image upload, and analytics
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useCreatorAuth } from '../contexts/CreatorAuthContext'

export const useCreatorProfile = () => {
  const { creator } = useCreatorAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Fetch profile
  const fetchProfile = useCallback(async () => {
    if (!creator?.id) return

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('creator_profiles')
        .select('*')
        .eq('creator_id', creator.id)
        .single()

      if (fetchError) {
        // Profile might not exist yet, create it
        if (fetchError.code === 'PGRST116') {
          const newProfile = await createProfile()
          setProfile(newProfile)
        } else {
          throw fetchError
        }
      } else {
        setProfile(data)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [creator?.id])

  // Create profile if doesn't exist
  const createProfile = async () => {
    const email = creator?.email || ''
    const username = email.split('@')[0]
    const slug = username.toLowerCase().replace(/[^a-z0-9]/g, '')

    const { data, error } = await supabase
      .from('creator_profiles')
      .insert({
        creator_id: creator.id,
        slug: slug + '-' + Date.now().toString(36),
        display_name: username.charAt(0).toUpperCase() + username.slice(1),
        bio: 'Passionnee de beaute coreenne',
        is_active: true,
        is_public: false
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Update profile
  const updateProfile = useCallback(async (updates) => {
    if (!profile?.id) return { success: false, error: 'No profile found' }

    try {
      setSaving(true)
      setError(null)

      // Validate updates
      if (updates.bio && updates.bio.length > 500) {
        throw new Error('La bio ne peut pas depasser 500 caracteres')
      }
      if (updates.tagline && updates.tagline.length > 100) {
        throw new Error('Le tagline ne peut pas depasser 100 caracteres')
      }

      const { data, error: updateError } = await supabase
        .from('creator_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
        .select()
        .single()

      if (updateError) throw updateError

      setProfile(data)
      return { success: true, data }
    } catch (err) {
      console.error('Error updating profile:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setSaving(false)
    }
  }, [profile?.id])

  // Update slug (URL personnalisee)
  const updateSlug = useCallback(async (newSlug) => {
    if (!profile?.id) return { success: false, error: 'No profile found' }

    try {
      setSaving(true)
      setError(null)

      // Validate slug format
      const cleanSlug = newSlug.toLowerCase().replace(/[^a-z0-9-]/g, '')
      if (cleanSlug.length < 3) {
        throw new Error('Le slug doit contenir au moins 3 caracteres')
      }
      if (cleanSlug.length > 30) {
        throw new Error('Le slug ne peut pas depasser 30 caracteres')
      }

      // Check if slug is available
      const { data: existing } = await supabase
        .from('creator_profiles')
        .select('id')
        .eq('slug', cleanSlug)
        .neq('id', profile.id)
        .single()

      if (existing) {
        throw new Error('Cette URL est deja utilisee')
      }

      const { data, error: updateError } = await supabase
        .from('creator_profiles')
        .update({
          slug: cleanSlug,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
        .select()
        .single()

      if (updateError) throw updateError

      setProfile(data)
      return { success: true, data }
    } catch (err) {
      console.error('Error updating slug:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setSaving(false)
    }
  }, [profile?.id])

  // Toggle publish status
  const togglePublish = useCallback(async () => {
    if (!profile?.id) return { success: false, error: 'No profile found' }

    try {
      setSaving(true)
      setError(null)

      const newStatus = !profile.is_public

      const { data, error: updateError } = await supabase
        .from('creator_profiles')
        .update({
          is_public: newStatus,
          published_at: newStatus ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
        .select()
        .single()

      if (updateError) throw updateError

      setProfile(data)
      return { success: true, data, isPublic: newStatus }
    } catch (err) {
      console.error('Error toggling publish:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setSaving(false)
    }
  }, [profile?.id, profile?.is_public])

  // Upload image (profile or banner)
  const uploadImage = useCallback(async (file, type = 'profile') => {
    if (!profile?.id || !creator?.id) return { success: false, error: 'No profile found' }

    try {
      setSaving(true)
      setError(null)

      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Le fichier doit etre une image')
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('L\'image ne peut pas depasser 5MB')
      }

      // Generate unique filename
      const ext = file.name.split('.').pop()
      const filename = `${creator.id}/${type}-${Date.now()}.${ext}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('creator-profiles')
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('creator-profiles')
        .getPublicUrl(filename)

      const imageUrl = urlData.publicUrl

      // Update profile with new image URL
      const updateField = type === 'profile' ? 'profile_image_url' : 'banner_image_url'
      const { data, error: updateError } = await supabase
        .from('creator_profiles')
        .update({
          [updateField]: imageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
        .select()
        .single()

      if (updateError) throw updateError

      setProfile(data)
      return { success: true, data, imageUrl }
    } catch (err) {
      console.error('Error uploading image:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setSaving(false)
    }
  }, [profile?.id, creator?.id])

  // Update featured products
  const updateFeaturedProducts = useCallback(async (productIds) => {
    if (!profile?.id) return { success: false, error: 'No profile found' }

    try {
      setSaving(true)
      setError(null)

      // Limit to 12 products
      const limitedProducts = productIds.slice(0, 12)

      const { data, error: updateError } = await supabase
        .from('creator_profiles')
        .update({
          featured_products: limitedProducts,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
        .select()
        .single()

      if (updateError) throw updateError

      setProfile(data)
      return { success: true, data }
    } catch (err) {
      console.error('Error updating featured products:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setSaving(false)
    }
  }, [profile?.id])

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return {
    profile,
    loading,
    saving,
    error,
    refresh: fetchProfile,
    updateProfile,
    updateSlug,
    togglePublish,
    uploadImage,
    updateFeaturedProducts
  }
}

/**
 * useProfileAnalytics - Hook for profile analytics
 */
export const useProfileAnalytics = (days = 30) => {
  const { creator } = useCreatorAuth()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAnalytics = useCallback(async () => {
    if (!creator?.id) return

    try {
      setLoading(true)
      setError(null)

      // Get profile ID first
      const { data: profile } = await supabase
        .from('creator_profiles')
        .select('id')
        .eq('creator_id', creator.id)
        .single()

      if (!profile) throw new Error('Profile not found')

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Fetch views
      const { data: views, error: viewsError } = await supabase
        .from('profile_views')
        .select('viewed_at, device_type, referrer')
        .eq('profile_id', profile.id)
        .gte('viewed_at', startDate.toISOString())
        .order('viewed_at', { ascending: true })

      if (viewsError) throw viewsError

      // Fetch clicks
      const { data: clicks, error: clicksError } = await supabase
        .from('profile_clicks')
        .select('clicked_at, product_id, converted, conversion_value')
        .eq('profile_id', profile.id)
        .gte('clicked_at', startDate.toISOString())
        .order('clicked_at', { ascending: true })

      if (clicksError) throw clicksError

      // Process analytics
      const totalViews = views?.length || 0
      const uniqueVisitors = new Set(views?.map(v => v.session_id)).size
      const totalClicks = clicks?.length || 0
      const conversions = clicks?.filter(c => c.converted).length || 0
      const conversionRate = totalClicks > 0 ? (conversions / totalClicks * 100).toFixed(1) : 0
      const totalRevenue = clicks?.reduce((sum, c) => sum + (c.conversion_value || 0), 0) || 0

      // Views by day
      const viewsByDay = {}
      views?.forEach(v => {
        const date = new Date(v.viewed_at).toISOString().split('T')[0]
        viewsByDay[date] = (viewsByDay[date] || 0) + 1
      })

      // Device breakdown
      const deviceBreakdown = {}
      views?.forEach(v => {
        const device = v.device_type || 'unknown'
        deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1
      })

      // Top referrers
      const referrerCounts = {}
      views?.forEach(v => {
        const ref = v.referrer || 'direct'
        referrerCounts[ref] = (referrerCounts[ref] || 0) + 1
      })
      const topReferrers = Object.entries(referrerCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([referrer, count]) => ({ referrer, count }))

      setAnalytics({
        totalViews,
        uniqueVisitors,
        totalClicks,
        conversions,
        conversionRate,
        totalRevenue,
        viewsByDay: Object.entries(viewsByDay).map(([date, count]) => ({ date, count })),
        deviceBreakdown: Object.entries(deviceBreakdown).map(([device, count]) => ({ device, count })),
        topReferrers
      })
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [creator?.id, days])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  return {
    analytics,
    loading,
    error,
    refresh: fetchAnalytics
  }
}

export default useCreatorProfile
