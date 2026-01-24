'use client'

/**
 * ApplicationsPage - Admin view for managing creator applications
 */
import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Instagram,
  Youtube,
  ExternalLink,
  ChevronDown,
  Sparkles,
  RefreshCw,
  AlertCircle,
  TrendingUp
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Layout } from '../components/Layout'
import { Card, Spinner, Button, useToast, StatusBadge, EmptyState } from '../components/Common'

const STATUS_CONFIG = {
  pending: { label: 'En attente', color: 'warning', icon: Clock },
  under_review: { label: 'En cours', color: 'primary', icon: Eye },
  approved: { label: 'Approuvé', color: 'success', icon: CheckCircle2 },
  rejected: { label: 'Refusé', color: 'danger', icon: XCircle },
  waitlist: { label: 'Liste d\'attente', color: 'gray', icon: Clock },
}

const TIER_COLORS = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
}

export default function ApplicationsPage() {
  const { showToast } = useToast()
  const [applications, setApplications] = useState([])
  const [stats, setStats] = useState(null)
  const [tiers, setTiers] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

  // Modal state
  const [selectedApp, setSelectedApp] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [processing, setProcessing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      // Fetch applications
      let query = supabase
        .from('creator_applications')
        .select('*, suggested_tier:commission_tiers(name, display_name, commission_rate, color)')
        .order(sortBy, { ascending: sortOrder === 'asc' })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (search) {
        query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,instagram_handle.ilike.%${search}%`)
      }

      const { data: appsData, error: appsError } = await query.limit(100)

      if (appsError) throw appsError
      setApplications(appsData || [])

      // Fetch stats
      const { data: statsData } = await supabase
        .from('v_application_stats')
        .select('*')
        .single()

      setStats(statsData)

      // Fetch tiers
      const { data: tiersData } = await supabase
        .from('commission_tiers')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      setTiers(tiersData || [])
    } catch (error) {
      console.error('Fetch error:', error)
      showToast('Erreur lors du chargement', 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [search, statusFilter, sortBy, sortOrder, showToast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const handleApprove = async (app, tierId = null) => {
    setProcessing(true)
    try {
      // 1. Check if creator already exists with this email
      const { data: existingCreator } = await supabase
        .from('creators')
        .select('id')
        .eq('email', app.email.toLowerCase())
        .maybeSingle()

      if (existingCreator) {
        // Already exists, just update application status
        await supabase
          .from('creator_applications')
          .update({
            status: 'approved',
            reviewed_at: new Date().toISOString(),
            review_notes: 'Approved by admin',
          })
          .eq('id', app.id)

        showToast(`${app.first_name} ${app.last_name} existe déjà dans les créateurs`, 'success')
        setShowModal(false)
        setSelectedApp(null)
        fetchData()
        return
      }

      // 2. Get commission rate from tier
      const selectedTierId = tierId || app.suggested_tier_id
      let commissionRate = 0.15 // default Bronze

      if (selectedTierId) {
        const { data: tierData } = await supabase
          .from('commission_tiers')
          .select('commission_rate')
          .eq('id', selectedTierId)
          .maybeSingle()

        if (tierData?.commission_rate) {
          commissionRate = tierData.commission_rate
        }
      }

      // 3. Generate unique discount code
      const prefix = (app.first_name || 'YEO').substring(0, 3).toUpperCase()
      const hash = Array.from(app.email + Date.now())
        .reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0)
      let discountCode = prefix + Math.abs(hash).toString(36).substring(0, 5).toUpperCase()

      // Ensure uniqueness
      const { data: codeExists } = await supabase
        .from('creators')
        .select('id')
        .eq('discount_code', discountCode)
        .maybeSingle()

      if (codeExists) {
        discountCode = prefix + Math.random().toString(36).substring(2, 7).toUpperCase()
      }

      // 4. Generate slug
      const slug = `${(app.first_name || '').toLowerCase()}-${(app.last_name || '').toLowerCase()}`
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      let finalSlug = slug
      const { data: slugExists } = await supabase
        .from('creators')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()

      if (slugExists) {
        finalSlug = slug + '-' + Math.random().toString(36).substring(2, 6)
      }

      // 5. Create the creator
      const { data: newCreator, error: insertError } = await supabase
        .from('creators')
        .insert({
          email: app.email.toLowerCase(),
          discount_code: discountCode,
          commission_rate: commissionRate,
          tier_id: selectedTierId || null,
          slug: finalSlug,
          status: 'active',
        })
        .select('id')
        .single()

      if (insertError) throw insertError

      // 6. Update application status
      const { error: updateError } = await supabase
        .from('creator_applications')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          review_notes: 'Approved by admin',
        })
        .eq('id', app.id)

      if (updateError) {
        console.error('Application update error:', updateError)
        // Creator was created, just warn about status update
      }

      showToast(`${app.first_name} ${app.last_name} approuvé(e) ! Code: ${discountCode}`, 'success')
      setShowModal(false)
      setSelectedApp(null)
      fetchData()
    } catch (error) {
      console.error('Approve error:', error)
      showToast(`Erreur: ${error.message || 'Erreur lors de l\'approbation'}`, 'error')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async (app, reason = '') => {
    setProcessing(true)
    try {
      const { error } = await supabase
        .from('creator_applications')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason || 'Profil non retenu',
        })
        .eq('id', app.id)

      if (error) throw error

      showToast(`Candidature de ${app.first_name} refusée`, 'success')
      setShowModal(false)
      setSelectedApp(null)
      fetchData()
    } catch (error) {
      console.error('Reject error:', error)
      showToast('Erreur lors du refus', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const formatFollowers = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Spinner size="lg" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Candidatures créateurs
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Gérez les demandes d'inscription au programme créateur
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            variant="secondary"
            className="flex items-center gap-2"
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending || 0}</p>
                  <p className="text-sm text-gray-500">En attente</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.approved || 0}</p>
                  <p className="text-sm text-gray-500">Approuvées</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.rejected || 0}</p>
                  <p className="text-sm text-gray-500">Refusées</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.auto_approved || 0}</p>
                  <p className="text-sm text-gray-500">Auto-approuvées</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.last_7_days || 0}</p>
                  <p className="text-sm text-gray-500">7 derniers jours</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, email, Instagram..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input w-40"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="under_review">En cours</option>
                <option value="approved">Approuvées</option>
                <option value="rejected">Refusées</option>
              </select>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-')
                  setSortBy(field)
                  setSortOrder(order)
                }}
                className="input w-48"
              >
                <option value="created_at-desc">Plus récentes</option>
                <option value="created_at-asc">Plus anciennes</option>
                <option value="total_followers-desc">Plus de followers</option>
                <option value="total_followers-asc">Moins de followers</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Applications Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Candidat</th>
                  <th>Réseaux sociaux</th>
                  <th>Followers</th>
                  <th>Tier suggéré</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <EmptyState
                        icon={Users}
                        title="Aucune candidature"
                        description="Aucune candidature ne correspond à vos critères"
                      />
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {app.first_name} {app.last_name}
                          </p>
                          <p className="text-sm text-gray-500">{app.email}</p>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {app.instagram_handle && (
                            <a
                              href={`https://instagram.com/${app.instagram_handle}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-pink-500 hover:text-pink-600"
                            >
                              <Instagram className="w-4 h-4" />
                              <span className="text-sm">@{app.instagram_handle}</span>
                            </a>
                          )}
                          {app.tiktok_handle && (
                            <span className="text-sm text-gray-500">TikTok</span>
                          )}
                          {app.youtube_handle && (
                            <Youtube className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {formatFollowers(app.total_followers)}
                          </span>
                          {app.auto_approved && (
                            <Sparkles className="w-4 h-4 text-purple-500" />
                          )}
                        </div>
                      </td>
                      <td>
                        {app.suggested_tier && (
                          <span
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${app.suggested_tier.color}20`,
                              color: app.suggested_tier.color,
                            }}
                          >
                            {app.suggested_tier.display_name} ({(app.suggested_tier.commission_rate * 100).toFixed(0)}%)
                          </span>
                        )}
                      </td>
                      <td>
                        <StatusBadge
                          status={app.status}
                          config={STATUS_CONFIG}
                        />
                      </td>
                      <td>
                        <span className="text-sm text-gray-500">
                          {format(new Date(app.created_at), 'dd MMM yyyy', { locale: fr })}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedApp(app)
                              setShowModal(true)
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {app.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => handleApprove(app)}
                                disabled={processing}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleReject(app)}
                                disabled={processing}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Detail Modal */}
        {showModal && selectedApp && (
          <ApplicationDetailModal
            app={selectedApp}
            tiers={tiers}
            onClose={() => {
              setShowModal(false)
              setSelectedApp(null)
            }}
            onApprove={handleApprove}
            onReject={handleReject}
            processing={processing}
          />
        )}
      </div>
    </Layout>
  )
}

// Application Detail Modal
function ApplicationDetailModal({ app, tiers, onClose, onApprove, onReject, processing }) {
  const [selectedTier, setSelectedTier] = useState(app.suggested_tier_id)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  const formatFollowers = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {app.first_name} {app.last_name}
              </h2>
              <p className="text-gray-500">{app.email}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
              <Instagram className="w-6 h-6 text-pink-500 mx-auto mb-2" />
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatFollowers(app.instagram_followers || 0)}
              </p>
              <p className="text-sm text-gray-500">Instagram</p>
              {app.instagram_handle && (
                <a
                  href={`https://instagram.com/${app.instagram_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-pink-500 hover:underline"
                >
                  @{app.instagram_handle}
                </a>
              )}
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <svg className="w-6 h-6 mx-auto mb-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
              </svg>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatFollowers(app.tiktok_followers || 0)}
              </p>
              <p className="text-sm text-gray-500">TikTok</p>
              {app.tiktok_handle && (
                <span className="text-xs text-gray-500">@{app.tiktok_handle}</span>
              )}
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <Youtube className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatFollowers(app.youtube_subscribers || 0)}
              </p>
              <p className="text-sm text-gray-500">YouTube</p>
              {app.youtube_handle && (
                <span className="text-xs text-red-500">@{app.youtube_handle}</span>
              )}
            </div>
          </div>

          {/* Total followers */}
          <div className={`p-4 rounded-xl ${app.total_followers >= 5000 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Total followers</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatFollowers(app.total_followers)}
                </span>
                {app.auto_approved && (
                  <span className="flex items-center gap-1 text-green-600 text-sm">
                    <Sparkles className="w-4 h-4" />
                    Auto-éligible
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Motivation */}
          {app.motivation && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Motivation</h3>
              <p className="text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                {app.motivation}
              </p>
            </div>
          )}

          {/* Content types */}
          {app.content_type?.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Types de contenu</h3>
              <div className="flex flex-wrap gap-2">
                {app.content_type.map((type) => (
                  <span
                    key={type}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tier selection */}
          {app.status === 'pending' && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Tier à attribuer</h3>
              <div className="grid grid-cols-3 gap-3">
                {tiers.map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => setSelectedTier(tier.id)}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      selectedTier === tier.id
                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full mx-auto mb-2"
                      style={{ backgroundColor: tier.color }}
                    />
                    <p className="font-semibold text-gray-900 dark:text-white">{tier.display_name}</p>
                    <p className="text-sm text-gray-500">{(tier.commission_rate * 100).toFixed(0)}%</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Rejection form */}
          {showRejectForm && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Raison du refus</h3>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Expliquez la raison du refus (optionnel)..."
                className="input resize-none"
                rows={3}
              />
            </div>
          )}

          {/* Meta info */}
          <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
            <p>Source: {app.source || 'Organique'}</p>
            <p>Expérience: {app.experience_level}</p>
            <p>Pays: {app.country}</p>
            <p>ID: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{app.id}</code></p>
          </div>
        </div>

        {/* Actions */}
        {app.status === 'pending' && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            {!showRejectForm ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setShowRejectForm(true)}
                  disabled={processing}
                >
                  Refuser
                </Button>
                <Button
                  variant="primary"
                  onClick={() => onApprove(app, selectedTier)}
                  disabled={processing}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                >
                  {processing ? 'Traitement...' : 'Approuver'}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setShowRejectForm(false)}
                  disabled={processing}
                >
                  Annuler
                </Button>
                <Button
                  variant="danger"
                  onClick={() => onReject(app, rejectionReason)}
                  disabled={processing}
                >
                  {processing ? 'Traitement...' : 'Confirmer le refus'}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
