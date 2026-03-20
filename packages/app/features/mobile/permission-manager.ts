// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Permission Manager
// Unified permission handling for camera, location, notifications,
// and media library with Vietnamese user-facing explanations.
// ═══════════════════════════════════════════════════════════════

import { Alert, Linking, Platform } from 'react-native'
import { useState, useCallback } from 'react'

// ── Types ────────────────────────────────────────────────────

export type Permission =
  | 'camera'
  | 'photoLibrary'
  | 'location'
  | 'notifications'
  | 'microphone'

export type PermissionStatus = 'granted' | 'denied' | 'undetermined' | 'restricted'

export interface PermissionInfo {
  status: PermissionStatus
  canAskAgain: boolean
}

export interface PermissionConfig {
  /** Vietnamese explanation shown before asking */
  rationale: string
  /** What feature needs this permission */
  feature: string
  /** Expo module to check/request */
  module: string
}

// ── Permission Descriptions ──────────────────────────────────

const PERMISSION_CONFIG: Record<Permission, PermissionConfig> = {
  camera: {
    rationale: 'Ứng dụng cần quyền truy cập camera để chụp ảnh hồ sơ VĐV và tài liệu.',
    feature: 'Chụp ảnh hồ sơ',
    module: 'expo-camera',
  },
  photoLibrary: {
    rationale: 'Ứng dụng cần quyền truy cập thư viện ảnh để tải lên ảnh hồ sơ và tài liệu.',
    feature: 'Tải ảnh lên',
    module: 'expo-image-picker',
  },
  location: {
    rationale: 'Ứng dụng cần vị trí để tìm giải đấu và câu lạc bộ gần bạn.',
    feature: 'Tìm giải đấu gần',
    module: 'expo-location',
  },
  notifications: {
    rationale: 'Ứng dụng cần quyền thông báo để gửi cập nhật về giải đấu, kết quả và lịch thi đấu.',
    feature: 'Thông báo giải đấu',
    module: 'expo-notifications',
  },
  microphone: {
    rationale: 'Ứng dụng cần quyền micro để ghi âm trong quá trình phản đối kết quả.',
    feature: 'Ghi âm phản đối',
    module: 'expo-av',
  },
}

// ── Permission Manager ───────────────────────────────────────

class PermissionManager {
  /**
   * Check permission status without requesting.
   */
  async check(permission: Permission): Promise<PermissionInfo> {
    try {
      switch (permission) {
        case 'camera': {
          const mod = await import('expo-camera')
          const result = await mod.Camera.getCameraPermissionsAsync()
          return this._mapStatus(result)
        }
        case 'photoLibrary': {
          const mod = await import('expo-image-picker')
          const result = await mod.getMediaLibraryPermissionsAsync()
          return this._mapStatus(result)
        }
        case 'location': {
          const mod = await import('expo-location')
          const result = await mod.getForegroundPermissionsAsync()
          return this._mapStatus(result)
        }
        case 'notifications': {
          const mod = await import('expo-notifications')
          const result = await mod.getPermissionsAsync()
          return this._mapStatus(result)
        }
        case 'microphone': {
          const mod = await import('expo-av')
          const result = await mod.Audio.getPermissionsAsync()
          return this._mapStatus(result)
        }
      }
    } catch {
      return { status: 'undetermined', canAskAgain: true }
    }
  }

  /**
   * Request permission with Vietnamese rationale.
   * Shows explanation alert before first request.
   */
  async request(permission: Permission): Promise<PermissionStatus> {
    const current = await this.check(permission)

    // Already granted
    if (current.status === 'granted') return 'granted'

    // Can't ask again — open settings
    if (!current.canAskAgain && current.status === 'denied') {
      this._showSettingsAlert(permission)
      return 'denied'
    }

    // Show rationale first
    const config = PERMISSION_CONFIG[permission]
    const proceed = await this._showRationale(config)
    if (!proceed) return 'denied'

    // Actually request
    try {
      return await this._doRequest(permission)
    } catch {
      return 'denied'
    }
  }

