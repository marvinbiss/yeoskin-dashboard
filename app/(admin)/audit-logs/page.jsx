'use client'

import { AuditLogsPage } from '@/views'
import { ProtectedRoute } from '@/components/Auth'

export default function AuditLogs() {
  return (
    <ProtectedRoute requiredRole="super_admin">
      <AuditLogsPage />
    </ProtectedRoute>
  )
}
