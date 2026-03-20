// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — SSL Pinning Configuration
// Certificate pinning for mobile API connections.
// Enhanced with health checks, rotation warnings, and iOS ATS.
// ═══════════════════════════════════════════════════════════════

import { Platform } from 'react-native'

// ── Types ────────────────────────────────────────────────────

export interface SSLPinConfig {
  /** Hostname to pin (e.g. 'api.vct-platform.com') */
  hostname: string
  /** SHA-256 pin hashes of certificate public keys (base64) */
  pins: string[]
  /** Include subdomains */
  includeSubdomains: boolean
  /** Expiry date — auto-disable pinning after this to avoid bricking */
  expiresAt: string
}

export interface SSLPinningOptions {
  /** Enable SSL pinning (disabled in dev by default) */
  enabled: boolean
  /** Pin configurations per hostname */
  hosts: SSLPinConfig[]
  /** Callback when pinning validation fails */
  onPinningFailure?: (hostname: string, error: string) => void
  /** Callback when pins are close to expiry */
  onRotationWarning?: (hostname: string, daysLeft: number) => void
}

export type PinHealth = 'active' | 'expiring_soon' | 'expired'

export interface PinHealthStatus {
  hostname: string
  health: PinHealth
  daysUntilExpiry: number
  pinCount: number
  hasBackupPin: boolean
}

// ── Default Configuration ────────────────────────────────────

/**
 * SSL pinning config for VCT Platform.
 *
 * > [!IMPORTANT]
 * > These pins must be updated before certificate rotation.
 * > Include both current and backup certificate pins.
 * > Set `expiresAt` to auto-disable pinning if pins become stale.
 *
 * To get your certificate's pin:
 * ```bash
 * # Get pin hash from certificate
 * openssl s_client -connect api.vct-platform.com:443 | \
 *   openssl x509 -pubkey -noout | \
 *   openssl pkey -pubin -outform der | \
 *   openssl dgst -sha256 -binary | base64
 * ```
 */
export function getSSLPinningConfig(): SSLPinningOptions {
  const isDev = __DEV__ || process.env.NODE_ENV === 'development'

  return {
    // Disable in development
    enabled: !isDev && Platform.OS !== 'web',
    hosts: [
      {
        hostname: 'api.vct-platform.com',
        pins: [
          // Primary certificate pin (current)
          // Replace with actual SHA-256 pin hash
          'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
          // Backup certificate pin (next rotation)
          'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
        ],
        includeSubdomains: true,
        expiresAt: '2027-01-01T00:00:00Z',
      },
    ],
    onPinningFailure: (hostname, error) => {
      console.error(`[SSL] Pinning check failed for ${hostname}: ${error}`)
      // In production, report to crash analytics
    },
    onRotationWarning: (hostname, daysLeft) => {
      console.warn(`[SSL] ⚠️ Pin for ${hostname} expires in ${daysLeft} days — rotate certificates!`)
    },
  }
}

// ── Health & Validation ──────────────────────────────────────

/** Rotation warning threshold (days). */
const ROTATION_WARNING_DAYS = 30

/**
 * Check if SSL pinning should be active.
 * Auto-disables after expiry to prevent app from becoming unusable.
 * Fires rotation warning when pins are close to expiry.
 */
export function isPinningActive(config: SSLPinningOptions): boolean {
  if (!config.enabled) return false

  const now = new Date()
  let allActive = true

  for (const host of config.hosts) {
    const expiry = new Date(host.expiresAt)
    const daysLeft = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (now >= expiry) {
      allActive = false
      continue
    }

    // Fire rotation warning
    if (daysLeft <= ROTATION_WARNING_DAYS) {
      config.onRotationWarning?.(host.hostname, daysLeft)
    }
  }

  return allActive
}

/**
 * Get health status of all pinned hosts.
 */
export function getPinningHealth(config: SSLPinningOptions): PinHealthStatus[] {
  const now = new Date()

  return config.hosts.map((host) => {
    const expiry = new Date(host.expiresAt)
    const daysLeft = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    let health: PinHealth = 'active'
    if (daysLeft <= 0) health = 'expired'
    else if (daysLeft <= ROTATION_WARNING_DAYS) health = 'expiring_soon'

    return {
      hostname: host.hostname,
      health,
      daysUntilExpiry: Math.max(0, daysLeft),
      pinCount: host.pins.length,
      hasBackupPin: host.pins.length >= 2,
    }
  })
}

/**
 * Validate a pin hash format (SHA-256 base64, 44 chars).
 */
export function validatePinFormat(pin: string): boolean {
  // SHA-256 base64 encoded = 44 characters ending with =
  return /^[A-Za-z0-9+/]{43}=$/.test(pin)
}

/**
 * Validate a hostname against pinning configuration.
 * Returns the matching pin config, or null if not pinned.
 */
export function getPinConfigForHost(
  hostname: string,
  config: SSLPinningOptions,
): SSLPinConfig | null {
  for (const host of config.hosts) {
    if (hostname === host.hostname) return host
    if (
      host.includeSubdomains &&
      hostname.endsWith(`.${host.hostname}`)
    ) {
      return host
    }
  }
  return null
}

/**
 * Generate Expo app.json plugin configuration for SSL pinning.
 * Use this when building with EAS to enable native-level pinning.
 */
export function generateAndroidNetworkSecurityConfig(
  config: SSLPinningOptions,
): string {
  const domains = config.hosts
    .map((host) => {
      const pins = host.pins
        .map((pin) => `            <pin digest="SHA-256">${pin}</pin>`)
        .join('\n')

      return `        <domain-config cleartextTrafficPermitted="false">
            <domain includeSubdomains="${host.includeSubdomains}">${host.hostname}</domain>
            <pin-set expiration="${host.expiresAt.split('T')[0]}">
${pins}
            </pin-set>
        </domain-config>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
${domains}
</network-security-config>`
}

/**
 * Generate iOS App Transport Security (ATS) exception config.
 * Add to Info.plist for certificate pinning via native modules.
 */
export function generateIOSATSConfig(
  config: SSLPinningOptions,
): Record<string, unknown> {
  const exceptionDomains: Record<string, unknown> = {}

  for (const host of config.hosts) {
    exceptionDomains[host.hostname] = {
      NSIncludesSubdomains: host.includeSubdomains,
      NSExceptionRequiresForwardSecrecy: true,
      NSExceptionMinimumTLSVersion: 'TLSv1.2',
      NSPinnedDomains: {
        [host.hostname]: {
          NSIncludesSubdomains: host.includeSubdomains,
          NSPinnedLeafIdentities: host.pins.map((pin) => ({
            'SPKI-SHA256-BASE64': pin,
          })),
        },
      },
    }
  }

  return {
    NSAppTransportSecurity: {
      NSAllowsArbitraryLoads: false,
      NSExceptionDomains: exceptionDomains,
    },
  }
}

