// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Skeleton Loader Components
// Animated placeholder UI for loading states.
// Uses VCT theme tokens for consistent dark/light mode appearance.
// ═══════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Animated,
  View,
  StyleSheet,
  type ViewStyle,
  type DimensionValue,
} from 'react-native'
import { useVCTTheme } from './theme-provider'

// ── Shimmer Animation ────────────────────────────────────────

function useShimmer(): Animated.Value {
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [anim])

  return anim
}

// ── Base Skeleton ────────────────────────────────────────────

interface SkeletonProps {
  width?: DimensionValue
  height?: DimensionValue
  borderRadius?: number
  style?: ViewStyle
  /** Delay in milliseconds before showing the skeleton. Prevents flash on fast networks. */
  delay?: number
}

/**
 * Base skeleton block with shimmer animation.
 *
 * @example
 * ```tsx
 * <Skeleton width={200} height={20} />
 * <Skeleton width="100%" height={16} borderRadius={4} />
 * ```
 */
export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 6,
  delay = 0,
  style,
}: SkeletonProps) {
  const shimmer = useShimmer()
  const { theme } = useVCTTheme()
  const [show, setShow] = useState(delay === 0)

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setShow(true), delay)
      return () => clearTimeout(timer)
    }
  }, [delay])

  if (!show) return null

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  })

  return (
    <Animated.View
      accessible={true}
      accessibilityRole="progressbar"
      aria-busy={true}
      aria-label="Loading content"
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.border,
          opacity,
        },
        style,
      ]}
    />
  )
}

// ── Pre-built Skeleton Patterns ──────────────────────────────

/**
 * Skeleton for a list item row (avatar + text lines).
 */
export function SkeletonListItem() {
  const { theme } = useVCTTheme()

  return (
    <View style={[styles.listItem, { borderBottomColor: theme.colors.divider }]}>
      <Skeleton width={48} height={48} borderRadius={24} />
      <View style={styles.listItemContent}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="40%" height={12} style={styles.mt8} />
      </View>
    </View>
  )
}

/**
 * Skeleton for a card (image + title + description).
 */
export function SkeletonCard() {
  const { theme } = useVCTTheme()

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <Skeleton width="100%" height={160} borderRadius={10} />
      <View style={styles.cardContent}>
        <Skeleton width="75%" height={18} />
        <Skeleton width="50%" height={14} style={styles.mt8} />
        <Skeleton width="90%" height={14} style={styles.mt8} />
      </View>
    </View>
  )
}

/**
 * Skeleton for athlete profile header.
 */
export function SkeletonProfile() {
  return (
    <View style={styles.profile}>
      <Skeleton width={80} height={80} borderRadius={40} />
      <View style={styles.profileInfo}>
        <Skeleton width={150} height={20} />
        <Skeleton width={100} height={14} style={styles.mt8} />
        <Skeleton width={120} height={14} style={styles.mt8} />
      </View>
    </View>
  )
}

/**
 * Skeleton for scoring panel.
 */
export function SkeletonScoring() {
  return (
    <View style={styles.scoring}>
      <View style={styles.scoringAthlete}>
        <Skeleton width={60} height={60} borderRadius={30} />
        <Skeleton width={100} height={16} style={styles.mt8} />
        <Skeleton width={60} height={40} borderRadius={10} style={styles.mt8} />
      </View>
      <Skeleton width={40} height={24} borderRadius={6} />
      <View style={styles.scoringAthlete}>
        <Skeleton width={60} height={60} borderRadius={30} />
        <Skeleton width={100} height={16} style={styles.mt8} />
        <Skeleton width={60} height={40} borderRadius={10} style={styles.mt8} />
      </View>
    </View>
  )
}

/**
 * Skeleton for a list of items.
 */
export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonListItem key={i} />
      ))}
    </View>
  )
}

/**
 * Generic skeleton container — renders skeleton or children.
 *
 * @example
 * ```tsx
 * <SkeletonContainer loading={isLoading} skeleton={<SkeletonList />}>
 *   <AthleteList data={athletes} />
 * </SkeletonContainer>
 * ```
 */
export function SkeletonContainer({
  loading,
  skeleton,
  children,
}: {
  loading: boolean
  skeleton: ReactNode
  children: ReactNode
}) {
  return <>{loading ? skeleton : children}</>
}

// ── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  mt8: { marginTop: 8 },

  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },

  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  cardContent: {
    padding: 16,
  },

  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },

  scoring: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  scoringAthlete: {
    alignItems: 'center',
  },
})
