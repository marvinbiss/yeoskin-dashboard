import { createClient } from '@supabase/supabase-js'

// Configuration Supabase
// ⚠️ Remplacer par vos vraies valeurs
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'yeoskin-auth',
    flowType: 'implicit',
    // Désactiver le Web Locks API qui cause des AbortError
    lock: async (name, acquireTimeout, fn) => fn(),
  },
})

// Debug: expose supabase in console (development only)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.__SUPABASE__ = supabase
}

// Helper pour vérifier la connexion
export const checkConnection = async () => {
  try {
    const { data, error } = await supabase.from('payout_batches').select('count').limit(1)
    if (error) throw error
    return { connected: true, error: null }
  } catch (error) {
    return { connected: false, error: error.message }
  }
}

// ============================================================================
// TABLE NAMES
// ============================================================================

export const TABLES = {
  // Core tables
  CREATORS: 'creators',
  ORDERS: 'orders',
  COMMISSIONS: 'commissions',
  PAYOUT_BATCHES: 'payout_batches',
  PAYOUT_ITEMS: 'payout_items',
  WISE_TRANSFERS: 'wise_transfers',
  CREATOR_BANK_ACCOUNTS: 'creator_bank_accounts',

  // Financial ledger (enterprise)
  FINANCIAL_LEDGER: 'financial_ledger',
  IDEMPOTENCY_KEYS: 'idempotency_keys',
  PAYMENT_LOCKS: 'payment_locks',
  PAYOUT_ITEM_COMMISSIONS: 'payout_item_commissions',

  // Views
  CREATOR_BALANCES: 'creator_balances',
  FINANCIAL_SUMMARY: 'financial_summary',

  // Admin & Security
  ADMIN_PROFILES: 'admin_profiles',
  AUDIT_LOGS: 'audit_logs',
  AUTH_LOGS: 'auth_logs',
  USER_SESSIONS: 'user_sessions',
  LOGIN_ATTEMPTS: 'login_attempts',
  NOTIFICATIONS: 'notifications',
  SYSTEM_SETTINGS: 'system_settings',

  // Creator Portal
  CREATOR_NOTIFICATIONS: 'creator_notifications',
  CREATOR_TIMELINE_EVENTS: 'creator_timeline_events',
}

// ============================================================================
// STATUS CONSTANTS - BATCH
// ============================================================================

export const BATCH_STATUS = {
  DRAFT: 'draft',
  APPROVED: 'approved',
  EXECUTING: 'executing',
  SENT: 'sent',
  PAID: 'paid',
  CANCELED: 'canceled',
}

// Valid state transitions for batches
export const BATCH_TRANSITIONS = {
  [BATCH_STATUS.DRAFT]: [BATCH_STATUS.APPROVED, BATCH_STATUS.CANCELED],
  [BATCH_STATUS.APPROVED]: [BATCH_STATUS.EXECUTING, BATCH_STATUS.CANCELED],
  [BATCH_STATUS.EXECUTING]: [BATCH_STATUS.SENT],
  [BATCH_STATUS.SENT]: [BATCH_STATUS.PAID],
  [BATCH_STATUS.PAID]: [],
  [BATCH_STATUS.CANCELED]: [],
}

// ============================================================================
// STATUS CONSTANTS - PAYOUT ITEMS
// ============================================================================

export const ITEM_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SENT: 'sent',
  PAID: 'paid',
  FAILED: 'failed',
}

// Valid state transitions for payout items
export const ITEM_TRANSITIONS = {
  [ITEM_STATUS.PENDING]: [ITEM_STATUS.PROCESSING],
  [ITEM_STATUS.PROCESSING]: [ITEM_STATUS.SENT, ITEM_STATUS.FAILED],
  [ITEM_STATUS.SENT]: [ITEM_STATUS.PAID, ITEM_STATUS.FAILED],
  [ITEM_STATUS.PAID]: [],
  [ITEM_STATUS.FAILED]: [ITEM_STATUS.PENDING], // Can retry
}

// ============================================================================
// STATUS CONSTANTS - COMMISSIONS
// ============================================================================

