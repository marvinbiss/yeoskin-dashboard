'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, Package, Tag, DollarSign, Image, Hash } from 'lucide-react'
import { Modal, Button } from '../Common'
import { ProductJsonEditor } from './ProductJsonEditor'

const generateSlug = (name) => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const emptyForm = {
  title: '',
  slug: '',
  objective: '',
  objective_color: '#FF69B4',
  description: '',
  long_description: '',
  image_url: '',
  base_products: [],
  base_price: '',
  base_shopify_variant_ids: ['', '', ''],
  upsell_1_product: [],
  upsell_1_price: '',
  upsell_1_original_price: '',
  upsell_1_shopify_variant_ids: ['', '', '', ''],
  upsell_2_products: [],
  upsell_2_price: '',
  upsell_2_original_price: '',
  upsell_2_shopify_variant_ids: ['', '', '', '', ''],
  is_active: true,
  is_featured: false,
  expected_results: '',
  meta_title: '',
  meta_description: '',
}

/**
 * RoutineForm - Modal de creation/edition de routine
 */
export const RoutineForm = ({ isOpen, onClose, routine = null, onSubmit, loading = false }) => {
  const isEditing = !!routine
  const [formData, setFormData] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [slugManual, setSlugManual] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (routine) {
        setFormData({
          title: routine.title || '',
          slug: routine.slug || '',
          objective: routine.objective || '',
          objective_color: routine.objective_color || '#FF69B4',
          description: routine.description || '',
          long_description: routine.long_description || '',
          image_url: routine.image_url || '',
          base_products: routine.base_products || [],
          base_price: routine.base_price || '',
          base_shopify_variant_ids: routine.base_shopify_variant_ids?.map(String) || ['', '', ''],
          upsell_1_product: routine.upsell_1_product ? [routine.upsell_1_product] : [],
          upsell_1_price: routine.upsell_1_price || '',
          upsell_1_original_price: routine.upsell_1_original_price || '',
          upsell_1_shopify_variant_ids: routine.upsell_1_shopify_variant_ids?.map(String) || ['', '', '', ''],
          upsell_2_products: routine.upsell_2_products || [],
          upsell_2_price: routine.upsell_2_price || '',
          upsell_2_original_price: routine.upsell_2_original_price || '',
          upsell_2_shopify_variant_ids: routine.upsell_2_shopify_variant_ids?.map(String) || ['', '', '', '', ''],
          is_active: routine.is_active ?? true,
          is_featured: routine.is_featured ?? false,
          expected_results: Array.isArray(routine.expected_results) ? routine.expected_results.join('\n') : '',
          meta_title: routine.meta_title || '',
          meta_description: routine.meta_description || '',
        })
        setSlugManual(true)
      } else {
        setFormData(emptyForm)
        setSlugManual(false)
      }
      setErrors({})
    }
  }, [isOpen, routine])

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      // Auto-generate slug from title
      if (field === 'title' && !slugManual) {
        updated.slug = generateSlug(value)
      }
      return updated
    })
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const handleVariantIdChange = (field, index, value) => {
    const ids = [...formData[field]]
    ids[index] = value
    handleChange(field, ids)
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) newErrors.title = 'Le titre est requis'
    if (!formData.slug.trim()) newErrors.slug = 'Le slug est requis'
    if (!formData.objective.trim()) newErrors.objective = "L'objectif est requis"
    if (!formData.description.trim()) newErrors.description = 'La description est requise'

    // Base products (3)
    if (!formData.base_products || formData.base_products.length < 3) {
      newErrors.base_products = '3 produits base requis'
    } else if (formData.base_products.some(p => !p.name?.trim())) {
      newErrors.base_products = 'Tous les produits base doivent avoir un nom'
    }

    if (!formData.base_price || parseFloat(formData.base_price) <= 0) {
      newErrors.base_price = 'Le prix base doit etre > 0'
    }

    // Base variant IDs (3)
    const baseIds = formData.base_shopify_variant_ids.filter(id => id.toString().trim())
    if (baseIds.length !== 3) {
      newErrors.base_variant_ids = '3 IDs variantes Shopify requis'
    } else if (baseIds.some(id => !Number.isInteger(Number(id)) || Number(id) <= 0)) {
      newErrors.base_variant_ids = 'Les IDs doivent etre des entiers positifs'
    }

    // Upsell 1 product (1)
    if (!formData.upsell_1_product || formData.upsell_1_product.length < 1) {
      newErrors.upsell_1_product = '1 produit upsell 1 requis'
    } else if (!formData.upsell_1_product[0]?.name?.trim()) {
      newErrors.upsell_1_product = 'Le produit upsell 1 doit avoir un nom'
    }

    if (!formData.upsell_1_price || parseFloat(formData.upsell_1_price) <= 0) {
      newErrors.upsell_1_price = 'Le prix upsell 1 est requis'
    }
    if (!formData.upsell_1_original_price || parseFloat(formData.upsell_1_original_price) <= 0) {
      newErrors.upsell_1_original_price = 'Le prix original upsell 1 est requis'
    }

    // Upsell 1 variant IDs (4)
    const upsell1Ids = formData.upsell_1_shopify_variant_ids.filter(id => id.toString().trim())
    if (upsell1Ids.length !== 4) {
      newErrors.upsell_1_variant_ids = '4 IDs variantes Shopify requis'
    } else if (upsell1Ids.some(id => !Number.isInteger(Number(id)) || Number(id) <= 0)) {
      newErrors.upsell_1_variant_ids = 'Les IDs doivent etre des entiers positifs'
    }

    // Upsell 2 products (2)
    if (!formData.upsell_2_products || formData.upsell_2_products.length < 2) {
      newErrors.upsell_2_products = '2 produits upsell 2 requis'
    } else if (formData.upsell_2_products.some(p => !p.name?.trim())) {
      newErrors.upsell_2_products = 'Tous les produits upsell 2 doivent avoir un nom'
    }

    if (!formData.upsell_2_price || parseFloat(formData.upsell_2_price) <= 0) {
      newErrors.upsell_2_price = 'Le prix upsell 2 est requis'
    }
    if (!formData.upsell_2_original_price || parseFloat(formData.upsell_2_original_price) <= 0) {
      newErrors.upsell_2_original_price = 'Le prix original upsell 2 est requis'
    }

    // Upsell 2 variant IDs (5)
    const upsell2Ids = formData.upsell_2_shopify_variant_ids.filter(id => id.toString().trim())
    if (upsell2Ids.length !== 5) {
      newErrors.upsell_2_variant_ids = '5 IDs variantes Shopify requis'
    } else if (upsell2Ids.some(id => !Number.isInteger(Number(id)) || Number(id) <= 0)) {
      newErrors.upsell_2_variant_ids = 'Les IDs doivent etre des entiers positifs'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    // Prepare payload (exclude generated columns)
    const payload = {
      title: formData.title.trim(),
      slug: formData.slug.trim(),
      objective: formData.objective.trim(),
      objective_color: formData.objective_color,
      description: formData.description.trim(),
      long_description: formData.long_description.trim() || null,
      image_url: formData.image_url.trim() || null,
      base_products: formData.base_products.slice(0, 3),
      base_price: parseFloat(formData.base_price),
      base_shopify_variant_ids: formData.base_shopify_variant_ids.map(Number),
      upsell_1_product: formData.upsell_1_product[0] || null,
      upsell_1_price: parseFloat(formData.upsell_1_price),
      upsell_1_original_price: parseFloat(formData.upsell_1_original_price),
      upsell_1_shopify_variant_ids: formData.upsell_1_shopify_variant_ids.map(Number),
      upsell_2_products: formData.upsell_2_products.slice(0, 2),
      upsell_2_price: parseFloat(formData.upsell_2_price),
      upsell_2_original_price: parseFloat(formData.upsell_2_original_price),
      upsell_2_shopify_variant_ids: formData.upsell_2_shopify_variant_ids.map(Number),
      is_active: formData.is_active,
      is_featured: formData.is_featured,
      expected_results: formData.expected_results.trim()
        ? formData.expected_results.split('\n').filter(r => r.trim())
        : null,
      meta_title: formData.meta_title.trim() || null,
      meta_description: formData.meta_description.trim() || null,
    }

    try {
      await onSubmit(payload)
    } catch (err) {
      setErrors({ submit: err.message })
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Modifier la routine' : 'Nouvelle routine'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        {/* General error */}
        {errors.submit && (
          <div className="p-3 bg-danger-50 dark:bg-danger-500/20 border border-danger-200 dark:border-danger-800 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-danger-500 mt-0.5" />
            <p className="text-sm text-danger-700 dark:text-danger-300">{errors.submit}</p>
          </div>
        )}

        {/* Section: Infos de base */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 border-b pb-2">
            <Tag className="w-4 h-4" />
            Informations de base
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Titre <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Routine Hydratation"
                className={`input ${errors.title ? 'border-danger-500' : ''}`}
                disabled={loading}
              />
              {errors.title && <p className="mt-1 text-xs text-danger-500">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Slug <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => { setSlugManual(true); handleChange('slug', e.target.value) }}
                placeholder="routine-hydratation"
                className={`input ${errors.slug ? 'border-danger-500' : ''}`}
                disabled={loading}
              />
              {errors.slug && <p className="mt-1 text-xs text-danger-500">{errors.slug}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Objectif <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={formData.objective}
                onChange={(e) => handleChange('objective', e.target.value)}
                placeholder="Hydratation intense"
                className={`input ${errors.objective ? 'border-danger-500' : ''}`}
                disabled={loading}
              />
              {errors.objective && <p className="mt-1 text-xs text-danger-500">{errors.objective}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Couleur objectif
              </label>
              <input
                type="color"
                value={formData.objective_color}
                onChange={(e) => handleChange('objective_color', e.target.value)}
                className="w-full h-10 rounded-lg cursor-pointer"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description <span className="text-danger-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Description courte de la routine..."
              rows={2}
              className={`input ${errors.description ? 'border-danger-500' : ''}`}
              disabled={loading}
            />
            {errors.description && <p className="mt-1 text-xs text-danger-500">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Image URL
            </label>
            <input
              type="text"
              value={formData.image_url}
              onChange={(e) => handleChange('image_url', e.target.value)}
              placeholder="https://..."
              className="input"
              disabled={loading}
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => handleChange('is_active', e.target.checked)}
                className="w-4 h-4 rounded text-primary-600"
                disabled={loading}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => handleChange('is_featured', e.target.checked)}
                className="w-4 h-4 rounded text-primary-600"
                disabled={loading}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">En vedette</span>
            </label>
          </div>
        </div>

        {/* Section: Pack Base (3 produits) */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 border-b pb-2">
            <Package className="w-4 h-4" />
            Pack Base (3 produits)
          </h4>

          <ProductJsonEditor
            value={formData.base_products}
            onChange={(val) => handleChange('base_products', val)}
            count={3}
            label="Produits base"
          />
          {errors.base_products && <p className="text-xs text-danger-500">{errors.base_products}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prix base (EUR) <span className="text-danger-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.base_price}
                onChange={(e) => handleChange('base_price', e.target.value)}
                placeholder="79.00"
                className={`input ${errors.base_price ? 'border-danger-500' : ''}`}
                disabled={loading}
              />
              {errors.base_price && <p className="mt-1 text-xs text-danger-500">{errors.base_price}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              IDs Variantes Shopify (3) <span className="text-danger-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {formData.base_shopify_variant_ids.map((id, i) => (
                <input
                  key={i}
                  type="text"
                  value={id}
                  onChange={(e) => handleVariantIdChange('base_shopify_variant_ids', i, e.target.value)}
                  placeholder={`ID variante ${i + 1}`}
                  className="input text-sm font-mono"
                  disabled={loading}
                />
              ))}
            </div>
            {errors.base_variant_ids && <p className="mt-1 text-xs text-danger-500">{errors.base_variant_ids}</p>}
          </div>
        </div>

        {/* Section: Upsell 1 (+1 produit = 4 total) */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 border-b pb-2">
            <Package className="w-4 h-4" />
            Upsell 1 (+1 produit = 4 au total)
          </h4>

          <ProductJsonEditor
            value={formData.upsell_1_product}
            onChange={(val) => handleChange('upsell_1_product', val)}
            count={1}
            label="Produit supplementaire"
          />
          {errors.upsell_1_product && <p className="text-xs text-danger-500">{errors.upsell_1_product}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prix upsell 1 (EUR) <span className="text-danger-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.upsell_1_price}
                onChange={(e) => handleChange('upsell_1_price', e.target.value)}
                placeholder="99.00"
                className={`input ${errors.upsell_1_price ? 'border-danger-500' : ''}`}
                disabled={loading}
              />
              {errors.upsell_1_price && <p className="mt-1 text-xs text-danger-500">{errors.upsell_1_price}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prix original (EUR) <span className="text-danger-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.upsell_1_original_price}
                onChange={(e) => handleChange('upsell_1_original_price', e.target.value)}
                placeholder="130.00"
                className={`input ${errors.upsell_1_original_price ? 'border-danger-500' : ''}`}
                disabled={loading}
              />
              {errors.upsell_1_original_price && <p className="mt-1 text-xs text-danger-500">{errors.upsell_1_original_price}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              IDs Variantes Shopify (4) <span className="text-danger-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {formData.upsell_1_shopify_variant_ids.map((id, i) => (
                <input
                  key={i}
                  type="text"
                  value={id}
                  onChange={(e) => handleVariantIdChange('upsell_1_shopify_variant_ids', i, e.target.value)}
                  placeholder={`ID ${i + 1}`}
                  className="input text-sm font-mono"
                  disabled={loading}
                />
              ))}
            </div>
            {errors.upsell_1_variant_ids && <p className="mt-1 text-xs text-danger-500">{errors.upsell_1_variant_ids}</p>}
          </div>
        </div>

        {/* Section: Upsell 2 (+2 produits = 5 total) */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 border-b pb-2">
            <Package className="w-4 h-4" />
            Upsell 2 (+2 produits = 5 au total)
          </h4>

          <ProductJsonEditor
            value={formData.upsell_2_products}
            onChange={(val) => handleChange('upsell_2_products', val)}
            count={2}
            label="Produits supplementaires"
          />
          {errors.upsell_2_products && <p className="text-xs text-danger-500">{errors.upsell_2_products}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prix upsell 2 (EUR) <span className="text-danger-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.upsell_2_price}
                onChange={(e) => handleChange('upsell_2_price', e.target.value)}
                placeholder="119.00"
                className={`input ${errors.upsell_2_price ? 'border-danger-500' : ''}`}
                disabled={loading}
              />
              {errors.upsell_2_price && <p className="mt-1 text-xs text-danger-500">{errors.upsell_2_price}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prix original (EUR) <span className="text-danger-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.upsell_2_original_price}
                onChange={(e) => handleChange('upsell_2_original_price', e.target.value)}
                placeholder="170.00"
                className={`input ${errors.upsell_2_original_price ? 'border-danger-500' : ''}`}
                disabled={loading}
              />
              {errors.upsell_2_original_price && <p className="mt-1 text-xs text-danger-500">{errors.upsell_2_original_price}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              IDs Variantes Shopify (5) <span className="text-danger-500">*</span>
            </label>
            <div className="grid grid-cols-5 gap-2">
              {formData.upsell_2_shopify_variant_ids.map((id, i) => (
                <input
                  key={i}
                  type="text"
                  value={id}
                  onChange={(e) => handleVariantIdChange('upsell_2_shopify_variant_ids', i, e.target.value)}
                  placeholder={`${i + 1}`}
                  className="input text-sm font-mono"
                  disabled={loading}
                />
              ))}
            </div>
            {errors.upsell_2_variant_ids && <p className="mt-1 text-xs text-danger-500">{errors.upsell_2_variant_ids}</p>}
          </div>
        </div>

        {/* Section: Marketing */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 border-b pb-2">
            <Hash className="w-4 h-4" />
            Marketing (optionnel)
          </h4>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Resultats attendus (un par ligne)
            </label>
            <textarea
              value={formData.expected_results}
              onChange={(e) => handleChange('expected_results', e.target.value)}
              placeholder="Peau hydratee en profondeur&#10;Teint lumineux&#10;Texture amelioree"
              rows={3}
              className="input"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Meta titre
              </label>
              <input
                type="text"
                value={formData.meta_title}
                onChange={(e) => handleChange('meta_title', e.target.value)}
                placeholder="Titre SEO"
                className="input"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Meta description
              </label>
              <input
                type="text"
                value={formData.meta_description}
                onChange={(e) => handleChange('meta_description', e.target.value)}
                placeholder="Description SEO"
                className="input"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-900 pb-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {isEditing ? 'Enregistrer' : 'Creer la routine'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default RoutineForm
