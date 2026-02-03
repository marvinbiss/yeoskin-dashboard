'use client'

import { useState, useEffect } from 'react'
import { X, Download, Smartphone, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import clsx from 'clsx'
import { useInstallPrompt, useOnlineStatus, useServiceWorker } from '@/hooks/usePWA'

/**
 * PWA Install Prompt
 *
 * Shows a banner prompting users to install the app.
 */
export function InstallPrompt() {
  const { canInstall, isInstalled, promptInstall } = useInstallPrompt()
  const [dismissed, setDismissed] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has dismissed the prompt before
    const wasDismissed = localStorage.getItem('pwa-install-dismissed')
    if (wasDismissed) {
      setDismissed(true)
    }

    // Show prompt after a delay
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  const handleInstall = async () => {
    const installed = await promptInstall()
    if (installed) {
      handleDismiss()
    }
  }

  if (!canInstall || dismissed || isInstalled || !isVisible) {
    return null
  }

  return (
    <div
      className={clsx(
        'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50',
        'bg-white rounded-2xl shadow-soft-2xl border border-neutral-100',
        'animate-slide-in-up'
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-neutral-900">
              Installer Yeoskin
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Accédez rapidement au dashboard depuis votre écran d'accueil
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-neutral-100 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleDismiss}
            className={clsx(
              'flex-1 px-4 py-2 text-sm font-medium rounded-xl',
              'text-neutral-600 hover:bg-neutral-100 transition-colors'
            )}
          >
            Plus tard
          </button>
          <button
            onClick={handleInstall}
            className={clsx(
              'flex-1 px-4 py-2 text-sm font-medium rounded-xl',
              'bg-brand-500 text-white hover:bg-brand-600 transition-colors',
              'flex items-center justify-center gap-2'
            )}
          >
            <Download className="w-4 h-4" />
            Installer
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Offline Indicator
 *
 * Shows when the user is offline.
 */
export function OfflineIndicator() {
  const isOnline = useOnlineStatus()
  const [wasOffline, setWasOffline] = useState(false)
  const [showOnline, setShowOnline] = useState(false)

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true)
    } else if (wasOffline) {
      setShowOnline(true)
      const timer = setTimeout(() => {
        setShowOnline(false)
        setWasOffline(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, wasOffline])

  if (isOnline && !showOnline) {
    return null
  }

  return (
    <div
      className={clsx(
        'fixed top-4 left-1/2 -translate-x-1/2 z-50',
        'px-4 py-2 rounded-full shadow-lg',
        'flex items-center gap-2 text-sm font-medium',
        'animate-fade-in-up',
        isOnline
          ? 'bg-mint-500 text-white'
          : 'bg-error-500 text-white'
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4" />
          Connexion rétablie
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          Vous êtes hors ligne
        </>
      )}
    </div>
  )
}

/**
 * Update Available Banner
 *
 * Shows when a new version of the app is available.
 */
export function UpdateBanner() {
  const { updateAvailable, updateServiceWorker } = useServiceWorker()

  if (!updateAvailable) {
    return null
  }

  return (
    <div
      className={clsx(
        'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50',
        'bg-lavender-500 rounded-2xl shadow-soft-2xl',
        'animate-slide-in-up'
      )}
    >
      <div className="p-4 flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">
            Nouvelle version disponible
          </p>
        </div>
        <button
          onClick={updateServiceWorker}
          className={clsx(
            'px-4 py-2 text-sm font-medium rounded-xl',
            'bg-white text-lavender-600 hover:bg-lavender-50 transition-colors'
          )}
        >
          Mettre à jour
        </button>
      </div>
    </div>
  )
}

export default InstallPrompt
