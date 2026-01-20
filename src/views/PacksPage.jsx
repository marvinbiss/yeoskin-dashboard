/**
 * PacksPage - Admin pack management
 * Create packs of products, assign to creators
 */
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Layout } from '../components/Layout'
import { Button, Modal, useToast, Card, Spinner, EmptyState, ConfirmDialog } from '../components/Common'
import {
  Plus, Edit2, Trash2, Package, Search, X, Check,
  GripVertical, Users, ShoppingBag, Save, RefreshCw, Eye
} from 'lucide-react'

export default function PacksPage() {
  const toast = useToast()
  const [packs, setPacks] = useState([])
  const [products, setProducts] = useState([])
  const [creators, setCreators] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPackModal, setShowPackModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [editingPack, setEditingPack] = useState(null)
  const [selectedPack, setSelectedPack] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)

    // Fetch packs with product count and creator count
    const { data: packsData } = await supabase
      .from('product_packs')
      .select(`
        *,
        pack_products(count),
        creator_packs(count)
      `)
      .order('sort_order')

    // Fetch all active products
    const { data: productsData } = await supabase
      .from('products')
      .select('id, name, price, image_url, sku')
      .eq('is_active', true)
      .order('name')

    // Fetch all creators
    const { data: creatorsData } = await supabase
      .from('creators')
      .select('id, email, discount_code, status')
      .order('email')

    setPacks(packsData || [])
    setProducts(productsData || [])
    setCreators(creatorsData || [])
    setLoading(false)
  }

  const handleDeletePack = async () => {
    const { error } = await supabase
      .from('product_packs')
      .delete()
      .eq('id', deleteConfirm.id)

    if (error) {
      toast.error('Erreur: ' + error.message)
    } else {
      toast.success('Pack supprime')
      fetchData()
    }
    setDeleteConfirm({ open: false, id: null })
  }

  const openEditPack = (pack) => {
    setEditingPack(pack)
    setShowPackModal(true)
  }

  const openAssignCreators = (pack) => {
    setSelectedPack(pack)
    setShowAssignModal(true)
  }

  if (loading) {
    return (
      <Layout title="Packs Produits" subtitle="Gerez les packs a assigner aux creatrices">
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Packs Produits" subtitle="Gerez les packs a assigner aux creatrices">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{packs.length} pack(s) au total</p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
            <Button onClick={() => { setEditingPack(null); setShowPackModal(true) }}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau pack
            </Button>
          </div>
        </div>

        {/* Packs Grid */}
        {packs.length === 0 ? (
          <Card>
            <Card.Body>
              <EmptyState
                icon={Package}
                title="Aucun pack"
                description="Creez votre premier pack de produits"
                action={() => setShowPackModal(true)}
                actionLabel="Creer un pack"
              />
            </Card.Body>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packs.map(pack => (
              <Card key={pack.id} className="overflow-hidden">
                {/* Pack Image */}
                <div className="h-40 bg-gradient-to-br from-primary-500 to-pink-500 flex items-center justify-center">
                  {pack.image_url ? (
                    <img src={pack.image_url} alt={pack.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-16 h-16 text-white/50" />
                  )}
                </div>

                <Card.Body>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{pack.name}</h3>
                      <p className="text-sm text-gray-500">{pack.description}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      pack.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {pack.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 py-3 border-t border-b border-gray-100 my-3">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <ShoppingBag className="w-4 h-4" />
                      <span>{pack.pack_products?.[0]?.count || 0} produits</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{pack.creator_packs?.[0]?.count || 0} creatrices</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1"
                      onClick={() => openEditPack(pack)}
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      className="flex-1"
                      onClick={() => openAssignCreators(pack)}
                    >
                      <Users className="w-4 h-4 mr-1" />
                      Assigner
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setDeleteConfirm({ open: true, id: pack.id })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Pack Edit Modal */}
      <PackModal
        isOpen={showPackModal}
        onClose={() => { setShowPackModal(false); setEditingPack(null) }}
        pack={editingPack}
        products={products}
        onSave={() => { fetchData(); setShowPackModal(false); setEditingPack(null) }}
      />

      {/* Assign Creators Modal */}
      <AssignCreatorsModal
        isOpen={showAssignModal}
        onClose={() => { setShowAssignModal(false); setSelectedPack(null) }}
        pack={selectedPack}
        creators={creators}
        onSave={() => { fetchData(); setShowAssignModal(false); setSelectedPack(null) }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null })}
        onConfirm={handleDeletePack}
        title="Supprimer le pack"
        message="Etes-vous sur de vouloir supprimer ce pack ? Les creatrices assignees perdront l'acces."
        confirmText="Supprimer"
        variant="danger"
      />
    </Layout>
  )
}

// Pack Create/Edit Modal
function PackModal({ isOpen, onClose, pack, products, onSave }) {
  const toast = useToast()
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    is_active: true
  })
  const [selectedProducts, setSelectedProducts] = useState([])
  const [packProducts, setPackProducts] = useState([])
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (pack) {
      setForm({
        name: pack.name || '',
        slug: pack.slug || '',
        description: pack.description || '',
        image_url: pack.image_url || '',
        is_active: pack.is_active ?? true
      })
      fetchPackProducts(pack.id)
    } else {
      setForm({
        name: '',
        slug: '',
        description: '',
        image_url: '',
        is_active: true
      })
      setSelectedProducts([])
      setPackProducts([])
    }
  }, [pack, isOpen])

  const fetchPackProducts = async (packId) => {
    const { data } = await supabase
      .from('pack_products')
      .select('product_id')
      .eq('pack_id', packId)

    const productIds = (data || []).map(p => p.product_id)
    setSelectedProducts(productIds)
    setPackProducts(data || [])
  }

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleNameChange = (value) => {
    setForm(prev => ({
      ...prev,
      name: value,
      slug: generateSlug(value)
    }))
  }

  const toggleProduct = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Le nom est requis')
      return
    }

    setSaving(true)
    try {
      let packId = pack?.id

      if (pack) {
        // Update pack
        const { error } = await supabase
          .from('product_packs')
          .update(form)
          .eq('id', pack.id)
        if (error) throw error
      } else {
        // Create pack
        const { data, error } = await supabase
          .from('product_packs')
          .insert(form)
          .select()
          .single()
        if (error) throw error
        packId = data.id
      }

      // Update pack products
      // Delete existing
      await supabase.from('pack_products').delete().eq('pack_id', packId)

      // Insert new
      if (selectedProducts.length > 0) {
        const packProductsData = selectedProducts.map((productId, index) => ({
          pack_id: packId,
          product_id: productId,
          sort_order: index
        }))
        await supabase.from('pack_products').insert(packProductsData)
      }

      toast.success(pack ? 'Pack mis a jour' : 'Pack cree')
      onSave()
    } catch (error) {
      toast.error('Erreur: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            {pack ? 'Modifier le pack' : 'Nouveau pack'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-130px)]">
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Pack Info */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Informations du pack</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="input"
                  placeholder="Ex: Pack Debutant"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                  className="input font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="input"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Image</label>
                <input
                  type="text"
                  value={form.image_url}
                  onChange={(e) => setForm(prev => ({ ...prev, image_url: e.target.value }))}
                  className="input"
                  placeholder="https://..."
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Pack actif</span>
              </label>

              {/* Selected products summary */}
              <div className="p-4 bg-primary-50 rounded-lg">
                <p className="text-sm font-medium text-primary-700">
                  {selectedProducts.length} produit(s) dans ce pack
                </p>
              </div>
            </div>

            {/* Right: Product Selection */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Produits du pack</h3>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input pl-10"
                />
              </div>

              <div className="border border-gray-200 rounded-lg max-h-80 overflow-y-auto">
                {filteredProducts.map(product => {
                  const isSelected = selectedProducts.includes(product.id)
                  return (
                    <div
                      key={product.id}
                      onClick={() => toggleProduct(product.id)}
                      className={`flex items-center gap-3 p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                        isSelected ? 'bg-primary-50' : ''
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'bg-primary-500 border-primary-500' : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden flex-shrink-0">
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
                        <p className="text-xs text-gray-500">{product.sku} - {product.price}€</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Assign Creators Modal
function AssignCreatorsModal({ isOpen, onClose, pack, creators, onSave }) {
  const toast = useToast()
  const [assignedCreators, setAssignedCreators] = useState([])
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (pack) {
      fetchAssignedCreators(pack.id)
    } else {
      setAssignedCreators([])
    }
  }, [pack, isOpen])

  const fetchAssignedCreators = async (packId) => {
    const { data } = await supabase
      .from('creator_packs')
      .select('creator_id')
      .eq('pack_id', packId)

    setAssignedCreators((data || []).map(c => c.creator_id))
  }

  const toggleCreator = (creatorId) => {
    setAssignedCreators(prev =>
      prev.includes(creatorId)
        ? prev.filter(id => id !== creatorId)
        : [...prev, creatorId]
    )
  }

  const handleSave = async () => {
    if (!pack) return

    setSaving(true)
    try {
      // Delete existing assignments for this pack
      await supabase.from('creator_packs').delete().eq('pack_id', pack.id)

      // Insert new assignments
      if (assignedCreators.length > 0) {
        const assignments = assignedCreators.map(creatorId => ({
          creator_id: creatorId,
          pack_id: pack.id
        }))
        await supabase.from('creator_packs').insert(assignments)
      }

      toast.success(`Pack assigne a ${assignedCreators.length} creatrice(s)`)
      onSave()
    } catch (error) {
      toast.error('Erreur: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const filteredCreators = creators.filter(c =>
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.discount_code?.toLowerCase().includes(search.toLowerCase())
  )

  if (!isOpen || !pack) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold">Assigner le pack</h2>
            <p className="text-sm text-gray-500">{pack.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une creatrice..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>

          <div className="border border-gray-200 rounded-lg max-h-80 overflow-y-auto">
            {filteredCreators.map(creator => {
              const isAssigned = assignedCreators.includes(creator.id)
              return (
                <div
                  key={creator.id}
                  onClick={() => toggleCreator(creator.id)}
                  className={`flex items-center gap-3 p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    isAssigned ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isAssigned ? 'bg-primary-500 border-primary-500' : 'border-gray-300'
                  }`}>
                    {isAssigned && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{creator.email}</p>
                    <p className="text-xs text-gray-500">Code: {creator.discount_code}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    creator.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {creator.status}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>{assignedCreators.length}</strong> creatrice(s) selectionnee(s)
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving}>
            <Users className="w-4 h-4 mr-2" />
            {saving ? 'Enregistrement...' : 'Assigner'}
          </Button>
        </div>
      </div>
    </div>
  )
}
