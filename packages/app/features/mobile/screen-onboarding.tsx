// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Onboarding Screen
// Swipeable carousel introducing the VCT Platform to new users.
// 4 slides covering: Welcome, Tournaments, Training, Community.
// ═══════════════════════════════════════════════════════════════

import React, { useState, useRef, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Animated,
  Platform,
  type ViewToken,
} from 'react-native'
import { useVCTTheme } from './theme-provider'
import { VctButton } from './core-ui'
import { triggerHaptic } from './haptic-feedback'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

// ── Slide Data ───────────────────────────────────────────────

interface OnboardingSlide {
  id: string
  emoji: string
  title: string
  subtitle: string
  description: string
  gradient: [string, string]
}

const SLIDES: OnboardingSlide[] = [
  {
    id: 'welcome',
    emoji: '🥋',
    title: 'Chào mừng đến\nVCT Platform',
    subtitle: 'Nền tảng số hóa Võ Cổ Truyền Việt Nam',
    description: 'Kết nối cộng đồng, tổ chức giải đấu và phát triển võ thuật cổ truyền trên nền tảng hiện đại.',
    gradient: ['#0A0E14', '#1A2332'],
  },
  {
    id: 'tournaments',
    emoji: '🏆',
    title: 'Quản lý\nGiải đấu',
    subtitle: 'Từ đăng ký đến chấm điểm',
    description: 'Đăng ký thi đấu, theo dõi bảng xếp hạng, xem trực tiếp điểm số theo thời gian thực.',
    gradient: ['#0F1923', '#1A3040'],
  },
  {
    id: 'training',
    emoji: '📚',
    title: 'Huấn luyện\n& Đào tạo',
    subtitle: 'Kho bài quyền & kỹ thuật',
    description: 'Truy cập hàng trăm bài quyền, kỹ thuật đối kháng, và chương trình huấn luyện được chuẩn hóa.',
    gradient: ['#0F1A23', '#1A2840'],
  },
  {
    id: 'community',
    emoji: '🤝',
    title: 'Cộng đồng\nVõ Cổ Truyền',
    subtitle: 'Kết nối & phát triển',
    description: 'Tham gia câu lạc bộ, kết nối với HLV, trọng tài và VĐV trên toàn quốc.',
    gradient: ['#0F1923', '#1A2332'],
  },
]

// ── Types ────────────────────────────────────────────────────

interface OnboardingScreenProps {
  onComplete?: () => void
  onSkip?: () => void
}

// ── Component ────────────────────────────────────────────────

export function ScreenOnboarding({ onComplete, onSkip }: OnboardingScreenProps) {
  const { theme } = useVCTTheme()
  const [currentIndex, setCurrentIndex] = useState(0)
  const flatListRef = useRef<FlatList>(null)
  const scrollX = useRef(new Animated.Value(0)).current

  const isLastSlide = currentIndex === SLIDES.length - 1

  // ── Viewability Tracking ─────────────────────────────────

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index)
      }
    },
    []
  )

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current

  // ── Navigation ───────────────────────────────────────────

  const goToNext = useCallback(() => {
    if (isLastSlide) {
      handleComplete()
    } else {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true })
      triggerHaptic('selection')
    }
  }, [currentIndex, isLastSlide])

  const handleComplete = useCallback(async () => {
    triggerHaptic('success')
    try {
      const { secureStorage } = await import('./secure-storage')
      await secureStorage.setItem('has_onboarded', 'true')
    } catch {}
    onComplete?.()
  }, [onComplete])

  const handleSkip = useCallback(async () => {
    triggerHaptic('light')
    try {
      const { secureStorage } = await import('./secure-storage')
      await secureStorage.setItem('has_onboarded', 'true')
    } catch {}
    onSkip?.()
  }, [onSkip])

  // ── Render Slide ─────────────────────────────────────────

  const renderSlide = useCallback(
    ({ item, index }: { item: OnboardingSlide; index: number }) => {
      const inputRange = [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH]

      const emojiScale = scrollX.interpolate({
        inputRange,
        outputRange: [0.6, 1, 0.6],
        extrapolate: 'clamp',
      })

      const titleOpacity = scrollX.interpolate({
        inputRange,
        outputRange: [0, 1, 0],
        extrapolate: 'clamp',
      })

      const translateY = scrollX.interpolate({
        inputRange,
        outputRange: [60, 0, 60],
        extrapolate: 'clamp',
      })

      return (
        <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
          {/* Background gradient effect */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: item.gradient[0] }]} />

          <View style={styles.slideContent}>
            {/* Emoji Hero */}
            <Animated.View style={[styles.emojiContainer, { transform: [{ scale: emojiScale }] }]}>
              <Text style={styles.emojiText}>{item.emoji}</Text>
            </Animated.View>

            {/* Text Content */}
            <Animated.View
              style={[
                styles.textContainer,
                { opacity: titleOpacity, transform: [{ translateY }] },
              ]}
            >
              <Text style={[styles.slideTitle, { color: '#F0F4F8' }]}>{item.title}</Text>
              <Text style={[styles.slideSubtitle, { color: '#00E5CC' }]}>{item.subtitle}</Text>
              <Text style={[styles.slideDescription, { color: '#94A3B8' }]}>
                {item.description}
              </Text>
            </Animated.View>
          </View>
        </View>
      )
    },
    [scrollX]
  )

  // ── Pagination Dots ──────────────────────────────────────

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {SLIDES.map((_, i) => {
        const inputRange = [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH]

        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 24, 8],
          extrapolate: 'clamp',
        })

        const dotOpacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.4, 1, 0.4],
          extrapolate: 'clamp',
        })

        return (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                width: dotWidth,
                opacity: dotOpacity,
                backgroundColor: '#00E5CC',
              },
            ]}
          />
        )
      })}
    </View>
  )

  // ── Render ───────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: '#0A0E14' }]}>
      {/* Skip Button */}
      {!isLastSlide && (
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={handleSkip}
          accessibilityLabel="Bỏ qua giới thiệu"
        >
          <Text style={styles.skipText}>Bỏ qua</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {renderDots()}
        <View style={styles.bottomButtons}>
          <VctButton
            title={isLastSlide ? 'Bắt đầu ngay' : 'Tiếp theo'}
            onPress={goToNext}
            variant="primary"
            size="large"
          />
        </View>
      </View>
    </View>
  )
}

// ── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 40,
    right: 24,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
  },
  slide: {
    flex: 1,
  },
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emojiContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 229, 204, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  emojiText: {
    fontSize: 56,
  },
  textContainer: {
    alignItems: 'center',
  },
  slideTitle: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 40,
    letterSpacing: 0.5,
  },
  slideSubtitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
    letterSpacing: 0.5,
  },
  slideDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 12,
    maxWidth: 300,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 48 : 32,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  bottomButtons: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
})
