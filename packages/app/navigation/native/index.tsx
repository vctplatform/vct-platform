import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { HomeScreen } from 'app/features/home/screen'
import {
  AthletesMobileScreen,
  RegistrationMobileScreen,
  ResultsMobileScreen,
  ScheduleMobileScreen,
  TeamsMobileScreen,
} from 'app/features/mobile/tournament-screens'
import { UserDetailScreen } from 'app/features/user/detail-screen'

const Stack = createNativeStackNavigator<{
  home: undefined
  teams: undefined
  athletes: undefined
  registration: undefined
  results: undefined
  schedule: undefined
  'user-detail': {
    id: string
  }
}>()

export function NativeNavigation() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="home"
        component={HomeScreen}
        options={{
          title: 'VCT Platform',
        }}
      />
      <Stack.Screen
        name="teams"
        component={TeamsMobileScreen}
        options={{ title: 'Đơn vị tham gia' }}
      />
      <Stack.Screen
        name="athletes"
        component={AthletesMobileScreen}
        options={{ title: 'Vận động viên' }}
      />
      <Stack.Screen
        name="registration"
        component={RegistrationMobileScreen}
        options={{ title: 'Đăng ký nội dung' }}
      />
      <Stack.Screen
        name="results"
        component={ResultsMobileScreen}
        options={{ title: 'Kết quả' }}
      />
      <Stack.Screen
        name="schedule"
        component={ScheduleMobileScreen}
        options={{ title: 'Lịch thi đấu' }}
      />
      <Stack.Screen
        name="user-detail"
        component={UserDetailScreen}
        options={{
          title: 'User',
        }}
      />
    </Stack.Navigator>
  )
}
