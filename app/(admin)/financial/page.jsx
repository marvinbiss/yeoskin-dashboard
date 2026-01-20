'use client'

import { FinancialPage } from '@/views'
import { ProtectedRoute } from '@/components/Auth'

export default function Financial() {
  return (
    <ProtectedRoute requiredRole="admin">
      <FinancialPage />
    </ProtectedRoute>
  )
}
