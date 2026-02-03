/**
 * Client-side Caching Utilities
 *
 * Provides intelligent caching for API responses and computed data.
 */

// ============================================================================
// MEMORY CACHE
// ============================================================================

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private maxSize: number

  constructor(maxSize = 100) {
    this.maxSize = maxSize
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    // Clean up if at max capacity
    if (this.cache.size >= this.maxSize) {
      this.cleanup()
    }

    const now = Date.now()
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttlMs,
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }
    return true
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  private cleanup(): void {
    const now = Date.now()
    const entries = Array.from(this.cache.entries())

    // Remove expired entries
    entries.forEach(([key, entry]) => {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    })

    // If still at capacity, remove oldest entries
    if (this.cache.size >= this.maxSize) {
      const sortedEntries = entries
        .filter(([_, entry]) => now <= entry.expiresAt)
        .sort((a, b) => a[1].timestamp - b[1].timestamp)

      const toRemove = sortedEntries.slice(0, Math.floor(this.maxSize * 0.2))
      toRemove.forEach(([key]) => this.cache.delete(key))
    }
  }

  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    }
  }
}

// Global cache instance
export const cache = new MemoryCache(200)

// ============================================================================
// CACHED FETCH
// ============================================================================

interface CachedFetchOptions extends RequestInit {
  /** Cache TTL in milliseconds */
  cacheTtl?: number
  /** Force refresh even if cached */
  forceRefresh?: boolean
  /** Cache key override */
  cacheKey?: string
}

/**
 * Fetch with automatic caching
 */
export async function cachedFetch<T>(
  url: string,
  options: CachedFetchOptions = {}
): Promise<T> {
  const { cacheTtl = 60000, forceRefresh = false, cacheKey, ...fetchOptions } = options

  const key = cacheKey || `fetch:${url}:${JSON.stringify(fetchOptions)}`

  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = cache.get<T>(key)
    if (cached !== null) {
      return cached
    }
  }

  // Fetch fresh data
  const response = await fetch(url, fetchOptions)

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()

  // Cache the response
  cache.set(key, data, cacheTtl)

  return data as T
}

// ============================================================================
// STALE-WHILE-REVALIDATE
// ============================================================================

interface SWROptions<T> {
  /** Cache TTL in milliseconds */
  ttl?: number
  /** Callback when data is refreshed */
  onRefresh?: (data: T) => void
  /** Error handler */
  onError?: (error: Error) => void
}

/**
 * Stale-while-revalidate pattern
 * Returns cached data immediately while fetching fresh data in background
 */
export async function staleWhileRevalidate<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: SWROptions<T> = {}
): Promise<{ data: T | null; isStale: boolean }> {
  const { ttl = 60000, onRefresh, onError } = options

  // Check for cached data
  const cached = cache.get<T>(key)

  if (cached !== null) {
    // Return stale data immediately, revalidate in background
    fetcher()
      .then((freshData) => {
        cache.set(key, freshData, ttl)
        onRefresh?.(freshData)
      })
      .catch((error) => {
        onError?.(error)
      })

    return { data: cached, isStale: true }
  }

  // No cache, fetch and wait
  try {
    const data = await fetcher()
    cache.set(key, data, ttl)
    return { data, isStale: false }
  } catch (error) {
    onError?.(error as Error)
    return { data: null, isStale: false }
  }
}

// ============================================================================
// LOCAL STORAGE CACHE
// ============================================================================

const STORAGE_PREFIX = 'yeoskin_cache_'

interface StorageEntry<T> {
  data: T
  expiresAt: number
}

/**
 * Get item from localStorage with expiry check
 */
export function getStorageItem<T>(key: string): T | null {
  if (typeof window === 'undefined') return null

  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key)
    if (!item) return null

    const entry: StorageEntry<T> = JSON.parse(item)

    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(STORAGE_PREFIX + key)
      return null
    }

    return entry.data
  } catch {
    return null
  }
}

/**
 * Set item in localStorage with TTL
 */
export function setStorageItem<T>(key: string, data: T, ttlMs: number): void {
  if (typeof window === 'undefined') return

  try {
    const entry: StorageEntry<T> = {
      data,
      expiresAt: Date.now() + ttlMs,
    }
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry))
  } catch {
    // Storage might be full, clear old entries
    clearExpiredStorage()
  }
}

/**
 * Remove item from localStorage
 */
export function removeStorageItem(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_PREFIX + key)
}

/**
 * Clear all expired storage items
 */
export function clearExpiredStorage(): void {
  if (typeof window === 'undefined') return

  const now = Date.now()
  const keysToRemove: string[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key?.startsWith(STORAGE_PREFIX)) continue

    try {
      const item = localStorage.getItem(key)
      if (!item) continue

      const entry = JSON.parse(item)
      if (now > entry.expiresAt) {
        keysToRemove.push(key)
      }
    } catch {
      keysToRemove.push(key!)
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key))
}

// ============================================================================
// CACHE UTILITIES
// ============================================================================

/**
 * Create a cache key from multiple parts
 */
export function createCacheKey(...parts: (string | number | boolean | null | undefined)[]): string {
  return parts.filter(Boolean).join(':')
}

/**
 * Invalidate cache entries matching a pattern
 */
export function invalidateCache(pattern: string | RegExp): void {
  // This is a simplified implementation
  // In production, you might want a more sophisticated solution
  cache.clear()
}
