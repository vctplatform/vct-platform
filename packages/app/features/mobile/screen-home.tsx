// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Home Screen (Dashboard)
// The main landing screen after login. Shows welcome greeting,
// quick stats, upcoming tournaments, recent activity, and
// quick action shortcuts.
// ═══════════════════════════════════════════════════════════════

import React, { useCallback, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Dimensions,
  Platform,
} from 'react-native'
import { useVCTTheme } from './theme-provider'
import { VctCard, VctBadge } from './core-ui'
import { useQuery } from './data-hooks'
import { triggerHaptic } from './haptic-feedback'
import { SkeletonLoader } from './skeleton-loader'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// ── Types ────────────────────────────────────────────────────

interface HomeScreenProps {
  onNavigateTournament?: (id: string) => void
  onNavigateNotifications?: () => void
  onNavigateProfile?: () => void
}

interface DashboardStats {
  totalTournaments: number
  upcomingMatches: number
  ranking: number | null
  clubMembers: number
}

interface UpcomingTournament {
  id: string
  name: string
  date: string
  location: string
  status: 'upcoming' | 'registration_open' | 'ongoing'
  participantCount: number
}

// ── Quick Action Data ────────────────────────────────────────

const QUICK_ACTIONS = [
  { id: 'tournaments', emoji: '🏆', label: 'Giải đấu', color: '#F59E0B' },
  { id: 'training', emoji: '🥋', label: 'Huấn luyện', color: '#8B5CF6' },
  { id: 'rankings', emoji: '📊', label: 'Bảng xếp hạng', color: '#3B82F6' },
  { id: 'clubs', emoji: '🏛️', label: 'Câu lạc bộ', color: '#10B981' },
]

// ── Component ────────────────────────────────────────────────

