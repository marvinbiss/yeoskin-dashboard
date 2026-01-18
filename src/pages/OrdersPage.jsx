/**
 * OrdersPage - Admin order management
 * MODULE 4: Admin - Orders view & tracking
 */
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Layout } from '../components/Layout'
import { useToast, Card, Spinner, EmptyState, StatusBadge } from '../components/Common'
import {
  ShoppingCart, Search, Filter, Download, RefreshCw,
  ExternalLink, User, Package, Calendar, DollarSign,
  TrendingUp, Eye, ChevronDown
} from 'lucide-react'

export default function OrdersPage() {
  const toast = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateRange, setDateRange] = useState('30')
  const [stats, setStats] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    fetchOrders()
  }, [dateRange, statusFilter])

  const fetchOrders = async () => {
    setLoading(true)

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(dateRange))

    // Fetch orders with creator info
    let query = supabase
      .from('orders')
      .select(`
        *,
        creators (
          id,
          email,
          discount_code
        )
      `)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    const { data, error } = await query

    if (error) {
      console.error('Fetch orders error:', error)
      // Try simpler query without join
      const { data: simpleData, error: simpleError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      if (!simpleError) {
        setOrders(simpleData || [])
        calculateStats(simpleData || [])
      }
    } else {
      setOrders(data || [])
      calculateStats(data || [])
    }
    setLoading(false)
  }

  const calculateStats = (ordersData) => {
    const totalOrders = ordersData.length
    const totalRevenue = ordersData.reduce((sum, o) => sum + (o.total_amount || 0), 0)
    const paidOrders = ordersData.filter(o => o.status === 'paid' || o.status === 'completed')
    const pendingOrders = ordersData.filter(o => o.status === 'pending')
    const affiliateOrders = ordersData.filter(o => o.creator_id)

    setStats({
      totalOrders,
      totalRevenue,
      paidOrders: paidOrders.length,
      pendingOrders: pendingOrders.length,
      affiliateOrders: affiliateOrders.length,
      affiliateRate: totalOrders > 0 ? ((affiliateOrders.length / totalOrders) * 100).toFixed(1) : 0
    })
  }

  const filteredOrders = orders.filter(order => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      order.order_number?.toLowerCase().includes(searchLower) ||
      order.customer_email?.toLowerCase().includes(searchLower) ||
      order.creators?.email?.toLowerCase().includes(searchLower) ||
      order.creators?.discount_code?.toLowerCase().includes(searchLower)
    )
  })

  const handleExport = () => {
    if (filteredOrders.length === 0) {
      toast.warning('Aucune commande a exporter')
      return
    }

    const headers = ['Numero', 'Date', 'Client', 'Montant', 'Statut', 'Createur', 'Code Promo']
    const rows = filteredOrders.map(order => [
      order.order_number || order.shopify_order_id || order.id,
      format(new Date(order.created_at), 'dd/MM/yyyy HH:mm'),
      order.customer_email || '-',
      `${(order.total_amount || 0).toFixed(2)}€`,
      order.status || '-',
      order.creators?.email || '-',
      order.creators?.discount_code || order.discount_code || '-'
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `commandes_${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
    URL.revokeObjectURL(url)

    toast.success(`${filteredOrders.length} commandes exportees`)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'refunded':
        return 'bg-red-100 text-red-700'
      case 'cancelled':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-blue-100 text-blue-700'
    }
  }

  const getStatusLabel = (status) => {
    const labels = {
      completed: 'Complete',
      paid: 'Paye',
      pending: 'En attente',
      refunded: 'Rembourse',
      cancelled: 'Annule',
      processing: 'En cours'
    }
    return labels[status] || status
  }

  if (loading && orders.length === 0) {
    return (
      <Layout title="Commandes" subtitle="Gerez les commandes et le suivi">
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Commandes" subtitle="Gerez les commandes et le suivi">
      <div className="space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card>
              <Card.Body>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                    <p className="text-xs text-gray-500">Total commandes</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
            <Card>
              <Card.Body>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalRevenue.toFixed(0)}€</p>
                    <p className="text-xs text-gray-500">Chiffre d'affaires</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
            <Card>
              <Card.Body>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Package className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.paidOrders}</p>
                    <p className="text-xs text-gray-500">Payees</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
            <Card>
              <Card.Body>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
                    <p className="text-xs text-gray-500">En attente</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
            <Card>
              <Card.Body>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.affiliateOrders}</p>
                    <p className="text-xs text-gray-500">Via createurs</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
            <Card>
              <Card.Body>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.affiliateRate}%</p>
                    <p className="text-xs text-gray-500">Taux affiliation</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <Card.Body>
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par numero, email, code promo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input w-40"
              >
                <option value="">Tous les statuts</option>
                <option value="paid">Paye</option>
                <option value="completed">Complete</option>
                <option value="pending">En attente</option>
                <option value="refunded">Rembourse</option>
                <option value="cancelled">Annule</option>
              </select>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="input w-40"
              >
                <option value="7">7 derniers jours</option>
                <option value="30">30 derniers jours</option>
                <option value="90">90 derniers jours</option>
                <option value="365">Cette annee</option>
              </select>
              <button
                onClick={fetchOrders}
                className="btn-secondary flex items-center gap-2"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
              <button
                onClick={handleExport}
                className="btn-primary flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exporter
              </button>
            </div>
          </Card.Body>
        </Card>

        {/* Orders Table */}
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                Commandes ({filteredOrders.length})
              </h3>
            </div>
          </Card.Header>

          {filteredOrders.length === 0 ? (
            <Card.Body>
              <EmptyState
                icon={ShoppingCart}
                title="Aucune commande"
                description="Les commandes apparaitront ici lorsqu'elles seront creees"
              />
            </Card.Body>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Commande</th>
                    <th>Date</th>
                    <th>Client</th>
                    <th>Montant</th>
                    <th>Statut</th>
                    <th>Createur</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td>
                        <span className="font-mono text-sm font-medium">
                          {order.order_number || order.shopify_order_id || order.id.slice(0, 8)}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm text-gray-500">
                          {format(new Date(order.created_at), 'dd MMM yyyy, HH:mm', { locale: fr })}
                        </span>
                      </td>
                      <td>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {order.customer_email || 'N/A'}
                          </p>
                          {order.customer_name && (
                            <p className="text-xs text-gray-500">{order.customer_name}</p>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="font-medium text-gray-900">
                          {(order.total_amount || 0).toFixed(2)}€
                        </span>
                      </td>
                      <td>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td>
                        {order.creators ? (
                          <div>
                            <p className="text-sm text-gray-900">{order.creators.email}</p>
                            <p className="text-xs text-primary-600 font-medium">
                              {order.creators.discount_code}
                            </p>
                          </div>
                        ) : order.discount_code ? (
                          <span className="text-xs text-gray-500">{order.discount_code}</span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Commande {selectedOrder.order_number || selectedOrder.id.slice(0, 8)}
                  </h3>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">
                      {format(new Date(selectedOrder.created_at), 'dd MMMM yyyy, HH:mm', { locale: fr })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Statut</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusLabel(selectedOrder.status)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Montant total</p>
                    <p className="text-xl font-bold text-gray-900">
                      {(selectedOrder.total_amount || 0).toFixed(2)}€
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Client</p>
                    <p className="font-medium">{selectedOrder.customer_email || 'N/A'}</p>
                  </div>
                </div>

                {selectedOrder.creators && (
                  <div className="p-4 bg-primary-50 rounded-lg">
                    <p className="text-sm text-primary-600 font-medium mb-2">Commande via createur</p>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{selectedOrder.creators.email}</p>
                        <p className="text-sm text-primary-600">Code: {selectedOrder.creators.discount_code}</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedOrder.items && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Articles</p>
                    <div className="space-y-2">
                      {(typeof selectedOrder.items === 'string' ? JSON.parse(selectedOrder.items) : selectedOrder.items).map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span>{item.name || item.title}</span>
                          <span className="font-medium">{item.quantity}x {item.price}€</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedOrder.shopify_order_id && (
                  <a
                    href={`https://admin.shopify.com/orders/${selectedOrder.shopify_order_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Voir sur Shopify
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
