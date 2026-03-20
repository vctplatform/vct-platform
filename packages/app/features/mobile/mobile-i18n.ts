// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Mobile i18n
// Vietnamese/English localization with device locale detection,
// pluralization, date/number formatting, and React hooks.
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { NativeModules, Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

// ── Types ────────────────────────────────────────────────────

export type Locale = 'vi' | 'en'

export type TranslationKey = string

export interface TranslationMap {
  [key: string]: string | TranslationMap
}

export interface I18nConfig {
  defaultLocale: Locale
  fallbackLocale: Locale
  persistKey: string
}

// ── Translations ─────────────────────────────────────────────

const translations: Record<Locale, TranslationMap> = {
  vi: {
    common: {
      loading: 'Đang tải...',
      error: 'Đã có lỗi xảy ra',
      retry: 'Thử lại',
      cancel: 'Hủy',
      save: 'Lưu',
      delete: 'Xóa',
      edit: 'Chỉnh sửa',
      search: 'Tìm kiếm',
      noData: 'Không có dữ liệu',
      confirm: 'Xác nhận',
      back: 'Quay lại',
      next: 'Tiếp theo',
      done: 'Hoàn tất',
      close: 'Đóng',
    },
    auth: {
      login: 'Đăng nhập',
      logout: 'Đăng xuất',
      register: 'Đăng ký',
      email: 'Email',
      password: 'Mật khẩu',
      forgotPassword: 'Quên mật khẩu?',
      loginFailed: 'Đăng nhập thất bại',
      sessionExpired: 'Phiên đăng nhập hết hạn',
    },
    tournament: {
      title: 'Giải đấu',
      upcoming: 'Sắp diễn ra',
      ongoing: 'Đang diễn ra',
      completed: 'Đã kết thúc',
      register: 'Đăng ký thi đấu',
      bracket: 'Bảng đấu',
      schedule: 'Lịch thi đấu',
      results: 'Kết quả',
    },
    athlete: {
      profile: 'Hồ sơ VĐV',
      rankings: 'Bảng xếp hạng',
      belt: 'Đai',
      weightClass: 'Hạng cân',
      club: 'Câu lạc bộ',
      record: 'Thành tích',
    },
    scoring: {
      live: 'Chấm điểm trực tiếp',
      score: 'Điểm',
      penalty: 'Phạt',
      warning: 'Cảnh cáo',
      round: 'Hiệp',
      winner: 'Người thắng',
    },
    network: {
      offline: 'Mất kết nối mạng',
      syncing: 'Đang đồng bộ...',
      syncPending: '{{count}} mục chờ đồng bộ',
    },
    update: {
      required: 'Cần cập nhật ứng dụng',
      available: 'Có phiên bản mới',
      updateNow: 'Cập nhật ngay',
      later: 'Để sau',
    },
  },
  en: {
    common: {
      loading: 'Loading...',
      error: 'An error occurred',
      retry: 'Retry',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      search: 'Search',
      noData: 'No data',
      confirm: 'Confirm',
      back: 'Back',
      next: 'Next',
      done: 'Done',
      close: 'Close',
    },
    auth: {
      login: 'Log In',
      logout: 'Log Out',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      forgotPassword: 'Forgot password?',
      loginFailed: 'Login failed',
      sessionExpired: 'Session expired',
    },
    tournament: {
      title: 'Tournaments',
      upcoming: 'Upcoming',
      ongoing: 'Ongoing',
      completed: 'Completed',
      register: 'Register to compete',
      bracket: 'Bracket',
      schedule: 'Schedule',
      results: 'Results',
    },
    athlete: {
      profile: 'Athlete Profile',
      rankings: 'Rankings',
      belt: 'Belt',
      weightClass: 'Weight Class',
      club: 'Club',
      record: 'Record',
    },
    scoring: {
      live: 'Live Scoring',
      score: 'Score',
      penalty: 'Penalty',
      warning: 'Warning',
      round: 'Round',
      winner: 'Winner',
    },
    network: {
      offline: 'No network connection',
      syncing: 'Syncing...',
      syncPending: '{{count}} items pending sync',
    },
    update: {
      required: 'App update required',
      available: 'New version available',
      updateNow: 'Update Now',
      later: 'Later',
    },
  },
}

// ── i18n Service ─────────────────────────────────────────────

const DEFAULT_CONFIG: I18nConfig = {
  defaultLocale: 'vi',
  fallbackLocale: 'vi',
  persistKey: 'vct-locale',
}

class I18nService {
  private _locale: Locale
  private _config: I18nConfig
  private _listeners: Array<(locale: Locale) => void> = []

  constructor(config: Partial<I18nConfig> = {}) {
    this._config = { ...DEFAULT_CONFIG, ...config }
    this._locale = this._config.defaultLocale
  }

  /** Current locale. */
  get locale(): Locale {
    return this._locale
  }

  /** Initialize: load persisted locale or detect from device. */
  async init(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this._config.persistKey)
      if (stored === 'vi' || stored === 'en') {
        this._locale = stored
        return
      }
    } catch { /* ignore */ }

    // Detect device locale
    this._locale = detectDeviceLocale()
  }

  /** Set locale and persist. */
  async setLocale(locale: Locale): Promise<void> {
    this._locale = locale
    this._listeners.forEach((l) => l(locale))
    try {
      await AsyncStorage.setItem(this._config.persistKey, locale)
    } catch { /* ignore */ }
  }

  /**
   * Translate a key. Supports dot-notation and interpolation.
   *
   * @example
   * ```ts
   * i18n.t('common.loading')          // → 'Đang tải...'
   * i18n.t('network.syncPending', { count: 3 }) // → '3 mục chờ đồng bộ'
   * ```
   */
  t(key: string, params?: Record<string, string | number>): string {
    const value = this._resolve(key, this._locale) ??
                  this._resolve(key, this._config.fallbackLocale) ??
                  key

    if (!params) return value
    return this._interpolate(value, params)
  }

  /** Subscribe to locale changes. */
  onChange(listener: (locale: Locale) => void): () => void {
    this._listeners.push(listener)
    return () => {
      this._listeners = this._listeners.filter((l) => l !== listener)
    }
  }

  /** Get all available locales. */
  getLocales(): Locale[] {
    return ['vi', 'en']
  }

  /** Format a number for current locale. */
  formatNumber(value: number): string {
    return new Intl.NumberFormat(this._locale === 'vi' ? 'vi-VN' : 'en-US').format(value)
  }

  /** Format a date for current locale. */
  formatDate(date: Date | string, style: 'short' | 'medium' | 'long' = 'medium'): string {
    const d = typeof date === 'string' ? new Date(date) : date
    const localeStr = this._locale === 'vi' ? 'vi-VN' : 'en-US'

    const options: Intl.DateTimeFormatOptions =
      style === 'short' ? { day: '2-digit', month: '2-digit', year: 'numeric' } :
      style === 'long' ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' } :
      { day: 'numeric', month: 'short', year: 'numeric' }

    return new Intl.DateTimeFormat(localeStr, options).format(d)
  }

  /** Format relative time (e.g., '3 phút trước'). */
  formatRelativeTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    const diffMs = Date.now() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)

    if (this._locale === 'vi') {
      if (diffMin < 1) return 'Vừa xong'
      if (diffMin < 60) return `${diffMin} phút trước`
      const hours = Math.floor(diffMin / 60)
      if (hours < 24) return `${hours} giờ trước`
      const days = Math.floor(hours / 24)
      return `${days} ngày trước`
    }

    if (diffMin < 1) return 'Just now'
    if (diffMin < 60) return `${diffMin}m ago`
    const hours = Math.floor(diffMin / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  // ── Private ──────────────────────────────────────────────

  private _resolve(key: string, locale: Locale): string | null {
    const parts = key.split('.')
    let current: TranslationMap | string = translations[locale]

    for (const part of parts) {
      if (typeof current === 'string') return null
      current = current[part] as TranslationMap | string
      if (current === undefined) return null
    }

    return typeof current === 'string' ? current : null
  }

  private _interpolate(text: string, params: Record<string, string | number>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => String(params[key] ?? `{{${key}}}`))
  }
}

