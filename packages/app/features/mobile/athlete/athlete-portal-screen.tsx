import * as React from 'react'
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'solito/navigation'
import { useAuth } from '../../auth/AuthProvider'
import { Colors, SharedStyles, FontWeight, Radius, Space, Touch } from '../mobile-theme'
import { Badge, ScreenSkeleton } from '../mobile-ui'
import { Icon, VCTIcons } from '../icons'
import { hapticLight } from '../haptics'
import { useAthleteProfile, useAthleteTournaments, useAthleteTraining, useNotifications } from '../useAthleteData'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Athlete Portal Screen (v3)
// Compact dashboard hub: greeting, quick actions grid,
// upcoming tournament/training cards, notification badge
// De-duplicated: no skill bars, goals, belt timeline (moved to dedicated screens)
// ═══════════════════════════════════════════════════════════════

const QUICK_ACTIONS = [
  { icon: VCTIcons.trophy, label: 'Giải đấu', route: '/athlete-tournaments', color: Colors.gold },
  { icon: VCTIcons.calendar, label: 'Lịch tập', route: '/athlete-training', color: Colors.green },
  { icon: VCTIcons.podium, label: 'Thành tích', route: '/athlete-results', color: Colors.purple },
  { icon: VCTIcons.stats, label: 'Xếp hạng', route: '/athlete-rankings', color: Colors.cyan },
  { icon: VCTIcons.person, label: 'Hồ sơ', route: '/profile', color: Colors.accent },
  { icon: VCTIcons.book, label: 'E-Learning', route: '/athlete-elearning', color: Colors.red },
] as const

