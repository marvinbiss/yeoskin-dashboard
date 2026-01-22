'use client'

import { ToastProvider } from '@/components/Common'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { CreatorAuthProvider } from '@/creator'
import { SessionTimeoutWarning } from '@/components/Auth'
import { useSession } from '@/hooks/useSession'
import ErrorBoundary from '@/components/ErrorBoundary'

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

export function AdminProviders({ children }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <SessionManager>
            {children}
          </SessionManager>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export function CreatorProviders({ children }) {
  return (
    <ErrorBoundary>
      <CreatorAuthProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </CreatorAuthProvider>
    </ErrorBoundary>
  )
}

export function PublicProviders({ children }) {
  return (
    <ErrorBoundary>
      <ToastProvider>
        {children}
      </ToastProvider>
    </ErrorBoundary>
  )
}
