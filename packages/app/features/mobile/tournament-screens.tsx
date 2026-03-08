import * as React from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import {
  DANG_KYS,
  DON_VIS,
  LICH_THI_DAUS,
  TRAN_DAUS,
  VAN_DONG_VIENS,
} from '../data/mock-data'

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  rowMeta: {
    fontSize: 12,
    color: '#475569',
  },
})

const ModuleHeader = ({
  title,
  subtitle,
}: {
  title: string
  subtitle: string
}) => (
  <View style={{ marginBottom: 8 }}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.subtitle}>{subtitle}</Text>
  </View>
)

export function TeamsMobileScreen() {
  return (
    <View style={styles.page}>
      <ModuleHeader
        title="Đơn vị tham gia"
        subtitle={`${DON_VIS.length} đơn vị đã đăng ký`}
      />
      <FlatList
        data={DON_VIS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.rowTitle}>{item.ten}</Text>
            <Text style={styles.rowMeta}>
              {item.tinh} • {item.so_vdv} VĐV • {item.trang_thai}
            </Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </View>
  )
}

export function AthletesMobileScreen() {
  return (
    <View style={styles.page}>
      <ModuleHeader
        title="Vận động viên"
        subtitle={`${VAN_DONG_VIENS.length} hồ sơ vận động viên`}
      />
      <FlatList
        data={VAN_DONG_VIENS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.rowTitle}>{item.ho_ten}</Text>
            <Text style={styles.rowMeta}>
              {item.doan_ten} • {item.can_nang}kg • {item.trang_thai}
            </Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </View>
  )
}

export function RegistrationMobileScreen() {
  return (
    <View style={styles.page}>
      <ModuleHeader
        title="Đăng ký nội dung"
        subtitle={`${DANG_KYS.length} lượt đăng ký`}
      />
      <FlatList
        data={DANG_KYS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.rowTitle}>{item.vdv_ten}</Text>
            <Text style={styles.rowMeta}>
              {item.nd_ten} • {item.doan_ten} • {item.trang_thai}
            </Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </View>
  )
}

export function ResultsMobileScreen() {
  const finished = React.useMemo(
    () => TRAN_DAUS.filter((item) => item.trang_thai === 'ket_thuc'),
    []
  )

  return (
    <View style={styles.page}>
      <ModuleHeader
        title="Kết quả thi đấu"
        subtitle={`${finished.length} trận đã hoàn thành`}
      />
      <FlatList
        data={finished}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.rowTitle}>{item.hang_can}</Text>
            <Text style={styles.rowMeta}>
              {item.vdv_do.ten} {item.diem_do}:{item.diem_xanh} {item.vdv_xanh.ten}
            </Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </View>
  )
}

export function ScheduleMobileScreen() {
  return (
    <View style={styles.page}>
      <ModuleHeader
        title="Lịch thi đấu"
        subtitle={`${LICH_THI_DAUS.length} phiên thi đấu`}
      />
      <FlatList
        data={LICH_THI_DAUS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.rowTitle}>
              {item.ngay} • {item.phien}
            </Text>
            <Text style={styles.rowMeta}>
              {item.noi_dung} • {item.san_id} • {item.trang_thai}
            </Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </View>
  )
}

export function MobileModuleCard({
  title,
  subtitle,
  onPress,
}: {
  title: string
  subtitle: string
  onPress: () => void
}) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={styles.rowMeta}>{subtitle}</Text>
    </Pressable>
  )
}
