// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — App Update Hook
// Checks app version against remote config, triggers forced or
// optional update flows.
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { Platform, Linking } from 'react-native'
import Constants from 'expo-constants'
import AsyncStorage from '@react-native-async-storage/async-storage'

// ── Types ────────────────────────────────────────────────────

export interface AppUpdateConfig {
  /** Minimum required version (blocks app if below) */
  minVersion: string
  /** Latest available version */
  latestVersion: string
  /** App Store / Play Store URLs */
  storeUrl: {
    ios: string
    android: string
  }
  /** Update message (Vietnamese) */
  message: string
  /** Whether update is mandatory */
  mandatory: boolean
}

export interface AppUpdateState {
  /** Whether an update is available */
  updateAvailable: boolean
  /** Whether update is mandatory (blocks app usage) */
  isMandatory: boolean
  /** Current app version */
  currentVersion: string
  /** Latest available version */
  latestVersion: string | null
  /** Update message */
  message: string | null
  /** Loading state */
  isChecking: boolean
  /** Open the appropriate store */
  openStore: () => Promise<void>
  /** Dismiss optional update (remembers for 24h) */
  dismiss: () => Promise<void>
  /** Re-check for updates */
  checkForUpdate: () => Promise<void>
}

// ── Semver comparison ────────────────────────────────────────

function parseVersion(v: string): number[] {
  return v.replace(/^v/, '').split('.').map(Number)
}

function isVersionBelow(current: string, minimum: string): boolean {
  const a = parseVersion(current)
  const b = parseVersion(minimum)
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const ca = a[i] ?? 0
    const cb = b[i] ?? 0
    if (ca < cb) return true
    if (ca > cb) return false
  }
  return false
}

// ── Constants ────────────────────────────────────────────────

const DISMISS_KEY = 'vct-update-dismissed-at'
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

// ── Hook ─────────────────────────────────────────────────────

/**
 * Check for app updates and manage update flow.
 *
 * @param configUrl - URL to fetch update config JSON
 *
 * @example
 * ```tsx
 * function App() {
 *   const update = useAppUpdate('https://api.vct-platform.com/v1/app/version')
 *
 *   if (update.isMandatory) {
 *     return <ForceUpdateModal update={update} />
 *   }
 *
 *   return (
 *     <>
 *       {update.updateAvailable && <UpdateBanner update={update} />}
 *       <MainApp />
 *     </>
 *   )
 * }
 * ```
 */
export function useAppUpdate(configUrl: string): AppUpdateState {
  const currentVersion =
    Constants.expoConfig?.version ?? Constants.manifest2?.extra?.expoClient?.version ?? '1.0.0'

  const [latestVersion, setLatestVersion] = useState<string | null>(null)
  const [isMandatory, setIsMandatory] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [storeUrls, setStoreUrls] = useState<AppUpdateConfig['storeUrl']>({
    ios: '',
    android: '',
  })
  const [isChecking, setIsChecking] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const checkForUpdate = useCallback(async () => {
    setIsChecking(true)
    try {
      const response = await fetch(configUrl)
      if (!response.ok) return

      const config: AppUpdateConfig = await response.json()
      setLatestVersion(config.latestVersion)
      setMessage(config.message)
      setStoreUrls(config.storeUrl)

      // Check mandatory (below minimum)
      const belowMin = isVersionBelow(currentVersion, config.minVersion)
      setIsMandatory(belowMin || config.mandatory)

      // Check if dismissed recently (for optional updates only)
      if (!belowMin) {
        const dismissedAt = await AsyncStorage.getItem(DISMISS_KEY)
        if (dismissedAt) {
          const elapsed = Date.now() - parseInt(dismissedAt, 10)
          if (elapsed < DISMISS_DURATION_MS) {
            setDismissed(true)
          }
        }
      }
    } catch {
      // Fail silently — don't block app over update check failure
    } finally {
      setIsChecking(false)
    }
  }, [configUrl, currentVersion])

  useEffect(() => {
    checkForUpdate()
  }, [checkForUpdate])

  const openStore = useCallback(async () => {
    const url = Platform.OS === 'ios' ? storeUrls.ios : storeUrls.android
    if (url) {
      await Linking.openURL(url)
    }
  }, [storeUrls])

  const dismiss = useCallback(async () => {
    setDismissed(true)
    await AsyncStorage.setItem(DISMISS_KEY, Date.now().toString())
  }, [])

  const updateAvailable =
    !dismissed &&
    latestVersion !== null &&
    isVersionBelow(currentVersion, latestVersion)

  return {
    updateAvailable,
    isMandatory,
    currentVersion,
    latestVersion,
    message,
    isChecking,
    openStore,
    dismiss,
    checkForUpdate,
  }
}
