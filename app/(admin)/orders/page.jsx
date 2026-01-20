'use client'

import OrdersPage from '@/views/OrdersPage'
import { ProtectedRoute } from '@/components/Auth'

export default function Orders() {
  return (
    <ProtectedRoute requiredRole="admin">
      <OrdersPage />
    </ProtectedRoute>
  )
}
