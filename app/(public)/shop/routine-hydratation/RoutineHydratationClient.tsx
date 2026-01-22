'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView, AnimatePresence, Variants } from 'framer-motion'
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
  Play,
  Quote,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Leaf,
  Award,
  Users,
  Package
} from 'lucide-react'

// ============================================================================
// TYPES & DATA
// ============================================================================

type VariantType = 'base' | 'upsell_1' | 'upsell_2'

const PRICES: Record<VariantType, number> = {
  base: 79,
  upsell_1: 99,
  upsell_2: 119,
}

const ORIGINAL_PRICES: Record<VariantType, number> = {
  base: 110,
  upsell_1: 140,
  upsell_2: 170,
}

const PRODUCTS = [
  {
    id: 1,
    name: 'Low pH Good Morning Gel Cleanser',
    brand: 'COSRX',
    step: 1,
    time: 'MATIN & SOIR',
    description: 'Nettoie en douceur sans décaper. Formule pH 5.5 qui respecte la barrière cutanée. Parfait pour les peaux sensibles.',
    ingredients: ['Tea Tree Oil', 'BHA 0.5%', 'Betaine Salicylate'],
    stats: { satisfaction: 94, duration: '150ml • 4 mois' },
    image: '/images/shop/cosrx-cleanser.jpg',
    color: 'from-green-50 to-mint',
  },
  {
    id: 2,
    name: 'Glow Deep Serum',
    brand: 'Beauty of Joseon',
    step: 2,
    time: 'MATIN & SOIR',
    description: 'Essence concentrée à base de propolis et niacinamide. Pénètre instantanément, booste l\'éclat et unifie le teint.',
    ingredients: ['Propolis 60%', 'Niacinamide 2%', 'Probiotics'],
    stats: { satisfaction: 97, duration: '30ml • 3 mois' },
    image: '/images/shop/boj-serum.jpg',
    color: 'from-amber-50 to-peach',
  },
  {
    id: 3,
    name: 'Advanced Snail 92 Cream',
    brand: 'COSRX',
    step: 3,
    time: 'MATIN & SOIR',
    description: 'Nourrit et protège toute la journée. Texture légère non grasse, absorption rapide. Répare et régénère.',
    ingredients: ['Snail Secretion 92%', 'Betaine', 'Allantoin'],
    stats: { satisfaction: 89, duration: '100ml • 3 mois' },
    image: '/images/shop/cosrx-cream.jpg',
    color: 'from-purple-50 to-lavender',
  },
]

const UPSELLS = [
  {
    id: 'upsell_1',
    name: 'Plum Skin Refining Toner',
    brand: 'Beauty of Joseon',
    badge: '+1 PRODUIT',
    benefit: 'Équilibre le pH',
    description: 'Prépare la peau',
    price: 99,
    originalPrice: 140,
    image: '/images/shop/boj-toner.jpg',
  },
  {
    id: 'upsell_2',
    name: 'Revive Eye Serum',
    brand: 'Beauty of Joseon',
    badge: '+2 PRODUITS',
    benefit: 'Anti-âge intensif',
    description: 'Éclat instantané',
    price: 119,
    originalPrice: 170,
    image: '/images/shop/boj-eye.jpg',
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
    content: 'Je suis bluffée. Mes pores sont resserrés, mon teint est plus uniforme et j\'ai enfin trouvé une routine simple qui fonctionne.',
    date: 'Il y a 3 jours',
    verified: true,
    helpful: 234,
    avatar: '👩🏻',
  },
  {
    id: 2,
    name: 'Sophie K.',
    age: 34,
    skinType: 'Sèche',
    rating: 5,
    title: 'Bye bye tiraillements',
    content: 'Enfin une crème qui hydrate vraiment sans laisser de film gras. Le sérum sent divinement bon et la texture est parfaite.',
    date: 'Il y a 1 semaine',
    verified: true,
    helpful: 189,
    avatar: '👩🏼',
  },
  {
    id: 3,
    name: 'Emma R.',
    age: 25,
    skinType: 'Grasse',
    rating: 5,
    title: 'Routine game changer',
    content: 'J\'avais peur que ce soit trop riche pour ma peau grasse mais pas du tout ! Ma peau est matifiée mais confortable. Je recommande ++',
    date: 'Il y a 2 semaines',
    verified: true,
    helpful: 156,
    avatar: '👩🏽',
  },
  {
    id: 4,
    name: 'Léa M.',
    age: 31,
    skinType: 'Sensible',
    rating: 4,
    title: 'Doux et efficace',
    content: 'Super routine pour les peaux sensibles comme la mienne. Aucune réaction, et ma peau est plus éclatante après 1 mois.',
    date: 'Il y a 3 semaines',
    verified: true,
    helpful: 98,
    avatar: '👩🏻',
  },
]

