'use client'

import { useNavigate } from '@/lib/navigation'
import { useCreatorAuth } from '../contexts/CreatorAuthContext'
import { useCreatorDashboard } from '../hooks/useCreatorDashboard'
import {
  CreatorLayout,
  BalanceCard,
  PayoutForecast,
  ActivityFeed,
  TierCard,
  PayoutStatusCard,
  RoutineBreakdownCard,
} from '../components'

/**
 * Creator Dashboard - Main page showing balance, forecast, and recent activity
 */
export const CreatorDashboard = () => {
  const navigate = useNavigate()
  const { creator } = useCreatorAuth()

  const {
    loading,
    error,
    dashboard,
    forecast,
    balance,
    recentActivity,
  } = useCreatorDashboard(creator?.id)

  const handleViewAll = () => {
    navigate('/creator/history')
  }

  // Get creator's first name for greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bonjour'
    if (hour < 18) return 'Bon apres-midi'
    return 'Bonsoir'
  }

  const getCreatorName = () => {
    if (creator?.email) {
      const name = creator.email.split('@')[0]
      return name.charAt(0).toUpperCase() + name.slice(1)
    }
    return 'Creator'
  }

  return (
    <CreatorLayout
      title={`${getGreeting()} ${getCreatorName()} !`}
      subtitle="Voici un apercu de vos revenus"
    >
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* VIP Tier Card */}
        {creator?.id && <TierCard creatorId={creator.id} />}

        {/* Balance and Forecast Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BalanceCard balance={balance} loading={loading} />
          <PayoutForecast forecast={forecast} loading={loading} />
        </div>

        {/* Payout Status */}
        {creator?.id && <PayoutStatusCard creatorId={creator.id} />}

        {/* Quick Stats - Commission Status Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Code promo</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {creator?.discount_code || '-'}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Taux commission</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {creator?.commission_rate ? `${(creator.commission_rate * 100).toFixed(0)}%` : '-'}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">En attente</p>
            <p className="text-lg font-semibold text-gray-500">
              {dashboard.pendingCommissions?.count || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-yellow-200 dark:border-yellow-800 p-4 bg-yellow-50 dark:bg-yellow-900/20">
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-1">Verrouillees</p>
            <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
              {dashboard.lockedCommissions?.count || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-4 bg-blue-50 dark:bg-blue-900/20">
            <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Payables</p>
            <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {dashboard.payableCommissions?.count || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-200 dark:border-green-800 p-4 bg-green-50 dark:bg-green-900/20">
            <p className="text-sm text-green-600 dark:text-green-400 mb-1">Payees</p>
            <p className="text-lg font-semibold text-green-600 dark:text-green-400">
              {dashboard.paidCommissions?.count || 0}
            </p>
          </div>
        </div>

        {/* Routine Breakdown */}
        {creator?.id && <RoutineBreakdownCard creatorId={creator.id} />}

        {/* Recent Activity */}
        <ActivityFeed
          activities={recentActivity}
          loading={loading}
          onViewAll={handleViewAll}
        />

        {/* Help Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Besoin d'aide ?
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Si vous avez des questions sur vos commissions ou paiements, n'hesitez pas a nous contacter.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="mailto:support@yeoskin.com"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-600 bg-white dark:bg-gray-800 rounded-lg border border-primary-200 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-900/20"
            >
              Contacter le support
            </a>
          </div>
        </div>
      </div>
    </CreatorLayout>
  )
}
