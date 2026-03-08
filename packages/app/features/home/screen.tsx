import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'solito/navigation'
import { MobileModuleCard } from '../mobile/tournament-screens'

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  content: {
    padding: 16,
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 6,
  },
})

export function HomeScreen() {
  const router = useRouter()

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View>
        <Text style={styles.title}>VCT Platform</Text>
        <Text style={styles.subtitle}>
          Điều hướng nhanh các module chính trên mobile
        </Text>
      </View>

      <MobileModuleCard
        title="Đơn vị tham gia"
        subtitle="Theo dõi đoàn và trạng thái xác nhận"
        onPress={() => router.push('/teams')}
      />
      <MobileModuleCard
        title="Vận động viên"
        subtitle="Danh sách hồ sơ vận động viên"
        onPress={() => router.push('/athletes')}
      />
      <MobileModuleCard
        title="Đăng ký nội dung"
        subtitle="Kiểm tra và duyệt đăng ký thi đấu"
        onPress={() => router.push('/registration')}
      />
      <MobileModuleCard
        title="Kết quả"
        subtitle="Theo dõi kết quả thi đấu gần nhất"
        onPress={() => router.push('/results')}
      />
      <MobileModuleCard
        title="Lịch thi đấu"
        subtitle="Lịch theo ngày và phiên đấu"
        onPress={() => router.push('/schedule')}
      />
    </ScrollView>
  )
}
