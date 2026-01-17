/**
 * YEOSKIN DASHBOARD - Bulk Actions Component
 * Selection and bulk operations for tables
 */

import { useState } from 'react'
import {
  CheckSquare,
  Square,
  MinusSquare,
  Trash2,
  Download,
  ToggleLeft,
  ToggleRight,
  X
} from 'lucide-react'
import clsx from 'clsx'
import { Button } from './index'

export const BulkActions = ({
  items = [],
  selectedIds = [],
  onSelectionChange,
  actions = [],
  idKey = 'id',
  className,
}) => {
  const [isProcessing, setIsProcessing] = useState(false)

  const allSelected = items.length > 0 && selectedIds.length === items.length
  const someSelected = selectedIds.length > 0 && selectedIds.length < items.length
  const noneSelected = selectedIds.length === 0

  // Toggle all selection
  const handleToggleAll = () => {
    if (allSelected) {
      onSelectionChange([])
    } else {
      onSelectionChange(items.map(item => item[idKey]))
    }
  }

  // Toggle single item
  const handleToggleItem = (id) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(i => i !== id))
    } else {
      onSelectionChange([...selectedIds, id])
    }
  }

  // Clear selection
  const handleClearSelection = () => {
    onSelectionChange([])
  }

  // Execute action
  const handleAction = async (action) => {
    if (selectedIds.length === 0) return

    setIsProcessing(true)
    try {
      await action.handler(selectedIds)
      if (action.clearOnSuccess !== false) {
        onSelectionChange([])
      }
    } catch (err) {
      console.error('Bulk action error:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className={clsx('flex items-center gap-4', className)}>
      {/* Selection Info */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
          <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
            {selectedIds.length} sélectionné{selectedIds.length > 1 ? 's' : ''}
          </span>
          <button
            onClick={handleClearSelection}
            className="p-1 hover:bg-primary-100 dark:hover:bg-primary-800 rounded"
          >
            <X className="w-4 h-4 text-primary-600" />
          </button>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedIds.length > 0 && actions.length > 0 && (
        <div className="flex items-center gap-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'secondary'}
              size="sm"
              onClick={() => handleAction(action)}
              disabled={isProcessing}
              icon={action.icon}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

// Selection checkbox for table header
export const SelectAllCheckbox = ({
  items = [],
  selectedIds = [],
  onToggleAll,
}) => {
  const allSelected = items.length > 0 && selectedIds.length === items.length
  const someSelected = selectedIds.length > 0 && selectedIds.length < items.length

  return (
    <button
      onClick={onToggleAll}
      className="flex items-center justify-center w-5 h-5"
    >
      {allSelected ? (
        <CheckSquare className="w-5 h-5 text-primary-600" />
      ) : someSelected ? (
        <MinusSquare className="w-5 h-5 text-primary-600" />
      ) : (
        <Square className="w-5 h-5 text-gray-400 hover:text-gray-600" />
      )}
    </button>
  )
}

// Selection checkbox for table row
export const SelectRowCheckbox = ({
  isSelected,
  onToggle,
}) => {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      className="flex items-center justify-center w-5 h-5"
    >
      {isSelected ? (
        <CheckSquare className="w-5 h-5 text-primary-600" />
      ) : (
        <Square className="w-5 h-5 text-gray-400 hover:text-gray-600" />
      )}
    </button>
  )
}

// Predefined bulk actions
export const CREATOR_BULK_ACTIONS = (handlers) => [
  {
    label: 'Activer',
    icon: ToggleRight,
    variant: 'success',
    handler: handlers.activate,
  },
  {
    label: 'Désactiver',
    icon: ToggleLeft,
    variant: 'warning',
    handler: handlers.deactivate,
  },
  {
    label: 'Exporter',
    icon: Download,
    variant: 'secondary',
    handler: handlers.export,
    clearOnSuccess: false,
  },
]

export const ADMIN_BULK_ACTIONS = (handlers) => [
  {
    label: 'Activer',
    icon: ToggleRight,
    variant: 'success',
    handler: handlers.activate,
  },
  {
    label: 'Désactiver',
    icon: ToggleLeft,
    variant: 'warning',
    handler: handlers.deactivate,
  },
  {
    label: 'Exporter',
    icon: Download,
    variant: 'secondary',
    handler: handlers.export,
    clearOnSuccess: false,
  },
]

export const BATCH_BULK_ACTIONS = (handlers) => [
  {
    label: 'Approuver',
    icon: CheckSquare,
    variant: 'success',
    handler: handlers.approve,
  },
  {
    label: 'Exporter',
    icon: Download,
    variant: 'secondary',
    handler: handlers.export,
    clearOnSuccess: false,
  },
]

export default BulkActions
