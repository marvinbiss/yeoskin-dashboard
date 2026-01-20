'use client'

import { CreatorProviders } from '../providers'
import { CreatorProtectedRoute } from '@/creator'

export default function CreatorLayout({ children }) {
  return (
    <CreatorProviders>
      <CreatorProtectedRoute>
        {children}
      </CreatorProtectedRoute>
    </CreatorProviders>
  )
}
