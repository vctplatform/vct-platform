import * as React from 'react'
import { useState, useCallback } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { Colors, FontWeight, Radius, Space, Touch } from '../mobile-theme'
import { Icon, VCTIcons } from '../icons'
import { hapticLight, hapticSuccess, hapticError } from '../haptics'
import { useAuth } from '../../auth/AuthProvider'
import { uploadDocument, isApiAvailable } from '../api-client'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Document Upload Modal
// Upload 4 document types: Khám SK, BH, CCCD, Ảnh thẻ
// ═══════════════════════════════════════════════════════════════

interface DocumentUploadModalProps {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
  tournamentEntryId: string
  currentDocs: { kham_sk: boolean; bao_hiem: boolean; cmnd: boolean; anh: boolean }
}

const DOC_TYPES = [
  { key: 'kham_sk', label: 'Giấy khám sức khỏe', icon: VCTIcons.shield, description: 'Giấy khám SK còn hiệu lực trong 6 tháng' },
  { key: 'bao_hiem', label: 'Bảo hiểm y tế', icon: VCTIcons.document, description: 'Thẻ BHYT hoặc bảo hiểm tai nạn' },
  { key: 'cmnd', label: 'CCCD / Định danh', icon: VCTIcons.document, description: 'CCCD mặt trước hoặc Giấy khai sinh' },
  { key: 'anh', label: 'Ảnh thẻ 3×4', icon: VCTIcons.camera, description: 'Ảnh chân dung nền trắng/xanh' },
] as const