export function ScreenHome({
  onNavigateTournament,
  onNavigateNotifications,
  onNavigateProfile,
}: HomeScreenProps) {
  const { theme, isDark } = useVCTTheme()

  // Data fetching
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery<DashboardStats>('/api/v1/dashboard/stats', {
    cacheKey: 'dashboard-stats',
    staleTime: 60_000,
  })

  const {
    data: tournaments,
    isLoading: tournamentsLoading,
    refetch: refetchTournaments,
  } = useQuery<UpcomingTournament[]>('/api/v1/tournaments?status=upcoming&limit=5', {
    cacheKey: 'upcoming-tournaments',
    staleTime: 120_000,
  })

  const [refreshing, setRefreshing] = React.useState(false)

  // Entry animation
  const fadeAnim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start()
  }, [])

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    triggerHaptic('light')
    await Promise.all([refetchStats(), refetchTournaments()])
    setRefreshing(false)
  }, [refetchStats, refetchTournaments])

  // ── Render ───────────────────────────────────────────────

  return (
    <Animated.View style={[styles.container, { backgroundColor: theme.colors.background, opacity: fadeAnim }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* ── Header ─────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>Xin chào 👋</Text>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>VCT Platform</Text>
          </View>
          <TouchableOpacity
            onPress={onNavigateNotifications}
            style={[styles.notifBtn, { backgroundColor: theme.colors.surface }]}
            accessibilityLabel="Xem thông báo"
          >
            <Text style={styles.notifIcon}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* ── Quick Stats ────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Tổng quan</Text>
          {statsLoading ? (
            <SkeletonLoader width={SCREEN_WIDTH - 48} height={100} borderRadius={16} />
          ) : (
            <View style={styles.statsGrid}>
              <StatCard theme={theme} emoji="🏆" value={stats?.totalTournaments ?? 0} label="Giải đấu" />
              <StatCard theme={theme} emoji="⚔️" value={stats?.upcomingMatches ?? 0} label="Trận sắp tới" />
              <StatCard theme={theme} emoji="🏅" value={stats?.ranking ?? '--'} label="Xếp hạng" />
              <StatCard theme={theme} emoji="👥" value={stats?.clubMembers ?? 0} label="Thành viên" />
            </View>
          )}
        </View>

        {/* ── Quick Actions ──────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Truy cập nhanh</Text>
          <View style={styles.actionsRow}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.actionCard, { backgroundColor: theme.colors.surface }]}
                onPress={() => triggerHaptic('selection')}
                accessibilityLabel={action.label}
              >
                <View style={[styles.actionIconBg, { backgroundColor: `${action.color}20` }]}>
                  <Text style={styles.actionEmoji}>{action.emoji}</Text>
                </View>
                <Text style={[styles.actionLabel, { color: theme.colors.text }]}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Upcoming Tournaments ────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Giải đấu sắp tới</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAll, { color: theme.colors.primary }]}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          {tournamentsLoading ? (
            <View style={styles.skeletonList}>
              {[1, 2, 3].map((i) => (
                <SkeletonLoader key={i} width={SCREEN_WIDTH - 48} height={88} borderRadius={12} />
              ))}
            </View>
          ) : tournaments && tournaments.length > 0 ? (
            tournaments.map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => {
                  triggerHaptic('light')
                  onNavigateTournament?.(t.id)
                }}
                activeOpacity={0.7}
              >
                <VctCard style={styles.tournamentCard}>
                  <View style={styles.tournamentRow}>
                    <View style={styles.tournamentInfo}>
                      <Text style={[styles.tournamentName, { color: theme.colors.text }]} numberOfLines={1}>
                        {t.name}
                      </Text>
                      <Text style={[styles.tournamentMeta, { color: theme.colors.textSecondary }]}>
                        📅 {t.date} • 📍 {t.location}
                      </Text>
                    </View>
                    <VctBadge
                      label={t.status === 'registration_open' ? 'Đăng ký' : t.status === 'ongoing' ? 'Đang diễn ra' : 'Sắp tới'}
                      variant={t.status === 'registration_open' ? 'success' : t.status === 'ongoing' ? 'warning' : 'info'}
                    />
                  </View>
                  <Text style={[styles.participantCount, { color: theme.colors.textSecondary }]}>
                    👥 {t.participantCount} VĐV đã đăng ký
                  </Text>
                </VctCard>
              </TouchableOpacity>
            ))
          ) : (
            <VctCard style={styles.emptyCard}>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                🏆 Chưa có giải đấu sắp tới
              </Text>
            </VctCard>
          )}
        </View>
      </ScrollView>
    </Animated.View>
  )
}

// ── Stat Card Sub-component ──────────────────────────────────

function StatCard({
  theme,
  emoji,
  value,
  label,
}: {
  theme: any
  emoji: string
  value: number | string
  label: string
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
    </View>
  )
}

// ── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: 16,
  },
  headerLeft: {},
  greeting: { fontSize: 14, fontWeight: '500' },
  headerTitle: { fontSize: 24, fontWeight: '800', marginTop: 2, letterSpacing: 0.5 },
  notifBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  notifIcon: { fontSize: 20 },
  section: { paddingHorizontal: 24, marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  seeAll: { fontSize: 14, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    width: (SCREEN_WIDTH - 48 - 12) / 2, padding: 16, borderRadius: 16, alignItems: 'center',
  },
  statEmoji: { fontSize: 24, marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionCard: { flex: 1, padding: 14, borderRadius: 14, alignItems: 'center' },
  actionIconBg: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  actionEmoji: { fontSize: 22 },
  actionLabel: { fontSize: 11, fontWeight: '600' },
  tournamentCard: { marginBottom: 10, padding: 14 },
  tournamentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  tournamentInfo: { flex: 1, marginRight: 8 },
  tournamentName: { fontSize: 15, fontWeight: '700' },
  tournamentMeta: { fontSize: 12, marginTop: 4 },
  participantCount: { fontSize: 12, marginTop: 8 },
  emptyCard: { padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 14 },
  skeletonList: { gap: 10 },
})
