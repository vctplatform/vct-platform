import * as React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Pressable, View } from 'react-native'
import { useRouter } from 'solito/navigation'
import { useAuth } from '../../features/auth/AuthProvider'
import { Icon, VCTIcons } from '../../features/mobile/icons'
import { Colors, FontWeight } from '../../features/mobile/mobile-theme'
import { hapticLight } from '../../features/mobile/haptics'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Tab Navigator (v3)
// Role-adaptive tabs: athlete, parent, club_leader/coach, default
// ═══════════════════════════════════════════════════════════════

// -- Lazy imports --
const AthletePortal = React.lazy(() =>
  import('../../features/mobile/athlete/athlete-portal-screen').then(m => ({ default: m.AthletePortalMobileScreen }))
)
const ParentPortal = React.lazy(() =>
  import('../../features/mobile/parent/parent-portal-screen').then(m => ({ default: m.ParentPortalMobileScreen }))
)
const ClubPortal = React.lazy(() =>
  import('../../features/mobile/club/club-portal-screen').then(m => ({ default: m.ClubPortalMobileScreen }))
)
const AthleteTournaments = React.lazy(() =>
  import('../../features/mobile/athlete/athlete-tournaments-screen').then(m => ({ default: m.AthleteTournamentsMobileScreen }))
)
const AthleteTraining = React.lazy(() =>
  import('../../features/mobile/athlete/athlete-training-screen').then(m => ({ default: m.AthleteTrainingMobileScreen }))
)
const ParentChildren = React.lazy(() =>
  import('../../features/mobile/parent/parent-children-screen').then(m => ({ default: m.ParentChildrenMobileScreen }))
)
const ClubMembers = React.lazy(() =>
  import('../../features/mobile/club/club-members-screen').then(m => ({ default: m.ClubMembersMobileScreen }))
)
const BTCPortal = React.lazy(() =>
  import('../../features/mobile/btc/btc-portal-screen').then(m => ({ default: m.BTCPortalMobileScreen }))
)
const BTCRegistrations = React.lazy(() =>
  import('../../features/mobile/btc/btc-registrations-screen').then(m => ({ default: m.BTCRegistrationsMobileScreen }))
)
const BTCSchedule = React.lazy(() =>
  import('../../features/mobile/btc/btc-schedule-screen').then(m => ({ default: m.BTCScheduleMobileScreen }))
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

// Referee
const RefereePortal = React.lazy(() =>
  import('../../features/mobile/referee/referee-portal-screen').then(m => ({ default: m.RefereePortalMobileScreen }))
)
const RefereeSchedule = React.lazy(() =>
  import('../../features/mobile/referee/referee-schedule-screen').then(m => ({ default: m.RefereeScheduleMobileScreen }))
)

// Club
const ClubDelegationPortal = React.lazy(() =>
  import('../../features/mobile/club/club-delegation-portal-screen').then(m => ({ default: m.ClubDelegationPortalMobileScreen }))
)

// Federation
const FederationPortal = React.lazy(() =>
  import('../../features/mobile/federation/federation-portal-screen').then(m => ({ default: m.FederationPortalMobileScreen }))
)

// National Federation
const NationalFederationPortal = React.lazy(() =>
  import('../../features/mobile/national-federation/nf-portal-screen').then(m => ({ default: m.NFPortalMobileScreen }))
)

// Technical Director
const TDPortal = React.lazy(() =>
  import('../../features/mobile/technical-director/td-portal-screen').then(m => ({ default: m.TDPortalMobileScreen }))
)

// Admin Mobile
const AdminPortal = React.lazy(() =>
  import('../../features/mobile/admin-mobile/admin-portal-screen').then(m => ({ default: m.AdminPortalMobileScreen }))
)

// Medical
const MedicalPortal = React.lazy(() =>
  import('../../features/mobile/medical/medical-portal-screen').then(m => ({ default: m.MedicalPortalMobileScreen }))
)
const MedicalIncidents = React.lazy(() =>
  import('../../features/mobile/medical/medical-incidents-screen').then(m => ({ default: m.MedicalIncidentsMobileScreen }))
)

const Tab = createBottomTabNavigator()

function SuspenseWrap({ children }: { children: React.ReactNode }) {
  return <React.Suspense fallback={<View style={{ flex: 1, backgroundColor: Colors.bgBase }} />}>{children}</React.Suspense>
}

/** Notification bell header button */
function NotificationBell() {
  const router = useRouter()
  return (
    <Pressable
      onPress={() => { hapticLight(); router.push('/notifications') }}
      accessibilityRole="button"
      accessibilityLabel="Xem thông báo"
      style={{ width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}
    >
      <Icon name={VCTIcons.notificationsOutline} size={22} color={Colors.textSecondary} />
      <View style={{
        position: 'absolute', top: 8, right: 8,
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: Colors.red, borderWidth: 1.5, borderColor: Colors.bgBase,
      }} />
    </Pressable>
  )
}

// ── Role detection helpers ──
const CLUB_ROLES = ['coach', 'club_leader', 'club_vice_leader', 'club_secretary', 'club_accountant', 'delegate']
const PARENT_ROLES = ['parent']
const BTC_ROLES = ['btc', 'btc_truong', 'btc_member', 'referee_manager']
const REFEREE_ROLES = ['referee']
const MEDICAL_ROLES = ['medical_staff']
const FEDERATION_ROLES = ['provincial_admin', 'federation_president', 'federation_secretary', 'provincial_president', 'provincial_vice_president', 'provincial_secretary', 'provincial_technical_head', 'provincial_referee_head', 'provincial_committee_member', 'provincial_accountant']
const NATIONAL_FEDERATION_ROLES = ['national_admin', 'vvf_president', 'vvf_secretary']
const TD_ROLES = ['technical_director']
const ADMIN_ROLES = ['admin']

function getRoleGroup(role?: string): 'athlete' | 'parent' | 'club' | 'btc' | 'referee' | 'medical' | 'federation' | 'national_federation' | 'td' | 'admin' | 'default' {
  if (!role) return 'default'
  if (ADMIN_ROLES.includes(role)) return 'admin'
  if (PARENT_ROLES.includes(role)) return 'parent'
  if (CLUB_ROLES.includes(role)) return 'club'
  if (BTC_ROLES.includes(role)) return 'btc'
  if (REFEREE_ROLES.includes(role)) return 'referee'
  if (MEDICAL_ROLES.includes(role)) return 'medical'
  if (FEDERATION_ROLES.includes(role)) return 'federation'
  if (NATIONAL_FEDERATION_ROLES.includes(role)) return 'national_federation'
  if (TD_ROLES.includes(role)) return 'td'
  if (role === 'athlete') return 'athlete'
  return 'default'
}

export function TabNavigator() {
  const { currentUser } = useAuth()
  const roleGroup = getRoleGroup(currentUser.role)

  const tabBarStyle = {
    backgroundColor: Colors.bgBase,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 4,
  }
  const headerStyle = {
    backgroundColor: Colors.bgBase,
    shadowColor: 'transparent' as const,
    elevation: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  }

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle,
        tabBarLabelStyle: { fontSize: 10, fontWeight: FontWeight.bold },
        headerStyle,
        headerTitleStyle: { fontSize: 18, fontWeight: FontWeight.black, color: Colors.textPrimary },
        headerRight: () => <NotificationBell />,
      }}
    >
      {/* ── Home Tab (role-adaptive) ── */}
      <Tab.Screen
        name="Home"
        options={{
          title: roleGroup === 'club' ? 'CLB' : roleGroup === 'parent' ? 'Phụ huynh' : roleGroup === 'btc' ? 'BTC' : 'Trang chủ',
          tabBarIcon: ({ color, focused }) => (
            <Icon name={focused ? VCTIcons.home : VCTIcons.homeOutline} size={22} color={color} />
          ),
          tabBarAccessibilityLabel: 'Trang chủ',
        }}
      >
        {() => (
          <SuspenseWrap>
            {roleGroup === 'parent' ? <ParentPortal /> :
             roleGroup === 'club' ? <ClubPortal /> :
             roleGroup === 'btc' ? <BTCPortal /> :
             roleGroup === 'referee' ? <RefereePortal /> :
             roleGroup === 'medical' ? <MedicalPortal /> :
             <AthletePortal />}
          </SuspenseWrap>
        )}
      </Tab.Screen>

      {/* ── Role-specific middle tabs ── */}

      {/* Athlete: Tournaments + Training */}
      {roleGroup === 'athlete' && (
        <Tab.Screen
          name="Tournaments"
          options={{
            title: 'Giải đấu',
            tabBarIcon: ({ color, focused }) => (
              <Icon name={focused ? VCTIcons.trophy : VCTIcons.trophyOutline} size={22} color={color} />
            ),
          }}
        >
          {() => <SuspenseWrap><AthleteTournaments /></SuspenseWrap>}
        </Tab.Screen>
      )}
      {roleGroup === 'athlete' && (
        <Tab.Screen
          name="Training"
          options={{
            title: 'Lịch tập',
            tabBarIcon: ({ color, focused }) => (
              <Icon name={focused ? VCTIcons.calendar : VCTIcons.calendarOutline} size={22} color={color} />
            ),
          }}
        >
          {() => <SuspenseWrap><AthleteTraining /></SuspenseWrap>}
        </Tab.Screen>
      )}

      {/* Parent: Children tab */}
      {roleGroup === 'parent' && (
        <Tab.Screen
          name="Children"
          options={{
            title: 'Con em',
            tabBarIcon: ({ color, focused }) => (
              <Icon name={focused ? VCTIcons.people : VCTIcons.people} size={22} color={color} />
            ),
          }}
        >
          {() => <SuspenseWrap><ParentChildren /></SuspenseWrap>}
        </Tab.Screen>
      )}

      {/* Club: Members tab */}
      {roleGroup === 'club' && (
        <Tab.Screen
          name="Members"
          options={{
            title: 'Thành viên',
            tabBarIcon: ({ color, focused }) => (
              <Icon name={focused ? VCTIcons.people : VCTIcons.people} size={22} color={color} />
            ),
          }}
        >
          {() => <SuspenseWrap><ClubMembers /></SuspenseWrap>}
        </Tab.Screen>
      )}
      {roleGroup === 'club' && (
        <Tab.Screen
          name="Tournaments"
          options={{
            title: 'Giải đấu',
            tabBarIcon: ({ color, focused }) => (
               <Icon name={focused ? VCTIcons.shield : VCTIcons.shield} size={22} color={color} />
            ),
          }}
        >
          {() => <SuspenseWrap><ClubDelegationPortal /></SuspenseWrap>}
        </Tab.Screen>
      )}

      {/* BTC: Registrations + Schedule tabs */}
      {roleGroup === 'btc' && (
        <Tab.Screen
          name="Registrations"
          options={{
            title: 'Đăng ký',
            tabBarIcon: ({ color, focused }) => (
              <Icon name={focused ? VCTIcons.clipboard : VCTIcons.clipboard} size={22} color={color} />
            ),
          }}
        >
          {() => <SuspenseWrap><BTCRegistrations /></SuspenseWrap>}
        </Tab.Screen>
      )}
      {roleGroup === 'btc' && (
        <Tab.Screen
          name="Schedule"
          options={{
            title: 'Lịch thi',
            tabBarIcon: ({ color, focused }) => (
              <Icon name={focused ? VCTIcons.calendar : VCTIcons.calendarOutline} size={22} color={color} />
            ),
          }}
        >
          {() => <SuspenseWrap><BTCSchedule /></SuspenseWrap>}
        </Tab.Screen>
      )}

      {/* Referee: Schedule tab */}
      {roleGroup === 'referee' && (
        <Tab.Screen
          name="RefereeSchedule"
          options={{
            title: 'Lịch làm việc',
            tabBarIcon: ({ color, focused }) => (
              <Icon name={focused ? VCTIcons.calendar : VCTIcons.calendarOutline} size={22} color={color} />
            ),
          }}
        >
          {() => <SuspenseWrap><RefereeSchedule /></SuspenseWrap>}
        </Tab.Screen>
      )}

      {/* Medical: Incidents tab */}
      {roleGroup === 'medical' && (
        <Tab.Screen
          name="MedicalIncidents"
          options={{
            title: 'Sự cố',
            tabBarIcon: ({ color, focused }) => (
              <Icon name={focused ? VCTIcons.alert : VCTIcons.alert} size={22} color={color} />
            ),
          }}
        >
          {() => <SuspenseWrap><MedicalIncidents /></SuspenseWrap>}
        </Tab.Screen>
      )}

      {/* Federation: Portal tab */}
      {roleGroup === 'federation' && (
        <Tab.Screen
          name="Federation"
          options={{
            title: 'Liên đoàn',
            tabBarIcon: ({ color, focused }) => (
              <Icon name={focused ? VCTIcons.globe : VCTIcons.globe} size={22} color={color} />
            ),
          }}
        >
          {() => <SuspenseWrap><FederationPortal /></SuspenseWrap>}
        </Tab.Screen>
      )}

      {/* National Federation: Portal tab */}
      {roleGroup === 'national_federation' && (
        <Tab.Screen
          name="NationalFederation"
          options={{
            title: 'Tổng cục',
            tabBarIcon: ({ color, focused }) => (
              <Icon name={focused ? VCTIcons.shield : VCTIcons.shield} size={22} color={color} />
            ),
          }}
        >
          {() => <SuspenseWrap><NationalFederationPortal /></SuspenseWrap>}
        </Tab.Screen>
      )}

      {/* Technical Director: Portal tab */}
      {roleGroup === 'td' && (
        <Tab.Screen
          name="TechnicalDirector"
          options={{
            title: 'Chuyên môn',
            tabBarIcon: ({ color, focused }) => (
              <Icon name={focused ? VCTIcons.clipboard : VCTIcons.clipboard} size={22} color={color} />
            ),
          }}
        >
          {() => <SuspenseWrap><TDPortal /></SuspenseWrap>}
        </Tab.Screen>
      )}

      {/* Admin: Portal tab */}
      {roleGroup === 'admin' && (
        <Tab.Screen
          name="AdminPortal"
          options={{
            title: 'Hệ thống',
            tabBarIcon: ({ color, focused }) => (
              <Icon name={focused ? VCTIcons.settings : VCTIcons.settingsOutline} size={22} color={color} />
            ),
          }}
        >
          {() => <SuspenseWrap><AdminPortal /></SuspenseWrap>}
        </Tab.Screen>
      )}

      {/* Notifications — shown for non-athletes as tab */}
      {roleGroup !== 'athlete' && roleGroup !== 'btc' && roleGroup !== 'referee' && roleGroup !== 'medical' && roleGroup !== 'federation' && roleGroup !== 'national_federation' && roleGroup !== 'td' && roleGroup !== 'admin' && (
        <Tab.Screen
          name="Notifications"
          options={{
            title: 'Thông báo',
            tabBarIcon: ({ color, focused }) => (
              <Icon name={focused ? VCTIcons.notifications : VCTIcons.notificationsOutline} size={22} color={color} />
            ),
          }}
        >
          {() => <SuspenseWrap><NotificationsScreen /></SuspenseWrap>}
        </Tab.Screen>
      )}

      {/* ── Profile ── */}
      <Tab.Screen
        name="Profile"
        options={{
          title: 'Hồ sơ',
          tabBarIcon: ({ color, focused }) => (
            <Icon name={focused ? VCTIcons.person : VCTIcons.personOutline} size={22} color={color} />
          ),
        }}
      >
        {() => <SuspenseWrap><ProfileScreen /></SuspenseWrap>}
      </Tab.Screen>

      {/* ── Settings ── */}
      <Tab.Screen
        name="Settings"
        options={{
          title: 'Cài đặt',
          tabBarIcon: ({ color, focused }) => (
            <Icon name={focused ? VCTIcons.settings : VCTIcons.settingsOutline} size={22} color={color} />
          ),
        }}
      >
        {() => <SuspenseWrap><SettingsScreen /></SuspenseWrap>}
      </Tab.Screen>
    </Tab.Navigator>
  )
}
