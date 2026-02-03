'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView, AnimatePresence, useScroll, useTransform } from 'framer-motion'
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
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Leaf,
  Award,
  Users,
  Package,
  Tag,
  Play,
  ChevronRight
} from 'lucide-react'

// ============================================================================
// WORLD-CLASS DESIGN SYSTEM - Inspired by Kylie, Glossier, Rare Beauty
// ============================================================================

// Premium color palette
const COLORS = {
  // Primary - Deep rose/burgundy (like Rare Beauty & Kylie)
  primary: '#8B2252',
  primaryLight: '#A8325F',
  primaryDark: '#6B1A40',

  // Accent - Soft blush
  accent: '#F8E8E8',
  accentDark: '#F0D4D4',

  // Neutrals
  black: '#1A1A1A',
  charcoal: '#2D2D2D',
  gray: '#6B6B6B',
  grayLight: '#9B9B9B',
  cream: '#FDFBF9',
  white: '#FFFFFF',

  // Gold accents
  gold: '#C9A96E',
  goldLight: '#E8D5B5',
}

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
    description: 'Essence légère à 96% de mucine d\'escargot. Hydrate en profondeur, répare la barrière cutanée et lisse la texture.',
    ingredients: ['Snail Mucin 96%', 'Hyaluronic Acid', 'Allantoin'],
    stats: { satisfaction: 97, duration: '100ml • 3 mois' },
    image: '/images/shop/cosrx-snail-essence.jpg',
  },
  {
    id: 2,
    name: 'Advanced Snail 92 All In One Cream',
    brand: 'COSRX',
    step: 2,
    time: 'MATIN & SOIR',
    description: 'Crème tout-en-un enrichie en mucine d\'escargot. Nourrit, répare et protège. Texture fondante non grasse.',
    ingredients: ['Snail Secretion 92%', 'Betaine', 'Allantoin'],
    stats: { satisfaction: 94, duration: '100ml • 3 mois' },
    image: '/images/shop/cosrx-snail-cream.jpg',
  },
  {
    id: 3,
    name: 'Oil-Free Ultra-Moisturizing Lotion',
    brand: 'COSRX',
    step: 3,
    time: 'MATIN & SOIR',
    description: 'Lotion hydratante sans huile à base de sève de bouleau. Hydratation longue durée, fini mat parfait.',
    ingredients: ['Birch Sap 70%', 'Hyaluronic Acid', 'Betaine'],
    stats: { satisfaction: 91, duration: '100ml • 3 mois' },
    image: '/images/shop/cosrx-lotion.jpg',
  },
]

const UPSELLS = [
  {
    id: 'upsell_1',
    name: 'Revive Serum Ginseng+Snail',
    brand: 'Beauty of Joseon',
    badge: 'POPULAIRE',
    benefit: 'Éclat + Régénération',
    description: 'Sérum anti-âge naturel',
    price: 69.90,
    originalPrice: 89.80,
    image: '/images/shop/boj-revive-serum.jpg',
  },
  {
    id: 'upsell_2',
    name: 'Glow Serum + Relief Sun',
    brand: 'Beauty of Joseon',
    badge: 'BEST VALUE',
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
    content: 'Enfin une crème qui hydrate vraiment sans laisser de film gras. Le sérum sent divinement bon.',
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
    content: 'J\'avais peur que ce soit trop riche pour ma peau grasse mais pas du tout ! Matifié mais confortable.',
    date: 'Il y a 2 semaines',
    verified: true,
    helpful: 156,
    avatar: '👩🏽',
  },
]

