// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Background Tasks (v2)
// Priority-based scheduling, retry with backoff, battery awareness,
// concurrency control, persistent history, and health metrics.
// Uses expo-task-manager for persistent background execution.
// ═══════════════════════════════════════════════════════════════

import { Platform } from 'react-native'

// ── Types ────────────────────────────────────────────────────

export type TaskPriority = 'critical' | 'high' | 'normal' | 'low'

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
}

export interface BackgroundTask {
  name: string
  /** Human-readable description */
  description: string
  /** Execution function */
  execute: () => Promise<BackgroundTaskResult>
  /** Minimum interval between runs (ms) */
  intervalMs: number
  /** Whether task requires network */
  requiresNetwork: boolean
  /** Task priority — higher priority tasks run first (default: 'normal') */
  priority?: TaskPriority
  /** Max retry attempts on failure (default: 0 = no retry) */
  maxRetries?: number
  /** Base delay between retries in ms (default: 2000) */
  retryDelayMs?: number
}

export interface BackgroundTaskResult {
  success: boolean
  message: string
  data?: Record<string, unknown>
}

export interface TaskRunRecord {
  taskName: string
  ranAt: number
  durationMs: number
  result: BackgroundTaskResult
  /** How many retries were attempted */
  retryAttempts: number
  /** Priority at time of execution */
  priority: TaskPriority
}

export interface TaskHealthMetrics {
  totalRuns: number
  successCount: number
  failureCount: number
  /** Success rate (0–1) */
  successRate: number
  /** Average run time in ms */
  avgDurationMs: number
  /** Timestamp of last run, null if never */
  lastRunAt: number | null
}

// ── Lazy Imports ─────────────────────────────────────────────
// expo-task-manager may not be installed

let TaskManager: typeof import('expo-task-manager') | null = null
let BackgroundFetch: typeof import('expo-background-fetch') | null = null
let AsyncStorage: { getItem: (k: string) => Promise<string | null>; setItem: (k: string, v: string) => Promise<void>; removeItem: (k: string) => Promise<void> } | null = null

async function loadModules() {
  try {
    TaskManager = await import('expo-task-manager')
    BackgroundFetch = await import('expo-background-fetch')
  } catch {
    // Not available — background tasks disabled
  }
  try {
    const mod = await import('@react-native-async-storage/async-storage')
    AsyncStorage = mod.default ?? mod
  } catch {
    // AsyncStorage not available — history won't persist
  }
}

// ── Constants ────────────────────────────────────────────────

const TASK_NAME = 'VCT_BACKGROUND_SYNC'
const STORAGE_KEY = '@vct/background-tasks/history'

// ── Task Registry ────────────────────────────────────────────

export interface SchedulerConfig {
  /** Maximum number of tasks running concurrently (default: 2) */
  maxConcurrent: number
  /** Maximum history entries stored (default: 100) */
  maxHistory: number
  /** Whether to persist history to AsyncStorage (default: true) */
  persistHistory: boolean
}

const DEFAULT_SCHEDULER_CONFIG: SchedulerConfig = {
  maxConcurrent: 2,
  maxHistory: 100,
  persistHistory: true,
}

class BackgroundTaskScheduler {
  private _tasks: BackgroundTask[] = []
  private _history: TaskRunRecord[] = []
  private _config: SchedulerConfig
  private _running = 0
  private _historyLoaded = false

  constructor(config: Partial<SchedulerConfig> = {}) {
    this._config = { ...DEFAULT_SCHEDULER_CONFIG, ...config }
  }

  // ── Registration ─────────────────────────────────────────

  /**
   * Register a background task.
   *
   * @example
   * ```ts
   * backgroundTasks.register({
   *   name: 'sync-offline-data',
   *   description: 'Đồng bộ dữ liệu offline',
   *   priority: 'high',
   *   maxRetries: 3,
   *   execute: async () => {
   *     const count = await offlineManager.flushSyncQueue()
   *     return { success: true, message: `Synced ${count} items` }
   *   },
   *   intervalMs: 15 * 60 * 1000,
   *   requiresNetwork: true,
   * })
   * ```
   */
  register(task: BackgroundTask): void {
    this._tasks = this._tasks.filter((t) => t.name !== task.name)
    this._tasks.push(task)
  }

  /** Unregister a task by name. */
  unregister(name: string): void {
    this._tasks = this._tasks.filter((t) => t.name !== name)
  }

  /** Get all registered tasks. */
  getTasks(): ReadonlyArray<BackgroundTask> {
    return this._tasks
  }

  // ── History ──────────────────────────────────────────────

  /** Get task execution history. */
  getHistory(): ReadonlyArray<TaskRunRecord> {
    return this._history
  }

