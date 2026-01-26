/**
 * CreatorAnalyticsDashboard - Advanced analytics for creators
 * MODULE 3: Analytics
 */
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useCreatorAuth } from '../contexts/CreatorAuthContext'
import { CreatorLayout } from '../components/CreatorLayout'
import {
  Eye, MousePointer, ShoppingCart, TrendingUp, TrendingDown,
  Calendar, Download, RefreshCw, Smartphone, Monitor, Tablet,
  ExternalLink, Users, DollarSign, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

const COLORS = ['#FF69B4', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B']

export default function CreatorAnalyticsDashboard() {
  const { creator } = useCreatorAuth()
  const [profile, setProfile] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [period, setPeriod] = useState('30')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (creator?.id) {
      fetchAnalytics()
    }
  }, [creator?.id, period])

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get profile
      const { data: profileData, error: profileError } = await supabase
        .from('creator_profiles')
        .select('id, slug, views_count, clicks_count, orders_count')
        .eq('creator_id', creator.id)
        .maybeSingle()

      if (profileError) {
        throw profileError
      }

      if (!profileData) {
        setProfile(null)
        setLoading(false)
        return
      }

      setProfile(profileData)

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(period))

      // Fetch views and clicks in parallel
      const [viewsResult, clicksResult] = await Promise.all([
        supabase
          .from('profile_views')
          .select('viewed_at, device_type, referrer, utm_source')
          .eq('profile_id', profileData.id)
          .gte('viewed_at', startDate.toISOString())
          .order('viewed_at', { ascending: true }),
        supabase
          .from('profile_clicks')
          .select('clicked_at, product_id, converted, conversion_value')
          .eq('profile_id', profileData.id)
          .gte('clicked_at', startDate.toISOString())
          .order('clicked_at', { ascending: true })
      ])

      if (viewsResult.error) {
        console.error('Error fetching views:', viewsResult.error)
      }
      if (clicksResult.error) {
        console.error('Error fetching clicks:', clicksResult.error)
      }

      const views = viewsResult.data
      const clicks = clicksResult.data

      // Process data
      const processedAnalytics = processAnalytics(views || [], clicks || [], parseInt(period))
      setAnalytics(processedAnalytics)
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError(err.message || 'Erreur lors du chargement des analytics')
    } finally {
      setLoading(false)
    }
  }

  const processAnalytics = (views, clicks, days) => {
    // Views by day
    const viewsByDay = {}
    const clicksByDay = {}

    for (let i = days; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const key = date.toISOString().split('T')[0]
      viewsByDay[key] = 0
      clicksByDay[key] = 0
    }

    views.forEach(v => {
      const date = new Date(v.viewed_at).toISOString().split('T')[0]
      if (viewsByDay[date] !== undefined) viewsByDay[date]++
    })

    clicks.forEach(c => {
      const date = new Date(c.clicked_at).toISOString().split('T')[0]
      if (clicksByDay[date] !== undefined) clicksByDay[date]++
    })

    const chartData = Object.keys(viewsByDay).map(date => ({
      date,
      label: new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      views: viewsByDay[date],
      clicks: clicksByDay[date] || 0
    }))

    // Device breakdown
    const devices = { mobile: 0, desktop: 0, tablet: 0 }
    views.forEach(v => {
      const device = v.device_type || 'desktop'
      devices[device] = (devices[device] || 0) + 1
    })

    const deviceData = [
      { name: 'Mobile', value: devices.mobile, icon: Smartphone },
      { name: 'Desktop', value: devices.desktop, icon: Monitor },
      { name: 'Tablet', value: devices.tablet, icon: Tablet }
    ].filter(d => d.value > 0)

    // Top referrers
    const referrers = {}
    views.forEach(v => {
      const ref = v.utm_source || v.referrer || 'direct'
      const cleanRef = ref.includes('instagram') ? 'Instagram' :
                       ref.includes('tiktok') ? 'TikTok' :
                       ref.includes('google') ? 'Google' :
                       ref.includes('facebook') ? 'Facebook' :
                       ref === 'direct' ? 'Direct' : 'Autre'
      referrers[cleanRef] = (referrers[cleanRef] || 0) + 1
    })

    const topReferrers = Object.entries(referrers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    // Stats
    const totalViews = views.length
    const totalClicks = clicks.length
    const conversions = clicks.filter(c => c.converted).length
    const conversionRate = totalClicks > 0 ? ((conversions / totalClicks) * 100).toFixed(1) : 0
    const revenue = clicks.reduce((sum, c) => sum + (c.conversion_value || 0), 0)

    // Previous period comparison
    const midPoint = Math.floor(days / 2)
    const recentViews = views.filter(v => {
      const date = new Date(v.viewed_at)
      const daysAgo = Math.floor((Date.now() - date) / (1000 * 60 * 60 * 24))
      return daysAgo <= midPoint
    }).length
    const olderViews = totalViews - recentViews
    const viewsTrend = olderViews > 0 ? (((recentViews - olderViews) / olderViews) * 100).toFixed(0) : 0

    return {
      chartData,
      deviceData,
      topReferrers,
      stats: {
        totalViews,
        totalClicks,
        conversions,
        conversionRate,
        revenue,
        viewsTrend: parseInt(viewsTrend),
        clickRate: totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : 0
      }
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAnalytics()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <CreatorLayout title="Analytics" subtitle="Statistiques de votre page">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </CreatorLayout>
    )
  }

  if (error) {
    return (
      <CreatorLayout title="Analytics" subtitle="Statistiques de votre page">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
          >
            Réessayer
          </button>
        </div>
      </CreatorLayout>
    )
  }

  if (!profile) {
    return (
      <CreatorLayout title="Analytics" subtitle="Statistiques de votre page">
        <div className="text-center py-12">
          <p className="text-gray-500">Créez d'abord votre page créatrice pour voir les analytics</p>
        </div>
      </CreatorLayout>
    )
  }

  return (
    <CreatorLayout title="Analytics" subtitle="Statistiques de votre page">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="7">7 derniers jours</option>
            <option value="30">30 derniers jours</option>
            <option value="90">90 derniers jours</option>
          </select>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <a
          href={`https://yeoskin.fr/c/${profile.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition"
        >
          <ExternalLink className="w-4 h-4" />
          Voir ma page
        </a>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Vues"
          value={analytics?.stats.totalViews || 0}
          trend={analytics?.stats.viewsTrend}
          icon={Eye}
          color="blue"
        />
        <StatCard
          title="Clics"
          value={analytics?.stats.totalClicks || 0}
          subtitle={`${analytics?.stats.clickRate || 0}% taux de clic`}
          icon={MousePointer}
          color="purple"
        />
        <StatCard
          title="Conversions"
          value={analytics?.stats.conversions || 0}
          subtitle={`${analytics?.stats.conversionRate || 0}% taux`}
          icon={ShoppingCart}
          color="green"
        />
        <StatCard
          title="Revenus estimés"
          value={`${(analytics?.stats.revenue || 0).toFixed(2)}€`}
          icon={DollarSign}
          color="yellow"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vues & Clics</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.chartData || []}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF69B4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF69B4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="#FF69B4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorViews)"
                  name="Vues"
                />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorClicks)"
                  name="Clics"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Appareils</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.deviceData || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(analytics?.deviceData || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {(analytics?.deviceData || []).map((device, index) => (
              <div key={device.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-gray-600">{device.name}</span>
                </div>
                <span className="font-medium text-gray-900">{device.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Referrers */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sources de trafic</h3>
        <div className="space-y-3">
          {(analytics?.topReferrers || []).map((ref, index) => {
            const maxCount = Math.max(...(analytics?.topReferrers || []).map(r => r.count))
            const percentage = maxCount > 0 ? (ref.count / maxCount) * 100 : 0

            return (
              <div key={ref.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">{ref.name}</span>
                  <span className="text-sm font-medium text-gray-900">{ref.count} visites</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: COLORS[index % COLORS.length]
                    }}
                  />
                </div>
              </div>
            )
          })}
          {(!analytics?.topReferrers || analytics.topReferrers.length === 0) && (
            <p className="text-center text-gray-500 py-4">Pas encore de données</p>
          )}
        </div>
      </div>
    </CreatorLayout>
  )
}

// Stat Card Component
function StatCard({ title, value, subtitle, trend, icon: Icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && trend !== 0 && (
          <div className={`flex items-center gap-1 text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{subtitle || title}</p>
      </div>
    </div>
  )
}
