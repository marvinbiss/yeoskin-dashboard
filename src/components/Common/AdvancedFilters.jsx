/**
 * YEOSKIN DASHBOARD - Advanced Filters Component
 * Reusable filter panel for tables
 */

import { useState } from 'react'
import { Filter, X, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import clsx from 'clsx'
import { Button } from './index'

export const AdvancedFilters = ({
  filters = [],
  values = {},
  onChange,
  onReset,
  onApply,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleChange = (key, value) => {
    onChange?.({ ...values, [key]: value })
  }

  const handleReset = () => {
    const resetValues = {}
    filters.forEach(filter => {
      resetValues[filter.key] = filter.defaultValue ?? ''
    })
    onChange?.(resetValues)
    onReset?.()
  }

  const activeFiltersCount = Object.values(values).filter(v =>
    v !== '' && v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0)
  ).length

  return (
    <div className={clsx('bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700', className)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-gray-900 dark:text-white">
            Filtres
          </span>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Filters Panel */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filters.map((filter) => (
              <div key={filter.key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {filter.label}
                </label>

                {filter.type === 'select' && (
                  <select
                    value={values[filter.key] ?? ''}
                    onChange={(e) => handleChange(filter.key, e.target.value)}
                    className="input"
                  >
                    <option value="">{filter.placeholder || 'Tous'}</option>
                    {filter.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}

                {filter.type === 'text' && (
                  <input
                    type="text"
                    value={values[filter.key] ?? ''}
                    onChange={(e) => handleChange(filter.key, e.target.value)}
                    placeholder={filter.placeholder}
                    className="input"
                  />
                )}

                {filter.type === 'number' && (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={values[`${filter.key}_min`] ?? ''}
                      onChange={(e) => handleChange(`${filter.key}_min`, e.target.value)}
                      placeholder="Min"
                      className="input w-1/2"
                    />
                    <input
                      type="number"
                      value={values[`${filter.key}_max`] ?? ''}
                      onChange={(e) => handleChange(`${filter.key}_max`, e.target.value)}
                      placeholder="Max"
                      className="input w-1/2"
                    />
                  </div>
                )}

                {filter.type === 'date' && (
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={values[`${filter.key}_start`] ?? ''}
                      onChange={(e) => handleChange(`${filter.key}_start`, e.target.value)}
                      className="input w-1/2"
                    />
                    <input
                      type="date"
                      value={values[`${filter.key}_end`] ?? ''}
                      onChange={(e) => handleChange(`${filter.key}_end`, e.target.value)}
                      className="input w-1/2"
                    />
                  </div>
                )}

                {filter.type === 'boolean' && (
                  <select
                    value={values[filter.key] ?? ''}
                    onChange={(e) => handleChange(filter.key, e.target.value)}
                    className="input"
                  >
                    <option value="">Tous</option>
                    <option value="true">Oui</option>
                    <option value="false">Non</option>
                  </select>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <RotateCcw className="w-4 h-4" />
              Réinitialiser
            </button>
            <Button variant="primary" size="sm" onClick={onApply}>
              Appliquer les filtres
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Predefined filter configurations
export const CREATOR_FILTERS = [
  {
    key: 'status',
    label: 'Statut',
    type: 'select',
    options: [
      { value: 'active', label: 'Actif' },
      { value: 'inactive', label: 'Inactif' },
    ],
  },
  {
    key: 'has_bank_account',
    label: 'Compte bancaire',
    type: 'boolean',
  },
  {
    key: 'email',
    label: 'Email',
    type: 'text',
    placeholder: 'Rechercher par email...',
  },
  {
    key: 'earnings',
    label: 'Gains (€)',
    type: 'number',
  },
  {
    key: 'created_at',
    label: 'Date de création',
    type: 'date',
  },
]

export const BATCH_FILTERS = [
  {
    key: 'status',
    label: 'Statut',
    type: 'select',
    options: [
      { value: 'draft', label: 'Brouillon' },
      { value: 'approved', label: 'Approuvé' },
      { value: 'executing', label: 'En cours' },
      { value: 'sent', label: 'Envoyé' },
      { value: 'paid', label: 'Payé' },
    ],
  },
  {
    key: 'amount',
    label: 'Montant (€)',
    type: 'number',
  },
  {
    key: 'created_at',
    label: 'Date de création',
    type: 'date',
  },
]

export const COMMISSION_FILTERS = [
  {
    key: 'status',
    label: 'Statut',
    type: 'select',
    options: [
      { value: 'pending', label: 'En attente' },
      { value: 'locked', label: 'Verrouillé' },
      { value: 'payable', label: 'Payable' },
      { value: 'paid', label: 'Payé' },
      { value: 'canceled', label: 'Annulé' },
    ],
  },
  {
    key: 'amount',
    label: 'Montant (€)',
    type: 'number',
  },
  {
    key: 'created_at',
    label: 'Date',
    type: 'date',
  },
]

export const ADMIN_FILTERS = [
  {
    key: 'role',
    label: 'Rôle',
    type: 'select',
    options: [
      { value: 'super_admin', label: 'Super Admin' },
      { value: 'admin', label: 'Admin' },
      { value: 'viewer', label: 'Lecteur' },
    ],
  },
  {
    key: 'is_active',
    label: 'Statut',
    type: 'boolean',
  },
  {
    key: 'email',
    label: 'Email',
    type: 'text',
    placeholder: 'Rechercher par email...',
  },
  {
    key: 'two_factor_enabled',
    label: '2FA activée',
    type: 'boolean',
  },
]

export default AdvancedFilters
