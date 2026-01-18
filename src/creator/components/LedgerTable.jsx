import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronDown, Filter, Download, RefreshCw } from 'lucide-react'
import { useState } from 'react'

/**
 * Paginated ledger table with filtering
 */
export const LedgerTable = ({
  entries = [],
  loading = false,
  hasMore = false,
  onLoadMore,
  transactionType,
  onFilterChange,
  transactionTypeLabels = {},
  getTypeLabel,
  getTypeColor,
  onRefresh,
}) => {
  const [filterOpen, setFilterOpen] = useState(false)

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return format(date, 'dd/MM/yyyy HH:mm', { locale: fr })
  }

  const typeOptions = [
    { value: null, label: 'Tous les types' },
    { value: 'commission_earned', label: 'Commissions gagnees' },
    { value: 'commission_canceled', label: 'Commissions annulees' },
    { value: 'payout_sent', label: 'Paiements envoyes' },
    { value: 'payout_completed', label: 'Paiements confirmes' },
    { value: 'payout_failed', label: 'Paiements echoues' },
    { value: 'payout_fee', label: 'Frais' },
  ]

  const getDefaultTypeLabel = (type) => {
    if (getTypeLabel) return getTypeLabel(type)
    return transactionTypeLabels[type] || type
  }

  const getDefaultTypeColor = (type) => {
    if (getTypeColor) return getTypeColor(type)
    const colors = {
      commission_earned: 'text-green-600 bg-green-50 dark:bg-green-900/20',
      commission_canceled: 'text-red-600 bg-red-50 dark:bg-red-900/20',
      payout_sent: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
      payout_completed: 'text-green-600 bg-green-50 dark:bg-green-900/20',
      payout_failed: 'text-red-600 bg-red-50 dark:bg-red-900/20',
      payout_fee: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
    }
    return colors[type] || 'text-gray-600 bg-gray-50 dark:bg-gray-700'
  }

  const isPositive = (type) => {
    const positive = ['commission_earned', 'payout_failed']
    return positive.includes(type)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header with filters */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Journal des transactions
        </h3>

        <div className="flex items-center gap-2">
          {/* Filter dropdown */}
          <div className="relative">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <Filter className="w-4 h-4" />
              {transactionType ? getDefaultTypeLabel(transactionType) : 'Filtrer'}
              <ChevronDown className="w-4 h-4" />
            </button>

            {filterOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setFilterOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="p-1">
                    {typeOptions.map((option) => (
                      <button
                        key={option.value || 'all'}
                        onClick={() => {
                          onFilterChange?.(option.value)
                          setFilterOpen(false)
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg ${
                          transactionType === option.value
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Refresh button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Description
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Montant
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Solde
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading && entries.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 ml-auto"></div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 ml-auto"></div>
                  </td>
                </tr>
              ))
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                  Aucune transaction trouvee
                </td>
              </tr>
            ) : (
              entries.map((entry) => {
                const positive = isPositive(entry.transaction_type)
                return (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(entry.created_at)}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getDefaultTypeColor(entry.transaction_type)}`}>
                        {getDefaultTypeLabel(entry.transaction_type)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                      {entry.description}
                    </td>
                    <td className={`px-4 py-4 text-sm font-medium text-right whitespace-nowrap ${
                      positive ? 'text-green-600' : 'text-gray-900 dark:text-white'
                    }`}>
                      {positive ? '+' : '-'}{formatCurrency(entry.amount)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400 text-right whitespace-nowrap">
                      {formatCurrency(entry.balance_after)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
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
