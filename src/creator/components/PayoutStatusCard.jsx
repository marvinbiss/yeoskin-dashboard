/**
 * PayoutStatusCard - Affiche le statut des paiements pour un createur
 */
import { Clock, CheckCircle, Loader, AlertTriangle } from 'lucide-react'
import { usePayoutStatus } from '../hooks/usePayoutStatus'

export const PayoutStatusCard = ({ creatorId }) => {
  const { current, last, history, loading, error } = usePayoutStatus(creatorId)

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return null // Silent fail
  }

  // No payout history
  if (!current && !last && history.length === 0) {
    return null
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 dark:bg-green-900/20'
      case 'processing': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
      case 'failed': return 'text-red-600 bg-red-50 dark:bg-red-900/20'
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-700'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Termine'
      case 'processing': return 'En cours'
      case 'failed': return 'Echoue'
      case 'pending': return 'En attente'
      default: return status
    }
  }

  const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Etat des paiements
      </h2>

      {/* Current processing payout */}
      {current && current.status === 'processing' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            <Loader className="w-5 h-5 text-blue-600 animate-spin" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Paiement en cours
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {Number(current.amount).toFixed(2)}€ · Arrivee estimee sous 1-2 jours
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Last completed payout */}
      {last && last.status === 'completed' && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-900 dark:text-green-100">
                Dernier paiement effectue
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                {Number(last.amount).toFixed(2)}€ · {formatDate(last.completed_at)}
              </p>
              {last.wise_transfer_reference && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Reference: {last.wise_transfer_reference}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payout history */}
      {history.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Historique
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {history.slice(0, 5).map((payout) => (
              <div
                key={payout.id}
                className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {Number(payout.amount).toFixed(2)}€
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(payout.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(payout.status)}`}>
                    {getStatusLabel(payout.status)}
                  </span>
                  {payout.wise_transfer_reference && (
                    <p className="text-xs text-gray-400 mt-1">
                      {payout.wise_transfer_reference}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PayoutStatusCard
