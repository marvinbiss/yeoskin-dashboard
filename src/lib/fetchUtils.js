/**
 * YEOSKIN DASHBOARD - Fetch Utilities
 * ============================================================================
 * Enterprise-grade HTTP utilities with:
 * - Timeout handling
 * - Retry logic
 * - Error normalization
 * - Request cancellation
 * - Logging
 * ============================================================================
 */

// Default configuration
const DEFAULT_TIMEOUT = 30000 // 30 seconds
const DEFAULT_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

// ============================================================================
// CUSTOM ERRORS
// ============================================================================

export class TimeoutError extends Error {
  constructor(message = 'Request timed out', timeout) {
    super(message)
    this.name = 'TimeoutError'
    this.timeout = timeout
    this.isRetryable = true
  }
}

export class NetworkError extends Error {
  constructor(message = 'Network error', originalError) {
    super(message)
    this.name = 'NetworkError'
    this.originalError = originalError
    this.isRetryable = true
  }
}

export class HttpError extends Error {
  constructor(message, status, statusText, body) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.statusText = statusText
    this.body = body
    // 5xx errors are retryable, 4xx are not
    this.isRetryable = status >= 500
  }
}

// ============================================================================
// FETCH WITH TIMEOUT
// ============================================================================

/**
 * Fetch with timeout support
 * @param {string} url - Request URL
 * @param {object} options - Fetch options
 * @param {number} options.timeout - Timeout in milliseconds
 * @returns {Promise<Response>}
 */
export const fetchWithTimeout = async (url, options = {}) => {
  const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    })

    clearTimeout(timeoutId)
    return response

  } catch (error) {
    clearTimeout(timeoutId)

    if (error.name === 'AbortError') {
      throw new TimeoutError(`Request timed out after ${timeout}ms`, timeout)
    }

    throw new NetworkError(error.message, error)
  }
}

// ============================================================================
// FETCH WITH RETRY
// ============================================================================

/**
 * Fetch with automatic retry on failure
 * @param {string} url - Request URL
 * @param {object} options - Fetch options
 * @param {number} options.retries - Number of retries
 * @param {number} options.retryDelay - Delay between retries in ms
 * @param {function} options.onRetry - Callback on retry
 * @returns {Promise<Response>}
 */
export const fetchWithRetry = async (url, options = {}) => {
  const {
    retries = DEFAULT_RETRIES,
    retryDelay = RETRY_DELAY,
    onRetry,
    ...fetchOptions
  } = options

  let lastError

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, fetchOptions)

      // Check for server errors (5xx) which are retryable
      if (!response.ok && response.status >= 500 && attempt < retries) {
        throw new HttpError(
          `Server error: ${response.status}`,
          response.status,
          response.statusText
        )
      }

      return response

    } catch (error) {
      lastError = error

      // Don't retry if error is not retryable
      if (!error.isRetryable || attempt >= retries) {
        throw error
      }

      // Call retry callback
      if (onRetry) {
        onRetry(attempt + 1, error)
      }

      // Wait before retrying with exponential backoff
      const delay = retryDelay * Math.pow(2, attempt)
      await sleep(delay)
    }
  }

  throw lastError
}

// ============================================================================
// JSON FETCH HELPER
// ============================================================================

/**
 * Fetch JSON with full error handling
 * @param {string} url - Request URL
 * @param {object} options - Fetch options
 * @returns {Promise<object>} Parsed JSON response
 */
export const fetchJson = async (url, options = {}) => {
  const {
    timeout = DEFAULT_TIMEOUT,
    retries = 0,
    headers = {},
    ...restOptions
  } = options

  const response = await fetchWithRetry(url, {
    timeout,
    retries,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...headers
    },
    ...restOptions
  })

  // Handle non-OK responses
  if (!response.ok) {
    let body
    try {
      body = await response.json()
    } catch {
      body = await response.text()
    }

    throw new HttpError(
      body?.message || body?.error || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      response.statusText,
      body
    )
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type')
  if (!contentType || !contentType.includes('application/json')) {
    return null
  }

  const text = await response.text()
  if (!text) {
    return null
  }

  return JSON.parse(text)
}

// ============================================================================
// REQUEST BUILDER
// ============================================================================

/**
 * Build a request configuration object
 */
