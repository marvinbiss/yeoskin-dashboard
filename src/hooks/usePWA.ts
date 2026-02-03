'use client'

import { useEffect, useState, useCallback } from 'react'

// ============================================================================
// SERVICE WORKER REGISTRATION
// ============================================================================

interface ServiceWorkerState {
  isSupported: boolean
  isInstalled: boolean
  isOffline: boolean
  updateAvailable: boolean
  registration: ServiceWorkerRegistration | null
}

/**
 * Hook to manage service worker registration and updates
 */
export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isInstalled: false,
    isOffline: false,
    updateAvailable: false,
    registration: null,
  })

  useEffect(() => {
    // Check if service workers are supported
    const isSupported = 'serviceWorker' in navigator
    setState((prev) => ({ ...prev, isSupported }))

    if (!isSupported) return

    // Register service worker
    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })

        setState((prev) => ({
          ...prev,
          isInstalled: true,
          registration,
        }))

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setState((prev) => ({ ...prev, updateAvailable: true }))
              }
            })
          }
        })

        console.log('[PWA] Service worker registered')
      } catch (error) {
        console.error('[PWA] Service worker registration failed:', error)
      }
    }

    registerSW()

    // Handle online/offline status
    const handleOnline = () => setState((prev) => ({ ...prev, isOffline: false }))
    const handleOffline = () => setState((prev) => ({ ...prev, isOffline: true }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Set initial offline state
    setState((prev) => ({ ...prev, isOffline: !navigator.onLine }))

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const updateServiceWorker = useCallback(() => {
    if (state.registration?.waiting) {
      state.registration.waiting.postMessage('skipWaiting')
      window.location.reload()
    }
  }, [state.registration])

  return {
    ...state,
    updateServiceWorker,
  }
}

// ============================================================================
// INSTALL PROMPT
// ============================================================================

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Hook to handle PWA install prompt
 */
export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    setIsInstalled(isStandalone)

    // Capture the install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }

    // Handle app installed
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!installPrompt) return false

    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice

    if (outcome === 'accepted') {
      setIsInstalled(true)
    }

    setInstallPrompt(null)
    return outcome === 'accepted'
  }, [installPrompt])

  return {
    canInstall: !!installPrompt && !isInstalled,
    isInstalled,
    promptInstall,
  }
}

// ============================================================================
// ONLINE STATUS
// ============================================================================

/**
 * Hook to track online/offline status
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================

/**
 * Hook to manage push notifications
 */
export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator
    setIsSupported(supported)

    if (supported) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false

    const result = await Notification.requestPermission()
    setPermission(result)
    return result === 'granted'
  }, [isSupported])

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (permission === 'granted') {
        new Notification(title, {
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-72.png',
          ...options,
        })
      }
    },
    [permission]
  )

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
  }
}

// ============================================================================
// DISPLAY MODE
// ============================================================================

type DisplayMode = 'browser' | 'standalone' | 'minimal-ui' | 'fullscreen'

/**
 * Hook to detect PWA display mode
 */
export function useDisplayMode(): DisplayMode {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('browser')

  useEffect(() => {
    const checkDisplayMode = (): DisplayMode => {
      if (window.matchMedia('(display-mode: fullscreen)').matches) {
        return 'fullscreen'
      }
      if (window.matchMedia('(display-mode: standalone)').matches) {
        return 'standalone'
      }
      if (window.matchMedia('(display-mode: minimal-ui)').matches) {
        return 'minimal-ui'
      }
      return 'browser'
    }

    setDisplayMode(checkDisplayMode())

    const handleChange = () => setDisplayMode(checkDisplayMode())

    const mediaQueries = [
      window.matchMedia('(display-mode: fullscreen)'),
      window.matchMedia('(display-mode: standalone)'),
      window.matchMedia('(display-mode: minimal-ui)'),
    ]

    mediaQueries.forEach((mq) => mq.addEventListener('change', handleChange))

    return () => {
      mediaQueries.forEach((mq) => mq.removeEventListener('change', handleChange))
    }
  }, [])

  return displayMode
}
