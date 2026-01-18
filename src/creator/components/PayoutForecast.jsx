import { Calendar, Lock, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { fr } from 'date-fns/locale'

/**
 * Payout forecast widget showing expected payouts and risk indicators
 */
export const PayoutForecast = ({ forecast, loading = false }) => {
  const {
    payable_now = 0,
    locked_amount = 0,
    pending_amount = 0,
    next_unlock_date = null,
    risk_indicators = {},
    can_receive_payout = false,
  } = forecast || {}

  const {
    has_unverified_bank = true,
    has_locked_commissions = false,
    days_to_full_payout = 0,
  } = risk_indicators

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-6"></div>
          <div className="space-y-3">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
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

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return format(date, 'dd MMM yyyy', { locale: fr })
  }

  const getTimeDistance = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return formatDistanceToNow(date, { locale: fr, addSuffix: true })
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-primary-500" />
        Prochain paiement
      </h3>

      {/* Main forecast */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(payable_now)}
          </span>
          {can_receive_payout ? (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              disponible
            </span>
          ) : (
            <span className="text-sm text-gray-500">
              payable maintenant
            </span>
          )}
        </div>
      </div>

      {/* Locked and pending amounts */}
      <div className="space-y-3 mb-6">
        {locked_amount > 0 && (
          <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-800 dark:text-yellow-200">
                En periode de verification
              </span>
            </div>
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              {formatCurrency(locked_amount)}
            </span>
          </div>
        )}

        {pending_amount > 0 && (
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-800 dark:text-blue-200">
                En attente de confirmation
              </span>
            </div>
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              {formatCurrency(pending_amount)}
            </span>
          </div>
        )}
      </div>

      {/* Next unlock date */}
      {next_unlock_date && (
        <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Prochain deblocage : <span className="font-medium">{formatDate(next_unlock_date)}</span>
          </p>
          <p className="text-xs text-gray-500">
            {getTimeDistance(next_unlock_date)}
          </p>
        </div>
      )}

      {/* Risk indicators */}
      {(has_unverified_bank || !can_receive_payout) && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Points d'attention
          </h4>
          <ul className="space-y-2">
            {has_unverified_bank && (
              <li className="text-sm text-orange-700 dark:text-orange-300 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5"></span>
                Compte bancaire non verifie - contactez le support
              </li>
            )}
            {!can_receive_payout && payable_now > 0 && (
              <li className="text-sm text-orange-700 dark:text-orange-300 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5"></span>
                Paiement non disponible - verifiez votre profil
              </li>
            )}
            {days_to_full_payout > 0 && (
              <li className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5"></span>
                {days_to_full_payout} jours avant le deblocage complet
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
