import * as React from 'react'
import { useState, useCallback } from 'react'
import {
  ActivityIndicator, Alert, KeyboardAvoidingView,
  Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native'
import { Colors, FontWeight, Radius, Space, Touch } from './mobile-theme'
import { Icon, VCTIcons } from './icons'
import { hapticLight, hapticSuccess, hapticError } from './haptics'
import { updateProfile } from './api-client'
import { useAuth } from '../auth/AuthProvider'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Edit Profile Modal (v2)
// SVG icons, a11y, haptics, proper labels
// ═══════════════════════════════════════════════════════════════

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.bgCard, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    paddingTop: 12, paddingBottom: 40, maxHeight: '90%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 16 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Space.xxl, marginBottom: Space.xxl,
  },
  title: { fontSize: 20, fontWeight: FontWeight.black, color: Colors.textPrimary },
  content: { paddingHorizontal: Space.xxl },

  label: { fontSize: 12, fontWeight: FontWeight.extrabold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.bgBase, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, marginBottom: 18,
  },
  input: { flex: 1, height: 48, color: Colors.textPrimary, fontSize: 15, fontWeight: FontWeight.semibold },

  readOnlyWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.overlay(Colors.textMuted, 0.06), borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 14, marginBottom: 18,
  },
  readOnlyValue: { fontSize: 14, fontWeight: FontWeight.semibold, color: Colors.textSecondary },

  note: {
    flexDirection: 'row', gap: 8, padding: Space.md, borderRadius: Radius.md,
    backgroundColor: Colors.overlay(Colors.gold, 0.08), borderWidth: 1, borderColor: Colors.overlay(Colors.gold, 0.15),
    marginBottom: Space.xxl,
  },
  noteText: { fontSize: 11, color: Colors.gold, lineHeight: 16, flex: 1 },

  saveBtn: {
    borderRadius: Radius.md, height: 52, justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.accent, minHeight: Touch.minSize,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: 16, fontWeight: FontWeight.black, color: '#fff' },
})

interface EditProfileModalProps {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
  profile: { id?: string; name: string; email?: string; phone?: string; club?: string; belt?: string }
}

export function EditProfileModal({ visible, onClose, onSuccess, profile }: EditProfileModalProps) {
  const { currentUser, token } = useAuth()
  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [saving, setSaving] = useState(false)

  React.useEffect(() => {
    if (visible) {
      setName(profile.name)
      setEmail(profile.email ?? '')
      setPhone(profile.phone ?? '')
    }
  }, [visible, profile])

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      hapticError()
      Alert.alert('Lỗi', 'Họ tên không được để trống')
      return
    }
    hapticLight()
    setSaving(true)
    try {
      const id = profile.id ?? currentUser.id
      await updateProfile(token, id, { fullName: name.trim(), email: email.trim(), phone: phone.trim() })
      hapticSuccess()
      Alert.alert('Thành công', 'Đã cập nhật hồ sơ')
      onSuccess()
    } catch {
      hapticError()
      Alert.alert('Lỗi', 'Không thể cập nhật hồ sơ')
    } finally {
      setSaving(false)
    }
  }, [name, email, phone, profile.id, currentUser, onSuccess])

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={s.sheet} onPress={e => e.stopPropagation()}>
            <View style={s.handle} />
            <View style={s.header}>
              <Text style={s.title} accessibilityRole="header">Chỉnh sửa hồ sơ</Text>
              <Pressable
                onPress={() => { hapticLight(); onClose() }}
                accessibilityRole="button"
                accessibilityLabel="Đóng"
                style={{ width: Touch.minSize, height: Touch.minSize, justifyContent: 'center', alignItems: 'center' }}
              >
                <Icon name={VCTIcons.close} size={22} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={s.content} keyboardShouldPersistTaps="handled">
              {/* Avatar hint */}
              <Pressable
                style={{ alignItems: 'center', marginBottom: 24 }}
                onPress={() => { hapticLight() }}
                accessibilityLabel="Thay ảnh đại diện (sắp ra mắt)"
              >
                <View style={{
                  width: 80, height: 80, borderRadius: 40,
                  backgroundColor: Colors.overlay(Colors.accent, 0.15),
                  justifyContent: 'center', alignItems: 'center',
                  borderWidth: 2, borderColor: Colors.overlay(Colors.accent, 0.3),
                }}>
                  <Icon name={VCTIcons.camera} size={24} color={Colors.accent} />
                </View>
                <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 6 }}>Nhấn để thay ảnh (sắp ra mắt)</Text>
              </Pressable>

              {/* Editable fields */}
              <Text style={s.label} nativeID="label-name">Họ và tên</Text>
              <View style={s.inputWrap}>
                <Icon name={VCTIcons.person} size={18} color={Colors.textSecondary} />
                <TextInput
                  style={s.input} value={name} onChangeText={setName}
                  editable={!saving} accessibilityLabel="Họ và tên" accessibilityLabelledBy="label-name"
                />
              </View>

              <Text style={s.label} nativeID="label-email">Email</Text>
              <View style={s.inputWrap}>
                <Icon name={VCTIcons.mail} size={18} color={Colors.textSecondary} />
                <TextInput
                  style={s.input} value={email} onChangeText={setEmail}
                  keyboardType="email-address" autoCapitalize="none"
                  editable={!saving} accessibilityLabel="Email" accessibilityLabelledBy="label-email"
                />
              </View>

              <Text style={s.label} nativeID="label-phone">Số điện thoại</Text>
              <View style={s.inputWrap}>
                <Icon name={VCTIcons.call} size={18} color={Colors.textSecondary} />
                <TextInput
                  style={s.input} value={phone} onChangeText={setPhone}
                  keyboardType="phone-pad"
                  editable={!saving} accessibilityLabel="Số điện thoại" accessibilityLabelledBy="label-phone"
                />
              </View>

              {/* Read-only fields */}
              <Text style={s.label}>Câu lạc bộ</Text>
              <View style={s.readOnlyWrap}>
                <Icon name={VCTIcons.people} size={18} color={Colors.textMuted} />
                <Text style={s.readOnlyValue}>{profile.club || '—'}</Text>
              </View>

              <Text style={s.label}>Cấp đai</Text>
              <View style={s.readOnlyWrap}>
                <Icon name={VCTIcons.ribbon} size={18} color={Colors.textMuted} />
                <Text style={s.readOnlyValue}>{profile.belt || '—'}</Text>
              </View>

              {/* Note */}
              <View style={s.note}>
                <Icon name={VCTIcons.info} size={16} color={Colors.gold} style={{ marginTop: 1 }} />
                <Text style={s.noteText}>
                  Để thay đổi CLB hoặc cấp đai, vui lòng liên hệ Ban tổ chức hoặc HLV trưởng.
                </Text>
              </View>

              {/* Save */}
              <Pressable
                style={[s.saveBtn, saving && s.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Lưu thay đổi"
                accessibilityState={{ disabled: saving }}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.saveBtnText}>Lưu thay đổi</Text>
                )}
              </Pressable>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  )
}
