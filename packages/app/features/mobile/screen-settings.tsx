// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Settings Screen
// App settings: Theme, Language, Notifications, Biometric lock,
// Cache management, and about/privacy/terms links.
// ═══════════════════════════════════════════════════════════════

import React, { useState, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native'
import { useVCTTheme } from './theme-provider'
import { VctCard } from './core-ui'
import { biometrics } from './biometrics-auth'
import { triggerHaptic } from './haptic-feedback'
import { useToast } from './toast-notification'

// ── Types ────────────────────────────────────────────────────

interface SettingsScreenProps {
  onGoBack?: () => void
  onNavigateAbout?: () => void
  onNavigatePrivacy?: () => void
  onNavigateTerms?: () => void
}

type ThemeMode = 'light' | 'dark' | 'system'
type Language = 'vi' | 'en'

// ── Component ────────────────────────────────────────────────

export function ScreenSettings({
  onGoBack,
  onNavigateAbout,
  onNavigatePrivacy,
  onNavigateTerms,
}: SettingsScreenProps) {
  const { theme, isDark, setThemeMode } = useVCTTheme()
  const toast = useToast()

  // Settings state
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>('system')
  const [language, setLanguage] = useState<Language>('vi')
  const [pushNotifications, setPushNotifications] = useState(true)
  const [matchAlerts, setMatchAlerts] = useState(true)
  const [biometricLock, setBiometricLock] = useState(false)
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [analyticsOptIn, setAnalyticsOptIn] = useState(true)

  // Check biometric availability
  useEffect(() => {
    biometrics.checkAvailability().then((status) => {
      setBiometricAvailable(status.hasHardware && status.isEnrolled)
    })
  }, [])

  // ── Handlers ─────────────────────────────────────────────

  const handleThemeChange = useCallback((mode: ThemeMode) => {
    triggerHaptic('selection')
    setCurrentTheme(mode)
    setThemeMode(mode)
  }, [setThemeMode])

  const handleLanguageChange = useCallback((lang: Language) => {
    triggerHaptic('selection')
    setLanguage(lang)
    toast.show({ type: 'success', title: lang === 'vi' ? 'Đã chuyển sang Tiếng Việt' : 'Switched to English' })
  }, [toast])

  const handleBiometricToggle = useCallback(async (enabled: boolean) => {
    if (enabled) {
      const success = await biometrics.authenticate({ promptMessage: 'Xác thực để bật khóa sinh trắc' })
      if (success) {
        setBiometricLock(true)
        triggerHaptic('success')
        toast.show({ type: 'success', title: 'Đã bật khóa sinh trắc học' })
      }
    } else {
      setBiometricLock(false)
      triggerHaptic('light')
    }
  }, [toast])

  const handleClearCache = useCallback(() => {
    Alert.alert('Xóa bộ nhớ đệm', 'Dữ liệu cục bộ sẽ bị xóa. Bạn cần tải lại từ mạng.', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          triggerHaptic('warning')
          // Clear offline cache
          try {
            const { clearAllOfflineCache } = await import('./offline-manager')
            await clearAllOfflineCache()
            toast.show({ type: 'success', title: 'Đã xóa bộ nhớ đệm' })
          } catch {
            toast.show({ type: 'error', title: 'Không thể xóa bộ nhớ đệm' })
          }
        },
      },
    ])
  }, [toast])

  // ── Render ───────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backBtn}>
          <Text style={[styles.backText, { color: theme.colors.text }]}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Cài đặt</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Appearance ────────────────────────────── */}
        <SettingsGroup title="Giao diện" theme={theme}>
          <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Chế độ hiển thị</Text>
          <View style={styles.themeRow}>
            {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: currentTheme === mode ? theme.colors.primary : theme.colors.surface,
                    borderColor: currentTheme === mode ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={() => handleThemeChange(mode)}
              >
                <Text style={styles.themeEmoji}>
                  {mode === 'light' ? '☀️' : mode === 'dark' ? '🌙' : '📱'}
                </Text>
                <Text
                  style={[
                    styles.themeLabel,
                    { color: currentTheme === mode ? '#FFF' : theme.colors.textSecondary },
                  ]}
                >
                  {mode === 'light' ? 'Sáng' : mode === 'dark' ? 'Tối' : 'Hệ thống'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SettingsGroup>

        {/* ── Language ──────────────────────────────── */}
        <SettingsGroup title="Ngôn ngữ" theme={theme}>
          <View style={styles.langRow}>
            {([{ key: 'vi' as Language, label: 'Tiếng Việt', flag: '🇻🇳' }, { key: 'en' as Language, label: 'English', flag: '🇬🇧' }]).map((lang) => (
              <TouchableOpacity
                key={lang.key}
                style={[
                  styles.langOption,
                  {
                    backgroundColor: language === lang.key ? theme.colors.primary : theme.colors.surface,
                    borderColor: language === lang.key ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={() => handleLanguageChange(lang.key)}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <Text style={[styles.langLabel, { color: language === lang.key ? '#FFF' : theme.colors.text }]}>
                  {lang.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SettingsGroup>

        {/* ── Notifications ─────────────────────────── */}
        <SettingsGroup title="Thông báo" theme={theme}>
          <SettingToggle theme={theme} label="Thông báo đẩy" emoji="🔔" value={pushNotifications} onToggle={setPushNotifications} />
          <SettingToggle theme={theme} label="Cảnh báo trận đấu" emoji="⚔️" value={matchAlerts} onToggle={setMatchAlerts} />
        </SettingsGroup>

        {/* ── Security ──────────────────────────────── */}
        <SettingsGroup title="Bảo mật" theme={theme}>
          {biometricAvailable && (
            <SettingToggle theme={theme} label="Khóa sinh trắc học" emoji="🔐" value={biometricLock} onToggle={handleBiometricToggle} />
          )}
          <SettingToggle theme={theme} label="Chia sẻ Analytics" emoji="📊" value={analyticsOptIn} onToggle={setAnalyticsOptIn} />
        </SettingsGroup>

        {/* ── Data ──────────────────────────────────── */}
        <SettingsGroup title="Dữ liệu" theme={theme}>
          <TouchableOpacity style={styles.settingRow} onPress={handleClearCache}>
            <Text style={styles.settingEmoji}>🗑️</Text>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Xóa bộ nhớ đệm</Text>
          </TouchableOpacity>
        </SettingsGroup>

        {/* ── About ─────────────────────────────────── */}
        <SettingsGroup title="Thông tin" theme={theme}>
          <SettingLink theme={theme} label="Về VCT Platform" emoji="ℹ️" onPress={onNavigateAbout} />
          <SettingLink theme={theme} label="Chính sách quyền riêng tư" emoji="🔒" onPress={onNavigatePrivacy} />
          <SettingLink theme={theme} label="Điều khoản sử dụng" emoji="📄" onPress={onNavigateTerms} />
        </SettingsGroup>

        {/* Version */}
        <Text style={[styles.version, { color: theme.colors.textSecondary }]}>
          VCT Platform v1.0.0
        </Text>
      </ScrollView>
    </View>
  )
}

// ── Sub-components ───────────────────────────────────────────

function SettingsGroup({ title, theme, children }: { title: string; theme: any; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>{title}</Text>
      <VctCard style={styles.groupCard}>{children}</VctCard>
    </View>
  )
}

function SettingToggle({ theme, label, emoji, value, onToggle }: { theme: any; label: string; emoji: string; value: boolean; onToggle: (v: boolean) => void }) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingEmoji}>{emoji}</Text>
      <Text style={[styles.settingLabel, { color: theme.colors.text, flex: 1 }]}>{label}</Text>
      <Switch value={value} onValueChange={onToggle} trackColor={{ true: theme.colors.primary, false: theme.colors.border }} thumbColor="#FFF" />
    </View>
  )
}

function SettingLink({ theme, label, emoji, onPress }: { theme: any; label: string; emoji: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress}>
      <Text style={styles.settingEmoji}>{emoji}</Text>
      <Text style={[styles.settingLabel, { color: theme.colors.text, flex: 1 }]}>{label}</Text>
      <Text style={[styles.arrow, { color: theme.colors.textSecondary }]}>›</Text>
    </TouchableOpacity>
  )
}

// ── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 8 },
  backBtn: { paddingVertical: 8 },
  backText: { fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 28, fontWeight: '800', marginTop: 4, letterSpacing: 0.5 },
  scrollContent: { paddingBottom: 40 },
  section: { paddingHorizontal: 24, marginTop: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  groupCard: { padding: 4 },
  themeRow: { flexDirection: 'row', gap: 8, padding: 12 },
  themeOption: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1 },
  themeEmoji: { fontSize: 22, marginBottom: 4 },
  themeLabel: { fontSize: 12, fontWeight: '600' },
  langRow: { flexDirection: 'row', gap: 8, padding: 12 },
  langOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, borderWidth: 1, gap: 8 },
  langFlag: { fontSize: 20 },
  langLabel: { fontSize: 14, fontWeight: '600' },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  settingEmoji: { fontSize: 20 },
  settingLabel: { fontSize: 15, fontWeight: '500' },
  arrow: { fontSize: 22 },
  version: { textAlign: 'center', fontSize: 12, marginTop: 32 },
})
