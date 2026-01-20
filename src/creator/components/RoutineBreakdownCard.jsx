'use client'

import { useRoutineBreakdown } from '../hooks/useRoutineBreakdown'

/**
 * Format currency in EUR
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount || 0)
}

/**
 * Format percentage
 */
const formatPercent = (value) => {
  return `${((value || 0) * 100).toFixed(1)}%`
}

/**
 * Variant badge component
 */
const VariantBadge = ({ variant }) => {
  const styles = {
    base: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    upsell_1: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    upsell_2: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  }

  const labels = {
    base: 'Base',
    upsell_1: 'Upsell 1',
    upsell_2: 'Upsell 2',
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[variant] || styles.base}`}>
      {labels[variant] || variant}
    </span>
  )
}

/**
 * Loading skeleton
 */
const LoadingSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
      ))}
    </div>
  </div>
)

/**
 * Empty state
 */
const EmptyState = () => (
  <div className="text-center py-8">
    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
      Aucune commission par routine pour le moment
    </p>
  </div>
)

/**
 * Routine Breakdown Card - Shows commission performance by routine + variant
 */
export const RoutineBreakdownCard = ({ creatorId }) => {
  const { loading, error, breakdown, totals } = useRoutineBreakdown(creatorId)

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <LoadingSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Performance par Routine
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Repartition de vos commissions par routine et variant
            </p>
          </div>
          {totals.upsell_rate > 0 && (
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Taux d&apos;upsell</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {totals.upsell_rate.toFixed(1)}%
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      {totals.total_orders > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Commandes</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{totals.total_orders}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">CA genere</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(totals.total_revenue)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Commissions</p>
            <p className="text-lg font-semibold text-primary-600 dark:text-primary-400">{formatCurrency(totals.total_commission)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Taux moyen</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatPercent(totals.avg_commission_rate)}</p>
          </div>
        </div>
      )}

      {/* Breakdown Table */}
      <div className="px-6 py-4">
        {breakdown.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Routine
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Variant
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Commandes
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    CA
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Taux
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {breakdown.map((row, index) => (
                  <tr key={`${row.routine_id}-${row.variant}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {row.routine_name}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <VariantBadge variant={row.variant} />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                      {row.order_count}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                      {formatCurrency(row.total_revenue)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium text-primary-600 dark:text-primary-400">
                      {formatCurrency(row.total_commission)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                      {formatPercent(row.avg_commission_rate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
