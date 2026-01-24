'use client'

/**
 * CreatorPage - Public creator profile page
 * Displays creator info, products, and tracks views/clicks
 */
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from '@/lib/navigation'
import { supabase } from '../lib/supabase'
import { Button } from '../components/Common'
import { Instagram, ShoppingCart, ExternalLink, Youtube, Music2, Sparkles } from 'lucide-react'
import RoutineHydratationClient from '../../app/(public)/shop/routine-hydratation/RoutineHydratationClient'

export default function CreatorPage({ slug: slugProp }) {
  const params = useParams()
  const slug = slugProp || params?.slug
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [products, setProducts] = useState([])
  const [assignedRoutine, setAssignedRoutine] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (slug) {
      fetchProfile()
    }
  }, [slug])

  const fetchProfile = async () => {
    try {
      // Fetch profile
      const { data: profileData, error } = await supabase
        .from('creator_profiles')
        .select(`
          id, slug, display_name, tagline, bio, profile_image_url,
          banner_image_url, brand_color, instagram_handle, tiktok_handle,
          youtube_handle, custom_message, featured_products, views_count, clicks_count,
          creator:creators(id, discount_code, slug)
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .eq('is_public', true)
        .single()

      if (error || !profileData) {
        navigate('/404')
        return
      }

      setProfile(profileData)

      // Fetch products
      if (profileData.featured_products?.length > 0) {
        const { data: productsData } = await supabase
          .from('products')
          .select('id, name, slug, short_description, price, compare_at_price, image_url, stock_quantity')
          .in('id', profileData.featured_products)
          .eq('is_active', true)
          .gt('stock_quantity', 0)

        if (productsData) {
          const sorted = productsData.sort((a, b) => {
            const indexA = profileData.featured_products.indexOf(a.id)
            const indexB = profileData.featured_products.indexOf(b.id)
            return indexA - indexB
          })
          setProducts(sorted)
        }
      }

      // Fetch assigned routine (full data for embedded product page)
      if (profileData.creator?.id) {
        const { data: routineData } = await supabase
          .from('creator_routines')
          .select('routine_id, routines(id, title, slug, objective, objective_color, image_url, description, base_price, base_products, upsell_1_product, upsell_1_price, upsell_1_original_price, upsell_2_products, upsell_2_price, upsell_2_original_price, before_after_1_before_url, before_after_1_after_url, before_after_2_before_url, before_after_2_after_url, is_active)')
          .eq('creator_id', profileData.creator.id)
          .eq('is_active', true)
          .maybeSingle()

        if (routineData?.routines) {
          setAssignedRoutine(routineData.routines)
        }
      }

      // Track view
      trackView(profileData.id)

      // Store creator slug + code for checkout flow
      if (profileData.creator?.slug) {
        sessionStorage.setItem('yeoskin_creator_slug', profileData.creator.slug)
      }
      if (profileData.creator?.discount_code) {
        sessionStorage.setItem('yeoskin_creator_code', profileData.creator.discount_code)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const trackView = async (profileId) => {
    const sessionId = sessionStorage.getItem('yeoskin_session') || crypto.randomUUID()
    sessionStorage.setItem('yeoskin_session', sessionId)

    const deviceType = /Mobile|Android|iPhone/i.test(navigator.userAgent)
      ? 'mobile'
      : /Tablet|iPad/i.test(navigator.userAgent)
      ? 'tablet'
      : 'desktop'

    // Get UTM params from URL
    const urlParams = new URLSearchParams(window.location.search)
    const utmSource = urlParams.get('utm_source')
    const utmMedium = urlParams.get('utm_medium')
    const utmCampaign = urlParams.get('utm_campaign')

    await supabase.from('profile_views').insert({
      profile_id: profileId,
      user_agent: navigator.userAgent,
      referrer: document.referrer,
      device_type: deviceType,
      session_id: sessionId,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign
    })
  }

  const handleProductClick = async (product) => {
    const sessionId = sessionStorage.getItem('yeoskin_session')

    await supabase.from('profile_clicks').insert({
      profile_id: profile.id,
      product_id: product.id,
      user_agent: navigator.userAgent,
      session_id: sessionId
    })

    navigate(`/products/${product.slug}?creator=${profile.slug}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" />
      </div>
    )
  }

  if (!profile) return null

  const brandColor = profile.brand_color || '#FF69B4'

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Banner */}
      {profile.banner_image_url ? (
        <div className="relative h-48 sm:h-72 w-full">
          <img
            src={profile.banner_image_url}
            alt={profile.display_name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/30" />
        </div>
      ) : (
        <div
          className="h-48 sm:h-72 w-full"
          style={{
            background: `linear-gradient(135deg, ${brandColor}20 0%, ${brandColor}10 100%)`
          }}
        />
      )}

      {/* Profile Card */}
      <div className="container mx-auto px-4 -mt-16 sm:-mt-24 relative z-10">
        <div className="bg-white rounded-2xl shadow-2xl p-5 sm:p-8 max-w-4xl mx-auto">
          <div className="flex flex-col items-center text-center mb-4 sm:mb-6">
            {/* Avatar */}
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 -mt-16 sm:-mt-20 mb-3 sm:mb-4">
              {profile.profile_image_url ? (
                <img
                  src={profile.profile_image_url}
                  alt={profile.display_name}
                  className="w-full h-full rounded-full object-cover border-4 sm:border-8 border-white shadow-xl"
                />
              ) : (
                <div
                  className="w-full h-full rounded-full flex items-center justify-center text-3xl sm:text-5xl font-bold text-white shadow-xl border-4 sm:border-8 border-white"
                  style={{ backgroundColor: brandColor }}
                >
                  {profile.display_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <p className="text-xs sm:text-sm text-gray-500 font-medium mb-1">Curated by</p>
            <h1 className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2" style={{ color: brandColor }}>
              {profile.display_name}
            </h1>

            {profile.tagline && (
              <p className="text-base sm:text-xl text-gray-600 mb-3 sm:mb-4">{profile.tagline}</p>
            )}

            {profile.bio && (
              <p className="text-sm sm:text-base text-gray-700 max-w-2xl mb-4 sm:mb-6 leading-relaxed">{profile.bio}</p>
            )}

            {/* Social Links */}
            {(profile.instagram_handle || profile.tiktok_handle || profile.youtube_handle) && (
              <div className="flex gap-3 sm:gap-4 mb-4 sm:mb-6">
                {profile.instagram_handle && (
                  <a
                    href={`https://instagram.com/${profile.instagram_handle.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 sm:p-3 rounded-full hover:bg-gray-100 transition"
                    title="Instagram"
                  >
                    <Instagram className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: brandColor }} />
                  </a>
                )}
                {profile.tiktok_handle && (
                  <a
                    href={`https://tiktok.com/@${profile.tiktok_handle.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 sm:p-3 rounded-full hover:bg-gray-100 transition"
                    title="TikTok"
                  >
                    <Music2 className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: brandColor }} />
                  </a>
                )}
                {profile.youtube_handle && (
                  <a
                    href={`https://youtube.com/@${profile.youtube_handle.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 sm:p-3 rounded-full hover:bg-gray-100 transition"
                    title="YouTube"
                  >
                    <Youtube className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: brandColor }} />
                  </a>
                )}
              </div>
            )}

            {/* Promo Code */}
            {profile.creator?.discount_code && (
              <div
                className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-base font-semibold text-white shadow-lg"
                style={{ backgroundColor: brandColor }}
              >
                <span>Code : {profile.creator.discount_code}</span>
              </div>
            )}
          </div>

          {/* Custom Message */}
          {profile.custom_message && (
            <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
              <p className="text-center text-sm sm:text-base text-gray-700 italic">&ldquo;{profile.custom_message}&rdquo;</p>
            </div>
          )}
        </div>
      </div>

      {/* Embedded Routine Product Page (when routine assigned) */}
      {assignedRoutine && (
        <RoutineHydratationClient routine={assignedRoutine} />
      )}

      {/* Products Section (only when NO routine assigned) */}
      {!assignedRoutine && products.length > 0 && (
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-4" style={{ color: brandColor }}>
            Ma Selection Beaute
          </h2>
          <p className="text-center text-gray-600 mb-12">
            Mes produits preferes pour une peau rayonnante
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {products.map((product) => (
              <div
                key={product.id}
                className="group bg-white border-2 border-gray-100 rounded-2xl overflow-hidden hover:shadow-2xl hover:border-gray-200 transition-all duration-300 cursor-pointer"
                onClick={() => handleProductClick(product)}
              >
                <div className="relative h-80">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <ShoppingCart className="w-16 h-16 text-gray-300" />
                    </div>
                  )}

                  {product.compare_at_price && product.compare_at_price > product.price && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      -{Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}%
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="font-bold text-lg mb-2 group-hover:opacity-80 transition">
                    {product.name}
                  </h3>

                  {product.short_description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {product.short_description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold" style={{ color: brandColor }}>
                        {Number(product.price).toFixed(2)}€
                      </span>
                      {product.compare_at_price && (
                        <span className="text-sm text-gray-400 line-through ml-2">
                          {Number(product.compare_at_price).toFixed(2)}€
                        </span>
                      )}
                    </div>

                    <Button
                      variant="primary"
                      className="group-hover:scale-105 transition"
                      style={{ backgroundColor: brandColor, borderColor: brandColor }}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Ajouter
                    </Button>
                  </div>

                  {product.stock_quantity <= 10 && (
                    <p className="text-xs text-orange-600 mt-2 font-medium">
                      Plus que {product.stock_quantity} en stock !
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State (only when NO routine assigned and no products) */}
      {!assignedRoutine && products.length === 0 && (
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-2xl mx-auto">
            <div
              className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${brandColor}20` }}
            >
              <ShoppingCart className="w-12 h-12" style={{ color: brandColor }} />
            </div>
            <h3 className="text-2xl font-bold mb-4">Selection en preparation</h3>
            <p className="text-gray-600 mb-8">
              {profile.display_name} prepare sa selection. Revenez bientot !
            </p>
            <Button
              variant="primary"
              style={{ backgroundColor: brandColor, borderColor: brandColor }}
              onClick={() => navigate('/')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Decouvrir Yeoskin
            </Button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className={`bg-white py-8 border-t border-gray-100 ${assignedRoutine ? 'pb-28 lg:pb-8' : ''}`}>
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">
            Propulse par <span className="font-semibold" style={{ color: brandColor }}>Yeoskin</span>
          </p>
        </div>
      </footer>
    </div>
  )
}
