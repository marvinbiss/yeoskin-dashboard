'use client'

import { SWRConfig } from 'swr'
import { ToastProvider } from '@/components/Common'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { CreatorAuthProvider } from '@/creator'
import { SessionTimeoutWarning } from '@/components/Auth'
import { useSession } from '@/hooks/useSession'
import ErrorBoundary from '@/components/ErrorBoundary'
import { swrConfig } from '@/hooks/useSWROptimized'
import { AnalyticsProvider } from '@/components/Analytics'
import { VercelAnalytics } from '@/components/Analytics'
import { InstallPrompt, OfflineIndicator, UpdateBanner } from '@/components/PWA'

// Session manager component
const SessionManager = ({ children }) => {
  const { user, signOut } = useAuth()

  const handleTimeout = async () => {
    await signOut()
    window.location.href = '/login?timeout=1'
  }

  const {
    showTimeoutWarning,
    remainingTime,
    extendSession
  } = useSession({
    timeout: 30 * 60 * 1000, // 30 minutes
    warningTime: 5 * 60 * 1000, // 5 minutes warning
    onTimeout: handleTimeout,
    enabled: !!user
  })

  return (
    <>
      {children}
      <SessionTimeoutWarning
        isOpen={showTimeoutWarning && !!user}
        remainingTime={remainingTime}
        onExtend={extendSession}
        onLogout={handleTimeout}
      />
    </>
  )
}

// PWA components wrapper
const PWAComponents = () => {
  return (
    <>
      <OfflineIndicator />
      <InstallPrompt />
      <UpdateBanner />
    </>
  )
}

export function AdminProviders({ children }) {
  return (
    <ErrorBoundary>
      <SWRConfig value={swrConfig}>
        <AuthProvider>
          <AnalyticsProvider>
            <ToastProvider>
              <SessionManager>
                {children}
                <PWAComponents />
                <VercelAnalytics />
              </SessionManager>
            </ToastProvider>
          </AnalyticsProvider>
        </AuthProvider>
      </SWRConfig>
    </ErrorBoundary>
  )
}

export function CreatorProviders({ children }) {
  return (
    <ErrorBoundary>
      <SWRConfig value={swrConfig}>
        <CreatorAuthProvider>
          <AnalyticsProvider>
            <ToastProvider>
              {children}
              <PWAComponents />
              <VercelAnalytics />
            </ToastProvider>
          </AnalyticsProvider>
        </CreatorAuthProvider>
      </SWRConfig>
    </ErrorBoundary>
  )
}

export function PublicProviders({ children }) {
  return (
    <ErrorBoundary>
      <AnalyticsProvider>
        <ToastProvider>
          {children}
          <OfflineIndicator />
          <VercelAnalytics />
        </ToastProvider>
      </AnalyticsProvider>
    </ErrorBoundary>
  )
}
