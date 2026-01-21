/**
 * YEOSKIN DASHBOARD - API Configuration
 * ============================================================================
 * DEPRECATED: Use paymentApi.js for safe payment operations
 * This file kept for backwards compatibility only
 * ============================================================================
 */

import {
  approveBatchSafe,
  requestBatchExecution,
  generateIdempotencyKey
} from './paymentApi'

const N8N_BASE_URL = process.env.NEXT_PUBLIC_N8N_BASE_URL || 'https://yeoskin.app.n8n.cloud'
const PAYOUT_SECRET = process.env.NEXT_PUBLIC_PAYOUT_SECRET || 'your-payout-secret'

// Headers communs pour les appels n8n
const getHeaders = (idempotencyKey = null) => {
  const headers = {
    'Content-Type': 'application/json',
    'x-payout-secret': PAYOUT_SECRET,
  }
  if (idempotencyKey) {
    headers['x-idempotency-key'] = idempotencyKey
  }
  return headers
}

/**
 * Approuver un batch (draft -> approved)
 * @deprecated Use approveBatchSafe from paymentApi.js instead
 */
export const approveBatch = async (batchId) => {
  console.warn('DEPRECATED: Use approveBatchSafe from paymentApi.js')
  return approveBatchSafe(batchId)
}

/**
 * Executer un batch (envoyer les paiements)
 * @deprecated Use requestBatchExecution from paymentApi.js instead
 *
 * WARNING: This function should NEVER be called directly from frontend
 * Use requestBatchExecution which properly validates and triggers n8n
 */
export const executeBatch = async (batchId, forceExecute = false) => {
  console.warn('DEPRECATED: Use requestBatchExecution from paymentApi.js')

  // Refuse force_execute from frontend - this is a security risk
  if (forceExecute) {
    throw new Error('force_execute is not allowed from frontend. Contact backend team.')
  }

  return requestBatchExecution(batchId)
}

/**
 * Declencher le batch daily manuellement
 * NOW WITH IDEMPOTENCY PROTECTION
 */
export const triggerDailyBatch = async () => {
  const idempotencyKey = generateIdempotencyKey('daily_batch', new Date().toISOString().split('T')[0])

  const response = await fetch(`${N8N_BASE_URL}/webhook/payout/daily`, {
    method: 'POST',
    headers: getHeaders(idempotencyKey),
    body: JSON.stringify({
      idempotency_key: idempotencyKey,
      triggered_at: new Date().toISOString()
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to trigger daily batch: ${error}`)
  }

  return response.json()
}

/**
 * Creer un transfert Wise pour un payout item
 * @deprecated Use executePayoutItem from paymentApi.js instead
 *
 * WARNING: Direct Wise transfer creation should go through the payout system
 * to ensure proper ledger entries and idempotency
 */
export const createWiseTransfer = async (payoutItemId) => {
  console.warn('DEPRECATED: Use executePayoutItem from paymentApi.js')

  const idempotencyKey = generateIdempotencyKey('wise_transfer', payoutItemId)

  const response = await fetch(`${N8N_BASE_URL}/webhook/wise/transfer-create`, {
    method: 'POST',
    headers: getHeaders(idempotencyKey),
    body: JSON.stringify({
      payout_item_id: payoutItemId,
      idempotency_key: idempotencyKey
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create Wise transfer: ${error}`)
  }

  return response.json()
}

/**
 * Verifier le statut de l'API n8n
 */
export const checkN8nStatus = async () => {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    const startTime = Date.now()

    const response = await fetch(`${N8N_BASE_URL}/webhook/payout/daily`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ health_check: true }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const latency = Date.now() - startTime

    return {
      online: response.ok || response.status === 400,
      latency
    }
  } catch (error) {
    return { online: false, error: error.message }
  }
}

// Export config for debugging
export const getConfig = () => ({
  baseUrl: N8N_BASE_URL,
  hasSecret: !!PAYOUT_SECRET && PAYOUT_SECRET !== 'your-payout-secret',
})

// ============================================================================
// RE-EXPORT SAFE PAYMENT API
// ============================================================================

export {
  approveBatchSafe,
  requestBatchExecution,
  validateBatchForExecution,
  executePayoutItem,
  completePayoutItem,
  failPayoutItem,
  createCommissionSafe,
  getCreatorBalance,
  getCreatorLedger,
  getFinancialSummary,
  logPaymentAudit,
  generateIdempotencyKey,
  PaymentLockError,
  StateTransitionError,
  InsufficientBalanceError
} from './paymentApi'
