import * as React from 'react'
import { useMemo, useCallback } from 'react'
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native'
import { Colors, SharedStyles, FontWeight, Radius, Space, Touch } from './mobile-theme'
import { ScreenSkeleton } from './mobile-ui'
import { Icon, VCTIcons } from './icons'
import { hapticLight } from './haptics'
import { useNotifications } from './useAthleteData'
import type { MockNotification } from './mock-data'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Mobile Notifications Screen (v2)
// SVG icons, a11y, haptics, empty CTA
// ═══════════════════════════════════════════════════════════════

const NOTIF_TYPE_CFG: Record<string, { icon: React.ComponentProps<typeof Icon>['name']; color: string; label: string }> = {
  tournament: { icon: VCTIcons.trophy, color: Colors.gold, label: 'Giải đấu' },
  training: { icon: VCTIcons.fitness, color: Colors.green, label: 'Tập luyện' },
  system: { icon: VCTIcons.settings, color: Colors.textSecondary, label: 'Hệ thống' },
  result: { icon: VCTIcons.medal, color: Colors.purple, label: 'Kết quả' },
}

type FilterType = 'all' | 'tournament' | 'training' | 'system' | 'result'

const FILTERS: { key: FilterType; label: string; icon?: React.ComponentProps<typeof Icon>['name'] }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'tournament', label: 'Giải đấu', icon: VCTIcons.trophy },
  { key: 'training', label: 'Tập luyện', icon: VCTIcons.fitness },
  { key: 'result', label: 'Kết quả', icon: VCTIcons.medal },
  { key: 'system', label: 'Hệ thống', icon: VCTIcons.settings },
]

export function NotificationsMobileScreen() {
  const { notifications, isLoading, markAsRead, markAllRead, refetch } = useNotifications()
  const [filter, setFilter] = React.useState<FilterType>('all')

  const unreadCount = notifications.filter(n => !n.read).length
  const filteredNotifs = useMemo(
    () => filter === 'all' ? notifications : notifications.filter(n => n.type === filter),
    [notifications, filter]
  )

  const renderNotification = useCallback(({ item }: { item: MockNotification }) => {
    const cfg = NOTIF_TYPE_CFG[item.type] ?? NOTIF_TYPE_CFG['system']!
    return (
      <Pressable
        style={[SharedStyles.card, !item.read && { backgroundColor: Colors.overlay(Colors.accent, 0.04), borderColor: Colors.overlay(Colors.accent, 0.15) }]}
        onPress={() => { hapticLight(); markAsRead(item.id) }}
        android_ripple={{ color: 'rgba(0,0,0,0.03)' }}
        accessibilityRole="button"
        accessibilityLabel={`${item.read ? '' : 'Chưa đọc: '}${item.title}. ${item.body}`}
      >
        <View style={[SharedStyles.rowBetween, { marginBottom: 6 }]}>
          <View style={[SharedStyles.row, { gap: 6 }]}>
            {!item.read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accent, marginRight: 2 }} />}
            <Icon name={cfg.icon} size={16} color={cfg.color} />
            <Text style={{ fontSize: 10, fontWeight: FontWeight.extrabold, color: cfg.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{cfg.label}</Text>
          </View>
          <Text style={{ fontSize: 10, color: Colors.textSecondary }}>{item.time}</Text>
        </View>
        <Text style={{ fontSize: 14, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, marginBottom: 4 }}>{item.title}</Text>
        <Text style={{ fontSize: 12, color: Colors.textSecondary, lineHeight: 18 }}>{item.body}</Text>
      </Pressable>
    )
  }, [markAsRead])

  if (isLoading) return <ScreenSkeleton />

  const headerComponent = (
    <View>
      <View style={[SharedStyles.rowBetween, { marginBottom: 16 }]}>
        <View style={[SharedStyles.row, { gap: 10 }]}>
          <Text style={{ fontSize: 22, fontWeight: FontWeight.black, color: Colors.textPrimary }} accessibilityRole="header">Thông báo</Text>
          {unreadCount > 0 && (
            <View style={{ minWidth: 18, height: 18, borderRadius: 9, backgroundColor: Colors.red, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 10, fontWeight: FontWeight.black, color: '#fff' }}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <Pressable
            style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.sm, backgroundColor: Colors.overlay(Colors.accent, 0.08), minHeight: Touch.minSizeSm }}
            onPress={() => { hapticLight(); markAllRead() }}
            accessibilityRole="button"
            accessibilityLabel="Đánh dấu tất cả đã đọc"
          >
            <Text style={{ fontSize: 11, fontWeight: FontWeight.extrabold, color: Colors.accent }}>Đọc tất cả</Text>
          </Pressable>
        )}
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        {FILTERS.map(f => (
          <Pressable
            key={f.key}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 4,
              paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.pill,
              backgroundColor: filter === f.key ? Colors.accent : Colors.bgCard,
              borderWidth: 1, borderColor: filter === f.key ? Colors.accent : Colors.border,
              minHeight: Touch.minSizeSm,
            }}
            onPress={() => { hapticLight(); setFilter(f.key) }}
            accessibilityRole="button"
            accessibilityLabel={f.label}
            accessibilityState={{ selected: filter === f.key }}
          >
            {f.icon && <Icon name={f.icon} size={12} color={filter === f.key ? '#fff' : Colors.textSecondary} />}
            <Text style={{ fontSize: 11, fontWeight: FontWeight.extrabold, color: filter === f.key ? '#fff' : Colors.textSecondary }}>{f.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )

  const emptyComponent = (
    <View style={SharedStyles.emptyBox} accessibilityLabel="Không có thông báo">
      <Icon name={VCTIcons.notificationsOutline} size={36} color={Colors.textMuted} />
      <Text style={[SharedStyles.emptyText, { fontWeight: FontWeight.bold }]}>Không có thông báo</Text>
      <Text style={[SharedStyles.emptyText, { fontSize: 11, maxWidth: 260 }]}>
        Bạn chưa có thông báo nào{filter !== 'all' ? ` trong mục ${FILTERS.find(f => f.key === filter)?.label}` : ''}.
      </Text>
    </View>
  )

  return (
    <FlatList
      style={SharedStyles.page}
      contentContainerStyle={SharedStyles.scrollContent}
      data={filteredNotifs}
      keyExtractor={item => item.id}
      renderItem={renderNotification}
      ListHeaderComponent={headerComponent}
      ListEmptyComponent={emptyComponent}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.accent} />}
    />
  )
}
