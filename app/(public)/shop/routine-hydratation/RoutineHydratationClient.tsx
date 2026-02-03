'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  Star,
  Check,
  ChevronDown,
  Sparkles,
  Droplets,
  Shield,
  Truck,
  RefreshCw,
  Clock,
  Heart,
  ShoppingBag,
  ArrowRight,
  Leaf,
  Award,
  Package,
  Tag,
  Play
} from 'lucide-react'

// ============================================================================
// LUXURY BRAND IDENTITY - YEOSKIN
// Premium K-Beauty Aesthetic
// ============================================================================

// Color tokens - Soft luxury palette
const brand = {
  // Primary - Soft rose/blush
  rose: '#E8B4B8',
  roseLight: '#F5D5D8',
  roseDark: '#D49CA0',

  // Secondary - Warm neutrals
  cream: '#FDF8F5',
  sand: '#F5EDE8',

  // Accent - Champagne gold
  gold: '#C9A050',
  goldLight: '#E8D5A8',

  // Neutrals
  charcoal: '#1A1A1A',
  graphite: '#3D3D3D',
  slate: '#6B6B6B',
  silver: '#9B9B9B',
  pearl: '#F8F8F8',
  white: '#FFFFFF',
}

// ============================================================================
// DATA
// ============================================================================

type VariantType = 'base' | 'upsell_1' | 'upsell_2'

const PRICES: Record<VariantType, number> = {
  base: 59.90,
  upsell_1: 69.90,
  upsell_2: 79.90,
}

const ORIGINAL_PRICES: Record<VariantType, number> = {
  base: 70.85,
  upsell_1: 89.80,
  upsell_2: 111.75,
}

const PRODUCTS = [
  {
    id: 1,
    name: 'Advanced Snail 96 Mucin Essence',
    brand: 'COSRX',
    step: 1,
    time: 'Matin & Soir',
    description: 'Essence légère à 96% de mucine d\'escargot. Hydrate en profondeur et répare la barrière cutanée.',
    ingredients: ['Snail Mucin 96%', 'Hyaluronic Acid', 'Allantoin'],
    stats: { satisfaction: 97, duration: '100ml · 3 mois' },
    image: '/images/shop/cosrx-snail-essence.jpg',
  },
  {
    id: 2,
    name: 'Advanced Snail 92 Cream',
    brand: 'COSRX',
    step: 2,
    time: 'Matin & Soir',
    description: 'Crème tout-en-un enrichie en mucine. Nourrit, répare et protège avec une texture fondante.',
    ingredients: ['Snail Secretion 92%', 'Betaine', 'Allantoin'],
    stats: { satisfaction: 94, duration: '100ml · 3 mois' },
    image: '/images/shop/cosrx-snail-cream.jpg',
  },
  {
    id: 3,
    name: 'Oil-Free Moisturizing Lotion',
    brand: 'COSRX',
    step: 3,
    time: 'Matin & Soir',
    description: 'Lotion légère à la sève de bouleau. Hydratation longue durée avec un fini mat parfait.',
    ingredients: ['Birch Sap 70%', 'Hyaluronic Acid', 'Betaine'],
    stats: { satisfaction: 91, duration: '100ml · 3 mois' },
    image: '/images/shop/cosrx-lotion.jpg',
  },
]

const UPSELLS = [
  {
    id: 'upsell_1',
    name: 'Revive Serum Ginseng+Snail',
    brand: 'Beauty of Joseon',
    badge: 'Populaire',
    benefit: 'Éclat & Régénération',
    price: 69.90,
    originalPrice: 89.80,
    image: '/images/shop/boj-revive-serum.jpg',
  },
  {
    id: 'upsell_2',
    name: 'Glow Serum + Relief Sun',
    brand: 'Beauty of Joseon',
    badge: 'Meilleure valeur',
    benefit: 'Éclat & Protection SPF',
    price: 79.90,
    originalPrice: 111.75,
    image: '/images/shop/boj-glow-sun.jpg',
  },
]

