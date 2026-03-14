import * as React from 'react'
import { RefreshControl, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'solito/navigation'
import { Colors, SharedStyles, FontWeight, Radius, Space } from '../mobile-theme'
import { Badge, ScreenHeader, ScreenSkeleton, EmptyState } from '../mobile-ui'
import { Icon, VCTIcons } from '../icons'
import { useAthleteResults } from '../useAthleteData'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Athlete Results Screen (v3)
// Uses useAthleteResults() hook with API + mock fallback
// Medal breakdown, Elo, and competition history from real data
// ═══════════════════════════════════════════════════════════════

const MEDAL_CFG = [
  { key: 'gold', label: 'Vàng', color: '#f59e0b', icon: VCTIcons.medal },
  { key: 'silver', label: 'Bạc', color: '#94a3b8', icon: VCTIcons.medal },
  { key: 'bronze', label: 'Đồng', color: '#d97706', icon: VCTIcons.medal },
] as const

export function AthleteResultsMobileScreen() {
  const router = useRouter()
  const { data, isLoading, refetch } = useAthleteResults()

  if (isLoading || !data) return <ScreenSkeleton />

  const { results, medals, eloRating, totalTournaments } = data

  return (
    <ScrollView
      style={SharedStyles.page}
      contentContainerStyle={SharedStyles.scrollContent}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.accent} />}
    >
      <ScreenHeader title="Thành tích" subtitle="Huy chương và lịch sử thi đấu" icon={VCTIcons.trophy} onBack={() => router.back()} />

      {/* Medal Breakdown */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: Space.lg }}>
        {MEDAL_CFG.map(m => {
          const count = medals[m.key as keyof typeof medals] ?? 0
          return (
            <View key={m.key} style={[SharedStyles.statBox, { borderColor: Colors.overlay(m.color, 0.2), backgroundColor: Colors.overlay(m.color, 0.06) }]}
              accessibilityLabel={`${count} huy chương ${m.label}`}>
              <Icon name={m.icon} size={18} color={m.color} style={{ marginBottom: 4 }} />
              <Text style={[SharedStyles.statValue, { color: m.color, fontSize: 28 }]}>{count}</Text>
              <Text style={[SharedStyles.statLabel, { color: m.color }]}>{m.label}</Text>
            </View>
          )
        })}
      </View>

      {/* Elo & Tournaments */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: Space.lg }}>
        <View style={SharedStyles.statBox} accessibilityLabel={`Elo: ${eloRating}`}>
          <Icon name={VCTIcons.stats} size={16} color={Colors.accent} style={{ marginBottom: 4 }} />
          <Text style={[SharedStyles.statValue, { color: Colors.accent }]}>{eloRating}</Text>
          <Text style={SharedStyles.statLabel}>Elo</Text>
        </View>
        <View style={SharedStyles.statBox} accessibilityLabel={`${totalTournaments} giải đấu`}>
          <Icon name={VCTIcons.trophy} size={16} color={Colors.green} style={{ marginBottom: 4 }} />
          <Text style={[SharedStyles.statValue, { color: Colors.green }]}>{totalTournaments}</Text>
          <Text style={SharedStyles.statLabel}>Giải đấu</Text>
        </View>
        <View style={SharedStyles.statBox} accessibilityLabel={`${medals.total} tổng huy chương`}>
          <Icon name={VCTIcons.medal} size={16} color={Colors.gold} style={{ marginBottom: 4 }} />
          <Text style={[SharedStyles.statValue, { color: Colors.gold }]}>{medals.total}</Text>
          <Text style={SharedStyles.statLabel}>Tổng HC</Text>
        </View>
      </View>

      {/* Competition History */}
      <Text style={SharedStyles.sectionTitle}>Lịch sử thi đấu</Text>
      {results.length > 0 ? results.map(r => (
        <View key={r.id} style={SharedStyles.card}>
          <View style={[SharedStyles.rowBetween, { marginBottom: 6 }]}>
            <Text style={{ fontSize: 14, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, flex: 1 }}>{r.name}</Text>
            {r.medal && (
              <Badge
                label={r.result}
                bg={r.medal === '🥇' ? Colors.overlay('#f59e0b', 0.12) : r.medal === '🥈' ? Colors.overlay('#94a3b8', 0.12) : Colors.overlay('#d97706', 0.12)}
                fg={r.medal === '🥇' ? '#f59e0b' : r.medal === '🥈' ? '#94a3b8' : '#d97706'}
              />
            )}
          </View>
          <View style={[SharedStyles.row, { gap: 8, marginBottom: 2 }]}>
            <Icon name={VCTIcons.fitness} size={12} color={Colors.textSecondary} />
            <Text style={{ fontSize: 11, color: Colors.textSecondary }}>{r.category}</Text>
          </View>
          <View style={[SharedStyles.row, { gap: 8 }]}>
            <Icon name={VCTIcons.calendar} size={12} color={Colors.textSecondary} />
            <Text style={{ fontSize: 11, color: Colors.textSecondary }}>{r.date}</Text>
            {r.result && !r.medal && (
              <>
                <Text style={{ fontSize: 11, color: Colors.textSecondary }}> · </Text>
                <Text style={{ fontSize: 11, fontWeight: FontWeight.bold, color: Colors.textSecondary }}>{r.result}</Text>
              </>
            )}
          </View>
        </View>
      )) : (
        <EmptyState
          icon={VCTIcons.trophy}
          title="Chưa có thành tích"
          message="Thành tích sẽ xuất hiện sau khi bạn tham gia giải đấu."
        />
      )}
    </ScrollView>
  )
}