export function DocumentUploadModal({
  visible, onClose, onSuccess, tournamentEntryId, currentDocs,
}: DocumentUploadModalProps) {
  const { token } = useAuth()
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const [localDocs, setLocalDocs] = useState(currentDocs)

  React.useEffect(() => { setLocalDocs(currentDocs) }, [currentDocs])

  const handlePickDocument = useCallback((docType: string) => {
    // Cross-platform: use Alert as action sheet for camera/gallery
    Alert.alert(
      'Chọn nguồn',
      'Chọn cách tải ảnh lên',
      [
        {
          text: '📷 Chụp ảnh',
          onPress: () => handleUpload(docType, 'camera'),
        },
        {
          text: '🖼️ Chọn từ thư viện',
          onPress: () => handleUpload(docType, 'gallery'),
        },
        { text: 'Hủy', style: 'cancel' },
      ]
    )
  }, [])

  const handleUpload = useCallback(async (docType: string, _source: 'camera' | 'gallery') => {
    hapticLight()
    setUploadingKey(docType)
    try {
      if (isApiAvailable()) {
        // In production: use expo-image-picker to get fileUri
        // For now: simulate upload success
        await uploadDocument(token, tournamentEntryId, docType, 'file://placeholder', `${docType}.jpg`)
      } else {
        // Mock: simulate delay
        await new Promise(r => setTimeout(r, 1500))
      }
      hapticSuccess()
      setLocalDocs(prev => ({ ...prev, [docType]: true }))
      Alert.alert('Thành công', `Đã tải lên ${DOC_TYPES.find(d => d.key === docType)?.label || docType}`)
    } catch (err: unknown) {
      hapticError()
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể tải lên')
    } finally {
      setUploadingKey(null)
    }
  }, [token, tournamentEntryId])

  const completedCount = Object.values(localDocs).filter(Boolean).length
  const totalCount = Object.keys(localDocs).length

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: Colors.bgBase }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: Space.lg, paddingVertical: Space.md,
          borderBottomWidth: 1, borderBottomColor: Colors.border,
          backgroundColor: Colors.bgCard,
        }}>
          <Pressable onPress={() => { hapticLight(); onClose() }} accessibilityRole="button" accessibilityLabel="Đóng">
            <Text style={{ fontSize: 15, color: Colors.textSecondary, fontWeight: FontWeight.semibold }}>Đóng</Text>
          </Pressable>
          <Text style={{ fontSize: 16, fontWeight: FontWeight.extrabold, color: Colors.textPrimary }} accessibilityRole="header">
            Bổ sung hồ sơ
          </Text>
          <Pressable onPress={() => { onSuccess() }} accessibilityRole="button" accessibilityLabel="Xong">
            <Text style={{ fontSize: 15, fontWeight: FontWeight.extrabold, color: Colors.accent }}>Xong</Text>
          </Pressable>
        </View>

        {/* Progress */}
        <View style={{ padding: Space.lg, paddingBottom: Space.sm }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 8,
          }}>
            <Text style={{ fontSize: 13, fontWeight: FontWeight.bold, color: Colors.textPrimary }}>
              Tiến độ: {completedCount}/{totalCount}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: FontWeight.extrabold, color: completedCount === totalCount ? Colors.green : Colors.gold }}>
              {completedCount === totalCount ? 'Hoàn thành ✓' : `Còn ${totalCount - completedCount} mục`}
            </Text>
          </View>
          <View style={{ height: 6, backgroundColor: Colors.trackBg, borderRadius: 3, overflow: 'hidden' }}>
            <View style={{ height: '100%', borderRadius: 3, width: `${(completedCount / totalCount) * 100}%`, backgroundColor: completedCount === totalCount ? Colors.green : Colors.accent }} />
          </View>
        </View>

        {/* Document list */}
        <ScrollView contentContainerStyle={{ padding: Space.lg, paddingTop: Space.sm }}>
          {DOC_TYPES.map((doc) => {
            const isDone = localDocs[doc.key as keyof typeof localDocs]
            const isUploading = uploadingKey === doc.key
            return (
              <Pressable
                key={doc.key}
                style={{
                  borderRadius: Radius.lg, padding: Space.lg, marginBottom: Space.md,
                  backgroundColor: Colors.bgCard, borderWidth: 1,
                  borderColor: isDone ? Colors.overlay(Colors.green, 0.3) : Colors.border,
                }}
                onPress={() => { if (!isUploading) handlePickDocument(doc.key) }}
                disabled={isUploading}
                accessibilityRole="button"
                accessibilityLabel={`${doc.label}: ${isDone ? 'đã nộp' : 'chưa nộp'}`}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{
                    width: 44, height: 44, borderRadius: 12,
                    backgroundColor: isDone ? Colors.overlay(Colors.green, 0.1) : Colors.overlay(Colors.accent, 0.1),
                    justifyContent: 'center', alignItems: 'center',
                  }}>
                    {isUploading ? (
                      <ActivityIndicator size="small" color={Colors.accent} />
                    ) : isDone ? (
                      <Icon name={VCTIcons.checkmark} size={22} color={Colors.green} />
                    ) : (
                      <Icon name={doc.icon} size={22} color={Colors.accent} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, marginBottom: 2 }}>
                      {doc.label}
                    </Text>
                    <Text style={{ fontSize: 11, color: Colors.textSecondary, lineHeight: 16 }}>
                      {isDone ? 'Đã nộp — nhấn để thay thế' : doc.description}
                    </Text>
                  </View>
                  <View style={{
                    paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.pill,
                    backgroundColor: isDone ? Colors.statusOkBg : Colors.statusWarnBg,
                  }}>
                    <Text style={{
                      fontSize: 10, fontWeight: FontWeight.extrabold,
                      color: isDone ? Colors.statusOkFg : Colors.statusWarnFg,
                    }}>
                      {isDone ? '✓ Đã nộp' : 'Chưa nộp'}
                    </Text>
                  </View>
                </View>
              </Pressable>
            )
          })}

          {/* Info banner */}
          <View style={{
            borderRadius: Radius.md, padding: Space.md, marginTop: Space.sm,
            backgroundColor: Colors.overlay(Colors.accent, 0.06),
            borderWidth: 1, borderColor: Colors.overlay(Colors.accent, 0.12),
            flexDirection: 'row', gap: 8,
          }}>
            <Icon name={VCTIcons.info} size={16} color={Colors.accent} style={{ marginTop: 1 }} />
            <Text style={{ fontSize: 11, color: Colors.textSecondary, lineHeight: 16, flex: 1 }}>
              Hồ sơ cần hoàn thiện trước thời hạn đăng ký giải đấu. Ảnh chụp rõ ràng, không mờ, không cắt góc.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  )
}
