import { NavigationContainer } from '@react-navigation/native'
import * as Linking from 'expo-linking'
import type { ReactNode } from 'react'
import { useMemo } from 'react'

export function NavigationProvider({
  children,
}: {
  children: ReactNode
}) {
  return (
    <NavigationContainer
      linking={useMemo(
        () => ({
          prefixes: [Linking.createURL('/')],
          config: {
            screens: {
              home: '',
              teams: 'teams',
              athletes: 'athletes',
              registration: 'registration',
              results: 'results',
              schedule: 'schedule',
              'user-detail': 'users/:id',
            },
          },
        }),
        []
      )}
    >
      {children}
    </NavigationContainer>
  )
}
