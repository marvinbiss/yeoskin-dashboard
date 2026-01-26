'use client'

import { useState, useEffect } from 'react'
import { useNavigate } from '@/lib/navigation'
import { useCreatorAuth } from '../contexts/CreatorAuthContext'
import { useCreatorDashboard } from '../hooks/useCreatorDashboard'
import { supabase } from '../../lib/supabase'
import {
  CreatorLayout,
  BalanceCard,
  PayoutForecast,
  ActivityFeed,
  TierCard,
  PayoutStatusCard,
  RoutineBreakdownCard,
} from '../components'
import { Sparkles, ExternalLink, Copy, Check, Package, ChevronRight, Loader2 } from 'lucide-react'

/**
 * Creator Dashboard - Main page showing balance, forecast, and recent activity
 */
export const CreatorDashboard = () => {
  const navigate = useNavigate()
  const { creator } = useCreatorAuth()

  const {
    loading,
    error,
    dashboard,
    forecast,
    balance,
    recentActivity,
  } = useCreatorDashboard(creator?.id)

  const [assignedRoutine, setAssignedRoutine] = useState(null)
  const [availableRoutines, setAvailableRoutines] = useState([])
  const [loadingRoutines, setLoadingRoutines] = useState(true)
  const [assigningRoutine, setAssigningRoutine] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (creator?.id) {
      fetchAssignedRoutine()
    }
  }, [creator?.id])

  const fetchAssignedRoutine = async () => {
    setLoadingRoutines(true)
    const { data } = await supabase
      .from('creator_routines')
      .select('routine_id, routines(id, title, slug, objective, base_price)')
      .eq('creator_id', creator.id)
      .eq('is_active', true)
      .maybeSingle()

    if (data?.routines) {
      setAssignedRoutine(data.routines)
      setLoadingRoutines(false)
    } else {
      // Pas de routine assignée, charger les routines disponibles
      await fetchAvailableRoutines()
    }
  }

  const fetchAvailableRoutines = async () => {
    const { data } = await supabase
      .from('routines')
      .select('id, title, slug, objective, base_price, image_url')
      .eq('is_active', true)
      .order('title')

    setAvailableRoutines(data || [])
    setLoadingRoutines(false)
  }

  const handleSelectRoutine = async (routine) => {
    setAssigningRoutine(true)
    try {
      const response = await fetch('/api/routines/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creator_id: creator.id,
          routine_id: routine.id,
        }),
      })

      if (response.ok) {
        setAssignedRoutine(routine)
        setAvailableRoutines([])
      }
    } catch (error) {
      console.error('Error assigning routine:', error)
    } finally {
      setAssigningRoutine(false)
    }
  }

  const getRoutineUrl = () => {
    if (!assignedRoutine || !creator?.slug) return ''
    return `${window.location.origin}/shop/${assignedRoutine.slug}?creator=${creator.slug}`
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getRoutineUrl())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleViewAll = () => {
    navigate('/c/creator/history')
  }

  // Get creator's first name for greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bonjour'
    if (hour < 18) return 'Bon apres-midi'
    return 'Bonsoir'
  }

  const getCreatorName = () => {
    if (creator?.email) {
      const name = creator.email.split('@')[0]
      return name.charAt(0).toUpperCase() + name.slice(1)
    }
    return 'Creator'
  }

  return (
    <CreatorLayout
      title={`${getGreeting()} ${getCreatorName()} !`}
      subtitle="Voici un apercu de vos revenus"
    >
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="space-y-4 sm:space-y-6">
        {/* VIP Tier Card */}
        {creator?.id && <TierCard creatorId={creator.id} />}

        {/* Routine Selection (First time setup) */}
        {!loadingRoutines && !assignedRoutine && availableRoutines.length > 0 && (
          <div className="bg-gradient-to-r from-pink-50 via-purple-50 to-indigo-50 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 sm:p-6 border-2 border-dashed border-pink-300 dark:border-pink-700">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Bienvenue ! Choisis ta routine
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Sélectionne la routine que tu souhaites promouvoir. Tu pourras la partager avec ta communauté.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableRoutines.map((routine) => (
                <button
                  key={routine.id}
                  onClick={() => handleSelectRoutine(routine)}
                  disabled={assigningRoutine}
                  className="group relative bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:border-pink-400 dark:hover:border-pink-500 transition-all hover:shadow-lg text-left disabled:opacity-50"
                >
                  {routine.image_url && (
                    <div className="w-full h-32 rounded-lg overflow-hidden mb-3 bg-gray-100 dark:bg-gray-700">
                      <img
                        src={routine.image_url}
                        alt={routine.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                    {routine.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                    {routine.objective}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-pink-600 dark:text-pink-400">
                      {routine.base_price?.toFixed(2)} €
                    </span>
                    <span className="text-sm text-pink-600 dark:text-pink-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Choisir <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                  {assigningRoutine && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 rounded-xl flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-pink-600 animate-spin" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading state for routines */}
        {loadingRoutines && !assignedRoutine && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-pink-600 animate-spin mr-3" />
            <span className="text-gray-600 dark:text-gray-300">Chargement des routines...</span>
          </div>
        )}

        {/* Assigned Routine Card */}
        {assignedRoutine && (
          <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl p-4 sm:p-6 border border-violet-200 dark:border-violet-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Ma Routine</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{assignedRoutine.objective}</p>
              </div>
            </div>
            <p className="text-lg font-bold text-violet-700 dark:text-violet-300 mb-4">
              {assignedRoutine.title}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={getRoutineUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Voir ma page routine
              </a>
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-medium"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copie !' : 'Copier le lien'}
              </button>
            </div>
          </div>
        )}

        {/* Balance and Forecast Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <BalanceCard balance={balance} loading={loading} />
          <PayoutForecast forecast={forecast} loading={loading} />
        </div>

        {/* Payout Status */}
        {creator?.id && <PayoutStatusCard creatorId={creator.id} />}

        {/* Quick Stats - Commission Status Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Statut</p>
            <p className={`text-base sm:text-lg font-semibold ${
              creator?.status === 'active'
                ? 'text-green-600 dark:text-green-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              {creator?.status === 'active' ? 'Actif' : creator?.status === 'inactive' ? 'Inactif' : '-'}
            </p>
          </div>
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4"
            style={creator?.tier?.color ? { borderColor: creator.tier.color, borderWidth: '2px' } : {}}
          >
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Tier</p>
            <p
              className="text-base sm:text-lg font-semibold"
              style={{ color: creator?.tier?.color || 'inherit' }}
            >
              {creator?.tier?.display_name || '-'}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Taux commission</p>
            <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              {creator?.commission_rate ? `${(creator.commission_rate * 100).toFixed(0)}%` : '-'}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Code promo</p>
            <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
              {creator?.discount_code || '-'}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">En attente</p>
            <p className="text-base sm:text-lg font-semibold text-gray-500">
              {dashboard.pendingCommissions?.count || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-yellow-200 dark:border-yellow-800 p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20">
            <p className="text-xs sm:text-sm text-yellow-600 dark:text-yellow-400 mb-1">Verrouillees</p>
            <p className="text-base sm:text-lg font-semibold text-yellow-600 dark:text-yellow-400">
              {dashboard.lockedCommissions?.count || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20">
            <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 mb-1">Payables</p>
            <p className="text-base sm:text-lg font-semibold text-blue-600 dark:text-blue-400">
              {dashboard.payableCommissions?.count || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-200 dark:border-green-800 p-3 sm:p-4 bg-green-50 dark:bg-green-900/20">
            <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 mb-1">Payees</p>
            <p className="text-base sm:text-lg font-semibold text-green-600 dark:text-green-400">
              {dashboard.paidCommissions?.count || 0}
            </p>
          </div>
        </div>

        {/* Routine Breakdown */}
        {creator?.id && <RoutineBreakdownCard creatorId={creator.id} />}

        {/* Recent Activity */}
        <ActivityFeed
          activities={recentActivity}
          loading={loading}
          onViewAll={handleViewAll}
        />

        {/* Help Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 sm:p-6 border border-blue-100 dark:border-blue-800">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Besoin d'aide ?
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-3 sm:mb-4">
            Si vous avez des questions sur vos commissions ou paiements, n'hesitez pas a nous contacter.
          </p>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <a
              href="mailto:support@yeoskin.com"
              className="inline-flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-primary-600 bg-white dark:bg-gray-800 rounded-lg border border-primary-200 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-900/20"
            >
              Contacter le support
            </a>
          </div>
        </div>
      </div>
    </CreatorLayout>
  )
}
