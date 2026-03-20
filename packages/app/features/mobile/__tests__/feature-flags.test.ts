/**
 * @jest-environment node
 */

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Feature Flags Tests
// Tests for flag service, remote config, and React hooks.
// ═══════════════════════════════════════════════════════════════

import { featureFlags } from '../feature-flags'

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}))

beforeEach(() => {
  featureFlags.resetAll()
})

describe('FeatureFlagService', () => {
  describe('default flags', () => {
    it('returns default values for known flags', () => {
      expect(featureFlags.get('scoring.live_enabled')).toBe(true)
      expect(featureFlags.get('tournament.live_stream')).toBe(false)
      expect(featureFlags.get('network.retry_count')).toBe(3)
    })

    it('returns false for unknown flags', () => {
      expect(featureFlags.get('nonexistent.flag')).toBe(false)
    })

    it('returns custom default for unknown flags', () => {
      expect(featureFlags.get('nonexistent.flag', 'custom')).toBe('custom')
    })
  })

  describe('isEnabled', () => {
    it('returns true for enabled flags', () => {
      expect(featureFlags.isEnabled('scoring.live_enabled')).toBe(true)
    })

    it('returns false for disabled flags', () => {
      expect(featureFlags.isEnabled('tournament.live_stream')).toBe(false)
    })
  })

  describe('overrides', () => {
    it('sets local override', () => {
      featureFlags.setOverride('tournament.live_stream', true)
      expect(featureFlags.isEnabled('tournament.live_stream')).toBe(true)
    })

    it('clears local override', () => {
      featureFlags.setOverride('tournament.live_stream', true)
      featureFlags.clearOverride('tournament.live_stream')
      expect(featureFlags.isEnabled('tournament.live_stream')).toBe(false)
    })

    it('resets all flags to defaults', () => {
      featureFlags.setOverride('tournament.live_stream', true)
      featureFlags.setOverride('network.retry_count', 10)
      featureFlags.resetAll()
      expect(featureFlags.isEnabled('tournament.live_stream')).toBe(false)
      expect(featureFlags.get('network.retry_count')).toBe(3)
    })
  })

  describe('getAll', () => {
    it('returns all current flags', () => {
      const all = featureFlags.getAll()
      expect(all).toHaveProperty('scoring.live_enabled')
      expect(all).toHaveProperty('network.retry_count')
      expect(Object.keys(all).length).toBeGreaterThanOrEqual(10)
    })
  })

  describe('onChange', () => {
    it('notifies listeners on override changes', () => {
      const listener = jest.fn()
      featureFlags.onChange(listener)

      featureFlags.setOverride('ui.dark_mode_only', true)
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('unsubscribes correctly', () => {
      const listener = jest.fn()
      const listenerId = featureFlags.onChange(listener)

      featureFlags.setOverride('ui.dark_mode_only', true)
      featureFlags.removeListener(listenerId)
      featureFlags.setOverride('ui.dark_mode_only', false)

      expect(listener).toHaveBeenCalledTimes(1)
    })
  })
})