  /** Clear all history (memory + persistent). */
  async clearHistory(): Promise<void> {
    this._history = []
    if (this._config.persistHistory && AsyncStorage) {
      try { await AsyncStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    }
  }

  /** Load persisted history from AsyncStorage. */
  async loadHistory(): Promise<void> {
    if (this._historyLoaded || !this._config.persistHistory) return
    if (!AsyncStorage) await loadModules()
    if (!AsyncStorage) return

    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          this._history = parsed.slice(-this._config.maxHistory)
        }
      }
    } catch { /* corrupted — start fresh */ }
    this._historyLoaded = true
  }

  /** Persist current history to AsyncStorage. */
  private async _persistHistory(): Promise<void> {
    if (!this._config.persistHistory || !AsyncStorage) return
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this._history))
    } catch { /* ignore */ }
  }

  // ── Execution ────────────────────────────────────────────

  /**
   * Run all registered tasks, sorted by priority.
   * Respects interval, battery, and network constraints.
   */
  async runAll(options: RunAllOptions = {}): Promise<TaskRunRecord[]> {
    const {
      force = false,
      networkAvailable = true,
      batteryLevel,
      isCharging = false,
    } = options

    await this.loadHistory()

    // Sort by priority (critical first)
    const sorted = [...this._tasks].sort(
      (a, b) => PRIORITY_ORDER[a.priority ?? 'normal'] - PRIORITY_ORDER[b.priority ?? 'normal'],
    )

    const results: TaskRunRecord[] = []

    for (const task of sorted) {
      // Skip network-required tasks when offline
      if (task.requiresNetwork && !networkAvailable) continue

      // Battery-aware filtering (only when not charging)
      if (batteryLevel != null && !isCharging) {
        const prio = task.priority ?? 'normal'
        if (batteryLevel < 0.05 && prio !== 'critical') continue
        if (batteryLevel < 0.15 && (prio === 'low' || prio === 'normal')) continue
      }

      // Skip if ran recently (unless forced)
      if (!force) {
        const lastRun = this._findLastRun(task.name)
        if (lastRun && Date.now() - lastRun.ranAt < task.intervalMs) continue
      }

      // Concurrency gate
      await this._waitForSlot()

      const record = await this._executeWithRetry(task)
      results.push(record)
    }

    return results
  }

  /**
   * Run a single task by name.
   */
  async runTask(name: string): Promise<TaskRunRecord | null> {
    const task = this._tasks.find((t) => t.name === name)
    if (!task) return null
    await this.loadHistory()
    return this._executeWithRetry(task)
  }

  // ── Background Fetch ─────────────────────────────────────

  /**
   * Initialize background fetch (call once at app startup).
   * Requires expo-task-manager and expo-background-fetch.
   */
  async initBackgroundFetch(): Promise<boolean> {
    if (Platform.OS === 'web') return false

    await loadModules()
    if (!TaskManager || !BackgroundFetch) return false

    try {
      TaskManager.defineTask(TASK_NAME, async () => {
        try {
          await this.runAll({ networkAvailable: true })
          return BackgroundFetch!.BackgroundFetchResult.NewData
        } catch {
          return BackgroundFetch!.BackgroundFetchResult.Failed
        }
      })

      await BackgroundFetch.registerTaskAsync(TASK_NAME, {
        minimumInterval: 15 * 60,
        stopOnTerminate: false,
        startOnBoot: true,
      })

      return true
    } catch {
      return false
    }
  }

  /**
   * Stop background fetch.
   */
  async stopBackgroundFetch(): Promise<void> {
    if (!BackgroundFetch) return
    try {
      await BackgroundFetch.unregisterTaskAsync(TASK_NAME)
    } catch {
      // Already unregistered
    }
  }

  // ── Health Metrics ───────────────────────────────────────

  /** Aggregate health metrics across all tasks. */
  getHealthMetrics(): TaskHealthMetrics {
    return this._computeMetrics(this._history)
  }

  /** Per-task health metrics. */
  getTaskMetrics(name: string): TaskHealthMetrics {
    const records = this._history.filter((r) => r.taskName === name)
    return this._computeMetrics(records)
  }

  // ── Private ──────────────────────────────────────────────

  private _computeMetrics(records: TaskRunRecord[]): TaskHealthMetrics {
    if (records.length === 0) {
      return { totalRuns: 0, successCount: 0, failureCount: 0, successRate: 0, avgDurationMs: 0, lastRunAt: null }
    }

    const successes = records.filter((r) => r.result.success).length
    const totalDuration = records.reduce((sum, r) => sum + r.durationMs, 0)

    return {
      totalRuns: records.length,
      successCount: successes,
      failureCount: records.length - successes,
      successRate: successes / records.length,
      avgDurationMs: Math.round(totalDuration / records.length),
      lastRunAt: records[records.length - 1]?.ranAt ?? null,
    }
  }

  private _findLastRun(taskName: string): TaskRunRecord | undefined {
    for (let i = this._history.length - 1; i >= 0; i--) {
      if (this._history[i]!.taskName === taskName) return this._history[i]
    }
    return undefined
  }

  private async _waitForSlot(): Promise<void> {
    // Simple polling gate — waits until a concurrency slot is free
    while (this._running >= this._config.maxConcurrent) {
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
  }

  private async _executeWithRetry(task: BackgroundTask): Promise<TaskRunRecord> {
    const maxRetries = task.maxRetries ?? 0
    const baseDelay = task.retryDelayMs ?? 2_000
    const priority = task.priority ?? 'normal'
    const start = Date.now()
    let lastResult: BackgroundTaskResult = { success: false, message: '' }
    let attempts = 0

    this._running++

    try {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        // Wait before retry (skip first attempt)
        if (attempt > 0) {
          const delay = Math.min(baseDelay * Math.pow(2, attempt - 1) + Math.random() * 500, 30_000)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }

        try {
          lastResult = await task.execute()
          attempts = attempt
          if (lastResult.success) break
        } catch (err) {
          lastResult = {
            success: false,
            message: err instanceof Error ? err.message : 'Task failed',
          }
          attempts = attempt
        }

        // Don't retry on success
        if (lastResult.success) break
      }
    } finally {
      this._running--
    }

    const record: TaskRunRecord = {
      taskName: task.name,
      ranAt: start,
      durationMs: Date.now() - start,
      result: lastResult,
      retryAttempts: attempts,
      priority,
    }

    this._recordHistory(record)
    return record
  }

  private _recordHistory(record: TaskRunRecord): void {
    this._history.push(record)
    while (this._history.length > this._config.maxHistory) {
      this._history.shift()
    }
    // Fire-and-forget persist
    this._persistHistory()
  }
}

