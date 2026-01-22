'use client'

import RoutinesPage from '@/views/RoutinesPage'
import { ProtectedRoute } from '@/components/Auth'

export default function Routines() {
  return (
    <ProtectedRoute requiredRole="admin">
      <RoutinesPage />
    </ProtectedRoute>
  )
}
