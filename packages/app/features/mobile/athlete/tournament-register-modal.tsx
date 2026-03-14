import * as React from 'react'
import { useState, useCallback } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Colors, FontWeight, Radius, Space, Touch } from '../mobile-theme'
import { Icon, VCTIcons } from '../icons'
import { hapticLight, hapticSuccess, hapticError, hapticSelection } from '../haptics'
import { useAuth } from '../../auth/AuthProvider'
import { registerTournament, isApiAvailable } from '../api-client'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Tournament Registration Modal
// Form to register for a new tournament
// ═══════════════════════════════════════════════════════════════

interface TournamentRegisterModalProps {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
}

const CATEGORIES = [
  'Đối kháng Nam',
  'Đối kháng Nữ',
  'Quyền đơn Nam',
  'Quyền đơn Nữ',
  'Quyền đôi',
  'Binh khí',
]

const WEIGHT_CLASSES = [
  '48kg', '51kg', '54kg', '57kg', '60kg',
  '64kg', '68kg', '72kg', '78kg', '+78kg',
]

function SelectChip({ label, selected, onPress }: {
  label: string; selected: boolean; onPress: () => void
}) {
  return (
    <Pressable
      onPress={() => { hapticSelection(); onPress() }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={{
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.pill,
        borderWidth: 1,
        borderColor: selected ? Colors.accent : Colors.border,
        backgroundColor: selected ? Colors.overlay(Colors.accent, 0.1) : Colors.bgCard,
        marginRight: 8, marginBottom: 8, minHeight: Touch.minSizeSm,
        justifyContent: 'center',
      }}
    >
      <Text style={{
        fontSize: 12,
        fontWeight: selected ? FontWeight.extrabold : FontWeight.semibold,
        color: selected ? Colors.accent : Colors.textSecondary,
      }}>
        {label}
      </Text>
    </Pressable>
  )
}

export function TournamentRegisterModal({ visible, onClose, onSuccess }: TournamentRegisterModalProps) {
  const { token, currentUser } = useAuth()
  const [tournamentName, setTournamentName] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedWeight, setSelectedWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canSubmit = tournamentName.trim().length > 0 && selectedCategory.length > 0 && !isSubmitting

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return
    hapticLight()
    setIsSubmitting(true)
    try {
      if (isApiAvailable()) {
        await registerTournament(token, {
          athleteId: currentUser.id,
          tournamentId: '', // backend generates
          tournamentName: tournamentName.trim(),
          category: selectedCategory,
          weightClass: selectedWeight || undefined,
          notes: notes.trim() || undefined,
        })
      }
      hapticSuccess()
      Alert.alert('Thành công', 'Đã gửi đăng ký giải đấu. Vui lòng chờ phê duyệt.', [
        { text: 'OK', onPress: onSuccess },
      ])
    } catch (err: unknown) {
      hapticError()
      const msg = err instanceof Error ? err.message : 'Không thể đăng ký giải đấu'
      Alert.alert('Lỗi', msg)
    } finally {
      setIsSubmitting(false)
    }
  }, [canSubmit, token, currentUser.id, tournamentName, selectedCategory, selectedWeight, notes, onSuccess])

  const resetForm = useCallback(() => {
    setTournamentName('')
    setSelectedCategory('')
    setSelectedWeight('')
    setNotes('')
  }, [])

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [resetForm, onClose])

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: Colors.bgBase }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: Space.lg, paddingVertical: Space.md,
          borderBottomWidth: 1, borderBottomColor: Colors.border,
          backgroundColor: Colors.bgCard,
        }}>
          <Pressable onPress={() => { hapticLight(); handleClose() }} disabled={isSubmitting} accessibilityRole="button" accessibilityLabel="Hủy">
            <Text style={{ fontSize: 15, color: Colors.textSecondary, fontWeight: FontWeight.semibold }}>Hủy</Text>
          </Pressable>
          <Text style={{ fontSize: 16, fontWeight: FontWeight.extrabold, color: Colors.textPrimary }} accessibilityRole="header">
            Đăng ký giải đấu
          </Text>
          <Pressable onPress={handleSubmit} disabled={!canSubmit} accessibilityRole="button" accessibilityLabel="Gửi đăng ký">
            {isSubmitting ? (
              <ActivityIndicator size="small" color={Colors.accent} />
            ) : (
              <Text style={{
                fontSize: 15, fontWeight: FontWeight.extrabold,
                color: canSubmit ? Colors.accent : Colors.textMuted,
              }}>
                Gửi
              </Text>
            )}
          </Pressable>
        </View>

        {/* Form */}
        <ScrollView
          contentContainerStyle={{ padding: Space.lg, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Tournament name */}
          <Text style={{
            fontSize: 11, fontWeight: FontWeight.extrabold, color: Colors.textSecondary,
            textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
          }}>
            Tên giải đấu *
          </Text>
          <TextInput
            style={{
              borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
              backgroundColor: Colors.bgCard, paddingHorizontal: 14, paddingVertical: 12,
              fontSize: 14, fontWeight: FontWeight.semibold, color: Colors.textPrimary,
              marginBottom: Space.lg,
            }}
            value={tournamentName}
            onChangeText={setTournamentName}
            placeholder="VD: VĐ Toàn Quốc 2026"
            placeholderTextColor={Colors.textMuted}
          />

          {/* Category */}
          <Text style={{
            fontSize: 11, fontWeight: FontWeight.extrabold, color: Colors.textSecondary,
            textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
          }}>
            Nội dung thi đấu *
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: Space.md }}>
            {CATEGORIES.map(cat => (
              <SelectChip
                key={cat}
                label={cat}
                selected={selectedCategory === cat}
                onPress={() => setSelectedCategory(cat)}
              />
            ))}
          </View>

          {/* Weight class */}
          {selectedCategory.startsWith('Đối kháng') && (
            <>
              <Text style={{
                fontSize: 11, fontWeight: FontWeight.extrabold, color: Colors.textSecondary,
                textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
              }}>
                Hạng cân
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: Space.md }}>
                {WEIGHT_CLASSES.map(w => (
                  <SelectChip
                    key={w}
                    label={w}
                    selected={selectedWeight === w}
                    onPress={() => setSelectedWeight(w)}
                  />
                ))}
              </View>
            </>
          )}

          {/* Notes */}
          <Text style={{
            fontSize: 11, fontWeight: FontWeight.extrabold, color: Colors.textSecondary,
            textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
          }}>
            Ghi chú
          </Text>
          <TextInput
            style={{
              borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
              backgroundColor: Colors.bgCard, paddingHorizontal: 14, paddingVertical: 12,
              fontSize: 14, color: Colors.textPrimary, minHeight: 80,
              textAlignVertical: 'top', marginBottom: Space.lg,
            }}
            value={notes}
            onChangeText={setNotes}
            placeholder="Ghi chú bổ sung (tùy chọn)"
            placeholderTextColor={Colors.textMuted}
            multiline
          />

          {/* Info */}
          <View style={{
            borderRadius: Radius.md, padding: Space.md,
            backgroundColor: Colors.overlay(Colors.accent, 0.06),
            borderWidth: 1, borderColor: Colors.overlay(Colors.accent, 0.12),
            flexDirection: 'row', gap: 8,
          }}>
            <Icon name={VCTIcons.info} size={16} color={Colors.accent} style={{ marginTop: 1 }} />
            <Text style={{ fontSize: 11, color: Colors.textSecondary, lineHeight: 16, flex: 1 }}>
              Đơn đăng ký sẽ được gửi đến Ban tổ chức. Bạn cần hoàn thiện hồ sơ (khám sức khỏe, bảo hiểm, CCCD, ảnh thẻ) trước thời hạn.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}
