'use client'

import { AdminProviders } from '../providers'
import { ProtectedRoute } from '@/components/Auth'

export default function AdminLayout({ children }) {
  return (
    <AdminProviders>
      <ProtectedRoute>
        {/* Main content wrapper for skip link navigation */}
        <div id="main-content" tabIndex={-1} className="outline-none">
          {children}
        </div>
      </ProtectedRoute>
    </AdminProviders>
  )
}
