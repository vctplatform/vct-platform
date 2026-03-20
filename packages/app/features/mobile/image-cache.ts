// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Image Cache & Progressive Loading
// In-memory LRU + disk cache for tournament/athlete images.
// Enhanced with health metrics, hit tracking, and retry prefetch.
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { Image, PixelRatio } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

// ── Types ────────────────────────────────────────────────────

export interface CachedImage {
  uri: string
  width: number
  height: number
  cachedAt: number
  sizeBytes: number
}

export interface ImageCacheConfig {
  /** Max items in memory cache (default: 100) */
  maxMemory: number
  /** Max disk cache entries (default: 500) */
  maxDisk: number
  /** TTL for cached images in ms (default: 24h) */
  ttlMs: number
  /** Max image dimension for thumbnails */
  thumbnailSize: number
  /** Retry attempts for prefetch (default: 1) */
  prefetchRetries: number
}

export interface ProgressiveImageState {
  /** Current image URI (thumbnail → full) */
  uri: string | null
  /** Whether thumbnail is loaded */
  thumbnailLoaded: boolean
  /** Whether full image is loaded */
  fullLoaded: boolean
  /** Loading in progress */
  loading: boolean
  /** Error message */
  error: string | null
}

export interface ImageCacheHealth {
  memoryUsed: number
  memoryMax: number
  memoryUsagePercent: number
  cacheHits: number
  cacheMisses: number
  hitRate: number
  evictions: number
  prefetchSuccesses: number
  prefetchFailures: number
}

// ── Constants ────────────────────────────────────────────────

const CACHE_PREFIX = 'vct-img-cache:'
const DEFAULT_CONFIG: ImageCacheConfig = {
  maxMemory: 100,
  maxDisk: 500,
  ttlMs: 24 * 60 * 60 * 1000,
  thumbnailSize: 80,
  prefetchRetries: 1,
}

// ── In-Memory LRU Cache ──────────────────────────────────────

class LRUCache<T> {
  private _map = new Map<string, T>()
  private _max: number
  private _evictionCount = 0
  private _onEvict?: (key: string, value: T) => void

  constructor(max: number, onEvict?: (key: string, value: T) => void) {
    this._max = max
    this._onEvict = onEvict
  }

  get(key: string): T | undefined {
    const value = this._map.get(key)
    if (value !== undefined) {
      // Move to end (most recently used)
      this._map.delete(key)
      this._map.set(key, value)
    }
    return value
  }

  set(key: string, value: T): void {
    if (this._map.has(key)) {
      this._map.delete(key)
    } else if (this._map.size >= this._max) {
      // Evict oldest
      const firstKey = this._map.keys().next().value
      if (firstKey) {
        const evicted = this._map.get(firstKey)
        this._map.delete(firstKey)
        this._evictionCount++
        if (evicted && this._onEvict) {
          try { this._onEvict(firstKey, evicted) } catch { /* safe */ }
        }
      }
    }
    this._map.set(key, value)
  }

  has(key: string): boolean {
    return this._map.has(key)
  }

  delete(key: string): void {
    this._map.delete(key)
  }

  clear(): void {
    this._map.clear()
  }

  get size(): number {
    return this._map.size
  }

  get evictionCount(): number {
    return this._evictionCount
  }

  /** Iterate all entries (for debugging/export). */
  entries(): IterableIterator<[string, T]> {
    return this._map.entries()
  }
}

// ── Image Cache Service ──────────────────────────────────────

class ImageCacheService {
  private _memCache: LRUCache<CachedImage>
  private _config: ImageCacheConfig
  private _hits = 0
  private _misses = 0
  private _prefetchOk = 0
  private _prefetchFail = 0

  constructor(config: Partial<ImageCacheConfig> = {}) {
    this._config = { ...DEFAULT_CONFIG, ...config }
    this._memCache = new LRUCache<CachedImage>(this._config.maxMemory)
  }

  /**
   * Get a cached image, check memory → disk → null.
   */
  async get(uri: string): Promise<CachedImage | null> {
    // Memory cache (instant)
    const memCached = this._memCache.get(uri)
    if (memCached && !this._isExpired(memCached)) {
      this._hits++
      return memCached
    }

    // Disk cache
    try {
      const raw = await AsyncStorage.getItem(CACHE_PREFIX + uri)
      if (raw) {
        const cached: CachedImage = JSON.parse(raw)
        if (!this._isExpired(cached)) {
          this._memCache.set(uri, cached)
          this._hits++
          return cached
        }
        // Expired — remove
        await AsyncStorage.removeItem(CACHE_PREFIX + uri)
      }
    } catch {
      // Ignore
    }

    this._misses++
    return null
  }

  /**
   * Cache an image with its metadata.
   */
  async set(image: CachedImage): Promise<void> {
    this._memCache.set(image.uri, image)

    try {
      await AsyncStorage.setItem(
        CACHE_PREFIX + image.uri,
        JSON.stringify(image),
      )
    } catch {
      // Disk full or error — memory cache is still valid
    }
  }

