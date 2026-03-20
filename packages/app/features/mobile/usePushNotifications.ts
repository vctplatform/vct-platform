// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Push Notifications Hook
// Expo push notifications: permission, token, and listeners.
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from 'react'
import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'

// ── Configure notification behavior ──────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

// ── Types ────────────────────────────────────────────────────

export interface PushNotificationState {
  /** Expo push token (null if permission denied or not available) */
  pushToken: string | null
  /** Last received notification */
  notification: Notifications.Notification | null
  /** Permission status */
  permissionStatus: 'granted' | 'denied' | 'undetermined' | 'loading'
  /** Request push notification permission */
  requestPermission: () => Promise<boolean>
}

// ── Hook ─────────────────────────────────────────────────────

/**
 * Manages push notification lifecycle:
 * - Request permission on demand
 * - Get Expo push token
 * - Listen for incoming notifications
 * - Handle notification taps (response)
 *
 * @param onNotificationTap - Called when user taps a notification
 *
 * @example
 * ```tsx
 * function App() {
 *   const { pushToken, requestPermission } = usePushNotifications(
 *     (response) => {
 *       const data = response.notification.request.content.data
 *       if (data.type === 'tournament') navigation.navigate('Tournament', { id: data.id })
 *     }
 *   )
 *
 *   useEffect(() => {
 *     if (pushToken) {
 *       // Register token with backend
 *       registerDeviceToken(pushToken)
 *     }
 *   }, [pushToken])
 * }
 * ```
 */
export function usePushNotifications(
  onNotificationTap?: (response: Notifications.NotificationResponse) => void,
): PushNotificationState {
  const [pushToken, setPushToken] = useState<string | null>(null)
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null)
  const [permissionStatus, setPermissionStatus] =
    useState<PushNotificationState['permissionStatus']>('loading')

  const notificationListener = useRef<Notifications.EventSubscription | null>(null)
  const responseListener = useRef<Notifications.EventSubscription | null>(null)

  // Check existing permission on mount
  useEffect(() => {
    Notifications.getPermissionsAsync().then((status) => {
      setPermissionStatus(
        status.granted
          ? 'granted'
          : status.canAskAgain
            ? 'undetermined'
            : 'denied',
      )

      if (status.granted) {
        registerForPushNotifications().then(setPushToken)
      }
    })

    // Listen for incoming notifications (foreground)
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notif) => {
        setNotification(notif)
      })

    // Listen for notification taps
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        onNotificationTap?.(response)
      })

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove()
      }
      if (responseListener.current) {
        responseListener.current.remove()
      }
    }
  }, [onNotificationTap])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!Device.isDevice) {
      console.warn('[Push] Must use physical device for push notifications')
      setPermissionStatus('denied')
      return false
    }

    const { status } = await Notifications.requestPermissionsAsync()
    const granted = status === 'granted'
    setPermissionStatus(granted ? 'granted' : 'denied')

    if (granted) {
      const token = await registerForPushNotifications()
      setPushToken(token)
    }

    return granted
  }, [])

  return {
    pushToken,
    notification,
    permissionStatus,
    requestPermission,
  }
}

// ── Helpers ──────────────────────────────────────────────────

async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Android needs a notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'VCT Platform',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0ea5e9', // VCT cyan accent
      })
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? undefined

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    })

    return tokenData.data
  } catch (error) {
    console.warn('[Push] Failed to get push token:', error)
    return null
  }
}
