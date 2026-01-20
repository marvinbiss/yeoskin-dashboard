'use client'

import { useState, useEffect } from 'react'
import { useNavigate, Link } from '@/lib/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { UserPlus, FileText, Settings, Database, Bell, Shield, Key, Download, RefreshCw, AlertTriangle, Package } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { exportCreators, exportCommissions, exportBatches, exportAdmins, exportAuditLogs } from '../lib/exportUtils'
import { useAuditLog, AUDIT_ACTIONS, RESOURCE_TYPES } from '../hooks/useAuditLog'
import { Layout } from '../components/Layout'
import {
  KPICards,
  PayoutChart,
  StatusDistribution,
  RecentActivity,
  QuickActions,
  SystemHealthCard
} from '../components/Dashboard'
import { BatchesTable } from '../components/Batches'
import { CreatorsTable, CreatorsStatsHeader, CreatorForm, CreatorDetailModal } from '../components/Creators'
import {
  AdminsTable,
  AdminsStatsHeader,
  AdminForm,
  AdminDetailModal,
} from '../components/Admins'
import {
  useDashboardStats,
  useBatches,
  useRecentTransfers,
  useCommissions
} from '../hooks/useSupabase'
import { useAdmins } from '../hooks/useAdmins'
import { useCreators as useCreatorsHook } from '../hooks/useCreators'
import { triggerDailyBatch, getConfig } from '../lib/api'
import {
  useToast,
  ConfirmDialog,
  Card,
  StatusBadge,
  Spinner,
  EmptyState,
  Button,
  AdvancedFilters,
  CREATOR_FILTERS,
  ADMIN_FILTERS,
  BATCH_FILTERS,
  COMMISSION_FILTERS,
  BulkActions,
  CREATOR_BULK_ACTIONS,
  ADMIN_BULK_ACTIONS,
  BATCH_BULK_ACTIONS,
} from '../components/Common'

// Re-export LoginPage
export { LoginPage } from './LoginPage'

// Re-export AdminPayoutsPage and AnalyticsPage
export { AdminPayoutsPage } from './AdminPayoutsPage'
export { AnalyticsPage } from './AnalyticsPage'

// ============================================================================
// DASHBOARD PAGE (Home)
// ============================================================================

