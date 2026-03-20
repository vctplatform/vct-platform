// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Mobile Security Utilities
// Input sanitization, biometric auth, jailbreak detection,
// secure clipboard, data masking, and screen capture prevention.
// ═══════════════════════════════════════════════════════════════

import { Platform, Alert } from 'react-native'
import * as SecureStore from 'expo-secure-store'

// ── Input Sanitization ───────────────────────────────────────

/**
 * Sanitize user input to prevent XSS and injection.
 * Strips HTML tags, script content, and dangerous characters.
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]+>/g, '')                             // Remove HTML tags
    .replace(/[<>"'&]/g, (char) => {                    // Escape special chars
      const map: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;',
      }
      return map[char] ?? char
    })
    .trim()
}

/**
 * Validate and sanitize email input.
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim().replace(/[^a-z0-9@._+-]/g, '')
}

/**
 * Sanitize and normalize Vietnamese phone number.
 * Converts 0xxx → +84xxx format.
 */
export function sanitizePhoneVN(phone: string): string {
  const cleaned = phone.replace(/[\s().-]/g, '')
  if (cleaned.startsWith('0')) {
    return '+84' + cleaned.slice(1)
  }
  if (cleaned.startsWith('84') && !cleaned.startsWith('+')) {
    return '+' + cleaned
  }
  return cleaned
}

/**
 * Sanitize for SQL-safe (defense-in-depth, backend should also validate).
 */
