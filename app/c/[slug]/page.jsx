import CreatorPage from '@/views/CreatorPage'

export const dynamic = 'force-dynamic'
export const dynamicParams = true

export default async function PublicCreatorPage({ params }) {
  const { slug } = await params
  return <CreatorPage slug={slug} />
}
