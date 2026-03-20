// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Tournament Detail Screen
// Full tournament information: header, schedule, brackets,
// categories, registration, and organizer info.
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
  Share,
  Dimensions,
} from 'react-native'
import { useVCTTheme } from './theme-provider'
import { VctButton, VctCard, VctBadge } from './core-ui'
import { useQuery } from './data-hooks'
import { triggerHaptic } from './haptic-feedback'
import { SkeletonLoader } from './skeleton-loader'
import { ErrorState } from './error-states'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// ── Types ────────────────────────────────────────────────────

interface TournamentDetailProps {
  tournamentId: string
  onNavigateBracket?: (categoryId: string) => void
  onNavigateRegistration?: () => void
  onGoBack?: () => void
}

interface TournamentDetail {
  id: string
  name: string
  description: string
  date: string
  endDate: string
  location: string
  address: string
  status: 'upcoming' | 'registration_open' | 'ongoing' | 'completed'
  participantCount: number
  maxParticipants: number
  organizer: { name: string; logo?: string; contact: string }
  categories: { id: string; name: string; weightClass: string; athleteCount: number }[]
  schedule: { time: string; event: string }[]
  rules: string[]
  registrationDeadline: string
}

// ── Component ────────────────────────────────────────────────

export function ScreenTournamentDetail({
  tournamentId,
  onNavigateBracket,
  onNavigateRegistration,
  onGoBack,
}: TournamentDetailProps) {
  const { theme } = useVCTTheme()

  const { data: tournament, isLoading, error, refetch } = useQuery<TournamentDetail>(
    `/api/v1/tournaments/${tournamentId}`,
    { cacheKey: `tournament-${tournamentId}`, staleTime: 60_000 }
  )

  const fadeAnim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start()
  }, [])

  const canRegister = tournament?.status === 'registration_open'

  // Share
  const handleShare = useCallback(async () => {
    triggerHaptic('light')
    try {
      await Share.share({
        message: `🏆 ${tournament?.name}\n📅 ${tournament?.date}\n📍 ${tournament?.location}\n\nXem chi tiết trên VCT Platform!`,
      })
    } catch {}
  }, [tournament])

  // ── Loading / Error ──────────────────────────────────────

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.skeletonContent}>
          <SkeletonLoader width={SCREEN_WIDTH - 48} height={200} borderRadius={20} />
          <SkeletonLoader width={SCREEN_WIDTH - 48} height={120} borderRadius={14} />
          <SkeletonLoader width={SCREEN_WIDTH - 48} height={160} borderRadius={14} />
        </View>
      </View>
    )
  }

  if (error || !tournament) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ErrorState title="Không thể tải giải đấu" message="Vui lòng thử lại." onRetry={refetch} />
      </View>
    )
  }

  // ── Render ───────────────────────────────────────────────

  return (
    <Animated.View style={[styles.container, { backgroundColor: theme.colors.background, opacity: fadeAnim }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Back + Share Header */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onGoBack} style={[styles.backBtn, { backgroundColor: theme.colors.surface }]}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={[styles.shareBtn, { backgroundColor: theme.colors.surface }]}>
            <Text style={styles.shareIcon}>📤</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <View style={[styles.heroSection, { backgroundColor: theme.colors.surface }]}>
          <Text style={styles.heroEmoji}>🏆</Text>
          <Text style={[styles.heroTitle, { color: theme.colors.text }]}>{tournament.name}</Text>
          <VctBadge
            label={tournament.status === 'registration_open' ? 'Đăng ký mở' : tournament.status === 'ongoing' ? 'Đang diễn ra' : tournament.status === 'completed' ? 'Đã kết thúc' : 'Sắp tới'}
            variant={tournament.status === 'registration_open' ? 'success' : tournament.status === 'ongoing' ? 'warning' : 'info'}
          />
        </View>

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          <InfoItem theme={theme} emoji="📅" label="Ngày thi" value={`${tournament.date} — ${tournament.endDate}`} />
          <InfoItem theme={theme} emoji="📍" label="Địa điểm" value={`${tournament.location}\n${tournament.address}`} />
          <InfoItem theme={theme} emoji="👥" label="VĐV" value={`${tournament.participantCount}/${tournament.maxParticipants}`} />
          <InfoItem theme={theme} emoji="🏛️" label="Đơn vị tổ chức" value={tournament.organizer.name} />
        </View>

        {/* Description */}
        {tournament.description && (
          <VctCard style={styles.descriptionCard}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Giới thiệu</Text>
            <Text style={[styles.descriptionText, { color: theme.colors.textSecondary }]}>
              {tournament.description}
            </Text>
          </VctCard>
        )}

        {/* Categories */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Nội dung thi đấu</Text>
          {tournament.categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => { triggerHaptic('light'); onNavigateBracket?.(cat.id) }}
              activeOpacity={0.7}
            >
              <VctCard style={styles.categoryCard}>
                <View style={styles.catRow}>
                  <View>
                    <Text style={[styles.catName, { color: theme.colors.text }]}>{cat.name}</Text>
                    <Text style={[styles.catMeta, { color: theme.colors.textSecondary }]}>
                      ⚖️ {cat.weightClass} • 👥 {cat.athleteCount} VĐV
                    </Text>
                  </View>
                  <Text style={[styles.arrow, { color: theme.colors.textSecondary }]}>→</Text>
                </View>
              </VctCard>
            </TouchableOpacity>
          ))}
        </View>

        {/* Schedule */}
        {tournament.schedule.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Lịch thi đấu</Text>
            <VctCard>
              {tournament.schedule.map((item, i) => (
                <View key={i} style={[styles.scheduleItem, i > 0 && { borderTopColor: theme.colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
                  <Text style={[styles.scheduleTime, { color: theme.colors.primary }]}>{item.time}</Text>
                  <Text style={[styles.scheduleEvent, { color: theme.colors.text }]}>{item.event}</Text>
                </View>
              ))}
            </VctCard>
          </View>
        )}

        {/* Registration Button */}
        {canRegister && (
          <View style={styles.registerSection}>
            <Text style={[styles.deadlineText, { color: theme.colors.textSecondary }]}>
              ⏰ Hạn đăng ký: {tournament.registrationDeadline}
            </Text>
            <VctButton
              title="Đăng ký tham gia"
              onPress={() => { triggerHaptic('medium'); onNavigateRegistration?.() }}
              variant="primary"
              size="large"
            />
          </View>
        )}
      </ScrollView>
    </Animated.View>
  )
}

