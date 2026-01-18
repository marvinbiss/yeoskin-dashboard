/**
 * YEOSKIN DASHBOARD - Payment Execution Panel
 * ============================================================================
 * Enterprise-grade payment execution UI with:
 * - State machine visualization
 * - Real-time progress tracking
 * - Validation display
 * - Operation log
 * - Safety confirmations
 * ============================================================================
 */

import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Shield,
  Lock,
  Unlock,
  FileText,
  ChevronDown,
  ChevronUp,
  Users,
  DollarSign,
  ArrowRight,
  Pause,
  Ban
} from 'lucide-react'
import clsx from 'clsx'
import { Card, Button, Badge, Spinner, Modal } from '../Common'
import { usePaymentExecution, BATCH_STATES, ITEM_STATES } from '../../hooks/usePaymentExecution'
import { formatCurrency } from '../../lib/supabase'

// ============================================================================
// STATUS BADGE CONFIG
// ============================================================================

const STATUS_CONFIG = {
  [BATCH_STATES.DRAFT]: {
    label: 'Brouillon',
    color: 'gray',
    icon: FileText
  },
  [BATCH_STATES.APPROVED]: {
    label: 'Approuve',
    color: 'primary',
    icon: CheckCircle
  },
  [BATCH_STATES.EXECUTING]: {
    label: 'En cours',
    color: 'warning',
    icon: Clock
  },
  [BATCH_STATES.SENT]: {
    label: 'Envoye',
    color: 'success',
    icon: ArrowRight
  },
  [BATCH_STATES.PAID]: {
    label: 'Paye',
    color: 'success',
    icon: CheckCircle
  },
  [BATCH_STATES.CANCELED]: {
    label: 'Annule',
    color: 'danger',
    icon: XCircle
  }
}

const ITEM_STATUS_CONFIG = {
  [ITEM_STATES.PENDING]: { label: 'En attente', color: 'gray' },
  [ITEM_STATES.PROCESSING]: { label: 'Traitement', color: 'warning' },
  [ITEM_STATES.SENT]: { label: 'Envoye', color: 'primary' },
  [ITEM_STATES.PAID]: { label: 'Paye', color: 'success' },
  [ITEM_STATES.FAILED]: { label: 'Echoue', color: 'danger' }
}

// ============================================================================
// BATCH STATUS BADGE
// ============================================================================

const BatchStatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG[BATCH_STATES.DRAFT]
  const Icon = config.icon

  return (
    <Badge variant={config.color} className="flex items-center gap-1.5">
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </Badge>
  )
}

// ============================================================================
// PROGRESS BAR
// ============================================================================

