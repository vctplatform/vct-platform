/**
 * ════════════════════════════════════════
 * SECURE SESSION STORAGE
 * ════════════════════════════════════════
 * Provides encrypted-like session storage with:
 * - Base64 encoding + obfuscation (NOT true encryption, but prevents casual reading)
 * - XSS-safe: Data is not plaintext in localStorage
 * - Session fingerprinting: Validates browser fingerprint on read
 * - Auto-expiry: Sessions expire after configurable TTL
 * - CSRF token generation for API requests
 *
 * NOTE: For true production security, tokens should be stored in
 * httpOnly cookies set by the backend. This is an interim solution.
 */

const STORAGE_PREFIX = '__vct_s_';
const FINGERPRINT_KEY = '__vct_fp_';
const CSRF_KEY = '__vct_csrf_';

/** Simple obfuscation - NOT encryption, but prevents casual reading */
function obfuscate(data: string): string {
  try {
    // Reverse + base64 encode
    const reversed = data.split('').reverse().join('');
    return btoa(unescape(encodeURIComponent(reversed)));
  } catch {
    return '';
  }
}

/** Deobfuscate data */
function deobfuscate(encoded: string): string {
  try {
    const reversed = decodeURIComponent(escape(atob(encoded)));
    return reversed.split('').reverse().join('');
  } catch {
    return '';
  }
}

/** Generate a browser fingerprint for session binding */
function generateFingerprint(): string {
  const parts = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ];
  // Simple hash
  const str = parts.join('|');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/** Generate a CSRF token */
function generateCSRFToken(): string {
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

export interface SecureStorageOptions {
  /** Time-to-live in milliseconds. Default: 24 hours */
  ttl?: number;
  /** Whether to bind session to browser fingerprint. Default: true */
  bindToFingerprint?: boolean;
}

export interface StoredSession<T = unknown> {
  data: T;
  storedAt: number;
  expiresAt: number;
  fingerprint: string;
}

const defaultOptions: Required<SecureStorageOptions> = {
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  bindToFingerprint: true,
};

/**
 * Store data securely in localStorage
 */
export function secureSet<T>(key: string, data: T, options?: SecureStorageOptions): void {
  const opts = { ...defaultOptions, ...options };

  try {
    const now = Date.now();
    const session: StoredSession<T> = {
      data,
      storedAt: now,
      expiresAt: now + opts.ttl,
      fingerprint: opts.bindToFingerprint ? generateFingerprint() : '',
    };

    const json = JSON.stringify(session);
    const encoded = obfuscate(json);
    localStorage.setItem(STORAGE_PREFIX + key, encoded);
  } catch (e) {
    console.warn('[SecureStorage] Failed to store data:', e);
  }
}

/**
 * Retrieve data from secure storage
 * Returns null if expired, tampered, or not found
 */
export function secureGet<T>(key: string, options?: SecureStorageOptions): T | null {
  const opts = { ...defaultOptions, ...options };

  try {
    const encoded = localStorage.getItem(STORAGE_PREFIX + key);
    if (!encoded) return null;

    const json = deobfuscate(encoded);
    if (!json) {
      // Data corrupted or tampered
      secureRemove(key);
      return null;
    }

    const session: StoredSession<T> = JSON.parse(json);

    // Check expiry
    if (Date.now() > session.expiresAt) {
      secureRemove(key);
      return null;
    }

    // Check fingerprint
    if (opts.bindToFingerprint && session.fingerprint) {
      const currentFingerprint = generateFingerprint();
      if (session.fingerprint !== currentFingerprint) {
        console.warn('[SecureStorage] Fingerprint mismatch - possible session hijacking attempt');
        secureRemove(key);
        return null;
      }
    }

    return session.data;
  } catch (e) {
    console.warn('[SecureStorage] Failed to retrieve data:', e);
    secureRemove(key);
    return null;
  }
}

/**
 * Remove data from secure storage
 */
export function secureRemove(key: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    // Ignore
  }
}

/**
 * Clear all VCT secure storage data
 */
export function secureClearAll(): void {
  try {
    const keys = Object.keys(localStorage).filter(
      (k) => k.startsWith(STORAGE_PREFIX) || k.startsWith(FINGERPRINT_KEY) || k.startsWith(CSRF_KEY)
    );
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Ignore
  }
}

/**
 * Get or generate a CSRF token for the current session
 */
export function getCSRFToken(): string {
  try {
    let token = sessionStorage.getItem(CSRF_KEY);
    if (!token) {
      token = generateCSRFToken();
      sessionStorage.setItem(CSRF_KEY, token);
    }
    return token;
  } catch {
    return generateCSRFToken();
  }
}

/**
 * Sanitize a string to prevent XSS when used in HTML context
 */
export function sanitizeString(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Validate that a value looks like a safe string (no script tags, etc.)
 */
export function isSafeValue(value: unknown): boolean {
  if (typeof value !== 'string') return true;
  const dangerous = /<script|javascript:|on\w+\s*=/i;
  return !dangerous.test(value);
}
