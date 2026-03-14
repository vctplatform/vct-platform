import * as React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Pressable, View, Text } from 'react-native'
import { useRouter } from 'solito/navigation'
import { useAuth } from '../../features/auth/AuthProvider'
import { Icon, VCTIcons } from '../../features/mobile/icons'
import { Colors, FontWeight, Radius } from '../../features/mobile/mobile-theme'
import { hapticLight } from '../../features/mobile/haptics'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Tab Navigator (v2)
// Role-adaptive tabs with SVG icons + notification bell header
// ═══════════════════════════════════════════════════════════════

// -- Lazy imports (avoid circular deps) --
const HomeScreen = React.lazy(() =>
  import('../../features/mobile/athlete/athlete-portal-screen').then(m => ({ default: m.AthletePortalMobileScreen }))
)
const TournamentsScreen = React.lazy(() =>
  import('../../features/mobile/athlete/athlete-tournaments-screen').then(m => ({ default: m.AthleteTournamentsMobileScreen }))
)
const TrainingScreen = React.lazy(() =>
  import('../../features/mobile/athlete/athlete-training-screen').then(m => ({ default: m.AthleteTrainingMobileScreen }))
)
const ProfileScreen = React.lazy(() =>
  import('../../features/mobile/profile-screen').then(m => ({ default: m.ProfileMobileScreen }))
)
const SettingsScreen = React.lazy(() =>
  import('../../features/mobile/settings-screen').then(m => ({ default: m.SettingsMobileScreen }))
)
const NotificationsScreen = React.lazy(() =>
  import('../../features/mobile/notifications-screen').then(m => ({ default: m.NotificationsMobileScreen }))
)

const Tab = createBottomTabNavigator()

function SuspenseWrap({ children }: { children: React.ReactNode }) {
  return <React.Suspense fallback={<View style={{ flex: 1, backgroundColor: Colors.bgBase }} />}>{children}</React.Suspense>
}

/** Notification bell for header — available on all tabs for athlete */
function NotificationBell() {
  const router = useRouter()
  return (
    <Pressable
      onPress={() => { hapticLight(); router.push('/notifications') }}
      accessibilityRole="button"
      accessibilityLabel="Xem thông báo"
      style={{
        width: 44, height: 44, borderRadius: 22,
        justifyContent: 'center', alignItems: 'center', marginRight: 8,
      }}
    >
      <Icon name={VCTIcons.notificationsOutline} size={22} color={Colors.textSecondary} />
      {/* Unread badge dot */}
      <View style={{
        position: 'absolute', top: 8, right: 8,
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: Colors.red, borderWidth: 1.5, borderColor: Colors.bgBase,
      }} />
    </Pressable>
  )
}

export function TabNavigator() {
  const { currentUser } = useAuth()
  const isAthlete = currentUser.role === 'athlete'

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.bgCard,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 56,
          paddingBottom: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: FontWeight.bold,
        },
        headerStyle: {
          backgroundColor: Colors.bgCard,
          shadowColor: 'transparent',
          elevation: 0,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: FontWeight.black,
          color: Colors.textPrimary,
        },
        headerRight: isAthlete ? () => <NotificationBell /> : undefined,
      }}
    >
      <Tab.Screen
        name="Home"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, focused }) => (
            <Icon name={focused ? VCTIcons.home : VCTIcons.homeOutline} size={22} color={color} />
          ),
          tabBarAccessibilityLabel: 'Trang chủ',
        }}
      >
        {() => <SuspenseWrap><HomeScreen /></SuspenseWrap>}
      </Tab.Screen>

      {isAthlete && (
        <Tab.Screen
          name="Tournaments"
          options={{
            title: 'Giải đấu',
            tabBarIcon: ({ color, focused }) => (
              <Icon name={focused ? VCTIcons.trophy : VCTIcons.trophyOutline} size={22} color={color} />
            ),
            tabBarAccessibilityLabel: 'Giải đấu',
          }}
        >
          {() => <SuspenseWrap><TournamentsScreen /></SuspenseWrap>}
        </Tab.Screen>
      )}

      {isAthlete && (
        <Tab.Screen
          name="Training"
          options={{
            title: 'Lịch tập',
            tabBarIcon: ({ color, focused }) => (
              <Icon name={focused ? VCTIcons.calendar : VCTIcons.calendarOutline} size={22} color={color} />
            ),
            tabBarAccessibilityLabel: 'Lịch tập',
          }}
        >
          {() => <SuspenseWrap><TrainingScreen /></SuspenseWrap>}
        </Tab.Screen>
      )}

      {!isAthlete && (
        <Tab.Screen
          name="Notifications"
          options={{
            title: 'Thông báo',
            tabBarIcon: ({ color, focused }) => (
              <Icon name={focused ? VCTIcons.notifications : VCTIcons.notificationsOutline} size={22} color={color} />
            ),
            tabBarAccessibilityLabel: 'Thông báo',
          }}
        >
          {() => <SuspenseWrap><NotificationsScreen /></SuspenseWrap>}
        </Tab.Screen>
      )}

      <Tab.Screen
        name="Profile"
        options={{
          title: 'Hồ sơ',
          tabBarIcon: ({ color, focused }) => (
            <Icon name={focused ? VCTIcons.person : VCTIcons.personOutline} size={22} color={color} />
          ),
          tabBarAccessibilityLabel: 'Hồ sơ cá nhân',
        }}
      >
        {() => <SuspenseWrap><ProfileScreen /></SuspenseWrap>}
      </Tab.Screen>

      <Tab.Screen
        name="Settings"
        options={{
          title: 'Cài đặt',
          tabBarIcon: ({ color, focused }) => (
            <Icon name={focused ? VCTIcons.settings : VCTIcons.settingsOutline} size={22} color={color} />
          ),
          tabBarAccessibilityLabel: 'Cài đặt ứng dụng',
        }}
      >
        {() => <SuspenseWrap><SettingsScreen /></SuspenseWrap>}
      </Tab.Screen>
    </Tab.Navigator>
  )
}
