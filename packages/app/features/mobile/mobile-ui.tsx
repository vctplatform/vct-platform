import * as React from 'react'
import { ActivityIndicator, Alert, Pressable, Text, View, Animated } from 'react-native'
import { Colors, SharedStyles, FontWeight, Radius, Space, Touch } from './mobile-theme'
import { Icon, VCTIcons } from './icons'
import { hapticLight } from './haptics'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Shared Mobile UI Components (v2)
// Accessible, animated, icon-based (no emoji)
// ═══════════════════════════════════════════════════════════════

/** Status badge with colored background */
export function Badge({ label, bg, fg, icon }: { label: string; bg: string; fg: string; icon?: React.ComponentProps<typeof Icon>['name'] }) {
  return (
    <View style={[SharedStyles.badge, { backgroundColor: bg }]} accessibilityRole="text">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {icon && <Icon name={icon} size={10} color={fg} />}
        <Text style={[SharedStyles.badgeText, { color: fg }]}>{label}</Text>
      </View>
    </View>
  )
}

/** Animated skill/progress bar */
export function SkillBar({ label, value, color }: { label: string; value: number; color: string }) {
  const animWidth = React.useRef(new Animated.Value(0)).current

  React.useEffect(() => {
    Animated.timing(animWidth, {
      toValue: Math.min(value, 100),
      duration: 600,
      useNativeDriver: false,
    }).start()
  }, [value, animWidth])

  return (
    <View style={SharedStyles.skillRow} accessibilityLabel={`${label}: ${value} phần trăm`} accessibilityRole="progressbar">
      <Text style={SharedStyles.skillLabel}>{label}</Text>
      <View style={SharedStyles.skillTrack}>
        <Animated.View style={[SharedStyles.skillFill, {
          width: animWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
          backgroundColor: color,
        }]} />
      </View>
      <Text style={[SharedStyles.skillValue, { color }]}>{value}</Text>
    </View>
  )
}

/** Goal progress bar with label */
export function GoalBar({ title, progress, color, icon }: { title: string; progress: number; color: string; icon?: string }) {
  const animWidth = React.useRef(new Animated.Value(0)).current

  React.useEffect(() => {
    Animated.timing(animWidth, {
      toValue: Math.min(progress, 100),
      duration: 600,
      useNativeDriver: false,
    }).start()
  }, [progress, animWidth])

  return (
    <View style={{ marginBottom: 14 }} accessibilityLabel={`${title}: ${progress} phần trăm hoàn thành`} accessibilityRole="progressbar">
      <View style={[SharedStyles.rowBetween, { marginBottom: 4 }]}>
        <View style={[SharedStyles.row, { gap: 8 }]}>
          {icon && <Text style={{ fontSize: 14 }}>{icon}</Text>}
          <Text style={{ fontSize: 12, fontWeight: FontWeight.bold, color: Colors.textPrimary }}>{title}</Text>
        </View>
        <Text style={{ fontSize: 11, fontWeight: FontWeight.extrabold, color }}>{progress}%</Text>
      </View>
      <View style={SharedStyles.progressTrack}>
        <Animated.View style={[SharedStyles.progressFill, {
          width: animWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
          backgroundColor: color,
        }]} />
      </View>
    </View>
  )
}

/** Section header with back button (accessible, 44px touch target) */
export function ScreenHeader({ title, subtitle, icon, onBack }: {
  title: string; subtitle: string; icon?: React.ComponentProps<typeof Icon>['name']; onBack: () => void
}) {
  return (
    <View style={[SharedStyles.row, { gap: 12, marginBottom: 16 }]}>
      <Pressable
        onPress={() => { hapticLight(); onBack() }}
        accessibilityRole="button"
        accessibilityLabel="Quay lại"
        accessibilityHint="Quay về màn hình trước"
        style={{
          width: Touch.minSize, height: Touch.minSize, borderRadius: Radius.md,
          borderWidth: 1, borderColor: Colors.border,
          backgroundColor: Colors.bgCard, justifyContent: 'center', alignItems: 'center',
        }}
      >
        <Icon name={VCTIcons.back} size={20} color={Colors.textSecondary} />
      </Pressable>
      {icon && <Icon name={icon} size={24} color={Colors.accent} />}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 22, fontWeight: FontWeight.black, color: Colors.textPrimary }} accessibilityRole="header">{title}</Text>
        <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 2 }}>{subtitle}</Text>
      </View>
    </View>
  )
}

