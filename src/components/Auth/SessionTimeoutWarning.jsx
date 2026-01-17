/**
 * YEOSKIN DASHBOARD - Session Timeout Warning Component
 * Shows a warning modal when the session is about to expire
 */

import { Modal, Button } from '../Common'
import { Clock, RefreshCw } from 'lucide-react'

export const SessionTimeoutWarning = ({
  isOpen,
  remainingTime,
  onExtend,
  onLogout
}) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onExtend}
      title="Session expirante"
      size="sm"
      showClose={false}
    >
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center">
          <Clock className="w-8 h-8 text-warning-600" />
        </div>

        <p className="text-gray-600 dark:text-gray-300 mb-2">
          Votre session va expirer dans
        </p>

        <p className="text-4xl font-bold text-warning-600 mb-4">
          {formatTime(remainingTime || 0)}
        </p>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Cliquez sur "Continuer" pour rester connecté, ou vous serez déconnecté automatiquement.
        </p>

        <div className="flex gap-3 justify-center">
          <Button
            variant="secondary"
            onClick={onLogout}
          >
            Se déconnecter
          </Button>
          <Button
            variant="primary"
            onClick={onExtend}
            icon={RefreshCw}
          >
            Continuer la session
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default SessionTimeoutWarning
