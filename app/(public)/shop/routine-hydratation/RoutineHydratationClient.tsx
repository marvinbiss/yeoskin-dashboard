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
  Package,
  Tag
} from 'lucide-react'

// ============================================================================
// TYPES & DATA
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
    time: 'MATIN & SOIR',
    description: 'Essence légère à 96% de mucine d\'escargot. Hydrate en profondeur, répare la barrière cutanée et lisse la texture de la peau.',
    ingredients: ['Snail Mucin 96%', 'Hyaluronic Acid', 'Allantoin'],
    stats: { satisfaction: 97, duration: '100ml • 3 mois' },
    image: '/images/shop/cosrx-snail-essence.jpg',
    color: 'from-green-50 to-mint',
  },
  {
    id: 2,
    name: 'Advanced Snail 92 All In One Cream',
    brand: 'COSRX',
    step: 2,
    time: 'MATIN & SOIR',
    description: 'Crème tout-en-un enrichie en mucine d\'escargot. Nourrit, répare et protège la peau. Texture fondante non grasse.',
    ingredients: ['Snail Secretion 92%', 'Betaine', 'Allantoin'],
    stats: { satisfaction: 94, duration: '100ml • 3 mois' },
    image: '/images/shop/cosrx-snail-cream.jpg',
    color: 'from-amber-50 to-peach',
  },
  {
    id: 3,
    name: 'Oil-Free Ultra-Moisturizing Lotion',
    brand: 'COSRX',
    step: 3,
    time: 'MATIN & SOIR',
    description: 'Lotion hydratante sans huile à base de sève de bouleau. Hydratation longue durée, fini mat. Idéale peaux mixtes à grasses.',
    ingredients: ['Birch Sap 70%', 'Hyaluronic Acid', 'Betaine'],
    stats: { satisfaction: 91, duration: '100ml • 3 mois' },
    image: '/images/shop/cosrx-lotion.jpg',
    color: 'from-purple-50 to-lavender',
  },
]

