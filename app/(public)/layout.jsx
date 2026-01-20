'use client'

import { PublicProviders } from '../providers'

export default function PublicLayout({ children }) {
  return (
    <PublicProviders>
      {children}
    </PublicProviders>
  )
}
