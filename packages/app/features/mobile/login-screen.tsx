import * as React from 'react'
import { useState, useCallback } from 'react'
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useAuth } from '../auth/AuthProvider'
import { Colors, FontWeight, Radius, Space, Touch } from './mobile-theme'
import { Icon, VCTIcons } from './icons'
import { hapticLight, hapticSuccess, hapticError } from './haptics'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Mobile Login Screen (v3)
// Real logo, cyan accent, synced with web design system
// ═══════════════════════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-require-imports
const logoSource = require('app/assets/logo-vct.png')

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgBase },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: Space.xxl },

  heroWrap: { alignItems: 'center', marginBottom: 36 },
  logoImage: {
    width: 120, height: 120, marginBottom: 16,
  },
  brandText: {
    fontSize: 13, fontWeight: FontWeight.bold, color: Colors.textMuted,
    letterSpacing: 2, textTransform: 'uppercase',
  },
  brandSub: { fontSize: 13, color: Colors.textMuted, fontWeight: FontWeight.medium, marginTop: 4 },

  formCard: {
    borderRadius: Radius.xl, padding: Space.xxl,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
  },
  label: {
    fontSize: 12, fontWeight: FontWeight.extrabold, color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.bgInput, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, marginBottom: 18,
  },
  input: { flex: 1, height: 48, color: Colors.textPrimary, fontSize: 15, fontWeight: FontWeight.semibold },

  loginBtn: {
    borderRadius: Radius.md, height: 52, justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.accent, marginTop: 6,
    minHeight: Touch.minSize,
  },
  loginBtnDisabled: { opacity: 0.5 },
  loginBtnText: { fontSize: 16, fontWeight: FontWeight.black, color: '#fff', letterSpacing: 0.5 },

  errorBox: {
    backgroundColor: Colors.statusErrorBg, borderRadius: Radius.md, padding: Space.md,
    marginBottom: Space.lg, borderWidth: 1, borderColor: Colors.overlay(Colors.red, 0.2),
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  errorText: { color: Colors.statusErrorFg, fontSize: 12, fontWeight: FontWeight.bold, flex: 1 },

  forgotBtn: { alignSelf: 'flex-end', marginTop: -10, marginBottom: 14 },
  forgotText: { fontSize: 12, fontWeight: FontWeight.semibold, color: Colors.textMuted },

  demoHint: {
    marginTop: Space.xxl, padding: Space.lg, borderRadius: Radius.md,
    backgroundColor: Colors.overlay(Colors.gold, 0.08), borderWidth: 1, borderColor: Colors.overlay(Colors.gold, 0.15),
    flexDirection: 'row', gap: 10,
  },
  demoTitle: { color: Colors.gold, fontSize: 11, fontWeight: FontWeight.extrabold, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  demoText: { color: Colors.textMuted, fontSize: 12, lineHeight: 18 },
  demoCode: { color: Colors.textPrimary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontWeight: FontWeight.bold },

  footer: { alignItems: 'center', marginTop: Space.xxxl, paddingBottom: Space.lg },
  footerText: { color: Colors.textMuted, fontSize: 11, fontWeight: FontWeight.semibold },
})

const DEMO_ACCOUNTS = [
  { username: 'parent', password: 'Parent@123', label: 'Phụ huynh' },
  { username: 'admin', password: 'Admin@123', label: 'Quản trị hệ thống' },
] as const

