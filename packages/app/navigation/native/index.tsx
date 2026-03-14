import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { ComponentType, ReactNode } from 'react'

import { AuthProvider, useAuth } from 'app/features/auth/AuthProvider'
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
import {
  AthletePortalMobileScreen,
  AthleteTournamentsMobileScreen,
  AthleteTrainingMobileScreen,
  AthleteResultsMobileScreen,
  AthleteRankingsMobileScreen,
  AthleteElearningMobileScreen,
  TournamentDetailMobileScreen,
  TrainingDetailMobileScreen,
} from 'app/features/mobile/athlete'
import { LoginMobileScreen } from 'app/features/mobile/login-screen'
import { UserDetailScreen } from 'app/features/user/detail-screen'
import { TabNavigator } from './tab-navigator'

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

/**
 * App content when user is authenticated.
 * Tab navigator is the root, with detail screens pushed on top.
 */
function AuthenticatedStack() {
  return (
    <Stack.Navigator>
      {/* Tab Navigator as main screen */}
      <Stack.Screen
        name="main-tabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />

      {/* MODULE SCREENS — pushed on top of tabs */}
      {MOBILE_ROUTE_REGISTRY.map((route) => (
        <Stack.Screen key={route.key} name={route.key} options={{ title: route.title }}>
          {() => renderModuleScreen(route)}
        </Stack.Screen>
      ))}

      {/* DETAIL SCREENS */}
      <Stack.Screen
        name="user-detail"
        component={UserDetailScreen}
        options={{ title: 'User' }}
      />

      {/* ATHLETE SCREENS */}
      <Stack.Screen
        name="athlete-portal"
        component={AthletePortalMobileScreen}
        options={{ title: 'Cổng VĐV' }}
      />
      <Stack.Screen
        name="athlete-tournaments"
        component={AthleteTournamentsMobileScreen}
        options={{ title: 'Giải đấu' }}
      />
      <Stack.Screen
        name="athlete-training"
        component={AthleteTrainingMobileScreen}
        options={{ title: 'Lịch tập' }}
      />
      <Stack.Screen
        name="athlete-results"
        component={AthleteResultsMobileScreen}
        options={{ title: 'Kết quả' }}
      />
      <Stack.Screen
        name="athlete-rankings"
        component={AthleteRankingsMobileScreen}
        options={{ title: 'Xếp hạng' }}
      />
      <Stack.Screen
        name="athlete-elearning"
        component={AthleteElearningMobileScreen}
        options={{ title: 'E-Learning' }}
      />
      <Stack.Screen
        name="tournament-detail"
        component={TournamentDetailMobileScreen}
        options={{ title: 'Chi tiết giải' }}
      />
      <Stack.Screen
        name="training-detail"
        component={TrainingDetailMobileScreen}
        options={{ title: 'Chi tiết buổi tập' }}
      />
    </Stack.Navigator>
  )
}

/**
 * Root navigation — checks auth state to show Login or main app.
 */
function RootNavigator() {
  const { isAuthenticated } = useAuth()

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="app" component={AuthenticatedStack} />
      ) : (
        <Stack.Screen
          name="login"
          component={LoginMobileScreen}
          options={{ animationTypeForReplace: 'pop' }}
        />
      )}
    </Stack.Navigator>
  )
}

export function NativeNavigation() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  )
}
