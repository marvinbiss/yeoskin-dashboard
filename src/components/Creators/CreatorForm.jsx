'use client'

/**
 * YEOSKIN DASHBOARD - CreatorForm Component
 * Formulaire de création/modification d'un créateur
 */

import { useState, useEffect } from 'react'
import { User, Mail, Tag, Percent, Calendar, CreditCard, AlertCircle, Award } from 'lucide-react'
import { Modal, Button } from '../Common'

/**
 * Validation de l'email
 */
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

/**
 * Validation du code promo
 */
const validateDiscountCode = (code) => {
  // Code promo: lettres, chiffres, tirets, 3-20 caractères
  const re = /^[A-Z0-9_-]{3,20}$/i
  return re.test(code)
}

/**
 * Validation de l'IBAN
 */
const validateIBAN = (iban) => {
  if (!iban) return true // Optional
  // IBAN basique: 2 lettres + 2 chiffres + jusqu'à 30 alphanumériques
  const cleaned = iban.replace(/\s/g, '').toUpperCase()
  const re = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$/
  return re.test(cleaned)
}

/**
 * Composant de formulaire pour créateur
 */
export const CreatorForm = ({
  isOpen,
  onClose,
  creator = null,
  onSubmit,
  loading = false,
  tiers = [],
}) => {
  const isEditing = !!creator

  // État du formulaire
  const [formData, setFormData] = useState({
    email: '',
    discount_code: '',
    tier_id: '',
    commission_rate: 15,
    lock_days: 30,
    status: 'active',
    iban: '',
    account_type: 'iban',
  })

  // Erreurs de validation
  const [errors, setErrors] = useState({})

  // Réinitialiser le formulaire quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      if (creator) {
        // Mode édition
        setFormData({
          email: creator.email || '',
          discount_code: creator.discount_code || '',
          tier_id: creator.tier_id || '',
          commission_rate: (creator.commission_rate || 0.15) * 100,
          lock_days: creator.lock_days || 30,
          status: creator.status || 'active',
          iban: creator.bankAccount?.iban || '',
          account_type: creator.bankAccount?.account_type || 'iban',
        })
      } else {
        // Mode création
        setFormData({
          email: '',
          discount_code: '',
          tier_id: '',
          commission_rate: 15,
          lock_days: 30,
          status: 'active',
          iban: '',
          account_type: 'iban',
        })
      }
      setErrors({})
    }
  }, [isOpen, creator])

  // Gérer les changements de champs
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  // Gérer le changement de tier
  const handleTierChange = (tierId) => {
    if (tierId) {
      const tier = tiers.find(t => t.id === tierId)
      if (tier) {
        setFormData(prev => ({
          ...prev,
          tier_id: tierId,
          commission_rate: tier.commission_percent,
        }))
      }
    } else {
      setFormData(prev => ({ ...prev, tier_id: '' }))
    }
  }

  // Valider le formulaire
  const validateForm = () => {
    const newErrors = {}

    // Email obligatoire et valide
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est obligatoire'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Format d\'email invalide'
    }

    // Code promo obligatoire et valide
    if (!formData.discount_code.trim()) {
      newErrors.discount_code = 'Le code promo est obligatoire'
    } else if (!validateDiscountCode(formData.discount_code)) {
      newErrors.discount_code = 'Le code doit contenir 3-20 caractères (lettres, chiffres, tirets)'
    }

    // Taux de commission valide
    if (formData.commission_rate < 0 || formData.commission_rate > 100) {
      newErrors.commission_rate = 'Le taux doit être entre 0 et 100%'
    }

    // Jours de blocage valide
    if (formData.lock_days < 0 || formData.lock_days > 365) {
      newErrors.lock_days = 'Les jours de blocage doivent être entre 0 et 365'
    }

    // IBAN valide si fourni
    if (formData.iban && !validateIBAN(formData.iban)) {
      newErrors.iban = 'Format IBAN invalide'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      await onSubmit({
        email: formData.email.trim(),
        discount_code: formData.discount_code.trim(),
        tier_id: formData.tier_id || null,
        commission_rate: formData.commission_rate / 100, // Convertir en décimal
        lock_days: parseInt(formData.lock_days),
        status: formData.status,
        iban: formData.iban.trim() || null,
        account_type: formData.account_type,
      })
    } catch (err) {
      // L'erreur sera gérée par le parent
      setErrors({ submit: err.message })
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Modifier le créateur' : 'Nouveau créateur'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Erreur générale */}
        {errors.submit && (
          <div className="p-4 bg-danger-50 dark:bg-danger-500/20 border border-danger-200 dark:border-danger-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-danger-700 dark:text-danger-300">{errors.submit}</p>
          </div>
        )}

        {/* Section Informations de base */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <User className="w-4 h-4" />
            Informations de base
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="createur@email.com"
                  className={`input pl-10 ${errors.email ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-danger-500">{errors.email}</p>
              )}
            </div>

            {/* Code promo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Code promo <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.discount_code}
                  onChange={(e) => handleChange('discount_code', e.target.value.toUpperCase())}
                  placeholder="CREATEUR2024"
                  className={`input pl-10 uppercase ${errors.discount_code ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                  disabled={loading}
                />
              </div>
              {errors.discount_code && (
                <p className="mt-1 text-sm text-danger-500">{errors.discount_code}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section Commission */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Percent className="w-4 h-4" />
            Paramètres de commission
          </h4>

          {/* Tier selector */}
          {tiers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Offre
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {tiers.map(tier => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => handleTierChange(tier.id)}
                    disabled={loading}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 transition ${
                      formData.tier_id === tier.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Award className="w-5 h-5 mb-1" style={{ color: tier.color }} />
                    <span className="text-sm font-medium">{tier.name}</span>
                    <span className="text-xs text-gray-500">{tier.commission_percent}%</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleTierChange('')}
                  disabled={loading}
                  className={`flex flex-col items-center p-3 rounded-lg border-2 transition ${
                    !formData.tier_id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Percent className="w-5 h-5 mb-1 text-gray-400" />
                  <span className="text-sm font-medium">Custom</span>
                  <span className="text-xs text-gray-500">Manuel</span>
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Taux de commission */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Taux de commission (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={formData.commission_rate}
                  onChange={(e) => handleChange('commission_rate', parseFloat(e.target.value) || 0)}
                  className={`input ${errors.commission_rate ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                  disabled={loading || !!formData.tier_id}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
              </div>
              {errors.commission_rate && (
                <p className="mt-1 text-sm text-danger-500">{errors.commission_rate}</p>
              )}
            </div>

            {/* Jours de blocage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Jours de blocage
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={formData.lock_days}
                  onChange={(e) => handleChange('lock_days', parseInt(e.target.value) || 0)}
                  className={`input pl-10 ${errors.lock_days ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                  disabled={loading}
                />
              </div>
              {errors.lock_days && (
                <p className="mt-1 text-sm text-danger-500">{errors.lock_days}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Période avant que les commissions soient payables
              </p>
            </div>

            {/* Statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Statut
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="input"
                disabled={loading}
              >
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section Compte bancaire */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Compte bancaire (optionnel)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type de compte */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type de compte
              </label>
              <select
                value={formData.account_type}
                onChange={(e) => handleChange('account_type', e.target.value)}
                className="input"
                disabled={loading}
              >
                <option value="iban">IBAN</option>
                <option value="swift">SWIFT/BIC</option>
                <option value="other">Autre</option>
              </select>
            </div>

            {/* IBAN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                IBAN / Numéro de compte
              </label>
              <input
                type="text"
                value={formData.iban}
                onChange={(e) => handleChange('iban', e.target.value.toUpperCase())}
                placeholder="FR76 1234 5678 9012 3456 7890 123"
                className={`input uppercase ${errors.iban ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                disabled={loading}
              />
              {errors.iban && (
                <p className="mt-1 text-sm text-danger-500">{errors.iban}</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
          >
            {isEditing ? 'Enregistrer les modifications' : 'Créer le créateur'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default CreatorForm