const FAQS = [
  {
    question: 'Pour quel type de peau ?',
    answer: 'Tous types : grasse, sèche, mixte, sensible. Les formules sont non-comédogènes et hypoallergéniques.',
  },
  {
    question: 'Combien de temps dure le pack ?',
    answer: '3-4 mois avec utilisation quotidienne matin & soir. Un excellent rapport qualité-prix.',
  },
  {
    question: 'Quand vais-je voir des résultats ?',
    answer: 'Hydratation immédiate. Éclat visible en 1 semaine. Texture améliorée en 4 semaines.',
  },
  {
    question: 'Livraison et retours ?',
    answer: 'Livraison gratuite en France. 30 jours satisfait ou remboursé, même produits entamés.',
  },
]

// ============================================================================
// INTERFACES
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function RoutineHydratationClient({ cms = {}, routine }: Props) {
  const cmsHero = cms.hero || {}
  const cmsFaq = cms.faq || {}
  const cmsCta = cms.cta || {}
  const reviews = cms.reviews?.items?.length ? cms.reviews.items : REVIEWS
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

  const heroTitle = cmsHero.title || routine?.title || 'Routine Hydratation'
  const heroRating = cmsHero.stats?.rating || 4.9
  const heroReviews = cmsHero.stats?.reviews || 2847
  const faqItems = cmsFaq.items?.length ? cmsFaq.items : FAQS

  const [selectedVariant, setSelectedVariant] = useState<VariantType>('base')
  const [isLoading, setIsLoading] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [showStickyBar, setShowStickyBar] = useState(false)
  const [creatorCode, setCreatorCode] = useState<string | null>(null)

  const heroRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    const code = sessionStorage.getItem('yeoskin_creator_code')
    if (code) setCreatorCode(code)
  }, [])

  const getCreatorSlug = (): string => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const creatorParam = urlParams.get('creator')
      if (creatorParam) {
        sessionStorage.setItem('yeoskin_creator_slug', creatorParam)
        return creatorParam
      }
      const storedCreator = sessionStorage.getItem('yeoskin_creator_slug')
      if (storedCreator) return storedCreator
    }
    return 'yeoskin'
  }

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

  const savings = currentOriginalPrices[selectedVariant] - currentPrices[selectedVariant]

  return (
    <div className="min-h-screen bg-white">
      {/* ================================================================== */}
      {/* ANNOUNCEMENT BAR - Like Kylie */}
      {/* ================================================================== */}
      <div className="bg-[#8B2252] text-white py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm">
          <Sparkles className="w-4 h-4" />
          <span className="font-medium">LIVRAISON OFFERTE</span>
          <span className="opacity-70">•</span>
          <span className="opacity-90">30 jours satisfait ou remboursé</span>
        </div>
      </div>

      {/* ================================================================== */}
      {/* HERO SECTION - World Class */}
      {/* ================================================================== */}
      <section ref={heroRef} className="relative bg-[#FDFBF9]">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid lg:grid-cols-2 min-h-[calc(100vh-48px)]">
            {/* Left - Image */}
            <div className="relative bg-gradient-to-br from-[#F8E8E8] to-[#FDFBF9] order-2 lg:order-1">
              <div className="absolute inset-0 flex items-center justify-center p-8 lg:p-16">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8 }}
                  className="relative w-full max-w-lg aspect-square"
                >
                  {routine?.image_url ? (
                    <img
                      src={routine.image_url}
                      alt={heroTitle}
                      className="w-full h-full object-cover rounded-3xl shadow-2xl"
                    />
                  ) : (
                    <div className="w-full h-full rounded-3xl bg-gradient-to-br from-[#F8E8E8] to-white flex items-center justify-center shadow-2xl">
                      <div className="text-center">
                        <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-[#8B2252]/10 flex items-center justify-center">
                          <Sparkles className="w-16 h-16 text-[#8B2252]" />
                        </div>
                        <p className="text-[#8B2252] font-medium tracking-widest text-sm">YEOSKIN</p>
                      </div>
                    </div>
                  )}

                  {/* Floating badge */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="absolute -bottom-4 -right-4 lg:bottom-8 lg:-right-8 bg-white rounded-2xl p-4 shadow-xl border border-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-[#C9A96E] text-[#C9A96E]" />
                        ))}
                      </div>
                      <span className="font-semibold text-[#1A1A1A]">{heroRating}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{heroReviews.toLocaleString()} avis vérifiés</p>
                  </motion.div>
                </motion.div>
              </div>
            </div>

            {/* Right - Content */}
            <div className="flex flex-col justify-center px-6 py-12 lg:px-16 lg:py-24 order-1 lg:order-2">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-[#8B2252]/10 text-[#8B2252] px-4 py-2 rounded-full text-xs font-semibold tracking-widest uppercase mb-6">
                  <Award className="w-4 h-4" />
                  BEST-SELLER 2024
                </div>

                {/* Title - Elegant serif */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-serif font-light text-[#1A1A1A] leading-[1.1] mb-6">
                  {heroTitle}
                  <span className="block text-[#8B2252] font-normal italic mt-2">en 3 gestes</span>
                </h1>

                {/* Subtitle */}
                <p className="text-lg lg:text-xl text-[#6B6B6B] leading-relaxed mb-8 max-w-xl">
                  La routine K-beauty minimaliste qui transforme votre peau en 4 semaines.
                  <span className="text-[#1A1A1A] font-medium"> Résultats garantis.</span>
                </p>

                {/* Trust badges - Minimal */}
                <div className="flex flex-wrap gap-6 mb-10 text-sm text-[#6B6B6B]">
                  <span className="flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-[#8B2252]" />
                    Vegan
                  </span>
                  <span className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-[#8B2252]" />
                    Cruelty-free
                  </span>
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#8B2252]" />
                    Testé dermato
                  </span>
                </div>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-4xl lg:text-5xl font-light text-[#1A1A1A]">{currentPrices[selectedVariant].toFixed(2)}€</span>
                    <span className="text-xl text-[#9B9B9B] line-through">{currentOriginalPrices[selectedVariant].toFixed(2)}€</span>
                  </div>
                  <p className="text-sm text-[#8B2252] font-medium">
                    Économisez {savings.toFixed(2)}€ ({Math.round((savings / currentOriginalPrices[selectedVariant]) * 100)}%)
                  </p>
                </div>

                {/* CTA Button - Primary */}
                <button
                  onClick={handleCheckout}
                  disabled={isLoading}
                  className="group w-full sm:w-auto bg-[#1A1A1A] hover:bg-[#8B2252] text-white font-medium px-12 py-5 rounded-full transition-all duration-300 text-lg flex items-center justify-center gap-3 disabled:opacity-50 mb-6"
                >
                  {isLoading ? (
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
                <div className="flex items-center gap-4 text-sm text-[#9B9B9B]">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4" />
                    Livraison 48h
                  </span>
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4" />
                    Retours gratuits
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SOCIAL PROOF BAR */}
      {/* ================================================================== */}
      <section className="bg-[#1A1A1A] py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '15,234', label: 'Routines vendues' },
              { value: '4.9/5', label: 'Note moyenne' },
              { value: '94%', label: 'Rachètent' },
              { value: '2,847', label: 'Avis vérifiés' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <p className="text-2xl lg:text-4xl font-light text-white mb-1">{stat.value}</p>
                <p className="text-xs lg:text-sm text-gray-400 uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* THE ROUTINE - Products */}
      {/* ================================================================== */}
      <section id="products" className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 lg:mb-24"
          >
            <p className="text-[#8B2252] font-medium tracking-widest text-sm uppercase mb-4">La Collection</p>
            <h2 className="text-3xl lg:text-5xl font-serif font-light text-[#1A1A1A] mb-4">
              Trois produits. <span className="italic text-[#8B2252]">Résultats garantis.</span>
            </h2>
            <p className="text-lg text-[#6B6B6B] max-w-2xl mx-auto">
              Chaque produit a été sélectionné pour son efficacité prouvée cliniquement.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {displayProducts.map((product, i) => (
              <motion.article
                key={product.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="group"
              >
                {/* Image */}
                <div className="relative aspect-[4/5] bg-[#F8E8E8] rounded-2xl overflow-hidden mb-6">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Droplets className="w-20 h-20 text-[#8B2252]/20" />
                    </div>
                  )}

                  {/* Step badge */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="bg-[#1A1A1A] text-white px-4 py-2 rounded-full text-xs font-medium tracking-wider">
                      ÉTAPE {product.step}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <p className="text-[#8B2252] text-sm font-medium tracking-wider uppercase mb-2">{product.brand}</p>
                  <h3 className="text-xl lg:text-2xl font-serif text-[#1A1A1A] mb-3">{product.name}</h3>
                  <p className="text-[#6B6B6B] text-sm leading-relaxed mb-4">{product.description}</p>

                  {/* Ingredients */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {product.ingredients.map((ing, j) => (
                      <span key={j} className="text-xs px-3 py-1.5 bg-[#F8E8E8] text-[#6B6B6B] rounded-full">
                        {ing}
                      </span>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm pt-4 border-t border-gray-100">
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-[#C9A96E] text-[#C9A96E]" />
                      <span className="font-medium text-[#1A1A1A]">{product.stats.satisfaction}%</span>
                      <span className="text-[#9B9B9B]">satisfaites</span>
                    </span>
                    <span className="text-[#9B9B9B]">{product.stats.duration}</span>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* HOW IT WORKS */}
      {/* ================================================================== */}
      <section className="py-20 lg:py-32 bg-[#FDFBF9]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-[#8B2252] font-medium tracking-widest text-sm uppercase mb-4">Le Rituel</p>
            <h2 className="text-3xl lg:text-5xl font-serif font-light text-[#1A1A1A]">
              2 minutes. <span className="italic text-[#8B2252]">Matin & soir.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12 max-w-4xl mx-auto">
            {displayProducts.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-2xl font-light">
                  {i + 1}
                </div>
                <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">{product.name.split(' ').slice(-2).join(' ')}</h3>
                <p className="text-sm text-[#6B6B6B]">{product.brand}</p>
                <p className="text-xs text-[#8B2252] font-medium tracking-wider uppercase mt-2">{product.time}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* BEFORE / AFTER */}
      {/* ================================================================== */}
      {(routine?.before_after_1_before_url || routine?.before_after_2_before_url) && (
        <section className="py-20 lg:py-32 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <p className="text-[#8B2252] font-medium tracking-widest text-sm uppercase mb-4">Résultats Réels</p>
              <h2 className="text-3xl lg:text-5xl font-serif font-light text-[#1A1A1A]">
                Transformations <span className="italic text-[#8B2252]">vérifiées</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {[
                { name: 'Claire, 26 ans', before: routine?.before_after_1_before_url, after: routine?.before_after_1_after_url },
                { name: 'Julie, 32 ans', before: routine?.before_after_2_before_url, after: routine?.before_after_2_after_url },
              ].filter(t => t.before).map((testimonial, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-[#FDFBF9] rounded-2xl p-6"
                >
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="aspect-square bg-gray-200 rounded-xl overflow-hidden">
                      {testimonial.before && <img src={testimonial.before} alt="Avant" className="w-full h-full object-cover" />}
                      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">Avant</div>
                    </div>
                    <div className="aspect-square bg-[#F8E8E8] rounded-xl overflow-hidden">
                      {testimonial.after && <img src={testimonial.after} alt="Après" className="w-full h-full object-cover" />}
                      <div className="absolute bottom-2 left-2 bg-[#8B2252] text-white text-xs px-2 py-1 rounded">Après</div>
                    </div>
                  </div>
                  <p className="font-medium text-[#1A1A1A]">{testimonial.name}</p>
                  <p className="text-sm text-[#6B6B6B]">4 semaines de routine</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================================================================== */}
      {/* REVIEWS */}
      {/* ================================================================== */}
      <section className="py-20 lg:py-32 bg-[#FDFBF9]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-[#8B2252] font-medium tracking-widest text-sm uppercase mb-4">Avis Clients</p>
            <h2 className="text-3xl lg:text-5xl font-serif font-light text-[#1A1A1A] mb-4">
              Ce qu'elles <span className="italic text-[#8B2252]">en pensent</span>
            </h2>
            <div className="flex items-center justify-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-[#C9A96E] text-[#C9A96E]" />
                ))}
              </div>
              <span className="text-lg font-medium text-[#1A1A1A]">{heroRating}/5</span>
              <span className="text-[#6B6B6B]">({heroReviews.toLocaleString()} avis)</span>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {reviews.slice(0, 3).map((review: any, i: number) => (
              <motion.div
                key={review.id || i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 lg:p-8"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#F8E8E8] flex items-center justify-center text-lg">
                      {review.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-[#1A1A1A] text-sm">{review.name}</p>
                      <p className="text-xs text-[#9B9B9B]">{review.skinType || review.skin_type}</p>
                    </div>
                  </div>
                  {review.verified && (
                    <span className="flex items-center gap-1 text-xs text-[#8B2252]">
                      <Check className="w-3 h-3" />
                      Vérifié
                    </span>
                  )}
                </div>

                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className={`w-4 h-4 ${j < review.rating ? 'fill-[#C9A96E] text-[#C9A96E]' : 'text-gray-200'}`} />
                  ))}
                </div>

                <h4 className="font-medium text-[#1A1A1A] mb-2">{review.title}</h4>
                <p className="text-sm text-[#6B6B6B] leading-relaxed">{review.content || review.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* UPGRADE - Upsells */}
      {/* ================================================================== */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-[#8B2252] font-medium tracking-widest text-sm uppercase mb-4">Personnalisez</p>
            <h2 className="text-3xl lg:text-5xl font-serif font-light text-[#1A1A1A]">
              Choisissez votre <span className="italic text-[#8B2252]">formule</span>
            </h2>
          </motion.div>

          {creatorCode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center mb-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                <Tag className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  Code <strong>{creatorCode}</strong> appliqué
                </span>
              </div>
            </motion.div>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            {/* Base */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              onClick={() => setSelectedVariant('base')}
              className={`cursor-pointer rounded-2xl p-6 lg:p-8 transition-all duration-300 ${
                selectedVariant === 'base'
                  ? 'bg-[#8B2252] text-white ring-4 ring-[#8B2252]/20'
                  : 'bg-[#FDFBF9] text-[#1A1A1A] hover:bg-[#F8E8E8]'
              }`}
            >
              <div className="text-center">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium tracking-wider mb-4 ${
                  selectedVariant === 'base' ? 'bg-white/20' : 'bg-[#1A1A1A]/10'
                }`}>
                  ESSENTIEL
                </span>
                <p className="text-3xl lg:text-4xl font-light mb-2">{currentPrices.base.toFixed(2)}€</p>
                <p className={`text-sm line-through mb-4 ${selectedVariant === 'base' ? 'text-white/60' : 'text-[#9B9B9B]'}`}>
                  {currentOriginalPrices.base.toFixed(2)}€
                </p>
                <p className={`text-sm ${selectedVariant === 'base' ? 'text-white/80' : 'text-[#6B6B6B]'}`}>
                  3 produits essentiels
                </p>
              </div>
            </motion.div>

            {/* Upsells */}
            {displayUpsells.map((upsell, i) => (
              <motion.div
                key={upsell.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i + 1) * 0.1 }}
                onClick={() => setSelectedVariant(upsell.id as VariantType)}
                className={`cursor-pointer rounded-2xl p-6 lg:p-8 transition-all duration-300 relative ${
                  selectedVariant === upsell.id
                    ? 'bg-[#8B2252] text-white ring-4 ring-[#8B2252]/20'
                    : 'bg-[#FDFBF9] text-[#1A1A1A] hover:bg-[#F8E8E8]'
                }`}
              >
                {i === 1 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C9A96E] text-white text-xs font-medium px-3 py-1 rounded-full">
                    MEILLEURE VALEUR
                  </div>
                )}
                <div className="text-center">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium tracking-wider mb-4 ${
                    selectedVariant === upsell.id ? 'bg-white/20' : 'bg-[#8B2252]/10 text-[#8B2252]'
                  }`}>
                    {upsell.badge}
                  </span>

                  {upsell.image && (
                    <div className="w-16 h-16 mx-auto mb-4 rounded-xl overflow-hidden bg-white/10">
                      <img src={upsell.image} alt={upsell.name} className="w-full h-full object-cover" />
                    </div>
                  )}

                  <p className={`font-medium text-sm mb-1 ${selectedVariant === upsell.id ? 'text-white' : 'text-[#1A1A1A]'}`}>
                    {upsell.name}
                  </p>
                  <p className={`text-xs mb-3 ${selectedVariant === upsell.id ? 'text-white/70' : 'text-[#6B6B6B]'}`}>
                    {upsell.benefit}
                  </p>
                  <p className="text-3xl lg:text-4xl font-light mb-2">{upsell.price.toFixed(2)}€</p>
                  <p className={`text-sm line-through ${selectedVariant === upsell.id ? 'text-white/60' : 'text-[#9B9B9B]'}`}>
                    {upsell.originalPrice.toFixed(2)}€
                  </p>
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
              onClick={handleCheckout}
              disabled={isLoading}
              className="group bg-[#1A1A1A] hover:bg-[#8B2252] text-white font-medium px-12 py-5 rounded-full transition-all duration-300 text-lg inline-flex items-center gap-3 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  Commander • {currentPrices[selectedVariant].toFixed(2)}€
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
      <section className="py-20 lg:py-32 bg-[#FDFBF9]">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-serif font-light text-[#1A1A1A]">
              Questions <span className="italic text-[#8B2252]">fréquentes</span>
            </h2>
          </motion.div>

          <div className="space-y-4">
            {faqItems.map((faq: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left p-6 bg-white rounded-xl transition-all hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium text-[#1A1A1A]">{faq.question}</span>
                    <ChevronDown className={`w-5 h-5 text-[#8B2252] transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
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
                        <p className="pt-4 text-[#6B6B6B] text-sm leading-relaxed">{faq.answer}</p>
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
      <section className="py-20 lg:py-32 bg-[#8B2252]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-5xl font-serif font-light text-white mb-6">
              Prête à transformer<br />
              <span className="italic">votre peau ?</span>
            </h2>
            <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
              Rejoignez plus de 15,000 femmes qui ont adopté cette routine K-beauty.
            </p>

            <button
              onClick={handleCheckout}
              disabled={isLoading}
              className="group bg-white hover:bg-[#F8E8E8] text-[#8B2252] font-medium px-12 py-5 rounded-full transition-all duration-300 text-lg inline-flex items-center gap-3 disabled:opacity-50 mb-8"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-[#8B2252]/30 border-t-[#8B2252] rounded-full animate-spin" />
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  Ajouter au panier • {currentPrices[selectedVariant].toFixed(2)}€
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
                30j remboursé
              </span>
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Paiement sécurisé
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
            className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 lg:hidden shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-[#1A1A1A]">{currentPrices[selectedVariant].toFixed(2)}€</p>
                <p className="text-sm text-[#9B9B9B] line-through">{currentOriginalPrices[selectedVariant].toFixed(2)}€</p>
              </div>
              <button
                onClick={handleCheckout}
                disabled={isLoading}
                className="flex-1 bg-[#8B2252] hover:bg-[#6B1A40] text-white font-medium py-4 rounded-full transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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

      {/* Footer spacer */}
      <div className="h-24 lg:hidden" />
    </div>
  )
}
