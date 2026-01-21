import { Metadata } from 'next'
import RoutineHydratationClient from './RoutineHydratationClient'

// ============================================================================
// METADATA SEO
// ============================================================================
export const metadata: Metadata = {
  title: 'Routine Hydratation K-Beauty en 3 Gestes | Yeoskin',
  description:
    'Pack skincare coréen essentiel : cleanser + essence + cream. Peau hydratée, douce et éclatante en 4 semaines. 79€ au lieu de 110€. Livraison offerte.',
  keywords:
    'routine k-beauty, skincare coréen, cosrx, beauty of joseon, hydratation, routine minimaliste, skincare débutant',
  openGraph: {
    title: 'Routine Hydratation K-Beauty • 3 Produits Essentiels',
    description:
      'Transforme ta peau en 4 semaines avec cette routine coréenne approuvée par 15K+ personnes.',
    images: [
      {
        url: '/images/shop/og-routine-hydratation.jpg',
        width: 1200,
        height: 630,
        alt: 'Routine Hydratation K-Beauty Yeoskin',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Routine Hydratation K-Beauty en 3 Gestes',
    description: 'Pack skincare coréen : cleanser + essence + cream. 79€ • Livraison offerte.',
    images: ['/images/shop/twitter-routine-hydratation.jpg'],
  },
  alternates: {
    canonical: 'https://www.yeoskin.com/shop/routine-hydratation',
  },
}

// ============================================================================
// JSON-LD STRUCTURED DATA
// ============================================================================
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Routine Hydratation K-Beauty',
  description: 'Pack 3 produits skincare coréen pour une peau hydratée et éclatante',
  image: 'https://www.yeoskin.com/images/shop/routine-hydratation.jpg',
  brand: {
    '@type': 'Brand',
    name: 'Yeoskin',
  },
  offers: {
    '@type': 'Offer',
    price: '79.00',
    priceCurrency: 'EUR',
    availability: 'https://schema.org/InStock',
    url: 'https://www.yeoskin.com/shop/routine-hydratation',
    priceValidUntil: '2025-12-31',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '2847',
    bestRating: '5',
    worstRating: '1',
  },
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================
export default function RoutineHydratationPage() {
  return (
    <>
      {/* JSON-LD Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Client Component with all interactive elements */}
      <RoutineHydratationClient />
    </>
  )
}
