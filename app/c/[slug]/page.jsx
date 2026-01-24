import CreatorPage from '@/views/CreatorPage'

export const revalidate = 600 // ISR: revalidate every 10 minutes
export const dynamicParams = true

export default async function PublicCreatorPage({ params }) {
  const { slug } = await params
  return <CreatorPage slug={slug} />
}
