/**
 * CreatorProducts - Product selection for creators
 * MODULE 2: E-commerce - Creator side
 */
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useCreatorAuth } from '../contexts/CreatorAuthContext'
import { CreatorLayout } from '../components/CreatorLayout'
import {
  Search, Plus, X, Check,
  ShoppingBag, ChevronDown, ChevronUp,
  Eye, Package, Smartphone, Monitor, RefreshCw, Sparkles
} from 'lucide-react'

export default function CreatorProducts() {
  const { creator } = useCreatorAuth()
  const [products, setProducts] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState([])
  const [showPreview, setShowPreview] = useState(false)
  const [previewMode, setPreviewMode] = useState('mobile')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (creator?.id) {
      fetchData()
    }
  }, [creator?.id])

  const fetchData = async () => {
    setLoading(true)

    // Fetch all active products
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .gt('stock_quantity', 0)
      .order('name')

    setProducts(productsData || [])

    // Fetch creator profile with featured products
    const { data: profileData } = await supabase
      .from('creator_profiles')
      .select('id, featured_products')
      .eq('creator_id', creator.id)
      .single()

    if (profileData) {
      setProfile(profileData)
      setSelectedProducts(profileData.featured_products || [])
    }

    // Fetch categories
    const { data: categoriesData } = await supabase
      .from('product_categories')
      .select('id, name')
      .eq('is_active', true)

    setCategories(categoriesData || [])

    setLoading(false)
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !category || (p.categories && p.categories.includes(category))
    return matchesSearch && matchesCategory
  })

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const toggleProduct = (productId) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId))
    } else {
      if (selectedProducts.length >= 12) {
        showToast('Maximum 12 produits autorises', 'error')
        return
      }
      setSelectedProducts([...selectedProducts, productId])
    }
  }

  const removeProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(id => id !== productId))
  }

  const moveProduct = (index, direction) => {
    const newSelected = [...selectedProducts]
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= newSelected.length) return

    [newSelected[index], newSelected[newIndex]] = [newSelected[newIndex], newSelected[index]]
    setSelectedProducts(newSelected)
  }

  const saveSelection = async () => {
    if (!profile?.id) return

    setSaving(true)
    const { error } = await supabase
      .from('creator_profiles')
      .update({ featured_products: selectedProducts })
      .eq('id', profile.id)

    setSaving(false)

    if (error) {
      showToast('Erreur lors de la sauvegarde', 'error')
    } else {
      showToast('Selection enregistree avec succes!')
    }
  }

  const selectedProductsData = selectedProducts
    .map(id => products.find(p => p.id === id))
    .filter(Boolean)

  if (loading) {
    return (
      <CreatorLayout title="Ma Sélection" subtitle="Gérez les produits de votre page">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </CreatorLayout>
    )
  }

  return (
    <CreatorLayout title="Ma Selection" subtitle="Choisissez jusqu'a 12 produits pour votre page">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}>
          {toast.type === 'error' ? <X className="w-5 h-5" /> : <Check className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

      {/* Preview Toggle */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-500" />
          <span className="text-sm text-gray-600">
            {selectedProducts.length} produit(s) selectionne(s)
          </span>
        </div>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
            showPreview ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Eye className="w-4 h-4" />
          {showPreview ? 'Masquer apercu' : 'Voir apercu'}
        </button>
      </div>

      {/* Live Preview */}
      {showPreview && (
        <div className="mb-6 bg-gray-900 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium">Apercu de votre page</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`p-2 rounded-lg ${previewMode === 'mobile' ? 'bg-primary-500 text-white' : 'bg-gray-700 text-gray-300'}`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`p-2 rounded-lg ${previewMode === 'desktop' ? 'bg-primary-500 text-white' : 'bg-gray-700 text-gray-300'}`}
              >
                <Monitor className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className={`mx-auto bg-white rounded-xl overflow-hidden ${
            previewMode === 'mobile' ? 'max-w-[375px]' : 'max-w-full'
          }`}>
            <div className="p-4 bg-gradient-to-r from-primary-500 to-pink-500 text-center text-white">
              <h4 className="font-bold">Ma Selection Beaute</h4>
            </div>
            <div className={`p-4 grid gap-4 ${previewMode === 'mobile' ? 'grid-cols-1' : 'grid-cols-3'}`}>
              {selectedProductsData.slice(0, 6).map(product => (
                <div key={product.id} className="bg-gray-50 rounded-lg overflow-hidden">
                  <div className="h-32 bg-gray-200">
                    {product.image_url ? (
                      <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-primary-600 font-bold">{product.price}€</p>
                  </div>
                </div>
              ))}
              {selectedProductsData.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-400">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Selectionnez des produits</p>
                </div>
              )}
            </div>
            {selectedProductsData.length > 6 && (
              <p className="text-center text-sm text-gray-500 pb-4">
                +{selectedProductsData.length - 6} autres produits
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Product Catalog */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search & Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Toutes les catégories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredProducts.map(product => {
              const isSelected = selectedProducts.includes(product.id)
              return (
                <div
                  key={product.id}
                  className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden transition-all cursor-pointer hover:shadow-md ${
                    isSelected ? 'border-primary-500 ring-2 ring-primary-100' : 'border-gray-200'
                  }`}
                  onClick={() => toggleProduct(product.id)}
                >
                  <div className="relative">
                    {/* Product Image */}
                    <div className="h-40 bg-gray-100">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Selection Badge */}
                    <div className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isSelected ? 'bg-primary-500 text-white' : 'bg-white/90 text-gray-400'
                    }`}>
                      {isSelected ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    </div>

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {product.is_bestseller && (
                        <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded">
                          Best Seller
                        </span>
                      )}
                      {product.compare_at_price && product.compare_at_price > product.price && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                          Promo
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 line-clamp-1">{product.name}</h3>
                    {product.short_description && (
                      <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{product.short_description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-semibold text-gray-900">{product.price}€</span>
                      {product.compare_at_price && (
                        <span className="text-sm text-gray-400 line-through">{product.compare_at_price}€</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Aucun produit trouvé</p>
            </div>
          )}
        </div>

        {/* Right: Selected Products (Sticky) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-primary-500 to-pink-500">
              <div className="flex items-center justify-between text-white">
                <h3 className="font-semibold">Ma Sélection</h3>
                <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full">
                  {selectedProducts.length}/12
                </span>
              </div>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {selectedProductsData.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">Cliquez sur des produits pour les ajouter</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedProductsData.map((product, index) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg group"
                    >
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => moveProduct(index, -1)}
                          disabled={index === 0}
                          className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30"
                        >
                          <ChevronDown className="w-4 h-4 rotate-180" />
                        </button>
                        <button
                          onClick={() => moveProduct(index, 1)}
                          disabled={index === selectedProductsData.length - 1}
                          className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="w-10 h-10 rounded bg-gray-200 overflow-hidden flex-shrink-0">
                        {product.image_url ? (
                          <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.price}€</p>
                      </div>

                      <button
                        onClick={() => removeProduct(product.id)}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 space-y-3">
              <button
                onClick={saveSelection}
                disabled={saving}
                className="w-full py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 transition"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer la sélection'}
              </button>

              {profile && (
                <a
                  href={`https://yeoskin.fr/c/${profile.slug || 'preview'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  <Eye className="w-4 h-4" />
                  Voir ma page
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </CreatorLayout>
  )
}