const REVIEWS = [
  {
    id: 1,
    name: 'Marie L.',
    age: 28,
    skinType: 'Mixte',
    rating: 5,
    title: 'Ma peau a changé en 2 semaines',
    content: 'Je suis bluffée. Mes pores sont resserrés, mon teint est uniforme. Une routine simple qui fonctionne.',
    verified: true,
    avatar: '👩🏻',
  },
  {
    id: 2,
    name: 'Sophie K.',
    age: 34,
    skinType: 'Sèche',
    rating: 5,
    title: 'Adieu les tiraillements',
    content: 'Enfin une crème qui hydrate vraiment sans film gras. Le sérum sent divinement bon.',
    verified: true,
    avatar: '👩🏼',
  },
  {
    id: 3,
    name: 'Emma R.',
    age: 25,
    skinType: 'Grasse',
    rating: 5,
    title: 'Game changer',
    content: 'Parfait pour ma peau grasse. Matifié mais confortable. Je recommande à 100%.',
    verified: true,
    avatar: '👩🏽',
  },
]

const FAQS = [
  { q: 'Pour quel type de peau ?', a: 'Tous types : grasse, sèche, mixte, sensible. Formules hypoallergéniques testées dermatologiquement.' },
  { q: 'Combien de temps dure le pack ?', a: '3-4 mois avec utilisation matin & soir. Excellent rapport qualité-prix.' },
  { q: 'Quand voir des résultats ?', a: 'Hydratation immédiate. Éclat en 1 semaine. Texture améliorée en 4 semaines.' },
  { q: 'Livraison et retours ?', a: 'Livraison gratuite en France. 30 jours satisfait ou remboursé.' },
]

// ============================================================================
// INTERFACES
// ============================================================================

interface RoutineData {
  id?: string; title?: string; slug?: string; objective?: string; description?: string
  base_products?: { name: string; brand: string; image_url?: string; description?: string }[]
  base_price?: number
  upsell_1_product?: { name: string; brand: string; image_url?: string; description?: string }
  upsell_1_price?: number; upsell_1_original_price?: number
  upsell_2_products?: { name: string; brand: string; image_url?: string; description?: string }[]
  upsell_2_price?: number; upsell_2_original_price?: number
  image_url?: string
  before_after_1_before_url?: string; before_after_1_after_url?: string
  before_after_2_before_url?: string; before_after_2_after_url?: string
  is_active?: boolean
}

