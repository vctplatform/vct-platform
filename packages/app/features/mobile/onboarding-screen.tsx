import * as React from 'react'
import { Animated, Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'solito/navigation'
import { Colors, FontWeight, Radius, Space, Touch, SharedStyles } from './mobile-theme'
import { Icon, VCTIcons } from './icons'
import { hapticLight, hapticSelection } from './haptics'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Mobile Onboarding Screen (v3)
// Real logo on first slide, synced with web design system
// ═══════════════════════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-require-imports
const logoSource = require('app/assets/logo-vct.png')

const { width } = Dimensions.get('window')

const SLIDES = [
  {
    key: '1',
    title: 'Hệ Sinh Thái\nVõ Cổ Truyền',
    subtitle: 'Nền tảng quản lý võ thuật chuyên nghiệp đầu tiên tại Việt Nam, kết nối Liên đoàn, Võ đường và Vận động viên.',
    icon: null, // use logo image
    color: Colors.accent,
  },
  {
    key: '2',
    title: 'Trải Nghiệm\nToàn Diện',
    subtitle: 'Theo dõi lịch tập, thành tích thi đấu, thăng đai và đăng ký giải đấu chỉ với vài thao tác chạm trên điện thoại.',
    icon: VCTIcons.fitness,
    color: Colors.green,
  },
  {
    key: '3',
    title: 'Sẵn Sàng\nChinh Phục',
    subtitle: 'Khám phá ngay các tính năng mạnh mẽ được thiết kế riêng cho hành trình võ thuật của bạn.',
    icon: VCTIcons.trophy,
    color: Colors.gold,
  },
]

export function OnboardingMobileScreen() {
  const router = useRouter()
  const scrollX = React.useRef(new Animated.Value(0)).current
  const scrollViewRef = React.useRef<any>(null)
  const [currentIndex, setCurrentIndex] = React.useState(0)

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  )

  const handleMomentumScrollEnd = (e: any) => {
    const x = e.nativeEvent.contentOffset.x
    const index = Math.round(x / width)
    if (index !== currentIndex) {
      setCurrentIndex(index)
      hapticSelection()
    }
  }

  const goToNextSlide = () => {
    hapticLight()
    if (currentIndex < SLIDES.length - 1) {
      scrollViewRef.current?.scrollTo({ x: (currentIndex + 1) * width, animated: true })
      setCurrentIndex(currentIndex + 1)
    } else {
      router.push('/login')
    }
  }

  return (
    <View style={SharedStyles.page}>
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width]

          // Parallax icon
          const translateX = scrollX.interpolate({
            inputRange,
            outputRange: [width * 0.4, 0, -width * 0.4],
          })

          // Fade text
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0, 1, 0],
          })

          return (
            <View key={slide.key} style={{ width, flex: 1, padding: Space.xl, justifyContent: 'center' }}>
              <Animated.View style={{ alignItems: 'center', marginBottom: 40, transform: [{ translateX }] }}>
                {slide.icon === null ? (
                  <Image source={logoSource} style={{ width: 160, height: 160 }} resizeMode="contain" />
                ) : (
                  <View style={{
                    width: 140, height: 140, borderRadius: 70,
                    backgroundColor: Colors.overlay(slide.color, 0.1),
                    justifyContent: 'center', alignItems: 'center',
                    borderWidth: 2, borderColor: Colors.overlay(slide.color, 0.2),
                  }}>
                    <Icon name={slide.icon} size={64} color={slide.color} />
                  </View>
                )}
              </Animated.View>

              <Animated.View style={{ opacity, alignItems: 'center', paddingHorizontal: 10 }}>
                <Text style={{
                  fontSize: 28, fontWeight: FontWeight.black, color: Colors.textWhite,
                  textAlign: 'center', marginBottom: 16, lineHeight: 34,
                }}>
                  {slide.title}
                </Text>
                <Text style={{
                  fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22,
                }}>
                  {slide.subtitle}
                </Text>
              </Animated.View>
            </View>
          )
        })}
      </Animated.ScrollView>

      {/* FOOTER */}
      <View style={{ padding: Space.xl, paddingBottom: 50, alignItems: 'center' }}>
        {/* Pagination Dots */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 30 }}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width]
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            })
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            })
            return (
              <Animated.View
                key={i}
                style={{ width: dotWidth, height: 8, borderRadius: 4, backgroundColor: Colors.accent, opacity }}
              />
            )
          })}
        </View>

        {/* Action Button */}
        <Pressable
          style={{
            width: '100%', paddingVertical: 16, borderRadius: Radius.pill, backgroundColor: Colors.accent,
            alignItems: 'center', justifyContent: 'center', minHeight: Touch.minSize,
          }}
          onPress={goToNextSlide}
          accessibilityRole="button"
          accessibilityLabel={currentIndex === SLIDES.length - 1 ? 'Bắt đầu sử dụng' : 'Tiếp tục'}
        >
          <Text style={{ fontSize: 16, fontWeight: FontWeight.black, color: '#fff' }}>
            {currentIndex === SLIDES.length - 1 ? 'Bắt đầu ngay' : 'Tiếp tục'}
          </Text>
        </Pressable>

        {/* Skip action */}
        {currentIndex < SLIDES.length - 1 && (
          <Pressable
            style={{ marginTop: 20, minHeight: Touch.minSize, justifyContent: 'center' }}
            onPress={() => { hapticLight(); router.push('/login') }}
            accessibilityRole="button"
          >
            <Text style={{ fontSize: 13, fontWeight: FontWeight.bold, color: Colors.textMuted }}>Bỏ qua</Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}
