/**
 * YEOSKIN DASHBOARD - Two-Factor Authentication Setup Component
 */

import { useState, useEffect } from 'react'
import { Modal, Button, Spinner } from '../Common'
import { Shield, Copy, Check, AlertTriangle } from 'lucide-react'
import { useTwoFactor } from '../../hooks/useTwoFactor'

export const TwoFactorSetup = ({ isOpen, onClose, onSuccess }) => {
  const { loading, error, setup2FA, enable2FA } = useTwoFactor()

  const [step, setStep] = useState(1) // 1: intro, 2: scan QR, 3: verify, 4: backup codes
  const [setupData, setSetupData] = useState(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [verifyError, setVerifyError] = useState('')
  const [backupCodes, setBackupCodes] = useState([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setSetupData(null)
      setVerifyCode('')
      setVerifyError('')
      setBackupCodes([])
      setCopied(false)
    }
  }, [isOpen])

  const handleStartSetup = async () => {
    const data = await setup2FA()
    if (data) {
      setSetupData(data)
      setStep(2)
    }
  }

  const handleVerify = async () => {
    if (verifyCode.length !== 6) {
      setVerifyError('Le code doit contenir 6 chiffres')
      return
    }

    const result = await enable2FA(verifyCode)
    if (result.success) {
      setBackupCodes(result.backupCodes)
      setStep(4)
    } else {
      setVerifyError(result.error || 'Code invalide')
    }
  }

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleComplete = () => {
    onSuccess?.()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={step === 4 ? undefined : onClose}
      title="Configuration 2FA"
      size="md"
      showClose={step !== 4}
    >
      {/* Step 1: Introduction */}
      {step === 1 && (
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary-600" />
          </div>

          <h3 className="text-lg font-semibold mb-2">
            Sécurisez votre compte
          </h3>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            L'authentification à deux facteurs ajoute une couche de sécurité supplémentaire.
            Vous aurez besoin d'une application d'authentification comme Google Authenticator,
            Authy ou 1Password.
          </p>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 text-left">
            <h4 className="font-medium mb-2">Comment ça marche :</h4>
            <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>Scannez le QR code avec votre application</li>
              <li>Entrez le code à 6 chiffres généré</li>
              <li>Sauvegardez vos codes de récupération</li>
            </ol>
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleStartSetup} loading={loading}>
              Commencer
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Scan QR Code */}
      {step === 2 && setupData && (
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">
            Scannez le QR code
          </h3>

          <div className="bg-white p-4 rounded-lg inline-block mb-4">
            <img
              src={setupData.qrCodeUrl}
              alt="QR Code 2FA"
              className="w-48 h-48"
            />
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Ou entrez ce code manuellement :
          </p>

          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 font-mono text-sm mb-6 break-all">
            {setupData.manualEntry}
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Retour
            </Button>
            <Button variant="primary" onClick={() => setStep(3)}>
              Continuer
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Verify Code */}
      {step === 3 && (
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">
            Vérification
          </h3>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Entrez le code à 6 chiffres affiché dans votre application d'authentification.
          </p>

          <div className="mb-6">
            <input
              type="text"
              value={verifyCode}
              onChange={(e) => {
                setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                setVerifyError('')
              }}
              placeholder="000000"
              className="input text-center text-2xl font-mono tracking-widest w-48 mx-auto"
              maxLength={6}
              autoFocus
            />
            {verifyError && (
              <p className="text-danger-600 text-sm mt-2">{verifyError}</p>
            )}
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={() => setStep(2)}>
              Retour
            </Button>
            <Button
              variant="primary"
              onClick={handleVerify}
              loading={loading}
              disabled={verifyCode.length !== 6}
            >
              Vérifier
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Backup Codes */}
      {step === 4 && (
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
            <Check className="w-8 h-8 text-success-600" />
          </div>

          <h3 className="text-lg font-semibold mb-2">
            2FA Activée !
          </h3>

          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Sauvegardez ces codes de récupération dans un endroit sûr.
            Ils vous permettront de vous connecter si vous perdez accès à votre application.
          </p>

          <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-warning-700 dark:text-warning-400 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Important</span>
            </div>
            <p className="text-sm text-warning-600 dark:text-warning-400">
              Ces codes ne seront affichés qu'une seule fois.
              Chaque code ne peut être utilisé qu'une fois.
            </p>
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {backupCodes.map((code, i) => (
                <div key={i} className="bg-white dark:bg-gray-700 rounded px-3 py-2">
                  {code}
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={handleCopyBackupCodes}
            icon={copied ? Check : Copy}
            className="mb-6"
          >
            {copied ? 'Copié !' : 'Copier les codes'}
          </Button>

          <div className="flex justify-center">
            <Button variant="primary" onClick={handleComplete}>
              Terminer
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default TwoFactorSetup