const FAQS = [
  {
    question: 'Pour quel type de peau ?',
    answer: 'Tous types : grasse, sèche, mixte, sensible. Les formules sont non-comédogènes et hypoallergéniques, testées dermatologiquement.',
  },
  {
    question: 'Combien de temps dure le pack ?',
    answer: '3-4 mois avec utilisation quotidienne matin & soir. C\'est l\'un des meilleurs rapports qualité-prix du marché K-beauty.',
  },
  {
    question: 'Quand vais-je voir des résultats ?',
    answer: 'Hydratation immédiate dès la première application. Éclat visible en 1 semaine. Texture significativement améliorée en 4 semaines.',
  },
  {
    question: 'Puis-je l\'utiliser avec d\'autres produits ?',
    answer: 'Oui, cette routine est une base parfaite. Tu peux ajouter un SPF le matin et un sérum ciblé (vitamine C, rétinol) selon tes besoins.',
  },
  {
    question: 'Livraison offerte ?',
    answer: 'Oui, livraison gratuite en France métropolitaine. Expédition sous 24h, réception en 48-72h ouvrées.',
  },
  {
    question: 'Politique de retour ?',
    answer: '30 jours satisfait ou remboursé, même si les produits sont entamés. On croit tellement en cette routine qu\'on prend le risque.',
  },
]

const STATS = [
  { value: '15,234', label: 'Routines vendues', icon: Package },
  { value: '4.9/5', label: 'Note moyenne', icon: Star },
  { value: '94%', label: 'Rachètent', icon: RefreshCw },
  { value: '2,847', label: 'Avis vérifiés', icon: Users },
]

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface RoutineData {
  id?: string
  title?: string
  slug?: string
  objective?: string
  description?: string
  base_products?: { name: string; brand: string; image_url?: string; description?: string }[]
  base_price?: number
  upsell_1_product?: { name: string; brand: string; image_url?: string; description?: string }
  upsell_1_price?: number
  upsell_1_original_price?: number
  upsell_2_products?: { name: string; brand: string; image_url?: string; description?: string }[]
  upsell_2_price?: number
  upsell_2_original_price?: number
  image_url?: string
  is_active?: boolean
}

interface Props {
  cms?: {
    hero?: { badge?: string; title?: string; subtitle?: string; stats?: { rating?: number; reviews?: number } }
    pricing?: { base?: { price?: number; original_price?: number }; upsell_1?: { price?: number; original_price?: number }; upsell_2?: { price?: number; original_price?: number } }
    products?: { section_title?: string; items?: any[] }
    reviews?: { section_title?: string; items?: any[] }
    faq?: { section_title?: string; items?: any[] }
    cta?: { title?: string; button_text?: string }
  }
  routine?: RoutineData | null
}

