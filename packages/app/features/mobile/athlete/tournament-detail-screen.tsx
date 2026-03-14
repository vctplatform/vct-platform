import * as React from 'react'
import { RefreshControl, ScrollView, Text, View } from 'react-native'
import { useRouter, useSearchParams } from 'solito/navigation'
import { Colors, SharedStyles, FontWeight, Radius, Space } from '../mobile-theme'
import { Badge, ScreenHeader, ScreenSkeleton, EmptyState } from '../mobile-ui'
import { Icon, VCTIcons } from '../icons'
import { useAthleteTournaments } from '../useAthleteData'
import { TOURNAMENT_STATUS_CFG } from '../mock-data'
import { DocumentUploadModal } from './document-upload-modal'
import { hapticLight } from '../haptics'
import { Pressable } from 'react-native'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Tournament Detail Screen
// Full tournament info: details, categories, document checklist,
// bracket placeholder, match schedule
// ═══════════════════════════════════════════════════════════════

const DOC_LABELS: Record<string, string> = {
  kham_sk: 'Giấy khám SK',
  bao_hiem: 'Bảo hiểm',
  cmnd: 'CCCD',
  anh: 'Ảnh thẻ 3×4',
}

export function TournamentDetailMobileScreen() {
  const router = useRouter()
  const params = useSearchParams()
  const id = params?.get?.('id') ?? ''
  const { data: entries, isLoading, refetch } = useAthleteTournaments()
  const [uploadVisible, setUploadVisible] = React.useState(false)

  if (isLoading || !entries) return <ScreenSkeleton />

  const tournament = entries.find(e => e.id === id)
  if (!tournament) {
    return (
      <View style={[SharedStyles.page, SharedStyles.scrollContent]}>
        <ScreenHeader title="Chi tiết giải đấu" subtitle="" icon={VCTIcons.trophy} onBack={() => router.back()} />
        <EmptyState icon={VCTIcons.trophy} title="Không tìm thấy" message="Giải đấu không tồn tại hoặc đã bị xóa." />
      </View>
    )
  }

  const stCfg = TOURNAMENT_STATUS_CFG[tournament.status] ?? TOURNAMENT_STATUS_CFG['pending']!
  const docEntries = Object.entries(tournament.docs) as [string, boolean][]
  const docsComplete = docEntries.filter(([, v]) => v).length
  const docsTotal = docEntries.length

  return (
    <>
      <ScrollView
        style={SharedStyles.page}
        contentContainerStyle={SharedStyles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.accent} />}
      >
        <ScreenHeader title={tournament.name} subtitle="Chi tiết giải đấu" icon={VCTIcons.trophy} onBack={() => router.back()} />

        {/* Status & Date */}
        <View style={[SharedStyles.card, { borderColor: Colors.overlay(stCfg.fg, 0.2) }]}>
          <View style={[SharedStyles.rowBetween, { marginBottom: 10 }]}>
            <Badge label={stCfg.label} bg={stCfg.bg} fg={stCfg.fg} />
            <View style={[SharedStyles.row, { gap: 6 }]}>
              <Icon name={VCTIcons.calendar} size={14} color={Colors.textSecondary} />
              <Text style={{ fontSize: 13, fontWeight: FontWeight.bold, color: Colors.textPrimary }}>{tournament.date}</Text>
            </View>
          </View>
          {tournament.doan && (
            <View style={[SharedStyles.row, { gap: 6, marginBottom: 4 }]}>
              <Icon name={VCTIcons.location} size={14} color={Colors.textSecondary} />
              <Text style={{ fontSize: 12, color: Colors.textSecondary }}>{tournament.doan}</Text>
            </View>
          )}
        </View>

        {/* Categories */}
        <Text style={SharedStyles.sectionTitle}>Nội dung thi đấu</Text>
        <View style={SharedStyles.card}>
          {tournament.categories.map((cat, idx) => (
            <View key={idx} style={[SharedStyles.row, {
              gap: 10, paddingVertical: 10,
              borderBottomWidth: idx < tournament.categories.length - 1 ? 1 : 0,
              borderBottomColor: Colors.border,
            }]}>
              <Icon name={VCTIcons.fitness} size={16} color={Colors.accent} />
              <Text style={{ fontSize: 13, fontWeight: FontWeight.bold, color: Colors.textPrimary }}>{cat}</Text>
            </View>
          ))}
        </View>

        {/* Document Checklist */}
        <Text style={SharedStyles.sectionTitle}>Hồ sơ thi đấu ({docsComplete}/{docsTotal})</Text>
        <View style={SharedStyles.card}>
          {/* Progress bar */}
          <View style={{ marginBottom: 14 }}>
            <View style={{ height: 6, backgroundColor: Colors.trackBg, borderRadius: 3, overflow: 'hidden' }}>
              <View style={{ height: '100%', borderRadius: 3, width: `${(docsComplete / docsTotal) * 100}%`,
                backgroundColor: docsComplete === docsTotal ? Colors.green : Colors.gold,
              }} />
            </View>
          </View>

          {docEntries.map(([key, done], idx) => (
            <View key={key} style={[SharedStyles.rowBetween, {
              paddingVertical: 10,
              borderBottomWidth: idx < docEntries.length - 1 ? 1 : 0,
              borderBottomColor: Colors.border,
            }]} accessibilityLabel={`${DOC_LABELS[key]}: ${done ? 'đã nộp' : 'chưa nộp'}`}>
              <View style={[SharedStyles.row, { gap: 10 }]}>
                <Icon
                  name={done ? VCTIcons.checkmarkOutline : VCTIcons.warning}
                  size={16}
                  color={done ? Colors.green : Colors.gold}
                />
                <Text style={{ fontSize: 13, fontWeight: FontWeight.semibold, color: Colors.textPrimary }}>
                  {DOC_LABELS[key] ?? key}
                </Text>
              </View>
              <Text style={{ fontSize: 11, fontWeight: FontWeight.bold, color: done ? Colors.green : Colors.gold }}>
                {done ? 'Đã nộp' : 'Chưa nộp'}
              </Text>
            </View>
          ))}

          {/* Upload button */}
          {docsComplete < docsTotal && (
            <Pressable
              onPress={() => { hapticLight(); setUploadVisible(true) }}
              accessibilityRole="button"
              accessibilityLabel="Bổ sung hồ sơ"
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                borderRadius: Radius.md, padding: 12, marginTop: 12,
                backgroundColor: Colors.overlay(Colors.accent, 0.08),
                borderWidth: 1, borderColor: Colors.overlay(Colors.accent, 0.15),
              }}
            >
              <Icon name={VCTIcons.cloudUpload} size={16} color={Colors.accent} />
              <Text style={{ fontSize: 13, fontWeight: FontWeight.extrabold, color: Colors.accent }}>Bổ sung hồ sơ</Text>
            </Pressable>
          )}
        </View>

        {/* Bracket placeholder */}
        <Text style={SharedStyles.sectionTitle}>Bảng đấu</Text>
        <EmptyState
          icon={VCTIcons.grid}
          title="Bảng đấu"
          message="Bảng đấu sẽ được hiển thị khi BTC công bố lịch thi đấu."
        />

        {/* Match schedule placeholder */}
        <Text style={SharedStyles.sectionTitle}>Lịch thi đấu</Text>
        <EmptyState
          icon={VCTIcons.calendar}
          title="Lịch thi đấu"
          message="Lịch thi đấu chi tiết sẽ xuất hiện sau khi phân cặp hoàn tất."
        />
      </ScrollView>

      <DocumentUploadModal
        visible={uploadVisible}
        onClose={() => setUploadVisible(false)}
        onSuccess={() => { setUploadVisible(false); refetch() }}
        tournamentEntryId={tournament.id}
        currentDocs={tournament.docs}
      />
    </>
  )
}
