'use client'

import { Plus, Trash2, Image } from 'lucide-react'

const emptyProduct = { name: '', brand: '', image_url: '', description: '' }

/**
 * ProductJsonEditor - Editeur JSONB pour tableau de produits
 * @param {Object[]} value - Tableau de produits
 * @param {Function} onChange - Callback avec nouveau tableau
 * @param {number} count - Nombre exact d'items requis
 * @param {string} label - Label de la section
 */
export const ProductJsonEditor = ({ value = [], onChange, count, label = 'Produits' }) => {
  const products = [...value]

  // Remplir jusqu'au count requis
  while (products.length < count) {
    products.push({ ...emptyProduct })
  }

  const handleFieldChange = (index, field, val) => {
    const updated = [...products]
    updated[index] = { ...updated[index], [field]: val }
    onChange(updated.slice(0, count))
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} ({count} requis)
      </label>
      {products.slice(0, count).map((product, index) => (
        <div
          key={index}
          className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">
              Produit {index + 1}
            </span>
            {product.image_url && (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-8 h-8 rounded object-cover"
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={product.name || ''}
              onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
              placeholder="Nom du produit"
              className="input text-sm"
            />
            <input
              type="text"
              value={product.brand || ''}
              onChange={(e) => handleFieldChange(index, 'brand', e.target.value)}
              placeholder="Marque"
              className="input text-sm"
            />
          </div>
          <input
            type="text"
            value={product.image_url || ''}
            onChange={(e) => handleFieldChange(index, 'image_url', e.target.value)}
            placeholder="URL image (https://...)"
            className="input text-sm"
          />
          <input
            type="text"
            value={product.description || ''}
            onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
            placeholder="Description courte"
            className="input text-sm"
          />
        </div>
      ))}
    </div>
  )
}

export default ProductJsonEditor
