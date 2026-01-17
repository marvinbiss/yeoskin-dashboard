/**
 * YEOSKIN DASHBOARD - Enterprise Payment API
 * ============================================================================
 * HARDENED payment operations with:
 * - Idempotency protection
 * - State machine validation
 * - Financial ledger integration
 * - Double-payment prevention
 * - Comprehensive error handling
 * ============================================================================
 */

import { supabase } from './supabase'
import { fetchWithTimeout, TimeoutError, NetworkError, formatError } from './fetchUtils'

// API Configuration
const N8N_BASE_URL = import.meta.env.VITE_N8N_BASE_URL || 'https://yeoskin.app.n8n.cloud'
const PAYOUT_SECRET = import.meta.env.VITE_PAYOUT_SECRET || 'your-payout-secret'
const DEFAULT_TIMEOUT = 60000 // 60 seconds for payment operations

// ============================================================================
// IDEMPOTENCY KEY GENERATION
// ============================================================================

/**
 * Generate a unique idempotency key for an operation
 * @param {string} operation - Operation type
 * @param {string} resourceId - Resource identifier
 * @param {object} additionalData - Additional data to include in key
 * @returns {string} Idempotency key
 */
export const generateIdempotencyKey = (operation, resourceId, additionalData = {}) => {
  const timestamp = Date.now()
  const dataHash = JSON.stringify({ ...additionalData, timestamp })
  return `${operation}_${resourceId}_${btoa(dataHash).slice(0, 16)}`
}

/**
 * Generate idempotency key from webhook payload
 * @param {string} webhookType - Type of webhook
 * @param {object} payload - Webhook payload
 * @returns {string} Idempotency key
 */
export const generateWebhookIdempotencyKey = (webhookType, payload) => {
  // Use Shopify's order ID or event ID if available
  const externalId = payload.id || payload.order_id || payload.event_id
  if (!externalId) {
    throw new Error('Webhook payload must contain an external ID')
  }
  return `webhook_${webhookType}_${externalId}`
}

// ============================================================================
// IDEMPOTENCY CHECKS
// ============================================================================

/**
 * Check if an operation has already been processed
 * @param {string} idempotencyKey - The idempotency key to check
 * @returns {Promise<{isDuplicate: boolean, existingResult?: object}>}
 */
export const checkIdempotency = async (idempotencyKey) => {
  const { data, error } = await supabase.rpc('check_idempotency', {
    p_idempotency_key: idempotencyKey,
    p_operation_type: 'generic',
    p_resource_type: 'generic'
  })

  if (error) throw new Error(`Idempotency check failed: ${error.message}`)

  const result = data?.[0]
  return {
    isDuplicate: result?.is_duplicate || false,
    existingStatus: result?.existing_status,
    existingResponse: result?.existing_response,
    idempotencyId: result?.idempotency_id
  }
}

/**
 * Complete an idempotency record
 * @param {string} idempotencyId - The idempotency record ID
 * @param {string} status - Final status (completed/failed)
 * @param {object} response - Response data to store
 * @param {string} errorMessage - Error message if failed
 */
export const completeIdempotency = async (idempotencyId, status, response = null, errorMessage = null) => {
  const { error } = await supabase.rpc('complete_idempotency', {
    p_idempotency_id: idempotencyId,
    p_status: status,
    p_response_data: response,
    p_error_message: errorMessage
  })

  if (error) {
    console.error('Failed to complete idempotency:', error)
  }
}

// ============================================================================
// PAYMENT LOCKS
// ============================================================================

/**
 * Acquire a payment lock for a resource
 * @param {string} lockType - Type of lock (creator, batch, item)
 * @param {string} resourceId - Resource ID
 * @param {string} operation - Operation description
 * @returns {Promise<string>} Lock ID
 */
export const acquirePaymentLock = async (lockType, resourceId, operation) => {
  const { data, error } = await supabase.rpc('acquire_payment_lock', {
    p_lock_type: lockType,
    p_resource_id: resourceId,
    p_operation: operation
  })

  if (error) {
    if (error.message.includes('locked by another operation')) {
      throw new PaymentLockError(error.message)
    }
    throw new Error(`Failed to acquire lock: ${error.message}`)
  }

  return data
}

/**
 * Release a payment lock
 * @param {string} lockId - Lock ID to release
 */