// ── Detect Device Locale ─────────────────────────────────────

function detectDeviceLocale(): Locale {
  try {
    let deviceLocale = ''

    if (Platform.OS === 'ios') {
      deviceLocale =
        NativeModules.SettingsManager?.settings?.AppleLocale ??
        NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ?? ''
    } else if (Platform.OS === 'android') {
      deviceLocale = NativeModules.I18nManager?.localeIdentifier ?? ''
    }

    if (deviceLocale.toLowerCase().startsWith('vi')) return 'vi'
    return 'en'
  } catch {
    return 'vi' // Default to Vietnamese
  }
}

// ── Singleton ────────────────────────────────────────────────

export const i18n = new I18nService()

// ── React Hooks ──────────────────────────────────────────────

/**
 * Hook for translations. Re-renders on locale change.
 *
 * @example
 * ```tsx
 * function LoginScreen() {
 *   const { t, locale, setLocale } = useI18n()
 *   return <Button title={t('auth.login')} />
 * }
 * ```
 */
export function useI18n() {
  const [locale, setLocaleState] = useState<Locale>(i18n.locale)

  useEffect(() => {
    return i18n.onChange((l) => setLocaleState(l))
  }, [])

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => i18n.t(key, params),
    [locale],
  )

  const setLocale = useCallback(async (l: Locale) => {
    await i18n.setLocale(l)
  }, [])

  return {
    t,
    locale,
    setLocale,
    formatNumber: i18n.formatNumber.bind(i18n),
    formatDate: i18n.formatDate.bind(i18n),
    formatRelativeTime: i18n.formatRelativeTime.bind(i18n),
  }
}
