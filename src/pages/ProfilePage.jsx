/**
 * YEOSKIN DASHBOARD - Profile Page
 * User profile, security settings, 2FA, sessions
 */

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  User,
  Shield,
  Key,
  Smartphone,
  Monitor,
  Tablet,
  LogOut,
  Check,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import { Layout } from '../components/Layout'
import {
  Card,
  Button,
  Modal,
  useToast,
  Spinner,
  ConfirmDialog
} from '../components/Common'
import { TwoFactorSetup } from '../components/Auth/TwoFactorSetup'
import { useAuth } from '../contexts/AuthContext'
import { useTwoFactor } from '../hooks/useTwoFactor'
import { useSession } from '../hooks/useSession'
import { supabase } from '../lib/supabase'
import { validatePassword, getPasswordStrengthLevel } from '../lib/adminValidation'

export const ProfilePage = () => {
  const { user, adminProfile, getUserDisplayName, getUserEmail } = useAuth()
  const { is2FAEnabled, disable2FA, regenerateBackupCodes, loading: twoFactorLoading } = useTwoFactor()
  const { sessions, fetchSessions, terminateSession, terminateOtherSessions, loading: sessionsLoading } = useSession({ enabled: false })
  const toast = useToast()

  // State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [showSetup2FA, setShowSetup2FA] = useState(false)
  const [showDisable2FA, setShowDisable2FA] = useState(false)
  const [disableCode, setDisableCode] = useState('')
  const [disableLoading, setDisableLoading] = useState(false)

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState({})

  // Profile edit state
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [profileData, setProfileData] = useState({
    full_name: '',
  })
  const [profileLoading, setProfileLoading] = useState(false)

  // Session management
  const [showTerminateConfirm, setShowTerminateConfirm] = useState(null)

  // Load 2FA status and sessions on mount
  useEffect(() => {
    const load = async () => {
      const enabled = await is2FAEnabled()
      setTwoFactorEnabled(enabled)
      await fetchSessions()
    }
    load()
  }, [is2FAEnabled, fetchSessions])

  // Load profile data
  useEffect(() => {
    if (adminProfile) {
      setProfileData({
        full_name: adminProfile.full_name || '',
      })
    }
  }, [adminProfile])

  // Handle password change
  const handlePasswordChange = async () => {
    setPasswordErrors({})

    // Validate new password
    const validation = validatePassword(passwordData.new)
    if (!validation.isValid) {
      setPasswordErrors({ new: validation.errors[0] })
      return
    }

    if (passwordData.new !== passwordData.confirm) {
      setPasswordErrors({ confirm: 'Les mots de passe ne correspondent pas' })
      return
    }

    setPasswordLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new
      })

      if (error) throw error

      toast.success('Mot de passe modifié avec succès')
      setShowPasswordModal(false)
      setPasswordData({ current: '', new: '', confirm: '' })
    } catch (err) {
      toast.error(err.message || 'Erreur lors du changement de mot de passe')
    } finally {
      setPasswordLoading(false)
    }
  }

  // Handle profile update
  const handleProfileUpdate = async () => {
    setProfileLoading(true)
    try {
      const { error } = await supabase
        .from('admin_profiles')
        .update({
          full_name: profileData.full_name,
        })
        .eq('id', user.id)

      if (error) throw error

      toast.success('Profil mis à jour')
      setShowEditProfile(false)
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la mise à jour')
    } finally {
      setProfileLoading(false)
    }
  }

  // Handle 2FA disable
  const handleDisable2FA = async () => {
    setDisableLoading(true)
    try {
      const result = await disable2FA(disableCode)
      if (result.success) {
        setTwoFactorEnabled(false)
        setShowDisable2FA(false)
        setDisableCode('')
        toast.success('2FA désactivée')
      } else {
        toast.error(result.error || 'Code invalide')
      }
    } catch (err) {
      toast.error('Erreur lors de la désactivation')
    } finally {
      setDisableLoading(false)
    }
  }

  // Handle session termination
  const handleTerminateSession = async (sessionId) => {
    const success = await terminateSession(sessionId)
    if (success) {
      toast.success('Session terminée')
    } else {
      toast.error('Erreur lors de la terminaison')
    }
    setShowTerminateConfirm(null)
  }

  // Handle terminate all sessions
  const handleTerminateOthers = async () => {
    const success = await terminateOtherSessions()
    if (success) {
      toast.success('Toutes les autres sessions ont été terminées')
    } else {
      toast.error('Erreur lors de la terminaison')
    }
  }

  // Get device icon
  const getDeviceIcon = (type) => {
    switch (type) {
      case 'mobile': return Smartphone
      case 'tablet': return Tablet
      default: return Monitor
    }
  }

  // Get password strength
  const passwordStrength = passwordData.new ? getPasswordStrengthLevel(passwordData.new) : null

  return (
    <Layout title="Mon Profil" subtitle="Gérez vos informations et la sécurité de votre compte">
      <div className="max-w-4xl space-y-6">
        {/* Profile Information */}
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Informations du profil
                </h3>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setShowEditProfile(true)}>
                Modifier
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Nom complet
                </label>
                <p className="text-gray-900 dark:text-white font-medium">
                  {getUserDisplayName() || 'Non défini'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Email
                </label>
                <p className="text-gray-900 dark:text-white font-medium">
                  {getUserEmail()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Rôle
                </label>
                <p className="text-gray-900 dark:text-white font-medium capitalize">
                  {adminProfile?.role?.replace('_', ' ') || 'Viewer'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Membre depuis
                </label>
                <p className="text-gray-900 dark:text-white font-medium">
                  {adminProfile?.created_at
                    ? format(new Date(adminProfile.created_at), 'dd MMMM yyyy', { locale: fr })
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Security Settings */}
        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Sécurité
              </h3>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="space-y-6">
              {/* Password */}
              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Key className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Mot de passe
                    </p>
                    <p className="text-sm text-gray-500">
                      Modifiez votre mot de passe régulièrement
                    </p>
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setShowPasswordModal(true)}>
                  Modifier
                </Button>
              </div>

              {/* 2FA */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    twoFactorEnabled
                      ? 'bg-success-100 dark:bg-success-900/30'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <Shield className={`w-5 h-5 ${
                      twoFactorEnabled ? 'text-success-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-white">
                        Authentification à deux facteurs
                      </p>
                      {twoFactorEnabled && (
                        <span className="badge badge-success">Activée</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      Ajoutez une couche de sécurité supplémentaire
                    </p>
                  </div>
                </div>
                {twoFactorEnabled ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setShowDisable2FA(true)}
                  >
                    Désactiver
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowSetup2FA(true)}
                  >
                    Activer
                  </Button>
                )}
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Active Sessions */}
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Sessions actives
                </h3>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={fetchSessions}
                  disabled={sessionsLoading}
                  icon={RefreshCw}
                >
                  Actualiser
                </Button>
                {sessions.length > 1 && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleTerminateOthers}
                  >
                    Déconnecter les autres
                  </Button>
                )}
              </div>
            </div>
          </Card.Header>
          <Card.Body>
            {sessionsLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                Aucune session active trouvée
              </p>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => {
                  const DeviceIcon = getDeviceIcon(session.device_type)
                  return (
                    <div
                      key={session.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        session.is_current
                          ? 'border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <DeviceIcon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {session.device_name || 'Appareil inconnu'}
                            </p>
                            {session.is_current && (
                              <span className="badge badge-primary">Session actuelle</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {session.browser} sur {session.os}
                          </p>
                          <p className="text-xs text-gray-400">
                            Dernière activité : {format(new Date(session.last_activity), 'dd/MM/yyyy HH:mm', { locale: fr })}
                          </p>
                        </div>
                      </div>
                      {!session.is_current && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowTerminateConfirm(session.id)}
                        >
                          <LogOut className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </Card.Body>
        </Card>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        title="Modifier le profil"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom complet
            </label>
            <input
              type="text"
              value={profileData.full_name}
              onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
              className="input"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowEditProfile(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleProfileUpdate} loading={profileLoading}>
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Password Change Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Modifier le mot de passe"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordData.new}
                onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                className="input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordStrength && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded ${
                        level <= passwordStrength.level
                          ? passwordStrength.color
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs ${passwordStrength.textColor}`}>
                  {passwordStrength.label}
                </p>
              </div>
            )}
            {passwordErrors.new && (
              <p className="text-danger-600 text-sm mt-1">{passwordErrors.new}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordData.confirm}
                onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                className="input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordErrors.confirm && (
              <p className="text-danger-600 text-sm mt-1">{passwordErrors.confirm}</p>
            )}
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handlePasswordChange} loading={passwordLoading}>
              Modifier
            </Button>
          </div>
        </div>
      </Modal>

      {/* 2FA Setup Modal */}
      <TwoFactorSetup
        isOpen={showSetup2FA}
        onClose={() => setShowSetup2FA(false)}
        onSuccess={() => setTwoFactorEnabled(true)}
      />

      {/* Disable 2FA Modal */}
      <Modal
        isOpen={showDisable2FA}
        onClose={() => setShowDisable2FA(false)}
        title="Désactiver la 2FA"
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-warning-700 dark:text-warning-400 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Attention</span>
            </div>
            <p className="text-sm text-warning-600 dark:text-warning-400">
              Désactiver la 2FA rendra votre compte moins sécurisé.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Code de vérification
            </label>
            <input
              type="text"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="input text-center font-mono"
              maxLength={6}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowDisable2FA(false)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={handleDisable2FA}
              loading={disableLoading}
              disabled={disableCode.length !== 6}
            >
              Désactiver
            </Button>
          </div>
        </div>
      </Modal>

      {/* Terminate Session Confirm */}
      <ConfirmDialog
        isOpen={!!showTerminateConfirm}
        onClose={() => setShowTerminateConfirm(null)}
        onConfirm={() => handleTerminateSession(showTerminateConfirm)}
        title="Terminer la session"
        message="Êtes-vous sûr de vouloir déconnecter cet appareil ?"
        confirmText="Déconnecter"
        variant="danger"
      />
    </Layout>
  )
}

export default ProfilePage
