import * as React from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'solito/navigation'
import { useCallback, useMemo } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { USER_ROLE_OPTIONS } from '../auth/types'
import { getAccessibleMobileRoutes, type MobileRouteItem } from '../mobile/mobile-routes'
import { MobileModuleCard } from '../mobile/tournament-screens'
import { Colors, SharedStyles, FontWeight, Radius, Space } from '../mobile/mobile-theme'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Enhanced Mobile Home Screen
// Hero dashboard with role switching, quick stats, and module grid
// Uses centralized design system
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: 'var(--vct-text-primary)' },
  content: { padding: Space.lg, gap: 10, paddingBottom: 28 },

  heroCard: {
    borderRadius: Radius.xl, padding: Space.xxl, marginBottom: 6,
    backgroundColor: Colors.bgDark,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 4,
  },
  heroWelcome: { fontSize: 13, color: Colors.textMuted, fontWeight: FontWeight.semibold, marginBottom: 4 },
  heroName: { fontSize: 24, fontWeight: FontWeight.black, color: Colors.textWhite, marginBottom: 8 },
  heroRoleBadge: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.pill,
    backgroundColor: Colors.overlay(Colors.accent, 0.15), alignSelf: 'flex-start',
  },
  heroRoleText: { fontSize: 11, fontWeight: FontWeight.extrabold, color: 'var(--vct-info)' },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  statBox: {
    flex: 1, borderRadius: Radius.lg, padding: 14, alignItems: 'center',
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
  },
  statEmoji: { fontSize: 18, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: FontWeight.black, color: Colors.textPrimary, marginBottom: 2 },
  statLabel: { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },

  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  quickBtn: {
    flex: 1, borderRadius: Radius.md, padding: 14, alignItems: 'center',
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
  },
  quickIcon: { fontSize: 20, marginBottom: 4 },
  quickLabel: { fontSize: 10, fontWeight: FontWeight.bold, color: 'var(--vct-text-secondary)' },

  sectionTitle: { fontSize: 14, fontWeight: FontWeight.black, color: Colors.textPrimary, marginBottom: 4, marginTop: 8 },
  sectionSub: { fontSize: 11, color: Colors.textSecondary, marginBottom: 10 },

  roleWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  roleButton: {
    borderRadius: Radius.pill, borderWidth: 1, borderColor: 'var(--vct-text-secondary)',
    paddingVertical: 6, paddingHorizontal: 12, backgroundColor: Colors.bgCard,
  },
  roleButtonActive: { borderColor: 'var(--vct-accent-cyan)', backgroundColor: '#e0f2fe' },
  roleButtonText: { fontSize: 12, fontWeight: FontWeight.bold, color: 'var(--vct-text-secondary)' },
  roleButtonTextActive: { color: '#0369a1' },

  moduleSeparator: { height: 8 },
  emptyBox: {
    marginTop: 12, borderRadius: Radius.md, borderWidth: 1,
    borderColor: '#fecaca', backgroundColor: '#fef2f2', padding: 14,
  },
  emptyTitle: { color: '#991b1b', fontWeight: FontWeight.bold, marginBottom: 6 },
  emptyText: { color: 'var(--vct-danger)', fontSize: 12 },
})

const RoleButton = React.memo(function RoleButton({
  label, active, onPress,
}: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.roleButton, active && styles.roleButtonActive]} onPress={onPress}>
      <Text style={[styles.roleButtonText, active && styles.roleButtonTextActive]}>{label}</Text>
    </Pressable>
  )
})

