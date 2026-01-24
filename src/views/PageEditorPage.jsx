'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Save,
  Eye,
  Upload,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Type,
  Star,
  Settings,
  RefreshCw,
  Check,
  Sparkles,
  Globe,
  Lock,
  Link as LinkIcon
} from 'lucide-react'
import Link from 'next/link'

// Section configurations for different page types
// NOTE: pricing + products are managed via /routines (single source of truth)
const SECTION_CONFIGS = {
  'apply': {
    hero: {
      label: 'Hero / En-tête',
      icon: Star,
      fields: [
        { key: 'badge', label: 'Badge (ex: Programme Créateur 2025)', type: 'text' },
        { key: 'title_line1', label: 'Titre ligne 1', type: 'text' },
        { key: 'title_highlight', label: 'Mot en couleur gradient', type: 'text' },
        { key: 'title_line2', label: 'Titre ligne 2', type: 'text' },
        { key: 'subtitle', label: 'Sous-titre', type: 'textarea' },
        { key: 'cta_text', label: 'Texte bouton CTA', type: 'text' },
        { key: 'social_proof_text', label: 'Texte preuve sociale (ex: +200 créateurs)', type: 'text' },
        { key: 'social_proof_rating', label: 'Note affichée (ex: 4.9/5)', type: 'text' },
      ]
    },
    benefits: {
      label: 'Avantages',
      icon: Check,
      fields: [
        { key: 'section_title', label: 'Titre de section', type: 'text' },
        { key: 'section_subtitle', label: 'Sous-titre', type: 'text' },
      ],
      arrayField: {
        key: 'items',
        itemFields: [
          { key: 'icon', label: 'Icône (TrendingUp, Gift, Zap, Users, ShieldCheck, Heart)', type: 'text' },
          { key: 'title', label: 'Titre', type: 'text' },
          { key: 'description', label: 'Description', type: 'text' },
          { key: 'color', label: 'Couleur (green, purple, yellow, blue, pink, red)', type: 'text' },
        ]
      }
    },
    tiers: {
      label: 'Niveaux de Commission',
      icon: Star,
      fields: [
        { key: 'section_title', label: 'Titre', type: 'text' },
        { key: 'section_subtitle', label: 'Sous-titre', type: 'text' },
      ],
      arrayField: {
        key: 'items',
        itemFields: [
          { key: 'name', label: 'Nom (Bronze, Silver, Gold)', type: 'text' },
          { key: 'rate', label: 'Taux (ex: 15%)', type: 'text' },
          { key: 'requirement', label: 'Condition', type: 'text' },
          { key: 'features', label: 'Avantages (1 par ligne)', type: 'textarea' },
          { key: 'popular', label: 'Badge populaire', type: 'checkbox' },
        ]
      }
    },
    testimonials: {
      label: 'Témoignages',
      icon: Star,
      fields: [
        { key: 'section_title', label: 'Titre de section', type: 'text' },
      ],
      arrayField: {
        key: 'items',
        itemFields: [
          { key: 'name', label: 'Nom', type: 'text' },
          { key: 'handle', label: 'Pseudo (@...)', type: 'text' },
          { key: 'avatar', label: 'Emoji avatar', type: 'text' },
          { key: 'quote', label: 'Citation', type: 'textarea' },
          { key: 'followers', label: 'Followers (ex: 45K)', type: 'text' },
        ]
      }
    },
    faq: {
      label: 'FAQ',
      icon: Type,
      fields: [
        { key: 'section_title', label: 'Titre de section', type: 'text' },
      ],
      arrayField: {
        key: 'items',
        itemFields: [
          { key: 'question', label: 'Question', type: 'text' },
          { key: 'answer', label: 'Réponse', type: 'textarea' },
        ]
      }
    },
    cta: {
      label: 'Call-to-Action Final',
      icon: Star,
      fields: [
        { key: 'title', label: 'Titre', type: 'text' },
        { key: 'subtitle', label: 'Sous-titre', type: 'text' },
        { key: 'button_text', label: 'Texte du bouton', type: 'text' },
      ]
    }
  },
  'routine-hydratation': {
    hero: {
      label: 'Hero / En-tête',
      icon: Star,
      fields: [
        { key: 'badge', label: 'Badge', type: 'text' },
        { key: 'title', label: 'Titre principal', type: 'text' },
        { key: 'subtitle', label: 'Sous-titre', type: 'text' },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'stats.rating', label: 'Note (ex: 4.9)', type: 'number', step: 0.1 },
        { key: 'stats.reviews', label: 'Nombre d\'avis', type: 'number' },
        { key: 'stats.repurchase_rate', label: 'Taux de rachat (%)', type: 'number' },
        { key: 'urgency.enabled', label: 'Afficher urgence', type: 'checkbox' },
        { key: 'urgency.stock_left', label: 'Stock restant', type: 'number' },
      ]
    },
    reviews: {
      label: 'Avis Clients',
      icon: Star,
      fields: [
        { key: 'section_title', label: 'Titre de section', type: 'text' },
      ],
      arrayField: {
        key: 'items',
        itemFields: [
          { key: 'name', label: 'Nom', type: 'text' },
          { key: 'age', label: 'Age', type: 'number' },
          { key: 'skin_type', label: 'Type de peau', type: 'text' },
          { key: 'rating', label: 'Note (1-5)', type: 'number' },
          { key: 'title', label: 'Titre avis', type: 'text' },
          { key: 'text', label: 'Texte avis', type: 'textarea' },
          { key: 'verified', label: 'Achat vérifié', type: 'checkbox' },
          { key: 'image_key', label: 'Photo', type: 'image' },
        ]
      }
    },
    faq: {
      label: 'FAQ',
      icon: Type,
      fields: [
        { key: 'section_title', label: 'Titre de section', type: 'text' },
      ],
      arrayField: {
        key: 'items',
        itemFields: [
          { key: 'question', label: 'Question', type: 'text' },
          { key: 'answer', label: 'Réponse', type: 'textarea' },
        ]
      }
    },
    guarantees: {
      label: 'Garanties',
      icon: Check,
      arrayField: {
        key: 'items',
        itemFields: [
          { key: 'icon', label: 'Icône (truck, refresh, shield, clock)', type: 'text' },
          { key: 'title', label: 'Titre', type: 'text' },
          { key: 'description', label: 'Description', type: 'text' },
        ]
      }
    },
    cta: {
      label: 'Call-to-Action Final',
      icon: Star,
      fields: [
        { key: 'title', label: 'Titre', type: 'text' },
        { key: 'subtitle', label: 'Sous-titre', type: 'text' },
        { key: 'button_text', label: 'Texte du bouton', type: 'text' },
        { key: 'urgency_text', label: 'Texte urgence', type: 'text' },
      ]
    }
  }
}

