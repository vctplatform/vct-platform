// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Bottom Sheet
// A reusable animated bottom sheet component for modals.
// ═══════════════════════════════════════════════════════════════

import React, { useEffect, useRef } from 'react'
import {
  Animated,
  PanResponder,
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  type ViewStyle,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useVCTTheme } from './theme-provider'

const SCREEN_HEIGHT = Dimensions.get('window').height

export interface BottomSheetProps {
  /** Is the sheet visible? */
  visible: boolean
  /** Callback when dismissed via swipe or clicking outside */
  onDismiss: () => void
  /** Sheet content */
  children: React.ReactNode
  /** Optional title for the header */
  title?: string
  /** Maximum height ratio (0.0 to 1.0) */
  maxHeightRatio?: number
  /** Style for the inner content container */
  contentStyle?: ViewStyle
}

/**
 * Animated Bottom Sheet component.
 */
export function BottomSheet({
  visible,
  onDismiss,
  children,
  title,
  maxHeightRatio = 0.85,
  contentStyle,
}: BottomSheetProps) {
  const { theme } = useVCTTheme()
  const insets = useSafeAreaInsets()

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current
  const [modalVisible, setModalVisible] = React.useState(visible)

  useEffect(() => {
    if (visible) {
      setModalVisible(true)
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }).start()
    } else {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setModalVisible(false)
      })
    }
  }, [visible, translateY])

  // Drag to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy)
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 1.5) {
          onDismiss()
        } else {
          // Snap back
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start()
        }
      },
    }),
  ).current

  if (!modalVisible) return null

  const maxHeight = SCREEN_HEIGHT * maxHeightRatio

  return (
    <Modal transparent visible={modalVisible} animationType="none" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        {/* Click outside to dismiss */}
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onDismiss} />

        <Animated.View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: theme.colors.surface,
              transform: [{ translateY }],
              paddingBottom: insets.bottom || theme.spacing.md,
              maxHeight,
            },
          ]}
        >
          {/* Drag Handle */}
          <View style={styles.handleContainer} {...panResponder.panHandlers}>
            <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
          </View>

          {/* Header */}
          {title && (
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
            </View>
          )}

          {/* Content */}
          <View style={[styles.content, contentStyle]}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheetContainer: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  handleContainer: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
})
