'use client'

/**
 * RoutinesPage - Admin routine management
 * CRUD routines, view stats, manage Shopify variant IDs
 */
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Layout } from '../components/Layout'
import { Button, Spinner, EmptyState, ConfirmDialog, Modal, useToast } from '../components/Common'
import { RoutineCard, RoutineForm } from '../components/Routines'
import { Plus, RefreshCw, Sparkles, Check, AlertTriangle } from 'lucide-react'

export default function RoutinesPage() {
  const toast = useToast()
  const [routines, setRoutines] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingRoutine, setEditingRoutine] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, routine: null })
  const [creatorsModal, setCreatorsModal] = useState({ open: false, routine: null })
  const [allCreators, setAllCreators] = useState([])
  const [assignedCreatorIds, setAssignedCreatorIds] = useState([])
  const [allAssignments, setAllAssignments] = useState([]) // all creator_routines for warning
  const [creatorsLoading, setCreatorsLoading] = useState(false)

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

  // === Creator assignment ===
  const handleManageCreators = async (routine) => {
    setCreatorsModal({ open: true, routine })
    setCreatorsLoading(true)

    try {
      // Fetch all creators
      const { data: creators } = await supabase
        .from('creators')
        .select('id, name, email, slug')
        .order('name')

      // Fetch all creator_routines (to know who is assigned where)
      const { data: assignments } = await supabase
        .from('creator_routines')
        .select('creator_id, routine_id')

      setAllCreators(creators || [])
      setAllAssignments(assignments || [])
      setAssignedCreatorIds(
        (assignments || [])
          .filter(a => a.routine_id === routine.id)
          .map(a => a.creator_id)
      )
    } catch (error) {
      toast.error('Erreur chargement createurs')
      console.error(error)
    } finally {
      setCreatorsLoading(false)
    }
  }

  const handleToggleCreator = async (creatorId) => {
    const routine = creatorsModal.routine
    const isAssigned = assignedCreatorIds.includes(creatorId)

    try {
      if (isAssigned) {
        // Unassign
        const { error } = await supabase
          .from('creator_routines')
          .delete()
          .eq('creator_id', creatorId)
          .eq('routine_id', routine.id)

        if (error) throw error
        setAssignedCreatorIds(prev => prev.filter(id => id !== creatorId))
        setAllAssignments(prev => prev.filter(a => !(a.creator_id === creatorId && a.routine_id === routine.id)))
        toast.success('Createur retire')
      } else {
        // Assign (upsert handles UNIQUE constraint on creator_id)
        const { error } = await supabase
          .from('creator_routines')
          .upsert({
            creator_id: creatorId,
            routine_id: routine.id,
            is_active: true,
          }, { onConflict: 'creator_id' })

        if (error) throw error
        setAssignedCreatorIds(prev => [...prev, creatorId])
        // Update allAssignments: remove old assignment for this creator, add new one
        setAllAssignments(prev => [
          ...prev.filter(a => a.creator_id !== creatorId),
          { creator_id: creatorId, routine_id: routine.id }
        ])
        toast.success('Createur assigne')
      }
      fetchRoutines() // refresh counts
    } catch (error) {
      toast.error('Erreur: ' + error.message)
    }
  }

  const getCreatorOtherRoutine = (creatorId) => {
    const routine = creatorsModal.routine
    const otherAssignment = allAssignments.find(
      a => a.creator_id === creatorId && a.routine_id !== routine?.id
    )
    if (!otherAssignment) return null
    const otherRoutine = routines.find(r => r.id === otherAssignment.routine_id)
    return otherRoutine?.title || 'Autre routine'
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
                onManageCreators={handleManageCreators}
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

      {/* Creator Assignment Modal */}
      <Modal
        isOpen={creatorsModal.open}
        onClose={() => setCreatorsModal({ open: false, routine: null })}
        title={`Créateurs — ${creatorsModal.routine?.title || ''}`}
        size="md"
      >
        {creatorsLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="md" />
          </div>
        ) : allCreators.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Aucun créateur disponible</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {allCreators.map((creator) => {
              const isAssigned = assignedCreatorIds.includes(creator.id)
              const otherRoutine = getCreatorOtherRoutine(creator.id)

              return (
                <div
                  key={creator.id}
                  onClick={() => handleToggleCreator(creator.id)}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition ${
                    isAssigned
                      ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                      : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {creator.name || creator.email}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {creator.slug ? `@${creator.slug}` : creator.email}
                    </p>
                    {otherRoutine && !isAssigned && (
                      <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                        <AlertTriangle className="w-3 h-3" />
                        Actuellement sur: {otherRoutine}
                      </p>
                    )}
                  </div>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isAssigned
                      ? 'bg-primary-500 text-white'
                      : 'border-2 border-gray-300 dark:border-gray-600'
                  }`}>
                    {isAssigned && <Check className="w-3 h-3" />}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            {assignedCreatorIds.length} créateur{assignedCreatorIds.length !== 1 ? 's' : ''} assigné{assignedCreatorIds.length !== 1 ? 's' : ''}
          </p>
          <Button variant="secondary" onClick={() => setCreatorsModal({ open: false, routine: null })}>
            Fermer
          </Button>
        </div>
      </Modal>
    </Layout>
  )
}
