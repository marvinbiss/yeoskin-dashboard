/**
 * Circuit Breaker Pattern for external API calls
 * States: CLOSED (normal) -> OPEN (failing) -> HALF_OPEN (testing)
 */

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

interface CircuitBreakerOptions {
  failureThreshold: number      // Number of failures before opening
  resetTimeout: number          // Time in ms before trying again (HALF_OPEN)
  halfOpenMaxAttempts: number   // Max attempts in HALF_OPEN state
}

interface CircuitStats {
  state: CircuitState
  failures: number
  successes: number
  lastFailure: number | null
  lastSuccess: number | null
  totalRequests: number
  totalFailures: number
}

class CircuitBreaker {
  private state: CircuitState = 'CLOSED'
  private failures: number = 0
  private successes: number = 0
  private lastFailure: number | null = null
  private lastSuccess: number | null = null
  private halfOpenAttempts: number = 0
  private totalRequests: number = 0
  private totalFailures: number = 0

  private readonly options: CircuitBreakerOptions

  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = {
      failureThreshold: options.failureThreshold ?? 5,
      resetTimeout: options.resetTimeout ?? 30000, // 30 seconds
      halfOpenMaxAttempts: options.halfOpenMaxAttempts ?? 3,
    }
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalRequests++

    // Check if circuit should transition from OPEN to HALF_OPEN
    if (this.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - (this.lastFailure || 0)
      if (timeSinceLastFailure >= this.options.resetTimeout) {
        this.state = 'HALF_OPEN'
        this.halfOpenAttempts = 0
      } else {
        throw new CircuitOpenError(
          `Circuit is OPEN. Retry after ${Math.ceil((this.options.resetTimeout - timeSinceLastFailure) / 1000)}s`,
          this.getStats()
        )
      }
    }

    // In HALF_OPEN, limit attempts
    if (this.state === 'HALF_OPEN') {
      this.halfOpenAttempts++
      if (this.halfOpenAttempts > this.options.halfOpenMaxAttempts) {
        this.state = 'OPEN'
        this.lastFailure = Date.now()
        throw new CircuitOpenError('Circuit reopened after HALF_OPEN attempts exceeded', this.getStats())
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.successes++
    this.lastSuccess = Date.now()

    if (this.state === 'HALF_OPEN') {
      // Success in HALF_OPEN means we can close the circuit
      this.state = 'CLOSED'
      this.failures = 0
      this.halfOpenAttempts = 0
    } else if (this.state === 'CLOSED') {
      // Reset failure count on success
      this.failures = 0
    }
  }

  private onFailure(): void {
    this.failures++
    this.totalFailures++
    this.lastFailure = Date.now()

    if (this.state === 'HALF_OPEN') {
      // Failure in HALF_OPEN reopens the circuit
      this.state = 'OPEN'
    } else if (this.state === 'CLOSED') {
      if (this.failures >= this.options.failureThreshold) {
        this.state = 'OPEN'
      }
    }
  }

  getStats(): CircuitStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailure: this.lastFailure,
      lastSuccess: this.lastSuccess,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
    }
  }

  isOpen(): boolean {
    return this.state === 'OPEN'
  }

  reset(): void {
    this.state = 'CLOSED'
    this.failures = 0
    this.successes = 0
    this.halfOpenAttempts = 0
  }
}

export class CircuitOpenError extends Error {
  public readonly stats: CircuitStats

  constructor(message: string, stats: CircuitStats) {
    super(message)
    this.name = 'CircuitOpenError'
    this.stats = stats
  }
}

// Singleton instances for different services
const circuitBreakers: Map<string, CircuitBreaker> = new Map()

export function getCircuitBreaker(name: string, options?: Partial<CircuitBreakerOptions>): CircuitBreaker {
  if (!circuitBreakers.has(name)) {
    circuitBreakers.set(name, new CircuitBreaker(options))
  }
  return circuitBreakers.get(name)!
}

// Pre-configured circuit breaker for Shopify
export const shopifyCircuitBreaker = getCircuitBreaker('shopify', {
  failureThreshold: 5,
  resetTimeout: 30000,    // 30 seconds
  halfOpenMaxAttempts: 2,
})

export { CircuitBreaker }