// Helper to get/set nested values
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((acc, part) => acc?.[part], obj)
}

const setNestedValue = (obj, path, value) => {
  const newObj = JSON.parse(JSON.stringify(obj || {}))
  const parts = path.split('.')
  let current = newObj
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) current[parts[i]] = {}
    current = current[parts[i]]
  }
  current[parts[parts.length - 1]] = value
  return newObj
}

// Image Upload Component
function ImageUploader({ pageSlug, imageKey, currentUrl, onUpload }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentUrl)

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('page_slug', pageSlug)
    formData.append('image_key', imageKey)

    try {
      const res = await fetch('/api/cms/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        setPreview(data.url)
        onUpload(data.url, imageKey)
      } else {
        alert(data.error || 'Erreur upload')
      }
    } catch (err) {
      alert('Erreur upload')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      {preview && (
        <img src={preview} alt="" className="w-32 h-32 object-cover rounded-lg border" />
      )}
      <label className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer text-sm transition-colors">
        {uploading ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
        <span>{uploading ? 'Upload...' : 'Changer l\'image'}</span>
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
          disabled={uploading}
        />
      </label>
    </div>
  )
}

// Field Renderer
function FieldRenderer({ field, value, onChange, pageSlug, images }) {
  if (field.type === 'text') {
    return (
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
      />
    )
  }

  if (field.type === 'textarea') {
    return (
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
      />
    )
  }

  if (field.type === 'number') {
    return (
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        step={field.step || 1}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
      />
    )
  }

  if (field.type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={value || false}
          onChange={(e) => onChange(e.target.checked)}
          className="w-5 h-5 text-pink-500 rounded focus:ring-pink-500"
        />
        <span className="text-sm text-gray-600">Activé</span>
      </label>
    )
  }

  if (field.type === 'image') {
    return (
      <ImageUploader
        pageSlug={pageSlug}
        imageKey={value || field.key}
        currentUrl={images?.[value]}
        onUpload={(url, key) => onChange(key)}
      />
    )
  }

  return null
}

