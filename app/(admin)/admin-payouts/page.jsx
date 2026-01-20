'use client'

import { AdminPayoutsPage } from '@/views'
import { ProtectedRoute } from '@/components/Auth'

export default function AdminPayouts() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminPayoutsPage />
    </ProtectedRoute>
  )
}