export const releasePaymentLock = async (lockId) => {
  const { error } = await supabase.rpc('release_payment_lock', {
    p_lock_id: lockId
  })

  if (error) {
    console.error('Failed to release lock:', error)
  }
}

// ============================================================================
// CUSTOM ERRORS
// ============================================================================

export class PaymentLockError extends Error {
  constructor(message) {
    super(message)
    this.name = 'PaymentLockError'
    this.isRetryable = true
  }
}

export class IdempotencyError extends Error {
  constructor(message, existingResult) {
    super(message)
    this.name = 'IdempotencyError'
    this.existingResult = existingResult
    this.isRetryable = false
  }
}

export class StateTransitionError extends Error {
  constructor(message, currentState, targetState) {
    super(message)
    this.name = 'StateTransitionError'
    this.currentState = currentState
    this.targetState = targetState
    this.isRetryable = false
  }
}

export class InsufficientBalanceError extends Error {
  constructor(message, currentBalance, requestedAmount) {
    super(message)
    this.name = 'InsufficientBalanceError'
    this.currentBalance = currentBalance
    this.requestedAmount = requestedAmount
    this.isRetryable = false
  }
}

// ============================================================================
// BATCH OPERATIONS (Enterprise-grade)
// ============================================================================

/**
 * Approve a batch with proper validation and locking
 * INCLUDES: Balance validation to prevent approving payouts exceeding creator balances
 * @param {string} batchId - Batch ID to approve
 * @returns {Promise<object>} Result
 */
export const approveBatchSafe = async (batchId) => {
  const idempotencyKey = generateIdempotencyKey('batch_approve', batchId)

  // Check idempotency
  const idempCheck = await checkIdempotency(idempotencyKey)
  if (idempCheck.isDuplicate) {
    return { success: true, message: 'Batch already approved', ...idempCheck.existingResponse }
  }

  let lockId = null

  try {
    // Acquire lock
    lockId = await acquirePaymentLock('batch', batchId, 'approve')

    // Get batch with payout items for balance validation
    const { data: batch, error: fetchError } = await supabase
      .from('payout_batches')
      .select(`
        id, status, total_amount,
        payout_items (
          id, creator_id, amount, status
        )
      `)
      .eq('id', batchId)
      .single()

    if (fetchError) throw new Error(`Batch not found: ${fetchError.message}`)

    // Validate state transition
    if (batch.status !== 'draft') {
      throw new StateTransitionError(
        `Cannot approve batch in status: ${batch.status}`,
        batch.status,
        'approved'
      )
    }

    // =========================================================================
    // BALANCE VALIDATION: Ensure each creator has sufficient balance
    // =========================================================================
    if (batch.payout_items && batch.payout_items.length > 0) {
      // Get unique creator IDs
      const creatorIds = [...new Set(batch.payout_items.map(item => item.creator_id))]

      // Fetch creator balances
      const { data: balances, error: balanceError } = await supabase
        .from('creator_balances')
        .select('creator_id, current_balance, email')
        .in('creator_id', creatorIds)

      if (balanceError) {
        throw new Error(`Failed to fetch creator balances: ${balanceError.message}`)
      }

      // Create balance lookup map
      const balanceMap = new Map()
      balances?.forEach(b => balanceMap.set(b.creator_id, {
        balance: Number(b.current_balance) || 0,
        email: b.email
      }))

      // Aggregate payout amounts per creator (in case multiple items per creator)
      const creatorPayoutTotals = new Map()
      batch.payout_items.forEach(item => {
        const current = creatorPayoutTotals.get(item.creator_id) || 0
        creatorPayoutTotals.set(item.creator_id, current + Number(item.amount))
      })

      // Validate each creator has sufficient balance
      const insufficientBalanceErrors = []
      creatorPayoutTotals.forEach((totalPayout, creatorId) => {
        const creatorInfo = balanceMap.get(creatorId)
        const currentBalance = creatorInfo?.balance || 0

        if (totalPayout > currentBalance) {
          insufficientBalanceErrors.push({
            creatorId,
            email: creatorInfo?.email || 'Unknown',
            requestedAmount: totalPayout,
            currentBalance,
            shortfall: totalPayout - currentBalance
          })
        }
      })

      // If any creator has insufficient balance, throw error with details
      if (insufficientBalanceErrors.length > 0) {
        const errorDetails = insufficientBalanceErrors
          .map(e => `${e.email}: demande ${e.requestedAmount.toFixed(2)}€, solde ${e.currentBalance.toFixed(2)}€ (manque ${e.shortfall.toFixed(2)}€)`)
          .join('; ')

        throw new InsufficientBalanceError(
          `Solde insuffisant pour ${insufficientBalanceErrors.length} créateur(s): ${errorDetails}`,
          insufficientBalanceErrors[0].currentBalance,
          insufficientBalanceErrors[0].requestedAmount
        )
      }
    }
    // =========================================================================
    // END BALANCE VALIDATION
    // =========================================================================

    // Perform approval
    const { data: user } = await supabase.auth.getUser()
    const { error: updateError } = await supabase
      .from('payout_batches')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user?.user?.id,
        idempotency_key: idempotencyKey
      })
      .eq('id', batchId)
      .eq('status', 'draft') // Double-check status

    if (updateError) throw new Error(`Failed to approve batch: ${updateError.message}`)

    // Log audit
    await logPaymentAudit('APPROVE', 'batch', batchId, {
      previous_status: 'draft',
      new_status: 'approved',
      total_amount: batch.total_amount,
      items_count: batch.payout_items?.length || 0,
      balance_validated: true
    })

    // Complete idempotency
    await completeIdempotency(idempCheck.idempotencyId, 'completed', {
      batch_id: batchId,
      status: 'approved'
    })

    return {
      success: true,
      batchId,
      status: 'approved',
      itemsCount: batch.payout_items?.length || 0
    }

  } catch (error) {
    await completeIdempotency(idempCheck.idempotencyId, 'failed', null, error.message)
    throw error
  } finally {
    if (lockId) {
      await releasePaymentLock(lockId)
    }
  }
}

