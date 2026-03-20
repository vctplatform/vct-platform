// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Profile Screen
// User profile dashboard showing avatar, stats, achievements,
// tournament history, and quick links to settings.
// ═══════════════════════════════════════════════════════════════

import React, { useCallback, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  Alert,
  Dimensions,
} from 'react-native'
import { useVCTTheme } from './theme-provider'
import { VctCard, VctBadge, VctButton } from './core-ui'
import { useQuery } from './data-hooks'
import { authStorage } from './auth-storage'
import { triggerHaptic } from './haptic-feedback'
import { SkeletonLoader } from './skeleton-loader'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// ── Types ────────────────────────────────────────────────────

interface ProfileScreenProps {
  onNavigateSettings?: () => void
  onNavigateEditProfile?: () => void
  onNavigateMyTournaments?: () => void
  onNavigateMyClub?: (clubId: string) => void
  onLogout?: () => void
}

interface UserProfile {
  id: string
  fullName: string
  email: string
  phone: string
  role: string
  avatar?: string
  belt?: string
  club?: { id: string; name: string }
  stats: { tournaments: number; wins: number; matches: number; ranking: number | null }
  achievements: { id: string; title: string; emoji: string; date: string }[]
}

// ── Role Labels ──────────────────────────────────────────────

const ROLE_LABELS: Record<string, { label: string; emoji: string }> = {
  athlete: { label: 'Vận động viên', emoji: '🥋' },
  coach: { label: 'Huấn luyện viên', emoji: '🏅' },
  referee: { label: 'Trọng tài', emoji: '⚖️' },
  club_manager: { label: 'Quản lý CLB', emoji: '🏛️' },
  spectator: { label: 'Người xem', emoji: '👀' },
  admin: { label: 'Quản trị viên', emoji: '⚙️' },
}

// ── Menu Items ───────────────────────────────────────────────

interface MenuItem {
  id: string
  emoji: string
  label: string
  action: string
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'tournaments', emoji: '🏆', label: 'Giải đấu của tôi', action: 'my_tournaments' },
  { id: 'club', emoji: '🏛️', label: 'Câu lạc bộ', action: 'my_club' },
  { id: 'settings', emoji: '⚙️', label: 'Cài đặt', action: 'settings' },
  { id: 'feedback', emoji: '💬', label: 'Góp ý & Phản hồi', action: 'feedback' },
  { id: 'help', emoji: '❓', label: 'Trợ giúp', action: 'help' },
]

// ── Component ────────────────────────────────────────────────