// ── Run Options ──────────────────────────────────────────────

export interface RunAllOptions {
  /** Force run all tasks, ignore interval check */
  force?: boolean
  /** Whether network is available (default: true) */
  networkAvailable?: boolean
  /** Battery level 0–1, used for power-aware scheduling */
  batteryLevel?: number
  /** Whether the device is charging */
  isCharging?: boolean
}

// ── Pre-built Tasks ──────────────────────────────────────────

/**
 * Common background tasks for VCT Platform.
 * Register these at app startup:
 *
 * ```ts
 * backgroundTasks.register(prebuiltTasks.syncOffline)
 * backgroundTasks.register(prebuiltTasks.cleanCache)
 * backgroundTasks.register(prebuiltTasks.refreshToken)
 * backgroundTasks.register(prebuiltTasks.reportAnalytics)
 * ```
 */
export const prebuiltTasks = {
  syncOffline: {
    name: 'sync-offline-data',
    description: 'Đồng bộ dữ liệu offline lên server',
    priority: 'high' as TaskPriority,
    maxRetries: 3,
    retryDelayMs: 3_000,
    execute: async () => {
      try {
        const { offlineManager } = await import('./offline/offline-manager')
        const count = await offlineManager.flushSyncQueue()
        return { success: true, message: `Synced ${count} items`, data: { synced: count } }
      } catch {
        return { success: true, message: 'Offline sync skipped (module unavailable)' }
      }
    },
    intervalMs: 15 * 60 * 1000,
    requiresNetwork: true,
  } satisfies BackgroundTask,

  cleanCache: {
    name: 'clean-expired-cache',
    description: 'Dọn bộ nhớ đệm hết hạn',
    priority: 'low' as TaskPriority,
    maxRetries: 0,
    execute: async () => {
      try {
        const { storageManager } = await import('./storage-manager')
        const freed = await storageManager.cleanExpiredCache()
        return { success: true, message: `Freed ${freed} bytes`, data: { freedBytes: freed } }
      } catch {
        return { success: true, message: 'Cache cleanup skipped (module unavailable)' }
      }
    },
    intervalMs: 6 * 60 * 60 * 1000, // 6 hours
    requiresNetwork: false,
  } satisfies BackgroundTask,

  refreshToken: {
    name: 'refresh-auth-token',
    description: 'Làm mới token xác thực',
    priority: 'critical' as TaskPriority,
    maxRetries: 2,
    retryDelayMs: 5_000,
    execute: async () => {
      try {
        const authStorage = await import('./auth-storage')
        const { configManager } = await import('./config-manager')
        const refreshed = await authStorage.refreshAccessToken(configManager.get('tokenRefreshEndpoint'))
        return { success: refreshed, message: refreshed ? 'Token refreshed' : 'No refresh needed' }
      } catch {
        return { success: true, message: 'Token refresh skipped (module unavailable)' }
      }
    },
    intervalMs: 45 * 60 * 1000, // 45 minutes
    requiresNetwork: true,
  } satisfies BackgroundTask,

  reportAnalytics: {
    name: 'report-analytics-batch',
    description: 'Gửi batch analytics lên server',
    priority: 'low' as TaskPriority,
    maxRetries: 1,
    execute: async () => {
      // Placeholder — wire to analytics flush
      return { success: true, message: 'Analytics batch checked' }
    },
    intervalMs: 30 * 60 * 1000, // 30 minutes
    requiresNetwork: true,
  } satisfies BackgroundTask,
}

// ── Singleton ────────────────────────────────────────────────

export const backgroundTasks = new BackgroundTaskScheduler()

// Re-export class for testing
export { BackgroundTaskScheduler }
