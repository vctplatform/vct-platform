// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Network Status Banner
// Shows offline indicator + pending sync count.
// ═══════════════════════════════════════════════════════════════

import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native'
import { useNetworkStatus } from './offline'

/**
 * Drop-in banner that shows offline state and pending sync operations.
 *
 * Place at the top of your screen or in your root layout.
 *
 * @example
 * ```tsx
 * function Layout({ children }) {
 *   return (
 *     <View style={{ flex: 1 }}>
 *       <NetworkStatusBanner />
 *       {children}
 *     </View>
 *   )
 * }
 * ```
 */
export function NetworkStatusBanner() {
  const { isOffline, pendingSyncCount } = useNetworkStatus()
  const slideAnim = React.useRef(new Animated.Value(-60)).current

  React.useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOffline ? 0 : -60,
      useNativeDriver: true,
      speed: 14,
      bounciness: 4,
    }).start()
  }, [isOffline, slideAnim])

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY: slideAnim }] }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <View style={styles.inner}>
        <View style={styles.dot} />
        <Text style={styles.text}>Mất kết nối mạng</Text>
        {pendingSyncCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pendingSyncCount}</Text>
          </View>
        )}
      </View>
      {pendingSyncCount > 0 && (
        <Text style={styles.subtext}>
          {pendingSyncCount} thao tác đang chờ đồng bộ
        </Text>
      )}
    </Animated.View>
  )
}

/**
 * Compact inline indicator for embedding in headers or tab bars.
 */
export function NetworkDot() {
  const { isOffline } = useNetworkStatus()

  if (!isOffline) return null

  return (
    <TouchableOpacity
      style={styles.compactDot}
      accessibilityLabel="Đang offline"
      accessibilityRole="alert"
      disabled
    >
      <View style={styles.dotSmall} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: '#dc2626',
    paddingTop: 48, // safe area
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fca5a5',
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  subtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginTop: 4,
    marginLeft: 16,
  },
  compactDot: {
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
})

export default NetworkStatusBanner
