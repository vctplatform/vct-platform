import { NavigationContainer } from '@react-navigation/native'
import * as Linking from 'expo-linking'
import { useEffect, useMemo } from 'react'
import { NativeNavigation } from 'app/navigation/native'
import { Provider } from 'app/provider'
import { MobileThemeProvider } from 'app/features/mobile/mobile-theme'
import { MOBILE_ROUTE_REGISTRY } from 'app/features/mobile/mobile-routes'
import { MobileErrorBoundary } from 'app/features/mobile/MobileErrorBoundary'
import { offlineManager } from 'app/features/mobile/offline'
import { usePushNotifications } from 'app/features/mobile/usePushNotifications'

export default function App() {
  // Initialize offline manager on app startup
  useEffect(() => {
    offlineManager.init()
    return () => offlineManager.destroy()
  }, [])

  // Register push notifications
  const { pushToken } = usePushNotifications((response) => {
    // TODO: Navigate to relevant screen based on notification data
    const data = response.notification.request.content.data
    console.warn('[Push] Tapped notification:', data)
  })

  useEffect(() => {
    if (pushToken) {
      // TODO: Register push token with backend
      console.warn('[Push] Token:', pushToken)
    }
  }, [pushToken])

  const linkingConfig = useMemo(() => {
    const moduleScreens = MOBILE_ROUTE_REGISTRY.reduce<Record<string, string>>(
      (acc, route) => {
        acc[route.key] = route.nativePath
        return acc
      },
      {}
    )

    return {
      prefixes: [Linking.createURL('/')],
      config: {
        screens: {
          home: '',
          ...moduleScreens,
          'user-detail': 'users/:id',
        },
      },
    }
  }, [])

  return (
    <MobileErrorBoundary screenName="Root">
      <MobileThemeProvider>
        <Provider>
          <NavigationContainer linking={linkingConfig}>
            <NativeNavigation />
          </NavigationContainer>
        </Provider>
      </MobileThemeProvider>
    </MobileErrorBoundary>
  )
}

