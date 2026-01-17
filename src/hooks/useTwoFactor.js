/**
 * YEOSKIN DASHBOARD - Two-Factor Authentication Hook
 * TOTP-based 2FA implementation
 */

import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// Simple TOTP implementation (in production, use a library like otplib)
const generateSecret = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let secret = ''
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return secret
}

const base32ToHex = (base32) => {
  const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits = ''
  let hex = ''

  for (let i = 0; i < base32.length; i++) {
    const val = base32chars.indexOf(base32.charAt(i).toUpperCase())
    bits += val.toString(2).padStart(5, '0')
  }

  for (let i = 0; i + 4 <= bits.length; i += 4) {
    hex += parseInt(bits.substr(i, 4), 2).toString(16)
  }
  return hex
}

// Generate TOTP code
const generateTOTP = async (secret, time = Date.now()) => {
  const epoch = Math.floor(time / 30000)
  const timeHex = epoch.toString(16).padStart(16, '0')
  const secretHex = base32ToHex(secret)

  // Use Web Crypto API for HMAC-SHA1
  const keyData = new Uint8Array(secretHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))
  const timeData = new Uint8Array(timeHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    )

    const signature = await crypto.subtle.sign('HMAC', key, timeData)
    const hmac = new Uint8Array(signature)

    const offset = hmac[hmac.length - 1] & 0xf
    const code = (
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)
    ) % 1000000

    return code.toString().padStart(6, '0')
  } catch (err) {
    console.error('TOTP generation error:', err)
    return null
  }
}

// Verify TOTP code with time window
const verifyTOTP = async (secret, code, window = 1) => {
  const now = Date.now()

  for (let i = -window; i <= window; i++) {
    const time = now + (i * 30000)
    const expectedCode = await generateTOTP(secret, time)
    if (expectedCode === code) {
      return true
    }
  }
  return false
}

/**
 * Two-Factor Authentication Hook
 */
export const useTwoFactor = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Check if 2FA is enabled for current user
   */
  const is2FAEnabled = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { data, error } = await supabase
        .from('admin_profiles')
        .select('two_factor_enabled, two_factor_secret')
        .eq('id', user.id)
        .maybeSingle()

      if (error) throw error
      return data?.two_factor_enabled || false
    } catch (err) {
      console.error('2FA check error:', err)
      return false
    }
  }, [])

  /**
   * Setup 2FA - Generate secret and QR code URL
   */
  const setup2FA = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const secret = generateSecret()

      // Store secret temporarily (not enabled yet)
      const { error: updateError } = await supabase
        .from('admin_profiles')
        .update({
          two_factor_secret: secret,
          two_factor_enabled: false,
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Generate QR code URL for authenticator apps
      const issuer = 'Yeoskin Dashboard'
      const otpAuthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(user.email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`

      return {
        secret,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpAuthUrl)}`,
        manualEntry: secret,
      }
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Verify and enable 2FA
   */
  const enable2FA = useCallback(async (code) => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Get the stored secret
      const { data: profile, error: fetchError } = await supabase
        .from('admin_profiles')
        .select('two_factor_secret')
        .eq('id', user.id)
        .single()

      if (fetchError) throw fetchError
      if (!profile?.two_factor_secret) throw new Error('2FA non configuré')

      // Verify the code
      const isValid = await verifyTOTP(profile.two_factor_secret, code)
      if (!isValid) throw new Error('Code invalide')

      // Generate backup codes
      const backupCodes = Array.from({ length: 8 }, () =>
        Math.random().toString(36).substring(2, 10).toUpperCase()
      )

      // Enable 2FA
      const { error: updateError } = await supabase
        .from('admin_profiles')
        .update({
          two_factor_enabled: true,
          two_factor_backup_codes: backupCodes,
          two_factor_enabled_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      return { success: true, backupCodes }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Disable 2FA
   */
  const disable2FA = useCallback(async (code) => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Get the stored secret
      const { data: profile, error: fetchError } = await supabase
        .from('admin_profiles')
        .select('two_factor_secret')
        .eq('id', user.id)
        .single()

      if (fetchError) throw fetchError

      // Verify the code
      const isValid = await verifyTOTP(profile.two_factor_secret, code)
      if (!isValid) throw new Error('Code invalide')

      // Disable 2FA
      const { error: updateError } = await supabase
        .from('admin_profiles')
        .update({
          two_factor_enabled: false,
          two_factor_secret: null,
          two_factor_backup_codes: null,
          two_factor_enabled_at: null,
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Verify 2FA code during login
   */
  const verify2FA = useCallback(async (userId, code) => {
    setLoading(true)
    setError(null)

    try {
      // Get user's 2FA secret
      const { data: profile, error: fetchError } = await supabase
        .from('admin_profiles')
        .select('two_factor_secret, two_factor_backup_codes')
        .eq('id', userId)
        .single()

      if (fetchError) throw fetchError
      if (!profile?.two_factor_secret) throw new Error('2FA non configuré')

      // Try TOTP code first
      const isValidTOTP = await verifyTOTP(profile.two_factor_secret, code)
      if (isValidTOTP) {
        return { success: true, method: 'totp' }
      }

      // Try backup code
      const backupCodes = profile.two_factor_backup_codes || []
      const codeIndex = backupCodes.indexOf(code.toUpperCase())

      if (codeIndex !== -1) {
        // Remove used backup code
        const newBackupCodes = backupCodes.filter((_, i) => i !== codeIndex)
        await supabase
          .from('admin_profiles')
          .update({ two_factor_backup_codes: newBackupCodes })
          .eq('id', userId)

        return { success: true, method: 'backup', remainingCodes: newBackupCodes.length }
      }

      throw new Error('Code invalide')
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Regenerate backup codes
   */
  const regenerateBackupCodes = useCallback(async (code) => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Verify current 2FA code first
      const { data: profile } = await supabase
        .from('admin_profiles')
        .select('two_factor_secret')
        .eq('id', user.id)
        .single()

      const isValid = await verifyTOTP(profile.two_factor_secret, code)
      if (!isValid) throw new Error('Code invalide')

      // Generate new backup codes
      const backupCodes = Array.from({ length: 8 }, () =>
        Math.random().toString(36).substring(2, 10).toUpperCase()
      )

      const { error: updateError } = await supabase
        .from('admin_profiles')
        .update({ two_factor_backup_codes: backupCodes })
        .eq('id', user.id)

      if (updateError) throw updateError

      return { success: true, backupCodes }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    is2FAEnabled,
    setup2FA,
    enable2FA,
    disable2FA,
    verify2FA,
    regenerateBackupCodes,
  }
}

export default useTwoFactor
