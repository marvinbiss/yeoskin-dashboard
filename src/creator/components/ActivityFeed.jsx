import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  PlusCircle,
  MinusCircle,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight
} from 'lucide-react'

/**
 * Activity feed showing recent ledger entries
 */
export const ActivityFeed = ({ activities = [], loading = false, onViewAll }) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount || 0)
  }

  const getTimeAgo = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return formatDistanceToNow(date, { locale: fr, addSuffix: true })
  }

  const getActivityIcon = (type) => {
    const icons = {
      commission_earned: PlusCircle,
      commission_canceled: XCircle,
      payout_initiated: Clock,
      payout_sent: Send,
      payout_completed: CheckCircle,
      payout_failed: XCircle,
      payout_fee: MinusCircle,
    }
    return icons[type] || Clock
  }

  const getActivityColor = (type) => {
    const colors = {
      commission_earned: 'text-green-500 bg-green-50 dark:bg-green-900/20',
      commission_canceled: 'text-red-500 bg-red-50 dark:bg-red-900/20',
      payout_initiated: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
      payout_sent: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
      payout_completed: 'text-green-600 bg-green-50 dark:bg-green-900/20',
      payout_failed: 'text-red-600 bg-red-50 dark:bg-red-900/20',
      payout_fee: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
    }
    return colors[type] || 'text-gray-500 bg-gray-50 dark:bg-gray-700'
  }

  const getActivityLabel = (type) => {
    const labels = {
      commission_earned: 'Commission gagnee',
      commission_canceled: 'Commission annulee',
      commission_adjusted: 'Ajustement',
      payout_initiated: 'Paiement initie',
      payout_sent: 'Paiement envoye',
      payout_completed: 'Paiement confirme',
      payout_failed: 'Paiement echoue',
      payout_fee: 'Frais de transfert',
      balance_adjustment: 'Ajustement',
      refund_processed: 'Remboursement',
    }
    return labels[type] || type
  }

  const isPositiveAmount = (type) => {
    const positive = ['commission_earned', 'payout_failed']
    return positive.includes(type)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Activite recente
        </h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            Voir tout
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {activities.length === 0 ? (
          <div className="p-6 text-center">
            <Clock className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              Aucune activite recente
            </p>
          </div>
        ) : (
          activities.map((activity) => {
            const Icon = getActivityIcon(activity.type)
            const colorClass = getActivityColor(activity.type)
            const isPositive = isPositiveAmount(activity.type)

            return (
              <div key={activity.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {getActivityLabel(activity.type)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {activity.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                      {isPositive ? '+' : ''}{formatCurrency(activity.amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getTimeAgo(activity.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
