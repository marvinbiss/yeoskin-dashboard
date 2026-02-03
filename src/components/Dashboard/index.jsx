'use client'

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
import { Card, StatusBadge, Spinner, Skeleton, SkeletonKPICard } from '../Common'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// Brand color palette for charts
const CHART_COLORS = {
  primary: '#FF6B9D',
  primaryLight: 'rgba(255, 107, 157, 0.1)',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  neutral: '#9CA3AF',
}

// ============================================================================
// KPI CARDS - Premium Brand Style
// ============================================================================

export const KPICards = ({ stats, loading }) => {
  const kpis = [
    {
      title: 'Montant total payé ce mois-ci',
      value: `${stats.totalPaidThisMonth.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`,
      icon: DollarSign,
      trend: '+23%',
      trendUp: true,
      color: 'brand',
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
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <SkeletonKPICard key={i} />
        ))}
      </div>
    )
  }

  const colorStyles = {
    brand: {
      bg: 'bg-brand-100',
      icon: 'text-brand-600',
      trend: 'text-brand-600',
    },
    success: {
      bg: 'bg-mint-100',
      icon: 'text-mint-600',
      trend: 'text-mint-600',
    },
    warning: {
      bg: 'bg-warning-100',
      icon: 'text-warning-600',
      trend: 'text-warning-600',
    },
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => {
        const colors = colorStyles[kpi.color] || colorStyles.brand
        return (
          <Card key={index} className="p-6" hover>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-500">{kpi.title}</p>
                <p className="text-2xl font-bold text-neutral-900 mt-2 tracking-tight">
                  {kpi.value}
                </p>
                {kpi.trend && (
                  <div className={clsx(
                    'flex items-center gap-1 mt-3 text-sm font-medium',
                    kpi.trendUp ? 'text-mint-600' : 'text-error-600'
                  )}>
                    {kpi.trendUp ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span>{kpi.trend}</span>
                  </div>
                )}
              </div>
              <div className={clsx('p-3 rounded-xl', colors.bg)}>
                <kpi.icon className={clsx('w-6 h-6', colors.icon)} />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

// ============================================================================
// CHART COMPONENT - Premium Brand Style
// ============================================================================

export const PayoutChart = ({ data }) => {
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
        <h3 className="font-semibold text-neutral-900">Tendances des paiements</h3>
      </Card.Header>
      <Card.Body>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#6B7280', fontSize: 12 }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#6B7280', fontSize: 12 }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={false}
                tickFormatter={(value) => `${value} €`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                  padding: '12px 16px',
                }}
                formatter={(value) => [`${value} €`, 'Montant']}
                labelStyle={{ color: '#374151', fontWeight: 600 }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke={CHART_COLORS.primary}
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
// STATUS DISTRIBUTION PIE CHART - Premium Brand Style
// ============================================================================

export const StatusDistribution = ({ data }) => {
  const COLORS = [CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.error, CHART_COLORS.neutral]

  const chartData = data || [
    { name: 'Terminé', value: 65 },
    { name: 'Traitement', value: 20 },
    { name: 'Échec', value: 5 },
    { name: 'En attente', value: 10 },
  ]

  return (
    <Card>
      <Card.Header>
        <h3 className="font-semibold text-neutral-900">État du transfert</h3>
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
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                }}
                formatter={(value) => [`${value}%`, '']}
              />
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
              <span className="text-sm text-neutral-600">
                {entry.name} ({entry.value}%)
              </span>
            </div>
          ))}
        </div>
      </Card.Body>
    </Card>
  )
}

// ============================================================================
// RECENT ACTIVITY - Premium Brand Style
// ============================================================================

export const RecentActivity = ({ transfers, loading }) => {
  if (loading) {
    return (
      <Card>
        <Card.Header>
          <h3 className="font-semibold text-neutral-900">Transferts récents</h3>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="divide-y divide-neutral-100">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <Skeleton className="w-5 h-5 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="w-3/4 h-4 mb-2" />
                  <Skeleton className="w-1/2 h-3" />
                </div>
                <Skeleton className="w-20 h-6 rounded-full" />
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>
    )
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'sent':
        return <CheckCircle key="check" className="w-5 h-5 text-mint-500" />
      case 'failed':
        return <XCircle key="x" className="w-5 h-5 text-error-500" />
      case 'processing':
        return <RefreshCw key="refresh" className="w-5 h-5 text-warning-500 animate-spin" />
      default:
        return <Clock key="clock" className="w-5 h-5 text-neutral-400" />
    }
  }

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-neutral-900">Transferts récents</h3>
          <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-1 rounded-full">
            En direct
          </span>
        </div>
      </Card.Header>
      <Card.Body className="p-0">
        <div className="divide-y divide-neutral-50">
          {transfers.length === 0 ? (
            <div className="py-12 text-center text-neutral-500">
              Aucun transfert récent
            </div>
          ) : (
            transfers.map((transfer) => (
              <div
                key={transfer.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-neutral-50/50 transition-colors"
              >
                {getStatusIcon(transfer.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {Number(transfer.source_amount).toFixed(2)} € → {transfer.creators?.email || 'Inconnu'}
                  </p>
                  <p className="text-xs text-neutral-500">
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
// QUICK ACTIONS - Premium Brand Style
// ============================================================================

export const QuickActions = ({ onTriggerDaily, onViewBatches, loading }) => {
  return (
    <Card>
      <Card.Header>
        <h3 className="font-semibold text-neutral-900">Actions rapides</h3>
      </Card.Header>
      <Card.Body>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onTriggerDaily}
            disabled={loading}
            className={clsx(
              'flex flex-col items-center gap-3 p-4 rounded-xl',
              'border-2 border-dashed border-neutral-200',
              'hover:border-brand-400 hover:bg-brand-50/50',
              'transition-all duration-200 group'
            )}
          >
            <div className="p-3 rounded-xl bg-brand-100 group-hover:scale-110 transition-transform">
              <Wallet className="w-6 h-6 text-brand-600" />
            </div>
            <span className="text-sm font-medium text-neutral-700 text-center">
              Lot quotidien
            </span>
          </button>

          <button
            onClick={onViewBatches}
            className={clsx(
              'flex flex-col items-center gap-3 p-4 rounded-xl',
              'border-2 border-dashed border-neutral-200',
              'hover:border-mint-400 hover:bg-mint-50/50',
              'transition-all duration-200 group'
            )}
          >
            <div className="p-3 rounded-xl bg-mint-100 group-hover:scale-110 transition-transform">
              <CheckCircle className="w-6 h-6 text-mint-600" />
            </div>
            <span className="text-sm font-medium text-neutral-700 text-center">
              Lots en attente
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