const ExecutionProgress = ({ stats }) => {
  const { totalItems, sentItems, paidItems, failedItems, progress } = stats

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Progression</span>
        <span className="font-medium">{progress}%</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-success-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>{sentItems + paidItems} / {totalItems} traites</span>
        {failedItems > 0 && (
          <span className="text-danger-500">{failedItems} echoue(s)</span>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// VALIDATION ERRORS DISPLAY
// ============================================================================

const ValidationErrors = ({ errors }) => {
  if (!errors || errors.length === 0) return null

  return (
    <div className="p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-danger-800 dark:text-danger-200 mb-2">
            Erreurs de validation ({errors.length})
          </h4>
          <ul className="text-sm text-danger-700 dark:text-danger-300 space-y-1 list-disc list-inside">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// OPERATION LOG
// ============================================================================

const OperationLog = ({ logs, isExpanded, onToggle }) => {
  if (!logs || logs.length === 0) return null

  const visibleLogs = isExpanded ? logs : logs.slice(0, 3)

  const getLogIcon = (type) => {
    switch (type) {
      case 'FETCH':
        return <RefreshCw key="fetch" className="w-3 h-3" />
      case 'VALIDATE':
        return <Shield key="validate" className="w-3 h-3" />
      case 'APPROVE':
        return <CheckCircle key="approve" className="w-3 h-3 text-primary-500" />
      case 'EXECUTE':
        return <Play key="execute" className="w-3 h-3 text-success-500" />
      case 'ERROR':
        return <XCircle key="error" className="w-3 h-3 text-danger-500" />
      case 'REALTIME':
        return <Clock key="realtime" className="w-3 h-3 text-primary-500" />
      default:
        return <FileText key="default" className="w-3 h-3" />
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        Journal des operations ({logs.length})
      </button>

      <div className="space-y-1 text-xs font-mono">
        {visibleLogs.map((log) => (
          <div
            key={log.id}
            className={clsx(
              'flex items-start gap-2 p-2 rounded',
              log.type === 'ERROR' ? 'bg-danger-50 dark:bg-danger-900/20' : 'bg-gray-50 dark:bg-gray-800'
            )}
          >
            <span className="mt-0.5">{getLogIcon(log.type)}</span>
            <span className="text-gray-400">
              {format(new Date(log.timestamp), 'HH:mm:ss')}
            </span>
            <span className={clsx(
              'flex-1',
              log.type === 'ERROR' ? 'text-danger-600' : 'text-gray-600 dark:text-gray-300'
            )}>
              {log.message}
            </span>
          </div>
        ))}
      </div>

      {logs.length > 3 && !isExpanded && (
        <button
          onClick={onToggle}
          className="text-xs text-primary-600 hover:underline"
        >
          Voir {logs.length - 3} autres entrees...
        </button>
      )}
    </div>
  )
}

// ============================================================================
// PAYOUT ITEMS LIST
// ============================================================================

const PayoutItemsList = ({ items }) => {
  if (!items || items.length === 0) return null

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Elements ({items.length})
      </h4>
      <div className="max-h-64 overflow-y-auto space-y-2">
        {items.map((item) => {
          const statusConfig = ITEM_STATUS_CONFIG[item.status] || ITEM_STATUS_CONFIG[ITEM_STATES.PENDING]

          return (
            <div
              key={item.id}
              className={clsx(
                'flex items-center justify-between p-3 rounded-lg border',
                item.status === ITEM_STATES.FAILED
                  ? 'border-danger-200 bg-danger-50 dark:border-danger-800 dark:bg-danger-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-xs font-medium">
                    {item.creators?.email?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.creators?.email || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(item.amount)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {item.error_message && (
                  <span className="text-xs text-danger-500 max-w-[150px] truncate" title={item.error_message}>
                    {item.error_message}
                  </span>
                )}
                <Badge variant={statusConfig.color} size="sm">
                  {statusConfig.label}
                </Badge>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// CONFIRMATION MODAL
// ============================================================================

const ExecutionConfirmModal = ({ isOpen, onClose, onConfirm, batch, stats, loading }) => {
  const [confirmed, setConfirmed] = useState(false)

  const handleConfirm = () => {
    onConfirm()
    setConfirmed(false)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmer l'execution" size="md">
      <div className="space-y-6">
        {/* Warning */}
        <div className="p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-warning-500 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-warning-800 dark:text-warning-200">
                Action irreversible
              </h4>
              <p className="text-sm text-warning-700 dark:text-warning-300 mt-1">
                L'execution va declencher les paiements reels via Wise.
                Cette action ne peut pas etre annulee une fois commencee.
              </p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-gray-500" />
              <p className="text-xs text-gray-500 uppercase">Beneficiaires</p>
            </div>
            <p className="text-2xl font-bold">{stats?.totalItems || 0}</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <p className="text-xs text-gray-500 uppercase">Montant total</p>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(stats?.totalAmount || 0)}</p>
          </div>
        </div>

        {/* Confirmation checkbox */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Je confirme avoir verifie les beneficiaires et les montants.
            Je comprends que les paiements seront executes immediatement.
          </span>
        </label>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!confirmed || loading}
            loading={loading}
          >
            <Play className="w-4 h-4 mr-2" />
            Executer les paiements
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const PaymentExecutionPanel = ({ batchId }) => {
  const {
    batch,
    items,
    stats,
    operationLog,
    loading,
    executing,
    error,
    validationErrors,
    canApprove,
    canExecute,
    canCancel,
    isProcessing,
    fetchBatch,
    validateBatch,
    approveBatch,
    executeBatch,
    cancelBatch,
    clearError
  } = usePaymentExecution(batchId)

  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showLogExpanded, setShowLogExpanded] = useState(false)

  // Handle execute click
  const handleExecuteClick = async () => {
    // First validate
    const validation = await validateBatch()
    if (!validation.valid) {
      return
    }

    // Show confirmation
    setShowConfirmModal(true)
  }

  // Handle confirmed execution
  const handleConfirmedExecute = async () => {
    const success = await executeBatch()
    if (success) {
      setShowConfirmModal(false)
    }
  }

  if (!batchId) {
    return (
      <Card>
        <Card.Body>
          <div className="text-center py-8 text-gray-500">
            Selectionnez un batch pour voir les details d'execution
          </div>
        </Card.Body>
      </Card>
    )
  }

  if (loading && !batch) {
    return (
      <Card>
        <Card.Body>
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        </Card.Body>
      </Card>
    )
  }

  return (
    <>
      <Card>
        {/* Header */}
        <Card.Header>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Execution du batch
              </h3>
              {batch && <BatchStatusBadge status={batch.status} />}
            </div>

            <div className="flex items-center gap-2">
              {isProcessing && (
                <Badge variant="warning" className="animate-pulse">
                  <Clock className="w-3 h-3 mr-1" />
                  En cours...
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchBatch}
                disabled={loading}
              >
                <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
              </Button>
            </div>
          </div>
        </Card.Header>

        <Card.Body>
          <div className="space-y-6">
            {/* Error Display */}
            {error && (
              <div className="p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-danger-700 dark:text-danger-300">{error}</p>
                  </div>
                  <button onClick={clearError} className="text-danger-500 hover:text-danger-700">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Validation Errors */}
            <ValidationErrors errors={validationErrors} />

            {/* Stats */}
            {batch && (
              <div className="grid grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="text-xs text-gray-500 uppercase">Elements</p>
                  <p className="text-xl font-bold">{stats.totalItems}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="text-xs text-gray-500 uppercase">Montant</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.totalAmount)}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="text-xs text-gray-500 uppercase">Traites</p>
                  <p className="text-xl font-bold text-success-600">
                    {stats.sentItems + stats.paidItems}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="text-xs text-gray-500 uppercase">Echoues</p>
                  <p className={clsx(
                    'text-xl font-bold',
                    stats.failedItems > 0 ? 'text-danger-600' : 'text-gray-400'
                  )}>
                    {stats.failedItems}
                  </p>
                </div>
              </div>
            )}

            {/* Progress */}
            {isProcessing && <ExecutionProgress stats={stats} />}

            {/* Items List */}
            <PayoutItemsList items={items} />

            {/* Operation Log */}
            <OperationLog
              logs={operationLog}
              isExpanded={showLogExpanded}
              onToggle={() => setShowLogExpanded(!showLogExpanded)}
            />

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                {canCancel && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => cancelBatch('Annule par l\'utilisateur')}
                    disabled={loading || executing}
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Annuler
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {canApprove && (
                  <Button
                    variant="secondary"
                    onClick={approveBatch}
                    disabled={loading || executing}
                    loading={loading}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approuver
                  </Button>
                )}

                {canExecute && (
                  <Button
                    variant="primary"
                    onClick={handleExecuteClick}
                    disabled={loading || executing}
                    loading={executing}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Executer les paiements
                  </Button>
                )}

                {!canApprove && !canExecute && !canCancel && (
                  <span className="text-sm text-gray-500">
                    Aucune action disponible
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Confirmation Modal */}
      <ExecutionConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmedExecute}
        batch={batch}
        stats={stats}
        loading={executing}
      />
    </>
  )
}

// ============================================================================
// EXPORTS
// ============================================================================

export default PaymentExecutionPanel
