// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Tournament List Screen
// Filterable, searchable list of tournaments with pull-to-refresh,
// status filter tabs, and progressive loading.
// ═══════════════════════════════════════════════════════════════

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Animated,
  Platform,
  Dimensions,
} from 'react-native'
import { useVCTTheme } from './theme-provider'
import { VctCard, VctBadge } from './core-ui'
import { useQuery } from './data-hooks'
import { triggerHaptic } from './haptic-feedback'
import { useDebounce } from './utility-hooks'
import { SkeletonLoader } from './skeleton-loader'
import { EmptyState } from './error-states'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// ── Types ────────────────────────────────────────────────────

type TournamentStatus = 'all' | 'upcoming' | 'ongoing' | 'completed'

interface Tournament {
  id: string
  name: string
  date: string
  endDate: string
  location: string
  status: 'upcoming' | 'registration_open' | 'ongoing' | 'completed'
  participantCount: number
  maxParticipants: number
  organizer: string
  categories: string[]
}

interface TournamentListScreenProps {
  initialStatus?: TournamentStatus
  onNavigateDetail?: (id: string) => void
}

// ── Filter Tabs ──────────────────────────────────────────────

const STATUS_TABS: { key: TournamentStatus; label: string; emoji: string }[] = [
  { key: 'all', label: 'Tất cả', emoji: '📋' },
  { key: 'upcoming', label: 'Sắp tới', emoji: '📅' },
  { key: 'ongoing', label: 'Đang diễn ra', emoji: '🔴' },
  { key: 'completed', label: 'Đã kết thúc', emoji: '✅' },
]

// ── Component ────────────────────────────────────────────────

export function ScreenTournamentList({
  initialStatus = 'all',
  onNavigateDetail,
}: TournamentListScreenProps) {
  const { theme } = useVCTTheme()

  const [activeTab, setActiveTab] = useState<TournamentStatus>(initialStatus)
  const [searchText, setSearchText] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const debouncedSearch = useDebounce(searchText, 300)

  // Build query URL
  const queryUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (activeTab !== 'all') params.append('status', activeTab)
    if (debouncedSearch) params.append('q', debouncedSearch)
    params.append('limit', '20')
    return `/api/v1/tournaments?${params.toString()}`
  }, [activeTab, debouncedSearch])

  const {
    data: tournaments,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<Tournament[]>(queryUrl, {
    cacheKey: `tournament-list-${activeTab}-${debouncedSearch}`,
    staleTime: 30_000,
  })

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start()
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    triggerHaptic('light')
    await refetch()
    setRefreshing(false)
  }, [refetch])

  const handleTabChange = useCallback((tab: TournamentStatus) => {
    triggerHaptic('selection')
    setActiveTab(tab)
  }, [])

  // ── Status Badge Color ───────────────────────────────────

  const getStatusBadge = (status: Tournament['status']) => {
    switch (status) {
      case 'registration_open': return { label: 'Đang mở ĐK', variant: 'success' as const }
      case 'upcoming': return { label: 'Sắp diễn ra', variant: 'info' as const }
      case 'ongoing': return { label: 'Đang thi đấu', variant: 'warning' as const }
      case 'completed': return { label: 'Đã kết thúc', variant: 'default' as const }
    }
  }

  // ── Render Item ──────────────────────────────────────────

  const renderTournament = useCallback(
    ({ item }: { item: Tournament }) => {
      const badge = getStatusBadge(item.status)
      return (
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light')
            onNavigateDetail?.(item.id)
          }}
          activeOpacity={0.7}
          style={styles.cardWrapper}
        >
          <VctCard style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.cardInfo}>
                <Text style={[styles.tournamentName, { color: theme.colors.text }]} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={[styles.organizer, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                  🏛️ {item.organizer}
                </Text>
              </View>
              <VctBadge label={badge.label} variant={badge.variant} />
            </View>

            <View style={[styles.cardDivider, { backgroundColor: theme.colors.border }]} />

            <View style={styles.cardBottom}>
              <View style={styles.metaItem}>
                <Text style={styles.metaEmoji}>📅</Text>
                <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                  {item.date}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaEmoji}>📍</Text>
                <Text style={[styles.metaText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                  {item.location}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaEmoji}>👥</Text>
                <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                  {item.participantCount}/{item.maxParticipants}
                </Text>
              </View>
            </View>

            {item.categories.length > 0 && (
              <View style={styles.tagsRow}>
                {item.categories.slice(0, 3).map((cat) => (
                  <View key={cat} style={[styles.tag, { backgroundColor: `${theme.colors.primary}15` }]}>
                    <Text style={[styles.tagText, { color: theme.colors.primary }]}>{cat}</Text>
                  </View>
                ))}
                {item.categories.length > 3 && (
                  <Text style={[styles.moreTag, { color: theme.colors.textSecondary }]}>
                    +{item.categories.length - 3}
                  </Text>
                )}
              </View>
            )}
          </VctCard>
        </TouchableOpacity>
      )
    },
    [theme, onNavigateDetail]
  )

  // ── Render ───────────────────────────────────────────────

  return (
    <Animated.View style={[styles.container, { backgroundColor: theme.colors.background, opacity: fadeAnim }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Giải đấu</Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Tìm giải đấu..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        {STATUS_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              {
                backgroundColor: activeTab === tab.key ? theme.colors.primary : theme.colors.surface,
              },
            ]}
            onPress={() => handleTabChange(tab.key)}
            accessibilityLabel={`Lọc ${tab.label}`}
            accessibilityState={{ selected: activeTab === tab.key }}
          >
            <Text style={styles.tabEmoji}>{tab.emoji}</Text>
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === tab.key ? '#FFFFFF' : theme.colors.textSecondary },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tournament List */}
      {isLoading ? (
        <View style={styles.skeletonContainer}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonLoader key={i} width={SCREEN_WIDTH - 48} height={140} borderRadius={14} />
          ))}
        </View>
      ) : (
        <FlatList
          data={tournaments ?? []}
          renderItem={renderTournament}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="🏆"
              title="Không tìm thấy giải đấu"
              message={searchText ? `Không có kết quả cho "${searchText}"` : 'Chưa có giải đấu nào.'}
            />
          }
        />
      )}
    </Animated.View>
  )
}

// ── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '800', letterSpacing: 0.5 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 24, marginTop: 12,
    paddingHorizontal: 14, height: 44, borderRadius: 12, borderWidth: 1,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15 },
  clearIcon: { fontSize: 16, color: '#94A3B8', padding: 4 },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 24, marginTop: 14, gap: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 4 },
  tabEmoji: { fontSize: 14 },
  tabLabel: { fontSize: 12, fontWeight: '600' },
  listContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 },
  cardWrapper: { marginBottom: 12 },
  card: { padding: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardInfo: { flex: 1, marginRight: 8 },
  tournamentName: { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  organizer: { fontSize: 12, marginTop: 4 },
  cardDivider: { height: StyleSheet.hairlineWidth, marginVertical: 12 },
  cardBottom: { flexDirection: 'row', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaEmoji: { fontSize: 13 },
  metaText: { fontSize: 12 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontSize: 11, fontWeight: '600' },
  moreTag: { fontSize: 11, fontWeight: '600', alignSelf: 'center' },
  skeletonContainer: { paddingHorizontal: 24, paddingTop: 16, gap: 12 },
})
