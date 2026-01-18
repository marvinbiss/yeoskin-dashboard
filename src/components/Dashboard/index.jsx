import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Wallet,
  Percent,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import clsx from 'clsx'
import { Card, StatusBadge, Spinner } from '../Common'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// ============================================================================
// KPI CARDS - FRANÇAIS
// ============================================================================

export const KPICards = ({ stats, loading }) => {
  const kpis = [
    {
      title: 'Montant total payé ce mois-ci',
      value: `${stats.totalPaidThisMonth.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`,
      icon: DollarSign,
      trend: '+23%',
      trendUp: true,
      color: 'primary',
    },
    {
      title: 'Créateurs actifs',
      value: stats.activeCreators,
      icon: Users,
      trend: '+5',
      trendUp: true,
      color: 'success',
    },
    {
      title: 'Lots en attente',
      value: stats.pendingBatches,
      icon: Wallet,
      trend: null,
      color: 'warning',
    },
    {
      title: 'Taux de réussite',
      value: `${stats.successRate}%`,
      icon: Percent,
      trend: stats.successRate >= 95 ? 'Excellent' : 'Attention requise',
      trendUp: stats.successRate >= 95,
      color: stats.successRate >= 95 ? 'success' : 'warning',
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <Card.Body>
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
            </Card.Body>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi, index) => (
        <Card key={index} className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{kpi.title}</p>
              <p className="kpi-value mt-1">{kpi.value}</p>
              {kpi.trend && (
                <p className={clsx('kpi-trend', kpi.trendUp ? 'up' : 'down')}>
                  {kpi.trendUp ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {kpi.trend}
                </p>
              )}
            </div>
            <div className={clsx(
              'p-3 rounded-xl',
              kpi.color === 'primary' && 'bg-primary-100 dark:bg-primary-900/30',
              kpi.color === 'success' && 'bg-success-50 dark:bg-success-500/20',
              kpi.color === 'warning' && 'bg-warning-50 dark:bg-warning-500/20',
            )}>
              <kpi.icon className={clsx(
                'w-6 h-6',
                kpi.color === 'primary' && 'text-primary-600',
                kpi.color === 'success' && 'text-success-600',
                kpi.color === 'warning' && 'text-warning-600',
              )} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

// ============================================================================
// CHART COMPONENT - FRANÇAIS
// ============================================================================

export const PayoutChart = ({ data }) => {
  // Données d'exemple si aucune fournie
  const chartData = data || [
    { name: 'Jan', amount: 4000 },
    { name: 'Fév', amount: 3000 },
    { name: 'Mar', amount: 5000 },
    { name: 'Avr', amount: 4500 },
    { name: 'Mai', amount: 6000 },
    { name: 'Juin', amount: 5500 },
    { name: 'Juil', amount: 7000 },
  ]

  return (
    <Card>
      <Card.Header>
        <h3 className="font-semibold text-gray-900 dark:text-white">Tendances des paiements</h3>
      </Card.Header>
      <Card.Body>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis 
                dataKey="name" 
                className="text-gray-500"
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <YAxis 
                className="text-gray-500"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickFormatter={(value) => `${value} €`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value) => [`${value} €`, 'Montant']}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#0ea5e9" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorAmount)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card.Body>
    </Card>
  )
}

// ============================================================================
// STATUS DISTRIBUTION PIE CHART - FRANÇAIS
// ============================================================================

export const StatusDistribution = ({ data }) => {
  const COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#6b7280']
  
  const chartData = data || [
    { name: 'Terminé', value: 65 },
    { name: 'Traitement', value: 20 },
    { name: 'Échec', value: 5 },
    { name: 'En attente', value: 10 },
  ]

  return (
    <Card>
      <Card.Header>
        <h3 className="font-semibold text-gray-900 dark:text-white">État du transfert</h3>
      </Card.Header>
      <Card.Body>
        <div className="h-64 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} %`, '']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {chartData.map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {entry.name} ({entry.value} %)
              </span>
            </div>
          ))}
        </div>
      </Card.Body>
    </Card>
  )
}

// ============================================================================
// RECENT ACTIVITY - FRANÇAIS
// ============================================================================

export const RecentActivity = ({ transfers, loading }) => {
  if (loading) {
    return (
      <Card>
        <Card.Header>
          <h3 className="font-semibold text-gray-900 dark:text-white">Transferts récents</h3>
        </Card.Header>
        <Card.Body>
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        </Card.Body>
      </Card>
    )
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'sent':
        return <CheckCircle key="check" className="w-5 h-5 text-success-500" />
      case 'failed':
        return <XCircle key="x" className="w-5 h-5 text-danger-500" />
      case 'processing':
        return <RefreshCw key="refresh" className="w-5 h-5 text-warning-500 animate-spin" />
      default:
        return <Clock key="clock" className="w-5 h-5 text-gray-400" />
    }
  }

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">Transferts récents</h3>
          <span className="text-xs text-gray-500">Mises à jour en direct</span>
        </div>
      </Card.Header>
      <Card.Body className="p-0">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {transfers.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              Aucun transfert récent
            </div>
          ) : (
            transfers.map((transfer) => (
              <div 
                key={transfer.id} 
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                {getStatusIcon(transfer.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {Number(transfer.source_amount).toFixed(2)} € → {transfer.creators?.email || 'Inconnu'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(transfer.created_at), 'HH:mm', { locale: fr })} • Frais: {Number(transfer.wise_fee || 0).toFixed(2)} €
                  </p>
                </div>
                <StatusBadge status={transfer.status} />
              </div>
            ))
          )}
        </div>
      </Card.Body>
    </Card>
  )
}

// ============================================================================
// QUICK ACTIONS - FRANÇAIS
// ============================================================================

export const QuickActions = ({ onTriggerDaily, onViewBatches, loading }) => {
  return (
    <Card>
      <Card.Header>
        <h3 className="font-semibold text-gray-900 dark:text-white">Actions rapides</h3>
      </Card.Header>
      <Card.Body>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onTriggerDaily}
            disabled={loading}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all group"
          >
            <div className="p-3 rounded-full bg-primary-100 dark:bg-primary-900/30 group-hover:scale-110 transition-transform">
              <Wallet className="w-6 h-6 text-primary-600" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Déclenchement par lots quotidiens
            </span>
          </button>

          <button
            onClick={onViewBatches}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-success-500 hover:bg-success-50 dark:hover:bg-success-900/20 transition-all group"
          >
            <div className="p-3 rounded-full bg-success-50 dark:bg-success-500/20 group-hover:scale-110 transition-transform">
              <CheckCircle className="w-6 h-6 text-success-600" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Afficher les lots en attente
            </span>
          </button>
        </div>
      </Card.Body>
    </Card>
  )
}

// ============================================================================
// SYSTEM HEALTH CARD - Re-export
// ============================================================================

export { SystemHealthCard } from './SystemHealthCard'
