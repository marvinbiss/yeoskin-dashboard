'use client'

import { useState, useEffect } from 'react'
import { useNavigate } from '@/lib/navigation'
import { useCreatorAuth } from '../contexts/CreatorAuthContext'
import { supabase } from '../../lib/supabase'
import { Sparkles, Check, Loader2, Package } from 'lucide-react'

/**
 * CreatorOnboarding - Page de selection de routine obligatoire
 * Affichee lors de la premiere connexion du createur
 */
export const CreatorOnboarding = () => {
  const navigate = useNavigate()
  const { creator } = useCreatorAuth()

  const [routines, setRoutines] = useState([])
  const [selectedRoutine, setSelectedRoutine] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Fetch available routines
  useEffect(() => {
    const fetchRoutines = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('routines')
          .select('id, title, slug, objective, description, base_price, image_url')
          .eq('is_active', true)
          .order('title')
          .limit(5)

        if (fetchError) throw fetchError
        setRoutines(data || [])
      } catch (err) {
        console.error('Error fetching routines:', err)
        setError('Impossible de charger les routines')
      } finally {
        setLoading(false)
      }
    }

    fetchRoutines()
  }, [])

  // Handle routine selection
  const handleSelect = (routine) => {
    setSelectedRoutine(routine)
    setError(null)
  }

  // Handle confirmation
  const handleConfirm = async () => {
    if (!selectedRoutine || !creator?.id) return

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/routines/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creator_id: creator.id,
          routine_id: selectedRoutine.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'assignation')
      }

      // Redirect to dashboard
      navigate('/c/creator')
    } catch (err) {
      console.error('Error assigning routine:', err)
      setError(err.message || 'Erreur lors de la selection')
    } finally {
      setSubmitting(false)
    }
  }

  // Format price
  const formatPrice = (price) => {
    if (!price) return '-'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-pink-500 mx-auto" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">Chargement des routines...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Bienvenue chez Yeoskin !
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Choisissez la routine beaute que vous souhaitez promouvoir aupres de votre communaute.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-center">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Routines grid */}
        {routines.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Aucune routine disponible pour le moment</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Veuillez contacter le support pour plus d'informations
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {routines.map((routine) => {
              const isSelected = selectedRoutine?.id === routine.id
              return (
                <button
                  key={routine.id}
                  onClick={() => handleSelect(routine)}
                  className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden transition-all duration-200 text-left ${
                    isSelected
                      ? 'ring-2 ring-pink-500 shadow-lg scale-[1.02]'
                      : 'hover:shadow-md hover:scale-[1.01] border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 z-10 w-7 h-7 bg-pink-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}

                  {/* Image */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 relative">
                    {routine.image_url ? (
                      <img
                        src={routine.image_url}
                        alt={routine.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Sparkles className="w-12 h-12 text-pink-300 dark:text-pink-600" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-5">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {routine.title}
                    </h3>
                    {routine.objective && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                        {routine.objective}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-pink-600 dark:text-pink-400">
                        {formatPrice(routine.base_price)}
                      </span>
                      <span className={`text-sm font-medium ${
                        isSelected
                          ? 'text-pink-600 dark:text-pink-400'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {isSelected ? 'Selectionnee' : 'Cliquez pour choisir'}
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Confirm button */}
        {routines.length > 0 && (
          <div className="text-center">
            <button
              onClick={handleConfirm}
              disabled={!selectedRoutine || submitting}
              className={`inline-flex items-center gap-2 px-8 py-3 rounded-xl text-white font-semibold transition-all ${
                selectedRoutine && !submitting
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Confirmation...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Confirmer ma selection
                </>
              )}
            </button>
            {!selectedRoutine && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                Selectionnez une routine pour continuer
              </p>
            )}
          </div>
        )}

        {/* Info box */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
            Vous pourrez promouvoir cette routine aupres de votre communaute et gagner des commissions sur chaque vente.
            L'equipe Yeoskin peut modifier votre assignation si necessaire.
          </p>
        </div>
      </div>
    </div>
  )
}

export default CreatorOnboarding