export function ScreenProfile({
  onNavigateSettings,
  onNavigateEditProfile,
  onNavigateMyTournaments,
  onNavigateMyClub,
  onLogout,
}: ProfileScreenProps) {
  const { theme } = useVCTTheme()

  const { data: profile, isLoading } = useQuery<UserProfile>('/api/v1/users/me', {
    cacheKey: 'user-profile',
    staleTime: 120_000,
  })

  const fadeAnim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start()
  }, [])

  const handleMenuPress = useCallback((action: string) => {
    triggerHaptic('light')
    switch (action) {
      case 'settings': onNavigateSettings?.(); break
      case 'my_tournaments': onNavigateMyTournaments?.(); break
      case 'my_club': profile?.club && onNavigateMyClub?.(profile.club.id); break
    }
  }, [onNavigateSettings, onNavigateMyTournaments, onNavigateMyClub, profile])

  const handleLogout = useCallback(() => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          triggerHaptic('warning')
          await authStorage.clear()
          onLogout?.()
        },
      },
    ])
  }, [onLogout])

  const roleInfo = ROLE_LABELS[profile?.role ?? ''] || { label: 'Thành viên', emoji: '👤' }

  // ── Loading ──────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.skeleton}>
          <SkeletonLoader width={100} height={100} borderRadius={50} />
          <SkeletonLoader width={200} height={24} borderRadius={8} />
          <SkeletonLoader width={SCREEN_WIDTH - 48} height={100} borderRadius={14} />
        </View>
      </View>
    )
  }

  // ── Render ───────────────────────────────────────────────

  return (
    <Animated.View style={[styles.container, { backgroundColor: theme.colors.background, opacity: fadeAnim }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar & Name */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.surface }]}>
            <Text style={styles.avatarEmoji}>{roleInfo.emoji}</Text>
          </View>
          <Text style={[styles.fullName, { color: theme.colors.text }]}>{profile?.fullName ?? 'Người dùng'}</Text>
          <View style={styles.roleRow}>
            <VctBadge label={roleInfo.label} variant="info" />
            {profile?.belt && <VctBadge label={`Đai ${profile.belt}`} variant="warning" />}
          </View>
          {profile?.club && (
            <Text style={[styles.clubName, { color: theme.colors.textSecondary }]}>
              🏛️ {profile.club.name}
            </Text>
          )}
          <TouchableOpacity onPress={onNavigateEditProfile} style={styles.editBtn}>
            <Text style={[styles.editText, { color: theme.colors.primary }]}>✏️ Chỉnh sửa hồ sơ</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        {profile?.stats && (
          <View style={styles.statsRow}>
            <StatBox theme={theme} value={profile.stats.tournaments} label="Giải" />
            <StatBox theme={theme} value={profile.stats.matches} label="Trận" />
            <StatBox theme={theme} value={profile.stats.wins} label="Thắng" />
            <StatBox theme={theme} value={profile.stats.ranking ?? '--'} label="Hạng" />
          </View>
        )}

        {/* Achievements */}
        {profile?.achievements && profile.achievements.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Thành tích</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.achievementScroll}>
              {profile.achievements.map((a) => (
                <VctCard key={a.id} style={styles.achievementCard}>
                  <Text style={styles.achieveEmoji}>{a.emoji}</Text>
                  <Text style={[styles.achieveTitle, { color: theme.colors.text }]} numberOfLines={2}>{a.title}</Text>
                  <Text style={[styles.achieveDate, { color: theme.colors.textSecondary }]}>{a.date}</Text>
                </VctCard>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Menu */}
        <View style={styles.section}>
          <VctCard>
            {MENU_ITEMS.map((item, i) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuItem, i > 0 && { borderTopColor: theme.colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}
                onPress={() => handleMenuPress(item.action)}
                accessibilityLabel={item.label}
              >
                <Text style={styles.menuEmoji}>{item.emoji}</Text>
                <Text style={[styles.menuLabel, { color: theme.colors.text }]}>{item.label}</Text>
                <Text style={[styles.menuArrow, { color: theme.colors.textSecondary }]}>›</Text>
              </TouchableOpacity>
            ))}
          </VctCard>
        </View>

        {/* Logout */}
        <View style={styles.logoutSection}>
          <VctButton title="Đăng xuất" onPress={handleLogout} variant="danger" size="medium" />
        </View>
      </ScrollView>
    </Animated.View>
  )
}

// ── Sub-components ───────────────────────────────────────────

function StatBox({ theme, value, label }: { theme: any; value: number | string; label: string }) {
  return (
    <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
    </View>
  )
}

// ── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  skeleton: { alignItems: 'center', paddingTop: 80, gap: 16 },
  profileHeader: {
    alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 64 : 48, paddingBottom: 20, paddingHorizontal: 24,
  },
  avatar: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarEmoji: { fontSize: 40 },
  fullName: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  roleRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  clubName: { fontSize: 13, marginTop: 4 },
  editBtn: { marginTop: 10, paddingVertical: 6 },
  editText: { fontSize: 14, fontWeight: '600' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 10, marginTop: 4 },
  statBox: { flex: 1, padding: 14, borderRadius: 14, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  section: { paddingHorizontal: 24, marginTop: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 10 },
  achievementScroll: { gap: 10 },
  achievementCard: { width: 120, padding: 12, alignItems: 'center' },
  achieveEmoji: { fontSize: 28, marginBottom: 6 },
  achieveTitle: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  achieveDate: { fontSize: 10, marginTop: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  menuEmoji: { fontSize: 20 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  menuArrow: { fontSize: 22 },
  logoutSection: { paddingHorizontal: 24, marginTop: 32 },
})
