'use client'

/**
 * CategoriesPage - Admin category management
 * MODULE 4: Admin - Categories CRUD
 */
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Layout } from '../components/Layout'
import { useToast, Card, Spinner, EmptyState, ConfirmDialog } from '../components/Common'
import {
  Plus, Edit2, Trash2, GripVertical, ChevronRight, ChevronDown,
  FolderTree, Image, Check, X, RefreshCw, Save
} from 'lucide-react'

export default function CategoriesPage() {
  const toast = useToast()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null })
  const [expandedIds, setExpandedIds] = useState([])

  const [newCategory, setNewCategory] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    parent_id: null,
    is_active: true
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .order('sort_order')
      .order('name')

    if (error) {
      toast.error('Erreur lors du chargement des categories')
    } else {
      setCategories(data || [])
    }
    setLoading(false)
  }

  // Build tree structure
  const buildTree = (items, parentId = null) => {
    return items
      .filter(item => item.parent_id === parentId)
      .map(item => ({
        ...item,
        children: buildTree(items, item.id)
      }))
  }

  const categoryTree = buildTree(categories)

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleNameChange = (value, isNew = true) => {
    if (isNew) {
      setNewCategory(prev => ({
        ...prev,
        name: value,
        slug: generateSlug(value)
      }))
    } else {
      setEditForm(prev => ({
        ...prev,
        name: value,
        slug: generateSlug(value)
      }))
    }
  }

  const handleCreate = async () => {
    if (!newCategory.name.trim()) {
      toast.error('Le nom est requis')
      return
    }

    setSaving(true)
    const maxOrder = Math.max(0, ...categories.map(c => c.sort_order || 0))

    const { error } = await supabase
      .from('product_categories')
      .insert({
        ...newCategory,
        sort_order: maxOrder + 1
      })

    if (error) {
      toast.error('Erreur: ' + error.message)
    } else {
      toast.success('Categorie creee')
      setNewCategory({
        name: '',
        slug: '',
        description: '',
        image_url: '',
        parent_id: null,
        is_active: true
      })
      setShowForm(false)
      fetchCategories()
    }
    setSaving(false)
  }

  const handleEdit = (category) => {
    setEditingId(category.id)
    setEditForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image_url: category.image_url || '',
      parent_id: category.parent_id,
      is_active: category.is_active
    })
  }

  const handleUpdate = async () => {
    if (!editForm.name.trim()) {
      toast.error('Le nom est requis')
      return
    }

    setSaving(true)
    const { error } = await supabase
      .from('product_categories')
      .update(editForm)
      .eq('id', editingId)

    if (error) {
      toast.error('Erreur: ' + error.message)
    } else {
      toast.success('Categorie mise a jour')
      setEditingId(null)
      fetchCategories()
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    const { error } = await supabase
      .from('product_categories')
      .delete()
      .eq('id', deleteConfirm.id)

    if (error) {
      toast.error('Erreur: ' + error.message)
    } else {
      toast.success('Categorie supprimee')
      fetchCategories()
    }
    setDeleteConfirm({ open: false, id: null })
  }

  const handleToggleActive = async (category) => {
    const { error } = await supabase
      .from('product_categories')
      .update({ is_active: !category.is_active })
      .eq('id', category.id)

    if (error) {
      toast.error('Erreur: ' + error.message)
    } else {
      fetchCategories()
    }
  }

  const toggleExpand = (id) => {
    setExpandedIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    )
  }

  // Render category row with children
  const renderCategory = (category, level = 0) => {
    const hasChildren = category.children && category.children.length > 0
    const isExpanded = expandedIds.includes(category.id)
    const isEditing = editingId === category.id

    return (
      <div key={category.id}>
        <div
          className={`
            flex items-center gap-3 p-3 border-b border-gray-100 hover:bg-gray-50 transition
            ${level > 0 ? 'bg-gray-50/50' : ''}
          `}
          style={{ paddingLeft: `${level * 24 + 12}px` }}
        >
          {/* Expand/Collapse */}
          <button
            onClick={() => toggleExpand(category.id)}
            className={`p-1 rounded hover:bg-gray-200 ${!hasChildren ? 'invisible' : ''}`}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {/* Image */}
          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {category.image_url ? (
              <img src={category.image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <FolderTree className="w-5 h-5 text-gray-400" />
            )}
          </div>

          {/* Content */}
          {isEditing ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => handleNameChange(e.target.value, false)}
                className="input py-1 px-2 text-sm flex-1"
                autoFocus
              />
              <input
                type="text"
                value={editForm.slug}
                onChange={(e) => setEditForm(prev => ({ ...prev, slug: e.target.value }))}
                className="input py-1 px-2 text-sm w-32 text-gray-500"
                placeholder="slug"
              />
              <button
                onClick={handleUpdate}
                disabled={saving}
                className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="p-1.5 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{category.name}</span>
                  <span className="text-xs text-gray-400">/{category.slug}</span>
                </div>
                {category.description && (
                  <p className="text-sm text-gray-500 line-clamp-1">{category.description}</p>
                )}
              </div>

              {/* Status */}
              <button
                onClick={() => handleToggleActive(category)}
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  category.is_active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {category.is_active ? 'Actif' : 'Inactif'}
              </button>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEdit(category)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteConfirm({ open: true, id: category.id })}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {category.children.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <Layout title="Categories" subtitle="Gerez les categories de produits">
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Categories" subtitle="Gerez les categories de produits">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {categories.length} categories au total
          </p>
          <div className="flex gap-3">
            <button
              onClick={fetchCategories}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouvelle categorie
            </button>
          </div>
        </div>

        {/* New Category Form */}
        {showForm && (
          <Card>
            <Card.Header>
              <h3 className="font-semibold text-gray-900">Nouvelle categorie</h3>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="input"
                    placeholder="Ex: Nettoyants"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={newCategory.slug}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, slug: e.target.value }))}
                    className="input"
                    placeholder="nettoyants"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newCategory.description}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                    className="input"
                    rows={2}
                    placeholder="Description de la categorie..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categorie parente
                  </label>
                  <select
                    value={newCategory.parent_id || ''}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, parent_id: e.target.value || null }))}
                    className="input"
                  >
                    <option value="">Aucune (racine)</option>
                    {categories.filter(c => !c.parent_id).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL Image
                  </label>
                  <input
                    type="text"
                    value={newCategory.image_url}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, image_url: e.target.value }))}
                    className="input"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Creation...' : 'Creer'}
                </button>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Categories List */}
        <Card>
          <Card.Header>
            <h3 className="font-semibold text-gray-900">
              Arborescence des categories
            </h3>
          </Card.Header>
          {categories.length === 0 ? (
            <Card.Body>
              <EmptyState
                icon={FolderTree}
                title="Aucune categorie"
                description="Creez votre premiere categorie pour commencer"
              />
            </Card.Body>
          ) : (
            <div className="divide-y divide-gray-100">
              {categoryTree.map(category => renderCategory(category))}
            </div>
          )}
        </Card>

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={deleteConfirm.open}
          onClose={() => setDeleteConfirm({ open: false, id: null })}
          onConfirm={handleDelete}
          title="Supprimer la categorie"
          message="Etes-vous sur de vouloir supprimer cette categorie ? Les produits associes ne seront pas supprimes mais perdront cette categorisation."
          confirmText="Supprimer"
          variant="danger"
        />
      </div>
    </Layout>
  )
}
