'use client'

import { useState, useEffect } from 'react'
import { useNavigate } from '@/lib/navigation'
import {
  Bell,
  Moon,
  Sun,
  Globe,
  Shield,
  ArrowLeft,
  Save,
  Mail,
  Smartphone,
  CheckCircle
} from 'lucide-react'
import { useCreatorAuth } from '../contexts/CreatorAuthContext'
import { CreatorLayout } from '../components'

/**
 * CreatorSettings - Page de parametres du createur
 */
export const CreatorSettings = () => {
  const navigate = useNavigate()
  const { creator } = useCreatorAuth()
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  // Settings state
  const [settings, setSettings] = useState({
    notifications: {
      email_commission: true,
      email_payout: true,
      email_marketing: false,
      push_enabled: false
    },
    preferences: {
      language: 'fr',
      currency: 'EUR'
    }
  })

  // Check dark mode on mount
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setDarkMode(isDark)
  }, [])

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  // Handle notification toggle
  const handleNotificationToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }))
  }

  // Handle save
  const handleSave = async () => {
    setSaving(true)
    setSuccess(false)

    // Simulate save (in production, this would save to database)
    await new Promise(resolve => setTimeout(resolve, 500))

    // Save to localStorage
    localStorage.setItem('creator_settings', JSON.stringify(settings))

    setSaving(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  const notificationOptions = [
    {
      key: 'email_commission',
      icon: Mail,
      title: 'Nouvelles commissions',
      description: 'Recevoir un email pour chaque nouvelle commission'
    },
    {
      key: 'email_payout',
      icon: Mail,
      title: 'Paiements',
      description: 'Recevoir un email lors des paiements'
    },
    {
      key: 'email_marketing',
      icon: Mail,
      title: 'Actualites Yeoskin',
      description: 'Recevoir les newsletters et promotions'
    }
  ]

  return (
    <CreatorLayout
      title="Parametres"
      subtitle="Gerez vos preferences"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back button */}
        <button
          onClick={() => navigate('/c/creator/profile')}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au profil
        </button>

        {/* Success message */}
        {success && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-600 dark:text-green-400">Parametres enregistres</p>
          </div>
        )}

        {/* Appearance */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            {darkMode ? <Moon className="w-5 h-5 text-gray-400" /> : <Sun className="w-5 h-5 text-yellow-500" />}
            Apparence
          </h3>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Mode sombre</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {darkMode ? 'Active' : 'Desactive'}
              </p>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                darkMode ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  darkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-400" />
            Notifications
          </h3>

          <div className="space-y-3">
            {notificationOptions.map((option) => {
              const Icon = option.icon
              return (
                <div
                  key={option.key}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{option.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{option.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleNotificationToggle(option.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.notifications[option.key] ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.notifications[option.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Language & Currency */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-gray-400" />
            Langue et devise
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Langue
              </label>
              <select
                value={settings.preferences.language}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  preferences: { ...prev.preferences, language: e.target.value }
                }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="fr">Francais</option>
                <option value="en">English</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Devise
              </label>
              <select
                value={settings.preferences.currency}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  preferences: { ...prev.preferences, currency: e.target.value }
                }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="EUR">Euro (EUR)</option>
                <option value="USD">Dollar (USD)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-400" />
            Securite
          </h3>

          <div className="space-y-3">
            <button
              onClick={() => {/* TODO: Implement password change */}}
              className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">Changer le mot de passe</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Mettre a jour votre mot de passe de connexion
                </p>
              </div>
              <span className="text-gray-400">
                &rarr;
              </span>
            </button>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? (
            <div key="spinner" className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          ) : (
            <Save key="icon" className="w-4 h-4" />
          )}
          <span key="text">{saving ? 'Enregistrement...' : 'Enregistrer les parametres'}</span>
        </button>
      </div>
    </CreatorLayout>
  )
}
