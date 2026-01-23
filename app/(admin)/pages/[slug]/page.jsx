import PageEditorPage from '@/views/PageEditorPage'

export const dynamic = 'force-dynamic'
export const dynamicParams = true

export default async function AdminPageEditor({ params }) {
  const { slug } = await params
  return <PageEditorPage pageSlug={slug} />
}