export function LoginMobileScreen() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Animated logo pulse
  const logoScale = React.useRef(new Animated.Value(1)).current
  const formSlide = React.useRef(new Animated.Value(30)).current
  const formOpacity = React.useRef(new Animated.Value(0)).current

  React.useEffect(() => {
    // Logo breathing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, { toValue: 1.06, duration: 1500, useNativeDriver: true }),
        Animated.timing(logoScale, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start()
    // Form slide-up entrance
    Animated.parallel([
      Animated.spring(formSlide, { toValue: 0, useNativeDriver: true, speed: 12, bounciness: 6 }),
      Animated.timing(formOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start()
  }, [logoScale, formSlide, formOpacity])

  const canSubmit = username.trim().length > 0 && password.trim().length > 0 && !isSubmitting

  const handleLogin = useCallback(async () => {
    if (!canSubmit) return
    hapticLight()
    setError('')
    setIsSubmitting(true)
    try {
      await login({ username: username.trim(), password: password.trim() })
      hapticSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đăng nhập thất bại'
      setError(msg)
      hapticError()
    } finally {
      setIsSubmitting(false)
    }
  }, [canSubmit, login, username, password])

  const handleDemoSkip = useCallback(() => {
    hapticLight()
    setIsSubmitting(true)
    const bootstrapDemo = async () => {
      for (const account of DEMO_ACCOUNTS) {
        try {
          await login({ username: account.username, password: account.password })
          hapticSuccess()
          return
        } catch {
          // Try the next seeded demo account.
        }
      }

      throw new Error('Không thể khởi tạo chế độ demo')
    }

    bootstrapDemo()
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Không thể khởi tạo chế độ demo')
        hapticError()
      })
      .finally(() => setIsSubmitting(false))
  }, [login])

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.heroWrap}>
          <Animated.View style={{ transform: [{ scale: logoScale }] }}>
            <Image source={logoSource} style={s.logoImage} resizeMode="contain" />
          </Animated.View>
          <Text style={s.brandText}>Nền tảng Võ Cổ Truyền Việt Nam</Text>
        </View>

        {/* FORM — animated entrance */}
        <Animated.View style={[s.formCard, { transform: [{ translateY: formSlide }], opacity: formOpacity }]} accessibilityRole="form">
          {error ? (
            <View style={s.errorBox} accessibilityRole="alert">
              <Icon name={VCTIcons.alert} size={18} color={Colors.statusErrorFg} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={s.label} nativeID="label-username">Tên đăng nhập</Text>
          <View style={s.inputWrap}>
            <Icon name={VCTIcons.person} size={18} color={Colors.textMuted} />
            <TextInput
              style={s.input}
              placeholder="Nhập tên đăng nhập"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              value={username}
              onChangeText={setUsername}
              editable={!isSubmitting}
              accessibilityLabel="Tên đăng nhập"
              accessibilityLabelledBy="label-username"
            />
          </View>

          <Text style={s.label} nativeID="label-password">Mật khẩu</Text>
          <View style={s.inputWrap}>
            <Icon name={VCTIcons.lock} size={18} color={Colors.textMuted} />
            <TextInput
              style={s.input}
              placeholder="Nhập mật khẩu"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              editable={!isSubmitting}
              onSubmitEditing={handleLogin}
              accessibilityLabel="Mật khẩu"
              accessibilityLabelledBy="label-password"
            />
            <Pressable
              onPress={() => { hapticLight(); setShowPassword(!showPassword) }}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}
            >
              <Icon name={showPassword ? VCTIcons.eyeOff : VCTIcons.eye} size={20} color={Colors.textMuted} />
            </Pressable>
          </View>

          {/* Forgot password */}
          <Pressable
            style={s.forgotBtn}
            onPress={() => { hapticLight() }}
            accessibilityRole="link"
            accessibilityLabel="Quên mật khẩu"
          >
            <Text style={s.forgotText}>Quên mật khẩu?</Text>
          </Pressable>

          <Pressable
            style={[s.loginBtn, !canSubmit && s.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityLabel="Đăng nhập"
            accessibilityState={{ disabled: !canSubmit }}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.loginBtnText}>ĐĂNG NHẬP</Text>
            )}
          </Pressable>
        </Animated.View>

        {/* DEMO */}
        <View style={s.demoHint}>
          <Icon name={VCTIcons.info} size={20} color={Colors.gold} style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={s.demoTitle}>Tài khoản demo</Text>
            <Text style={s.demoText}>
              Bạn có thể bỏ qua đăng nhập để dùng chế độ demo.{'\n'}
              Hoặc đăng nhập với: <Text style={s.demoCode}>parent / Parent@123</Text>{'\n'}
              Tài khoản quản trị: <Text style={s.demoCode}>admin / Admin@123</Text>
            </Text>
          </View>
        </View>

        <Pressable
          style={{ marginTop: 16, alignItems: 'center', padding: 14, opacity: isSubmitting ? 0.5 : 1, minHeight: Touch.minSize, justifyContent: 'center' }}
          onPress={handleDemoSkip}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Bỏ qua đăng nhập, dùng chế độ demo"
        >
          <Text style={{ color: Colors.accent, fontWeight: FontWeight.extrabold, fontSize: 14 }}>
            Bỏ qua → Dùng chế độ Demo
          </Text>
        </Pressable>

        <View style={s.footer}>
          <Text style={s.footerText}>© 2026 VCT Platform v1.0</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
