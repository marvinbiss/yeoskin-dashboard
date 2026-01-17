/**
 * YEOSKIN DASHBOARD - usePaymentExecution Hook
 * ============================================================================
 * Enterprise-grade payment execution with:
 * - State machine management
 * - Idempotency protection
 * - Real-time status updates
 * - Comprehensive error handling
 * - Audit trail integration
 * ============================================================================
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import {
  approveBatchSafe,
  requestBatchExecution,
  validateBatchForExecution,
  getCreatorBalance,
  getCreatorLedger,
  getFinancialSummary,
  logPaymentAudit,
  PaymentLockError,
  StateTransitionError,
  InsufficientBalanceError
} from '../lib/paymentApi'

// ============================================================================
// STATE MACHINE DEFINITIONS
// ============================================================================

export const BATCH_STATES = {
  DRAFT: 'draft',
  APPROVED: 'approved',
  EXECUTING: 'executing',
  SENT: 'sent',
  PAID: 'paid',
  CANCELED: 'canceled'
}

export const ITEM_STATES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SENT: 'sent',
  PAID: 'paid',
  FAILED: 'failed'
}

export const COMMISSION_STATES = {
  PENDING: 'pending',
  LOCKED: 'locked',
  PAYABLE: 'payable',
  PAID: 'paid',
  CANCELED: 'canceled'
}

// Valid transitions
const BATCH_TRANSITIONS = {
  [BATCH_STATES.DRAFT]: [BATCH_STATES.APPROVED, BATCH_STATES.CANCELED],
  [BATCH_STATES.APPROVED]: [BATCH_STATES.EXECUTING, BATCH_STATES.CANCELED],
  [BATCH_STATES.EXECUTING]: [BATCH_STATES.SENT],
  [BATCH_STATES.SENT]: [BATCH_STATES.PAID],
  [BATCH_STATES.PAID]: [],
  [BATCH_STATES.CANCELED]: []
}

/**
 * Check if a state transition is valid
 */
