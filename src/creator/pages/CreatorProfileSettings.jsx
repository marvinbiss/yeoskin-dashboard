'use client'

/**
 * CreatorProfileSettings - Self-service profile editor for creators
 * Allows creators to customize their public profile page
 */
import { useState, useRef, useEffect } from 'react'
import {
  User,
  Image,
  Link2,
  Eye,
  EyeOff,
  Save,
  Upload,
  Instagram,
  Youtube,
  Music2,
  Palette,
  Globe,
  MessageSquare,
  ExternalLink,
  RefreshCw,
  Check,
  AlertCircle,
  Copy
} from 'lucide-react'
import { useCreatorProfile, useProfileAnalytics } from '../hooks/useCreatorProfile'
import { Button, Card, Spinner } from '../../components/Common'
import { CreatorLayout } from '../components'
import clsx from 'clsx'

// Color presets
const COLOR_PRESETS = [
  '#FF69B4', // Pink
  '#E91E63', // Deep Pink
  '#9C27B0', // Purple
  '#673AB7', // Deep Purple
  '#3F51B5', // Indigo
  '#2196F3', // Blue
  '#00BCD4', // Cyan
  '#009688', // Teal
  '#4CAF50', // Green
  '#FF9800', // Orange
  '#FF5722', // Deep Orange
  '#795548', // Brown
]

