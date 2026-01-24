import { createClient } from '@supabase/supabase-js'
import ApplyClient from './ApplyClient'

// ISR: revalidate every hour for fresh CMS content
export const revalidate = 3600

export const metadata = {
  title: 'Deviens Créateur Yeoskin | Programme Affiliation K-Beauty',
  description: 'Rejoins le programme créateur Yeoskin et gagne jusqu\'à 20% de commission sur chaque vente. Accès exclusif aux produits K-Beauty, support dédié et paiements rapides.',
  openGraph: {
    title: 'Deviens Créateur Yeoskin',
    description: 'Gagne jusqu\'à 20% de commission en partageant ta passion pour la K-Beauty',
    type: 'website',
  },
}

async function getCmsContent() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    )

    const { data: cmsData } = await supabase
      .from('page_content')
      .select('section_key, content')
      .eq('page_slug', 'apply')
      .eq('is_published', true)

    const cms = {}
    cmsData?.forEach(s => { cms[s.section_key] = s.content })
    return cms
  } catch (e) {
    return {}
  }
}

export default async function ApplyLandingPage() {
  const cms = await getCmsContent()
  return <ApplyClient cms={cms} />
}
