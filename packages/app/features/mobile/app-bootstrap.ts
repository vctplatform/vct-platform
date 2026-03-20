// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — App Bootstrap
// Initializes all mobile services in the correct dependency order.
// Supports concurrent phases, timeouts, and critical/optional steps.
// ═══════════════════════════════════════════════════════════════

import { i18n } from './mobile-i18n'
import { featureFlags } from './feature-flags'
import { appLifecycle } from './app-lifecycle'
import { crashReporter, type CrashReporterConfig } from './crash-reporter'
import { backgroundTasks, prebuiltTasks } from './background-tasks'
import { storageManager } from './storage-manager'
import { requestLogger } from './request-logger'
import { interceptorChain, authInterceptor, platformInterceptor } from './interceptor-chain'
import { getDeviceSummary } from './device-info'
import { configManager, type Environment } from './config-manager'

// ── Types ────────────────────────────────────────────────────

export interface BootstrapOptions {
  /** Environment override (default: auto-detect) */
  environment?: Environment
  /** Crash reporter configuration */
  crashReporter?: Partial<CrashReporterConfig>
  /** Skip background task registration (default: false) */
  skipBackgroundTasks?: boolean
  /** App version string */
  appVersion?: string
  /** Global timeout for entire bootstrap (ms) */
  timeoutMs?: number
  /** Callback for loading progress (0-100) */
  onProgress?: (percent: number, stepName: string) => void
}

export interface BootstrapResult {
  success: boolean
  durationMs: number
  steps: BootstrapStep[]
  errors: string[]
  isCriticalFailure: boolean
}

export interface BootstrapStep {
  name: string
  durationMs: number
  success: boolean
  error?: string
  isCritical: boolean
}

// ── Internal Runner ──────────────────────────────────────────

async function runStepWithTimeout(
  name: string,
  fn: () => Promise<void>,
  timeoutMs: number = 5000,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout after ${timeoutMs}ms`))
    }, timeoutMs)

    fn()
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timer))
  })
}

// ── Bootstrap ────────────────────────────────────────────────

/**
 * Initialize all mobile services in dependency order using concurrent phases.
 * Call once in App.tsx before rendering.
 */
export async function bootstrapApp(
  options: BootstrapOptions = {},
): Promise<BootstrapResult> {
  const startTime = Date.now()
  const steps: BootstrapStep[] = []
  const errors: string[] = []
  let isCriticalFailure = false

  // Determine total steps for progress calculation
  const totalExpectedSteps = 8 + (options.skipBackgroundTasks ? -1 : 0)
  let stepsCompleted = 0

  const reportProgress = (stepName: string) => {
    stepsCompleted++
    const percent = Math.min(Math.round((stepsCompleted / totalExpectedSteps) * 100), 100)
    options.onProgress?.(percent, stepName)
  }

  const runPhase = async (
    tasks: Array<{ name: string; isCritical?: boolean; timeoutMs?: number; fn: () => Promise<void> }>
  ) => {
    if (isCriticalFailure) return

    const promises = tasks.map(async ({ name, isCritical = true, timeoutMs = 5000, fn }) => {
      const stepStart = Date.now()
      try {
        await runStepWithTimeout(name, fn, timeoutMs)
        steps.push({ name, durationMs: Date.now() - stepStart, success: true, isCritical })
        reportProgress(name)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        steps.push({ name, durationMs: Date.now() - stepStart, success: false, error: msg, isCritical })
        errors.push(`[${name}] ${msg}`)
        reportProgress(`Error: ${name}`)
        if (isCritical) {
          isCriticalFailure = true
        }
      }
    })

    await Promise.allSettled(promises)
  }

  // ── Pre-boot (Synchronous/Fast) ──────────────────────────
  if (options.environment) {
    configManager.setEnvironment(options.environment)
  }

  // ── Phase 1: Core / Local (Concurrent) ─────────────────────
  // These read from local storage and setup basic offline capabilities.
  await runPhase([
    {
      name: 'storage-migrations',
      isCritical: true, // DB schema must be correct
      fn: async () => {
        const count = await storageManager.runMigrations()
        if (count > 0) console.warn(`[Boot] Ran ${count} storage migrations`)
      },
    },
    {
      name: 'i18n',
      isCritical: false, // fallback to default immediately
      fn: async () => {
        await i18n.init()
      },
    },
    {
      name: 'interceptors',
      isCritical: true, // networking relies on this
      fn: async () => {
        const version = options.appVersion ?? '1.0.0'
        interceptorChain.useRequest(platformInterceptor(version))
        interceptorChain.registerProfile('authenticated', {
          request: [
            authInterceptor(async () => {
              const authModule = await import('./auth-storage')
              return authModule.getAccessToken()
            }),
          ],
        })
        interceptorChain.useRequest(requestLogger.requestInterceptor())
        interceptorChain.useResponse(requestLogger.responseInterceptor())
      },
    },
  ])

  // ── Phase 2: Remote / Network Dependents ───────────────────
  await runPhase([
    {
      name: 'feature-flags',
      isCritical: false, // best-effort cache/network fetch
      fn: async () => {
        await featureFlags.init?.()
      },
    },
    {
      name: 'crash-reporter',
      isCritical: false,
      fn: async () => {
        crashReporter.configure({
          ...options.crashReporter,
          enabled: configManager.get('enableCrashReporting'),
        })
        crashReporter.setTag('environment', configManager.environment)
        crashReporter.setTag('appVersion', options.appVersion ?? '1.0.0')
        crashReporter.addBreadcrumb('lifecycle', `App boot on ${getDeviceSummary()}`)
      },
    },
  ])

  // ── Phase 3: Background / Deferred ─────────────────────────
  await runPhase([
    {
      name: 'background-tasks',
      isCritical: false,
      fn: async () => {
        if (options.skipBackgroundTasks) return
        backgroundTasks.register(prebuiltTasks.syncOffline)
        backgroundTasks.register(prebuiltTasks.cleanCache)
        backgroundTasks.register(prebuiltTasks.refreshToken)
        backgroundTasks.register({
          ...prebuiltTasks.syncOffline,
          name: 'report-analytics-batch', // Overridden in background-tasks, fake duplicate for backward compat
        })
        await backgroundTasks.initBackgroundFetch()
      },
    },
    {
      name: 'lifecycle-listeners',
      isCritical: false,
      fn: async () => {
        appLifecycle.onResume(async (bgMs) => {
          crashReporter.addBreadcrumb('lifecycle', `Resumed after ${Math.round(bgMs / 1000)}s`)
          if (bgMs > 5 * 60 * 1000) {
            await backgroundTasks.runAll({ force: false })
          }
        })
        appLifecycle.onBackground(() => {
          crashReporter.addBreadcrumb('lifecycle', 'App backgrounded')
        })
      },
    },
    {
      name: 'cache-cleanup',
      isCritical: false,
      fn: async () => {
        const removed = await storageManager.cleanExpiredCache()
        if (removed > 0) console.warn(`[Boot] Cleaned ${removed} expired cache entries`)
      },
    },
  ])

  const result: BootstrapResult = {
    success: !isCriticalFailure && errors.length === 0,
    isCriticalFailure,
    durationMs: Date.now() - startTime,
    steps,
    errors,
  }

  // Log boot summary
  const stepSummary = steps.map((s) => `${s.success ? '✅' : '❌'} ${s.name} (${s.durationMs}ms)`).join('\n  ')
  console.warn(`[Boot] ${result.success ? '✅' : (isCriticalFailure ? '⛔' : '⚠️')} Completed in ${result.durationMs}ms:\n  ${stepSummary}`)

  return result
}