/** Skeleton placeholder for loading states */
export function SkeletonBox({ width, height = 16, radius = 8, style }: {
  width: number | string; height?: number; radius?: number; style?: object
}) {
  const opacity = React.useRef(new Animated.Value(0.4)).current

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    )
    animation.start()
    return () => animation.stop()
  }, [opacity])

  return (
    <Animated.View style={[{
      width: width as number, height, borderRadius: radius,
      backgroundColor: Colors.skeleton,
      opacity,
    }, style]} />
  )
}

/** Full-screen skeleton for screen loading */
export function ScreenSkeleton() {
  return (
    <View style={[SharedStyles.page, SharedStyles.scrollContent]} accessibilityLabel="Đang tải nội dung">
      <View style={[SharedStyles.heroCard, { padding: Space.xxl }]}>
        <SkeletonBox width={72} height={72} radius={36} style={{ marginBottom: 12 }} />
        <SkeletonBox width={180} height={20} style={{ marginBottom: 8 }} />
        <SkeletonBox width={120} height={14} />
      </View>
      <View style={SharedStyles.statsRow}>
        {[1, 2, 3].map(i => (
          <View key={i} style={SharedStyles.statBox}>
            <SkeletonBox width={40} height={24} style={{ marginBottom: 4 }} />
            <SkeletonBox width={50} height={10} />
          </View>
        ))}
      </View>
      {[1, 2, 3].map(i => (
        <View key={i} style={SharedStyles.card}>
          <SkeletonBox width="80%" height={16} style={{ marginBottom: 8 }} />
          <SkeletonBox width="60%" height={12} style={{ marginBottom: 6 }} />
          <SkeletonBox width="40%" height={12} />
        </View>
      ))}
    </View>
  )
}

/** Loading spinner overlay */
export function LoadingOverlay({ message = 'Đang tải...' }: { message?: string }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bgBase }} accessibilityLabel={message}>
      <ActivityIndicator size="large" color={Colors.accent} />
      <Text style={{ marginTop: 12, fontSize: 13, color: Colors.textSecondary, fontWeight: FontWeight.semibold }}>
        {message}
      </Text>
    </View>
  )
}

/** Empty list state with optional CTA */
export function EmptyState({ icon, title, message, ctaLabel, onCta }: {
  icon?: React.ComponentProps<typeof Icon>['name']; title: string; message: string
  ctaLabel?: string; onCta?: () => void
}) {
  return (
    <View style={SharedStyles.emptyBox} accessibilityLabel={`${title}. ${message}`}>
      {icon && <Icon name={icon} size={36} color={Colors.textMuted} style={{ marginBottom: 4 }} />}
      <Text style={[SharedStyles.emptyText, { fontWeight: FontWeight.bold }]}>{title}</Text>
      <Text style={[SharedStyles.emptyText, { fontSize: 11, maxWidth: 220 }]}>{message}</Text>
      {ctaLabel && onCta && (
        <Pressable
          onPress={() => { hapticLight(); onCta() }}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
          style={{
            marginTop: 12, paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.pill,
            backgroundColor: Colors.overlay(Colors.accent, 0.1), borderWidth: 1, borderColor: Colors.overlay(Colors.accent, 0.2),
            minHeight: Touch.minSize, justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: FontWeight.extrabold, color: Colors.accent }}>{ctaLabel}</Text>
        </Pressable>
      )}
    </View>
  )
}

/** Offline/error banner at top of screen */
export function OfflineBanner({ isOffline, onRetry }: { isOffline: boolean; onRetry?: () => void }) {
  if (!isOffline) return null
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      paddingVertical: 8, paddingHorizontal: 16,
      backgroundColor: Colors.overlay(Colors.gold, 0.12), borderBottomWidth: 1, borderBottomColor: Colors.overlay(Colors.gold, 0.2),
    }} accessibilityRole="alert" accessibilityLabel="Đang dùng dữ liệu offline">
      <Icon name={VCTIcons.cloudOffline} size={16} color={Colors.gold} />
      <Text style={{ fontSize: 11, fontWeight: FontWeight.bold, color: Colors.gold, flex: 1 }}>
        Đang dùng dữ liệu offline
      </Text>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Kết nối lại"
          style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.sm, backgroundColor: Colors.overlay(Colors.gold, 0.15), minHeight: 32, justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 10, fontWeight: FontWeight.extrabold, color: Colors.gold }}>Thử lại</Text>
        </Pressable>
      )}
    </View>
  )
}

/** "Coming soon" alert for placeholder features */
export function showComingSoon(feature: string): void {
  Alert.alert('Sắp ra mắt', `Tính năng "${feature}" đang được phát triển.`)
}