export function HomeScreen() {
  const router = useRouter()
  const { currentUser, setRole } = useAuth()

  const modules = useMemo(() => getAccessibleMobileRoutes(currentUser.role), [currentUser.role])
  const roleLabel = useMemo(() => USER_ROLE_OPTIONS.find(item => item.value === currentUser.role)?.label ?? currentUser.role, [currentUser.role])

  const renderModuleCard = useCallback(
    ({ item }: { item: MobileRouteItem }) => (
      <MobileModuleCard title={item.title} subtitle={item.subtitle} onPress={() => router.push(`/${item.nativePath}`)} />
    ),
    [router]
  )

  const headerComponent = useMemo(() => {
    const isAthlete = currentUser.role === 'athlete'
    const greeting = getGreeting()

    return (
      <View>
        {/* HERO */}
        <View style={styles.heroCard}>
          <Text style={styles.heroWelcome}>{greeting} 👋</Text>
          <Text style={styles.heroName}>{currentUser.name || 'Người dùng VCT'}</Text>
          <View style={styles.heroRoleBadge}>
            <Text style={styles.heroRoleText}>🥋 {roleLabel}</Text>
          </View>
        </View>

        {/* QUICK STATS */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statEmoji}>📦</Text>
            <Text style={styles.statValue}>{modules.length}</Text>
            <Text style={styles.statLabel}>Module</Text>
          </View>
          {isAthlete ? (
            <>
              <View style={styles.statBox}>
                <Text style={styles.statEmoji}>🏆</Text>
                <Text style={[styles.statValue, { color: Colors.gold }]}>5</Text>
                <Text style={styles.statLabel}>Huy chương</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statEmoji}>📊</Text>
                <Text style={[styles.statValue, { color: Colors.accent }]}>1450</Text>
                <Text style={styles.statLabel}>Elo</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.statBox}>
                <Text style={styles.statEmoji}>🏆</Text>
                <Text style={[styles.statValue, { color: Colors.gold }]}>3</Text>
                <Text style={styles.statLabel}>Giải đấu</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statEmoji}>👥</Text>
                <Text style={[styles.statValue, { color: Colors.green }]}>128</Text>
                <Text style={styles.statLabel}>VĐV</Text>
              </View>
            </>
          )}
        </View>

        {/* QUICK ACTIONS — athlete */}
        {isAthlete && (
          <>
            <Text style={styles.sectionTitle}>Truy cập nhanh</Text>
            <View style={styles.quickRow}>
              <Pressable style={styles.quickBtn} onPress={() => router.push('/athlete-portal')}>
                <Text style={styles.quickIcon}>🏠</Text>
                <Text style={styles.quickLabel}>Cổng VĐV</Text>
              </Pressable>
              <Pressable style={styles.quickBtn} onPress={() => router.push('/athlete-training')}>
                <Text style={styles.quickIcon}>📋</Text>
                <Text style={styles.quickLabel}>Lịch tập</Text>
              </Pressable>
              <Pressable style={styles.quickBtn} onPress={() => router.push('/athlete-tournaments')}>
                <Text style={styles.quickIcon}>🏆</Text>
                <Text style={styles.quickLabel}>Giải đấu</Text>
              </Pressable>
              <Pressable style={styles.quickBtn} onPress={() => router.push('/athlete-results')}>
                <Text style={styles.quickIcon}>🏅</Text>
                <Text style={styles.quickLabel}>Thành tích</Text>
              </Pressable>
            </View>
          </>
        )}

        {/* ROLE SELECTOR */}
        <Text style={styles.sectionTitle}>Chuyển vai trò</Text>
        <Text style={styles.sectionSub}>Chọn vai trò để xem module tương ứng</Text>
        <View style={styles.roleWrap}>
          {USER_ROLE_OPTIONS.map(roleOption => (
            <RoleButton
              key={roleOption.value}
              label={roleOption.label}
              active={roleOption.value === currentUser.role}
              onPress={() => setRole(roleOption.value)}
            />
          ))}
        </View>

        {/* MODULE LIST HEADER */}
        <Text style={styles.sectionTitle}>Module nghiệp vụ</Text>
        <Text style={styles.sectionSub}>
          {modules.length > 0 ? `${modules.length} module khả dụng cho ${roleLabel}` : 'Không có module cho vai trò này'}
        </Text>
      </View>
    )
  }, [currentUser.role, currentUser.name, roleLabel, modules.length, setRole, router])

  const emptyState = useMemo(() => (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyTitle}>Vai trò hiện tại chưa được cấp module mobile.</Text>
      <Text style={styles.emptyText}>Hãy đổi role khác để tiếp tục.</Text>
    </View>
  ), [])

  return (
    <FlatList
      data={modules}
      style={styles.page}
      contentContainerStyle={styles.content}
      keyExtractor={item => item.key}
      renderItem={renderModuleCard}
      ItemSeparatorComponent={() => <View style={styles.moduleSeparator} />}
      ListHeaderComponent={headerComponent}
      ListEmptyComponent={emptyState}
    />
  )
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Chào buổi sáng'
  if (h < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}
