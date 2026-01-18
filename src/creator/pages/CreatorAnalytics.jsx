/**
 * CreatorAnalytics - Page d'analytics pour les createurs
 */
import { useState, useEffect } from 'react'
import { format, subMonths } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Award,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react'
import { useCreatorAuth } from '../contexts/CreatorAuthContext'
import { CreatorLayout, TierCard } from '../components'
import { supabase } from '../../lib/supabase'

export const CreatorAnalytics = () => {
  const { creator } = useCreatorAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    thisMonth: 0,
    lastMonth: 0,
    change: 0,
    changePercent: 0,
    totalEarned: 0,
    commissionCount: 0,
  })
  const [monthlyData, setMonthlyData] = useState([])
  const [bestMonths, setBestMonths] = useState([])

  useEffect(() => {
    if (creator?.id) {
      fetchAnalytics()
    }
  }, [creator?.id])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      // Fetch all commissions for this creator
      const { data: commissions, error } = await supabase
        .from('commissions')
        .select('commission_amount, status, created_at')
        .eq('creator_id', creator.id)
        .neq('status', 'canceled')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Calculate this month vs last month
      const now = new Date()
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

      const thisMonthCommissions = commissions.filter(c => new Date(c.created_at) >= thisMonthStart)
      const lastMonthCommissions = commissions.filter(c => {
        const d = new Date(c.created_at)
        return d >= lastMonthStart && d <= lastMonthEnd
      })

      const thisMonth = thisMonthCommissions.reduce((sum, c) => sum + Number(c.commission_amount), 0)
      const lastMonth = lastMonthCommissions.reduce((sum, c) => sum + Number(c.commission_amount), 0)
      const change = thisMonth - lastMonth
      const changePercent = lastMonth > 0 ? (change / lastMonth) * 100 : 0

      const totalEarned = commissions.reduce((sum, c) => sum + Number(c.commission_amount), 0)

      // Monthly data (last 6 months)
      const months = []
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i)
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

        const monthCommissions = commissions.filter(c => {
          const d = new Date(c.created_at)
          return d >= monthStart && d <= monthEnd
        })

        months.push({
          month: format(date, 'MMM yyyy', { locale: fr }),
          monthShort: format(date, 'MMM', { locale: fr }),
          revenue: monthCommissions.reduce((sum, c) => sum + Number(c.commission_amount), 0),
          count: monthCommissions.length,
        })
      }

      // Best months
      const allMonths = []
      const monthGroups = {}
      commissions.forEach(c => {
        const key = format(new Date(c.created_at), 'yyyy-MM')
        if (!monthGroups[key]) {
          monthGroups[key] = { date: new Date(c.created_at), revenue: 0 }
        }
        monthGroups[key].revenue += Number(c.commission_amount)
      })

      Object.entries(monthGroups).forEach(([key, value]) => {
        allMonths.push({
          name: format(value.date, 'MMMM yyyy', { locale: fr }),
          revenue: value.revenue,
        })
      })

      allMonths.sort((a, b) => b.revenue - a.revenue)

      setStats({
        thisMonth,
        lastMonth,
        change,
        changePercent,
        totalEarned,
        commissionCount: commissions.length,
      })
      setMonthlyData(months)
      setBestMonths(allMonths.slice(0, 5))
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Simple bar chart
  const SimpleBarChart = ({ data }) => {
    const maxValue = Math.max(...data.map(d => d.revenue), 1)

    return (
      <div className="flex items-end justify-between h-40 gap-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex flex-col items-center flex-1">
            <span className="text-xs font-medium text-gray-900 dark:text-white mb-1">
              {item.revenue > 0 ? `${item.revenue.toFixed(0)}€` : '-'}
            </span>
            <div
              className="w-full bg-primary-500 rounded-t-md transition-all duration-500"
              style={{ height: `${Math.max(4, (item.revenue / maxValue) * 100)}%` }}
            />
            <span className="text-xs text-gray-500 mt-2">{item.monthShort}</span>
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <CreatorLayout title="Mes Analytics" subtitle="Chargement...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
        </div>
      </CreatorLayout>
    )
  }

  return (
    <CreatorLayout
      title="Mes Analytics"
      subtitle="Suivez vos performances"
    >
      <div className="space-y-6">
        {/* KPI Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Mes revenus ce mois</p>
              <DollarSign className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.thisMonth.toFixed(2)}€
            </p>
            <div className="flex items-center gap-1 mt-2">
              {stats.change > 0 ? (
                <ArrowUp className="w-4 h-4 text-green-500" />
              ) : stats.change < 0 ? (
                <ArrowDown className="w-4 h-4 text-red-500" />
              ) : (
                <Minus className="w-4 h-4 text-gray-400" />
              )}
              <span className={`text-sm font-medium ${
                stats.change > 0 ? 'text-green-600' :
                stats.change < 0 ? 'text-red-600' :
                'text-gray-500'
              }`}>
                {stats.change >= 0 ? '+' : ''}{stats.change.toFixed(2)}€ vs mois dernier
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Mes commissions</p>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.commissionCount}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              commissions au total
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Total gagne</p>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-green-600">
              {stats.totalEarned.toFixed(2)}€
            </p>
            <p className="text-sm text-gray-500 mt-2">
              depuis le debut
            </p>
          </div>
        </div>

        {/* VIP Tier */}
        {creator?.id && <TierCard creatorId={creator.id} />}

        {/* Monthly Evolution Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Mon evolution
          </h2>
          <SimpleBarChart data={monthlyData} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Best Months */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              Mes meilleurs mois
            </h3>
            {bestMonths.length === 0 ? (
              <p className="text-gray-500 text-sm">Pas encore de donnees</p>
            ) : (
              <ol className="space-y-2">
                {bestMonths.map((month, idx) => (
                  <li key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-yellow-100 text-yellow-800' :
                        idx === 1 ? 'bg-gray-100 text-gray-800' :
                        idx === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-50 text-gray-600'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="capitalize">{month.name}</span>
                    </div>
                    <span className="font-bold text-green-600">{month.revenue.toFixed(2)}€</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Comparison */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Ce mois vs Mois dernier
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Ce mois</span>
                  <span className="font-medium">{stats.thisMonth.toFixed(2)}€</span>
                </div>
                <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full"
                    style={{ width: `${Math.min(100, (stats.thisMonth / Math.max(stats.thisMonth, stats.lastMonth, 1)) * 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Mois dernier</span>
                  <span className="font-medium">{stats.lastMonth.toFixed(2)}€</span>
                </div>
                <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-400 rounded-full"
                    style={{ width: `${Math.min(100, (stats.lastMonth / Math.max(stats.thisMonth, stats.lastMonth, 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
            <div className={`mt-4 p-3 rounded-lg ${
              stats.changePercent >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
            }`}>
              <p className={`text-sm font-medium ${
                stats.changePercent >= 0 ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
              }`}>
                {stats.changePercent >= 0 ? '📈' : '📉'} {Math.abs(stats.changePercent).toFixed(1)}% {stats.changePercent >= 0 ? 'de hausse' : 'de baisse'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </CreatorLayout>
  )
}

export default CreatorAnalytics
