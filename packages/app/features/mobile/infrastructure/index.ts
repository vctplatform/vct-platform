// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Mobile Module Barrel Exports
// Clean re-exports for all mobile infrastructure modules.
// ═══════════════════════════════════════════════════════════════

// ── Core API ─────────────────────────────────────────────────

export { ApiError, isApiAvailable, configureApiClient } from '../api-client'
export type { ApiClientConfig } from '../api-client'

// ── API Resilience ───────────────────────────────────────────

export {
  createResilientFetch,
  resilientFetch,
  ResilientFetchError,
} from '../api-resilience'
export type { RetryConfig, CircuitBreakerConfig, ResilientFetchConfig } from '../api-resilience'

// ── API Versioning ───────────────────────────────────────────

export { apiVersionInterceptor } from '../api-version-interceptor'
export type { ApiVersionInfo, VersionEventType } from '../api-version-interceptor'

// ── Auth Storage ─────────────────────────────────────────────

export {
  saveTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
  isAuthenticated,
  isTokenExpired,
  saveUser,
  getStoredUser,
} from '../auth-storage'
export type { AuthTokens, StoredUser } from '../auth-storage'

// ── Feature Flags ────────────────────────────────────────────

export { featureFlags, useFeatureFlag, useFeatureFlags } from '../feature-flags'
export type { FlagValue, FeatureFlagDefinition } from '../feature-flags'

// ── Interceptor Chain ────────────────────────────────────────

export {
  InterceptorChain,
  interceptorChain,
  authInterceptor,
  platformInterceptor,
  slowRequestInterceptor,
} from '../interceptor-chain'
export type {
  RequestContext,
  ResponseContext,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
} from '../interceptor-chain'

// ── Offline ──────────────────────────────────────────────────

export { offlineManager, useNetworkStatus, useOfflineFetch } from '../offline'

// ── Observability ────────────────────────────────────────────

export { useAnalytics } from '../useAnalytics'
export { usePerformanceMonitor, markAppStart, getTimeSinceStart } from '../usePerformanceMonitor'
export { requestLogger } from '../request-logger'

// ── Push Notifications ───────────────────────────────────────

export { usePushNotifications } from '../usePushNotifications'

// ── App Update ───────────────────────────────────────────────

export { useAppUpdate } from '../useAppUpdate'
export { ForceUpdateModal } from '../ForceUpdateModal'

// ── UI Components ────────────────────────────────────────────

export { MobileErrorBoundary } from '../MobileErrorBoundary'
export { NetworkStatusBanner, NetworkDot } from '../NetworkStatusBanner'

// ── Security ─────────────────────────────────────────────────

export {
  sanitizeInput,
  sanitizeEmail,
  sanitizeForQuery,
  isUrlSafe,
  checkBiometricAvailability,
  authenticateWithBiometric,
  detectCompromisedDevice,
  showCompromisedDeviceAlert,
  clearClipboardAfterDelay,
} from '../security-utils'

export {
  getSSLPinningConfig,
  isPinningActive,
  getPinConfigForHost,
  generateAndroidNetworkSecurityConfig,
} from '../ssl-pinning'

// ── Deep Linking ─────────────────────────────────────────────

export {
  deepLinkConfig,
  handleDeepLink,
  buildDeepLink,
} from '../deep-linking'
