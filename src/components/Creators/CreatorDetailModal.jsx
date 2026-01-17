/**
 * YEOSKIN DASHBOARD - CreatorDetailModal Component
 * Modal de détails d'un créateur avec actions
 */

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  User,
  Mail,
  Tag,
  CreditCard,
  Calendar,
  Percent,
  Clock,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  DollarSign,
  TrendingUp,
} from 'lucide-react'
import { Modal, Button, Badge, StatusBadge } from '../Common'

/**
 * Composant de modal de détails du créateur
 */
export const CreatorDetailModal = ({
  isOpen,
  onClose,
  creator,
  onEdit,
  onDelete,
  onToggleStatus,
  onVerifyBank,
  loading = false,
}) => {
  if (!creator) return null

  // Formater une date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    try {
      return format(new Date(dateStr), 'd MMMM yyyy à HH:mm', { locale: fr })
    } catch {
      return '-'
    }
  }

  // Formater une date courte
  const formatDateShort = (dateStr) => {
    if (!dateStr) return '-'
    try {
      return format(new Date(dateStr), 'd MMM yyyy', { locale: fr })
    } catch {
      return '-'
    }
  }

  // Masquer l'IBAN partiellement
  const maskIBAN = (iban) => {
    if (!iban) return 'Non configuré'
    if (iban.length <= 8) return iban
    return iban.slice(0, 4) + ' **** **** ' + iban.slice(-4)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Détails du créateur"
      size="lg"
    >
      <div className="space-y-6">
        {/* En-tête avec avatar */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {creator.email?.charAt(0).toUpperCase() || 'C'}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {creator.email}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={creator.status} />
                <code className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-sm font-mono">
                  {creator.discount_code}
                </code>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(creator)}
              disabled={loading}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleStatus(creator.id)}
              disabled={loading}
              title={creator.status === 'active' ? 'Désactiver' : 'Activer'}
            >
              {creator.status === 'active' ? (
                <ToggleRight className="w-4 h-4 text-success-500" />
              ) : (
                <ToggleLeft className="w-4 h-4 text-gray-400" />
              )}
            </Button>
          </div>
        </div>

        {/* Statistiques financières */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-success-50 dark:bg-success-500/20">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-success-600" />
              <p className="text-sm text-success-600 font-medium">Total gagné</p>
            </div>
            <p className="text-2xl font-bold text-success-600">
              {(creator.totalEarned || 0).toFixed(2)} €
            </p>
          </div>

          <div className="p-4 rounded-lg bg-warning-50 dark:bg-warning-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-warning-600" />
              <p className="text-sm text-warning-600 font-medium">En attente</p>
            </div>
            <p className="text-2xl font-bold text-warning-600">
              {(creator.pendingAmount || 0).toFixed(2)} €
            </p>
          </div>

          <div className="p-4 rounded-lg bg-primary-50 dark:bg-primary-500/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-primary-600" />
              <p className="text-sm text-primary-600 font-medium">Commissions</p>
            </div>
            <p className="text-2xl font-bold text-primary-600">
              {creator.commissionsCount || 0}
            </p>
          </div>
        </div>

        {/* Informations détaillées */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Colonne gauche */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Informations générales
            </h4>

            <div className="space-y-3">
              {/* Email */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium text-gray-900 dark:text-white">{creator.email}</p>
                </div>
              </div>

              {/* Code promo */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <Tag className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Code promo</p>
                  <p className="font-medium font-mono text-gray-900 dark:text-white">{creator.discount_code}</p>
                </div>
              </div>

              {/* Taux de commission */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <Percent className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Taux de commission</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {((creator.commission_rate || 0.15) * 100).toFixed(0)}%
                  </p>
                </div>
              </div>

              {/* Jours de blocage */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Jours de blocage</p>
                  <p className="font-medium text-gray-900 dark:text-white">{creator.lock_days || 30} jours</p>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne droite */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Compte bancaire
            </h4>

            {creator.hasBankAccount ? (
              <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
                {/* Statut vérification */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {(creator.bankAccount?.account_type || 'iban').toUpperCase()}
                    </span>
                  </div>
                  {creator.bankVerified ? (
                    <Badge variant="success">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Vérifié
                    </Badge>
                  ) : (
                    <Badge variant="warning">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Non vérifié
                    </Badge>
                  )}
                </div>

                {/* IBAN masqué */}
                <div>
                  <p className="text-xs text-gray-500">IBAN</p>
                  <p className="font-mono text-sm text-gray-900 dark:text-white">
                    {maskIBAN(creator.bankAccount?.iban)}
                  </p>
                </div>

                {/* Bouton vérification */}
                {!creator.bankVerified && onVerifyBank && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onVerifyBank(creator.id, true)}
                    disabled={loading}
                    className="w-full"
                  >
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Marquer comme vérifié
                  </Button>
                )}

                {creator.bankVerified && onVerifyBank && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onVerifyBank(creator.id, false)}
                    disabled={loading}
                    className="w-full text-warning-600"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Retirer la vérification
                  </Button>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 text-center">
                <CreditCard className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Aucun compte bancaire configuré</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onEdit(creator)}
                  disabled={loading}
                  className="mt-3"
                >
                  Ajouter un compte
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Métadonnées */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>ID: <code className="text-xs font-mono">{creator.id}</code></span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Créé le: {formatDate(creator.created_at)}</span>
          </div>
          {creator.updated_at && creator.updated_at !== creator.created_at && (
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Modifié le: {formatDate(creator.updated_at)}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="danger"
            onClick={() => onDelete(creator.id)}
            disabled={loading}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {creator.status === 'inactive' ? 'Supprimer définitivement' : 'Désactiver'}
          </Button>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Fermer
            </Button>
            <Button
              variant="primary"
              onClick={() => onEdit(creator)}
              disabled={loading}
            >
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default CreatorDetailModal
