import * as React from 'react'
import { useState, useCallback } from 'react'
import {
  ActivityIndicator,
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
// VCT PLATFORM — Mobile Login Screen (v2)
// SVG icons, password toggle, forgot password, haptics, a11y
// ═══════════════════════════════════════════════════════════════

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: Space.xxl },

  heroWrap: { alignItems: 'center', marginBottom: 40 },
  logoCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.overlay(Colors.accent, 0.15), justifyContent: 'center', alignItems: 'center',
    marginBottom: 20, borderWidth: 2, borderColor: Colors.overlay(Colors.accent, 0.3),
  },
  brandText: { fontSize: 28, fontWeight: FontWeight.black, color: Colors.textWhite, letterSpacing: 1, marginBottom: 4 },
  brandSub: { fontSize: 13, color: Colors.textMuted, fontWeight: FontWeight.semibold },

  formCard: {
    borderRadius: Radius.xl, padding: Space.xxl,
    backgroundColor: '#1e293b', borderWidth: 1, borderColor: Colors.borderLight,
  },
  label: {
    fontSize: 12, fontWeight: FontWeight.extrabold, color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.bgInput, borderRadius: Radius.md, borderWidth: 1, borderColor: '#475569',
    paddingHorizontal: 14, marginBottom: 18,
  },
  input: { flex: 1, height: 48, color: Colors.textWhite, fontSize: 15, fontWeight: FontWeight.semibold },

  loginBtn: {
    borderRadius: Radius.md, height: 52, justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.accent, marginTop: 6,
    shadowColor: Colors.accent, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
    minHeight: Touch.minSize,
  },
  loginBtnDisabled: { opacity: 0.5 },
  loginBtnText: { fontSize: 16, fontWeight: FontWeight.black, color: '#fff', letterSpacing: 0.5 },

  errorBox: {
    backgroundColor: Colors.overlay(Colors.red, 0.12), borderRadius: Radius.md, padding: Space.md,
    marginBottom: Space.lg, borderWidth: 1, borderColor: Colors.overlay(Colors.red, 0.2),
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  errorText: { color: Colors.red, fontSize: 12, fontWeight: FontWeight.bold, flex: 1 },

  forgotBtn: { alignSelf: 'flex-end', marginTop: -10, marginBottom: 14 },
  forgotText: { fontSize: 12, fontWeight: FontWeight.semibold, color: Colors.textMuted },

  demoHint: {
    marginTop: Space.xxl, padding: Space.lg, borderRadius: Radius.md,
    backgroundColor: Colors.overlay(Colors.gold, 0.08), borderWidth: 1, borderColor: Colors.overlay(Colors.gold, 0.15),
    flexDirection: 'row', gap: 10,
  },
  demoTitle: { color: Colors.gold, fontSize: 11, fontWeight: FontWeight.extrabold, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  demoText: { color: Colors.textMuted, fontSize: 12, lineHeight: 18 },
  demoCode: { color: '#e2e8f0', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontWeight: FontWeight.bold },

  footer: { alignItems: 'center', marginTop: Space.xxxl, paddingBottom: Space.lg },
  footerText: { color: '#475569', fontSize: 11, fontWeight: FontWeight.semibold },
})

export function LoginMobileScreen() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
    login({ username: 'demo', password: 'demo' })
      .then(() => hapticSuccess())
      .catch(() => { setError('Không thể khởi tạo chế độ demo'); hapticError() })
      .finally(() => setIsSubmitting(false))
  }, [login])

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {/* HERO */}
        <View style={s.heroWrap}>
          <View style={s.logoCircle}>
            <Icon name={VCTIcons.fitness} size={42} color={Colors.accent} />
          </View>
          <Text style={s.brandText}>VCT PLATFORM</Text>
          <Text style={s.brandSub}>Nền tảng Võ Cổ Truyền Việt Nam</Text>
        </View>

        {/* FORM */}
        <View style={s.formCard} accessibilityRole="form">
          {error ? (
            <View style={s.errorBox} accessibilityRole="alert">
              <Icon name={VCTIcons.alert} size={18} color={Colors.red} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={s.label} nativeID="label-username">Tên đăng nhập</Text>
          <View style={s.inputWrap}>
            <Icon name={VCTIcons.person} size={18} color={Colors.textMuted} />
            <TextInput
              style={s.input}
              placeholder="Nhập tên đăng nhập"
              placeholderTextColor="#64748b"
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
              placeholderTextColor="#64748b"
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
        </View>

        {/* DEMO */}
        <View style={s.demoHint}>
          <Icon name={VCTIcons.info} size={20} color={Colors.gold} style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={s.demoTitle}>Tài khoản demo</Text>
            <Text style={s.demoText}>
              Bạn có thể bỏ qua đăng nhập để dùng chế độ demo.{'\n'}
              Hoặc đăng nhập với: <Text style={s.demoCode}>admin / admin123</Text>
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
