'use client'

import { CreatorAuthProvider, CreatorLogin } from '@/creator'

export default function CreatorLoginPage() {
  return (
    <CreatorAuthProvider>
      <CreatorLogin />
    </CreatorAuthProvider>
  )
}
