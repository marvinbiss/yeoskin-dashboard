'use client'

import { useState, useEffect } from 'react'
import { useNavigate } from '@/lib/navigation'
import { User, Mail, Tag, Percent, Calendar, CheckCircle, XCircle, Save, ArrowLeft } from 'lucide-react'
import { useCreatorAuth } from '../contexts/CreatorAuthContext'
import { CreatorLayout } from '../components'
import { supabase } from '../../lib/supabase'

/**
 * CreatorProfile - Page de profil du createur
 */
export const CreatorProfile = () => {
  const navigate = useNavigate()
  const { creator, refreshProfile } = useCreatorAuth()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const profileFields = [
    {
      label: 'Email',
      value: creator?.email || '-',
      icon: Mail,
      editable: false
    },
    {
      label: 'Code promo',
      value: creator?.discount_code || '-',
      icon: Tag,
      editable: false,
      highlight: true
    },
    {
      label: 'Taux de commission',
      value: creator?.commission_rate ? `${(creator.commission_rate * 100).toFixed(0)}%` : '-',
      icon: Percent,
      editable: false
    },
    {
      label: 'Statut',
      value: creator?.status === 'active' ? 'Actif' : creator?.status || '-',
      icon: creator?.status === 'active' ? CheckCircle : XCircle,
      editable: false,
      statusColor: creator?.status === 'active' ? 'text-green-600' : 'text-gray-500'
    },
    {
      label: 'Membre depuis',
      value: formatDate(creator?.created_at),
      icon: Calendar,
      editable: false
    }
  ]

  return (
    <CreatorLayout
      title="Mon Profil"
      subtitle="Consultez vos informations de compte"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back button */}
        <button
          onClick={() => navigate('/creator')}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au tableau de bord
        </button>

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {creator?.email?.split('@')[0] || 'Creator'}
                </h2>
                <p className="text-primary-100">
                  {creator?.email || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">Profil mis a jour avec succes</p>
              </div>
            )}

            {profileFields.map((field, index) => {
              const Icon = field.icon
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${field.statusColor || 'text-gray-400'}`} />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {field.label}
                    </span>
                  </div>
                  <span className={`text-sm font-medium ${
                    field.highlight
                      ? 'text-primary-600 dark:text-primary-400 font-mono bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded'
                      : field.statusColor || 'text-gray-900 dark:text-white'
                  }`}>
                    {field.value}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            Information
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Pour modifier vos informations de profil ou votre code promo, veuillez contacter l'equipe Yeoskin a{' '}
            <a href="mailto:support@yeoskin.com" className="underline hover:no-underline">
              support@yeoskin.com
            </a>
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/creator/bank')}
            className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors text-left"
          >
            <h4 className="font-medium text-gray-900 dark:text-white mb-1">
              Coordonnees bancaires
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gerer votre IBAN pour les paiements
            </p>
          </button>

          <button
            onClick={() => navigate('/creator/settings')}
            className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors text-left"
          >
            <h4 className="font-medium text-gray-900 dark:text-white mb-1">
              Parametres
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Notifications et preferences
            </p>
          </button>
        </div>
      </div>
    </CreatorLayout>
  )
}
