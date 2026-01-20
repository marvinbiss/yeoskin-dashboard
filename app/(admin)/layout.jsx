'use client'

import { AdminProviders } from '../providers'
import { ProtectedRoute } from '@/components/Auth'

export default function AdminLayout({ children }) {
  return (
    <AdminProviders>
      <ProtectedRoute>
        {children}
      </ProtectedRoute>
    </AdminProviders>
  )
}
