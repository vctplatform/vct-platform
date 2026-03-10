import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { ComponentType, ReactNode } from 'react'

import { AuthProvider, useAuth } from 'app/features/auth/AuthProvider'
import { HomeScreen } from 'app/features/home/screen'
import { type RouteId } from 'app/features/layout/route-types'
import {
  canAccessMobileRoute,
  MOBILE_ROUTE_REGISTRY,
  type MobileRouteKey,
} from 'app/features/mobile/mobile-routes'
import {
  AccessDeniedMobileScreen,
  AppealsMobileScreen,
  ArenasMobileScreen,
  AthletesMobileScreen,
  CombatMobileScreen,
  FormsMobileScreen,
  MobileOpsBoardScreen,
  RegistrationMobileScreen,
  RefereeAssignmentsMobileScreen,
  RefereesMobileScreen,
  ResultsMobileScreen,
  ScheduleMobileScreen,
  TeamsMobileScreen,
  TournamentConfigMobileScreen,
  WeighInMobileScreen,
} from 'app/features/mobile/tournament-screens'
import { UserDetailScreen } from 'app/features/user/detail-screen'

const Stack = createNativeStackNavigator()

const ROUTE_SCREEN_COMPONENTS: Partial<Record<RouteId, ComponentType>> = {
  teams: TeamsMobileScreen,
  athletes: AthletesMobileScreen,
  registration: RegistrationMobileScreen,
  results: ResultsMobileScreen,
  schedule: ScheduleMobileScreen,
  arenas: ArenasMobileScreen,
  referees: RefereesMobileScreen,
  appeals: AppealsMobileScreen,
  'weigh-in': WeighInMobileScreen,
  combat: CombatMobileScreen,
  forms: FormsMobileScreen,
  'referee-assignments': RefereeAssignmentsMobileScreen,
  'tournament-config': TournamentConfigMobileScreen,
}

function GuardedScreen({
  routeKey,
  children,
}: {
  routeKey: MobileRouteKey
  children: ReactNode
}) {
  const { currentUser } = useAuth()
  if (!canAccessMobileRoute(routeKey, currentUser.role)) {
    return <AccessDeniedMobileScreen />
  }
  return <>{children}</>
}

function renderModuleScreen(route: (typeof MOBILE_ROUTE_REGISTRY)[number]) {
  const RouteScreen = ROUTE_SCREEN_COMPONENTS[route.routeId]

  return (
    <GuardedScreen routeKey={route.key}>
      {RouteScreen ? (
        <RouteScreen />
      ) : (
        <MobileOpsBoardScreen
          routeId={route.routeId}
          title={route.title}
          subtitle={route.subtitle}
          webPath={route.webPath}
        />
      )}
    </GuardedScreen>
  )
}

export function NativeNavigation() {
  return (
    <AuthProvider>
      <Stack.Navigator>
        <Stack.Screen
          name="home"
          component={HomeScreen}
          options={{
            title: 'VCT Platform',
          }}
        />
        {MOBILE_ROUTE_REGISTRY.map((route) => (
          <Stack.Screen key={route.key} name={route.key} options={{ title: route.title }}>
            {() => renderModuleScreen(route)}
          </Stack.Screen>
        ))}
        <Stack.Screen
          name="user-detail"
          component={UserDetailScreen}
          options={{
            title: 'User',
          }}
        />
      </Stack.Navigator>
    </AuthProvider>
  )
}
