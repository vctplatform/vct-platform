import * as React from 'react'
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native'
import { useAuth } from '../auth/AuthProvider'
import { USER_ROLE_OPTIONS } from '../auth/types'
import { useThemeColors, FontWeight, Radius, Space, Touch } from './mobile-theme'
import { Icon, VCTIcons } from './icons'
import { showComingSoon } from './mobile-ui'
import { hapticLight, hapticWarning, hapticSelection } from './haptics'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Mobile Settings Screen (v3)
// Dynamic theme support, working dark mode toggle
// ═══════════════════════════════════════════════════════════════

type IoniconsName = React.ComponentProps<typeof Icon>['name']

interface SettingRowProps {
  icon: IoniconsName; label: string; value?: string
  showArrow?: boolean; onPress?: () => void; isLast?: boolean
  right?: React.ReactNode
  colors: ReturnType<typeof useThemeColors>['colors']
}

function SettingRow({ icon, label, value, showArrow = true, onPress, isLast, right, colors }: SettingRowProps) {
  return (
    <Pressable
      style={[
        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, minHeight: Touch.minSize },
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
      onPress={() => { hapticLight(); (onPress ?? (() => showComingSoon(label)))() }}
      android_ripple={{ color: 'rgba(0,0,0,0.04)' }}
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}: ${value}` : label}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Icon name={icon} size={20} color={colors.textSecondary} />
        <Text style={{ fontSize: 14, fontWeight: FontWeight.semibold, color: colors.textPrimary }}>{label}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {right ?? (
          <>
            {value ? <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: FontWeight.semibold }}>{value}</Text> : null}
            {showArrow ? <Icon name={VCTIcons.forward} size={16} color={colors.textMuted} /> : null}
          </>
        )}
      </View>
    </Pressable>
  )
}

export function SettingsMobileScreen() {
  const { currentUser, logout, setRole } = useAuth()
  const { colors, isDark, toggleTheme } = useThemeColors()

  const roleLabel = USER_ROLE_OPTIONS.find(r => r.value === currentUser.role)?.label ?? currentUser.role

  const handleLogout = () => {
    hapticWarning()
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất khỏi ứng dụng?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => logout() },
    ])
  }

  const handleRoleSwitch = () => {
    hapticSelection()
    Alert.alert('Chọn vai trò', 'Chuyển đổi vai trò để xem module tương ứng', [
      ...USER_ROLE_OPTIONS.map(r => ({
        text: `${r.value === currentUser.role ? '✓ ' : ''}${r.label}`,
        onPress: () => { hapticSelection(); setRole(r.value) },
      })),
      { text: 'Hủy', style: 'cancel' as const },
    ])
  }

  const handleThemeToggle = () => {
    hapticSelection()
    toggleTheme()
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bgBase }} contentContainerStyle={{ padding: Space.lg, paddingBottom: 40 }}>
      {/* USER CARD */}
      <View
        style={{
          borderRadius: Radius.xl, padding: Space.xxl, marginBottom: 20,
          backgroundColor: colors.bgDark,
        }}
        accessibilityRole="summary"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View style={{
            width: 60, height: 60, borderRadius: 30,
            backgroundColor: colors.overlay(colors.accent, 0.2), justifyContent: 'center', alignItems: 'center',
            borderWidth: 2, borderColor: colors.overlay(colors.accent, 0.3),
          }}>
            <Icon name={VCTIcons.person} size={28} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: FontWeight.black, color: colors.textWhite }}>{currentUser.name || 'VĐV Demo'}</Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{currentUser.email || 'demo@vctplatform.vn'}</Text>
            <View style={{
              marginTop: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.pill,
              backgroundColor: colors.overlay(colors.accent, 0.15), alignSelf: 'flex-start',
            }}>
              <Text style={{ fontSize: 10, fontWeight: FontWeight.extrabold, color: colors.accent }}>{roleLabel}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ACCOUNT */}
      <Text style={{ fontSize: 12, fontWeight: FontWeight.extrabold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 8 }}>Tài khoản</Text>
      <View style={{ borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Space.lg, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border }}>
        <SettingRow icon={VCTIcons.person} label="Hồ sơ cá nhân" colors={colors} />
        <SettingRow icon={VCTIcons.grid} label="Chuyển vai trò" value={roleLabel} onPress={handleRoleSwitch} colors={colors} />
        <SettingRow icon={VCTIcons.key} label="Đổi mật khẩu" colors={colors} />
        <SettingRow icon={VCTIcons.phone} label="Thiết bị đăng nhập" value="1 thiết bị" isLast colors={colors} />
      </View>

      {/* APP SETTINGS */}
      <Text style={{ fontSize: 12, fontWeight: FontWeight.extrabold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 8 }}>Ứng dụng</Text>
      <View style={{ borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Space.lg, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border }}>
        <SettingRow icon={VCTIcons.globe} label="Ngôn ngữ" value="Tiếng Việt" colors={colors} />
        <SettingRow icon={VCTIcons.notifications} label="Thông báo" value="Bật" colors={colors} />
        <SettingRow
          icon={isDark ? VCTIcons.moon : VCTIcons.sunny}
          label="Giao diện"
          showArrow={false}
          onPress={handleThemeToggle}
          colors={colors}
          right={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: FontWeight.semibold }}>
                {isDark ? 'Tối' : 'Sáng'}
              </Text>
              <Switch
                value={isDark}
                onValueChange={handleThemeToggle}
                trackColor={{ false: colors.trackBg, true: colors.overlay(colors.accent, 0.4) }}
                thumbColor={isDark ? colors.accent : '#f4f3f4'}
                accessibilityLabel="Chuyển đổi giao diện sáng/tối"
              />
            </View>
          }
        />
        <SettingRow icon={VCTIcons.cellular} label="Sử dụng dữ liệu" value="Wi-Fi" isLast colors={colors} />
      </View>

      {/* STORAGE & OFFLINE */}
      <Text style={{ fontSize: 12, fontWeight: FontWeight.extrabold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 8 }}>Lưu trữ & Ngoại tuyến</Text>
      <View style={{ borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Space.lg, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border }}>
        <SettingRow icon={VCTIcons.cloudOffline} label="Chế độ ngoại tuyến" value="Bật" colors={colors} />
        <SettingRow icon={VCTIcons.cloudUpload} label="Đồng bộ tự động" value="Bật" colors={colors} />
        <SettingRow
          icon={VCTIcons.refresh}
          label="Xóa bộ đệm (12MB)"
          showArrow={false}
          onPress={() => {
            hapticWarning()
            Alert.alert('Xóa bộ đệm', 'Dữ liệu tạm 12MB đã được dọn dẹp.', [{ text: 'OK' }])
          }}
          isLast
          colors={colors}
        />
      </View>

      {/* ABOUT */}
      <Text style={{ fontSize: 12, fontWeight: FontWeight.extrabold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 8 }}>Thông tin</Text>
      <View style={{ borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Space.lg, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border }}>
        <SettingRow icon={VCTIcons.info} label="Giới thiệu VCT" colors={colors} />
        <SettingRow icon={VCTIcons.clipboard} label="Điều khoản sử dụng" colors={colors} />
        <SettingRow icon={VCTIcons.shield} label="Chính sách bảo mật" colors={colors} />
        <SettingRow icon={VCTIcons.call} label="Liên hệ hỗ trợ" colors={colors} />
        <SettingRow icon={VCTIcons.starOutline} label="Đánh giá ứng dụng" colors={colors} />
        <SettingRow icon={VCTIcons.info} label="Phiên bản" value="1.0.0 (build 2026.03)" showArrow={false} colors={colors} />
        <SettingRow icon={VCTIcons.settings} label="Môi trường" value="Development" showArrow={false} isLast colors={colors} />
      </View>

      <Pressable
        style={{
          borderRadius: Radius.lg, padding: 16, marginTop: 8, marginBottom: 16,
          backgroundColor: colors.overlay(colors.red, 0.06), borderWidth: 1, borderColor: colors.overlay(colors.red, 0.15),
          alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
          minHeight: Touch.minSize,
        }}
        onPress={handleLogout}
        accessibilityRole="button"
        accessibilityLabel="Đăng xuất khỏi ứng dụng"
      >
        <Icon name={VCTIcons.logout} size={20} color={colors.red} />
        <Text style={{ fontSize: 15, fontWeight: FontWeight.extrabold, color: colors.red }}>Đăng xuất</Text>
      </Pressable>

      <View style={{ alignItems: 'center', paddingVertical: 16 }}>
        <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 2 }}>VCT Platform © 2026</Text>
        <Text style={{ fontSize: 11, color: colors.textMuted }}>Võ Cổ Truyền Việt Nam</Text>
      </View>
    </ScrollView>
  )
}
