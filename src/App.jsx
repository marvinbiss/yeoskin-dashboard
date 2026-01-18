import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './components/Common'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ProtectedRoute, SessionTimeoutWarning } from './components/Auth'
import { useSession } from './hooks/useSession'
import ErrorBoundary from './components/ErrorBoundary'
import {
  DashboardPage,
  PayoutsPage,
  CreatorsPage,
  CommissionsPage,
  SettingsPage,
  HelpPage,
  LoginPage,
  AdminsPage,
  AuditLogsPage,
  FinancialPage,
  AdminPayoutsPage,
  AnalyticsPage,
} from './pages'
import { ProfilePage } from './pages/ProfilePage'
import { CreatorDetailPage } from './pages/CreatorDetailPage'

// Creator Portal imports
import {
  CreatorAuthProvider,
  CreatorProtectedRoute,
  CreatorDashboard,
  CreatorHistory,
  CreatorLogin,
  CreatorProfile,
  CreatorBankAccount,
  CreatorSettings,
  CreatorAnalytics,
} from './creator'

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

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <SessionManager>
              <Routes>
                {/* Route publique - Login */}
                <Route path="/login" element={<LoginPage />} />

                {/* Routes protegees */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } />
                <Route path="/payouts" element={
                  <ProtectedRoute>
                    <PayoutsPage />
                  </ProtectedRoute>
                } />
                <Route path="/creators" element={
                  <ProtectedRoute>
                    <CreatorsPage />
                  </ProtectedRoute>
                } />
                <Route path="/creators/:id" element={
                  <ProtectedRoute>
                    <CreatorDetailPage />
                  </ProtectedRoute>
                } />
                <Route path="/commissions" element={
                  <ProtectedRoute>
                    <CommissionsPage />
                  </ProtectedRoute>
                } />
                <Route path="/financial" element={
                  <ProtectedRoute requiredRole="admin">
                    <FinancialPage />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                } />
                <Route path="/help" element={
                  <ProtectedRoute>
                    <HelpPage />
                  </ProtectedRoute>
                } />
                <Route path="/admins" element={
                  <ProtectedRoute requiredRole="super_admin">
                    <AdminsPage />
                  </ProtectedRoute>
                } />
                <Route path="/audit-logs" element={
                  <ProtectedRoute requiredRole="super_admin">
                    <AuditLogsPage />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />
                <Route path="/admin-payouts" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminPayoutsPage />
                  </ProtectedRoute>
                } />
                <Route path="/analytics" element={
                  <ProtectedRoute>
                    <AnalyticsPage />
                  </ProtectedRoute>
                } />

                {/* Creator Portal Routes */}
                <Route path="/creator/login" element={
                  <CreatorAuthProvider>
                    <CreatorLogin />
                  </CreatorAuthProvider>
                } />
                <Route path="/creator" element={
                  <CreatorAuthProvider>
                    <CreatorProtectedRoute>
                      <CreatorDashboard />
                    </CreatorProtectedRoute>
                  </CreatorAuthProvider>
                } />
                <Route path="/creator/history" element={
                  <CreatorAuthProvider>
                    <CreatorProtectedRoute>
                      <CreatorHistory />
                    </CreatorProtectedRoute>
                  </CreatorAuthProvider>
                } />
                <Route path="/creator/profile" element={
                  <CreatorAuthProvider>
                    <CreatorProtectedRoute>
                      <CreatorProfile />
                    </CreatorProtectedRoute>
                  </CreatorAuthProvider>
                } />
                <Route path="/creator/bank" element={
                  <CreatorAuthProvider>
                    <CreatorProtectedRoute>
                      <CreatorBankAccount />
                    </CreatorProtectedRoute>
                  </CreatorAuthProvider>
                } />
                <Route path="/creator/settings" element={
                  <CreatorAuthProvider>
                    <CreatorProtectedRoute>
                      <CreatorSettings />
                    </CreatorProtectedRoute>
                  </CreatorAuthProvider>
                } />
                <Route path="/creator/analytics" element={
                  <CreatorAuthProvider>
                    <CreatorProtectedRoute>
                      <CreatorAnalytics />
                    </CreatorProtectedRoute>
                  </CreatorAuthProvider>
                } />
              </Routes>
            </SessionManager>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
