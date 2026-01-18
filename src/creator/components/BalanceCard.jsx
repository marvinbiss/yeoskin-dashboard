import { Wallet, TrendingUp, TrendingDown, CreditCard } from 'lucide-react'

/**
 * Balance card showing current balance and financial summary
 */
export const BalanceCard = ({ balance, loading = false }) => {
  const {
    current_balance = 0,
    total_earned = 0,
    total_paid = 0,
    total_fees = 0,
  } = balance || {}

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-6"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
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

  return (
    <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl shadow-lg p-6 text-white">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <Wallet className="w-5 h-5" />
        </div>
        <span className="text-sm font-medium text-white/80">Solde actuel</span>
      </div>

      <div className="mb-6">
        <p className="text-4xl font-bold">
          {formatCurrency(current_balance)}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/10 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-300" />
            <span className="text-xs text-white/70">Total gagne</span>
          </div>
          <p className="text-lg font-semibold">{formatCurrency(total_earned)}</p>
        </div>

        <div className="bg-white/10 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-4 h-4 text-blue-300" />
            <span className="text-xs text-white/70">Total paye</span>
          </div>
          <p className="text-lg font-semibold">{formatCurrency(total_paid)}</p>
        </div>

        <div className="bg-white/10 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-orange-300" />
            <span className="text-xs text-white/70">Frais</span>
          </div>
          <p className="text-lg font-semibold">{formatCurrency(total_fees)}</p>
        </div>
      </div>
    </div>
  )
}