const UPSELLS = [
  {
    id: 'upsell_1',
    name: 'Revive Serum Ginseng+Snail Mucin',
    brand: 'Beauty of Joseon',
    badge: '+1 PRODUIT',
    benefit: 'Éclat + Régénération',
    description: 'Anti-âge naturel',
    price: 69.90,
    originalPrice: 89.80,
    image: '/images/shop/boj-revive-serum.jpg',
  },
  {
    id: 'upsell_2',
    name: 'Glow Deep Serum + Relief Sun',
    brand: 'Beauty of Joseon',
    badge: '+2 PRODUITS',
    benefit: 'Éclat + Protection SPF',
    description: 'Routine complète',
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
  before_after_1_before_url?: string
  before_after_1_after_url?: string
  before_after_2_before_url?: string
  before_after_2_after_url?: string
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
  const reviews = cms.reviews?.items?.length ? cms.reviews.items : REVIEWS

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
  const [creatorCode, setCreatorCode] = useState<string | null>(null)

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

  // Read creator discount code from sessionStorage
  useEffect(() => {
    const code = sessionStorage.getItem('yeoskin_creator_code')
    if (code) setCreatorCode(code)
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
          routine_slug: 'routine-hydratation',
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
    <div className="min-h-screen bg-luxury-cream">
      {/* ================================================================== */}
      {/* HERO SECTION - LUXURY REDESIGN */}
      {/* ================================================================== */}
      <section ref={heroRef} className="relative min-h-0 lg:min-h-screen flex items-center overflow-hidden">
        {/* Background - Premium cream gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-luxury-cream via-white to-luxury-champagne" />

        {/* Subtle gold accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-luxury-gold-500 to-transparent opacity-30" />

        {/* Floating luxury elements */}
        <div className="absolute top-20 left-10 w-40 sm:w-64 h-40 sm:h-64 bg-luxury-gold-500/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-60 sm:w-96 h-60 sm:h-96 bg-luxury-rose-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 lg:px-20 py-16 sm:py-24 lg:py-0">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Left: Image with luxury frame */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative order-2 lg:order-1"
            >
              <div className="relative aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-luxury-cream to-luxury-taupe/20 shadow-luxury-xl border border-luxury-gold-500/10">
                {routine?.image_url ? (
                  <img
                    src={routine.image_url}
                    alt={heroTitle}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-luxury-cream to-luxury-champagne">
                    <div className="text-center">
                      <Sparkles className="w-24 h-24 text-luxury-gold-500 mx-auto mb-4" />
                      <p className="text-luxury-taupe text-sm font-medium tracking-wide">YEOSKIN COLLECTION</p>
                    </div>
                  </div>
                )}

                {/* Luxury floating badge - Gold accent */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-luxury-black text-white rounded-full px-4 sm:px-5 py-2 sm:py-2.5 shadow-luxury-lg"
                >
                  <span className="text-xs sm:text-sm font-semibold tracking-wider">-15%</span>
                </motion.div>

                {/* Rating badge - Premium gold stars */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                  className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 bg-white/95 backdrop-blur-sm rounded-2xl p-3 sm:p-4 shadow-luxury-lg border border-luxury-gold-500/20 flex items-center gap-2 sm:gap-3"
                >
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-luxury-gold-500 text-luxury-gold-500" />
                    ))}
                  </div>
                  <span className="text-sm sm:text-base font-semibold text-luxury-black">{heroRating}</span>
                </motion.div>
              </div>
            </motion.div>

            {/* Right: Content - Luxury typography */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="order-1 lg:order-2"
            >
              {/* Eyebrow - Gold accent */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-luxury-gold-500/10 text-luxury-gold-600 px-5 py-2.5 rounded-full text-sm font-semibold tracking-widest uppercase mb-8"
              >
                <Sparkles className="w-4 h-4" />
                {heroBadge}
              </motion.div>

              {/* Title - Serif luxury font */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-serif font-bold text-luxury-black tracking-tight leading-[1.1] mb-6 sm:mb-8">
                {heroTitle}
                <br />
                <span className="text-luxury-rose-500 italic">{heroSubtitle}</span>
              </h1>

              {/* Description - Refined */}
              <p className="text-lg sm:text-xl text-neutral-600 leading-relaxed mb-6 sm:mb-8 max-w-lg font-light">
                La routine K-beauty minimaliste qui transforme ta peau en 4 semaines.
                <span className="font-medium text-luxury-black"> 3 produits iconiques, 1 geste matin & soir.</span>
              </p>

              {/* Trust badges - Luxury styling */}
              <div className="flex flex-wrap gap-3 sm:gap-4 mb-8 sm:mb-10">
                {[
                  { icon: Leaf, label: 'Vegan' },
                  { icon: Heart, label: 'Cruelty-free' },
                  { icon: Shield, label: 'Testé cliniquement' },
                ].map((badge, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-2 bg-white border border-luxury-gold-500/20 text-luxury-black px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium shadow-luxury-xs hover:shadow-luxury-sm hover:border-luxury-gold-500/40 transition-all"
                  >
                    <badge.icon className="w-4 h-4 text-luxury-gold-600" />
                    {badge.label}
                  </span>
                ))}
              </div>

              {/* Price - Premium display */}
              <div className="mb-8 sm:mb-10 p-6 bg-white rounded-2xl shadow-luxury-sm border border-luxury-gold-500/10">
                <div className="flex flex-wrap items-baseline gap-3 sm:gap-4">
                  <span className="text-4xl sm:text-5xl font-serif font-bold text-luxury-black">{currentPrices[selectedVariant]}€</span>
                  <span className="text-lg sm:text-xl text-neutral-400 line-through">{currentOriginalPrices[selectedVariant]}€</span>
                  <span className="bg-luxury-gold-500/10 text-luxury-gold-700 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold tracking-wide">
                    ÉCONOMISEZ {(currentOriginalPrices[selectedVariant] - currentPrices[selectedVariant]).toFixed(0)}€
                  </span>
                </div>
              </div>

              {/* CTA Buttons - Luxury treatment */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                <button
                  onClick={handleCheckout}
                  disabled={isLoading}
                  className="group bg-luxury-black hover:bg-luxury-rose-500 text-white font-semibold px-8 sm:px-10 py-4 sm:py-5 rounded-full transition-all duration-300 ease-out hover:scale-105 hover:shadow-luxury-xl active:scale-95 text-base sm:text-lg tracking-wide uppercase flex items-center justify-center gap-3 disabled:opacity-50"
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
                  className="bg-transparent border-2 border-luxury-black text-luxury-black font-semibold px-8 sm:px-10 py-4 sm:py-5 rounded-full transition-all duration-300 hover:bg-luxury-black hover:text-white text-base sm:text-lg text-center tracking-wide uppercase"
                >
                  Découvrir
                </a>
              </div>

              {/* Micro-trust - Refined */}
              <div className="flex flex-wrap items-center gap-6 sm:gap-8 mt-6 sm:mt-8 text-sm text-neutral-500">
                <span className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-luxury-gold-500" />
                  Livraison offerte
                </span>
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-luxury-gold-500" />
                  30 jours satisfait ou remboursé
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator - Gold */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:block"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-luxury-gold-500"
          >
            <ChevronDown className="w-6 h-6" />
          </motion.div>
        </motion.div>
      </section>

      {/* ================================================================== */}
      {/* SOCIAL PROOF BAR - LUXURY BLACK & GOLD */}
      {/* ================================================================== */}
      <section className="bg-luxury-black py-6 sm:py-8 border-y border-luxury-gold-500/20">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-12">
            {STATS.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-luxury-gold-500 mx-auto mb-2 sm:mb-3" />
                <p className="text-xl sm:text-3xl font-serif font-bold text-white">{stat.value}</p>
                <p className="text-xs sm:text-sm text-neutral-400 tracking-wide uppercase mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* PRODUCTS SECTION - LUXURY */}
      {/* ================================================================== */}
      <section id="products" className="py-16 sm:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-20">
          {/* Section header - Luxury typography */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-12 sm:mb-20"
          >
            <span className="text-luxury-gold-600 font-semibold text-sm tracking-[0.2em] uppercase mb-6 block">
              La Collection
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-luxury-black mb-4 sm:mb-6">
              3 Produits. 3 Étapes.
              <br />
              <span className="text-luxury-rose-500 italic">Résultats Garantis.</span>
            </h2>
            <p className="text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto font-light">
              Chaque produit a été sélectionné pour sa qualité exceptionnelle et son efficacité prouvée.
            </p>
          </motion.div>

          {/* Products grid - Luxury cards */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-6 sm:gap-10"
          >
            {displayProducts.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* HOW TO USE SECTION - LUXURY */}
      {/* ================================================================== */}
      <section className="py-16 sm:py-32 bg-gradient-to-b from-luxury-cream to-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-12 sm:mb-20"
          >
            <span className="text-luxury-gold-600 font-semibold text-sm tracking-[0.2em] uppercase mb-6 block">
              Le Rituel
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-luxury-black mb-4 sm:mb-6">
              2 Minutes <span className="text-luxury-rose-500 italic">Matin & Soir</span>
            </h2>
            <p className="text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto font-light">
              Un rituel de beauté simple qui s'intègre naturellement dans votre quotidien.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 sm:gap-12">
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
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-luxury-black text-white rounded-full flex items-center justify-center text-2xl sm:text-4xl font-serif font-bold mx-auto mb-6 sm:mb-8 shadow-luxury-lg">
                  {i + 1}
                </div>
                <h3 className="text-lg sm:text-2xl font-serif font-bold text-luxury-black mb-2 sm:mb-3">{product.name.split(' ').slice(-2).join(' ')}</h3>
                <p className="text-sm sm:text-base text-neutral-600 mb-2 sm:mb-3">{product.brand}</p>
                <p className="text-xs sm:text-sm text-luxury-gold-600 font-semibold tracking-wider uppercase">{product.time}</p>
              </motion.div>
            ))}
          </div>

          {/* Timeline visual - Gold accent */}
          <div className="hidden md:block relative mt-12">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-luxury-gold-500/30 -translate-y-1/2" />
            <div className="absolute top-1/2 left-0 w-1/3 h-px bg-gradient-to-r from-luxury-gold-500 to-luxury-gold-500/50 -translate-y-1/2" />
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* BEFORE / AFTER SECTION */}
      {/* ================================================================== */}
      <section className="py-12 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-8 sm:mb-16"
          >
            <span className="text-pink font-semibold text-sm tracking-widest uppercase mb-4 block">
              Résultats réels
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-gray-950 mb-3 sm:mb-4">
              Transformations Vérifiées
            </h2>
            <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Des résultats visibles en 4 semaines, validés par notre communauté.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-8 max-w-4xl mx-auto">
            {[
              {
                name: 'Claire, 26 ans',
                issue: 'Pores dilatés, teint terne',
                result: 'Pores resserrés, éclat retrouvé',
                duration: '4 semaines',
                beforeImage: routine?.before_after_1_before_url,
                afterImage: routine?.before_after_1_after_url,
              },
              {
                name: 'Julie, 32 ans',
                issue: 'Déshydratation, ridules',
                result: 'Peau repulpée, ridules atténuées',
                duration: '6 semaines',
                beforeImage: routine?.before_after_2_before_url,
                afterImage: routine?.before_after_2_after_url,
              },
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={scaleIn}
                className="bg-gray-50 rounded-2xl sm:rounded-3xl p-5 sm:p-8"
              >
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 aspect-square bg-gray-200 rounded-2xl overflow-hidden flex items-center justify-center">
                    {testimonial.beforeImage ? (
                      <img src={testimonial.beforeImage} alt="Avant" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-400 text-sm">Avant</span>
                    )}
                  </div>
                  <div className="flex-1 aspect-square bg-pink-light rounded-2xl overflow-hidden flex items-center justify-center">
                    {testimonial.afterImage ? (
                      <img src={testimonial.afterImage} alt="Après" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-pink text-sm">Après</span>
                    )}
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
      <section className="py-12 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-8 sm:mb-16"
          >
            <span className="text-pink font-semibold text-sm tracking-widest uppercase mb-4 block">
              Avis vérifiés
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-gray-950 mb-3 sm:mb-4">
              Ce Qu'Elles En Pensent
            </h2>
            <div className="flex items-center justify-center gap-1 sm:gap-2 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 sm:w-6 sm:h-6 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="text-base sm:text-xl font-bold text-gray-950 ml-2">{heroRating}/5</span>
              <span className="text-xs sm:text-base text-gray-600">({heroReviews.toLocaleString()} avis)</span>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            {reviews.map((review, i) => (
              <ReviewCard key={review.id || i} review={review} index={i} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* UPSELLS SECTION */}
      {/* ================================================================== */}
      <section className="py-12 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-8 sm:mb-16"
          >
            <span className="text-pink font-semibold text-sm tracking-widest uppercase mb-4 block">
              Booste ta routine
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-gray-950 mb-3 sm:mb-4">
              Ajoute un Booster
            </h2>
            <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto">
              84% de nos clients ajoutent au moins 1 produit supplémentaire.
            </p>
          </motion.div>

          {creatorCode && (
            <div className="flex items-center justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                <Tag className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  Code promo <strong>{creatorCode}</strong> appliqué automatiquement
                </span>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-3 sm:gap-8 max-w-4xl mx-auto">
            {/* Base option */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleIn}
              onClick={() => setSelectedVariant('base')}
              className={`cursor-pointer p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 transition-all duration-300 ${
                selectedVariant === 'base'
                  ? 'border-pink bg-pink-light/30 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                  PACK DE BASE
                </span>
                <p className="text-2xl sm:text-3xl font-bold text-gray-950 mb-2">{currentPrices.base}€</p>
                <p className="text-gray-400 line-through text-sm mb-4">{currentOriginalPrices.base}€</p>
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
                className={`cursor-pointer p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 transition-all duration-300 ${
                  selectedVariant === upsell.id
                    ? 'border-pink bg-pink-light/30 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <span className="inline-block bg-pink text-white px-3 py-1 rounded-full text-sm font-medium mb-4">
                    {upsell.badge}
                  </span>

                  {/* Product Image */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 rounded-xl overflow-hidden bg-gradient-to-br from-pink-light to-lavender-light">
                    {upsell.image ? (
                      <img
                        src={upsell.image}
                        alt={upsell.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-pink/40" />
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-gray-950 mb-1 text-sm sm:text-base">{upsell.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">{upsell.brand}</p>
                  <p className="text-xs sm:text-sm text-pink font-medium mb-3">{upsell.benefit}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-950 mb-1">{upsell.price}€</p>
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
          <div className="text-center mt-8 sm:mt-12">
            <button
              onClick={handleCheckout}
              disabled={isLoading}
              className="bg-pink hover:bg-pink-dark text-white font-semibold px-6 sm:px-12 py-4 sm:py-5 rounded-full transition-all duration-300 ease-out hover:scale-105 hover:shadow-2xl active:scale-95 text-base sm:text-xl tracking-tight inline-flex items-center gap-2 sm:gap-3 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
                  Commander • {currentPrices[selectedVariant]}€
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FAQ SECTION */}
      {/* ================================================================== */}
      <section className="py-12 sm:py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-8 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-gray-950 mb-3 sm:mb-4">
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
                  className="w-full text-left p-4 sm:p-6 bg-white rounded-xl sm:rounded-2xl border border-gray-200 hover:border-gray-300 transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-sm sm:text-base text-gray-950">{faq.question}</span>
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
                        <p className="pt-3 sm:pt-4 text-sm sm:text-base text-gray-600">{faq.answer}</p>
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
      <section ref={ctaRef} className="py-12 sm:py-24 bg-gradient-to-br from-pink to-pink-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
              {ctaTitle}
            </h2>
            <p className="text-base sm:text-xl text-white/80 mb-6 sm:mb-10 max-w-2xl mx-auto">
              Rejoins 15,234 personnes qui ont transformé leur peau avec cette routine K-beauty essentielle.
            </p>

            <button
              onClick={handleCheckout}
              disabled={isLoading}
              className="bg-white text-pink hover:bg-gray-100 font-semibold px-6 sm:px-12 py-4 sm:py-5 rounded-full transition-all duration-300 ease-out hover:scale-105 hover:shadow-2xl active:scale-95 text-base sm:text-xl tracking-tight inline-flex items-center gap-2 sm:gap-3 disabled:opacity-50 mb-6 sm:mb-8"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-pink/30 border-t-pink rounded-full animate-spin" />
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
                  Ajouter au panier • {currentPrices[selectedVariant]}€
                </>
              )}
            </button>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2 sm:gap-6 text-white/70 text-xs sm:text-sm">
              <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Livraison offerte
              </span>
              <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                30j remboursé
              </span>
              <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Paiement sécurisé
              </span>
              <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
      className="group bg-white rounded-3xl overflow-hidden shadow-luxury-sm hover:shadow-luxury-xl transition-all duration-500 border border-luxury-gold-500/10 hover:border-luxury-gold-500/30"
    >
      {/* Image - Luxury treatment */}
      <div className="aspect-square bg-gradient-to-br from-luxury-cream to-luxury-champagne relative overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Droplets className="w-20 h-20 text-luxury-gold-500/20" />
          </div>
        )}
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="bg-luxury-black text-white px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider">
            ÉTAPE {product.step}
          </span>
          <span className="bg-luxury-gold-500 text-luxury-black px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider">
            {product.time}
          </span>
        </div>

        {/* Hover overlay - Subtle gold shimmer */}
        <div className="absolute inset-0 bg-gradient-to-t from-luxury-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content - Luxury typography */}
      <div className="p-6 sm:p-8">
        <p className="text-sm text-luxury-gold-600 font-semibold tracking-wider uppercase mb-2">{product.brand}</p>
        <h3 className="text-xl sm:text-2xl font-serif font-bold text-luxury-black mb-3">{product.name}</h3>
        <p className="text-neutral-600 text-sm leading-relaxed mb-4">{product.description}</p>

        {/* Ingredients - Gold accent */}
        <div className="flex flex-wrap gap-2 mb-5">
          {product.ingredients.map((ing, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 bg-luxury-gold-500/10 text-luxury-gold-700 px-3 py-1.5 rounded-full text-xs font-medium border border-luxury-gold-500/20"
            >
              <Sparkles className="w-3 h-3" />
              {ing}
            </span>
          ))}
        </div>

        {/* Stats - Luxury divider */}
        <div className="flex items-center justify-between pt-5 border-t border-luxury-gold-500/20">
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 fill-luxury-gold-500 text-luxury-gold-500" />
            <span className="text-sm font-semibold text-luxury-black">{product.stats.satisfaction}%</span>
            <span className="text-sm text-neutral-500">satisfaites</span>
          </div>
          <span className="text-sm text-neutral-500">{product.stats.duration}</span>
        </div>
      </div>
    </motion.article>
  )
}

// ============================================================================
// REVIEW CARD COMPONENT
// ============================================================================

function ReviewCard({ review, index }: { review: { id?: number; name: string; age?: number; skinType?: string; skin_type?: string; rating: number; title: string; content?: string; text?: string; date?: string; verified?: boolean; helpful?: number; avatar?: string }; index: number }) {
  return (
    <motion.div
      variants={fadeInUp}
      className="bg-white rounded-2xl p-6 sm:p-8 shadow-luxury-sm border border-luxury-gold-500/10 hover:border-luxury-gold-500/30 hover:shadow-luxury-md transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-luxury-cream to-luxury-champagne flex items-center justify-center text-xl border border-luxury-gold-500/20">
            {review.avatar}
          </div>
          <div>
            <p className="font-semibold text-luxury-black text-sm">{review.name}</p>
            <p className="text-xs text-neutral-500">{review.skinType || review.skin_type} • {review.age} ans</p>
          </div>
        </div>
        {review.verified && (
          <span className="flex items-center gap-1 text-xs text-luxury-gold-600 font-medium">
            <Check className="w-3 h-3" />
            Vérifié
          </span>
        )}
      </div>

      {/* Rating - Gold stars */}
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < review.rating ? 'fill-luxury-gold-500 text-luxury-gold-500' : 'text-neutral-200'
            }`}
          />
        ))}
      </div>

      {/* Content - Luxury typography */}
      <h4 className="font-serif font-semibold text-luxury-black mb-2 text-lg">{review.title}</h4>
      <p className="text-neutral-600 text-sm leading-relaxed mb-5">{review.content || review.text}</p>

      {/* Footer - Gold accent */}
      <div className="flex items-center justify-between text-xs text-neutral-400 gap-2 pt-4 border-t border-luxury-gold-500/10">
        <span className="shrink-0">{review.date}</span>
        <span className="truncate text-luxury-gold-600">{review.helpful} utile</span>
      </div>
    </motion.div>
  )
}
