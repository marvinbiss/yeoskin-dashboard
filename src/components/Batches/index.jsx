import { useState } from 'react'
import { 
  Eye, 
  Play, 
  CheckCircle, 
  Calendar,
  Users,
  DollarSign,
  AlertTriangle
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import clsx from 'clsx'
import { Card, Button, StatusBadge, Modal, ConfirmDialog, Spinner, EmptyState, useToast } from '../Common'
import { executeBatch } from '../../lib/api'

// ============================================================================
// BATCHES TABLE - FRANÇAIS
// ============================================================================

export const BatchesTable = ({ batches, loading, onApprove, onRefresh }) => {
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [actionModal, setActionModal] = useState({ open: false, type: null, batch: null })
  const [actionLoading, setActionLoading] = useState(false)
  const toast = useToast()

  const handleApprove = async () => {
    setActionLoading(true)
    try {
      await onApprove(actionModal.batch.id)
      toast.success(`Lot #${actionModal.batch.id.slice(0, 8)} approuvé !`)
      setActionModal({ open: false, type: null, batch: null })
      onRefresh()
    } catch (error) {
      toast.error(`Échec de l'approbation : ${error.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleExecute = async () => {
    setActionLoading(true)
    try {
      const result = await executeBatch(actionModal.batch.id)
      if (result.ok) {
        toast.success(`Lot exécuté ! ${result.sent_count || 0} transferts envoyés.`)
      } else {
        toast.error(`Échec de l'exécution : ${result.error}`)
      }
      setActionModal({ open: false, type: null, batch: null })
      onRefresh()
    } catch (error) {
      toast.error(`Échec de l'exécution : ${error.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <Card.Header>
          <h3 className="font-semibold text-gray-900 dark:text-white">Lots de paiement</h3>
        </Card.Header>
        <Card.Body>
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        </Card.Body>
      </Card>
    )
  }

  if (batches.length === 0) {
    return (
      <Card>
        <Card.Header>
          <h3 className="font-semibold text-gray-900 dark:text-white">Lots de paiement</h3>
        </Card.Header>
        <Card.Body>
          <EmptyState
            icon={DollarSign}
            title="Aucun lot pour le moment"
            description="Les lots apparaîtront ici lorsque des commissions seront prêtes à être payées."
          />
        </Card.Body>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Lots de paiement</h3>
            <Button variant="secondary" size="sm" onClick={onRefresh}>
              Actualiser
            </Button>
          </div>
        </Card.Header>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>ID du lot</th>
                <th>Période</th>
                <th>Statut</th>
                <th>Créateurs</th>
                <th>Montant</th>
                <th>Créé le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => (
                <tr key={batch.id}>
                  <td>
                    <span className="font-mono text-sm">
                      #{batch.id.slice(0, 8)}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        {batch.period_start && batch.period_end
                          ? `${format(new Date(batch.period_start), 'd MMM', { locale: fr })} - ${format(new Date(batch.period_end), 'd MMM', { locale: fr })}`
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={batch.status} />
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{batch.itemCount || batch.total_creators || 0}</span>
                    </div>
                  </td>
                  <td>
                    <span className="font-medium">
                      {(batch.totalAmount || batch.total_amount || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                    </span>
                  </td>
                  <td>
                    <span className="text-sm text-gray-500">
                      {format(new Date(batch.created_at), 'd MMM, HH:mm', { locale: fr })}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      {batch.status === 'draft' && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => setActionModal({ open: true, type: 'approve', batch })}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approuver
                        </Button>
                      )}
                      {batch.status === 'approved' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setActionModal({ open: true, type: 'execute', batch })}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Exécuter
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedBatch(batch)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Voir
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Confirmation d'approbation */}
      <ConfirmDialog
        isOpen={actionModal.open && actionModal.type === 'approve'}
        onClose={() => setActionModal({ open: false, type: null, batch: null })}
        onConfirm={handleApprove}
        title="Approuver le lot"
        message={`Êtes-vous sûr de vouloir approuver le lot #${actionModal.batch?.id.slice(0, 8)} ? Cela le marquera comme prêt à être exécuté.`}
        confirmLabel="Approuver"
        variant="success"
        loading={actionLoading}
      />

      {/* Confirmation d'exécution */}
      <ConfirmDialog
        isOpen={actionModal.open && actionModal.type === 'execute'}
        onClose={() => setActionModal({ open: false, type: null, batch: null })}
        onConfirm={handleExecute}
        title="Exécuter le lot"
        message={
          <div>
            <p className="mb-4">
              Êtes-vous sûr de vouloir exécuter le lot #{actionModal.batch?.id.slice(0, 8)} ?
            </p>
            <div className="p-4 bg-warning-50 dark:bg-warning-500/20 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-warning-600">Cela va initier de vrais paiements !</p>
                <p className="text-sm text-warning-600/80 mt-1">
                  {actionModal.batch?.itemCount || 0} créateurs recevront un total de {(actionModal.batch?.totalAmount || 0).toFixed(2)} €.
                </p>
              </div>
            </div>
          </div>
        }
        confirmLabel="Exécuter les paiements"
        variant="primary"
        loading={actionLoading}
      />

      {/* Modal de détails du lot */}
      <BatchDetailModal
        batch={selectedBatch}
        onClose={() => setSelectedBatch(null)}
      />
    </>
  )
}

// ============================================================================
// BATCH DETAIL MODAL - FRANÇAIS
// ============================================================================

const BatchDetailModal = ({ batch, onClose }) => {
  if (!batch) return null

  return (
    <Modal
      isOpen={!!batch}
      onClose={onClose}
      title={`Lot #${batch.id.slice(0, 8)}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Résumé */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
            <p className="text-sm text-gray-500">Statut</p>
            <div className="mt-1">
              <StatusBadge status={batch.status} />
            </div>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
            <p className="text-sm text-gray-500">Créateurs</p>
            <p className="text-xl font-semibold mt-1">{batch.itemCount || 0}</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
            <p className="text-sm text-gray-500">Montant total</p>
            <p className="text-xl font-semibold mt-1">
              {(batch.totalAmount || 0).toFixed(2)} €
            </p>
          </div>
        </div>

        {/* Période */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Période</h4>
          <p className="text-gray-600 dark:text-gray-400">
            {batch.period_start && batch.period_end
              ? `${format(new Date(batch.period_start), 'd MMMM yyyy', { locale: fr })} - ${format(new Date(batch.period_end), 'd MMMM yyyy', { locale: fr })}`
              : 'Non spécifiée'
            }
          </p>
        </div>

        {/* Aperçu des éléments */}
        {batch.payout_items && batch.payout_items.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Éléments de paiement ({batch.payout_items.length})
            </h4>
            <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Créateur</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Montant</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {batch.payout_items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 text-sm">{item.creator_id.slice(0, 8)}...</td>
                      <td className="px-4 py-2 text-sm font-medium">{Number(item.amount).toFixed(2)} €</td>
                      <td className="px-4 py-2">
                        <StatusBadge status={item.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Horodatages */}
        <div className="text-sm text-gray-500 space-y-1 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p>Créé le : {format(new Date(batch.created_at), 'd MMMM yyyy à HH:mm', { locale: fr })}</p>
          {batch.approved_at && (
            <p>Approuvé le : {format(new Date(batch.approved_at), 'd MMMM yyyy à HH:mm', { locale: fr })}</p>
          )}
          {batch.sent_at && (
            <p>Envoyé le : {format(new Date(batch.sent_at), 'd MMMM yyyy à HH:mm', { locale: fr })}</p>
          )}
        </div>
      </div>
    </Modal>
  )
}

// ============================================================================
// BATCH STATS HEADER - FRANÇAIS
// ============================================================================

export const BatchStatsHeader = ({ batches }) => {
  const stats = {
    total: batches.length,
    draft: batches.filter(b => b.status === 'draft').length,
    approved: batches.filter(b => b.status === 'approved').length,
    sent: batches.filter(b => b.status === 'sent').length,
    totalAmount: batches.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
        <p className="text-xs text-gray-500 uppercase">Total</p>
        <p className="text-2xl font-bold">{stats.total}</p>
      </div>
      <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
        <p className="text-xs text-gray-500 uppercase">Brouillon</p>
        <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
      </div>
      <div className="p-4 rounded-lg bg-primary-50 dark:bg-primary-900/20">
        <p className="text-xs text-primary-600 uppercase">Approuvé</p>
        <p className="text-2xl font-bold text-primary-600">{stats.approved}</p>
      </div>
      <div className="p-4 rounded-lg bg-success-50 dark:bg-success-500/20">
        <p className="text-xs text-success-600 uppercase">Envoyé</p>
        <p className="text-2xl font-bold text-success-600">{stats.sent}</p>
      </div>
      <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
        <p className="text-xs text-gray-500 uppercase">Valeur totale</p>
        <p className="text-2xl font-bold">{stats.totalAmount.toFixed(0)} €</p>
      </div>
    </div>
  )
}
