'use client'

/**
 * RoutinesPage - Admin routine management
 * CRUD routines, view stats, manage Shopify variant IDs
 */
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Layout } from '../components/Layout'
import { Button, Spinner, EmptyState, ConfirmDialog, useToast } from '../components/Common'
import { RoutineCard, RoutineForm } from '../components/Routines'
import { Plus, RefreshCw, Sparkles } from 'lucide-react'

export default function RoutinesPage() {
  const toast = useToast()
  const [routines, setRoutines] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingRoutine, setEditingRoutine] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, routine: null })

  useEffect(() => {
    fetchRoutines()
  }, [])

  const fetchRoutines = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('routines')
      .select('*, creator_routines(count)')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Erreur lors du chargement des routines')
      console.error(error)
    }
    setRoutines(data || [])
    setLoading(false)
  }

  const handleCreate = () => {
    setEditingRoutine(null)
    setShowFormModal(true)
  }

  const handleEdit = (routine) => {
    setEditingRoutine(routine)
    setShowFormModal(true)
  }

  const handleFormSubmit = async (payload) => {
    setFormLoading(true)
    try {
      if (editingRoutine) {
        // Update
        const { error } = await supabase
          .from('routines')
          .update(payload)
          .eq('id', editingRoutine.id)

        if (error) throw error
        toast.success('Routine mise a jour')
      } else {
        // Create
        const { error } = await supabase
          .from('routines')
          .insert(payload)

        if (error) throw error
        toast.success('Routine creee avec succes')
      }

      setShowFormModal(false)
      setEditingRoutine(null)
      fetchRoutines()
    } catch (error) {
      toast.error('Erreur: ' + error.message)
      throw error
    } finally {
      setFormLoading(false)
    }
  }

  const handleToggleActive = async (routine) => {
    const { error } = await supabase
      .from('routines')
      .update({ is_active: !routine.is_active })
      .eq('id', routine.id)

    if (error) {
      toast.error('Erreur: ' + error.message)
    } else {
      toast.success(routine.is_active ? 'Routine desactivee' : 'Routine activee')
      fetchRoutines()
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm.routine) return

    const { error } = await supabase
      .from('routines')
      .delete()
      .eq('id', deleteConfirm.routine.id)

    if (error) {
      toast.error('Erreur: ' + error.message)
    } else {
      toast.success('Routine supprimee')
      fetchRoutines()
    }
    setDeleteConfirm({ open: false, routine: null })
  }

  if (loading) {
    return (
      <Layout title="Routines" subtitle="Gerez les routines produits et leurs assignations">
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Routines" subtitle="Gerez les routines produits et leurs assignations">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {routines.length} routine{routines.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={fetchRoutines}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Actualiser
            </Button>
            <Button variant="primary" onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-1" />
              Nouvelle routine
            </Button>
          </div>
        </div>

        {/* Grid */}
        {routines.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Aucune routine"
            description="Creez votre premiere routine pour commencer a vendre des packs produits via vos createurs."
            action={handleCreate}
            actionLabel="Creer une routine"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {routines.map((routine) => (
              <RoutineCard
                key={routine.id}
                routine={routine}
                onEdit={handleEdit}
                onDelete={(r) => setDeleteConfirm({ open: true, routine: r })}
                onToggleActive={handleToggleActive}
              />
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      <RoutineForm
        isOpen={showFormModal}
        onClose={() => { setShowFormModal(false); setEditingRoutine(null) }}
        routine={editingRoutine}
        onSubmit={handleFormSubmit}
        loading={formLoading}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, routine: null })}
        onConfirm={handleDelete}
        title="Supprimer la routine"
        message={`Etes-vous sur de vouloir supprimer la routine "${deleteConfirm.routine?.title}" ? Cette action est irreversible et retirera aussi les assignations aux createurs.`}
        confirmText="Supprimer"
        variant="danger"
      />
    </Layout>
  )
}