/**
 * Execute a batch (initiate payments) - NEVER call directly from frontend
 * This should ONLY be called via n8n webhook with proper authentication
 * @param {string} batchId - Batch ID
 * @param {string} idempotencyKey - Must be provided by backend
 * @returns {Promise<object>}
 */
export const executeBatchSafe = async (batchId, idempotencyKey) => {
  if (!idempotencyKey) {
    throw new Error('Idempotency key is required for batch execution')
  }

  // Check idempotency
  const idempCheck = await checkIdempotency(idempotencyKey)
  if (idempCheck.isDuplicate) {
    return { success: true, message: 'Batch already executed', ...idempCheck.existingResponse }
  }

  let lockId = null

  try {
    // Acquire lock
    lockId = await acquirePaymentLock('batch', batchId, 'execute')

    // Get batch with items
    const { data: batch, error: fetchError } = await supabase
      .from('payout_batches')
      .select(`
        *,
        payout_items (
          id, creator_id, amount, status
        )
      `)
      .eq('id', batchId)
      .single()

    if (fetchError) throw new Error(`Batch not found: ${fetchError.message}`)

    // Validate state
    if (batch.status !== 'approved') {
      throw new StateTransitionError(
        `Cannot execute batch in status: ${batch.status}`,
        batch.status,
        'executing'
      )
    }

    // Validate all items are in correct state
    const invalidItems = batch.payout_items.filter(item => item.status !== 'pending')
    if (invalidItems.length > 0) {
      throw new Error(`${invalidItems.length} items are not in pending status`)
    }

    // Update batch to executing
    const { data: user } = await supabase.auth.getUser()
    const { error: updateError } = await supabase
      .from('payout_batches')
      .update({
        status: 'executing',
        executed_by: user?.user?.id,
        executed_at: new Date().toISOString()
      })
      .eq('id', batchId)
      .eq('status', 'approved')

    if (updateError) throw new Error(`Failed to start batch execution: ${updateError.message}`)

    // Log audit
    await logPaymentAudit('EXECUTE', 'batch', batchId, {
      previous_status: 'approved',
      new_status: 'executing',
      items_count: batch.payout_items.length,
      total_amount: batch.total_amount
    })

    // Complete idempotency
    await completeIdempotency(idempCheck.idempotencyId, 'completed', {
      batch_id: batchId,
      status: 'executing',
      items_count: batch.payout_items.length
    })

    return {
      success: true,
      batchId,
      status: 'executing',
      itemsCount: batch.payout_items.length
    }

  } catch (error) {
    await completeIdempotency(idempCheck.idempotencyId, 'failed', null, error.message)
    throw error
  } finally {
    if (lockId) {
      await releasePaymentLock(lockId)
    }
  }
}

