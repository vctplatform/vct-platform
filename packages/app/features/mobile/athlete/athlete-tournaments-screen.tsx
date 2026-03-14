import * as React from 'react'
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'solito/navigation'
import { Colors, SharedStyles, FontWeight, Radius, Space, Touch } from '../mobile-theme'
import { Badge, ScreenHeader, ScreenSkeleton } from '../mobile-ui'
import { Icon, VCTIcons } from '../icons'
import { hapticLight, hapticMedium } from '../haptics'
import { useAthleteTournaments } from '../useAthleteData'
import { TOURNAMENT_STATUS_CFG } from '../mock-data'
import { TournamentRegisterModal } from './tournament-register-modal'
import { DocumentUploadModal } from './document-upload-modal'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Athlete Tournaments Screen (v3)
// SVG icons, FAB, tap-to-detail, document upload integration
// ═══════════════════════════════════════════════════════════════

const DOC_ICONS: Record<string, React.ComponentProps<typeof Icon>['name']> = {
  kham_sk: VCTIcons.shield,
  bao_hiem: VCTIcons.document,
  cmnd: VCTIcons.document,
  anh: VCTIcons.camera,
}

const DOC_LABELS: Record<string, string> = {
  kham_sk: 'Sức khỏe',
  bao_hiem: 'Bảo hiểm',
  cmnd: 'CCCD',
  anh: 'Ảnh thẻ',
}

