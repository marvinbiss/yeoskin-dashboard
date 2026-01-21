'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  AtSign,
  Instagram,
  Youtube,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Sparkles,
  AlertCircle
} from 'lucide-react'

const STEPS = [
  { id: 1, title: 'Informations personnelles', icon: User },
  { id: 2, title: 'Réseaux sociaux', icon: AtSign },
  { id: 3, title: 'Motivation', icon: MessageSquare },
]

const CONTENT_TYPES = [
  { id: 'skincare', label: 'Skincare', emoji: '🧴' },
  { id: 'makeup', label: 'Maquillage', emoji: '💄' },
  { id: 'lifestyle', label: 'Lifestyle', emoji: '✨' },
  { id: 'reviews', label: 'Reviews', emoji: '📝' },
  { id: 'tutorials', label: 'Tutoriels', emoji: '🎬' },
  { id: 'unboxing', label: 'Unboxing', emoji: '📦' },
]

const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'Débutant(e)', description: 'Je commence à créer du contenu' },
  { id: 'intermediate', label: 'Intermédiaire', description: 'Je crée régulièrement depuis 1-2 ans' },
  { id: 'expert', label: 'Expert(e)', description: 'Je suis créateur(trice) à plein temps' },
]

export default function ApplicationForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: 'FR',
    city: '',

    // Step 2: Social Media
    instagramHandle: '',
    instagramFollowers: '',
    tiktokHandle: '',
    tiktokFollowers: '',
    youtubeHandle: '',
    youtubeSubscribers: '',

    // Step 3: Motivation
    contentType: [],
    experienceLevel: 'beginner',
    motivation: '',
    websiteUrl: '',
    source: '',
  })

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const toggleContentType = (type) => {
    setFormData(prev => ({
      ...prev,
      contentType: prev.contentType.includes(type)
        ? prev.contentType.filter(t => t !== type)
        : [...prev.contentType, type]
    }))
  }

  const validateStep = (stepNum) => {
    switch (stepNum) {
      case 1:
        if (!formData.firstName.trim()) return 'Prénom requis'
        if (!formData.lastName.trim()) return 'Nom requis'
        if (!formData.email.trim()) return 'Email requis'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Email invalide'
        return null
      case 2:
        const hasAtLeastOne = formData.instagramHandle || formData.tiktokHandle || formData.youtubeHandle
        if (!hasAtLeastOne) return 'Au moins un réseau social requis'
        return null
      case 3:
        if (formData.contentType.length === 0) return 'Sélectionne au moins un type de contenu'
        if (!formData.motivation.trim()) return 'Dis-nous pourquoi tu veux rejoindre Yeoskin'
        if (formData.motivation.trim().length < 50) return 'Ta motivation doit faire au moins 50 caractères'
        return null
      default:
        return null
    }
  }

  const nextStep = () => {
    const validationError = validateStep(step)
    if (validationError) {
      setError(validationError)
      return
    }
    setStep(prev => Math.min(prev + 1, 3))
    setError(null)
  }

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1))
    setError(null)
  }

  const handleSubmit = async () => {
    const validationError = validateStep(3)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          phone: formData.phone.trim() || null,
          country: formData.country,
          city: formData.city.trim() || null,
          instagram_handle: formData.instagramHandle.trim().replace('@', '') || null,
          instagram_followers: parseInt(formData.instagramFollowers) || 0,
          tiktok_handle: formData.tiktokHandle.trim().replace('@', '') || null,
          tiktok_followers: parseInt(formData.tiktokFollowers) || 0,
          youtube_handle: formData.youtubeHandle.trim().replace('@', '') || null,
          youtube_subscribers: parseInt(formData.youtubeSubscribers) || 0,
          content_type: formData.contentType,
          experience_level: formData.experienceLevel,
          motivation: formData.motivation.trim(),
          website_url: formData.websiteUrl.trim() || null,
          source: formData.source.trim() || 'organic',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue')
      }

      // Redirect to success page with application info
      router.push(`/success?id=${data.id}&auto=${data.auto_approved}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalFollowers = (
    (parseInt(formData.instagramFollowers) || 0) +
    (parseInt(formData.tiktokFollowers) || 0) +
    (parseInt(formData.youtubeSubscribers) || 0)
  )

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((s, index) => (
              <div key={s.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                  step >= s.id
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > s.id ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <s.icon className="w-5 h-5" />
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-full h-1 mx-2 sm:mx-4 rounded transition-all ${
                    step > s.id ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-gray-200'
                  }`} style={{ width: '80px' }} />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500">
            Étape {step} sur 3 : {STEPS[step - 1].title}
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Qui es-tu ?</h2>
                <p className="text-gray-600">Parle-nous un peu de toi</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prénom *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    placeholder="Emma"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    placeholder="Dupont"
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="emma@exemple.com"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone (optionnel)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pays</label>
                  <select
                    value={formData.country}
                    onChange={(e) => updateField('country', e.target.value)}
                    className="input"
                  >
                    <option value="FR">France</option>
                    <option value="BE">Belgique</option>
                    <option value="CH">Suisse</option>
                    <option value="CA">Canada</option>
                    <option value="LU">Luxembourg</option>
                    <option value="OTHER">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder="Paris"
                    className="input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Social Media */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Tes réseaux sociaux</h2>
                <p className="text-gray-600">Renseigne au moins un réseau social</p>
              </div>

              {/* Instagram */}
              <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-100">
                <div className="flex items-center gap-2 mb-4">
                  <Instagram className="w-5 h-5 text-pink-500" />
                  <span className="font-semibold text-gray-900">Instagram</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Pseudo</label>
                    <input
                      type="text"
                      value={formData.instagramHandle}
                      onChange={(e) => updateField('instagramHandle', e.target.value)}
                      placeholder="@tonpseudo"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Followers</label>
                    <input
                      type="number"
                      value={formData.instagramFollowers}
                      onChange={(e) => updateField('instagramFollowers', e.target.value)}
                      placeholder="10000"
                      className="input"
                    />
                  </div>
                </div>
              </div>

              {/* TikTok */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                  </svg>
                  <span className="font-semibold text-gray-900">TikTok</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Pseudo</label>
                    <input
                      type="text"
                      value={formData.tiktokHandle}
                      onChange={(e) => updateField('tiktokHandle', e.target.value)}
                      placeholder="@tonpseudo"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Followers</label>
                    <input
                      type="number"
                      value={formData.tiktokFollowers}
                      onChange={(e) => updateField('tiktokFollowers', e.target.value)}
                      placeholder="50000"
                      className="input"
                    />
                  </div>
                </div>
              </div>

              {/* YouTube */}
              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <div className="flex items-center gap-2 mb-4">
                  <Youtube className="w-5 h-5 text-red-500" />
                  <span className="font-semibold text-gray-900">YouTube</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Chaîne</label>
                    <input
                      type="text"
                      value={formData.youtubeHandle}
                      onChange={(e) => updateField('youtubeHandle', e.target.value)}
                      placeholder="@tachaîne"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Abonnés</label>
                    <input
                      type="number"
                      value={formData.youtubeSubscribers}
                      onChange={(e) => updateField('youtubeSubscribers', e.target.value)}
                      placeholder="5000"
                      className="input"
                    />
                  </div>
                </div>
              </div>

              {/* Followers summary */}
              {totalFollowers > 0 && (
                <div className={`p-4 rounded-xl border ${
                  totalFollowers >= 5000
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Total followers</span>
                    <span className="font-bold text-lg">{totalFollowers.toLocaleString()}</span>
                  </div>
                  {totalFollowers >= 5000 && (
                    <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      Éligible à l'approbation automatique !
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Motivation */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Ta motivation</h2>
                <p className="text-gray-600">Dis-nous en plus sur ton projet</p>
              </div>

              {/* Content types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Quel type de contenu crées-tu ? *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {CONTENT_TYPES.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => toggleContentType(type.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        formData.contentType.includes(type.id)
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl">{type.emoji}</span>
                      <span className="block text-sm font-medium mt-1">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Ton niveau d'expérience
                </label>
                <div className="space-y-2">
                  {EXPERIENCE_LEVELS.map((level) => (
                    <label
                      key={level.id}
                      className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.experienceLevel === level.id
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="experience"
                        value={level.id}
                        checked={formData.experienceLevel === level.id}
                        onChange={(e) => updateField('experienceLevel', e.target.value)}
                        className="sr-only"
                      />
                      <div>
                        <span className="font-medium text-gray-900">{level.label}</span>
                        <span className="block text-sm text-gray-500">{level.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Motivation text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pourquoi veux-tu rejoindre Yeoskin ? * (min. 50 caractères)
                </label>
                <textarea
                  value={formData.motivation}
                  onChange={(e) => updateField('motivation', e.target.value)}
                  rows={4}
                  placeholder="Parle-nous de ta passion pour la K-Beauty, de ton audience, de tes projets..."
                  className="input resize-none"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.motivation.length}/50 caractères minimum
                </p>
              </div>

              {/* Website URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site web ou portfolio (optionnel)
                </label>
                <input
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) => updateField('websiteUrl', e.target.value)}
                  placeholder="https://tonsite.com"
                  className="input"
                />
              </div>

              {/* Source */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comment as-tu découvert Yeoskin ?
                </label>
                <select
                  value={formData.source}
                  onChange={(e) => updateField('source', e.target.value)}
                  className="input"
                >
                  <option value="">Sélectionne une option</option>
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="youtube">YouTube</option>
                  <option value="google">Google</option>
                  <option value="friend">Recommandation</option>
                  <option value="other">Autre</option>
                </select>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Continuer
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    Envoyer ma candidature
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Privacy note */}
        <p className="text-center text-sm text-gray-500 mt-6">
          En soumettant ce formulaire, tu acceptes notre{' '}
          <a href="#" className="text-pink-600 hover:underline">politique de confidentialité</a>.
        </p>
      </div>
    </div>
  )
}