export function sanitizeForQuery(input: string): string {
  return input.replace(/['";\\-]/g, '').trim()
}

// ── Data Masking ─────────────────────────────────────────────

/**
 * Mask sensitive data for safe logging.
 * Replaces middle portion with asterisks.
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain || !local) return '***'
  const visible = local.length <= 2 ? local[0] : local.slice(0, 2)
  return `${visible}***@${domain}`
}

export function maskPhone(phone: string): string {
  if (phone.length < 6) return '***'
  return phone.slice(0, 3) + '****' + phone.slice(-3)
}

export function maskId(id: string): string {
  if (id.length <= 8) return id.slice(0, 2) + '***'
  return id.slice(0, 4) + '***' + id.slice(-4)
}

/**
 * Mask all sensitive fields in an object for logging.
 */
export function maskSensitiveData(
  data: Record<string, unknown>,
  sensitiveKeys = ['email', 'phone', 'password', 'token', 'secret', 'api_key']
): Record<string, unknown> {
  const masked = { ...data }
  for (const key of Object.keys(masked)) {
    const lowerKey = key.toLowerCase()
    if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
      const val = masked[key]
      if (typeof val === 'string') {
        if (lowerKey.includes('email')) masked[key] = maskEmail(val)
        else if (lowerKey.includes('phone')) masked[key] = maskPhone(val)
        else masked[key] = '***REDACTED***'
      }
    }
  }
  return masked
}

// ── Biometric Authentication ─────────────────────────────────

export type BiometricType = 'fingerprint' | 'face' | 'iris' | 'none'

export interface BiometricResult {
  available: boolean
  type: BiometricType
  enrolled: boolean
}

/**
 * Rate limiter for biometric auth attempts.
 * Prevents brute-force attacks on biometric bypass.
 */
class BiometricRateLimiter {
  private _attempts = 0
  private _lockedUntil = 0
  private readonly _maxAttempts = 5
  private readonly _lockoutMs = 30_000 // 30 seconds

  canAttempt(): boolean {
    if (Date.now() < this._lockedUntil) return false
    return this._attempts < this._maxAttempts
  }

  recordAttempt(success: boolean): void {
    if (success) {
      this._attempts = 0
      return
    }
    this._attempts++
    if (this._attempts >= this._maxAttempts) {
      this._lockedUntil = Date.now() + this._lockoutMs
      this._attempts = 0
    }
  }

  get isLocked(): boolean {
    return Date.now() < this._lockedUntil
  }

  get lockoutRemainingMs(): number {
    return Math.max(0, this._lockedUntil - Date.now())
  }
}

export const biometricLimiter = new BiometricRateLimiter()

/**
 * Check if biometric authentication is available.
 */
export async function checkBiometricAvailability(): Promise<BiometricResult> {
  try {
    // expo-secure-store uses biometrics via FACE_ID/FINGERPRINT keychainAccessible
    const testKey = '__vct_biometric_check__'

    if (Platform.OS === 'web') {
      return { available: false, type: 'none', enrolled: false }
    }

    // Try to use SecureStore with requireAuthentication
    await SecureStore.setItemAsync(testKey, 'test', {
      requireAuthentication: true,
    })
    await SecureStore.deleteItemAsync(testKey)

    return {
      available: true,
      type: Platform.OS === 'ios' ? 'face' : 'fingerprint',
      enrolled: true,
    }
  } catch {
    return { available: false, type: 'none', enrolled: false }
  }
}

/**
 * Prompt for biometric authentication before sensitive actions.
 * Rate-limited to prevent brute-force.
 */
export async function authenticateWithBiometric(
  _reason: string = 'Xác thực để tiếp tục',
): Promise<boolean> {
  // Check rate limit
  if (!biometricLimiter.canAttempt()) {
    const remainSec = Math.ceil(biometricLimiter.lockoutRemainingMs / 1000)
    Alert.alert(
      'Tạm khóa xác thực',
      `Quá nhiều lần thử. Vui lòng đợi ${remainSec} giây.`,
    )
    return false
  }

  try {
    const key = '__vct_bio_auth__'

    await SecureStore.setItemAsync(key, Date.now().toString(), {
      requireAuthentication: true,
    })

    const value = await SecureStore.getItemAsync(key, {
      requireAuthentication: true,
    })

    await SecureStore.deleteItemAsync(key)
    const success = value !== null
    biometricLimiter.recordAttempt(success)
    return success
  } catch {
    biometricLimiter.recordAttempt(false)
    return false
  }
}

// ── Jailbreak / Root Detection ───────────────────────────────

/**
 * Basic jailbreak/root detection.
 * Not foolproof, but catches common cases.
 *
 * For production, use a dedicated library like `jail-monkey`.
 */
export function detectCompromisedDevice(): {
  isCompromised: boolean
  indicators: string[]
} {
  const indicators: string[] = []

  if (Platform.OS === 'web') {
    return { isCompromised: false, indicators: [] }
  }

  // Check for debug mode
  if (__DEV__) {
    indicators.push('debug_mode')
  }

  // On Android, check for common root indicators via system properties
  if (Platform.OS === 'android') {
    try {
      // These checks are limited in JS — use native module for deeper detection
      // Check if running in emulator
      const brand = Platform.constants?.Brand ?? ''
      const model = Platform.constants?.Model ?? ''

      if (
        brand.toLowerCase().includes('generic') ||
        model.toLowerCase().includes('emulator') ||
        model.toLowerCase().includes('sdk')
      ) {
        indicators.push('emulator_detected')
      }
    } catch {
      // Ignore
    }
  }

  return {
    isCompromised: indicators.length > 0 && !__DEV__,
    indicators,
  }
}

/**
 * Show security warning if device is compromised.
 */
export function showCompromisedDeviceAlert(): void {
  const { isCompromised } = detectCompromisedDevice()
  if (!isCompromised) return

  Alert.alert(
    'Cảnh báo bảo mật',
    'Thiết bị của bạn có dấu hiệu đã bị root/jailbreak. Ứng dụng có thể không hoạt động an toàn trên thiết bị này.',
    [
      { text: 'Tôi hiểu', style: 'destructive' },
    ],
    { cancelable: false },
  )
}

// ── Screen Capture Prevention ────────────────────────────────

/**
 * Prevent screenshots and screen recording on sensitive screens.
 * Uses expo-screen-capture when available.
 */
export async function preventScreenCapture(): Promise<void> {
  if (Platform.OS === 'web') return
  try {
    // @ts-ignore — expo-screen-capture may not be installed
    const ScreenCapture = await import('expo-screen-capture')
    await ScreenCapture.preventScreenCaptureAsync()
  } catch {
    // expo-screen-capture not installed
  }
}

/**
 * Re-allow screen capture after leaving sensitive screen.
 */
export async function allowScreenCapture(): Promise<void> {
  if (Platform.OS === 'web') return
  try {
    // @ts-ignore — expo-screen-capture may not be installed
    const ScreenCapture = await import('expo-screen-capture')
    await ScreenCapture.allowScreenCaptureAsync()
  } catch {
    // expo-screen-capture not installed
  }
}

// ── Secure Clipboard ─────────────────────────────────────────

/**
 * Safely clear clipboard after a delay (e.g., after copying OTP).
 * Prevents sensitive data from persisting in clipboard.
 */
export function clearClipboardAfterDelay(delayMs: number = 30_000): void {
  setTimeout(async () => {
    try {
      // @ts-ignore — expo-clipboard may not be installed
      const Clipboard = await import('expo-clipboard')
      await Clipboard.setStringAsync('')
    } catch {
      // expo-clipboard not installed or not available
    }
  }, delayMs)
}

// ── Secure Token Generation ──────────────────────────────────

/**
 * Generate a cryptographically-random token string.
 * Uses expo-crypto when available, falls back to Math.random.
 */
export async function generateSecureToken(length = 32): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  try {
    // @ts-ignore — expo-crypto may not be installed
    const Crypto = await import('expo-crypto')
    const bytes = await Crypto.getRandomBytesAsync(length)
    return Array.from(bytes as Uint8Array)
      .map((b: number) => chars[b % chars.length])
      .join('')
  } catch {
    // Fallback
    let token = ''
    for (let i = 0; i < length; i++) {
      token += chars[Math.floor(Math.random() * chars.length)]
    }
    return token
  }
}

// ── Content Security ─────────────────────────────────────────

/** Trusted hostnames for URL validation. */
const TRUSTED_HOSTS = [
  'vct-platform.com',
  'api.vct-platform.com',
  'cdn.vct-platform.com',
]

/**
 * Validate that a URL is safe to navigate to.
 * Prevents deep link injection and phishing URLs.
 */
export function isUrlSafe(url: string): boolean {
  try {
    const parsed = new URL(url)

    // Only allow HTTPS (or custom scheme for deep links)
    const allowedProtocols = ['https:', 'vctplatform:']
    if (!allowedProtocols.includes(parsed.protocol)) {
      return false
    }

    // Block suspicious hostnames
    const blockedPatterns = [
      /^(?:\d{1,3}\.){3}\d{1,3}$/, // IP addresses
      /localhost/i,
      /\.local$/i,
    ]
    if (blockedPatterns.some((p) => p.test(parsed.hostname))) {
      return false
    }

    return true
  } catch {
    return false
  }
}

/**
 * Check if URL belongs to a trusted VCT domain.
 */
export function isTrustedUrl(url: string): boolean {
  if (!isUrlSafe(url)) return false
  try {
    const parsed = new URL(url)
    return TRUSTED_HOSTS.some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
    )
  } catch {
    return false
  }
}