export default function RoutineHydratationClient({ cms = {}, routine }: Props) {
  // Use CMS data if available, otherwise defaults
  const cmsHero = cms.hero || {}
  const cmsFaq = cms.faq || {}
  const cmsCta = cms.cta || {}

  // PRICING: routine table is source of truth, fallback to CMS, then hardcoded
  const cmsPricing = cms.pricing || {}
  const currentPrices = {
    base: routine?.base_price ?? cmsPricing.base?.price ?? PRICES.base,
    upsell_1: routine?.upsell_1_price ?? cmsPricing.upsell_1?.price ?? PRICES.upsell_1,
    upsell_2: routine?.upsell_2_price ?? cmsPricing.upsell_2?.price ?? PRICES.upsell_2,
  }
  const currentOriginalPrices = {
    base: cmsPricing.base?.original_price ?? ORIGINAL_PRICES.base,
    upsell_1: routine?.upsell_1_original_price ?? cmsPricing.upsell_1?.original_price ?? ORIGINAL_PRICES.upsell_1,
    upsell_2: routine?.upsell_2_original_price ?? cmsPricing.upsell_2?.original_price ?? ORIGINAL_PRICES.upsell_2,
  }

  // PRODUCTS: routine table is source of truth, fallback to hardcoded
  const displayProducts = routine?.base_products?.length === 3
    ? routine.base_products.map((p, i) => ({
        ...PRODUCTS[i],
        name: p.name || PRODUCTS[i].name,
        brand: p.brand || PRODUCTS[i].brand,
        description: p.description || PRODUCTS[i].description,
        image: p.image_url || PRODUCTS[i].image,
      }))
    : PRODUCTS

  const displayUpsells = [
    routine?.upsell_1_product ? {
      ...UPSELLS[0],
      name: routine.upsell_1_product.name || UPSELLS[0].name,
      brand: routine.upsell_1_product.brand || UPSELLS[0].brand,
      image: routine.upsell_1_product.image_url || UPSELLS[0].image,
      price: currentPrices.upsell_1,
      originalPrice: currentOriginalPrices.upsell_1,
    } : UPSELLS[0],
    routine?.upsell_2_products?.[0] ? {
      ...UPSELLS[1],
      name: routine.upsell_2_products.map(p => p.name).join(' + ') || UPSELLS[1].name,
      brand: routine.upsell_2_products[0].brand || UPSELLS[1].brand,
      image: routine.upsell_2_products[0].image_url || UPSELLS[1].image,
      price: currentPrices.upsell_2,
      originalPrice: currentOriginalPrices.upsell_2,
    } : UPSELLS[1],
  ]

  // CMS Hero content
  const heroTitle = cmsHero.title || routine?.title || 'Routine Hydratation'
  const heroSubtitle = cmsHero.subtitle || 'en 3 Gestes'
  const heroBadge = cmsHero.badge || 'BEST-SELLER'
  const heroRating = cmsHero.stats?.rating || 4.9
  const heroReviews = cmsHero.stats?.reviews || 2847

  // CMS FAQ content
  const faqItems = cmsFaq.items?.length ? cmsFaq.items : FAQS

  // CMS CTA content
  const ctaTitle = cmsCta.title || 'Prête à Transformer Ta Peau ?'
  const ctaButton = cmsCta.button_text || 'Ajouter au panier'

  const [selectedVariant, setSelectedVariant] = useState<VariantType>('base')
  const [isLoading, setIsLoading] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [showStickyBar, setShowStickyBar] = useState(false)

  // Refs for scroll detection
  const heroRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  // Show sticky bar after hero
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const heroBottom = heroRef.current.getBoundingClientRect().bottom
        setShowStickyBar(heroBottom < 0)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Get creator slug from URL params or sessionStorage
  const getCreatorSlug = (): string => {
    // Check URL for creator param
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const creatorParam = urlParams.get('creator')
      if (creatorParam) {
        sessionStorage.setItem('yeoskin_creator_slug', creatorParam)
        return creatorParam
      }

      // Check sessionStorage (set by creator page visits)
      const storedCreator = sessionStorage.getItem('yeoskin_creator_slug')
      if (storedCreator) {
        return storedCreator
      }
    }

    // Default fallback creator for organic traffic
    return 'yeoskin'
  }

  // Checkout handler
  const handleCheckout = async () => {
    setIsLoading(true)
    try {
      const creatorSlug = getCreatorSlug()

      const response = await fetch('/api/routines/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creator_slug: creatorSlug,
          variant: selectedVariant,
        }),
      })

      const data = await response.json()

      if (data.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        throw new Error(data.error || 'No checkout URL')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Une erreur est survenue. Réessaie.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ================================================================== */}
      {/* HERO SECTION */}
      {/* ================================================================== */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-light via-white to-lavender-light opacity-50" />

        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-pink/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-lavender/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-20 lg:py-0">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Image */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative order-2 lg:order-1"
            >
              <div className="relative aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-pink-light to-lavender-light p-8">
                {/* Product image placeholder */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Sparkles className="w-24 h-24 text-pink mx-auto mb-4" />
                    <p className="text-gray-600 text-sm">Image Routine Hydratation</p>
                  </div>
                </div>

                {/* Floating badges */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute top-4 right-4 bg-white rounded-full px-4 py-2 shadow-lg"
                >
                  <span className="text-sm font-semibold text-pink">-28%</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                  className="absolute bottom-4 left-4 bg-white rounded-2xl p-3 shadow-lg flex items-center gap-2"
                >
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{heroRating} ({heroReviews.toLocaleString()})</span>
                </motion.div>
              </div>
            </motion.div>

            {/* Right: Content */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="order-1 lg:order-2"
            >
              {/* Eyebrow */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-pink-light text-pink px-4 py-2 rounded-full text-sm font-medium mb-6"
              >
                <Sparkles className="w-4 h-4" />
                {heroBadge}
              </motion.div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-950 tracking-tight leading-tight mb-6">
                {heroTitle}
                <br />
                <span className="text-pink">{heroSubtitle}</span>
              </h1>

              {/* Description */}
              <p className="text-xl text-gray-600 leading-relaxed mb-6 max-w-lg">
                La routine K-beauty minimaliste qui transforme ta peau en 4 semaines.
                3 produits iconiques, 1 geste matin & soir.
              </p>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-3 mb-8">
                {[
                  { icon: Leaf, label: 'Vegan' },
                  { icon: Heart, label: 'Cruelty-free' },
                  { icon: Shield, label: 'Testé cliniquement' },
                ].map((badge, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm"
                  >
                    <badge.icon className="w-4 h-4" />
                    {badge.label}
                  </span>
                ))}
              </div>

              {/* Price */}
              <div className="mb-8">
                <div className="flex items-baseline gap-4">
                  <span className="text-5xl font-bold text-gray-950">{currentPrices[selectedVariant]}€</span>
                  <span className="text-xl text-gray-400 line-through">{currentOriginalPrices[selectedVariant]}€</span>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                    Économise {ORIGINAL_PRICES[selectedVariant] - PRICES[selectedVariant]}€
                  </span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleCheckout}
                  disabled={isLoading}
                  className="group bg-pink hover:bg-pink-dark text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 ease-out hover:scale-105 hover:shadow-2xl active:scale-95 text-lg tracking-tight flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5" />
                      Ajouter au panier • {currentPrices[selectedVariant]}€
                    </>
                  )}
                </button>

                <a
                  href="#products"
                  className="bg-white border-2 border-gray-900 text-gray-900 font-semibold px-8 py-4 rounded-full transition-all duration-300 hover:bg-gray-900 hover:text-white text-lg text-center"
                >
                  Voir les produits
                </a>
              </div>

              {/* Micro-trust */}
              <div className="flex items-center gap-6 mt-6 text-sm text-gray-500">
                <span className="flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Livraison offerte
                </span>
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  30j remboursé
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-gray-400"
          >
            <ChevronDown className="w-6 h-6" />
          </motion.div>
        </motion.div>
      </section>

      {/* ================================================================== */}
      {/* SOCIAL PROOF BAR */}
      {/* ================================================================== */}
      <section className="bg-gray-950 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <stat.icon className="w-5 h-5 text-pink mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* PRODUCTS SECTION */}
      {/* ================================================================== */}
      <section id="products" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          {/* Section header */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <span className="text-pink font-semibold text-sm tracking-widest uppercase mb-4 block">
              Ce qui est inclus
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-950 mb-4">
              3 Produits. 3 Étapes. Résultats Garantis.
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Chaque produit a été sélectionné pour sa qualité exceptionnelle et son efficacité prouvée.
            </p>
          </motion.div>

          {/* Products grid */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {displayProducts.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* HOW TO USE SECTION */}
      {/* ================================================================== */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <span className="text-pink font-semibold text-sm tracking-widest uppercase mb-4 block">
              Mode d'emploi
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-950 mb-4">
              2 Minutes Matin & Soir
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Une routine simple qui s'intègre facilement dans ton quotidien.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {displayProducts.map((product, i) => (
              <motion.div
                key={product.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={scaleIn}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-pink text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6">
                  {i + 1}
                </div>
                <h3 className="text-xl font-bold text-gray-950 mb-2">{product.name.split(' ').slice(-2).join(' ')}</h3>
                <p className="text-gray-600 mb-2">{product.brand}</p>
                <p className="text-sm text-pink font-medium">{product.time}</p>
              </motion.div>
            ))}
          </div>

          {/* Timeline visual */}
          <div className="hidden md:block relative mt-8">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-pink/20 -translate-y-1/2" />
            <div className="absolute top-1/2 left-0 w-1/3 h-0.5 bg-pink -translate-y-1/2" />
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* BEFORE / AFTER SECTION */}
      {/* ================================================================== */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <span className="text-pink font-semibold text-sm tracking-widest uppercase mb-4 block">
              Résultats réels
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-950 mb-4">
              Transformations Vérifiées
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Des résultats visibles en 4 semaines, validés par notre communauté.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                name: 'Claire, 26 ans',
                issue: 'Pores dilatés, teint terne',
                result: 'Pores resserrés, éclat retrouvé',
                duration: '4 semaines',
              },
              {
                name: 'Julie, 32 ans',
                issue: 'Déshydratation, ridules',
                result: 'Peau repulpée, ridules atténuées',
                duration: '6 semaines',
              },
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={scaleIn}
                className="bg-gray-50 rounded-3xl p-8"
              >
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 aspect-square bg-gray-200 rounded-2xl flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Avant</span>
                  </div>
                  <div className="flex-1 aspect-square bg-pink-light rounded-2xl flex items-center justify-center">
                    <span className="text-pink text-sm">Après</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-950 mb-2">{testimonial.name}</h3>
                <p className="text-gray-600 text-sm mb-2">
                  <span className="text-gray-400">Avant:</span> {testimonial.issue}
                </p>
                <p className="text-gray-600 text-sm mb-4">
                  <span className="text-green-600">Après:</span> {testimonial.result}
                </p>
                <span className="inline-flex items-center gap-1 text-sm text-pink font-medium">
                  <Clock className="w-4 h-4" />
                  {testimonial.duration}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* REVIEWS SECTION */}
      {/* ================================================================== */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <span className="text-pink font-semibold text-sm tracking-widest uppercase mb-4 block">
              Avis vérifiés
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-950 mb-4">
              Ce Qu'Elles En Pensent
            </h2>
            <div className="flex items-center justify-center gap-2 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="text-xl font-bold text-gray-950 ml-2">{heroRating}/5</span>
              <span className="text-gray-600">({heroReviews.toLocaleString()} avis)</span>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {REVIEWS.map((review, i) => (
              <ReviewCard key={review.id} review={review} index={i} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* UPSELLS SECTION */}
      {/* ================================================================== */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <span className="text-pink font-semibold text-sm tracking-widest uppercase mb-4 block">
              Booste ta routine
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-950 mb-4">
              Ajoute un Booster
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              84% de nos clients ajoutent au moins 1 produit supplémentaire.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Base option */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleIn}
              onClick={() => setSelectedVariant('base')}
              className={`cursor-pointer p-6 rounded-3xl border-2 transition-all duration-300 ${
                selectedVariant === 'base'
                  ? 'border-pink bg-pink-light/30 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                  PACK DE BASE
                </span>
                <p className="text-3xl font-bold text-gray-950 mb-2">79€</p>
                <p className="text-gray-400 line-through text-sm mb-4">110€</p>
                <p className="text-gray-600 text-sm">3 produits essentiels</p>
              </div>
              {selectedVariant === 'base' && (
                <div className="mt-4 flex justify-center">
                  <Check className="w-6 h-6 text-pink" />
                </div>
              )}
            </motion.div>

            {/* Upsells */}
            {displayUpsells.map((upsell, i) => (
              <motion.div
                key={upsell.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={scaleIn}
                transition={{ delay: (i + 1) * 0.1 }}
                onClick={() => setSelectedVariant(upsell.id as VariantType)}
                className={`cursor-pointer p-6 rounded-3xl border-2 transition-all duration-300 ${
                  selectedVariant === upsell.id
                    ? 'border-pink bg-pink-light/30 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <span className="inline-block bg-pink text-white px-3 py-1 rounded-full text-sm font-medium mb-4">
                    {upsell.badge}
                  </span>
                  <h3 className="font-bold text-gray-950 mb-1">{upsell.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{upsell.benefit}</p>
                  <p className="text-3xl font-bold text-gray-950 mb-2">{upsell.price}€</p>
                  <p className="text-gray-400 line-through text-sm">au lieu de {upsell.originalPrice}€</p>
                </div>
                {selectedVariant === upsell.id && (
                  <div className="mt-4 flex justify-center">
                    <Check className="w-6 h-6 text-pink" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <button
              onClick={handleCheckout}
              disabled={isLoading}
              className="bg-pink hover:bg-pink-dark text-white font-semibold px-12 py-5 rounded-full transition-all duration-300 ease-out hover:scale-105 hover:shadow-2xl active:scale-95 text-xl tracking-tight inline-flex items-center gap-3 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShoppingBag className="w-6 h-6" />
                  Commander ma routine • {currentPrices[selectedVariant]}€
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FAQ SECTION */}
      {/* ================================================================== */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-950 mb-4">
              Questions Fréquentes
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="space-y-4"
          >
            {faqItems.map((faq: any, i: number) => (
              <motion.div key={i} variants={fadeInUp}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left p-6 bg-white rounded-2xl border border-gray-200 hover:border-gray-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-950">{faq.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                        openFaq === i ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <p className="pt-4 text-gray-600">{faq.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            ))}
          </motion.div>

          <p className="text-center text-gray-500 mt-8">
            D'autres questions ?{' '}
            <a href="mailto:hello@yeoskin.com" className="text-pink hover:underline">
              Contacte-nous
            </a>
          </p>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FINAL CTA SECTION */}
      {/* ================================================================== */}
      <section ref={ctaRef} className="py-24 bg-gradient-to-br from-pink to-pink-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              {ctaTitle}
            </h2>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              Rejoins 15,234 personnes qui ont transformé leur peau avec cette routine K-beauty essentielle.
            </p>

            <button
              onClick={handleCheckout}
              disabled={isLoading}
              className="bg-white text-pink hover:bg-gray-100 font-semibold px-12 py-5 rounded-full transition-all duration-300 ease-out hover:scale-105 hover:shadow-2xl active:scale-95 text-xl tracking-tight inline-flex items-center gap-3 disabled:opacity-50 mb-8"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-pink/30 border-t-pink rounded-full animate-spin" />
              ) : (
                <>
                  <ShoppingBag className="w-6 h-6" />
                  Ajouter au panier • {currentPrices[selectedVariant]}€
                </>
              )}
            </button>

            <div className="flex flex-wrap items-center justify-center gap-6 text-white/70 text-sm">
              <span className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Livraison offerte
              </span>
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                30j satisfait ou remboursé
              </span>
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Paiement sécurisé
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Support 7j/7
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* STICKY MOBILE BAR */}
      {/* ================================================================== */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 lg:hidden"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-gray-950">{currentPrices[selectedVariant]}€</p>
                <p className="text-sm text-gray-500 line-through">{currentOriginalPrices[selectedVariant]}€</p>
              </div>
              <button
                onClick={handleCheckout}
                disabled={isLoading}
                className="flex-1 bg-pink hover:bg-pink-dark text-white font-semibold py-4 rounded-full transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
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

      {/* Footer spacer for sticky bar */}
      <div className="h-24 lg:hidden" />
    </div>
  )
}

// ============================================================================
// PRODUCT CARD COMPONENT
// ============================================================================

function ProductCard({ product, index }: { product: typeof PRODUCTS[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-shadow duration-500 border border-gray-100"
    >
      {/* Image */}
      <div className={`aspect-square bg-gradient-to-br ${product.color} relative overflow-hidden`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <Droplets className="w-20 h-20 text-gray-400/30" />
        </div>
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-gray-700">
            ÉTAPE {product.step}
          </span>
          <span className="bg-pink/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-white">
            {product.time}
          </span>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
      </div>

      {/* Content */}
      <div className="p-6">
        <p className="text-sm text-pink font-semibold mb-1">{product.brand}</p>
        <h3 className="text-xl font-bold text-gray-950 mb-3">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-4 leading-relaxed">{product.description}</p>

        {/* Ingredients */}
        <div className="flex flex-wrap gap-2 mb-4">
          {product.ingredients.map((ing, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 bg-lavender/20 text-gray-700 px-3 py-1 rounded-full text-xs font-medium"
            >
              <Sparkles className="w-3 h-3" />
              {ing}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-semibold text-gray-900">{product.stats.satisfaction}%</span>
            <span className="text-sm text-gray-500">satisfaites</span>
          </div>
          <span className="text-sm text-gray-500">{product.stats.duration}</span>
        </div>
      </div>
    </motion.article>
  )
}

// ============================================================================
// REVIEW CARD COMPONENT
// ============================================================================

function ReviewCard({ review, index }: { review: typeof REVIEWS[0]; index: number }) {
  return (
    <motion.div
      variants={fadeInUp}
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-light to-lavender flex items-center justify-center text-lg">
            {review.avatar}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{review.name}</p>
            <p className="text-xs text-gray-500">{review.skinType} • {review.age} ans</p>
          </div>
        </div>
        {review.verified && (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <Check className="w-3 h-3" />
            Vérifié
          </span>
        )}
      </div>

      {/* Rating */}
      <div className="flex gap-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
      <p className="text-gray-600 text-sm leading-relaxed mb-4">{review.content}</p>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{review.date}</span>
        <span>{review.helpful} personnes ont trouvé cet avis utile</span>
      </div>
    </motion.div>
  )
}
