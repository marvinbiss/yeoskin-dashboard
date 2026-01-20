'use client'

import PacksPage from '@/views/PacksPage'
import { ProtectedRoute } from '@/components/Auth'

export default function Packs() {
  return (
    <ProtectedRoute requiredRole="admin">
      <PacksPage />
    </ProtectedRoute>
  )
}
