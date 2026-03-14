import * as React from 'react'
import { RefreshControl, ScrollView, Text, View, Animated } from 'react-native'
import { useRouter } from 'solito/navigation'
import { Colors, SharedStyles, FontWeight, Radius } from '../mobile-theme'
import { ScreenHeader, ScreenSkeleton, EmptyState } from '../mobile-ui'
import { Icon, VCTIcons } from '../icons'
import { useAthleteProfile, useAthleteRankings } from '../useAthleteData'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Athlete Rankings Screen (v3)
// API-driven rankings, sparkline Elo chart, no hardcoded data
// ═══════════════════════════════════════════════════════════════

/** Mini sparkline chart using View-based bars */
function EloSparkline({ history, color }: { history: number[]; color: string }) {
  if (history.length < 2) return null
  const min = Math.min(...history)
  const max = Math.max(...history)
  const range = max - min || 1
  const barWidth = Math.max(4, Math.floor(280 / history.length) - 2)

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 48, gap: 2, marginTop: 8 }}>
      {history.map((val, idx) => {
        const height = Math.max(4, ((val - min) / range) * 44)
        const isLast = idx === history.length - 1
        return (
          <View
            key={idx}
            style={{
              width: barWidth, height, borderRadius: 2,
              backgroundColor: isLast ? color : Colors.overlay(color, 0.4),
            }}
          />
        )
      })}
    </View>
  )
}

export function AthleteRankingsMobileScreen() {
  const router = useRouter()
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useAthleteProfile()
  const { data: rankData, isLoading: rankLoading, refetch: refetchRank } = useAthleteRankings()

  const isLoading = profileLoading || rankLoading
  const refetch = () => { refetchProfile(); refetchRank() }

  if (isLoading || !profile) return <ScreenSkeleton />

  const rankings = rankData?.rankings ?? []
  const eloHistory = rankData?.eloHistory ?? []

  return (
    <ScrollView
      style={SharedStyles.page}
      contentContainerStyle={SharedStyles.scrollContent}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.accent} />}
    >
      <ScreenHeader title="BXH & Chỉ số" subtitle="Xếp hạng và thành tích cá nhân" icon={VCTIcons.stats} onBack={() => router.back()} />

      {/* Elo Rating - BIG display with sparkline */}
      <View style={[SharedStyles.card, { borderColor: Colors.borderAccent, backgroundColor: Colors.overlay(Colors.accent, 0.04) }]}
        accessibilityLabel={`Điểm Elo: ${profile.elo}`}>
        <View style={[SharedStyles.rowBetween, { marginBottom: 4 }]}>
          <Text style={{ fontSize: 12, fontWeight: FontWeight.extrabold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Điểm Elo
          </Text>
          {eloHistory.length >= 2 && (
            <View style={[SharedStyles.row, { gap: 4 }]}>
              <Icon name={VCTIcons.trending} size={14} color={
                eloHistory[eloHistory.length - 1]! >= eloHistory[eloHistory.length - 2]! ? Colors.green : Colors.red
              } />
              <Text style={{ fontSize: 11, fontWeight: FontWeight.bold, color:
                eloHistory[eloHistory.length - 1]! >= eloHistory[eloHistory.length - 2]! ? Colors.green : Colors.red
              }}>
                {eloHistory[eloHistory.length - 1]! >= eloHistory[eloHistory.length - 2]!
                  ? `+${eloHistory[eloHistory.length - 1]! - eloHistory[eloHistory.length - 2]!}`
                  : `${eloHistory[eloHistory.length - 1]! - eloHistory[eloHistory.length - 2]!}`}
              </Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: 40, fontWeight: FontWeight.black, color: Colors.accent, marginBottom: 4 }}>
          {profile.elo}
        </Text>
        <EloSparkline history={eloHistory} color={Colors.accent} />
      </View>

      {/* Quick Stats */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
        <View style={[SharedStyles.statBox, { borderColor: Colors.overlay(Colors.gold, 0.2), backgroundColor: Colors.overlay(Colors.gold, 0.06) }]}
          accessibilityLabel={`${profile.medalCount} huy chương`}>
          <Icon name={VCTIcons.medal} size={18} color={Colors.gold} style={{ marginBottom: 4 }} />
          <Text style={[SharedStyles.statValue, { color: Colors.gold, fontSize: 26 }]}>{profile.medalCount}</Text>
          <Text style={[SharedStyles.statLabel, { color: Colors.gold }]}>Huy chương</Text>
        </View>
        <View style={[SharedStyles.statBox, { borderColor: Colors.overlay(Colors.green, 0.2), backgroundColor: Colors.overlay(Colors.green, 0.06) }]}
          accessibilityLabel={`${profile.tournamentCount} giải đấu`}>
          <Icon name={VCTIcons.trophy} size={18} color={Colors.green} style={{ marginBottom: 4 }} />
          <Text style={[SharedStyles.statValue, { color: Colors.green, fontSize: 26 }]}>{profile.tournamentCount}</Text>
          <Text style={[SharedStyles.statLabel, { color: Colors.green }]}>Giải đấu</Text>
        </View>
        <View style={[SharedStyles.statBox, { borderColor: Colors.overlay(Colors.purple, 0.2), backgroundColor: Colors.overlay(Colors.purple, 0.06) }]}
          accessibilityLabel={`Tỷ lệ tập ${profile.attendanceRate}%`}>
          <Icon name={VCTIcons.flame} size={18} color={Colors.purple} style={{ marginBottom: 4 }} />
          <Text style={[SharedStyles.statValue, { color: Colors.purple, fontSize: 26 }]}>{profile.attendanceRate}%</Text>
          <Text style={[SharedStyles.statLabel, { color: Colors.purple }]}>Chuyên cần</Text>
        </View>
      </View>

      {/* Rankings Snapshot — from API hook */}
      <Text style={SharedStyles.sectionTitle}>Vị trí xếp hạng</Text>
      {rankings.length > 0 ? (
        <View style={SharedStyles.card}>
          {rankings.map((r, idx) => (
            <View key={idx} style={[SharedStyles.rowBetween, {
              paddingVertical: 10,
              borderBottomWidth: idx < rankings.length - 1 ? 1 : 0,
              borderBottomColor: Colors.border,
            }]} accessibilityLabel={`${r.label}: ${r.rank}, xu hướng ${r.trend}`}>
              <Text style={{ fontSize: 12, fontWeight: FontWeight.semibold, color: Colors.textPrimary, flex: 1 }}>{r.label}</Text>
              <View style={[SharedStyles.row, { gap: 8 }]}>
                <Text style={{ fontSize: 16, fontWeight: FontWeight.black, color: Colors.accent }}>{r.rank}</Text>
                <View style={[SharedStyles.row, { gap: 2 }]}>
                  {r.trend.includes('↑') ? (
                    <Icon name={VCTIcons.trending} size={14} color={Colors.green} />
                  ) : r.trend.includes('↓') ? (
                    <Icon name={VCTIcons.trending} size={14} color={Colors.red} />
                  ) : (
                    <Icon name="remove-outline" size={14} color={Colors.textSecondary} />
                  )}
                  <Text style={{ fontSize: 11, fontWeight: FontWeight.bold, color: r.trend.includes('↑') ? Colors.green : r.trend.includes('↓') ? Colors.red : Colors.textSecondary }}>{r.trend}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <EmptyState
          icon={VCTIcons.stats}
          title="Chưa có xếp hạng"
          message="Dữ liệu xếp hạng sẽ xuất hiện sau khi bạn tham gia giải đấu."
        />
      )}
    </ScrollView>
  )
}
