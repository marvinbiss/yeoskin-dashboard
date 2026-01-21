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
  Hash,
  Star,
  Settings,
  RefreshCw,
  Check,
  X,
  ExternalLink
} from 'lucide-react'

// Section configurations for different page types
const SECTION_CONFIGS = {
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
    pricing: {
      label: 'Prix & Offres',
      icon: Hash,
      fields: [
        { key: 'base.price', label: 'Prix de base', type: 'number' },
        { key: 'base.original_price', label: 'Prix barré', type: 'number' },
        { key: 'base.label', label: 'Label pack de base', type: 'text' },
        { key: 'upsell_1.price', label: 'Prix upsell +1', type: 'number' },
        { key: 'upsell_1.original_price', label: 'Prix barré upsell +1', type: 'number' },
        { key: 'upsell_1.badge', label: 'Badge upsell +1', type: 'text' },
        { key: 'upsell_1.extra_product', label: 'Produit bonus +1', type: 'text' },
        { key: 'upsell_2.price', label: 'Prix upsell +2', type: 'number' },
        { key: 'upsell_2.original_price', label: 'Prix barré upsell +2', type: 'number' },
        { key: 'upsell_2.badge', label: 'Badge upsell +2', type: 'text' },
      ]
    },
    products: {
      label: 'Produits',
      icon: ImageIcon,
      fields: [
        { key: 'section_title', label: 'Titre de section', type: 'text' },
        { key: 'section_subtitle', label: 'Sous-titre de section', type: 'text' },
      ],
      arrayField: {
        key: 'items',
        itemFields: [
          { key: 'name', label: 'Nom du produit', type: 'text' },
          { key: 'brand', label: 'Marque', type: 'text' },
          { key: 'step', label: 'Etape (1, 2, 3)', type: 'number' },
          { key: 'time', label: 'Moment (ex: MATIN & SOIR)', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'ingredients', label: 'Ingrédients (séparés par virgule)', type: 'text' },
          { key: 'satisfaction', label: 'Satisfaction (%)', type: 'number' },
          { key: 'duration', label: 'Durée (ex: 150ml - 4 mois)', type: 'text' },
          { key: 'image_key', label: 'Clé image', type: 'image' },
        ]
      }
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
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
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

  const config = SECTION_CONFIGS[pageSlug] || {}

  // Fetch content
  const fetchContent = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/cms/content?page_slug=${pageSlug}&include_unpublished=true`)
      const data = await res.json()
      setSections(data.content || [])
      setImages(data.images || {})
    } catch (err) {
      console.error('Error fetching content:', err)
    } finally {
      setLoading(false)
    }
  }, [pageSlug])

  useEffect(() => {
    fetchContent()
  }, [fetchContent])

  // Save section
  const handleSaveSection = async (sectionKey, content) => {
    try {
      const res = await fetch('/api/cms/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_slug: pageSlug,
          section_key: sectionKey,
          content
        })
      })
      const data = await res.json()
      if (data.success) {
        // Update local state
        setSections(prev => prev.map(s =>
          s.section_key === sectionKey ? { ...s, content } : s
        ))
      } else {
        alert(data.error || 'Erreur de sauvegarde')
      }
    } catch (err) {
      alert('Erreur de sauvegarde')
    }
  }

  // Save all
  const handleSaveAll = async () => {
    setSaving(true)
    // This would save all dirty sections
    setSaving(false)
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
          <h1 className="text-2xl font-bold text-gray-900">Éditeur de Page</h1>
          <p className="text-gray-600">/{pageSlug}</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`/shop/${pageSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Prévisualiser
          </a>
          <a
            href={`/shop/${pageSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Voir la page
          </a>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-xl p-4">
        <h3 className="font-semibold text-pink-900 mb-2">Comment utiliser l'éditeur</h3>
        <ul className="text-sm text-pink-800 space-y-1">
          <li>1. Cliquez sur une section pour l'ouvrir et modifier son contenu</li>
          <li>2. Modifiez les textes, prix, images selon vos besoins</li>
          <li>3. Cliquez sur "Sauvegarder" pour enregistrer les changements</li>
          <li>4. Utilisez "Prévisualiser" pour voir le résultat en temps réel</li>
        </ul>
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
