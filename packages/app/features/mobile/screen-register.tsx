// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Register Screen
// Registration screen with multi-step form: personal info,
// credentials, and role selection for the VCT Platform.
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
} from 'react-native'
import { useVCTTheme } from './theme-provider'
import { VctButton, VctTextInput } from './core-ui'
import { useFormValidation } from './form-validation'
import { triggerHaptic } from './haptic-feedback'
import { useToast } from './toast-notification'

// ── Types ────────────────────────────────────────────────────

interface RegisterScreenProps {
  inviteCode?: string
  onRegisterSuccess?: () => void
  onNavigateLogin?: () => void
}

type Step = 'info' | 'credentials' | 'role'

interface RoleOption {
  id: string
  label: string
  emoji: string
  description: string
}

const ROLE_OPTIONS: RoleOption[] = [
  { id: 'athlete', label: 'Vận động viên', emoji: '🥋', description: 'Tham gia thi đấu giải' },
  { id: 'coach', label: 'Huấn luyện viên', emoji: '🏅', description: 'Quản lý đội, dẫn đấu' },
  { id: 'referee', label: 'Trọng tài', emoji: '⚖️', description: 'Chấm điểm và giám sát thi đấu' },
  { id: 'club_manager', label: 'Quản lý CLB', emoji: '🏛️', description: 'Quản lý câu lạc bộ và VĐV' },
  { id: 'spectator', label: 'Người xem', emoji: '👀', description: 'Theo dõi giải đấu, xem kết quả' },
]

// ── Component ────────────────────────────────────────────────

