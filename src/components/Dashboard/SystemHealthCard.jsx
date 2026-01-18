/**
 * SystemHealthCard - Displays system health monitoring
 */
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  CreditCard,
  Users,
  Clock,
  AlertOctagon
} from 'lucide-react'
import { useSystemHealth } from '../../hooks/useSystemHealth'

const StatusIcon = ({ status }) => {
  switch (status) {
    case 'HEALTHY':
      return <CheckCircle key="healthy" className="w-5 h-5 text-green-500" />
    case 'WARNING':
      return <AlertTriangle key="warning" className="w-5 h-5 text-yellow-500" />
    case 'CRITICAL':
      return <XCircle key="critical" className="w-5 h-5 text-red-500" />
    default:
      return <Activity key="default" className="w-5 h-5 text-gray-500" />
  }
}

const StatusBadge = ({ status }) => {
  const styles = {
    HEALTHY: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    WARNING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${styles[status] || styles.HEALTHY}`}>
      <StatusIcon status={status} />
      {status}
    </span>
  )
}

const MetricItem = ({ icon: Icon, label, value, warning, critical }) => {
  const isWarning = warning && value >= warning
  const isCritical = critical && value >= critical

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${
      isCritical ? 'bg-red-50 dark:bg-red-900/20' :
      isWarning ? 'bg-yellow-50 dark:bg-yellow-900/20' :
      'bg-gray-50 dark:bg-gray-800'
    }`}>
      <div className="flex items-center gap-3">
        <Icon className={`w-4 h-4 ${
          isCritical ? 'text-red-500' :
          isWarning ? 'text-yellow-500' :
          'text-gray-500'
        }`} />
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      </div>
      <span className={`font-semibold ${
        isCritical ? 'text-red-600' :
        isWarning ? 'text-yellow-600' :
        'text-gray-900 dark:text-white'
      }`}>
        {value}
      </span>
    </div>
  )
}

export const SystemHealthCard = () => {
  const { health, loading, error, refresh } = useSystemHealth()

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5" />
            System Health
          </h3>
        </div>
        <div className="text-center py-4">
          <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Impossible de charger les donnees</p>
          <button
            onClick={refresh}
            className="mt-2 text-sm text-primary-600 hover:underline"
          >
            Reessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Activity className="w-5 h-5" />
          System Health
        </h3>
        <div className="flex items-center gap-3">
          <StatusBadge status={health?.overall_status || 'HEALTHY'} />
          <button
            onClick={refresh}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Rafraichir"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <MetricItem
          icon={AlertOctagon}
          label="Erreurs critiques"
          value={health?.critical_errors || 0}
          warning={1}
          critical={1}
        />
        <MetricItem
          icon={AlertTriangle}
          label="Erreurs (24h)"
          value={health?.errors_24h || 0}
          warning={5}
          critical={10}
        />
        <MetricItem
          icon={XCircle}
          label="Paiements echoues"
          value={health?.failed_payouts || 0}
          warning={1}
          critical={3}
        />
        <MetricItem
          icon={Clock}
          label="Paiements bloques (+48h)"
          value={health?.stuck_payouts || 0}
          warning={1}
          critical={1}
        />
        <MetricItem
          icon={Users}
          label="Createurs sans IBAN"
          value={health?.creators_without_iban || 0}
          warning={5}
          critical={10}
        />
      </div>

      {health?.overall_status === 'CRITICAL' && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">
            Action requise : des erreurs critiques necessitent votre attention
          </p>
        </div>
      )}

      {health?.overall_status === 'WARNING' && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
            Attention : surveillance recommandee
          </p>
        </div>
      )}
    </div>
  )
}

export default SystemHealthCard