export const COMMISSION_STATUS = {
  PENDING: 'pending',
  LOCKED: 'locked',
  PAYABLE: 'payable',
  PAID: 'paid',
  CANCELED: 'canceled',
}

// Valid state transitions for commissions
export const COMMISSION_TRANSITIONS = {
  [COMMISSION_STATUS.PENDING]: [COMMISSION_STATUS.LOCKED, COMMISSION_STATUS.CANCELED],
  [COMMISSION_STATUS.LOCKED]: [COMMISSION_STATUS.PAYABLE, COMMISSION_STATUS.CANCELED],
  [COMMISSION_STATUS.PAYABLE]: [COMMISSION_STATUS.PAID, COMMISSION_STATUS.CANCELED],
  [COMMISSION_STATUS.PAID]: [],
  [COMMISSION_STATUS.CANCELED]: [],
}

// ============================================================================
// LEDGER TRANSACTION TYPES
// ============================================================================

export const LEDGER_TYPES = {
  COMMISSION_EARNED: 'commission_earned',
  COMMISSION_CANCELED: 'commission_canceled',
  COMMISSION_ADJUSTED: 'commission_adjusted',
  PAYOUT_INITIATED: 'payout_initiated',
  PAYOUT_SENT: 'payout_sent',
  PAYOUT_COMPLETED: 'payout_completed',
  PAYOUT_FAILED: 'payout_failed',
  PAYOUT_FEE: 'payout_fee',
  BALANCE_ADJUSTMENT: 'balance_adjustment',
  REFUND_PROCESSED: 'refund_processed',
}

// ============================================================================
// IDEMPOTENCY OPERATION TYPES
// ============================================================================

export const IDEMPOTENCY_OPERATIONS = {
  WEBHOOK_SHOPIFY_ORDER: 'webhook_shopify_order',
  WEBHOOK_SHOPIFY_REFUND: 'webhook_shopify_refund',
  COMMISSION_CREATE: 'commission_create',
  PAYOUT_EXECUTE: 'payout_execute',
  PAYOUT_ITEM_PROCESS: 'payout_item_process',
  WISE_TRANSFER_CREATE: 'wise_transfer_create',
  BATCH_APPROVE: 'batch_approve',
  BATCH_EXECUTE: 'batch_execute',
}

// ============================================================================
// ADMIN ROLES
// ============================================================================

export const ADMIN_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  VIEWER: 'viewer',
}

// ============================================================================
// AUDIT ACTION TYPES
// ============================================================================

export const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  VIEW: 'VIEW',
  EXPORT: 'EXPORT',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  ROLE_CHANGE: 'ROLE_CHANGE',
  APPROVE: 'APPROVE',
  EXECUTE: 'EXECUTE',
}

// ============================================================================
// CREATOR NOTIFICATION TYPES
// ============================================================================

export const CREATOR_NOTIFICATION_TYPES = {
  COMMISSION_EARNED: 'commission_earned',
  COMMISSION_LOCKED: 'commission_locked',
  COMMISSION_PAYABLE: 'commission_payable',
  PAYOUT_SCHEDULED: 'payout_scheduled',
  PAYOUT_SENT: 'payout_sent',
  PAYOUT_COMPLETED: 'payout_completed',
  PAYOUT_FAILED: 'payout_failed',
  WELCOME: 'welcome',
  INFO: 'info',
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a state transition is valid
 * @param {string} currentState - Current state
 * @param {string} targetState - Target state
 * @param {object} transitions - State machine transitions map
 * @returns {boolean}
 */
export const isValidTransition = (currentState, targetState, transitions) => {
  return transitions[currentState]?.includes(targetState) || false
}

/**
 * Get allowed transitions from a state
 * @param {string} currentState - Current state
 * @param {object} transitions - State machine transitions map
 * @returns {string[]}
 */
export const getAllowedTransitions = (currentState, transitions) => {
  return transitions[currentState] || []
}

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default EUR)
 * @returns {string}
 */
export const formatCurrency = (amount, currency = 'EUR') => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string}
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '-'
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
  return new Intl.DateTimeFormat('fr-FR', { ...defaultOptions, ...options })
    .format(new Date(date))
}
