'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Search, Eye, Edit, Trash2, MoreVertical } from 'lucide-react'
import clsx from 'clsx'
import { Card, Badge, EmptyState, SelectAllCheckbox, SelectRowCheckbox } from '../Common'
import { AdminRoleBadge } from './AdminRoleBadge'

/**
 * Table component for displaying admins
 * @param {object} props
 * @param {array} props.admins - Array of admin objects
 * @param {boolean} [props.loading] - Loading state
 * @param {function} props.onView - View handler
 * @param {function} props.onEdit - Edit handler
 * @param {function} props.onDelete - Delete handler
 * @param {boolean} [props.enableSelection] - Enable selection mode
 * @param {array} [props.selectedIds] - Array of selected admin IDs
 * @param {function} [props.onSelectionChange] - Selection change handler
 */
export const AdminsTable = ({
  admins = [],
  loading,
  onView,
  onEdit,
  onDelete,
  enableSelection = false,
  selectedIds = [],
  onSelectionChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [openMenu, setOpenMenu] = useState(null)

  // Filter admins based on search
  const filteredAdmins = useMemo(() => {
    if (!searchQuery.trim()) return admins

    const query = searchQuery.toLowerCase()
    return admins.filter(
      (admin) =>
        admin.email?.toLowerCase().includes(query) ||
        admin.full_name?.toLowerCase().includes(query) ||
        admin.role?.toLowerCase().includes(query)
    )
  }, [admins, searchQuery])

  // Selection handlers
  const handleToggleAll = () => {
    if (selectedIds.length === filteredAdmins.length) {
      onSelectionChange?.([])
    } else {
      onSelectionChange?.(filteredAdmins.map(a => a.id))
    }
  }

  const handleToggleRow = (id) => {
    if (selectedIds.includes(id)) {
      onSelectionChange?.(selectedIds.filter(i => i !== id))
    } else {
      onSelectionChange?.([...selectedIds, id])
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    try {
      return format(new Date(dateStr), 'd MMM yyyy', { locale: fr })
    } catch {
      return '-'
    }
  }

  const getInitials = (name, email) => {
    if (name) {
      const parts = name.split(' ')
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase()
      }
      return name.charAt(0).toUpperCase()
    }
    return email?.charAt(0).toUpperCase() || 'A'
  }

  // Loading skeleton
  if (loading) {
    return (
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Administrateurs
            </h3>
            <div className="w-64 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          </div>
        </Card.Header>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Créé le</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                      <div className="space-y-2">
                        <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="w-48 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </div>
                    </div>
                  </td>
                  <td><div className="w-24 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" /></td>
                  <td><div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" /></td>
                  <td><div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>
                  <td><div className="w-24 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <Card.Header>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Administrateurs
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({filteredAdmins.length})
            </span>
          </h3>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full sm:w-64"
              aria-label="Rechercher un administrateur"
            />
          </div>
        </div>
      </Card.Header>

      {filteredAdmins.length === 0 ? (
        <div className="p-8">
          <EmptyState
            icon={Search}
            title={searchQuery ? 'Aucun résultat' : 'Aucun administrateur'}
            description={
              searchQuery
                ? `Aucun administrateur ne correspond à "${searchQuery}"`
                : 'Commencez par ajouter un administrateur'
            }
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table" role="grid">
            <thead>
              <tr>
                {enableSelection && (
                  <th scope="col" className="w-10">
                    <SelectAllCheckbox
                      items={filteredAdmins}
                      selectedIds={selectedIds}
                      onToggleAll={handleToggleAll}
                    />
                  </th>
                )}
                <th scope="col">Utilisateur</th>
                <th scope="col">Rôle</th>
                <th scope="col">Statut</th>
                <th scope="col">Créé le</th>
                <th scope="col" className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.map((admin) => (
                <tr
                  key={admin.id}
                  className={clsx(
                    'group',
                    enableSelection && selectedIds.includes(admin.id) && 'bg-primary-50 dark:bg-primary-900/20'
                  )}
                >
                  {/* Selection checkbox */}
                  {enableSelection && (
                    <td>
                      <SelectRowCheckbox
                        isSelected={selectedIds.includes(admin.id)}
                        onToggle={() => handleToggleRow(admin.id)}
                      />
                    </td>
                  )}

                  {/* User info */}
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                          {getInitials(admin.full_name, admin.email)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {admin.full_name || 'Sans nom'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {admin.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td>
                    <AdminRoleBadge role={admin.role} size="sm" />
                  </td>

                  {/* Status */}
                  <td>
                    {admin.is_active ? (
                      <Badge variant="success">Actif</Badge>
                    ) : (
                      <Badge variant="danger">Inactif</Badge>
                    )}
                  </td>

                  {/* Created date */}
                  <td>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(admin.created_at)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      {/* Desktop actions */}
                      <div className="hidden sm:flex items-center gap-1">
                        <button
                          onClick={() => onView(admin)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="Voir les détails"
                          aria-label={`Voir les détails de ${admin.full_name || admin.email}`}
                        >
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => onEdit(admin)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="Modifier"
                          aria-label={`Modifier ${admin.full_name || admin.email}`}
                        >
                          <Edit className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => onDelete(admin.id)}
                          className="p-2 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-500/20 transition-colors"
                          title="Supprimer"
                          aria-label={`Supprimer ${admin.full_name || admin.email}`}
                        >
                          <Trash2 className="w-4 h-4 text-danger-500" />
                        </button>
                      </div>

                      {/* Mobile menu */}
                      <div className="relative sm:hidden">
                        <button
                          onClick={() => setOpenMenu(openMenu === admin.id ? null : admin.id)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          aria-expanded={openMenu === admin.id}
                          aria-haspopup="true"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>

                        {openMenu === admin.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenMenu(null)}
                            />
                            <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                              <button
                                onClick={() => {
                                  onView(admin)
                                  setOpenMenu(null)
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                <Eye className="w-4 h-4" />
                                Voir les détails
                              </button>
                              <button
                                onClick={() => {
                                  onEdit(admin)
                                  setOpenMenu(null)
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                <Edit className="w-4 h-4" />
                                Modifier
                              </button>
                              <button
                                onClick={() => {
                                  onDelete(admin.id)
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
  )
}
