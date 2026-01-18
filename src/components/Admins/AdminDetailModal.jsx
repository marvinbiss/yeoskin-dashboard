import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Mail, Calendar, Clock, UserCheck, UserX, Edit, Trash2 } from 'lucide-react'
import { Modal, Button, Badge } from '../Common'
import { AdminRoleBadge } from './AdminRoleBadge'

/**
 * Modal for displaying admin details
 * @param {object} props
 * @param {boolean} props.isOpen - Modal open state
 * @param {function} props.onClose - Close handler
 * @param {object} props.admin - Admin data
 * @param {function} props.onEdit - Edit handler
 * @param {function} props.onDelete - Delete handler
 * @param {function} props.onToggleStatus - Toggle status handler
 * @param {boolean} [props.loading] - Loading state
 */
export const AdminDetailModal = ({
  isOpen,
  onClose,
  admin,
  onEdit,
  onDelete,
  onToggleStatus,
  loading,
}) => {
  if (!admin) return null

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Non disponible'
    try {
      return format(new Date(dateStr), 'd MMMM yyyy à HH:mm', { locale: fr })
    } catch {
      return 'Date invalide'
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Détails de l'administrateur"
      size="md"
    >
      <div className="space-y-6">
        {/* Header with avatar and basic info */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {getInitials(admin.full_name, admin.email)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {admin.full_name || 'Sans nom'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5 truncate">
              <Mail className="w-4 h-4" aria-hidden="true" />
              {admin.email}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <AdminRoleBadge role={admin.role} size="sm" />
              {admin.is_active ? (
                <Badge variant="success">Actif</Badge>
              ) : (
                <Badge variant="danger">Inactif</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
              Créé le
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatDate(admin.created_at)}
            </p>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              Dernière modification
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatDate(admin.updated_at)}
            </p>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              Dernière connexion
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {admin.last_login ? formatDate(admin.last_login) : 'Jamais connecté'}
            </p>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              ID
            </p>
            <p className="text-sm font-mono text-gray-900 dark:text-white truncate" title={admin.id}>
              {admin.id}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="secondary"
            onClick={() => onEdit(admin)}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" aria-hidden="true" />
            Modifier
          </Button>

          <Button
            variant={admin.is_active ? 'ghost' : 'success'}
            onClick={() => onToggleStatus(admin.id)}
            disabled={loading}
            className="flex items-center gap-2"
            icon={admin.is_active ? UserX : UserCheck}
          >
            {admin.is_active ? 'Désactiver' : 'Activer'}
          </Button>

          <Button
            variant="danger"
            onClick={() => onDelete(admin.id)}
            disabled={loading}
            className="flex items-center gap-2 ml-auto"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            Supprimer
          </Button>
        </div>
      </div>
    </Modal>
  )
}
