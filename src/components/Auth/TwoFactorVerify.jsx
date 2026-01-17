/**
 * YEOSKIN DASHBOARD - Two-Factor Verification Component
 * Used during login when 2FA is enabled
 */

import { useState } from 'react'
import { Shield, Key } from 'lucide-react'
import { Button } from '../Common'

export const TwoFactorVerify = ({ onVerify, onCancel, loading, error }) => {
  const [code, setCode] = useState('')
  const [useBackup, setUseBackup] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (code.length >= 6) {
      onVerify(code)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              {useBackup ? (
                <Key className="w-8 h-8 text-primary-600" />
              ) : (
                <Shield className="w-8 h-8 text-primary-600" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Vérification 2FA
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {useBackup
                ? 'Entrez un code de récupération'
                : 'Entrez le code de votre application d\'authentification'
              }
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {useBackup ? 'Code de récupération' : 'Code à 6 chiffres'}
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  if (useBackup) {
                    setCode(e.target.value.toUpperCase().slice(0, 8))
                  } else {
                    setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                }}
                placeholder={useBackup ? 'XXXXXXXX' : '000000'}
                className="input text-center text-xl font-mono tracking-widest"
                autoFocus
                autoComplete="one-time-code"
              />
              {error && (
                <p className="text-danger-600 text-sm mt-2 text-center">{error}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={loading}
              disabled={useBackup ? code.length < 8 : code.length < 6}
            >
              Vérifier
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setUseBackup(!useBackup)
                  setCode('')
                }}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                {useBackup
                  ? 'Utiliser l\'application d\'authentification'
                  : 'Utiliser un code de récupération'
                }
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={onCancel}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Annuler et revenir à la connexion
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default TwoFactorVerify