interface Props {
  cms?: {
    hero?: { badge?: string; title?: string; subtitle?: string; stats?: { rating?: number; reviews?: number } }
    pricing?: { base?: { price?: number; original_price?: number }; upsell_1?: { price?: number; original_price?: number }; upsell_2?: { price?: number; original_price?: number } }
    reviews?: { items?: any[] }
    faq?: { items?: any[] }
  }
  routine?: RoutineData | null
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function RoutineHydratationClient({ cms = {}, routine }: Props) {
  const reviews = cms.reviews?.items?.length ? cms.reviews.items : REVIEWS
  const cmsPricing = cms.pricing || {}

  const prices = {
    base: routine?.base_price ?? cmsPricing.base?.price ?? PRICES.base,
    upsell_1: routine?.upsell_1_price ?? cmsPricing.upsell_1?.price ?? PRICES.upsell_1,
    upsell_2: routine?.upsell_2_price ?? cmsPricing.upsell_2?.price ?? PRICES.upsell_2,
  }
  const originalPrices = {
    base: cmsPricing.base?.original_price ?? ORIGINAL_PRICES.base,
    upsell_1: routine?.upsell_1_original_price ?? cmsPricing.upsell_1?.original_price ?? ORIGINAL_PRICES.upsell_1,
    upsell_2: routine?.upsell_2_original_price ?? cmsPricing.upsell_2?.original_price ?? ORIGINAL_PRICES.upsell_2,
  }

  const products = routine?.base_products?.length === 3
    ? routine.base_products.map((p, i) => ({ ...PRODUCTS[i], name: p.name || PRODUCTS[i].name, brand: p.brand || PRODUCTS[i].brand, description: p.description || PRODUCTS[i].description, image: p.image_url || PRODUCTS[i].image }))
    : PRODUCTS

  const upsells = [
    routine?.upsell_1_product ? { ...UPSELLS[0], name: routine.upsell_1_product.name || UPSELLS[0].name, brand: routine.upsell_1_product.brand || UPSELLS[0].brand, image: routine.upsell_1_product.image_url || UPSELLS[0].image, price: prices.upsell_1, originalPrice: originalPrices.upsell_1 } : UPSELLS[0],
    routine?.upsell_2_products?.[0] ? { ...UPSELLS[1], name: routine.upsell_2_products.map(p => p.name).join(' + ') || UPSELLS[1].name, brand: routine.upsell_2_products[0].brand || UPSELLS[1].brand, image: routine.upsell_2_products[0].image_url || UPSELLS[1].image, price: prices.upsell_2, originalPrice: originalPrices.upsell_2 } : UPSELLS[1],
  ]

  const faqItems = cms.faq?.items?.length ? cms.faq.items : FAQS
  const heroRating = cms.hero?.stats?.rating || 4.9
  const heroReviews = cms.hero?.stats?.reviews || 2847

  const [variant, setVariant] = useState<VariantType>('base')
  const [loading, setLoading] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [sticky, setSticky] = useState(false)
  const [code, setCode] = useState<string | null>(null)

  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => {
      if (heroRef.current) setSticky(heroRef.current.getBoundingClientRect().bottom < 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const c = sessionStorage.getItem('yeoskin_creator_code')
    if (c) setCode(c)
  }, [])

  const getCreator = (): string => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('creator')
      if (p) { sessionStorage.setItem('yeoskin_creator_slug', p); return p }
      const s = sessionStorage.getItem('yeoskin_creator_slug')
      if (s) return s
    }
    return 'yeoskin'
  }

  const checkout = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/routines/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creator_slug: getCreator(), variant, routine_slug: 'routine-hydratation' }),
      })
      const data = await res.json()
      if (data.checkout_url) window.location.href = data.checkout_url
      else throw new Error(data.error)
    } catch (e) {
      console.error(e)
      alert('Erreur. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  const price = prices[variant]
  const original = originalPrices[variant]
  const savings = original - price

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: brand.cream }}>
      {/* Google Fonts */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Playfair Display', Georgia, serif; }
        .font-body { font-family: 'Inter', -apple-system, sans-serif; }
      `}</style>

      {/* ================================================================== */}
      {/* TOP BAR */}
      {/* ================================================================== */}
      <div style={{ background: brand.charcoal }} className="py-3 px-4">
        <p className="text-center text-sm font-body" style={{ color: brand.white }}>
          <span style={{ color: brand.gold }}>✦</span>
          {' '}Livraison offerte · Satisfait ou remboursé 30 jours{' '}
          <span style={{ color: brand.gold }}>✦</span>
        </p>
      </div>

      {/* ================================================================== */}
      {/* HERO */}
      {/* ================================================================== */}
      <section ref={heroRef} style={{ background: brand.cream }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 py-16 lg:py-24 items-center">

            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative order-2 lg:order-1"
            >
              <div className="aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl" style={{ background: brand.sand }}>
                {routine?.image_url ? (
                  <img src={routine.image_url} alt="Routine Hydratation" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: brand.rose + '30' }}>
                        <Sparkles className="w-12 h-12" style={{ color: brand.roseDark }} />
                      </div>
                      <p className="font-display text-2xl" style={{ color: brand.charcoal }}>YEOSKIN</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Rating badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="absolute -bottom-4 -right-4 lg:bottom-8 lg:-right-6 rounded-2xl p-5 shadow-xl"
                style={{ background: brand.white }}
              >
                <div className="flex items-center gap-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4" style={{ fill: brand.gold, color: brand.gold }} />
                  ))}
                </div>
                <p className="text-lg font-semibold font-body" style={{ color: brand.charcoal }}>{heroRating}/5</p>
                <p className="text-xs font-body" style={{ color: brand.slate }}>{heroReviews.toLocaleString()} avis</p>
              </motion.div>

              {/* Discount badge */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="absolute top-6 left-6 px-4 py-2 rounded-full font-body text-sm font-semibold"
                style={{ background: brand.charcoal, color: brand.white }}
              >
                -15% aujourd'hui
              </motion.div>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="order-1 lg:order-2"
            >
              {/* Eyebrow */}
              <div className="flex items-center gap-2 mb-6">
                <span className="w-8 h-px" style={{ background: brand.rose }} />
                <span className="text-xs font-body font-semibold tracking-[0.2em] uppercase" style={{ color: brand.roseDark }}>
                  Best-seller 2024
                </span>
              </div>

              {/* Title */}
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-medium leading-[1.1] mb-6" style={{ color: brand.charcoal }}>
                Routine
                <br />
                <span className="italic" style={{ color: brand.roseDark }}>Hydratation</span>
              </h1>

              {/* Subtitle */}
              <p className="text-xl font-body font-light leading-relaxed mb-8" style={{ color: brand.slate }}>
                La routine K-beauty minimaliste qui transforme votre peau en 4 semaines.
                <span className="font-medium" style={{ color: brand.charcoal }}> 3 produits. Résultats garantis.</span>
              </p>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-4 mb-10">
                {[
                  { icon: Leaf, text: 'Vegan' },
                  { icon: Heart, text: 'Cruelty-free' },
                  { icon: Shield, text: 'Testé cliniquement' },
                ].map((b, i) => (
                  <span key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-body" style={{ background: brand.white, color: brand.graphite, border: `1px solid ${brand.sand}` }}>
                    <b.icon className="w-4 h-4" style={{ color: brand.roseDark }} />
                    {b.text}
                  </span>
                ))}
              </div>

              {/* Price */}
              <div className="p-6 rounded-2xl mb-8" style={{ background: brand.white }}>
                <div className="flex items-baseline gap-4 mb-2">
                  <span className="font-display text-5xl" style={{ color: brand.charcoal }}>{price.toFixed(2)}€</span>
                  <span className="text-xl font-body line-through" style={{ color: brand.silver }}>{original.toFixed(2)}€</span>
                </div>
                <p className="text-sm font-body font-medium" style={{ color: brand.roseDark }}>
                  Économisez {savings.toFixed(2)}€ ({Math.round((savings / original) * 100)}% de réduction)
                </p>
              </div>

              {/* CTA */}
              <button
                onClick={checkout}
                disabled={loading}
                className="w-full sm:w-auto group flex items-center justify-center gap-3 px-10 py-5 rounded-full font-body font-medium text-lg transition-all duration-300 hover:shadow-xl disabled:opacity-50"
                style={{ background: brand.charcoal, color: brand.white }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    Ajouter au panier
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>

              {/* Micro-trust */}
              <div className="flex items-center gap-6 mt-6 text-sm font-body" style={{ color: brand.slate }}>
                <span className="flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Livraison 48h
                </span>
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  30j remboursé
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* STATS BAR */}
      {/* ================================================================== */}
      <section style={{ background: brand.charcoal }} className="py-10 lg:py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { val: '15,234', label: 'Routines vendues' },
              { val: '4.9/5', label: 'Note moyenne' },
              { val: '94%', label: 'Rachètent' },
              { val: '2,847', label: 'Avis clients' },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <p className="font-display text-3xl lg:text-4xl mb-1" style={{ color: brand.white }}>{s.val}</p>
                <p className="text-xs font-body tracking-wider uppercase" style={{ color: brand.silver }}>{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* PRODUCTS */}
      {/* ================================================================== */}
      <section className="py-20 lg:py-32" style={{ background: brand.white }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 lg:mb-24"
          >
            <p className="text-sm font-body font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: brand.roseDark }}>
              La collection
            </p>
            <h2 className="font-display text-4xl lg:text-6xl mb-4" style={{ color: brand.charcoal }}>
              Trois étapes.<br />
              <span className="italic" style={{ color: brand.roseDark }}>Résultats garantis.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {products.map((p, i) => (
              <motion.article
                key={p.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="group"
              >
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-6" style={{ background: brand.sand }}>
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Droplets className="w-16 h-16" style={{ color: brand.rose }} />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-3 py-1.5 rounded-full text-xs font-body font-medium" style={{ background: brand.charcoal, color: brand.white }}>
                      Étape {p.step}
                    </span>
                  </div>
                </div>

                <p className="text-xs font-body font-semibold tracking-wider uppercase mb-2" style={{ color: brand.roseDark }}>{p.brand}</p>
                <h3 className="font-display text-xl lg:text-2xl mb-3" style={{ color: brand.charcoal }}>{p.name}</h3>
                <p className="text-sm font-body leading-relaxed mb-4" style={{ color: brand.slate }}>{p.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {p.ingredients.map((ing, j) => (
                    <span key={j} className="text-xs font-body px-3 py-1.5 rounded-full" style={{ background: brand.sand, color: brand.graphite }}>
                      {ing}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-4 pt-4 text-sm font-body" style={{ borderTop: `1px solid ${brand.sand}` }}>
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4" style={{ fill: brand.gold, color: brand.gold }} />
                    <span style={{ color: brand.charcoal }}>{p.stats.satisfaction}%</span>
                    <span style={{ color: brand.silver }}>satisfaites</span>
                  </span>
                  <span style={{ color: brand.silver }}>{p.stats.duration}</span>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* HOW IT WORKS */}
      {/* ================================================================== */}
      <section className="py-20 lg:py-32" style={{ background: brand.cream }}>
        <div className="max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <p className="text-sm font-body font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: brand.roseDark }}>
              Le rituel
            </p>
            <h2 className="font-display text-4xl lg:text-5xl" style={{ color: brand.charcoal }}>
              2 minutes. <span className="italic" style={{ color: brand.roseDark }}>Matin & soir.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12">
            {products.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center font-display text-3xl" style={{ background: brand.charcoal, color: brand.white }}>
                  {i + 1}
                </div>
                <h3 className="font-display text-xl mb-2" style={{ color: brand.charcoal }}>{p.name.split(' ').slice(-2).join(' ')}</h3>
                <p className="text-sm font-body mb-1" style={{ color: brand.slate }}>{p.brand}</p>
                <p className="text-xs font-body font-medium tracking-wider uppercase" style={{ color: brand.roseDark }}>{p.time}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* REVIEWS */}
      {/* ================================================================== */}
      <section className="py-20 lg:py-32" style={{ background: brand.white }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-sm font-body font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: brand.roseDark }}>
              Témoignages
            </p>
            <h2 className="font-display text-4xl lg:text-5xl mb-6" style={{ color: brand.charcoal }}>
              Ce qu'elles <span className="italic" style={{ color: brand.roseDark }}>en pensent</span>
            </h2>
            <div className="flex items-center justify-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5" style={{ fill: brand.gold, color: brand.gold }} />
                ))}
              </div>
              <span className="font-body font-medium" style={{ color: brand.charcoal }}>{heroRating}/5</span>
              <span className="font-body" style={{ color: brand.slate }}>· {heroReviews.toLocaleString()} avis</span>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {reviews.slice(0, 3).map((r: any, i: number) => (
              <motion.div
                key={r.id || i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-2xl"
                style={{ background: brand.cream }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl" style={{ background: brand.sand }}>
                      {r.avatar}
                    </div>
                    <div>
                      <p className="font-body font-medium" style={{ color: brand.charcoal }}>{r.name}</p>
                      <p className="text-xs font-body" style={{ color: brand.slate }}>{r.skinType || r.skin_type}</p>
                    </div>
                  </div>
                  {r.verified && (
                    <span className="flex items-center gap-1 text-xs font-body" style={{ color: brand.roseDark }}>
                      <Check className="w-3 h-3" /> Vérifié
                    </span>
                  )}
                </div>

                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4" style={{ fill: j < r.rating ? brand.gold : brand.sand, color: j < r.rating ? brand.gold : brand.sand }} />
                  ))}
                </div>

                <h4 className="font-display text-lg mb-2" style={{ color: brand.charcoal }}>{r.title}</h4>
                <p className="text-sm font-body leading-relaxed" style={{ color: brand.slate }}>{r.content || r.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* CHOOSE FORMULA */}
      {/* ================================================================== */}
      <section className="py-20 lg:py-32" style={{ background: brand.cream }}>
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-sm font-body font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: brand.roseDark }}>
              Personnalisez
            </p>
            <h2 className="font-display text-4xl lg:text-5xl" style={{ color: brand.charcoal }}>
              Choisissez votre <span className="italic" style={{ color: brand.roseDark }}>formule</span>
            </h2>
          </motion.div>

          {code && (
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-body" style={{ background: '#E8F5E9', color: '#2E7D32', border: '1px solid #A5D6A7' }}>
                <Tag className="w-4 h-4" />
                Code <strong>{code}</strong> appliqué
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            {/* Base */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              onClick={() => setVariant('base')}
              className="cursor-pointer rounded-2xl p-8 transition-all duration-300"
              style={{
                background: variant === 'base' ? brand.charcoal : brand.white,
                color: variant === 'base' ? brand.white : brand.charcoal,
                boxShadow: variant === 'base' ? '0 25px 50px -12px rgba(0,0,0,0.25)' : 'none',
              }}
            >
              <div className="text-center">
                <span className="inline-block px-4 py-1.5 rounded-full text-xs font-body font-medium tracking-wider uppercase mb-6" style={{ background: variant === 'base' ? 'rgba(255,255,255,0.15)' : brand.sand }}>
                  Essentiel
                </span>
                <p className="font-display text-4xl mb-2">{prices.base.toFixed(2)}€</p>
                <p className="text-sm font-body line-through mb-4" style={{ opacity: 0.5 }}>{originalPrices.base.toFixed(2)}€</p>
                <p className="text-sm font-body" style={{ opacity: 0.7 }}>3 produits essentiels</p>
              </div>
            </motion.div>

            {/* Upsells */}
            {upsells.map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i + 1) * 0.1 }}
                onClick={() => setVariant(u.id as VariantType)}
                className="cursor-pointer rounded-2xl p-8 transition-all duration-300 relative"
                style={{
                  background: variant === u.id ? brand.charcoal : brand.white,
                  color: variant === u.id ? brand.white : brand.charcoal,
                  boxShadow: variant === u.id ? '0 25px 50px -12px rgba(0,0,0,0.25)' : 'none',
                }}
              >
                {i === 1 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-body font-semibold" style={{ background: brand.gold, color: brand.white }}>
                    Meilleure valeur
                  </div>
                )}
                <div className="text-center">
                  <span className="inline-block px-4 py-1.5 rounded-full text-xs font-body font-medium tracking-wider uppercase mb-4" style={{ background: variant === u.id ? 'rgba(255,255,255,0.15)' : brand.rose + '30', color: variant === u.id ? brand.white : brand.roseDark }}>
                    {u.badge}
                  </span>

                  {u.image && (
                    <div className="w-16 h-16 mx-auto mb-4 rounded-xl overflow-hidden">
                      <img src={u.image} alt={u.name} className="w-full h-full object-cover" />
                    </div>
                  )}

                  <p className="font-body font-medium text-sm mb-1">{u.name}</p>
                  <p className="text-xs font-body mb-4" style={{ opacity: 0.6 }}>{u.benefit}</p>
                  <p className="font-display text-4xl mb-2">{u.price.toFixed(2)}€</p>
                  <p className="text-sm font-body line-through" style={{ opacity: 0.5 }}>{u.originalPrice.toFixed(2)}€</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <button
              onClick={checkout}
              disabled={loading}
              className="group inline-flex items-center gap-3 px-12 py-5 rounded-full font-body font-medium text-lg transition-all duration-300 hover:shadow-xl disabled:opacity-50"
              style={{ background: brand.charcoal, color: brand.white }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  Commander · {price.toFixed(2)}€
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </motion.div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FAQ */}
      {/* ================================================================== */}
      <section className="py-20 lg:py-32" style={{ background: brand.white }}>
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-4xl" style={{ color: brand.charcoal }}>
              Questions <span className="italic" style={{ color: brand.roseDark }}>fréquentes</span>
            </h2>
          </motion.div>

          <div className="space-y-4">
            {faqItems.map((f: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left p-6 rounded-xl transition-all"
                  style={{ background: brand.cream }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-body font-medium" style={{ color: brand.charcoal }}>{f.q || f.question}</span>
                    <ChevronDown className={`w-5 h-5 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} style={{ color: brand.roseDark }} />
                  </div>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="pt-4 text-sm font-body leading-relaxed" style={{ color: brand.slate }}>{f.a || f.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FINAL CTA */}
      {/* ================================================================== */}
      <section className="py-20 lg:py-32" style={{ background: brand.rose }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl lg:text-5xl mb-6" style={{ color: brand.charcoal }}>
              Prête à transformer
              <br />
              <span className="italic">votre peau ?</span>
            </h2>
            <p className="text-lg font-body mb-10" style={{ color: brand.graphite }}>
              Rejoignez plus de 15,000 femmes qui ont adopté cette routine K-beauty.
            </p>

            <button
              onClick={checkout}
              disabled={loading}
              className="group inline-flex items-center gap-3 px-12 py-5 rounded-full font-body font-medium text-lg transition-all duration-300 hover:shadow-xl disabled:opacity-50"
              style={{ background: brand.charcoal, color: brand.white }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  Ajouter au panier · {price.toFixed(2)}€
                </>
              )}
            </button>

            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm font-body" style={{ color: brand.graphite }}>
              <span className="flex items-center gap-2"><Truck className="w-4 h-4" /> Livraison offerte</span>
              <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4" /> 30j remboursé</span>
              <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> Paiement sécurisé</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* STICKY MOBILE */}
      {/* ================================================================== */}
      <AnimatePresence>
        {sticky && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 p-4 z-50 lg:hidden shadow-2xl"
            style={{ background: brand.white, borderTop: `1px solid ${brand.sand}` }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-body font-semibold" style={{ color: brand.charcoal }}>{price.toFixed(2)}€</p>
                <p className="text-sm font-body line-through" style={{ color: brand.silver }}>{original.toFixed(2)}€</p>
              </div>
              <button
                onClick={checkout}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-full font-body font-medium transition-all disabled:opacity-50"
                style={{ background: brand.charcoal, color: brand.white }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    Ajouter au panier
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-24 lg:hidden" />
    </div>
  )
}
