'use client'

/**
 * YEOSKIN DASHBOARD - Global Search Component
 * Search across creators, batches, admins
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from '@/lib/navigation'
import {
  Search,
  X,
  Users,
  FileText,
  Shield,
  DollarSign,
  ArrowRight,
  Loader2
} from 'lucide-react'
import clsx from 'clsx'
import { supabase } from '../../lib/supabase'

// Search categories
const CATEGORIES = {
  creators: { icon: Users, label: 'Créateurs', path: '/creators' },
  batches: { icon: FileText, label: 'Batches', path: '/payouts' },
  admins: { icon: Shield, label: 'Admins', path: '/admins' },
  commissions: { icon: DollarSign, label: 'Commissions', path: '/commissions' },
}

export const GlobalSearch = () => {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const panelRef = useRef(null)

  // Debounced search
  const search = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults({})
      return
    }

    setLoading(true)

    try {
      const searchTerm = `%${searchQuery}%`

      // Search creators
      const { data: creators } = await supabase
        .from('creators')
        .select('id, email, discount_code')
        .or(`email.ilike.${searchTerm},discount_code.ilike.${searchTerm}`)
        .limit(5)

      // Search admins
      const { data: admins } = await supabase
        .from('admin_profiles')
        .select('id, email, full_name')
        .or(`email.ilike.${searchTerm},full_name.ilike.${searchTerm}`)
        .limit(5)

      setResults({
        creators: creators?.map(c => ({
          id: c.id,
          title: c.email,
          subtitle: c.discount_code,
          category: 'creators',
        })) || [],
        admins: admins?.map(a => ({
          id: a.id,
          title: a.email,
          subtitle: a.full_name,
          category: 'admins',
        })) || [],
      })
    } catch (err) {
      console.error('Search error:', err)
      setResults({})
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, search])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
        setTimeout(() => inputRef.current?.focus(), 100)
      }

      // Escape to close
      if (e.key === 'Escape') {
        setIsOpen(false)
        setQuery('')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Flatten results for keyboard navigation
  const flatResults = Object.values(results).flat()

  // Handle result selection
  const handleSelect = (result) => {
    const category = CATEGORIES[result.category]
    if (category) {
      navigate(`${category.path}?id=${result.id}`)
    }
    setIsOpen(false)
    setQuery('')
  }

  // Keyboard navigation in results
  const handleKeyNavigation = (e) => {
    if (!flatResults.length) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % flatResults.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + flatResults.length) % flatResults.length)
    } else if (e.key === 'Enter' && flatResults[selectedIndex]) {
      e.preventDefault()
      handleSelect(flatResults[selectedIndex])
    }
  }

  return (
    <>
      {/* Search Trigger */}
      <button
        onClick={() => {
          setIsOpen(true)
          setTimeout(() => inputRef.current?.focus(), 100)
        }}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors w-64"
      >
        <Search className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-500 flex-1 text-left">Rechercher...</span>
        <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs text-gray-400 bg-gray-200 dark:bg-gray-700 rounded">
          ⌘K
        </kbd>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 animate-fade-in"
            onClick={() => setIsOpen(false)}
          />

          {/* Search Panel */}
          <div
            ref={panelRef}
            className="relative w-full max-w-xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 animate-slide-up"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyNavigation}
                placeholder="Rechercher créateurs, batches, admins..."
                className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
                autoFocus
              />
              {loading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
              {query && !loading && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {query.length < 2 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  <p>Tapez au moins 2 caractères pour rechercher</p>
                  <div className="flex items-center justify-center gap-4 mt-4 text-xs">
                    <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↑↓</kbd> Naviguer</span>
                    <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↵</kbd> Sélectionner</span>
                    <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Esc</kbd> Fermer</span>
                  </div>
                </div>
              ) : flatResults.length === 0 && !loading ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  <p>Aucun résultat pour "{query}"</p>
                </div>
              ) : (
                Object.entries(results).map(([category, items]) => {
                  if (!items.length) return null
                  const config = CATEGORIES[category]
                  const Icon = config?.icon || FileText

                  return (
                    <div key={category}>
                      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50">
                        <p className="text-xs font-medium text-gray-500 uppercase">
                          {config?.label || category}
                        </p>
                      </div>
                      {items.map((item, index) => {
                        const globalIndex = flatResults.indexOf(item)
                        const isSelected = globalIndex === selectedIndex

                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            className={clsx(
                              'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                              isSelected
                                ? 'bg-primary-50 dark:bg-primary-900/30'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            )}
                          >
                            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                              <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {item.title}
                              </p>
                              {item.subtitle && (
                                <p className="text-xs text-gray-500 truncate">
                                  {item.subtitle}
                                </p>
                              )}
                            </div>
                            <ArrowRight className={clsx(
                              'w-4 h-4 text-gray-400 transition-opacity',
                              isSelected ? 'opacity-100' : 'opacity-0'
                            )} />
                          </button>
                        )
                      })}
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400 flex items-center justify-between">
              <span>Recherche globale</span>
              <span>Appuyez sur <kbd className="px-1 bg-gray-100 dark:bg-gray-700 rounded">Esc</kbd> pour fermer</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default GlobalSearch