export const isValidTransition = (currentState, targetState, stateMachine = BATCH_TRANSITIONS) => {
  return stateMachine[currentState]?.includes(targetState) || false
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Hook for managing payment execution with enterprise-grade safety
 * @param {string} batchId - Optional batch ID to track
 * @returns {object} Payment execution state and methods
 */
export const usePaymentExecution = (batchId = null) => {
  // State
  const [batch, setBatch] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [error, setError] = useState(null)
  const [validationErrors, setValidationErrors] = useState([])
  const [operationLog, setOperationLog] = useState([])

  // Refs for cleanup and preventing stale state updates
  const subscriptionRef = useRef(null)
  const mountedRef = useRef(true)

  // ============================================================================
  // LOGGING
  // ============================================================================

  const logOperation = useCallback((type, message, data = {}) => {
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      type,
      message,
      data
    }
    setOperationLog(prev => [entry, ...prev].slice(0, 100)) // Keep last 100

    // Also log to console in development
    if (import.meta.env.DEV) {
      console.log(`[PaymentExecution] ${type}:`, message, data)
    }
  }, [])

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchBatch = useCallback(async () => {
    if (!batchId) return

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('payout_batches')
        .select(`
          *,
          payout_items (
            id,
            creator_id,
            amount,
            status,
            wise_transfer_id,
            wise_fee,
            sent_at,
            error_message,
            creators (
              id,
              email,
              discount_code,
              status,
              creator_bank_accounts (
                id,
                is_verified,
                account_type
              )
            )
          )
        `)
        .eq('id', batchId)
        .single()

      if (fetchError) throw fetchError

      setBatch(data)
      setItems(data.payout_items || [])

      logOperation('FETCH', 'Batch loaded', { status: data.status, itemCount: data.payout_items?.length })

    } catch (err) {
      setError(err.message)
      logOperation('ERROR', 'Failed to fetch batch', { error: err.message })
    } finally {
      setLoading(false)
    }
  }, [batchId, logOperation])

  // ============================================================================
  // VALIDATION
  // ============================================================================

  const validateBatch = useCallback(async () => {
    if (!batchId) return { valid: false, errors: ['No batch selected'] }

    try {
      logOperation('VALIDATE', 'Validating batch for execution')

      const result = await validateBatchForExecution(batchId)

      setValidationErrors(result.errors)

      if (result.valid) {
        logOperation('VALIDATE', 'Batch validation passed')
      } else {
        logOperation('VALIDATE', 'Batch validation failed', { errors: result.errors })
      }

      return result

    } catch (err) {
      const errors = [err.message]
      setValidationErrors(errors)
      logOperation('ERROR', 'Validation error', { error: err.message })
      return { valid: false, errors }
    }
  }, [batchId, logOperation])

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  /**
   * Approve a batch (draft -> approved)
   */
  const approveBatch = useCallback(async () => {
    if (!batchId) {
      setError('No batch selected')
      return false
    }

    try {
      setLoading(true)
      setError(null)

      // Validate state transition
      if (batch && !isValidTransition(batch.status, BATCH_STATES.APPROVED)) {
        throw new StateTransitionError(
          `Cannot approve batch in status: ${batch.status}`,
          batch.status,
          BATCH_STATES.APPROVED
        )
      }

      logOperation('APPROVE', 'Approving batch', { batchId })

      const result = await approveBatchSafe(batchId)

      logOperation('APPROVE', 'Batch approved successfully', result)

      // Refresh data
      await fetchBatch()

      return true

    } catch (err) {
      setError(err.message)
      logOperation('ERROR', 'Batch approval failed', { error: err.message })

      // Handle specific error types
      if (err instanceof PaymentLockError) {
        setError('Le batch est en cours de traitement par une autre opération. Veuillez réessayer.')
      } else if (err instanceof StateTransitionError) {
        setError(`Impossible d'approuver un batch en statut: ${err.currentState}`)
      }

      return false
    } finally {
      setLoading(false)
    }
  }, [batchId, batch, fetchBatch, logOperation])

  /**
   * Execute a batch (approved -> executing -> sent)
   * This triggers the n8n workflow
   */
  const executeBatch = useCallback(async () => {
    if (!batchId) {
      setError('No batch selected')
      return false
    }

    try {
      setExecuting(true)
      setError(null)

      // First validate
      const validation = await validateBatch()
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
      }

      // Validate state transition
      if (batch && !isValidTransition(batch.status, BATCH_STATES.EXECUTING)) {
        // Auto-approve if in draft
        if (batch.status === BATCH_STATES.DRAFT) {
          logOperation('AUTO_APPROVE', 'Auto-approving batch before execution')
          await approveBatch()
        } else {
          throw new StateTransitionError(
            `Cannot execute batch in status: ${batch.status}`,
            batch.status,
            BATCH_STATES.EXECUTING
          )
        }
      }

      logOperation('EXECUTE', 'Requesting batch execution', { batchId })

      // Request execution via n8n
      const result = await requestBatchExecution(batchId)

      logOperation('EXECUTE', 'Batch execution requested', result)

      // Refresh data
      await fetchBatch()

      return true

    } catch (err) {
      setError(err.message)
      logOperation('ERROR', 'Batch execution failed', { error: err.message })

      // Handle specific error types
      if (err instanceof PaymentLockError) {
        setError('Le batch est verrouillé par une autre opération. Veuillez réessayer.')
      } else if (err instanceof InsufficientBalanceError) {
        setError(`Solde insuffisant: ${err.currentBalance}€ disponible, ${err.requestedAmount}€ requis`)
      }

      return false
    } finally {
      setExecuting(false)
    }
  }, [batchId, batch, validateBatch, approveBatch, fetchBatch, logOperation])

  /**
   * Cancel a batch (if in cancellable state)
   */
  const cancelBatch = useCallback(async (reason = 'Cancelled by user') => {
    if (!batchId) {
      setError('No batch selected')
      return false
    }

    try {
      setLoading(true)
      setError(null)

      // Validate state transition
      if (batch && !isValidTransition(batch.status, BATCH_STATES.CANCELED)) {
        throw new StateTransitionError(
          `Cannot cancel batch in status: ${batch.status}`,
          batch.status,
          BATCH_STATES.CANCELED
        )
      }

      logOperation('CANCEL', 'Cancelling batch', { batchId, reason })

      const { error: updateError } = await supabase
        .from('payout_batches')
        .update({
          status: BATCH_STATES.CANCELED,
          canceled_at: new Date().toISOString(),
          cancel_reason: reason
        })
        .eq('id', batchId)

      if (updateError) throw updateError

      // Log audit
      await logPaymentAudit('CANCEL', 'batch', batchId, {
        reason,
        previous_status: batch?.status
      })

      logOperation('CANCEL', 'Batch cancelled successfully')

      // Refresh data
      await fetchBatch()

      return true

    } catch (err) {
      setError(err.message)
      logOperation('ERROR', 'Batch cancellation failed', { error: err.message })
      return false
    } finally {
      setLoading(false)
    }
  }, [batchId, batch, fetchBatch, logOperation])

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // Fixed: Added mountedRef checks to prevent state updates after unmount
  // ============================================================================

  useEffect(() => {
    if (!batchId) return

    mountedRef.current = true

    // Initial fetch
    fetchBatch()

    // Subscribe to batch changes
    const channel = supabase
      .channel(`batch-${batchId}-${Date.now()}`) // Unique channel name
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'payout_batches',
        filter: `id=eq.${batchId}`
      }, (payload) => {
        if (!mountedRef.current) return
        logOperation('REALTIME', 'Batch updated', { new_status: payload.new?.status })
        setBatch(prev => ({ ...prev, ...payload.new }))
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'payout_items',
        filter: `payout_batch_id=eq.${batchId}`
      }, (payload) => {
        if (!mountedRef.current) return
        logOperation('REALTIME', 'Item updated', {
          item_id: payload.new?.id,
          new_status: payload.new?.status
        })
        setItems(prev => prev.map(item =>
          item.id === payload.new?.id ? { ...item, ...payload.new } : item
        ))
      })
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('[usePaymentExecution] Subscription error:', err)
        }
      })

    subscriptionRef.current = channel

    return () => {
      mountedRef.current = false
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    }
  }, [batchId, fetchBatch, logOperation])

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const computedStats = {
    totalItems: items.length,
    pendingItems: items.filter(i => i.status === ITEM_STATES.PENDING).length,
    processingItems: items.filter(i => i.status === ITEM_STATES.PROCESSING).length,
    sentItems: items.filter(i => i.status === ITEM_STATES.SENT).length,
    paidItems: items.filter(i => i.status === ITEM_STATES.PAID).length,
    failedItems: items.filter(i => i.status === ITEM_STATES.FAILED).length,
    totalAmount: items.reduce((sum, i) => sum + Number(i.amount || 0), 0),
    totalFees: items.reduce((sum, i) => sum + Number(i.wise_fee || 0), 0),
    progress: items.length > 0
      ? Math.round((items.filter(i => ['sent', 'paid'].includes(i.status)).length / items.length) * 100)
      : 0
  }

  const canApprove = batch?.status === BATCH_STATES.DRAFT
  const canExecute = batch?.status === BATCH_STATES.APPROVED || batch?.status === BATCH_STATES.DRAFT
  const canCancel = [BATCH_STATES.DRAFT, BATCH_STATES.APPROVED].includes(batch?.status)
  const isProcessing = batch?.status === BATCH_STATES.EXECUTING || executing

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Data
    batch,
    items,
    stats: computedStats,
    operationLog,

    // Status
    loading,
    executing,
    error,
    validationErrors,

    // Permissions
    canApprove,
    canExecute,
    canCancel,
    isProcessing,

    // Actions
    fetchBatch,
    validateBatch,
    approveBatch,
    executeBatch,
    cancelBatch,

    // Helpers
    clearError: () => setError(null),
    clearValidationErrors: () => setValidationErrors([])
  }
}

// ============================================================================
// FINANCIAL LEDGER HOOK
// ============================================================================

/**
 * Hook for accessing financial ledger data
 * @param {string} creatorId - Optional creator ID to filter by
 */
export const useFinancialLedger = (creatorId = null) => {
  const [entries, setEntries] = useState([])
  const [balance, setBalance] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchLedger = useCallback(async (options = {}) => {
    try {
      setLoading(true)
      setError(null)

      if (creatorId) {
        // Fetch creator-specific data
        const [ledgerData, balanceData] = await Promise.all([
          getCreatorLedger(creatorId, options),
          getCreatorBalance(creatorId)
        ])

        setEntries(ledgerData)
        setBalance(balanceData)
      } else {
        // Fetch global summary
        const summaryData = await getFinancialSummary()
        setSummary(summaryData)
      }

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [creatorId])

  useEffect(() => {
    fetchLedger()
  }, [fetchLedger])

  return {
    entries,
    balance,
    summary,
    loading,
    error,
    refresh: fetchLedger
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default usePaymentExecution
