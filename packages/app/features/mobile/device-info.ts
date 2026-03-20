// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Device Info
// Collects device context for crash reports, analytics,
// and support diagnostics.
// ═══════════════════════════════════════════════════════════════

import { Platform, Dimensions, PixelRatio } from 'react-native'
import Constants from 'expo-constants'

// ── Types ────────────────────────────────────────────────────

export interface DeviceContext {
  // ── App ────────────────────────────────
  appVersion: string
  buildNumber: string
  expoSdkVersion: string
  updateId: string | null

  // ── Device ─────────────────────────────
  platform: 'ios' | 'android' | 'web'
  osVersion: string
  deviceName: string
  brand: string
  model: string
  isEmulator: boolean

  // ── Screen ─────────────────────────────
  screenWidth: number
  screenHeight: number
  pixelRatio: number
  fontScale: number

  // ── Runtime ────────────────────────────
  locale: string
  timezone: string
  memoryWarning: boolean

  // ── Timestamps ─────────────────────────
  collectedAt: string
}

// ── Collect ──────────────────────────────────────────────────

/**
 * Collect full device context.
 * Attach to crash reports, analytics, and support tickets.
 *
 * @example
 * ```ts
 * const ctx = getDeviceContext()
 * crashReporter.setContext(ctx)
 * ```
 */
export function getDeviceContext(): DeviceContext {
  const { width, height } = Dimensions.get('window')

  return {
    // App
    appVersion: Constants.expoConfig?.version ?? '1.0.0',
    buildNumber: getBuildNumber(),
    expoSdkVersion: Constants.expoConfig?.sdkVersion ?? 'unknown',
    updateId: Constants.manifest2?.id ?? null,

    // Device
    platform: Platform.OS as 'ios' | 'android' | 'web',
    osVersion: getOSVersion(),
    deviceName: getDeviceName(),
    brand: getBrand(),
    model: getModel(),
    isEmulator: checkEmulator(),

    // Screen
    screenWidth: Math.round(width),
    screenHeight: Math.round(height),
    pixelRatio: PixelRatio.get(),
    fontScale: PixelRatio.getFontScale(),

    // Runtime
    locale: getLocale(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    memoryWarning: false,

    // Timestamps
    collectedAt: new Date().toISOString(),
  }
}

/**
 * Compact device string for log lines.
 *
 * @example
 * ```
 * "VCT 1.0.0 / iOS 17.2 / iPhone 15 Pro / 393×852@3x"
 * ```
 */
export function getDeviceSummary(): string {
  const ctx = getDeviceContext()
  const screen = `${ctx.screenWidth}×${ctx.screenHeight}@${ctx.pixelRatio}x`
  return `VCT ${ctx.appVersion} / ${ctx.platform} ${ctx.osVersion} / ${ctx.model} / ${screen}`
}

/**
 * Device context as flat headers for API requests.
 * Attach to outgoing requests for server-side debugging.
 */
export function getDeviceHeaders(): Record<string, string> {
  const ctx = getDeviceContext()
  return {
    'X-App-Version': ctx.appVersion,
    'X-App-Platform': ctx.platform,
    'X-App-OS-Version': ctx.osVersion,
    'X-App-Device': ctx.model,
    'X-App-Screen': `${ctx.screenWidth}x${ctx.screenHeight}`,
    'X-App-Locale': ctx.locale,
  }
}

// ── Private Helpers ──────────────────────────────────────────

function getBuildNumber(): string {
  if (Platform.OS === 'ios') {
    return Constants.expoConfig?.ios?.buildNumber ?? '1'
  }
  if (Platform.OS === 'android') {
    return String(Constants.expoConfig?.android?.versionCode ?? 1)
  }
  return '1'
}

function getOSVersion(): string {
  if (Platform.OS === 'android') {
    return String(Platform.Version)
  }
  if (Platform.OS === 'ios') {
    return Platform.Version?.toString() ?? 'unknown'
  }
  return 'web'
}

function getDeviceName(): string {
  if (Platform.OS === 'android') {
    return (Platform.constants as any)?.Model ?? 'Android Device'
  }
  return Constants.deviceName ?? 'Unknown Device'
}

function getBrand(): string {
  if (Platform.OS === 'android') {
    return (Platform.constants as any)?.Brand ?? 'unknown'
  }
  return 'Apple'
}

function getModel(): string {
  if (Platform.OS === 'android') {
    const brand = getBrand()
    const model = (Platform.constants as any)?.Model ?? 'Unknown'
    return `${brand} ${model}`
  }
  return Constants.deviceName ?? 'iPhone'
}

function checkEmulator(): boolean {
  if (Platform.OS === 'android') {
    const brand = getBrand().toLowerCase()
    const model = getModel().toLowerCase()
    return (
      brand.includes('generic') ||
      model.includes('emulator') ||
      model.includes('sdk') ||
      model.includes('genymotion')
    )
  }
  if (Platform.OS === 'ios') {
    return Constants.isDevice === false
  }
  return false
}

function getLocale(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale
  } catch {
    return 'vi-VN'
  }
}
