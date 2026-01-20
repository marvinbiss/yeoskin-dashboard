'use client'

import { AdminsPage } from '@/views'
import { ProtectedRoute } from '@/components/Auth'

export default function Admins() {
  return (
    <ProtectedRoute requiredRole="super_admin">
      <AdminsPage />
    </ProtectedRoute>
  )
}
