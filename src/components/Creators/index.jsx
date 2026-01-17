import { useState } from 'react'
import {
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  CreditCard,
  CheckCircle,
  XCircle,
  Search,
  Download
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import clsx from 'clsx'
import { Card, Button, StatusBadge, Modal, Spinner, EmptyState, Badge, SelectAllCheckbox, SelectRowCheckbox } from '../Common'

// Re-export des nouveaux composants
export { CreatorForm } from './CreatorForm'
export { CreatorDetailModal } from './CreatorDetailModal'

// ============================================================================
// CREATORS TABLE - FRANÇAIS (avec sélection et actions)
// ============================================================================

export const CreatorsTable = ({
  creators,
  loading,
  onRefresh,
  // Props pour la sélection
  selectedIds = [],
  onSelectionChange,
  enableSelection = false,
  // Props pour les actions
  onView,
  onEdit,
  onDelete,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [openMenu, setOpenMenu] = useState(null)

  const filteredCreators = creators.filter(creator =>
    creator.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    creator.discount_code?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handlers pour la sélection
  const handleToggleAll = () => {
    if (selectedIds.length === filteredCreators.length) {
      onSelectionChange?.([])
    } else {
      onSelectionChange?.(filteredCreators.map(c => c.id))
    }
  }

  const handleToggleRow = (id) => {
    if (selectedIds.includes(id)) {
      onSelectionChange?.(selectedIds.filter(i => i !== id))
    } else {
      onSelectionChange?.([...selectedIds, id])
    }
  }

  if (loading) {
    return (
      <Card>
        <Card.Header>
          <h3 className="font-semibold text-gray-900 dark:text-white">Créateurs</h3>
        </Card.Header>
        <Card.Body>
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        </Card.Body>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <Card.Header>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Créateurs ({creators.length})
              {enableSelection && selectedIds.length > 0 && (
                <span className="ml-2 text-sm font-normal text-primary-600">
                  ({selectedIds.length} sélectionné{selectedIds.length > 1 ? 's' : ''})
                </span>
              )}
            </h3>
            <div className="flex items-center gap-3">
              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher des créateurs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm w-64"
                />
              </div>
            </div>
          </div>
        </Card.Header>

        {filteredCreators.length === 0 ? (
          <Card.Body>
            <EmptyState
              icon={Search}
              title="Aucun créateur trouvé"
              description={searchQuery ? "Essayez de modifier votre recherche" : "Aucun créateur enregistré pour le moment"}
            />
          </Card.Body>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  {enableSelection && (
                    <th className="w-10">
                      <SelectAllCheckbox
                        items={filteredCreators}
                        selectedIds={selectedIds}
                        onToggleAll={handleToggleAll}
                      />
                    </th>
                  )}
                  <th>Créateur</th>
                  <th>Code promo</th>
                  <th>Statut</th>
                  <th>Total gagné</th>
                  <th>En attente</th>
                  <th>Compte bancaire</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCreators.map((creator) => (
                  <tr
                    key={creator.id}
                    className={clsx(
                      enableSelection && selectedIds.includes(creator.id) && 'bg-primary-50 dark:bg-primary-900/20'
                    )}
                  >
                    {enableSelection && (
                      <td>
                        <SelectRowCheckbox
                          isSelected={selectedIds.includes(creator.id)}
                          onToggle={() => handleToggleRow(creator.id)}
                        />
                      </td>
                    )}
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600">
                            {creator.email?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {creator.email || 'Pas d\'email'}
                          </p>
                          <p className="text-xs text-gray-500">
                            ID: {creator.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <code className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-sm">
                        {creator.discount_code || 'N/A'}
                      </code>
                    </td>
                    <td>
                      <StatusBadge status={creator.status} />
                    </td>
                    <td>
                      <span className="font-medium text-success-600">
                        {(creator.totalEarned || 0).toFixed(2)} €
                      </span>
                    </td>
                    <td>
                      <span className={clsx(
                        'font-medium',
                        creator.pendingAmount > 0 ? 'text-warning-600' : 'text-gray-400'
                      )}>
                        {(creator.pendingAmount || 0).toFixed(2)} €
                      </span>
                    </td>
                    <td>
                      {creator.hasBankAccount ? (
                        <div className="flex items-center gap-1">
                          {creator.bankVerified ? (
                            <CheckCircle className="w-4 h-4 text-success-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-warning-500" />
                          )}
                          <span className="text-sm">
                            {creator.bankVerified ? 'Vérifié' : 'En attente'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Non configuré</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        {/* Desktop actions */}
                        <div className="hidden sm:flex items-center gap-1">
                          <button
                            onClick={() => onView?.(creator)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => onEdit?.(creator)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => onDelete?.(creator.id)}
                            className="p-2 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-500/20 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4 text-danger-500" />
                          </button>
                        </div>

                        {/* Mobile menu */}
                        <div className="relative sm:hidden">
                          <button
                            onClick={() => setOpenMenu(openMenu === creator.id ? null : creator.id)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                          </button>

                          {openMenu === creator.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenu(null)}
                              />
                              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                                <button
                                  onClick={() => {
                                    onView?.(creator)
                                    setOpenMenu(null)
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                  <Eye className="w-4 h-4" />
                                  Voir les détails
                                </button>
                                <button
                                  onClick={() => {
                                    onEdit?.(creator)
                                    setOpenMenu(null)
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                  <Edit className="w-4 h-4" />
                                  Modifier
                                </button>
                                <button
                                  onClick={() => {
                                    onDelete?.(creator.id)
                                    setOpenMenu(null)
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-left text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-500/20"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Supprimer
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}

// ============================================================================
// CREATORS STATS HEADER - FRANÇAIS
// ============================================================================

export const CreatorsStatsHeader = ({ creators }) => {
  const stats = {
    total: creators.length,
    active: creators.filter(c => c.status === 'active').length,
    withBank: creators.filter(c => c.hasBankAccount).length,
    totalEarned: creators.reduce((sum, c) => sum + (c.totalEarned || 0), 0),
    totalPending: creators.reduce((sum, c) => sum + (c.pendingAmount || 0), 0),
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
        <p className="text-xs text-gray-500 uppercase">Total créateurs</p>
        <p className="text-2xl font-bold">{stats.total}</p>
      </div>
      <div className="p-4 rounded-lg bg-success-50 dark:bg-success-500/20">
        <p className="text-xs text-success-600 uppercase">Actifs</p>
        <p className="text-2xl font-bold text-success-600">{stats.active}</p>
      </div>
      <div className="p-4 rounded-lg bg-primary-50 dark:bg-primary-900/20">
        <p className="text-xs text-primary-600 uppercase">Avec compte bancaire</p>
        <p className="text-2xl font-bold text-primary-600">{stats.withBank}</p>
      </div>
      <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
        <p className="text-xs text-gray-500 uppercase">Total gagné</p>
        <p className="text-2xl font-bold text-success-600">{stats.totalEarned.toFixed(0)} €</p>
      </div>
      <div className="p-4 rounded-lg bg-warning-50 dark:bg-warning-500/20">
        <p className="text-xs text-warning-600 uppercase">En attente</p>
        <p className="text-2xl font-bold text-warning-600">{stats.totalPending.toFixed(0)} €</p>
      </div>
    </div>
  )
}