// ============================================================================
// PAYOUT ITEM OPERATIONS
// ============================================================================

/**
 * Execute a single payout item via database function
 * @param {string} payoutItemId - Payout item ID
 * @param {string} wiseTransferReference - Reference from Wise
 * @returns {Promise<object>}
 */
export const executePayoutItem = async (payoutItemId, wiseTransferReference = null) => {
  const idempotencyKey = generateIdempotencyKey('payout_item', payoutItemId)

  const { data, error } = await supabase.rpc('execute_payout_item', {
    p_payout_item_id: payoutItemId,
    p_idempotency_key: idempotencyKey,
    p_wise_transfer_reference: wiseTransferReference
  })

  if (error) {
    throw new Error(`Failed to execute payout item: ${error.message}`)
  }

  return data
}

/**
 * Complete a payout item (mark as sent/paid)
 * @param {string} payoutItemId - Payout item ID
 * @param {string} wiseTransferId - Wise transfer ID
 * @param {number} wiseFee - Wise fee amount
 * @param {string} newStatus - New status (sent/paid)
 * @returns {Promise<object>}
 */
export const completePayoutItem = async (payoutItemId, wiseTransferId, wiseFee = 0, newStatus = 'sent') => {
  const { data, error } = await supabase.rpc('complete_payout_item', {
    p_payout_item_id: payoutItemId,
    p_wise_transfer_id: wiseTransferId,
    p_wise_fee: wiseFee,
    p_new_status: newStatus
  })

  if (error) {
    throw new Error(`Failed to complete payout item: ${error.message}`)
  }

  return data
}

/**
 * Mark a payout item as failed
 * @param {string} payoutItemId - Payout item ID
 * @param {string} errorMessage - Error description
 * @returns {Promise<object>}
 */
export const failPayoutItem = async (payoutItemId, errorMessage) => {
  const { data, error } = await supabase.rpc('fail_payout_item', {
    p_payout_item_id: payoutItemId,
    p_error_message: errorMessage
  })

  if (error) {
    throw new Error(`Failed to mark payout as failed: ${error.message}`)
  }

  return data
}

// ============================================================================
// COMMISSION OPERATIONS
// ============================================================================

/**
 * Create a commission with ledger entry (idempotent)
 * @param {object} params - Commission parameters
 * @returns {Promise<string>} Commission ID
 */
export const createCommissionSafe = async ({
  creatorId,
  orderId,
  shopifyOrderId,
  orderTotal,
  commissionRate
}) => {
  const idempotencyKey = `commission_${shopifyOrderId}_${creatorId}`

  const { data, error } = await supabase.rpc('create_commission_with_ledger', {
    p_creator_id: creatorId,
    p_order_id: orderId,
    p_shopify_order_id: shopifyOrderId,
    p_order_total: orderTotal,
    p_commission_rate: commissionRate,
    p_idempotency_key: idempotencyKey
  })

  if (error) {
    throw new Error(`Failed to create commission: ${error.message}`)
  }

  return data
}

// ============================================================================
// FINANCIAL LEDGER QUERIES
// ============================================================================

/**
 * Get creator balance from ledger
 * @param {string} creatorId - Creator ID
 * @returns {Promise<object>} Balance info
 */
export const getCreatorBalance = async (creatorId) => {
  const { data, error } = await supabase
    .from('creator_balances')
    .select('*')
    .eq('creator_id', creatorId)
    .single()

  if (error) {
    throw new Error(`Failed to get creator balance: ${error.message}`)
  }

  return data
}

/**
 * Get creator ledger entries
 * @param {string} creatorId - Creator ID
 * @param {object} options - Query options
 * @returns {Promise<Array>} Ledger entries
 */
