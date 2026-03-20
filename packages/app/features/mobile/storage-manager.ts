// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Storage Manager
// AsyncStorage quota tracking, cleanup policies, data migration,
// and storage health monitoring.
// ═══════════════════════════════════════════════════════════════

import AsyncStorage from '@react-native-async-storage/async-storage'

// ── Types ────────────────────────────────────────────────────

export interface StorageStats {
  totalKeys: number
  estimatedSizeBytes: number
  breakdown: StorageBreakdown[]
}

export interface StorageBreakdown {
  prefix: string
  label: string
  keyCount: number
  estimatedBytes: number
  percentage: number
}

export interface StorageMigration {
  version: number
  name: string
  migrate: () => Promise<void>
}

// ── Constants ────────────────────────────────────────────────

const MIGRATION_VERSION_KEY = 'vct-storage-version'

/** Known storage prefixes for categorization. */
const STORAGE_PREFIXES = [
  { prefix: 'vct-img-cache:', label: 'Bộ nhớ đệm hình ảnh' },
  { prefix: 'vct-feature-flags', label: 'Feature flags' },
  { prefix: 'vct-locale', label: 'Cài đặt ngôn ngữ' },
  { prefix: 'vct-update-', label: 'Cập nhật ứng dụng' },
  { prefix: 'vct-offline-', label: 'Dữ liệu offline' },
  { prefix: 'vct-sync-', label: 'Hàng đợi đồng bộ' },
  { prefix: 'vct-auth-', label: 'Xác thực' },
  { prefix: 'vct-perf-', label: 'Hiệu suất' },
]

// ── Storage Manager ──────────────────────────────────────────

class StorageManager {
  private _migrations: StorageMigration[] = []

  /**
   * Get storage usage statistics.
   */
  async getStats(): Promise<StorageStats> {
    const allKeys = await AsyncStorage.getAllKeys()
    const breakdown: StorageBreakdown[] = []
    let totalSize = 0

    // Categorize by prefix
    for (const { prefix, label } of STORAGE_PREFIXES) {
      const keys = allKeys.filter((k) => k.startsWith(prefix))
      if (keys.length === 0) continue

      let size = 0
      const pairs = await Promise.all(
        keys.map(async (k) => [k, await AsyncStorage.getItem(k)] as const)
      )
      for (const [key, value] of pairs) {
        size += (key?.length ?? 0) + (value?.length ?? 0)
      }

      totalSize += size
      breakdown.push({
        prefix,
        label,
        keyCount: keys.length,
        estimatedBytes: size * 2, // UTF-16
        percentage: 0,
      })
    }

    // Uncategorized
    const categorizedKeys = new Set(
      breakdown.flatMap((b) =>
        allKeys.filter((k) => k.startsWith(b.prefix)),
      ),
    )
    const uncategorized = allKeys.filter((k) => !categorizedKeys.has(k))
    if (uncategorized.length > 0) {
      let size = 0
      const pairs = await Promise.all(
        uncategorized.map(async (k) => [k, await AsyncStorage.getItem(k)] as const)
      )
      for (const [key, value] of pairs) {
        size += (key?.length ?? 0) + (value?.length ?? 0)
      }
      totalSize += size
      breakdown.push({
        prefix: '(other)',
        label: 'Khác',
        keyCount: uncategorized.length,
        estimatedBytes: size * 2,
        percentage: 0,
      })
    }

    // Calculate percentages
    const totalBytes = totalSize * 2
    for (const b of breakdown) {
      b.percentage = totalBytes > 0
        ? Math.round((b.estimatedBytes / totalBytes) * 100)
        : 0
    }

    return {
      totalKeys: allKeys.length,
      estimatedSizeBytes: totalBytes,
      breakdown: breakdown.sort((a, b) => b.estimatedBytes - a.estimatedBytes),
    }
  }

  /**
   * Clean up expired cache entries.
   *
   * @returns Number of keys removed
   */
  async cleanExpiredCache(): Promise<number> {
    const allKeys = await AsyncStorage.getAllKeys()
    const cacheKeys = allKeys.filter((k) => k.startsWith('vct-img-cache:'))

    if (cacheKeys.length === 0) return 0

    const now = Date.now()
    const keysToRemove: string[] = []

    const pairs = await Promise.all(
      cacheKeys.map(async (k) => [k, await AsyncStorage.getItem(k)] as const)
    )
    for (const [key, value] of pairs) {
      if (!key || !value) continue
      try {
        const cached = JSON.parse(value)
        if (cached.cachedAt && now - cached.cachedAt > 24 * 60 * 60 * 1000) {
          keysToRemove.push(key)
        }
      } catch {
        keysToRemove.push(key!) // Corrupted entry
      }
    }

    if (keysToRemove.length > 0) {
      await Promise.all(keysToRemove.map((k) => AsyncStorage.removeItem(k)))
    }

    return keysToRemove.length
  }

  /**
   * Clear storage by category.
   */
  async clearByPrefix(prefix: string): Promise<number> {
    const allKeys = await AsyncStorage.getAllKeys()
    const keys = allKeys.filter((k) => k.startsWith(prefix))

    if (keys.length > 0) {
      await Promise.all(keys.map((k) => AsyncStorage.removeItem(k)))
    }

    return keys.length
  }

  /**
   * Clear all VCT data (keeps non-VCT keys for other libs).
   */
  async clearAllVCTData(): Promise<number> {
    const allKeys = await AsyncStorage.getAllKeys()
    const vctKeys = allKeys.filter((k) => k.startsWith('vct-'))

    if (vctKeys.length > 0) {
      await Promise.all(vctKeys.map((k) => AsyncStorage.removeItem(k)))
    }

    return vctKeys.length
  }

  /**
   * Format bytes for display.
   */
  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // ── Migrations ─────────────────────────────────────────────

  /**
   * Register a storage migration.
   *
   * @example
   * ```ts
   * storageManager.registerMigration({
   *   version: 2,
   *   name: 'Migrate auth tokens to new format',
   *   migrate: async () => {
   *     const old = await AsyncStorage.getItem('auth_token')
   *     if (old) {
   *       await AsyncStorage.setItem('vct-auth-access', old)
   *       await AsyncStorage.removeItem('auth_token')
   *     }
   *   },
   * })
   * ```
   */
  registerMigration(migration: StorageMigration): void {
    this._migrations.push(migration)
    this._migrations.sort((a, b) => a.version - b.version)
  }

  /**
   * Run pending migrations.
   *
   * @returns Number of migrations executed
   */
  async runMigrations(): Promise<number> {
    const currentStr = await AsyncStorage.getItem(MIGRATION_VERSION_KEY)
    const current = currentStr ? parseInt(currentStr, 10) : 0
    let executed = 0

    for (const migration of this._migrations) {
      if (migration.version > current) {
        try {
          await migration.migrate()
          await AsyncStorage.setItem(
            MIGRATION_VERSION_KEY,
            String(migration.version),
          )
          executed++
        } catch (error) {
          console.error(
            `[Storage] Migration ${migration.version} (${migration.name}) failed:`,
            error,
          )
          break // Stop on first failure
        }
      }
    }

    return executed
  }
}

// ── Singleton ────────────────────────────────────────────────

export const storageManager = new StorageManager()