export function AthletePortalMobileScreen() {
  const { currentUser } = useAuth()
  const router = useRouter()
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useAthleteProfile()
  const { data: tournaments, isLoading: tournLoading } = useAthleteTournaments()
  const { data: training, isLoading: trainLoading } = useAthleteTraining()
  const { notifications } = useNotifications()

  const isLoading = profileLoading
  const refetch = () => { refetchProfile() }

  if (isLoading || !profile) return <ScreenSkeleton />

  const unreadCount = notifications.filter(n => !n.read).length
  const nextTournament = tournaments?.[0]
  const nextSession = training?.sessions.find(s => s.status === 'scheduled')

  return (
    <ScrollView
      style={SharedStyles.page}
      contentContainerStyle={SharedStyles.scrollContent}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.accent} />}
    >
      {/* GREETING BAR — compact, not a full hero */}
      <View style={{
        borderRadius: Radius.xl, padding: Space.lg, marginBottom: Space.lg,
        backgroundColor: Colors.bgDark,
        flexDirection: 'row', alignItems: 'center', gap: 14,
      }}>
        <View style={{
          width: 48, height: 48, borderRadius: 24,
          backgroundColor: Colors.overlay(Colors.accent, 0.2), justifyContent: 'center', alignItems: 'center',
          borderWidth: 2, borderColor: Colors.overlay(Colors.accent, 0.4),
        }}>
          <Icon name={VCTIcons.fitness} size={24} color={Colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: FontWeight.black, color: Colors.textWhite }}>
            Chào {currentUser.name || profile.name}!
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
            <Badge label={profile.belt} bg={Colors.overlay(Colors.gold, 0.15)} fg={Colors.gold} icon={VCTIcons.ribbon} />
            <Badge label={`Elo: ${profile.elo}`} bg={Colors.overlay(Colors.accent, 0.15)} fg={Colors.accent} icon={VCTIcons.stats} />
          </View>
        </View>
        {/* Notification bell */}
        <Pressable
          onPress={() => { hapticLight(); router.push('/notifications') }}
          accessibilityRole="button"
          accessibilityLabel={`Thông báo${unreadCount > 0 ? `, ${unreadCount} chưa đọc` : ''}`}
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.overlay('#fff', 0.08), justifyContent: 'center', alignItems: 'center' }}
        >
          <Icon name={VCTIcons.notifications} size={22} color={Colors.textWhite} />
          {unreadCount > 0 && (
            <View style={{
              position: 'absolute', top: 4, right: 4,
              minWidth: 16, height: 16, borderRadius: 8,
              backgroundColor: Colors.red, justifyContent: 'center', alignItems: 'center',
              paddingHorizontal: 3,
            }}>
              <Text style={{ fontSize: 9, fontWeight: FontWeight.black, color: '#fff' }}>{unreadCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* COMPACT STATS */}
      <View style={SharedStyles.statsRow}>
        <View style={SharedStyles.statBox} accessibilityLabel={`${profile.tournamentCount} giải đấu`}>
          <Icon name={VCTIcons.trophy} size={16} color={Colors.accent} style={{ marginBottom: 4 }} />
          <Text style={SharedStyles.statValue}>{profile.tournamentCount}</Text>
          <Text style={SharedStyles.statLabel}>Giải đấu</Text>
        </View>
        <View style={SharedStyles.statBox} accessibilityLabel={`${profile.medalCount} huy chương`}>
          <Icon name={VCTIcons.medal} size={16} color={Colors.gold} style={{ marginBottom: 4 }} />
          <Text style={[SharedStyles.statValue, { color: Colors.gold }]}>{profile.medalCount}</Text>
          <Text style={SharedStyles.statLabel}>Huy chương</Text>
        </View>
        <View style={SharedStyles.statBox} accessibilityLabel={`Tỷ lệ tập ${profile.attendanceRate}%`}>
          <Icon name={VCTIcons.flame} size={16} color={Colors.green} style={{ marginBottom: 4 }} />
          <Text style={[SharedStyles.statValue, { color: Colors.green }]}>{profile.attendanceRate}%</Text>
          <Text style={SharedStyles.statLabel}>Chuyên cần</Text>
        </View>
      </View>

      {/* QUICK ACTIONS — 6-item grid */}
      <Text style={SharedStyles.sectionTitle}>Truy cập nhanh</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Space.lg }}>
        {QUICK_ACTIONS.map(item => (
          <Pressable
            key={item.route}
            style={{
              width: '30%', flexGrow: 1, borderRadius: Radius.md, padding: 14, alignItems: 'center',
              backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
              minHeight: Touch.minSize,
            }}
            onPress={() => { hapticLight(); router.push(item.route) }}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <Icon name={item.icon} size={22} color={item.color} style={{ marginBottom: 6 }} />
            <Text style={{ fontSize: 11, fontWeight: FontWeight.bold, color: Colors.textSecondary }}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* UPCOMING TOURNAMENT — mini card */}
      {nextTournament && (
        <>
          <Text style={SharedStyles.sectionTitle}>Giải đấu sắp tới</Text>
          <Pressable
            style={SharedStyles.card}
            onPress={() => { hapticLight(); router.push(`/tournament-detail?id=${nextTournament.id}`) }}
            accessibilityRole="button"
            accessibilityLabel={`Giải đấu: ${nextTournament.name}`}
          >
            <View style={[SharedStyles.rowBetween, { marginBottom: 6 }]}>
              <View style={[SharedStyles.row, { gap: 8 }]}>
                <Icon name={VCTIcons.trophy} size={16} color={Colors.gold} />
                <Text style={{ fontSize: 14, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, flex: 1 }}>
                  {nextTournament.name}
                </Text>
              </View>
              <Icon name={VCTIcons.forward} size={16} color={Colors.textMuted} />
            </View>
            <View style={[SharedStyles.row, { gap: 6 }]}>
              <Icon name={VCTIcons.calendar} size={12} color={Colors.textSecondary} />
              <Text style={{ fontSize: 11, color: Colors.textSecondary }}>{nextTournament.date}</Text>
              <Text style={{ fontSize: 11, color: Colors.textSecondary }}> · </Text>
              <Text style={{ fontSize: 11, color: Colors.textSecondary }}>{nextTournament.categories.join(', ')}</Text>
            </View>
          </Pressable>
        </>
      )}

      {/* NEXT TRAINING SESSION — mini card */}
      {nextSession && (
        <>
          <Text style={SharedStyles.sectionTitle}>Buổi tập tiếp theo</Text>
          <Pressable
            style={SharedStyles.card}
            onPress={() => { hapticLight(); router.push(`/training-detail?id=${nextSession.id}`) }}
            accessibilityRole="button"
            accessibilityLabel={`Buổi tập: ${nextSession.date}`}
          >
            <View style={[SharedStyles.rowBetween, { marginBottom: 6 }]}>
              <View style={[SharedStyles.row, { gap: 8 }]}>
                <Icon name={VCTIcons.fitness} size={16} color={Colors.green} />
                <Text style={{ fontSize: 14, fontWeight: FontWeight.extrabold, color: Colors.textPrimary }}>
                  {nextSession.time}
                </Text>
              </View>
              <Icon name={VCTIcons.forward} size={16} color={Colors.textMuted} />
            </View>
            <View style={[SharedStyles.row, { gap: 6 }]}>
              <Icon name={VCTIcons.location} size={12} color={Colors.textSecondary} />
              <Text style={{ fontSize: 11, color: Colors.textSecondary }}>{nextSession.location}</Text>
              <Text style={{ fontSize: 11, color: Colors.textSecondary }}> · </Text>
              <Text style={{ fontSize: 11, color: Colors.textSecondary }}>{nextSession.coach}</Text>
            </View>
          </Pressable>
        </>
      )}
    </ScrollView>
  )
}
