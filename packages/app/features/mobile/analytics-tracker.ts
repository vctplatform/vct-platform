// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Analytics Tracker
// Provider-agnostic telemetry service (Firebase / PostHog ready).
// Tracks screen views, custom events, user identity, and session config.
// Ensures privacy compliance and opt-out support.
// ═══════════════════════════════════════════════════════════════

import { Platform } from 'react-native'
import { configManager } from './config-manager'
import * as authStorage from './auth-storage'
import * as deviceInfo from './device-info'

// ── Types ────────────────────────────────────────────────────

export interface AnalyticsEvent {
  name: string
  properties?: Record<string, string | number | boolean | null | undefined>
}

export interface UserTraits {
  id: string
  role?: string
  email?: string
  name?: string
  [key: string]: any
}

export interface AnalyticsProvider {
  init(): Promise<void>
  identify(traits: UserTraits): Promise<void>
  track(event: AnalyticsEvent): Promise<void>
  screen(name: string, properties?: Record<string, any>): Promise<void>
  reset(): Promise<void>
}

// ── Dummy / Console Provider (Fallback) ──────────────────────

class ConsoleProvider implements AnalyticsProvider {
  async init() {
    if (configManager.isDev) console.log('📊 [Analytics] Init')
  }

  async identify(traits: UserTraits) {
    if (configManager.isDev) console.log('📊 [Analytics] Identify:', traits.id, traits.role)
  }

  async track(event: AnalyticsEvent) {
    if (configManager.isDev) console.log(`📊 [Analytics] Track: ${event.name}`, event.properties)
  }

  async screen(name: string, properties?: Record<string, any>) {
    if (configManager.isDev) console.log(`📊 [Analytics] Screen: ${name}`, properties)
  }

  async reset() {
    if (configManager.isDev) console.log('📊 [Analytics] Reset')
  }
}

// ── Analytics Manager ────────────────────────────────────────

class AnalyticsTracker {
  private _provider: AnalyticsProvider
  private _optedOut: boolean = false
  private _isInitialized: boolean = false
  private _currentScreen: string | null = null
  private _commonProperties: Record<string, any> = {}

  constructor() {
    // Inject real provider here (e.g., PostHogProvider or FirebaseProvider)
    this._provider = new ConsoleProvider()
  }

  /**
   * Initialize the analytics service.
   * Pulls device info and auth state automatically.
   */
  async init(): Promise<void> {
    if (this._isInitialized) return
    
    await this._provider.init()
    
    // Set common properties attached to every event
    const info = deviceInfo.getDeviceSummary()
    this._commonProperties = {
      platform: Platform.OS,
      appVersion: info.split(' ')[0], // Crude parse for example
      env: configManager.environment,
    }

    // Attach to auth state
    authStorage.onAuthChange(async (event) => {
      if (event === 'login') {
        const user = await authStorage.getStoredUser()
        if (user?.userId) {
          await this.identify({ id: user.userId, role: user.role || 'user' })
        }
      } else if (event === 'logout') {
        await this.reset()
      }
    })

    // Initial check
    const user = await authStorage.getStoredUser()
    if (user?.userId) {
      await this.identify({ id: user.userId, role: user.role || 'user' })
    }

    this._isInitialized = true
  }

  /**
   * Set opt-out status. When true, no events are sent.
   */
  setOptOut(optOut: boolean): void {
    this._optedOut = optOut
    if (optOut) {
      this.reset()
    }
  }

  /**
   * Identify a user.
   */
  async identify(traits: UserTraits): Promise<void> {
    if (this._optedOut) return
    if (!this._isInitialized) await this.init()
    await this._provider.identify(traits)
  }

  /**
   * Track a custom action.
   */
  async track(name: string, properties?: Record<string, any>): Promise<void> {
    if (this._optedOut) return
    if (!this._isInitialized) await this.init()
    
    const enrichedProps = {
      ...this._commonProperties,
      ...properties,
      timestamp: new Date().toISOString(),
      screen: this._currentScreen,
    }
    
    await this._provider.track({ name, properties: enrichedProps })
  }

  /**
   * Log a screen view. Call from navigation listeners or focus hooks.
   */
  async screen(name: string, properties?: Record<string, any>): Promise<void> {
    if (this._optedOut) return
    if (!this._isInitialized) await this.init()
      
    this._currentScreen = name
    
    const enrichedProps = {
      ...this._commonProperties,
      ...properties,
      timestamp: new Date().toISOString(),
    }
    
    await this._provider.screen(name, enrichedProps)
  }

  /**
   * Clear user identity (on logout).
   */
  async reset(): Promise<void> {
    if (!this._isInitialized) return
    await this._provider.reset()
    this._currentScreen = null
  }
}

// ── Singleton ────────────────────────────────────────────────

export const analytics = new AnalyticsTracker()