  /**
   * Prefetch images in background with retry support.
   */
  async prefetch(uris: string[]): Promise<void> {
    const uncached = uris.filter((uri) => !this._memCache.has(uri))

    await Promise.allSettled(
      uncached.map(async (uri) => {
        let _lastError: unknown
        const maxAttempts = 1 + this._config.prefetchRetries

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          try {
            await Image.prefetch(uri)
            const size = await this._getImageSize(uri)
            await this.set({
              uri,
              width: size.width,
              height: size.height,
              cachedAt: Date.now(),
              sizeBytes: 0,
            })
            this._prefetchOk++
            return // success
          } catch (err) {
            _lastError = err
            if (attempt < maxAttempts - 1) {
              await new Promise((r) => setTimeout(r, 500)) // 500ms retry delay
            }
          }
        }
        this._prefetchFail++
        // All retries failed — skip silently
      }),
    )
  }

  /**
   * Build optimized image URL with size parameters.
   * Works with CDNs that support query-param resizing.
   */
  getOptimizedUrl(
    uri: string,
    options: { width?: number; height?: number; quality?: number } = {},
  ): string {
    const scale = PixelRatio.get()
    const w = options.width ? Math.round(options.width * scale) : undefined
    const h = options.height ? Math.round(options.height * scale) : undefined
    const q = options.quality ?? 80

    const url = new URL(uri)
    if (w) url.searchParams.set('w', String(w))
    if (h) url.searchParams.set('h', String(h))
    url.searchParams.set('q', String(q))
    url.searchParams.set('fm', 'webp')

    return url.toString()
  }

  /**
   * Get thumbnail URL (for progressive loading placeholder).
   */
  getThumbnailUrl(uri: string): string {
    return this.getOptimizedUrl(uri, {
      width: this._config.thumbnailSize,
      quality: 30,
    })
  }

  /**
   * Clear all caches.
   */
  async clear(): Promise<void> {
    this._memCache.clear()
    try {
      const allKeys = await AsyncStorage.getAllKeys()
      const cacheKeys = allKeys.filter((k: string) => k.startsWith(CACHE_PREFIX))
      if (cacheKeys.length) await Promise.all(cacheKeys.map((k: string) => AsyncStorage.removeItem(k)))
    } catch {
      // Ignore
    }
  }

  /**
   * Get basic cache stats.
   */
  getStats(): { memoryCached: number; maxMemory: number } {
    return {
      memoryCached: this._memCache.size,
      maxMemory: this._config.maxMemory,
    }
  }

  /**
   * Get detailed cache health metrics.
   */
  getHealth(): ImageCacheHealth {
    const totalLookups = this._hits + this._misses
    return {
      memoryUsed: this._memCache.size,
      memoryMax: this._config.maxMemory,
      memoryUsagePercent: this._config.maxMemory > 0
        ? Math.round((this._memCache.size / this._config.maxMemory) * 100)
        : 0,
      cacheHits: this._hits,
      cacheMisses: this._misses,
      hitRate: totalLookups > 0 ? Math.round((this._hits / totalLookups) * 100) : 0,
      evictions: this._memCache.evictionCount,
      prefetchSuccesses: this._prefetchOk,
      prefetchFailures: this._prefetchFail,
    }
  }

  /**
   * Count disk cache entries.
   */
  async getDiskCount(): Promise<number> {
    try {
      const allKeys = await AsyncStorage.getAllKeys()
      return allKeys.filter((k: string) => k.startsWith(CACHE_PREFIX)).length
    } catch {
      return 0
    }
  }

  /**
   * Reconfigure cache settings dynamically.
   */
  reconfigure(config: Partial<ImageCacheConfig>): void {
    this._config = { ...this._config, ...config }
    // Rebuild memory cache with new max if changed
    if (config.maxMemory !== undefined) {
      const entries = Array.from(this._memCache.entries())
      const newCache = new LRUCache<CachedImage>(config.maxMemory)
      for (const [key, val] of entries) {
        newCache.set(key, val)
      }
      this._memCache = newCache
    }
  }

  // ── Private ──────────────────────────────────────────────

  private _isExpired(cached: CachedImage): boolean {
    return Date.now() - cached.cachedAt > this._config.ttlMs
  }

  private _getImageSize(uri: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      Image.getSize(
        uri,
        (w, h) => resolve({ width: w, height: h }),
        reject,
      )
    })
  }
}

// ── Singleton ────────────────────────────────────────────────

export const imageCache = new ImageCacheService()

// ── React Hook ───────────────────────────────────────────────

/**
 * Progressive image loading: shows blurry thumbnail, then loads full image.
 */
export function useProgressiveImage(
  uri: string | undefined,
  options: { width?: number; height?: number; quality?: number } = {},
): ProgressiveImageState {
  const [state, setState] = useState<ProgressiveImageState>({
    uri: null,
    thumbnailLoaded: false,
    fullLoaded: false,
    loading: !!uri,
    error: null,
  })

  useEffect(() => {
    if (!uri) {
      setState({ uri: null, thumbnailLoaded: false, fullLoaded: false, loading: false, error: null })
      return
    }

    let cancelled = false

    const load = async () => {
      try {
        // Step 1: Show thumbnail (fast, low quality)
        const thumbUrl = imageCache.getThumbnailUrl(uri)
        if (!cancelled) {
          setState((s) => ({ ...s, uri: thumbUrl, loading: true }))
        }

        await Image.prefetch(thumbUrl)
        if (!cancelled) {
          setState((s) => ({ ...s, thumbnailLoaded: true }))
        }

        // Step 2: Load full image
        const fullUrl = imageCache.getOptimizedUrl(uri, options)
        await Image.prefetch(fullUrl)

        if (!cancelled) {
          setState({
            uri: fullUrl,
            thumbnailLoaded: true,
            fullLoaded: true,
            loading: false,
            error: null,
          })
        }
      } catch (err) {
        if (!cancelled) {
          setState((s) => ({
            ...s,
            loading: false,
            error: err instanceof Error ? err.message : 'Image load failed',
          }))
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [uri, options.width, options.height, options.quality])

  return state
}