export function ScreenRegister({
  inviteCode,
  onRegisterSuccess,
  onNavigateLogin,
}: RegisterScreenProps) {
  const { theme } = useVCTTheme()
  const toast = useToast()

  // Form state
  const [step, setStep] = useState<Step>('info')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Animation
  const slideAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(1)).current

  // Validation
  const { validate: validateInfo, errors: infoErrors } = useFormValidation({
    fullName: { required: true, minLength: 2, message: 'Tên phải có ít nhất 2 ký tự' },
    phone: { required: true, pattern: /^0\d{9}$/, message: 'SĐT không hợp lệ (VD: 0912345678)' },
  })

  const { validate: validateCredentials, errors: credErrors } = useFormValidation({
    email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email không hợp lệ' },
    password: { required: true, minLength: 8, message: 'Mật khẩu tối thiểu 8 ký tự' },
  })

  // ── Step Transition ──────────────────────────────────────

  const animateTransition = useCallback((direction: 'forward' | 'back') => {
    const toValue = direction === 'forward' ? -30 : 30
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue, duration: 150, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
      ]),
    ]).start()
  }, [fadeAnim, slideAnim])

  const goNext = useCallback(() => {
    if (step === 'info') {
      const valid = validateInfo({ fullName, phone })
      if (!valid) { triggerHaptic('warning'); return }
      animateTransition('forward')
      setStep('credentials')
    } else if (step === 'credentials') {
      const valid = validateCredentials({ email, password })
      if (!valid) { triggerHaptic('warning'); return }
      if (password !== confirmPassword) {
        toast.show({ type: 'error', title: 'Mật khẩu xác nhận không khớp' })
        triggerHaptic('warning')
        return
      }
      animateTransition('forward')
      setStep('role')
    }
  }, [step, fullName, phone, email, password, confirmPassword, validateInfo, validateCredentials, animateTransition, toast])

  const goBack = useCallback(() => {
    if (step === 'credentials') {
      animateTransition('back')
      setStep('info')
    } else if (step === 'role') {
      animateTransition('back')
      setStep('credentials')
    }
  }, [step, animateTransition])

  // ── Handle Submit ────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!selectedRole) {
      toast.show({ type: 'warning', title: 'Vui lòng chọn vai trò' })
      triggerHaptic('warning')
      return
    }

    setIsLoading(true)
    try {
      const { apiClient } = await import('./api-client')
      await apiClient.post('/api/v1/auth/register', {
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: selectedRole,
        invite_code: inviteCode || undefined,
      })

      triggerHaptic('success')
      toast.show({ type: 'success', title: 'Đăng ký thành công!', message: 'Vui lòng đăng nhập.' })
      onRegisterSuccess?.()
    } catch (err: any) {
      triggerHaptic('error')
      toast.show({
        type: 'error',
        title: 'Đăng ký thất bại',
        message: err?.message || 'Vui lòng thử lại.',
      })
    } finally {
      setIsLoading(false)
    }
  }, [fullName, phone, email, password, selectedRole, inviteCode, onRegisterSuccess, toast])

  // ── Step Indicator ───────────────────────────────────────

  const stepIndex = step === 'info' ? 0 : step === 'credentials' ? 1 : 2
  const stepLabels = ['Thông tin', 'Tài khoản', 'Vai trò']

  // ── Render ───────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Tạo tài khoản</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Tham gia cộng đồng Võ Cổ Truyền
          </Text>
        </View>

        {/* Step Indicator */}
        <View style={styles.stepRow}>
          {stepLabels.map((label, i) => (
            <View key={label} style={styles.stepItem}>
              <View
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: i <= stepIndex ? theme.colors.primary : theme.colors.border,
                  },
                ]}
              >
                <Text style={styles.stepDotText}>{i < stepIndex ? '✓' : i + 1}</Text>
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  { color: i <= stepIndex ? theme.colors.primary : theme.colors.textSecondary },
                ]}
              >
                {label}
              </Text>
            </View>
          ))}
        </View>

        {/* Form Steps */}
        <Animated.View
          style={[styles.formSection, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}
        >
          {step === 'info' && (
            <>
              <VctTextInput label="Họ và tên" placeholder="Nguyễn Văn A" value={fullName} onChangeText={setFullName} error={infoErrors.fullName} autoComplete="name" />
              <View style={styles.spacer} />
              <VctTextInput label="Số điện thoại" placeholder="0912345678" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={infoErrors.phone} autoComplete="tel" />
            </>
          )}

          {step === 'credentials' && (
            <>
              <VctTextInput label="Email" placeholder="ten@vidu.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" error={credErrors.email} autoComplete="email" />
              <View style={styles.spacer} />
              <VctTextInput label="Mật khẩu" placeholder="Tối thiểu 8 ký tự" value={password} onChangeText={setPassword} secureTextEntry error={credErrors.password} />
              <View style={styles.spacer} />
              <VctTextInput label="Xác nhận mật khẩu" placeholder="Nhập lại mật khẩu" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
            </>
          )}

          {step === 'role' && (
            <View style={styles.rolesGrid}>
              {ROLE_OPTIONS.map((role) => (
                <TouchableOpacity
                  key={role.id}
                  style={[
                    styles.roleCard,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: selectedRole === role.id ? theme.colors.primary : theme.colors.border,
                      borderWidth: selectedRole === role.id ? 2 : 1,
                    },
                  ]}
                  onPress={() => {
                    setSelectedRole(role.id)
                    triggerHaptic('selection')
                  }}
                  accessibilityLabel={`Chọn vai trò ${role.label}`}
                  accessibilityState={{ selected: selectedRole === role.id }}
                >
                  <Text style={styles.roleEmoji}>{role.emoji}</Text>
                  <Text style={[styles.roleName, { color: theme.colors.text }]}>{role.label}</Text>
                  <Text style={[styles.roleDesc, { color: theme.colors.textSecondary }]}>{role.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Navigation Buttons */}
        <View style={styles.buttonRow}>
          {step !== 'info' && (
            <VctButton title="Quay lại" onPress={goBack} variant="outline" size="medium" />
          )}
          <View style={styles.buttonSpacer} />
          {step === 'role' ? (
            <VctButton title="Hoàn tất đăng ký" onPress={handleSubmit} loading={isLoading} variant="primary" size="medium" />
          ) : (
            <VctButton title="Tiếp theo" onPress={goNext} variant="primary" size="medium" />
          )}
        </View>

        {/* Login CTA */}
        <TouchableOpacity onPress={onNavigateLogin} style={styles.loginCta}>
          <Text style={[styles.loginCtaText, { color: theme.colors.textSecondary }]}>
            Đã có tài khoản?{' '}
            <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Đăng nhập</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// ── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 48, paddingBottom: 40 },
  header: { marginBottom: 28 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: 0.5 },
  subtitle: { fontSize: 15, marginTop: 6 },
  stepRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 32, gap: 24 },
  stepItem: { alignItems: 'center' },
  stepDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  stepDotText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  stepLabel: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  formSection: { flex: 1, width: '100%', maxWidth: 400, alignSelf: 'center' },
  spacer: { height: 16 },
  rolesGrid: { gap: 12 },
  roleCard: { padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  roleEmoji: { fontSize: 28 },
  roleName: { fontSize: 15, fontWeight: '700', flex: 1 },
  roleDesc: { fontSize: 12, flex: 2 },
  buttonRow: { flexDirection: 'row', marginTop: 28, gap: 12 },
  buttonSpacer: { flex: 1 },
  loginCta: { paddingVertical: 16, alignItems: 'center' },
  loginCtaText: { fontSize: 15 },
})
