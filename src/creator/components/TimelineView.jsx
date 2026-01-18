import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  PlusCircle,
  MinusCircle,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  Info
} from 'lucide-react'
import { useState } from 'react'

/**
 * Timeline view showing chronological events with explanations
 */
export const TimelineView = ({
  events = [],
  loading = false,
  hasMore = false,
  onLoadMore,
  getEventIcon,
  getEventColor,
}) => {
  const [expandedId, setExpandedId] = useState(null)

  if (loading && events.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
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

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return format(date, "dd MMMM yyyy 'a' HH:mm", { locale: fr })
  }

  const getIcon = (type) => {
    const icons = {
      commission_earned: PlusCircle,
      commission_canceled: XCircle,
      commission_adjusted: MinusCircle,
      payout_initiated: Clock,
      payout_sent: Send,
      payout_completed: CheckCircle,
      payout_failed: XCircle,
      payout_fee: MinusCircle,
    }
    return icons[type] || Clock
  }

  const getColorClass = (type) => {
    const colors = {
      commission_earned: 'text-green-500 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20',
      commission_canceled: 'text-red-500 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20',
      payout_sent: 'text-blue-500 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20',
      payout_completed: 'text-green-600 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20',
      payout_failed: 'text-red-600 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20',
      payout_fee: 'text-orange-500 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20',
    }
    return colors[type] || 'text-gray-500 border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
  }

  const isPositive = (type) => {
    const positive = ['commission_earned', 'payout_failed']
    return positive.includes(type)
  }

  if (events.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
        <Clock className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Aucun evenement
        </p>
        <p className="text-gray-500 dark:text-gray-400">
          Votre historique apparaitra ici lorsque vous aurez des transactions.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

        {/* Events */}
        <div className="relative">
          {events.map((event, index) => {
            const Icon = getIcon(event.transaction_type)
            const colorClass = getColorClass(event.transaction_type)
            const positive = isPositive(event.transaction_type)
            const isExpanded = expandedId === event.id

            return (
              <div
                key={event.id}
                className={`relative pl-20 pr-6 py-6 ${
                  index !== events.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                }`}
              >
                {/* Icon */}
                <div className={`absolute left-4 w-10 h-10 rounded-full border-2 flex items-center justify-center ${colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-base font-medium text-gray-900 dark:text-white">
                        {event.event_label}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {formatDate(event.event_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${positive ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                        {positive ? '+' : '-'}{formatCurrency(event.amount)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Solde: {formatCurrency(event.balance_after)}
                      </p>
                    </div>
                  </div>

                  {/* Reason */}
                  {event.reason && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      {event.reason}
                    </p>
                  )}

                  {/* Expandable explanation */}
                  {event.explanation && (
                    <div>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : event.id)}
                        className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
                      >
                        <Info className="w-4 h-4" />
                        <span>Comprendre</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {isExpanded && (
                        <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            {event.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* References */}
                  {(event.shopify_order_id || event.wise_transfer_reference) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {event.shopify_order_id && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          Commande: {event.shopify_order_id}
                        </span>
                      )}
                      {event.wise_transfer_reference && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          Ref: {event.wise_transfer_reference}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"
          >
            {loading ? (
              <span key="spinner" className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <ChevronDown key="icon" className="w-4 h-4" />
            )}
            <span key="text">{loading ? 'Chargement...' : 'Charger plus'}</span>
          </button>
        </div>
      )}
    </div>
  )
}
