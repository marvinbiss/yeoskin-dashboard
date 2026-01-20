/**
 * ProductsPage - Admin product catalog management
 * MODULE 2: E-commerce - Admin side
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Layout } from '../components/Layout'
import { Button, Modal, Badge, useToast, Card, Spinner, EmptyState, ConfirmDialog } from '../components/Common'
import {
  Plus, Search, Filter, Trash2, Edit, Copy, Upload,
  Package, AlertTriangle, Check, X, Image as ImageIcon,
  MoreVertical, Download, ChevronDown
} from 'lucide-react'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ category: '', status: '', stock: '' })
  const [selectedProducts, setSelectedProducts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [categories, setCategories] = useState([])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [filters])

  const fetchProducts = async () => {
    setLoading(true)
    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters.status === 'active') query = query.eq('is_active', true)
    if (filters.status === 'draft') query = query.eq('is_active', false)
    if (filters.stock === 'low') query = query.lt('stock_quantity', 10)
    if (filters.stock === 'out') query = query.eq('stock_quantity', 0)
    if (filters.category) query = query.contains('categories', [filters.category])

    const { data, error } = await query
    if (!error) setProducts(data || [])
    setLoading(false)
  }

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('product_categories')
      .select('id, name')
      .eq('is_active', true)
    setCategories(data || [])
  }

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (ids) => {
    if (!confirm(`Supprimer ${ids.length} produit(s) ?`)) return
    await supabase.from('products').delete().in('id', ids)
    fetchProducts()
    setSelectedProducts([])
  }

  const handleBulkAction = async (action) => {
    if (selectedProducts.length === 0) return

    if (action === 'delete') {
      handleDelete(selectedProducts)
    } else if (action === 'activate') {
      await supabase.from('products').update({ is_active: true }).in('id', selectedProducts)
      fetchProducts()
      setSelectedProducts([])
    } else if (action === 'deactivate') {
      await supabase.from('products').update({ is_active: false }).in('id', selectedProducts)
      fetchProducts()
      setSelectedProducts([])
    }
  }

  const duplicateProduct = async (product) => {
    const { id, created_at, updated_at, ...rest } = product
    const newProduct = {
      ...rest,
      name: `${product.name} (copie)`,
      sku: `${product.sku}-COPY-${Date.now().toString(36)}`,
      is_active: false
    }
    await supabase.from('products').insert(newProduct)
    fetchProducts()
  }

  return (
    <Layout title="Catalogue Produits" subtitle="Gérez vos produits K-Beauty">
      {/* Header Actions */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="draft">Brouillons</option>
          </select>

          <select
            value={filters.stock}
            onChange={(e) => setFilters({ ...filters, stock: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tout le stock</option>
            <option value="low">Stock faible</option>
            <option value="out">Rupture</option>
          </select>
        </div>

        <Button onClick={() => { setEditingProduct(null); setShowModal(true) }}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un produit
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="mb-4 p-3 bg-primary-50 rounded-lg flex items-center gap-4">
          <span className="text-sm font-medium text-primary-700">
            {selectedProducts.length} produit(s) sélectionné(s)
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => handleBulkAction('activate')}>
              Activer
            </Button>
            <Button size="sm" variant="secondary" onClick={() => handleBulkAction('deactivate')}>
              Désactiver
            </Button>
            <Button size="sm" variant="danger" onClick={() => handleBulkAction('delete')}>
              <Trash2 className="w-4 h-4 mr-1" />
              Supprimer
            </Button>
          </div>
          <button
            onClick={() => setSelectedProducts([])}
            className="ml-auto text-sm text-gray-500 hover:text-gray-700"
          >
            Annuler
          </button>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                  onChange={(e) => setSelectedProducts(e.target.checked ? filteredProducts.map(p => p.id) : [])}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Aucun produit trouvé</p>
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={(e) => {
                        setSelectedProducts(e.target.checked
                          ? [...selectedProducts, product.id]
                          : selectedProducts.filter(id => id !== product.id)
                        )
                      }}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                        {product.image_url ? (
                          <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        {product.short_description && (
                          <p className="text-sm text-gray-500 line-clamp-1">{product.short_description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono">{product.sku}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <span className="font-semibold">{product.price}€</span>
                      {product.compare_at_price && (
                        <span className="text-gray-400 line-through ml-2">{product.compare_at_price}€</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {product.stock_quantity === 0 ? (
                      <Badge variant="danger">Rupture</Badge>
                    ) : product.stock_quantity < 10 ? (
                      <Badge variant="warning">{product.stock_quantity} unités</Badge>
                    ) : (
                      <Badge variant="success">{product.stock_quantity} unités</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {product.is_active ? (
                      <Badge variant="success">Actif</Badge>
                    ) : (
                      <Badge variant="secondary">Brouillon</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setEditingProduct(product); setShowModal(true) }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => duplicateProduct(product)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        title="Dupliquer"
                      >
                        <Copy className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete([product.id])}
                        className="p-2 hover:bg-red-50 rounded-lg transition"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Product Modal */}
      <ProductModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingProduct(null) }}
        product={editingProduct}
        categories={categories}
        onSave={() => { fetchProducts(); setShowModal(false); setEditingProduct(null) }}
      />
    </Layout>
  )
}

// Product Form Modal
function ProductModal({ isOpen, onClose, product, categories, onSave }) {
  const [form, setForm] = useState({
    name: '',
    short_description: '',
    description: '',
    price: '',
    compare_at_price: '',
    sku: '',
    stock_quantity: 0,
    low_stock_threshold: 10,
    categories: [],
    tags: [],
    image_url: '',
    images: [],
    is_active: false,
    is_bestseller: false,
    meta_title: '',
    meta_description: '',
    affiliate_url: ''
  })
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        short_description: product.short_description || '',
        description: product.description || '',
        price: product.price || '',
        compare_at_price: product.compare_at_price || '',
        sku: product.sku || '',
        stock_quantity: product.stock_quantity || 0,
        low_stock_threshold: product.low_stock_threshold || 10,
        categories: product.categories || [],
        tags: product.tags || [],
        image_url: product.image_url || '',
        images: product.images || [],
        is_active: product.is_active || false,
        is_bestseller: product.is_bestseller || false,
        meta_title: product.meta_title || '',
        meta_description: product.meta_description || '',
        affiliate_url: product.affiliate_url || ''
      })
      setImagePreview(product.image_url)
    } else {
      setForm({
        name: '',
        short_description: '',
        description: '',
        price: '',
        compare_at_price: '',
        sku: `SKU-${Date.now().toString(36).toUpperCase()}`,
        stock_quantity: 0,
        low_stock_threshold: 10,
        categories: [],
        tags: [],
        image_url: '',
        images: [],
        is_active: false,
        is_bestseller: false,
        meta_title: '',
        meta_description: '',
        affiliate_url: ''
      })
      setImagePreview(null)
    }
  }, [product, isOpen])

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const uploadImage = async () => {
    if (!imageFile) return form.image_url

    const ext = imageFile.name.split('.').pop()
    const filename = `products/${Date.now()}.${ext}`

    const { data, error } = await supabase.storage
      .from('products')
      .upload(filename, imageFile)

    if (error) throw error

    const { data: urlData } = supabase.storage
      .from('products')
      .getPublicUrl(filename)

    return urlData.publicUrl
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      let imageUrl = form.image_url
      if (imageFile) {
        imageUrl = await uploadImage()
      }

      const productData = {
        ...form,
        image_url: imageUrl,
        price: parseFloat(form.price) || 0,
        compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
        slug: form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      }

      if (product?.id) {
        await supabase.from('products').update(productData).eq('id', product.id)
      } else {
        await supabase.from('products').insert(productData)
      }

      onSave()
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            {product ? 'Modifier le produit' : 'Nouveau produit'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-130px)]">
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image principale</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center">
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => { setImageFile(null); setImagePreview(null); setForm({ ...form, image_url: '' }) }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Glissez une image ou cliquez pour sélectionner</p>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du produit *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Nom du produit"
                />
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description courte</label>
                <input
                  type="text"
                  value={form.short_description}
                  onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Pour les cartes produits"
                  maxLength={150}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description complète</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Description détaillée du produit"
                />
              </div>

              {/* Affiliate URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lien affilié</label>
                <input
                  type="url"
                  value={form.affiliate_url}
                  onChange={(e) => setForm({ ...form, affiliate_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix barré</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.compare_at_price}
                    onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* SKU & Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock_quantity}
                    onChange={(e) => setForm({ ...form, stock_quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Low Stock Threshold */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seuil stock faible</label>
                <input
                  type="number"
                  min="0"
                  value={form.low_stock_threshold}
                  onChange={(e) => setForm({ ...form, low_stock_threshold: parseInt(e.target.value) || 10 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Status Toggles */}
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Produit actif (visible)</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.is_bestseller}
                    onChange={(e) => setForm({ ...form, is_bestseller: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Best Seller</span>
                </label>
              </div>

              {/* SEO */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">SEO</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                    <input
                      type="text"
                      value={form.meta_title}
                      onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      maxLength={60}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                    <textarea
                      value={form.meta_description}
                      onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      maxLength={160}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Enregistrement...' : (product ? 'Mettre à jour' : 'Créer le produit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
