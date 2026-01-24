'use client'

import { CreatorProviders } from '../../../providers'
import { CreatorProtectedRoute } from '@/creator'

export default function CreatorDashboardLayout({ children }) {
  return (
    <CreatorProviders>
      <CreatorProtectedRoute>
        {children}
      </CreatorProtectedRoute>
    </CreatorProviders>
  )
}
