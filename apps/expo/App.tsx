import { NavigationContainer } from '@react-navigation/native'
import * as Linking from 'expo-linking'
import { useMemo } from 'react'
import { NativeNavigation } from 'app/navigation/native'
import { Provider } from 'app/provider'
import { MobileThemeProvider } from 'app/features/mobile/mobile-theme'
import { MOBILE_ROUTE_REGISTRY } from 'app/features/mobile/mobile-routes'

export default function App() {
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
    <MobileThemeProvider>
      <Provider>
        <NavigationContainer linking={linkingConfig}>
          <NativeNavigation />
        </NavigationContainer>
      </Provider>
    </MobileThemeProvider>
  )
}