// Low Stock Alert Component
const LowStockAlert = () => {
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLowStock()
  }, [])

  const fetchLowStock = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, sku, stock_quantity, low_stock_threshold, image_url')
      .eq('is_active', true)
      .or('stock_quantity.eq.0,stock_quantity.lt.low_stock_threshold')
      .order('stock_quantity')
      .limit(5)

    setLowStockProducts(data || [])
    setLoading(false)
  }

  if (loading) return null
  if (lowStockProducts.length === 0) return null

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <Card.Header>
        <div className="flex items-center gap-2 text-orange-700">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="font-semibold">Alertes Stock</h3>
          <span className="ml-auto text-sm bg-orange-200 px-2 py-0.5 rounded-full">
            {lowStockProducts.length}
          </span>
        </div>
      </Card.Header>
      <Card.Body>
        <div className="space-y-2">
          {lowStockProducts.map(product => (
            <div key={product.id} className="flex items-center gap-3 p-2 bg-white rounded-lg">
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
                <p className="text-xs text-gray-500">{product.sku}</p>
              </div>
              <div className={`text-sm font-bold px-2 py-1 rounded ${
                product.stock_quantity === 0
                  ? 'bg-red-100 text-red-700'
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {product.stock_quantity === 0 ? 'Rupture' : `${product.stock_quantity} unites`}
              </div>
            </div>
          ))}
        </div>
        <Link
          to="/products?stock=low"
          className="block mt-3 text-center text-sm text-orange-600 hover:text-orange-700 font-medium"
        >
          Voir tous les produits en alerte →
        </Link>
      </Card.Body>
    </Card>
  )
}

export const DashboardPage = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { stats, loading: statsLoading } = useDashboardStats()
  const { batches, loading: batchesLoading, refresh: refreshBatches, approveBatch } = useBatches({ limit: 5 })
  const { transfers, loading: transfersLoading } = useRecentTransfers(5)

  const handleTriggerDaily = async () => {
    try {
      const result = await triggerDailyBatch()
      if (result.ok) {
        toast.success(`Daily batch created! ${result.eligible_creators || 0} creators eligible.`)
        refreshBatches()
      } else {
        toast.warning(result.message || 'No eligible creators for payout')
      }
    } catch (error) {
      toast.error(`Failed to trigger daily batch: ${error.message}`)
    }
  }

  return (
    <Layout title="Tableau de bord" subtitle="Bienvenue ! Voici l'aperçu de vos paiements.">
      <div className="space-y-6">
        {/* KPI Cards */}
        <KPICards stats={stats} loading={statsLoading} />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PayoutChart />
          </div>
          <StatusDistribution />
        </div>

        {/* Quick Actions, System Health, Low Stock & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <QuickActions
              onTriggerDaily={handleTriggerDaily}
              onViewBatches={() => navigate('/payouts')}
            />
            <LowStockAlert />
            <SystemHealthCard />
          </div>
          <div className="lg:col-span-2">
            <RecentActivity transfers={transfers} loading={transfersLoading} />
          </div>
        </div>

        {/* Recent Batches */}
        <BatchesTable
          batches={batches}
          loading={batchesLoading}
          onApprove={approveBatch}
          onRefresh={refreshBatches}
        />
      </div>
    </Layout>
  )
}

// ============================================================================
// PAYOUTS PAGE
// ============================================================================

export const PayoutsPage = () => {
  const toast = useToast()
  const { batches, loading, refresh, approveBatch } = useBatches({ limit: 50 })

  const handleTriggerDaily = async () => {
    try {
      const result = await triggerDailyBatch()
      if (result.ok) {
        toast.success(`Daily batch created!`)
        refresh()
      } else {
        toast.warning(result.message || 'No eligible creators')
      }
    } catch (error) {
      toast.error(`Failed: ${error.message}`)
    }
  }

  return (
    <Layout title="Paiements" subtitle="Gérez les lots de paiements et les transferts">
      <div className="space-y-6">
        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={handleTriggerDaily}
            className="btn-primary"
          >
            + Créer lot quotidien
          </button>
        </div>

        {/* Batches Table */}
        <BatchesTable
          batches={batches}
          loading={loading}
          onApprove={approveBatch}
          onRefresh={refresh}
        />
      </div>
    </Layout>
  )
}

// ============================================================================
// CREATORS PAGE (CRUD complet avec filtres avancés et opérations bulk)
// ============================================================================

export const CreatorsPage = () => {
  // Hook CRUD pour les créateurs
  const {
    creators,
    loading,
    actionLoading,
    createCreator,
    updateCreator,
    deleteCreator,
    toggleCreatorStatus,
    verifyBankAccount,
    refresh,
    getStats,
  } = useCreatorsHook({ limit: 100, status: null })

  const { logExport, logCreate, logUpdate, logDelete } = useAuditLog()
  const toast = useToast()

  // États locaux
  const [exporting, setExporting] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [filterValues, setFilterValues] = useState({})

  // États des modales
  const [formModal, setFormModal] = useState({ open: false, creator: null })
  const [detailModal, setDetailModal] = useState({ open: false, creator: null })
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, creatorId: null, isHard: false })

  // Filtrage des créateurs
  const filteredCreators = creators.filter(creator => {
    if (filterValues.status && creator.status !== filterValues.status) return false
    if (filterValues.has_bank_account === 'true' && !creator.hasBankAccount) return false
    if (filterValues.has_bank_account === 'false' && creator.hasBankAccount) return false
    if (filterValues.email && !creator.email?.toLowerCase().includes(filterValues.email.toLowerCase())) return false
    if (filterValues.earnings_min && (creator.totalEarned || 0) < Number(filterValues.earnings_min)) return false
    if (filterValues.earnings_max && (creator.totalEarned || 0) > Number(filterValues.earnings_max)) return false
    return true
  })

  // ===== HANDLERS CRUD =====

  // Ouvrir modal création
  const handleCreate = () => {
    setFormModal({ open: true, creator: null })
  }

  // Voir détails
  const handleView = (creator) => {
    setDetailModal({ open: true, creator })
  }

  // Ouvrir modal édition
  const handleEdit = (creator) => {
    setDetailModal({ open: false, creator: null })
    setFormModal({ open: true, creator })
  }

  // Clic sur supprimer
  const handleDeleteClick = (creatorId) => {
    const creator = creators.find(c => c.id === creatorId)
    setDetailModal({ open: false, creator: null })
    setDeleteConfirm({
      open: true,
      creatorId,
      isHard: creator?.status === 'inactive'
    })
  }

  // Soumettre le formulaire (création ou modification)
  const handleFormSubmit = async (formData) => {
    try {
      if (formModal.creator) {
        // Modification
        await updateCreator(formModal.creator.id, formData)
        await logUpdate(RESOURCE_TYPES.CREATOR, formModal.creator.id, { email: formData.email })
        toast.success('Créateur modifié avec succès')
      } else {
        // Création
        const newCreator = await createCreator(formData)
        await logCreate(RESOURCE_TYPES.CREATOR, newCreator.id, { email: formData.email })
        toast.success('Créateur créé avec succès')
      }
      setFormModal({ open: false, creator: null })
    } catch (error) {
      toast.error(error.message || 'Une erreur est survenue')
      throw error
    }
  }

  // Confirmer la suppression
  const handleDeleteConfirm = async () => {
    try {
      await deleteCreator(deleteConfirm.creatorId)
      await logDelete(RESOURCE_TYPES.CREATOR, deleteConfirm.creatorId)
      toast.success(deleteConfirm.isHard ? 'Créateur supprimé définitivement' : 'Créateur désactivé avec succès')
      setDeleteConfirm({ open: false, creatorId: null, isHard: false })
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la suppression')
    }
  }

  // Changer le statut actif/inactif
  const handleToggleStatus = async (creatorId) => {
    try {
      const result = await toggleCreatorStatus(creatorId)
      toast.success(result.newStatus === 'active' ? 'Créateur activé' : 'Créateur désactivé')
      setDetailModal({ open: false, creator: null })
    } catch (error) {
      toast.error(error.message || 'Erreur lors du changement de statut')
    }
  }

  // Vérifier le compte bancaire
  const handleVerifyBank = async (creatorId, verified) => {
    try {
      await verifyBankAccount(creatorId, verified)
      toast.success(verified ? 'Compte bancaire vérifié' : 'Vérification retirée')
      // Refresh le créateur dans le modal
      const updatedCreator = creators.find(c => c.id === creatorId)
      if (updatedCreator) {
        setDetailModal({ open: true, creator: { ...updatedCreator, bankVerified: verified } })
      }
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la vérification')
    }
  }

  // ===== HANDLERS EXPORT & BULK =====

  const handleExport = async () => {
    const dataToExport = selectedIds.length > 0
      ? creators.filter(c => selectedIds.includes(c.id))
      : filteredCreators

    if (dataToExport.length === 0) {
      toast.warning('Aucun créateur à exporter')
      return
    }

    setExporting(true)
    try {
      exportCreators(dataToExport)
      await logExport(RESOURCE_TYPES.CREATOR, { count: dataToExport.length })
      toast.success(`${dataToExport.length} créateurs exportés avec succès`)
    } catch (error) {
      toast.error(`Erreur d'export: ${error.message}`)
    } finally {
      setExporting(false)
    }
  }

  // Handlers pour les opérations bulk
  const bulkHandlers = {
    activate: async (ids) => {
      let successCount = 0
      for (const id of ids) {
        try {
          const creator = creators.find(c => c.id === id)
          if (creator?.status === 'inactive') {
            await toggleCreatorStatus(id)
            successCount++
          }
        } catch (err) {
          console.error('Bulk activate error:', err)
        }
      }
      toast.success(`${successCount} créateurs activés`)
      setSelectedIds([])
    },
    deactivate: async (ids) => {
      let successCount = 0
      for (const id of ids) {
        try {
          const creator = creators.find(c => c.id === id)
          if (creator?.status === 'active') {
            await toggleCreatorStatus(id)
            successCount++
          }
        } catch (err) {
          console.error('Bulk deactivate error:', err)
        }
      }
      toast.success(`${successCount} créateurs désactivés`)
      setSelectedIds([])
    },
    export: async (ids) => {
      const dataToExport = creators.filter(c => ids.includes(c.id))
      exportCreators(dataToExport, `createurs_selection_${ids.length}`)
      await logExport(RESOURCE_TYPES.CREATOR, { count: ids.length, type: 'bulk' })
      toast.success(`${ids.length} créateurs exportés avec succès`)
    },
  }

  return (
    <Layout title="Créateurs" subtitle="Gérez votre réseau de créateurs">
      <div className="space-y-6">
        {/* Stats Header */}
        {!loading && <CreatorsStatsHeader creators={creators} />}

        {/* Filtres avancés */}
        <AdvancedFilters
          filters={CREATOR_FILTERS}
          values={filterValues}
          onChange={setFilterValues}
          onReset={() => setFilterValues({})}
          onApply={() => toast.info('Filtres appliqués')}
        />

        {/* Actions & Bulk Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <BulkActions
            items={filteredCreators}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            actions={CREATOR_BULK_ACTIONS(bulkHandlers)}
          />

          <div className="flex gap-3">
            <button
              onClick={refresh}
              className="btn-secondary flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <button
              onClick={handleExport}
              className="btn-secondary flex items-center gap-2"
              disabled={exporting || loading || filteredCreators.length === 0}
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Export...' : `Exporter ${selectedIds.length > 0 ? `(${selectedIds.length})` : 'CSV'}`}
            </button>
            <button
              onClick={handleCreate}
              className="btn-primary flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Ajouter un créateur
            </button>
          </div>
        </div>

        {/* Creators Table avec sélection et actions */}
        <CreatorsTable
          creators={filteredCreators}
          loading={loading}
          onRefresh={refresh}
          enableSelection={true}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
        />

        {/* Modal Formulaire (Création/Modification) */}
        <CreatorForm
          isOpen={formModal.open}
          onClose={() => setFormModal({ open: false, creator: null })}
          creator={formModal.creator}
          onSubmit={handleFormSubmit}
          loading={actionLoading}
        />

        {/* Modal Détails */}
        <CreatorDetailModal
          isOpen={detailModal.open}
          onClose={() => setDetailModal({ open: false, creator: null })}
          creator={detailModal.creator}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onToggleStatus={handleToggleStatus}
          onVerifyBank={handleVerifyBank}
          loading={actionLoading}
        />

        {/* Confirmation de suppression */}
        <ConfirmDialog
          isOpen={deleteConfirm.open}
          onClose={() => setDeleteConfirm({ open: false, creatorId: null, isHard: false })}
          onConfirm={handleDeleteConfirm}
          title={deleteConfirm.isHard ? 'Supprimer définitivement' : 'Désactiver le créateur'}
          message={
            deleteConfirm.isHard
              ? 'Êtes-vous sûr de vouloir supprimer définitivement ce créateur ? Cette action est irréversible.'
              : 'Êtes-vous sûr de vouloir désactiver ce créateur ? Il ne pourra plus recevoir de commissions mais ses données seront conservées.'
          }
          confirmText={deleteConfirm.isHard ? 'Supprimer' : 'Désactiver'}
          variant="danger"
          loading={actionLoading}
        />
      </div>
    </Layout>
  )
}

// ============================================================================
// COMMISSIONS PAGE
// ============================================================================

export const CommissionsPage = () => {
  const { commissions, loading, refresh } = useCommissions({ limit: 100 })
  const { logExport } = useAuditLog()
  const toast = useToast()
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    if (commissions.length === 0) {
      toast.warning('Aucune commission à exporter')
      return
    }

    setExporting(true)
    try {
      // Transform data for export
      const exportData = commissions.map(c => ({
        ...c,
        creator_email: c.creators?.email,
        order_number: c.orders?.order_number,
      }))
      exportCommissions(exportData)
      await logExport(RESOURCE_TYPES.COMMISSION, { count: commissions.length })
      toast.success(`${commissions.length} commissions exportées avec succès`)
    } catch (error) {
      toast.error(`Erreur d'export: ${error.message}`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <Layout title="Commissions" subtitle="Historique des transactions de commissions">
      <div className="space-y-6">
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Toutes les commissions ({commissions.length})
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={refresh}
                  className="btn-secondary btn-sm flex items-center gap-2"
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </button>
                <button
                  onClick={handleExport}
                  className="btn-primary btn-sm flex items-center gap-2"
                  disabled={exporting || loading || commissions.length === 0}
                >
                  <Download className="w-4 h-4" />
                  {exporting ? 'Export...' : 'Exporter CSV'}
                </button>
              </div>
            </div>
          </Card.Header>

          {loading ? (
            <Card.Body>
              <div className="flex items-center justify-center py-12">
                <Spinner size="lg" />
              </div>
            </Card.Body>
          ) : commissions.length === 0 ? (
            <Card.Body>
              <EmptyState
                icon={FileText}
                title="Aucune commission"
                description="Les commissions apparaîtront ici lorsque des commandes seront traitées."
              />
            </Card.Body>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Commande</th>
                    <th>Créateur</th>
                    <th>Montant</th>
                    <th>Statut</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((commission) => (
                    <tr key={commission.id}>
                      <td>
                        <span className="font-mono text-sm">
                          {commission.orders?.order_number || commission.shopify_order_id || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium">{commission.creators?.email || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{commission.creators?.discount_code}</p>
                        </div>
                      </td>
                      <td>
                        <span className="font-medium">
                          €{Number(commission.commission_amount || 0).toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={commission.status} />
                      </td>
                      <td>
                        <span className="text-sm text-gray-500">
                          {format(new Date(commission.created_at), 'dd MMM, HH:mm', { locale: fr })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  )
}

// ============================================================================
// SETTINGS PAGE
// ============================================================================

export const SettingsPage = () => {
  const apiConfig = getConfig()

  return (
    <Layout title="Paramètres" subtitle="Configurez votre tableau de bord">
      <div className="max-w-3xl space-y-6">
        {/* API Configuration */}
        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Configuration API</h3>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL de base n8n
                </label>
                <input
                  type="text"
                  value={apiConfig.baseUrl}
                  readOnly
                  className="input bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Secret de paiement
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value="••••••••••••••••"
                    readOnly
                    className="input bg-gray-50"
                  />
                  <span className={`badge ${apiConfig.hasSecret ? 'badge-success' : 'badge-danger'}`}>
                    {apiConfig.hasSecret ? 'Configuré' : 'Manquant'}
                  </span>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Database Status */}
        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Base de données</h3>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Connexion Supabase</p>
                <p className="text-sm text-gray-500">Base de données PostgreSQL</p>
              </div>
              <span className="badge badge-success">Connecté</span>
            </div>
          </Card.Body>
        </Card>

        {/* Notifications */}
        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span>Notifications de création de lot</span>
                <input type="checkbox" defaultChecked className="toggle" />
              </label>
              <label className="flex items-center justify-between">
                <span>Alertes d'échec de paiement</span>
                <input type="checkbox" defaultChecked className="toggle" />
              </label>
              <label className="flex items-center justify-between">
                <span>Résumé quotidien par email</span>
                <input type="checkbox" className="toggle" />
              </label>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Layout>
  )
}

// ============================================================================
// HELP PAGE
// ============================================================================

export const HelpPage = () => {
  return (
    <Layout title="Aide" subtitle="Documentation et support">
      <div className="max-w-3xl space-y-6">
        <Card>
          <Card.Body>
            <h3 className="text-lg font-semibold mb-4">Liens rapides</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="https://docs.yeoskin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <h4 className="font-medium">Documentation</h4>
                <p className="text-sm text-gray-500 mt-1">Consulter le guide complet</p>
              </a>
              <a
                href="https://api.yeoskin.com/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <h4 className="font-medium">Reference API</h4>
                <p className="text-sm text-gray-500 mt-1">Points de terminaison webhook</p>
              </a>
              <a
                href="mailto:urgence@yeoskin.com?subject=Incident%20Dashboard"
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <h4 className="font-medium">Reponse aux incidents</h4>
                <p className="text-sm text-gray-500 mt-1">Procedures d'urgence</p>
              </a>
              <a
                href="mailto:support@yeoskin.com?subject=Support%20Dashboard"
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <h4 className="font-medium">Support</h4>
                <p className="text-sm text-gray-500 mt-1">Contacter l'equipe</p>
              </a>
            </div>
          </Card.Body>
        </Card>

        {/* FAQ Section */}
        <Card>
          <Card.Body>
            <h3 className="text-lg font-semibold mb-4">Questions frequentes</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Comment creer un nouveau createur ?</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Allez dans la section "Createurs" et cliquez sur "Ajouter un createur". Remplissez le formulaire avec l'email et le code promo.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Comment verifier un compte bancaire ?</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Dans la fiche d'un createur, cliquez sur "Verifier le compte bancaire" apres avoir confirme l'IBAN.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Comment executer un paiement ?</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Allez dans "Finance" puis "Execution paiements", selectionnez un batch et cliquez sur "Executer".
                </p>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Layout>
  )
}

// ============================================================================
// ADMINS PAGE (avec filtres avancés et opérations bulk)
// ============================================================================

export const AdminsPage = () => {
  const {
    admins,
    loading,
    actionLoading,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    toggleAdminStatus,
    getStats,
    refresh,
  } = useAdmins()

  const { logExport } = useAuditLog()
  const toast = useToast()
  const stats = getStats()
  const [exporting, setExporting] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [filterValues, setFilterValues] = useState({})

  // Filtrage des admins
  const filteredAdmins = admins.filter(admin => {
    if (filterValues.role && admin.role !== filterValues.role) return false
    if (filterValues.is_active === 'true' && !admin.is_active) return false
    if (filterValues.is_active === 'false' && admin.is_active) return false
    if (filterValues.email && !admin.email?.toLowerCase().includes(filterValues.email.toLowerCase())) return false
    if (filterValues.two_factor_enabled === 'true' && !admin.two_factor_enabled) return false
    if (filterValues.two_factor_enabled === 'false' && admin.two_factor_enabled) return false
    return true
  })

  // Handlers pour les opérations bulk
  const bulkHandlers = {
    activate: async (ids) => {
      for (const id of ids) {
        await toggleAdminStatus(id)
      }
      toast.success(`${ids.length} administrateurs activés`)
      setSelectedIds([])
    },
    deactivate: async (ids) => {
      for (const id of ids) {
        await toggleAdminStatus(id)
      }
      toast.success(`${ids.length} administrateurs désactivés`)
      setSelectedIds([])
    },
    export: async (ids) => {
      const dataToExport = admins.filter(a => ids.includes(a.id))
      exportAdmins(dataToExport, `administrateurs_selection_${ids.length}`)
      await logExport(RESOURCE_TYPES.ADMIN, { count: ids.length, type: 'bulk' })
      toast.success(`${ids.length} administrateurs exportés`)
    },
  }

  const handleExport = async () => {
    const dataToExport = selectedIds.length > 0
      ? admins.filter(a => selectedIds.includes(a.id))
      : filteredAdmins

    if (dataToExport.length === 0) {
      toast.warning('Aucun administrateur à exporter')
      return
    }

    setExporting(true)
    try {
      exportAdmins(dataToExport)
      await logExport(RESOURCE_TYPES.ADMIN, { count: dataToExport.length })
      toast.success(`${dataToExport.length} administrateurs exportés avec succès`)
    } catch (error) {
      toast.error(`Erreur d'export: ${error.message}`)
    } finally {
      setExporting(false)
    }
  }

  // Modal states
  const [formModal, setFormModal] = useState({ open: false, admin: null })
  const [detailModal, setDetailModal] = useState({ open: false, admin: null })
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, adminId: null })

  // Handlers
  const handleCreate = () => {
    setFormModal({ open: true, admin: null })
  }

  const handleEdit = (admin) => {
    setDetailModal({ open: false, admin: null })
    setFormModal({ open: true, admin })
  }

  const handleView = (admin) => {
    setDetailModal({ open: true, admin })
  }

  const handleDeleteClick = (adminId) => {
    setDetailModal({ open: false, admin: null })
    setDeleteConfirm({ open: true, adminId })
  }

  const handleFormSubmit = async (formData) => {
    try {
      if (formModal.admin) {
        // Update
        await updateAdmin(formModal.admin.id, formData)
        toast.success('Administrateur modifié avec succès')
      } else {
        // Create
        await createAdmin(formData)
        toast.success('Administrateur créé avec succès')
      }
      setFormModal({ open: false, admin: null })
    } catch (error) {
      toast.error(error.message || 'Une erreur est survenue')
      throw error
    }
  }

  const handleDeleteConfirm = async () => {
    try {
      await deleteAdmin(deleteConfirm.adminId)
      toast.success('Administrateur désactivé avec succès')
      setDeleteConfirm({ open: false, adminId: null })
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la suppression')
    }
  }

  const handleToggleStatus = async (adminId) => {
    try {
      const result = await toggleAdminStatus(adminId)
      toast.success(result.newStatus ? 'Administrateur activé' : 'Administrateur désactivé')
      setDetailModal({ open: false, admin: null })
    } catch (error) {
      toast.error(error.message || 'Erreur lors du changement de statut')
    }
  }

  return (
    <Layout
      title="Administrateurs"
      subtitle="Gestion des utilisateurs et des accès"
    >
      <div className="space-y-6">
        {/* Stats Header */}
        <AdminsStatsHeader stats={stats} loading={loading} />

        {/* Filtres avancés */}
        <AdvancedFilters
          filters={ADMIN_FILTERS}
          values={filterValues}
          onChange={setFilterValues}
          onReset={() => setFilterValues({})}
          onApply={() => toast.info('Filtres appliqués')}
        />

        {/* Actions & Bulk Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <BulkActions
            items={filteredAdmins}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            actions={ADMIN_BULK_ACTIONS(bulkHandlers)}
          />

          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="btn-secondary flex items-center gap-2"
              disabled={exporting || loading || filteredAdmins.length === 0}
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Export...' : `Exporter ${selectedIds.length > 0 ? `(${selectedIds.length})` : 'CSV'}`}
            </button>
            <button
              onClick={handleCreate}
              className="btn btn-primary flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Ajouter un admin
            </button>
          </div>
        </div>

        {/* Table avec sélection */}
        <AdminsTable
          admins={filteredAdmins}
          loading={loading}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          enableSelection={true}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />

        {/* Form Modal (Create/Edit) */}
        <AdminForm
          isOpen={formModal.open}
          onClose={() => setFormModal({ open: false, admin: null })}
          admin={formModal.admin}
          onSubmit={handleFormSubmit}
          loading={actionLoading}
        />

        {/* Detail Modal */}
        <AdminDetailModal
          isOpen={detailModal.open}
          onClose={() => setDetailModal({ open: false, admin: null })}
          admin={detailModal.admin}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onToggleStatus={handleToggleStatus}
          loading={actionLoading}
        />

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={deleteConfirm.open}
          onClose={() => setDeleteConfirm({ open: false, adminId: null })}
          onConfirm={handleDeleteConfirm}
          title="Désactiver l'administrateur"
          message="Êtes-vous sûr de vouloir désactiver cet administrateur ? Il ne pourra plus se connecter mais ses données seront conservées."
          confirmText="Désactiver"
          variant="danger"
          loading={actionLoading}
        />
      </div>
    </Layout>
  )
}

// ============================================================================
// AUDIT LOGS PAGE
// ============================================================================

export const AuditLogsPage = () => {
  const { fetchAuditLogs, getAuditStats, logExport, AUDIT_ACTIONS: actions, RESOURCE_TYPES: resources } = useAuditLog()
  const toast = useToast()

  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [stats, setStats] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 50, total: 0, totalPages: 0 })
  const [filters, setFilters] = useState({
    action: '',
    resourceType: '',
  })

  // Fetch logs on mount
  useEffect(() => {
    loadLogs()
    loadStats()
  }, [])

  const loadLogs = async (page = 1) => {
    setLoading(true)
    try {
      const result = await fetchAuditLogs({
        page,
        pageSize: 50,
        action: filters.action || null,
        resourceType: filters.resourceType || null,
      })
      setLogs(result.logs)
      setPagination({
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      })
    } catch (error) {
      toast.error('Erreur lors du chargement des logs')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    const result = await getAuditStats(7)
    setStats(result)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      // Fetch all logs for export
      const allLogs = await fetchAuditLogs({ page: 1, pageSize: 10000 })
      exportAuditLogs(allLogs.logs)
      await logExport(resources.SYSTEM, { type: 'audit_logs', count: allLogs.logs.length })
      toast.success(`${allLogs.logs.length} logs exportés avec succès`)
    } catch (error) {
      toast.error(`Erreur d'export: ${error.message}`)
    } finally {
      setExporting(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleApplyFilters = () => {
    loadLogs(1)
  }

  const getActionLabel = (action) => {
    const labels = {
      CREATE: 'Création',
      UPDATE: 'Modification',
      DELETE: 'Suppression',
      VIEW: 'Consultation',
      EXPORT: 'Export',
      LOGIN: 'Connexion',
      LOGOUT: 'Déconnexion',
      LOGIN_FAILED: 'Échec connexion',
      APPROVE: 'Approbation',
      EXECUTE: 'Exécution',
    }
    return labels[action] || action
  }

  const getResourceLabel = (resource) => {
    const labels = {
      admin: 'Administrateur',
      creator: 'Créateur',
      batch: 'Batch',
      transfer: 'Transfert',
      commission: 'Commission',
      settings: 'Paramètres',
      session: 'Session',
      system: 'Système',
    }
    return labels[resource] || resource
  }

  const getActionColor = (action) => {
    const colors = {
      CREATE: 'badge-success',
      UPDATE: 'badge-primary',
      DELETE: 'badge-danger',
      VIEW: 'badge-gray',
      EXPORT: 'badge-primary',
      LOGIN: 'badge-success',
      LOGOUT: 'badge-gray',
      LOGIN_FAILED: 'badge-danger',
      APPROVE: 'badge-success',
      EXECUTE: 'badge-warning',
    }
    return colors[action] || 'badge-gray'
  }

  return (
    <Layout
      title="Audit Logs"
      subtitle="Traçabilité des actions système"
    >
      <div className="space-y-6">
        {/* Stats Summary */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <Card.Body>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalActions}
                  </p>
                  <p className="text-sm text-gray-500">Actions (7 jours)</p>
                </div>
              </Card.Body>
            </Card>
            <Card>
              <Card.Body>
                <div className="text-center">
                  <p className="text-2xl font-bold text-success-600">
                    {stats.byAction?.CREATE || 0}
                  </p>
                  <p className="text-sm text-gray-500">Créations</p>
                </div>
              </Card.Body>
            </Card>
            <Card>
              <Card.Body>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-600">
                    {stats.byAction?.UPDATE || 0}
                  </p>
                  <p className="text-sm text-gray-500">Modifications</p>
                </div>
              </Card.Body>
            </Card>
            <Card>
              <Card.Body>
                <div className="text-center">
                  <p className="text-2xl font-bold text-danger-600">
                    {stats.byAction?.DELETE || 0}
                  </p>
                  <p className="text-sm text-gray-500">Suppressions</p>
                </div>
              </Card.Body>
            </Card>
          </div>
        )}

        {/* Filters & Actions */}
        <Card>
          <Card.Body>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Action
                </label>
                <select
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  className="input"
                >
                  <option value="">Toutes les actions</option>
                  {Object.keys(actions).map(action => (
                    <option key={action} value={action}>{getActionLabel(action)}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ressource
                </label>
                <select
                  value={filters.resourceType}
                  onChange={(e) => handleFilterChange('resourceType', e.target.value)}
                  className="input"
                >
                  <option value="">Toutes les ressources</option>
                  {Object.values(resources).map(resource => (
                    <option key={resource} value={resource}>{getResourceLabel(resource)}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={handleApplyFilters}
                  className="btn-primary"
                >
                  Filtrer
                </button>
                <button
                  onClick={handleExport}
                  className="btn-secondary flex items-center gap-2"
                  disabled={exporting}
                >
                  <Download className="w-4 h-4" />
                  {exporting ? 'Export...' : 'Exporter'}
                </button>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Logs Table */}
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Historique ({pagination.total} entrées)
              </h3>
              <button
                onClick={() => loadLogs(pagination.page)}
                className="btn-secondary btn-sm flex items-center gap-2"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
            </div>
          </Card.Header>

          {loading ? (
            <Card.Body>
              <div className="flex items-center justify-center py-12">
                <Spinner size="lg" />
              </div>
            </Card.Body>
          ) : logs.length === 0 ? (
            <Card.Body>
              <EmptyState
                icon={Shield}
                title="Aucun log d'audit"
                description="Les actions seront tracées ici automatiquement."
              />
            </Card.Body>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date/Heure</th>
                    <th>Utilisateur</th>
                    <th>Action</th>
                    <th>Ressource</th>
                    <th>Détails</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <span className="text-sm text-gray-500">
                          {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
                        </span>
                      </td>
                      <td>
                        <span className="font-medium">{log.user_email || 'Système'}</span>
                      </td>
                      <td>
                        <span className={`badge ${getActionColor(log.action)}`}>
                          {getActionLabel(log.action)}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm">
                          {getResourceLabel(log.resource_type)}
                          {log.resource_name && (
                            <span className="text-gray-500 ml-1">({log.resource_name})</span>
                          )}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-gray-500 font-mono">
                          {log.resource_id ? `ID: ${log.resource_id.slice(0, 8)}...` : '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Card.Body>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Page {pagination.page} sur {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadLogs(pagination.page - 1)}
                    disabled={pagination.page <= 1 || loading}
                    className="btn-secondary btn-sm"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => loadLogs(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages || loading}
                    className="btn-secondary btn-sm"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </Card.Body>
          )}
        </Card>
      </div>
    </Layout>
  )
}

// ============================================================================
// FINANCIAL PAGE (Ledger & Execution)
// ============================================================================

export const FinancialPage = () => {
  const toast = useToast()
  const [selectedBatchId, setSelectedBatchId] = useState(null)
  const [selectedCreatorId, setSelectedCreatorId] = useState(null)
  const [activeTab, setActiveTab] = useState('ledger') // 'ledger' | 'execution' | 'balances'
  const { batches, loading: batchesLoading } = useBatches({ limit: 20 })

  // Lazy import financial components
  const [FinancialLedgerTable, setFinancialLedgerTable] = useState(null)
  const [PaymentExecutionPanel, setPaymentExecutionPanel] = useState(null)
  const [CreatorBalanceCard, setCreatorBalanceCard] = useState(null)

  useEffect(() => {
    // Dynamic import of financial components
    import('../components/Financial').then(module => {
      setFinancialLedgerTable(() => module.FinancialLedgerTable)
      setPaymentExecutionPanel(() => module.PaymentExecutionPanel)
      setCreatorBalanceCard(() => module.CreatorBalanceCard)
    })
  }, [])

  const tabs = [
    { id: 'ledger', label: 'Journal financier', icon: FileText },
    { id: 'execution', label: 'Execution paiements', icon: Database },
    { id: 'balances', label: 'Soldes createurs', icon: Shield }
  ]

  return (
    <Layout
      title="Finance"
      subtitle="Journal financier, execution et soldes"
    >
      <div className="space-y-6">
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'ledger' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Journal immutable de toutes les transactions financieres. Chaque entree est tracee et ne peut etre modifiee.
            </p>
            {FinancialLedgerTable ? (
              <FinancialLedgerTable
                creatorId={selectedCreatorId}
                showSearch={true}
                showFilters={true}
                showExport={true}
              />
            ) : (
              <div className="flex items-center justify-center py-12">
                <Spinner size="lg" />
              </div>
            )}
          </div>
        )}

        {activeTab === 'execution' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Batch List */}
            <Card>
              <Card.Header>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Batches
                </h3>
              </Card.Header>
              <Card.Body>
                {batchesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Spinner />
                  </div>
                ) : batches.length === 0 ? (
                  <EmptyState
                    icon={Database}
                    title="Aucun batch"
                    description="Aucun batch de paiement disponible"
                  />
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {batches.map(batch => (
                      <button
                        key={batch.id}
                        onClick={() => setSelectedBatchId(batch.id)}
                        className={`
                          w-full p-3 rounded-lg text-left transition-colors
                          ${selectedBatchId === batch.id
                            ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                            : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }
                          border
                        `}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            Batch #{batch.id.slice(0, 8)}
                          </span>
                          <StatusBadge status={batch.status} />
                        </div>
                        <div className="text-xs text-gray-500">
                          {batch.itemCount || 0} elements - {batch.totalAmount?.toFixed(2) || 0} EUR
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Execution Panel */}
            <div className="lg:col-span-2">
              {PaymentExecutionPanel ? (
                <PaymentExecutionPanel batchId={selectedBatchId} />
              ) : (
                <Card>
                  <Card.Body>
                    <div className="flex items-center justify-center py-12">
                      <Spinner size="lg" />
                    </div>
                  </Card.Body>
                </Card>
              )}
            </div>
          </div>
        )}

        {activeTab === 'balances' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Soldes des createurs calcules depuis le journal financier immutable.
            </p>

            {/* Creator selector */}
            <Card>
              <Card.Body>
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Createur:
                  </label>
                  <select
                    value={selectedCreatorId || ''}
                    onChange={(e) => setSelectedCreatorId(e.target.value || null)}
                    className="input max-w-xs"
                  >
                    <option value="">Tous les createurs</option>
                    {/* This would be populated from creators list */}
                  </select>
                </div>
              </Card.Body>
            </Card>

            {/* Balance Card */}
            {selectedCreatorId && CreatorBalanceCard && (
              <CreatorBalanceCard creatorId={selectedCreatorId} />
            )}

            {/* Ledger for selected creator */}
            {selectedCreatorId && FinancialLedgerTable && (
              <FinancialLedgerTable
                creatorId={selectedCreatorId}
                showSearch={false}
                showFilters={false}
                showExport={true}
              />
            )}

            {!selectedCreatorId && (
              <Card>
                <Card.Body>
                  <EmptyState
                    icon={Shield}
                    title="Selectionnez un createur"
                    description="Choisissez un createur pour voir son solde et historique"
                  />
                </Card.Body>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
