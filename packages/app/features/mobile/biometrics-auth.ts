// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Biometrics Auth
// FaceID / TouchID / Android Fingerprint integration for
// fast relogin and securing sensitive actions (like grading).
// ═══════════════════════════════════════════════════════════════

import { Platform } from 'react-native'

// ── Types ────────────────────────────────────────────────────

export interface BiometricStatus {
  hasHardware: boolean
  isEnrolled: boolean
  types: ('fingerprint' | 'facial' | 'iris' | 'unknown')[]
}

export interface BiometricAuthOptions {
  promptMessage?: string
  cancelLabel?: string
  fallbackLabel?: string
  disableDeviceFallback?: boolean
}

// ── Service ──────────────────────────────────────────────────

class BiometricsManager {
  private _expoAuth: typeof import('expo-local-authentication') | null = null

  private async _getModule() {
    if (!this._expoAuth) {
      this._expoAuth = await import('expo-local-authentication')
    }
    return this._expoAuth
  }

  /**
   * Check if biometrics are available on this device.
   */
  async checkAvailability(): Promise<BiometricStatus> {
    try {
      const LocalAuth = await this._getModule()
      
      const hasHardware = await LocalAuth.hasHardwareAsync()
      const isEnrolled = await LocalAuth.isEnrolledAsync()
      const typeList = await LocalAuth.supportedAuthenticationTypesAsync()

      // Map primitive enum to strings
      const types = typeList.map((t) => {
        if (t === LocalAuth.AuthenticationType.FINGERPRINT) return 'fingerprint'
        if (t === LocalAuth.AuthenticationType.FACIAL_RECOGNITION) return 'facial'
        if (t === LocalAuth.AuthenticationType.IRIS) return 'iris'
        return 'unknown'
      })

      return {
        hasHardware,
        isEnrolled,
        types: types as BiometricStatus['types'],
      }
    } catch {
      return { hasHardware: false, isEnrolled: false, types: [] }
    }
  }

  /**
   * Prompt the user to authenticate using biometrics.
   *
   * @param options Customization for the prompt dialog
   * @returns true if authenticated successfully, false otherwise
   */
  async authenticate(options?: BiometricAuthOptions): Promise<boolean> {
    try {
      const status = await this.checkAvailability()
      if (!status.hasHardware || !status.isEnrolled) {
        return false
      }

      const LocalAuth = await this._getModule()
      
      let promptMessage = options?.promptMessage ?? 'Xác thực để tiếp tục'
      if (status.types.includes('facial')) promptMessage = 'Sử dụng Face ID để tiếp tục'
      else if (status.types.includes('fingerprint')) promptMessage = 'Sử dụng Vân tay để tiếp tục'

      const result = await LocalAuth.authenticateAsync({
        promptMessage,
        cancelLabel: options?.cancelLabel ?? 'Hủy',
        fallbackLabel: options?.fallbackLabel ?? 'Dùng mật khẩu',
        disableDeviceFallback: options?.disableDeviceFallback ?? false,
      })

      return result.success

    } catch (err) {
      return false
    }
  }

  /**
   * Quick check for specific type visually
   */
  async getPreferredIcon(): Promise<'faceid' | 'touchid' | 'lock'> {
    const status = await this.checkAvailability()
    if (!status.hasHardware || !status.isEnrolled) return 'lock'
    
    if (Platform.OS === 'ios') {
      return status.types.includes('facial') ? 'faceid' : 'touchid'
    } else {
      // Android generic fingerprint
      return status.types.includes('fingerprint') ? 'touchid' : 'faceid'
    }
  }
}

// ── Singleton ────────────────────────────────────────────────

export const biometrics = new BiometricsManager()