const CreatorProfileSettings = () => {
  const {
    profile,
    loading,
    saving,
    error,
    updateProfile,
    updateSlug,
    togglePublish,
    uploadImage,
    refresh
  } = useCreatorProfile()

  const { analytics, loading: analyticsLoading } = useProfileAnalytics(30)

  // Form state
  const [formData, setFormData] = useState({
    display_name: '',
    tagline: '',
    bio: '',
    instagram_handle: '',
    tiktok_handle: '',
    youtube_handle: '',
    brand_color: '#FF69B4',
    custom_message: '',
    meta_title: '',
    meta_description: ''
  })
  const [slugValue, setSlugValue] = useState('')
  const [slugError, setSlugError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [copied, setCopied] = useState(false)

  // Refs for file inputs
  const profileImageRef = useRef(null)
  const bannerImageRef = useRef(null)

  // Sync form data with profile
  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        tagline: profile.tagline || '',
        bio: profile.bio || '',
        instagram_handle: profile.instagram_handle || '',
        tiktok_handle: profile.tiktok_handle || '',
        youtube_handle: profile.youtube_handle || '',
        brand_color: profile.brand_color || '#FF69B4',
        custom_message: profile.custom_message || '',
        meta_title: profile.meta_title || '',
        meta_description: profile.meta_description || ''
      })
      setSlugValue(profile.slug || '')
    }
  }, [profile])

  // Handle form field changes
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Save profile
  const handleSave = async () => {
    const result = await updateProfile(formData)
    if (result.success) {
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }
  }

  // Save slug
  const handleSlugSave = async () => {
    setSlugError('')
    const result = await updateSlug(slugValue)
    if (!result.success) {
      setSlugError(result.error)
    }
  }

  // Handle publish toggle
  const handlePublishToggle = async () => {
    await togglePublish()
  }

  // Handle image upload
  const handleImageUpload = async (e, type) => {
    const file = e.target.files?.[0]
    if (file) {
      await uploadImage(file, type)
    }
  }

  // Copy profile URL
  const copyProfileUrl = () => {
    const url = `${window.location.origin}/c/${profile?.slug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <CreatorLayout title="Ma Page" subtitle="Personnalisez votre page publique">
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </CreatorLayout>
    )
  }

  const profileUrl = `https://yeoskin.fr/c/${profile?.slug}`

  return (
    <CreatorLayout title="Ma Page" subtitle="Personnalisez votre page publique">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div></div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
          </Button>
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Apercu
          </a>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Publish Status Card */}
      <Card>
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className={clsx(
              'w-12 h-12 rounded-full flex items-center justify-center',
              profile?.is_public
                ? 'bg-green-100 dark:bg-green-900/30'
                : 'bg-gray-100 dark:bg-gray-800'
            )}>
              {profile?.is_public ? (
                <Eye className="w-6 h-6 text-green-600" />
              ) : (
                <EyeOff className="w-6 h-6 text-gray-500" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {profile?.is_public ? 'Page Publiee' : 'Page Non Publiee'}
              </h3>
              <p className="text-sm text-gray-500">
                {profile?.is_public
                  ? 'Votre page est visible par tous'
                  : 'Seul vous pouvez voir votre page'}
              </p>
            </div>
          </div>
          <Button
            variant={profile?.is_public ? 'secondary' : 'success'}
            onClick={handlePublishToggle}
            loading={saving}
          >
            {profile?.is_public ? 'Depublier' : 'Publier'}
          </Button>
        </div>
      </Card>

      {/* Profile URL Card */}
      <Card>
        <Card.Header>
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold">URL de votre page</h3>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <span className="px-3 py-2 text-gray-500 text-sm bg-gray-100 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600">
                  yeoskin.fr/c/
                </span>
                <input
                  type="text"
                  value={slugValue}
                  onChange={(e) => setSlugValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="flex-1 px-3 py-2 bg-transparent focus:outline-none text-gray-900 dark:text-white"
                  placeholder="votre-nom"
                />
              </div>
              <Button
                variant="secondary"
                onClick={handleSlugSave}
                disabled={slugValue === profile?.slug || saving}
              >
                <Save className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={copyProfileUrl}
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            {slugError && (
              <p className="text-sm text-red-500">{slugError}</p>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Basic Info */}
      <Card>
        <Card.Header>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold">Informations de base</h3>
          </div>
        </Card.Header>
        <Card.Body className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom d'affichage
            </label>
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) => handleChange('display_name', e.target.value)}
              className="input w-full"
              placeholder="Votre nom"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tagline <span className="text-gray-400">({formData.tagline.length}/100)</span>
            </label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => handleChange('tagline', e.target.value.slice(0, 100))}
              className="input w-full"
              placeholder="Votre specialite en une ligne"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Bio <span className="text-gray-400">({formData.bio.length}/500)</span>
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleChange('bio', e.target.value.slice(0, 500))}
              className="input w-full h-32 resize-none"
              placeholder="Parlez de vous et de votre passion pour la K-Beauty..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Message personnalise
            </label>
            <input
              type="text"
              value={formData.custom_message}
              onChange={(e) => handleChange('custom_message', e.target.value)}
              className="input w-full"
              placeholder="Un message special pour vos visiteurs"
            />
          </div>
        </Card.Body>
      </Card>

      {/* Images */}
      <Card>
        <Card.Header>
          <div className="flex items-center gap-2">
            <Image className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold">Images</h3>
          </div>
        </Card.Header>
        <Card.Body className="space-y-6">
          {/* Profile Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Photo de profil
            </label>
            <div className="flex items-center gap-4">
              <div className="relative">
                {profile?.profile_image_url ? (
                  <img
                    src={profile.profile_image_url}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg"
                    style={{ backgroundColor: formData.brand_color }}
                  >
                    {formData.display_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <div>
                <input
                  ref={profileImageRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, 'profile')}
                />
                <Button
                  variant="secondary"
                  onClick={() => profileImageRef.current?.click()}
                  loading={saving}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Changer la photo
                </Button>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG. Max 5MB.</p>
              </div>
            </div>
          </div>

          {/* Banner Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Image de couverture
            </label>
            <div
              className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:border-primary-500 transition"
              onClick={() => bannerImageRef.current?.click()}
            >
              {profile?.banner_image_url ? (
                <img
                  src={profile.banner_image_url}
                  alt="Banner"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${formData.brand_color}20 0%, ${formData.brand_color}10 100%)` }}
                >
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Cliquez pour ajouter une image</p>
                  </div>
                </div>
              )}
              <input
                ref={bannerImageRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, 'banner')}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Recommande: 1200x400px. Max 5MB.</p>
          </div>
        </Card.Body>
      </Card>

      {/* Brand Color */}
      <Card>
        <Card.Header>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold">Couleur de marque</h3>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="flex flex-wrap gap-3">
            {COLOR_PRESETS.map(color => (
              <button
                key={color}
                className={clsx(
                  'w-10 h-10 rounded-full transition-transform hover:scale-110',
                  formData.brand_color === color && 'ring-2 ring-offset-2 ring-gray-400'
                )}
                style={{ backgroundColor: color }}
                onClick={() => handleChange('brand_color', color)}
              />
            ))}
            <div className="relative">
              <input
                type="color"
                value={formData.brand_color}
                onChange={(e) => handleChange('brand_color', e.target.value)}
                className="w-10 h-10 rounded-full cursor-pointer opacity-0 absolute inset-0"
              />
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300"
                style={{ backgroundColor: formData.brand_color }}
              >
                <span className="text-xs text-white font-bold">+</span>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Social Links */}
      <Card>
        <Card.Header>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold">Reseaux sociaux</h3>
          </div>
        </Card.Header>
        <Card.Body className="space-y-4">
          <div className="flex items-center gap-3">
            <Instagram className="w-5 h-5 text-pink-500" />
            <input
              type="text"
              value={formData.instagram_handle}
              onChange={(e) => handleChange('instagram_handle', e.target.value)}
              className="input flex-1"
              placeholder="@votre_instagram"
            />
          </div>
          <div className="flex items-center gap-3">
            <Music2 className="w-5 h-5 text-gray-800 dark:text-white" />
            <input
              type="text"
              value={formData.tiktok_handle}
              onChange={(e) => handleChange('tiktok_handle', e.target.value)}
              className="input flex-1"
              placeholder="@votre_tiktok"
            />
          </div>
          <div className="flex items-center gap-3">
            <Youtube className="w-5 h-5 text-red-500" />
            <input
              type="text"
              value={formData.youtube_handle}
              onChange={(e) => handleChange('youtube_handle', e.target.value)}
              className="input flex-1"
              placeholder="@votre_youtube"
            />
          </div>
        </Card.Body>
      </Card>

      {/* SEO */}
      <Card>
        <Card.Header>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold">SEO (optionnel)</h3>
          </div>
        </Card.Header>
        <Card.Body className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre Meta <span className="text-gray-400">(max 60 caracteres)</span>
            </label>
            <input
              type="text"
              value={formData.meta_title}
              onChange={(e) => handleChange('meta_title', e.target.value.slice(0, 60))}
              className="input w-full"
              placeholder={`${formData.display_name} | Yeoskin`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description Meta <span className="text-gray-400">(max 160 caracteres)</span>
            </label>
            <textarea
              value={formData.meta_description}
              onChange={(e) => handleChange('meta_description', e.target.value.slice(0, 160))}
              className="input w-full h-20 resize-none"
              placeholder="Decouvrez ma selection de produits K-Beauty..."
            />
          </div>
        </Card.Body>
      </Card>

      {/* Analytics Preview */}
      {!analyticsLoading && analytics && (
        <Card>
          <Card.Header>
            <h3 className="font-semibold">Statistiques (30 derniers jours)</h3>
          </Card.Header>
          <Card.Body>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.totalViews}
                </div>
                <div className="text-sm text-gray-500">Vues</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.uniqueVisitors}
                </div>
                <div className="text-sm text-gray-500">Visiteurs uniques</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.totalClicks}
                </div>
                <div className="text-sm text-gray-500">Clics</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.conversionRate}%
                </div>
                <div className="text-sm text-gray-500">Conversion</div>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex items-center justify-between py-4">
        <div>
          {saveSuccess && (
            <div className="flex items-center gap-2 text-green-600">
              <Check className="w-5 h-5" />
              <span>Modifications enregistrees !</span>
            </div>
          )}
        </div>
        <Button
          variant="primary"
          onClick={handleSave}
          loading={saving}
        >
          <Save className="w-4 h-4 mr-2" />
          Enregistrer les modifications
        </Button>
      </div>
      </div>
    </CreatorLayout>
  )
}

export default CreatorProfileSettings