export class RequestBuilder {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl
    this.defaultHeaders = {}
    this.defaultTimeout = DEFAULT_TIMEOUT
    this.defaultRetries = 0
  }

  setBaseUrl(url) {
    this.baseUrl = url
    return this
  }

  setDefaultHeaders(headers) {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers }
    return this
  }

  setDefaultTimeout(timeout) {
    this.defaultTimeout = timeout
    return this
  }

  setDefaultRetries(retries) {
    this.defaultRetries = retries
    return this
  }

  async get(path, options = {}) {
    return this._request('GET', path, options)
  }

  async post(path, data, options = {}) {
    return this._request('POST', path, { ...options, body: JSON.stringify(data) })
  }

  async put(path, data, options = {}) {
    return this._request('PUT', path, { ...options, body: JSON.stringify(data) })
  }

  async patch(path, data, options = {}) {
    return this._request('PATCH', path, { ...options, body: JSON.stringify(data) })
  }

  async delete(path, options = {}) {
    return this._request('DELETE', path, options)
  }

  async _request(method, path, options = {}) {
    const url = `${this.baseUrl}${path}`
    const {
      headers = {},
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      ...restOptions
    } = options

    return fetchJson(url, {
      method,
      timeout,
      retries,
      headers: {
        ...this.defaultHeaders,
        ...headers
      },
      ...restOptions
    })
  }
}

// ============================================================================
// ABORT CONTROLLER MANAGER
// ============================================================================

/**
 * Manages AbortControllers for component lifecycle
 */
export class AbortManager {
  constructor() {
    this.controllers = new Map()
  }

  /**
   * Create a new abort controller for a request
   * @param {string} key - Unique key for the request
   * @returns {AbortController}
   */
  create(key) {
    // Abort any existing request with the same key
    this.abort(key)

    const controller = new AbortController()
    this.controllers.set(key, controller)
    return controller
  }

  /**
   * Get the signal for a request
   * @param {string} key - Request key
   * @returns {AbortSignal|undefined}
   */
  getSignal(key) {
    return this.controllers.get(key)?.signal
  }

  /**
   * Abort a specific request
   * @param {string} key - Request key
   */
  abort(key) {
    const controller = this.controllers.get(key)
    if (controller) {
      controller.abort()
      this.controllers.delete(key)
    }
  }

  /**
   * Abort all pending requests
   */
  abortAll() {
    this.controllers.forEach((controller) => {
      controller.abort()
    })
    this.controllers.clear()
  }

  /**
   * Remove a controller (after successful request)
   * @param {string} key - Request key
   */
  remove(key) {
    this.controllers.delete(key)
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Sleep for a given duration
 * @param {number} ms - Duration in milliseconds
 * @returns {Promise<void>}
 */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Check if error is a network/timeout error (retryable)
 * @param {Error} error
 * @returns {boolean}
 */
export const isRetryableError = (error) => {
  return error?.isRetryable === true ||
    error instanceof TimeoutError ||
    error instanceof NetworkError ||
    (error instanceof HttpError && error.status >= 500)
}

/**
 * Format error for display
 * @param {Error} error
 * @returns {string}
 */
export const formatError = (error) => {
  if (error instanceof TimeoutError) {
    return 'La requete a expire. Verifiez votre connexion et reessayez.'
  }

  if (error instanceof NetworkError) {
    return 'Erreur reseau. Verifiez votre connexion internet.'
  }

  if (error instanceof HttpError) {
    switch (error.status) {
      case 400:
        return error.body?.message || 'Requete invalide'
      case 401:
        return 'Session expiree. Veuillez vous reconnecter.'
      case 403:
        return 'Acces refuse. Vous n\'avez pas les permissions necessaires.'
      case 404:
        return 'Ressource introuvable'
      case 409:
        return error.body?.message || 'Conflit de donnees'
      case 422:
        return error.body?.message || 'Donnees invalides'
      case 429:
        return 'Trop de requetes. Veuillez patienter.'
      case 500:
      case 502:
      case 503:
        return 'Erreur serveur. Veuillez reessayer plus tard.'
      default:
        return error.message || 'Une erreur est survenue'
    }
  }

  return error?.message || 'Une erreur inconnue est survenue'
}

// ============================================================================
// REACT HOOKS HELPERS
// ============================================================================

/**
 * Create an abort manager for use in React components
 * Call abortAll() in cleanup/unmount
 */
export const createAbortManager = () => new AbortManager()

/**
 * Safe async operation wrapper for React
 * Prevents state updates on unmounted components
 * @param {function} asyncFn - Async function to execute
 * @param {object} options - Options
 * @param {function} options.onSuccess - Success callback
 * @param {function} options.onError - Error callback
 * @param {AbortSignal} options.signal - Abort signal
 * @returns {Promise<void>}
 */
export const safeAsync = async (asyncFn, options = {}) => {
  const { onSuccess, onError, signal } = options

  try {
    // Check if already aborted
    if (signal?.aborted) return

    const result = await asyncFn()

    // Check again after async operation
    if (signal?.aborted) return

    if (onSuccess) {
      onSuccess(result)
    }

  } catch (error) {
    // Ignore abort errors
    if (error.name === 'AbortError' || signal?.aborted) return

    if (onError) {
      onError(error)
    } else {
      console.error('Unhandled async error:', error)
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  fetchWithTimeout,
  fetchWithRetry,
  fetchJson,
  RequestBuilder,
  AbortManager,
  createAbortManager,
  safeAsync,
  sleep,
  isRetryableError,
  formatError,
  TimeoutError,
  NetworkError,
  HttpError
}
