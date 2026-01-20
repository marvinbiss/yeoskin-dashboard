'use client'

import ProductsPage from '@/views/ProductsPage'
import { ProtectedRoute } from '@/components/Auth'

export default function Products() {
  return (
    <ProtectedRoute requiredRole="admin">
      <ProductsPage />
    </ProtectedRoute>
  )
}