export function AthleteTournamentsMobileScreen() {
  const router = useRouter()
  const { data: entries, isLoading, refetch } = useAthleteTournaments()
  const [registerVisible, setRegisterVisible] = React.useState(false)
  const [uploadTarget, setUploadTarget] = React.useState<{ id: string; docs: { kham_sk: boolean; bao_hiem: boolean; cmnd: boolean; anh: boolean } } | null>(null)

  if (isLoading || !entries) return <ScreenSkeleton />

  const summary = {
    total: entries.length,
    valid: entries.filter(e => e.status === 'ok').length,
    missing: entries.filter(e => e.status === 'missing').length,
    rejected: entries.filter(e => e.status === 'rejected').length,
  }

  return (
    <>
      <ScrollView
        style={SharedStyles.page}
        contentContainerStyle={[SharedStyles.scrollContent, { paddingBottom: 100 }]}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.accent} />}
      >
        <ScreenHeader title="Giải đấu" subtitle="Theo dõi thi đấu và hồ sơ" icon={VCTIcons.trophy} onBack={() => router.back()} />

        {/* Stats */}
        <View style={SharedStyles.statsRow}>
          <View style={SharedStyles.statBox} accessibilityLabel={`${summary.total} tổng giải`}>
            <Icon name={VCTIcons.trophy} size={16} color={Colors.accent} style={{ marginBottom: 4 }} />
            <Text style={SharedStyles.statValue}>{summary.total}</Text>
            <Text style={SharedStyles.statLabel}>Tổng giải</Text>
          </View>
          <View style={SharedStyles.statBox} accessibilityLabel={`${summary.valid} hợp lệ`}>
            <Icon name={VCTIcons.checkmark} size={16} color={Colors.green} style={{ marginBottom: 4 }} />
            <Text style={[SharedStyles.statValue, { color: Colors.green }]}>{summary.valid}</Text>
            <Text style={SharedStyles.statLabel}>Hợp lệ</Text>
          </View>
          <View style={SharedStyles.statBox} accessibilityLabel={`${summary.missing} thiếu hồ sơ`}>
            <Icon name={VCTIcons.warning} size={16} color={Colors.gold} style={{ marginBottom: 4 }} />
            <Text style={[SharedStyles.statValue, { color: Colors.gold }]}>{summary.missing}</Text>
            <Text style={SharedStyles.statLabel}>Thiếu HS</Text>
          </View>
          <View style={SharedStyles.statBox} accessibilityLabel={`${summary.rejected} từ chối`}>
            <Icon name={VCTIcons.alert} size={16} color={Colors.red} style={{ marginBottom: 4 }} />
            <Text style={[SharedStyles.statValue, { color: Colors.red }]}>{summary.rejected}</Text>
            <Text style={SharedStyles.statLabel}>Từ chối</Text>
          </View>
        </View>

        {/* Document progress for first entry */}
        <Text style={SharedStyles.sectionTitle}>Tiến độ hồ sơ</Text>
        <View style={SharedStyles.card}>
          {entries.slice(0, 1).map(e => (
            <View key={e.id}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                {Object.entries(e.docs).map(([key, done]) => (
                  <View key={key} style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.pill,
                    backgroundColor: done ? Colors.statusOkBg : Colors.statusWarnBg,
                  }} accessibilityLabel={`${DOC_LABELS[key] ?? key}: ${done ? 'hoàn thành' : 'chưa nộp'}`}>
                    <Icon
                      name={done ? VCTIcons.checkmarkOutline : VCTIcons.warning}
                      size={12}
                      color={done ? Colors.statusOkFg : Colors.statusWarnFg}
                    />
                    <Text style={{ fontSize: 10, fontWeight: FontWeight.bold, color: done ? Colors.statusOkFg : Colors.statusWarnFg }}>
                      {DOC_LABELS[key] ?? key}
                    </Text>
                  </View>
                ))}
              </View>
              {/* Upload CTA */}
              {Object.values(e.docs).some(d => !d) && (
                <Pressable
                  onPress={() => { hapticLight(); setUploadTarget({ id: e.id, docs: e.docs }) }}
                  accessibilityRole="button"
                  accessibilityLabel="Bổ sung hồ sơ"
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                    borderRadius: Radius.sm, paddingVertical: 8,
                    backgroundColor: Colors.overlay(Colors.accent, 0.06),
                  }}
                >
                  <Icon name={VCTIcons.cloudUpload} size={14} color={Colors.accent} />
                  <Text style={{ fontSize: 11, fontWeight: FontWeight.extrabold, color: Colors.accent }}>Bổ sung hồ sơ</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>

        {/* Tournament entries — tappable */}
        <Text style={SharedStyles.sectionTitle}>Danh sách giải đấu</Text>
        {entries.map(e => {
          const stCfg = TOURNAMENT_STATUS_CFG[e.status] ?? TOURNAMENT_STATUS_CFG['pending']!
          return (
            <Pressable
              key={e.id}
              style={SharedStyles.card}
              accessibilityLabel={`${e.name}: ${stCfg.label}`}
              accessibilityRole="button"
              onPress={() => { hapticLight(); router.push(`/tournament-detail?id=${e.id}`) }}
            >
              <View style={[SharedStyles.rowBetween, { marginBottom: 6 }]}>
                <Text style={{ fontSize: 14, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, flex: 1 }}>
                  {e.name}
                </Text>
                <Badge label={stCfg.label} bg={stCfg.bg} fg={stCfg.fg} />
              </View>
              <View style={[SharedStyles.row, { gap: 6, marginBottom: 2 }]}>
                <Icon name={VCTIcons.calendar} size={12} color={Colors.textSecondary} />
                <Text style={{ fontSize: 11, color: Colors.textSecondary }}>{e.date}</Text>
              </View>
              <View style={[SharedStyles.row, { gap: 6 }]}>
                <Icon name={VCTIcons.fitness} size={12} color={Colors.textSecondary} />
                <Text style={{ fontSize: 11, color: Colors.textSecondary }}>{e.categories.join(', ')} · {e.doan}</Text>
              </View>
              <View style={[SharedStyles.row, { gap: 4, marginTop: 6 }]}>
                <Icon name={VCTIcons.forward} size={12} color={Colors.textMuted} />
                <Text style={{ fontSize: 10, color: Colors.textMuted }}>Nhấn để xem chi tiết</Text>
              </View>
            </Pressable>
          )
        })}
      </ScrollView>

      {/* FAB with label */}
      <Pressable
        onPress={() => { hapticMedium(); setRegisterVisible(true) }}
        accessibilityRole="button"
        accessibilityLabel="Đăng ký giải đấu mới"
        style={{
          position: 'absolute', bottom: 24, right: 20,
          flexDirection: 'row', alignItems: 'center', gap: 8,
          paddingHorizontal: 20, paddingVertical: 0,
          height: 52, borderRadius: 26,
          backgroundColor: Colors.accent,
          shadowColor: Colors.accent, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
        }}
      >
        <Icon name={VCTIcons.add} size={22} color="#fff" />
        <Text style={{ fontSize: 13, fontWeight: FontWeight.extrabold, color: '#fff' }}>Đăng ký</Text>
      </Pressable>

      <TournamentRegisterModal
        visible={registerVisible}
        onClose={() => setRegisterVisible(false)}
        onSuccess={() => { setRegisterVisible(false); refetch() }}
      />

      {uploadTarget && (
        <DocumentUploadModal
          visible={!!uploadTarget}
          onClose={() => setUploadTarget(null)}
          onSuccess={() => { setUploadTarget(null); refetch() }}
          tournamentEntryId={uploadTarget.id}
          currentDocs={uploadTarget.docs}
        />
      )}
    </>
  )
}