  /**
   * Check multiple permissions at once.
   */
  async checkAll(permissions: Permission[]): Promise<Record<Permission, PermissionInfo>> {
    const results = {} as Record<Permission, PermissionInfo>
    await Promise.all(
      permissions.map(async (p) => {
        results[p] = await this.check(p)
      }),
    )
    return results
  }

  /**
   * Open system settings for the app.
   */
  openSettings(): void {
    Linking.openSettings()
  }

  // ── Private ──────────────────────────────────────────────

  private _mapStatus(result: { status: string; canAskAgain?: boolean }): PermissionInfo {
    let status: PermissionStatus = 'undetermined'
    if (result.status === 'granted') status = 'granted'
    else if (result.status === 'denied') status = 'denied'
    return { status, canAskAgain: result.canAskAgain ?? true }
  }

  private _showRationale(config: PermissionConfig): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        config.feature,
        config.rationale,
        [
          { text: 'Không', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Cho phép', onPress: () => resolve(true) },
        ],
      )
    })
  }

  private _showSettingsAlert(permission: Permission): void {
    const config = PERMISSION_CONFIG[permission]
    Alert.alert(
      'Cần cấp quyền',
      `${config.rationale}\n\nVui lòng mở Cài đặt để cấp quyền.`,
      [
        { text: 'Để sau', style: 'cancel' },
        { text: 'Mở Cài đặt', onPress: () => Linking.openSettings() },
      ],
    )
  }

  private async _doRequest(permission: Permission): Promise<PermissionStatus> {
    switch (permission) {
      case 'camera': {
        const mod = await import('expo-camera')
        const r = await mod.Camera.requestCameraPermissionsAsync()
        return r.status === 'granted' ? 'granted' : 'denied'
      }
      case 'photoLibrary': {
        const mod = await import('expo-image-picker')
        const r = await mod.requestMediaLibraryPermissionsAsync()
        return r.status === 'granted' ? 'granted' : 'denied'
      }
      case 'location': {
        const mod = await import('expo-location')
        const r = await mod.requestForegroundPermissionsAsync()
        return r.status === 'granted' ? 'granted' : 'denied'
      }
      case 'notifications': {
        const mod = await import('expo-notifications')
        const r = await mod.requestPermissionsAsync()
        return r.status === 'granted' ? 'granted' : 'denied'
      }
      case 'microphone': {
        const mod = await import('expo-av')
        const r = await mod.Audio.requestPermissionsAsync()
        return r.status === 'granted' ? 'granted' : 'denied'
      }
    }
  }
}

// ── Singleton ────────────────────────────────────────────────

export const permissionManager = new PermissionManager()

// ── React Hook ───────────────────────────────────────────────

/**
 * Hook for permission handling in components.
 *
 * @example
 * ```tsx
 * function PhotoUploadButton() {
 *   const { status, request, isGranted } = usePermission('camera')
 *
 *   return (
 *     <Button
 *       title={isGranted ? 'Chụp ảnh' : 'Cấp quyền camera'}
 *       onPress={async () => {
 *         if (!isGranted) await request()
 *         else openCamera()
 *       }}
 *     />
 *   )
 * }
 * ```
 */
export function usePermission(permission: Permission) {
  const [status, setStatus] = useState<PermissionStatus>('undetermined')
  const [loading, setLoading] = useState(false)

  const check = useCallback(async () => {
    const result = await permissionManager.check(permission)
    setStatus(result.status)
    return result.status
  }, [permission])

  const request = useCallback(async () => {
    setLoading(true)
    try {
      const result = await permissionManager.request(permission)
      setStatus(result)
      return result
    } finally {
      setLoading(false)
    }
  }, [permission])

  return {
    status,
    loading,
    isGranted: status === 'granted',
    isDenied: status === 'denied',
    check,
    request,
  }
}
