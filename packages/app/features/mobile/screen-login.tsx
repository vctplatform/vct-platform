// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Login Screen
// Premium login UI with email/password, biometric quick-login,
// social login buttons, and VCT branding.
// ═══════════════════════════════════════════════════════════════

import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
} from 'react-native'
import { useVCTTheme } from './theme-provider'
import { VctButton, VctTextInput } from './core-ui'
import { biometrics } from './biometrics-auth'
import { authStorage } from './auth-storage'
import { useFormValidation } from './form-validation'
import { triggerHaptic } from './haptic-feedback'
import { useToast } from './toast-notification'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// ── Types ────────────────────────────────────────────────────

interface LoginScreenProps {
  onLoginSuccess?: () => void
  onNavigateRegister?: () => void
  onNavigateForgotPassword?: () => void
}

// ── Component ────────────────────────────────────────────────

export function ScreenLogin({
  onLoginSuccess,
  onNavigateRegister,
  onNavigateForgotPassword,
}: LoginScreenProps) {
  const { theme, isDark } = useVCTTheme()
  const toast = useToast()

  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [biometricIcon, setBiometricIcon] = useState<'faceid' | 'touchid' | 'lock'>('lock')

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(40)).current
  const logoScale = useRef(new Animated.Value(0.8)).current

  // Validation
  const { validate, errors } = useFormValidation({
    email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email không hợp lệ' },
    password: { required: true, minLength: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
  })

  // ── Entry Animation ──────────────────────────────────────

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  // ── Check Biometrics ─────────────────────────────────────

  useEffect(() => {
    async function checkBio() {
      const status = await biometrics.checkAvailability()
      setBiometricAvailable(status.hasHardware && status.isEnrolled)
      const icon = await biometrics.getPreferredIcon()
      setBiometricIcon(icon)
    }
    checkBio()
  }, [])

  // ── Handle Login ─────────────────────────────────────────

  const handleLogin = useCallback(async () => {
    const isValid = validate({ email, password })
    if (!isValid) {
      triggerHaptic('warning')
      return
    }

    setIsLoading(true)
    try {
      // Import apiClient dynamically to avoid circular dependency
      const { apiClient } = await import('./api-client')
      const response = await apiClient.post<
        { email: string; password: string },
        { access_token: string; refresh_token: string; user: any }
      >('/api/v1/auth/login', { email: email.trim().toLowerCase(), password })

      // Store tokens
      await authStorage.setTokens(response.access_token, response.refresh_token)
      if (response.user) {
        await authStorage.setUser(response.user)
      }

      triggerHaptic('success')
      toast.show({ type: 'success', title: 'Đăng nhập thành công!', duration: 2000 })
      onLoginSuccess?.()
    } catch (err: any) {
      triggerHaptic('error')
      const message = err?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'
      toast.show({ type: 'error', title: 'Lỗi đăng nhập', message, duration: 4000 })
    } finally {
      setIsLoading(false)
    }
  }, [email, password, validate, onLoginSuccess, toast])

  // ── Handle Biometric Login ───────────────────────────────

  const handleBiometricLogin = useCallback(async () => {
    const authenticated = await biometrics.authenticate({
      promptMessage: 'Đăng nhập bằng sinh trắc học',
    })

    if (authenticated) {
      // Check if we have stored credentials for quick relogin
      const token = await authStorage.getAccessToken()
      if (token) {
        triggerHaptic('success')
        toast.show({ type: 'success', title: 'Đăng nhập thành công!' })
        onLoginSuccess?.()
      } else {
        toast.show({ type: 'info', title: 'Vui lòng đăng nhập lần đầu bằng mật khẩu' })
      }
    }
  }, [onLoginSuccess, toast])

  // ── Render ───────────────────────────────────────────────

  const dynamicStyles = createDynamicStyles(theme, isDark)

  return (
    <KeyboardAvoidingView
      style={dynamicStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={dynamicStyles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Logo & Branding ──────────────────────── */}
        <Animated.View
          style={[
            styles.logoSection,
            { opacity: fadeAnim, transform: [{ scale: logoScale }] },
          ]}
        >
          <Text style={dynamicStyles.logoText}>🥋</Text>
          <Text style={dynamicStyles.brandTitle}>VCT Platform</Text>
          <Text style={dynamicStyles.brandSubtitle}>Nền tảng Võ Cổ Truyền Việt Nam</Text>
        </Animated.View>

        {/* ── Form ─────────────────────────────────── */}
        <Animated.View
          style={[
            styles.formSection,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <VctTextInput
            label="Email"
            placeholder="ten@vidu.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
          />

          <View style={styles.spacer} />

          <VctTextInput
            label="Mật khẩu"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="password"
            error={errors.password}
          />

          {/* Toggle password visibility */}
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.showPasswordBtn}
            accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            <Text style={dynamicStyles.showPasswordText}>
              {showPassword ? '🙈 Ẩn' : '👁️ Hiện'}
            </Text>
          </TouchableOpacity>

          {/* Forgot password */}
          <TouchableOpacity
            onPress={onNavigateForgotPassword}
            style={styles.forgotBtn}
            accessibilityLabel="Quên mật khẩu"
          >
            <Text style={dynamicStyles.forgotText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          {/* Login button */}
          <VctButton
            title="Đăng nhập"
            onPress={handleLogin}
            loading={isLoading}
            variant="primary"
            size="large"
          />

          {/* Biometric login */}
          {biometricAvailable && (
            <TouchableOpacity
              onPress={handleBiometricLogin}
              style={[styles.biometricBtn, { borderColor: theme.colors.border }]}
              accessibilityLabel="Đăng nhập bằng sinh trắc học"
            >
              <Text style={styles.biometricIcon}>
                {biometricIcon === 'faceid' ? '😊' : biometricIcon === 'touchid' ? '👆' : '🔒'}
              </Text>
              <Text style={dynamicStyles.biometricText}>
                {biometricIcon === 'faceid' ? 'Đăng nhập Face ID' : 'Đăng nhập Vân tay'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
            <Text style={dynamicStyles.dividerText}>hoặc</Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
          </View>

          {/* Register CTA */}
          <TouchableOpacity
            onPress={onNavigateRegister}
            style={styles.registerCta}
            accessibilityLabel="Đăng ký tài khoản mới"
          >
            <Text style={dynamicStyles.registerText}>
              Chưa có tài khoản?{' '}
              <Text style={dynamicStyles.registerLink}>Đăng ký ngay</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// ── Dynamic Styles ───────────────────────────────────────────

function createDynamicStyles(
  theme: ReturnType<typeof useVCTTheme>['theme'],
  isDark: boolean
) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 40,
    },
    logoText: {
      fontSize: 64,
      textAlign: 'center',
    },
    brandTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.colors.text,
      textAlign: 'center',
      marginTop: 12,
      letterSpacing: 1,
    },
    brandSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 6,
    },
    showPasswordText: {
      fontSize: 13,
      color: theme.colors.primary,
    },
    forgotText: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    biometricText: {
      fontSize: 15,
      color: theme.colors.text,
      marginLeft: 8,
      fontWeight: '500',
    },
    dividerText: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginHorizontal: 12,
    },
    registerText: {
      fontSize: 15,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    registerLink: {
      color: theme.colors.primary,
      fontWeight: '700',
    },
  })
}

// ── Static Styles ────────────────────────────────────────────

const styles = StyleSheet.create({
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  formSection: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  spacer: {
    height: 16,
  },
  showPasswordBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    marginBottom: 20,
  },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  biometricIcon: {
    fontSize: 22,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  registerCta: {
    paddingVertical: 12,
  },
})
