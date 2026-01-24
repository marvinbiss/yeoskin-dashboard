'use client'

import { usePathname } from 'next/navigation'
import { CreatorProviders } from '../../providers'
import { CreatorProtectedRoute } from '@/creator'

export default function CreatorLayout({ children }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/c/creator/login'

  if (isLoginPage) {
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