// ── Sub-components ───────────────────────────────────────────

function InfoItem({ theme, emoji, label, value }: { theme: any; emoji: string; label: string; value: string }) {
  return (
    <View style={[styles.infoItem, { backgroundColor: theme.colors.surface }]}>
      <Text style={styles.infoEmoji}>{emoji}</Text>
      <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: theme.colors.text }]}>{value}</Text>
    </View>
  )
}

// ── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  skeletonContent: { padding: 24, gap: 16, paddingTop: 80 },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 40, position: 'absolute', zIndex: 10, width: '100%',
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20 },
  shareBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  shareIcon: { fontSize: 18 },
  heroSection: {
    alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 100 : 90, paddingBottom: 24,
    paddingHorizontal: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  heroEmoji: { fontSize: 48, marginBottom: 12 },
  heroTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 10, lineHeight: 28 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, marginTop: 16, gap: 10 },
  infoItem: {
    width: (SCREEN_WIDTH - 48 - 10) / 2, padding: 14, borderRadius: 14,
  },
  infoEmoji: { fontSize: 20, marginBottom: 4 },
  infoLabel: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
  infoValue: { fontSize: 13, fontWeight: '700', lineHeight: 18 },
  descriptionCard: { marginHorizontal: 24, marginTop: 16, padding: 16 },
  descriptionText: { fontSize: 14, lineHeight: 22, marginTop: 8 },
  section: { paddingHorizontal: 24, marginTop: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 10 },
  categoryCard: { marginBottom: 8, padding: 14 },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catName: { fontSize: 15, fontWeight: '700' },
  catMeta: { fontSize: 12, marginTop: 2 },
  arrow: { fontSize: 18 },
  scheduleItem: { flexDirection: 'row', padding: 12, gap: 12 },
  scheduleTime: { fontSize: 13, fontWeight: '700', width: 50 },
  scheduleEvent: { fontSize: 13, flex: 1 },
  registerSection: { paddingHorizontal: 24, marginTop: 28 },
  deadlineText: { fontSize: 13, textAlign: 'center', marginBottom: 12 },
})