// Section Editor
function SectionEditor({ section, config, pageSlug, images, onSave }) {
  const [content, setContent] = useState(section?.content || {})
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const Icon = config.icon || Settings

  const handleFieldChange = (path, value) => {
    setContent(prev => setNestedValue(prev, path, value))
    setDirty(true)
  }

  const handleArrayItemChange = (arrayKey, index, itemKey, value) => {
    setContent(prev => {
      const newContent = JSON.parse(JSON.stringify(prev))
      if (!newContent[arrayKey]) newContent[arrayKey] = []
      if (!newContent[arrayKey][index]) newContent[arrayKey][index] = {}

      // Handle ingredients specially (convert from comma-separated string)
      if (itemKey === 'ingredients' && typeof value === 'string') {
        newContent[arrayKey][index][itemKey] = value.split(',').map(s => s.trim())
      } else {
        newContent[arrayKey][index][itemKey] = value
      }
      return newContent
    })
    setDirty(true)
  }

  const addArrayItem = (arrayKey) => {
    setContent(prev => {
      const newContent = JSON.parse(JSON.stringify(prev))
      if (!newContent[arrayKey]) newContent[arrayKey] = []
      newContent[arrayKey].push({ id: Date.now() })
      return newContent
    })
    setDirty(true)
  }

  const removeArrayItem = (arrayKey, index) => {
    setContent(prev => {
      const newContent = JSON.parse(JSON.stringify(prev))
      newContent[arrayKey].splice(index, 1)
      return newContent
    })
    setDirty(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(section.section_key, content)
      setDirty(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-pink-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">{config.label}</h3>
            <p className="text-sm text-gray-500">{section.section_key}</p>
          </div>
          {dirty && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
              Non sauvegardé
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Content */}
      {expanded && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          {/* Regular fields */}
          {config.fields?.map(field => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
              </label>
              <FieldRenderer
                field={field}
                value={getNestedValue(content, field.key)}
                onChange={(val) => handleFieldChange(field.key, val)}
                pageSlug={pageSlug}
                images={images}
              />
            </div>
          ))}

          {/* Array fields */}
          {config.arrayField && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">
                  Éléments ({content[config.arrayField.key]?.length || 0})
                </h4>
                <button
                  onClick={() => addArrayItem(config.arrayField.key)}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>

              {content[config.arrayField.key]?.map((item, index) => (
                <div key={item.id || index} className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Élément {index + 1}
                    </span>
                    <button
                      onClick={() => removeArrayItem(config.arrayField.key, index)}
                      className="p-1 text-red-500 hover:bg-red-100 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {config.arrayField.itemFields.map(field => (
                      <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {field.label}
                        </label>
                        <FieldRenderer
                          field={field}
                          value={
                            field.key === 'ingredients' && Array.isArray(item[field.key])
                              ? item[field.key].join(', ')
                              : item[field.key]
                          }
                          onChange={(val) => handleArrayItemChange(config.arrayField.key, index, field.key, val)}
                          pageSlug={pageSlug}
                          images={images}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Save button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                dirty
                  ? 'bg-pink-500 text-white hover:bg-pink-600'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Publication...' : 'Sauvegarder & Publier'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Main Page Editor
export default function PageEditorPage({ pageSlug = 'routine-hydratation' }) {
  const [sections, setSections] = useState([])
  const [images, setImages] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [linkedRoutine, setLinkedRoutine] = useState(null)
  const [publishing, setPublishing] = useState(false)
  const [isPublished, setIsPublished] = useState(false)

  const config = SECTION_CONFIGS[pageSlug] || {}

  // Fetch content + linked routine
  const fetchContent = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/cms/content?page_slug=${pageSlug}&include_unpublished=true`)
      const data = await res.json()
      setSections(data.content || [])
      setImages(data.images || {})

      // Check if all sections are published
      const allPublished = (data.content || []).every(s => s.is_published)
      setIsPublished(allPublished && (data.content || []).length > 0)

      // Fetch linked routine via API
      try {
        const routineRes = await fetch(`/api/routines?slug=${pageSlug}`)
        const routineData = await routineRes.json()
        setLinkedRoutine(routineData.routine || null)
      } catch {
        setLinkedRoutine(null)
      }
    } catch (err) {
      console.error('Error fetching content:', err)
    } finally {
      setLoading(false)
    }
  }, [pageSlug])

  useEffect(() => {
    fetchContent()
  }, [fetchContent])

  // Save section (and publish it)
  const handleSaveSection = async (sectionKey, content) => {
    try {
      const res = await fetch('/api/cms/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_slug: pageSlug,
          section_key: sectionKey,
          content,
          is_published: true  // Always publish when saving
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        // Update local state
        setSections(prev => prev.map(s =>
          s.section_key === sectionKey ? { ...s, content, is_published: true } : s
        ))
        alert('Sauvegarde reussie !')
      } else {
        console.error('Save error:', data)
        alert('Erreur: ' + (data.error || 'Sauvegarde echouee'))
      }
    } catch (err) {
      console.error('Save exception:', err)
      alert('Erreur reseau - verifiez la connexion')
    }
  }

  // Toggle publish all sections + routine via dedicated API
  const handleTogglePublish = async () => {
    setPublishing(true)
    const newStatus = !isPublished
    try {
      const res = await fetch('/api/cms/publish', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_slug: pageSlug,
          is_published: newStatus
        })
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        alert(data.error || 'Erreur lors de la publication')
        return
      }

      setIsPublished(newStatus)
      setSections(prev => prev.map(s => ({ ...s, is_published: newStatus })))
      if (linkedRoutine) {
        setLinkedRoutine(prev => ({ ...prev, is_active: newStatus }))
      }
      alert(newStatus ? 'Page publiee !' : 'Page depubliee')
    } catch (err) {
      alert('Erreur lors de la publication')
      console.error(err)
    } finally {
      setPublishing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editeur de Page</h1>
          <p className="text-gray-600">/{pageSlug}</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={pageSlug === 'apply' ? '/apply' : `/shop/${pageSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Voir la page
          </a>
          <button
            onClick={handleTogglePublish}
            disabled={publishing}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-colors ${
              isPublished
                ? 'bg-green-600 text-white hover:bg-red-600'
                : 'bg-pink-600 text-white hover:bg-pink-700'
            }`}
          >
            {publishing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : isPublished ? (
              <Globe className="w-4 h-4" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            {publishing ? 'En cours...' : isPublished ? 'En ligne' : 'Publier'}
          </button>
        </div>
      </div>

      {/* Linked Routine Banner (only for routine pages) */}
      {pageSlug !== 'apply' && linkedRoutine ? (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-900">Routine liee : {linkedRoutine.title}</h3>
                <p className="text-sm text-purple-700">
                  Les produits et prix sont geres depuis la page Routines
                  ({linkedRoutine.base_price}€ / {linkedRoutine.upsell_1_price}€ / {linkedRoutine.upsell_2_price}€)
                </p>
              </div>
            </div>
            <Link
              href="/routines"
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              <LinkIcon className="w-4 h-4" />
              Modifier les produits
            </Link>
          </div>
        </div>
      ) : pageSlug !== 'apply' ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-yellow-600" />
            <div>
              <h3 className="font-semibold text-yellow-900">Aucune routine liee</h3>
              <p className="text-sm text-yellow-700">
                Creez une routine avec le slug "{pageSlug}" dans la page Routines pour lier les produits et les prix.
              </p>
            </div>
            <Link
              href="/routines"
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Creer la routine
            </Link>
          </div>
        </div>
      ) : null}

      {/* Instructions */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <h3 className="font-semibold text-gray-700 mb-2">Sections editables</h3>
        <p className="text-sm text-gray-600">
          Modifiez le contenu textuel (hero, avis, FAQ, garanties, CTA) ci-dessous.
          Les produits et les prix sont geres automatiquement depuis la routine liee.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map(section => {
          const sectionConfig = config[section.section_key]
          if (!sectionConfig) return null

          return (
            <SectionEditor
              key={section.id}
              section={section}
              config={sectionConfig}
              pageSlug={pageSlug}
              images={images}
              onSave={handleSaveSection}
            />
          )
        })}
      </div>

      {/* Empty state */}
      {sections.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun contenu</h3>
          <p className="text-gray-600">
            Exécutez la migration SQL pour initialiser le contenu de cette page.
          </p>
        </div>
      )}
    </div>
  )
}