export const getCreatorLedger = async (creatorId, options = {}) => {
  const { limit = 50, offset = 0, transactionType = null } = options

  let query = supabase
    .from('financial_ledger')
    .select('*')
    .eq('creator_id', creatorId)
    .order('entry_number', { ascending: false })
    .range(offset, offset + limit - 1)

  if (transactionType) {
    query = query.eq('transaction_type', transactionType)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to get ledger entries: ${error.message}`)
  }

  return data
}

/**
 * Get financial summary for dashboard
 * @returns {Promise<object>} Financial summary
 */
export const getFinancialSummary = async () => {
  const { data, error } = await supabase
    .from('financial_summary')
    .select('*')
    .order('date', { ascending: false })
    .limit(90)

  if (error) {
    throw new Error(`Failed to get financial summary: ${error.message}`)
  }

  // Aggregate by type
  const summary = {
    totalCommissionsEarned: 0,
    totalPayoutsSent: 0,
    totalFees: 0,
    totalCanceled: 0,
    dailyData: data
  }

  data.forEach(row => {
    switch (row.transaction_type) {
      case 'commission_earned':
        summary.totalCommissionsEarned += Number(row.total_amount)
        break
      case 'payout_sent':
      case 'payout_completed':
        summary.totalPayoutsSent += Number(row.total_amount)
        break
      case 'payout_fee':
        summary.totalFees += Number(row.total_amount)
        break
      case 'commission_canceled':
        summary.totalCanceled += Number(row.total_amount)
        break
    }
  })

  return summary
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

/**
 * Log a payment-related audit event
 * @param {string} action - Action type
 * @param {string} resourceType - Resource type
 * @param {string} resourceId - Resource ID
 * @param {object} metadata - Additional metadata
 */
export const logPaymentAudit = async (action, resourceType, resourceId, metadata = {}) => {
  try {
    const { data: user } = await supabase.auth.getUser()

    await supabase.from('audit_logs').insert({
      user_id: user?.user?.id,
      user_email: user?.user?.email,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        source: 'payment_api'
      }
    })
  } catch (error) {
    console.error('Failed to log audit event:', error)
    // Don't throw - audit logging should not block operations
  }
}

// ============================================================================
// N8N WEBHOOK INTEGRATION (Server-side only)
// ============================================================================

/**
 * Trigger n8n webhook with idempotency
 * @param {string} endpoint - Webhook endpoint
 * @param {object} payload - Request payload
 * @param {string} idempotencyKey - Idempotency key
 * @returns {Promise<object>}
 */
export const triggerN8nWebhook = async (endpoint, payload, idempotencyKey) => {
  const headers = {
    'Content-Type': 'application/json',
    'x-payout-secret': PAYOUT_SECRET,
    'x-idempotency-key': idempotencyKey
  }

  try {
    const response = await fetchWithTimeout(`${N8N_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      timeout: DEFAULT_TIMEOUT,
      body: JSON.stringify({
        ...payload,
        idempotency_key: idempotencyKey,
        timestamp: new Date().toISOString()
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`n8n webhook failed: ${errorText}`)
    }

    return response.json()
  } catch (error) {
    // Handle timeout specifically
    if (error instanceof TimeoutError) {
      throw new Error(`n8n webhook timed out after ${DEFAULT_TIMEOUT}ms. The operation may still be processing.`)
    }
    if (error instanceof NetworkError) {
      throw new Error(`Network error calling n8n webhook: ${error.message}`)
    }
    throw error
  }
}

/**
 * Request batch execution via n8n (the correct flow)
 * Frontend calls this, n8n executes the actual payments
 * @param {string} batchId - Batch ID
 * @returns {Promise<object>}
 */
export const requestBatchExecution = async (batchId) => {
  // First approve the batch if needed
  const { data: batch } = await supabase
    .from('payout_batches')
    .select('status')
    .eq('id', batchId)
    .single()

  if (batch?.status === 'draft') {
    await approveBatchSafe(batchId)
  }

  // Generate idempotency key
  const idempotencyKey = generateIdempotencyKey('batch_execute_request', batchId)

  // Log the request
  await logPaymentAudit('EXECUTE_REQUEST', 'batch', batchId, {
    idempotency_key: idempotencyKey
  })

  // Trigger n8n webhook
  return triggerN8nWebhook('/webhook/payout/execute', {
    batch_id: batchId,
    idempotency_key: idempotencyKey
  }, idempotencyKey)
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate that a batch can be executed
 * INCLUDES: Balance validation, creator status, bank account verification
 * @param {string} batchId - Batch ID
 * @returns {Promise<{valid: boolean, errors: string[], warnings: string[]}>}
 */
export const validateBatchForExecution = async (batchId) => {
  const errors = []
  const warnings = []

  const { data: batch, error } = await supabase
    .from('payout_batches')
    .select(`
      *,
      payout_items (
        id, creator_id, amount, status,
        creators (
          id, status, email,
          creator_bank_accounts (id, is_verified)
        )
      )
    `)
    .eq('id', batchId)
    .single()

  if (error) {
    return { valid: false, errors: ['Batch not found'], warnings: [] }
  }

  if (!['draft', 'approved'].includes(batch.status)) {
    errors.push(`Batch is in invalid status: ${batch.status}`)
  }

  if (!batch.payout_items || batch.payout_items.length === 0) {
    errors.push('Batch has no payout items')
    return { valid: false, errors, warnings, batch }
  }

  // =========================================================================
  // BALANCE VALIDATION
  // =========================================================================
  const creatorIds = [...new Set(batch.payout_items.map(item => item.creator_id))]

  // Fetch creator balances
  const { data: balances, error: balanceError } = await supabase
    .from('creator_balances')
    .select('creator_id, current_balance, email')
    .in('creator_id', creatorIds)

  if (balanceError) {
    errors.push(`Failed to fetch creator balances: ${balanceError.message}`)
  } else {
    // Create balance lookup map
    const balanceMap = new Map()
    balances?.forEach(b => balanceMap.set(b.creator_id, {
      balance: Number(b.current_balance) || 0,
      email: b.email
    }))

    // Aggregate payout amounts per creator
    const creatorPayoutTotals = new Map()
    batch.payout_items.forEach(item => {
      const current = creatorPayoutTotals.get(item.creator_id) || 0
      creatorPayoutTotals.set(item.creator_id, current + Number(item.amount))
    })

    // Validate balances
    creatorPayoutTotals.forEach((totalPayout, creatorId) => {
      const creatorInfo = balanceMap.get(creatorId)
      const currentBalance = creatorInfo?.balance || 0

      if (totalPayout > currentBalance) {
        const shortfall = totalPayout - currentBalance
        errors.push(
          `Solde insuffisant pour ${creatorInfo?.email || creatorId}: ` +
          `demande ${totalPayout.toFixed(2)}€, solde ${currentBalance.toFixed(2)}€ ` +
          `(manque ${shortfall.toFixed(2)}€)`
        )
      }
    })
  }
  // =========================================================================
  // END BALANCE VALIDATION
  // =========================================================================

  // Check each item for other validations
  batch.payout_items?.forEach((item, index) => {
    if (item.status !== 'pending') {
      errors.push(`Item ${index + 1}: Invalid status ${item.status}`)
    }

    if (!item.creators) {
      errors.push(`Item ${index + 1}: Creator not found`)
    } else {
      if (item.creators.status !== 'active') {
        errors.push(`Item ${index + 1}: Creator ${item.creators.email} is not active`)
      }

      if (!item.creators.creator_bank_accounts?.length) {
        errors.push(`Item ${index + 1}: Creator ${item.creators.email} has no bank account`)
      } else if (!item.creators.creator_bank_accounts.some(b => b.is_verified)) {
        warnings.push(`Item ${index + 1}: Creator ${item.creators.email} bank account not verified`)
      }
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    batch,
    summary: {
      itemCount: batch.payout_items?.length || 0,
      totalAmount: batch.total_amount,
      errorCount: errors.length,
      warningCount: warnings.length
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Idempotency
  generateIdempotencyKey,
  generateWebhookIdempotencyKey,
  checkIdempotency,
  completeIdempotency,

  // Locks
  acquirePaymentLock,
  releasePaymentLock,

  // Batch operations
  approveBatchSafe,
  executeBatchSafe,
  requestBatchExecution,
  validateBatchForExecution,

  // Payout item operations
  executePayoutItem,
  completePayoutItem,
  failPayoutItem,

  // Commission operations
  createCommissionSafe,

  // Ledger queries
  getCreatorBalance,
  getCreatorLedger,
  getFinancialSummary,

  // Audit
  logPaymentAudit,

  // Errors
  PaymentLockError,
  IdempotencyError,
  StateTransitionError,
  InsufficientBalanceError
}
