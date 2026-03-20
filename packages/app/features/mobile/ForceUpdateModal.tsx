// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Force Update Modal
// Full-screen blocking modal when critical app update is required.
// ═══════════════════════════════════════════════════════════════

import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native'
import type { AppUpdateState } from './useAppUpdate'

interface Props {
  update: AppUpdateState
}

/**
 * Blocking modal that prevents app usage until user updates.
 *
 * @example
 * ```tsx
 * function App() {
 *   const update = useAppUpdate(CONFIG_URL)
 *   if (update.isMandatory && update.updateAvailable) {
 *     return <ForceUpdateModal update={update} />
 *   }
 *   return <MainApp />
 * }
 * ```
 */
export function ForceUpdateModal({ update }: Props) {
  return (
    <Modal
      visible
      animationType="fade"
      transparent={false}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🔄</Text>
          <Text style={styles.title}>Cần cập nhật ứng dụng</Text>
          <Text style={styles.subtitle}>
            {update.message ??
              'Phiên bản ứng dụng của bạn quá cũ. Vui lòng cập nhật để tiếp tục sử dụng.'}
          </Text>

          <View style={styles.versionRow}>
            <View style={styles.versionItem}>
              <Text style={styles.versionLabel}>Hiện tại</Text>
              <Text style={styles.versionValue}>{update.currentVersion}</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
            <View style={styles.versionItem}>
              <Text style={styles.versionLabel}>Mới nhất</Text>
              <Text style={[styles.versionValue, styles.versionNew]}>
                {update.latestVersion ?? '...'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.updateButton}
            onPress={update.openStore}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Cập nhật ứng dụng"
          >
            <Text style={styles.updateButtonText}>CẬP NHẬT NGAY</Text>
          </TouchableOpacity>

          {!update.isMandatory && (
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={update.dismiss}
              accessibilityRole="button"
              accessibilityLabel="Bỏ qua cập nhật"
            >
              <Text style={styles.dismissText}>Để sau</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.footer}>
          VCT Platform v{update.currentVersion}
        </Text>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0b1120',
    padding: 24,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 36,
    alignItems: 'center',
    maxWidth: 380,
    width: '100%',
  },
  emoji: {
    fontSize: 56,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f1f5f9',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 28,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    justifyContent: 'center',
  },
  versionItem: {
    alignItems: 'center',
  },
  versionLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  versionValue: {
    fontSize: 18,
    color: '#cbd5e1',
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  versionNew: {
    color: '#0ea5e9',
  },
  arrow: {
    fontSize: 20,
    color: '#475569',
    fontWeight: '700',
  },
  updateButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 14,
    paddingHorizontal: 36,
    paddingVertical: 16,
    minWidth: 200,
    alignItems: 'center',
    marginBottom: 16,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dismissButton: {
    padding: 12,
  },
  dismissText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    color: '#334155',
    fontSize: 12,
  },
})

export default ForceUpdateModal
