'use client'

import { usePathname } from 'next/navigation'
import { CreatorProviders } from '../../providers'
import { CreatorProtectedRoute } from '@/creator'

export default function CreatorLayout({ children }) {
  const pathname = usePathname()
  const isPublicPage = pathname === '/c/creator/login' || pathname === '/c/creator/set-password'

  if (isPublicPage) {
    return <CreatorProviders>{children}</CreatorProviders>
  }

  return (
    <CreatorProviders>
      <CreatorProtectedRoute>
        {children}
      </CreatorProtectedRoute>
    </CreatorProviders>
  )
}
