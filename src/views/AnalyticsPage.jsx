/**
 * YEOSKIN - Analytics Page for Admin
 * KPIs, charts, and top creators
 */
import { useState, useEffect } from 'react'
import { format, subMonths } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  TrendingUp,
  DollarSign,
  Users,
  BarChart3,
  Download,
  RefreshCw,
  Calendar,
  Award,
} from 'lucide-react'
import { Layout } from '../components/Layout'
import {
  Card,
  Button,
  Spinner,
  EmptyState,
  useToast,
} from '../components/Common'
import { supabase } from '../lib/supabase'

export const AnalyticsPage = () => {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSales: 0,
    totalCommissions: 0,
    activeCreators: 0,
    commissionCount: 0,
  })
  const [monthlyData, setMonthlyData] = useState([])
  const [topCreators, setTopCreators] = useState([])
  const [statusDistribution, setStatusDistribution] = useState({})

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      // Fetch all commissions
      const { data: commissions, error: commError } = await supabase
        .from('commissions')
        .select('id, creator_id, order_total, commission_amount, status, created_at')

      if (commError) throw commError

      // Fetch creators
      const { data: creators, error: creatorsError } = await supabase
        .from('creators')
        .select('id, email, discount_code, status, commission_rate')

      if (creatorsError) throw creatorsError

      // Calculate stats
      const totalSales = commissions.reduce((sum, c) => sum + Number(c.order_total || 0), 0)
      const totalCommissions = commissions.reduce((sum, c) => sum + Number(c.commission_amount || 0), 0)
      const activeCreators = creators.filter(c => c.status === 'active').length

      // Status distribution
      const statusDist = {}
      commissions.forEach(c => {
        statusDist[c.status] = (statusDist[c.status] || 0) + 1
      })

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
          sales: monthCommissions.reduce((sum, c) => sum + Number(c.order_total || 0), 0),
          commissions: monthCommissions.reduce((sum, c) => sum + Number(c.commission_amount || 0), 0),
          count: monthCommissions.length,
        })
      }

      // Top creators
      const creatorStats = creators.map(creator => {
        const creatorCommissions = commissions.filter(c => c.creator_id === creator.id)
        return {
          ...creator,
          totalSales: creatorCommissions.reduce((sum, c) => sum + Number(c.order_total || 0), 0),
          totalCommissions: creatorCommissions.reduce((sum, c) => sum + Number(c.commission_amount || 0), 0),
          commissionCount: creatorCommissions.length,
          paidCount: creatorCommissions.filter(c => c.status === 'paid').length,
        }
      }).sort((a, b) => b.totalCommissions - a.totalCommissions)

      setStats({
        totalSales,
        totalCommissions,
        activeCreators,
        commissionCount: commissions.length,
      })
      setMonthlyData(months)
      setTopCreators(creatorStats.slice(0, 10))
      setStatusDistribution(statusDist)
    } catch (error) {
      toast.error('Erreur lors du chargement des analytics')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Export to CSV
  const handleExport = () => {
    const csv = [
      ['Mois', 'CA', 'Commissions', 'Nombre'].join(','),
      ...monthlyData.map(m => [m.month, m.sales.toFixed(2), m.commissions.toFixed(2), m.count].join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `yeoskin_analytics_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    toast.success('Export CSV telecharge')
  }

  // Simple bar chart component
  const SimpleBarChart = ({ data, valueKey, label }) => {
    const maxValue = Math.max(...data.map(d => d[valueKey]), 1)

    return (
      <div className="space-y-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-16">{item.month}</span>
            <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all duration-500"
                style={{ width: `${(item[valueKey] / maxValue) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium w-20 text-right">
              {item[valueKey].toFixed(0)}€
            </span>
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <Layout title="Analytics" subtitle="Chargement...">
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout
      title="Analytics"
      subtitle="Vue d'ensemble des performances"
    >
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <Card.Body>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">CA Total</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.totalSales.toFixed(2)}€
                  </p>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Commissions payees</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.totalCommissions.toFixed(2)}€
                  </p>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Createurs actifs</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.activeCreators}
                  </p>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total commissions</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats.commissionCount}
                  </p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Revenue */}
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Revenus mensuels
                </h3>
                <Button variant="secondary" size="sm" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <SimpleBarChart data={monthlyData} valueKey="commissions" label="Commissions" />
            </Card.Body>
          </Card>

          {/* Status Distribution */}
          <Card>
            <Card.Header>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Repartition par statut
              </h3>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3">
                {Object.entries(statusDistribution).map(([status, count]) => {
                  const total = Object.values(statusDistribution).reduce((a, b) => a + b, 0)
                  const percent = total > 0 ? (count / total) * 100 : 0

                  const colors = {
                    pending: 'bg-yellow-500',
                    payable: 'bg-blue-500',
                    paid: 'bg-green-500',
                    canceled: 'bg-red-500',
                  }

                  return (
                    <div key={status} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-20 capitalize">
                        {status}
                      </span>
                      <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors[status] || 'bg-gray-500'} rounded-full`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-16 text-right">
                        {count} ({percent.toFixed(0)}%)
                      </span>
                    </div>
                  )
                })}
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* Top Creators */}
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5" />
                Top Createurs
              </h3>
              <Button variant="secondary" size="sm" onClick={fetchAnalytics}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </Card.Header>

          {topCreators.length === 0 ? (
            <Card.Body>
              <EmptyState
                icon={Users}
                title="Aucun createur"
                description="Les createurs apparaitront ici"
              />
            </Card.Body>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Rang</th>
                    <th>Createur</th>
                    <th>Code</th>
                    <th className="text-right">CA genere</th>
                    <th className="text-right">Commissions</th>
                    <th className="text-right">Nombre</th>
                  </tr>
                </thead>
                <tbody>
                  {topCreators.map((creator, idx) => (
                    <tr key={creator.id}>
                      <td>
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          idx === 0 ? 'bg-yellow-100 text-yellow-800' :
                          idx === 1 ? 'bg-gray-100 text-gray-800' :
                          idx === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-50 text-gray-600'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="font-medium">{creator.email}</td>
                      <td>
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                          {creator.discount_code}
                        </code>
                      </td>
                      <td className="text-right">{creator.totalSales.toFixed(2)}€</td>
                      <td className="text-right font-bold text-green-600">
                        {creator.totalCommissions.toFixed(2)}€
                      </td>
                      <td className="text-right text-gray-500">{creator.commissionCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  )
}

export default AnalyticsPage
