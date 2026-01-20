'use client'

import CategoriesPage from '@/views/CategoriesPage'
import { ProtectedRoute } from '@/components/Auth'

export default function Categories() {
  return (
    <ProtectedRoute requiredRole="admin">
      <CategoriesPage />
    </ProtectedRoute>
  )
}
