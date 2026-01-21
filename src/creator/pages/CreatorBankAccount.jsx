'use client'

import { useState, useEffect } from 'react'
import { useNavigate } from '@/lib/navigation'
import {
  Building2,
  CreditCard,
  Shield,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Eye,
  EyeOff,
  Save,
  Info
} from 'lucide-react'
import { useCreatorAuth } from '../contexts/CreatorAuthContext'
import { CreatorLayout } from '../components'
import { supabase } from '../../lib/supabase'

/**
 * CreatorBankAccount - Page de gestion des coordonnees bancaires
 */
export const CreatorBankAccount = () => {
  const navigate = useNavigate()
  const { creator, refreshProfile } = useCreatorAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [bankData, setBankData] = useState(null)
  const [showIban, setShowIban] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    iban: '',
    bic: '',
    account_holder: '',
    bank_name: ''
  })

  // Fetch bank data
  useEffect(() => {
    const fetchBankData = async () => {
      if (!creator?.id) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('creator_bank_accounts')
          .select('id, iban, account_holder_name, bank_name, is_verified, created_at, updated_at')
          .eq('creator_id', creator.id)
          .single()

        if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows found

        if (data) {
          setBankData({
            iban: data.iban,
            bank_verified: data.is_verified,
            bank_verified_at: data.updated_at,
            account_holder_name: data.account_holder_name,
            bank_name: data.bank_name
          })
          setFormData(prev => ({
            ...prev,
            iban: data.iban || '',
            account_holder: data.account_holder_name || '',
            bank_name: data.bank_name || ''
          }))
        }
      } catch (err) {
        console.error('Error fetching bank data:', err)
        setError('Erreur lors du chargement des donnees bancaires')
      } finally {
        setLoading(false)
      }
    }

    fetchBankData()
  }, [creator?.id])

  // Format IBAN for display (masked)
  const formatIbanMasked = (iban) => {
    if (!iban) return '-'
    if (showIban) {
      // Show full IBAN with spaces every 4 chars
      return iban.replace(/(.{4})/g, '$1 ').trim()
    }
    // Mask all but last 4 digits
    const lastFour = iban.slice(-4)
    return `**** **** **** **** ${lastFour}`
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }))
  }

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      // Validate IBAN format (basic validation)
      const cleanIban = formData.iban.replace(/\s/g, '')
      if (cleanIban.length < 15 || cleanIban.length > 34) {
        throw new Error('Format IBAN invalide')
      }

      // Check if bank account exists
      const { data: existing } = await supabase
        .from('creator_bank_accounts')
        .select('id')
        .eq('creator_id', creator.id)
        .single()

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('creator_bank_accounts')
          .update({
            iban: cleanIban,
            is_verified: false, // Reset verification when IBAN changes
            updated_at: new Date().toISOString()
          })
          .eq('creator_id', creator.id)

        if (error) throw error
      } else {
        // Insert new
        const { error } = await supabase
          .from('creator_bank_accounts')
          .insert({
            creator_id: creator.id,
            account_type: 'iban',
            iban: cleanIban,
            is_verified: false
          })

        if (error) throw error
      }

      setSuccess(true)
      setBankData(prev => ({ ...prev, iban: cleanIban, bank_verified: false }))
      await refreshProfile()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <CreatorLayout title="Coordonnees bancaires" subtitle="Chargement...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
        </div>
      </CreatorLayout>
    )
  }

  return (
    <CreatorLayout
      title="Coordonnees bancaires"
      subtitle="Gerez vos informations de paiement"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back button */}
        <button
          onClick={() => navigate('/creator/profile')}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au profil
        </button>

        {/* Status Card */}
        <div className={`rounded-xl p-4 border ${
          bankData?.bank_verified
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : bankData?.iban
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }`}>
          <div className="flex items-center gap-3">
            {bankData?.bank_verified && (
              <CheckCircle key="check" className="w-6 h-6 text-green-600" />
            )}
            {!bankData?.bank_verified && bankData?.iban && (
              <AlertTriangle key="alert" className="w-6 h-6 text-yellow-600" />
            )}
            {!bankData?.bank_verified && !bankData?.iban && (
              <Info key="info" className="w-6 h-6 text-gray-500" />
            )}
            <div key="content">
              {bankData?.bank_verified ? (
                <>
                  <p className="font-medium text-green-900 dark:text-green-100">Compte verifie</p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Verifie le {formatDate(bankData.bank_verified_at)}
                  </p>
                </>
              ) : bankData?.iban ? (
                <>
                  <p className="font-medium text-yellow-900 dark:text-yellow-100">En attente de verification</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Votre IBAN sera verifie sous 24-48h
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Aucun IBAN enregistre</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Ajoutez votre IBAN pour recevoir vos paiements
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Current IBAN Display */}
        {bankData?.iban && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gray-400" />
                IBAN actuel
              </h3>
              <button
                onClick={() => setShowIban(!showIban)}
                className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
              >
                {showIban ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showIban ? 'Masquer' : 'Afficher'}
              </button>
            </div>
            <p className="font-mono text-lg text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              {formatIbanMasked(bankData.iban)}
            </p>
          </div>
        )}

        {/* Edit Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gray-400" />
            {bankData?.iban ? 'Modifier l\'IBAN' : 'Ajouter un IBAN'}
          </h3>

          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">IBAN mis a jour avec succes</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                IBAN
              </label>
              <input
                type="text"
                name="iban"
                value={formData.iban}
                onChange={handleChange}
                placeholder="FR76 1234 5678 9012 3456 7890 123"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Format: FR76 suivi de 23 chiffres
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Enregistrer
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                Securite de vos donnees
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Vos coordonnees bancaires sont chiffrees et stockees de maniere securisee.
                Nous ne partageons jamais vos informations avec des tiers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </CreatorLayout>
  )
}
