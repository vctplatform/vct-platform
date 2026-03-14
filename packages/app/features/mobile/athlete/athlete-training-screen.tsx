import * as React from 'react'
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'solito/navigation'
import { Colors, SharedStyles, FontWeight, Touch } from '../mobile-theme'
import { Badge, ScreenHeader, ScreenSkeleton } from '../mobile-ui'
import { Icon, VCTIcons } from '../icons'
import { hapticLight } from '../haptics'
import { useAthleteTraining } from '../useAthleteData'
import { SESSION_TYPE_CFG, SESSION_STATUS_CFG } from '../mock-data'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Athlete Training Screen (v3)
// SVG icons, computed type breakdown (no mock import), tap-to-detail
// ═══════════════════════════════════════════════════════════════

// Icon mapping for session types
const SESSION_ICONS: Record<string, React.ComponentProps<typeof Icon>['name']> = {
  'regular': VCTIcons.calendar,
  'sparring': VCTIcons.flash,
  'exam': VCTIcons.trophy,
  'special': VCTIcons.starOutline,
}

export function AthleteTrainingMobileScreen() {
  const router = useRouter()
  const { data, isLoading, refetch } = useAthleteTraining()

  if (isLoading || !data) return <ScreenSkeleton />

  const { sessions, stats } = data

  // Compute type breakdown from actual sessions instead of mock constant
  const typeBreakdown = React.useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of sessions) {
      counts[s.type] = (counts[s.type] ?? 0) + 1
    }
    return Object.entries(counts).map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
  }, [sessions])

  return (
    <ScrollView
      style={SharedStyles.page}
      contentContainerStyle={[SharedStyles.scrollContent, { paddingBottom: 100 }]}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.accent} />}
    >
      <ScreenHeader title="Lịch tập" subtitle="Lịch tập luyện và điểm danh" icon={VCTIcons.calendar} onBack={() => router.back()} />

      {/* Attendance Stats */}
      <View style={SharedStyles.statsRow}>
        <View style={SharedStyles.statBox} accessibilityLabel={`${stats.total} tổng buổi`}>
          <Icon name={VCTIcons.calendar} size={16} color={Colors.accent} style={{ marginBottom: 4 }} />
          <Text style={SharedStyles.statValue}>{stats.total}</Text>
          <Text style={SharedStyles.statLabel}>Tổng buổi</Text>
        </View>
        <View style={SharedStyles.statBox} accessibilityLabel={`${stats.attended} buổi đã tập`}>
          <Icon name={VCTIcons.checkmark} size={16} color={Colors.green} style={{ marginBottom: 4 }} />
          <Text style={[SharedStyles.statValue, { color: Colors.green }]}>{stats.attended}</Text>
          <Text style={SharedStyles.statLabel}>Đã tập</Text>
        </View>
        <View style={SharedStyles.statBox} accessibilityLabel={`Chuỗi ${stats.streak} buổi`}>
          <Icon name={VCTIcons.flame} size={16} color={Colors.purple} style={{ marginBottom: 4 }} />
          <Text style={[SharedStyles.statValue, { color: Colors.purple }]}>{stats.streak}</Text>
          <Text style={SharedStyles.statLabel}>Chuỗi</Text>
        </View>
        <View style={SharedStyles.statBox} accessibilityLabel={`${stats.absent} buổi vắng`}>
          <Icon name={VCTIcons.alert} size={16} color={Colors.red} style={{ marginBottom: 4 }} />
          <Text style={[SharedStyles.statValue, { color: Colors.red }]}>{stats.absent}</Text>
          <Text style={SharedStyles.statLabel}>Vắng</Text>
        </View>
      </View>

      {/* Attendance Rate */}
      <View style={SharedStyles.card} accessibilityLabel={`Tỷ lệ chuyên cần ${stats.rate} phần trăm`}>
        <Text style={{ fontSize: 12, fontWeight: FontWeight.bold, color: Colors.textSecondary, marginBottom: 6 }}>Tỷ lệ chuyên cần</Text>
        <View style={[SharedStyles.row, { gap: 12 }]}>
          <Text style={{ fontSize: 28, fontWeight: FontWeight.black, color: Colors.green }}>{stats.rate}%</Text>
          <View style={{ flex: 1 }}>
            <View style={{ height: 10, backgroundColor: Colors.trackBg, borderRadius: 5, overflow: 'hidden' }}>
              <View style={{ height: '100%', borderRadius: 5, width: `${stats.rate}%`, backgroundColor: Colors.green }} />
            </View>
          </View>
        </View>
        <View style={[SharedStyles.row, { gap: 6, marginTop: 4 }]}>
          <Icon name={VCTIcons.flame} size={12} color={Colors.textSecondary} />
          <Text style={{ fontSize: 10, color: Colors.textSecondary }}>
            Chuỗi {stats.streak} buổi liên tiếp · {stats.cancelled} buổi hủy
          </Text>
        </View>
      </View>

      {/* Upcoming Sessions — tappable */}
      <Text style={SharedStyles.sectionTitle}>Buổi tập sắp tới</Text>
      {sessions.filter(t => t.status === 'scheduled').map(session => {
        const cfg = SESSION_TYPE_CFG[session.type] ?? SESSION_TYPE_CFG['regular']!
        const stCfg = SESSION_STATUS_CFG[session.status] ?? SESSION_STATUS_CFG['scheduled']!
        const iconName = SESSION_ICONS[session.type] ?? VCTIcons.calendar
        return (
          <Pressable
            key={session.id}
            style={SharedStyles.card}
            accessibilityLabel={`${cfg.label}: ${session.time}, ${session.date}`}
            accessibilityRole="button"
            onPress={() => { hapticLight(); router.push(`/training-detail?id=${session.id}`) }}
          >
            <View style={[SharedStyles.rowBetween, { marginBottom: 8 }]}>
              <View style={[SharedStyles.row, { gap: 8 }]}>
                <Icon name={iconName} size={18} color={cfg.color} />
                <Text style={{ fontSize: 12, fontWeight: FontWeight.extrabold, color: cfg.color }}>{cfg.label}</Text>
              </View>
              <Badge label={stCfg.label} bg={stCfg.bg} fg={stCfg.fg} />
            </View>
            <View style={[SharedStyles.row, { gap: 6, marginBottom: 4 }]}>
              <Icon name={VCTIcons.time} size={14} color={Colors.textPrimary} />
              <Text style={{ fontSize: 13, fontWeight: FontWeight.bold, color: Colors.textPrimary }}>{session.time}</Text>
            </View>
            <View style={[SharedStyles.row, { gap: 6, marginBottom: 2 }]}>
              <Icon name={VCTIcons.location} size={14} color={Colors.textSecondary} />
              <Text style={{ fontSize: 11, color: Colors.textSecondary }}>{session.location}</Text>
            </View>
            <View style={[SharedStyles.row, { gap: 6, marginBottom: 2 }]}>
              <Icon name={VCTIcons.person} size={14} color={Colors.textSecondary} />
              <Text style={{ fontSize: 11, color: Colors.textSecondary }}>{session.coach}</Text>
            </View>
            <View style={[SharedStyles.row, { gap: 6, marginTop: 2 }]}>
              <Icon name={VCTIcons.calendar} size={12} color={Colors.textSecondary} />
              <Text style={{ fontSize: 10, color: Colors.textSecondary }}>{session.date}</Text>
            </View>
          </Pressable>
        )
      })}

      {/* Completed */}
      <Text style={SharedStyles.sectionTitle}>Buổi tập đã hoàn thành</Text>
      {sessions.filter(t => t.status === 'completed').map(session => {
        const cfg = SESSION_TYPE_CFG[session.type] ?? SESSION_TYPE_CFG['regular']!
        const stCfg = SESSION_STATUS_CFG[session.status] ?? SESSION_STATUS_CFG['completed']!
        const iconName = SESSION_ICONS[session.type] ?? VCTIcons.calendar
        return (
          <Pressable
            key={session.id}
            style={SharedStyles.card}
            accessibilityRole="button"
            onPress={() => { hapticLight(); router.push(`/training-detail?id=${session.id}`) }}
          >
            <View style={[SharedStyles.rowBetween, { marginBottom: 4 }]}>
              <View style={[SharedStyles.row, { gap: 8 }]}>
                <Icon name={iconName} size={16} color={cfg.color} />
                <Text style={{ fontSize: 12, fontWeight: FontWeight.bold, color: cfg.color }}>{cfg.label}</Text>
              </View>
              <Badge label={stCfg.label} bg={stCfg.bg} fg={stCfg.fg} />
            </View>
            <Text style={{ fontSize: 12, color: Colors.textPrimary, fontWeight: FontWeight.semibold }}>{session.time} · {session.date}</Text>
            <Text style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 2 }}>{session.location} · {session.coach}</Text>
          </Pressable>
        )
      })}

      {/* Type Breakdown — computed from sessions */}
      <Text style={SharedStyles.sectionTitle}>Phân loại buổi tập</Text>
      <View style={SharedStyles.card}>
        {typeBreakdown.map(({ type, count }) => {
          const cfg = SESSION_TYPE_CFG[type] ?? SESSION_TYPE_CFG['regular']!
          const pct = stats.total > 0 ? (count / stats.total) * 100 : 0
          const iconName = SESSION_ICONS[type] ?? VCTIcons.calendar
          return (
            <View key={type} style={[SharedStyles.row, { gap: 10, marginBottom: 10 }]} accessibilityLabel={`${cfg.label}: ${count} buổi`}>
              <Icon name={iconName} size={16} color={cfg.color} style={{ width: 20 }} />
              <Text style={{ fontSize: 11, fontWeight: FontWeight.bold, width: 64, color: cfg.color }}>{cfg.label}</Text>
              <View style={{ flex: 1, height: 8, backgroundColor: Colors.trackBg, borderRadius: 4, overflow: 'hidden' }}>
                <View style={{ height: '100%', borderRadius: 4, width: `${pct}%`, backgroundColor: cfg.color }} />
              </View>
              <Text style={{ fontSize: 12, fontWeight: FontWeight.extrabold, width: 24, textAlign: 'right', color: Colors.textPrimary }}>{count}</Text>
            </View>
          )
        })}
      </View>
    </ScrollView>
  )
}
