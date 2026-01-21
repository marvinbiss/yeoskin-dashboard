'use client'

import { use } from 'react'
import PageEditorPage from '@/views/PageEditorPage'

export default function AdminPageEditor({ params }) {
  const { slug } = use(params)
  return <PageEditorPage pageSlug={slug} />
}
