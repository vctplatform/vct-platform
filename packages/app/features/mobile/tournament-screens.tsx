import * as React from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import {
  repositories,
  type RefereeAssignmentRecord,
  type ResultRecord,
  type TournamentConfigRecord,
  useEntityCollection,
} from '../data/repository'
import type {
  CanKy,
  DangKy,
  DonVi,
  KhieuNai,
  LichThiDau,
  LuotThiQuyen,
  SanDau,
  TranDauDK,
  TrongTai,
  VanDongVien,
} from '../data/types'

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
  stateBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  stateText: {
    fontSize: 13,
    color: '#334155',
    textAlign: 'center',
  },
  stateButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0ea5e9',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  stateButtonLabel: {
    color: '#0ea5e9',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 24,
    gap: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#bae6fd',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369a1',
  },
  cardHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  helperCard: {
    backgroundColor: '#f8fafc',
    borderStyle: 'dashed',
  },
})

const formatStateLabel = (value: string) => value.replace(/_/g, ' ')

const RowCard = React.memo(function RowCard({
  title,
  meta,
  extra,
  badge,
}: {
  title: string
  meta: string
  extra?: string
  badge?: string
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={styles.rowMeta}>{meta}</Text>
      {extra ? <Text style={styles.cardHint}>{extra}</Text> : null}
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </View>
  )
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

const EmptyState = ({
  message,
  onReload,
}: {
  message: string
  onReload: () => void
}) => (
  <View style={styles.stateBox}>
    <Text style={styles.stateText}>{message}</Text>
    <Pressable onPress={onReload} style={styles.stateButton}>
      <Text style={styles.stateButtonLabel}>Tải lại</Text>
    </Pressable>
  </View>
)

function ModuleList<T extends { id: string }>({
  title,
  subtitle,
  data,
  loading,
  error,
  onReload,
  emptyMessage,
  renderRow,
}: {
  title: string
  subtitle: string
  data: T[]
  loading: boolean
  error: string | null
  onReload: () => void
  emptyMessage: string
  renderRow: (item: T) => React.ReactElement
}) {
  const renderItem = React.useCallback(
    ({ item }: { item: T }) => renderRow(item),
    [renderRow]
  )

  return (
    <View style={styles.page}>
      <ModuleHeader title={title} subtitle={subtitle} />

      {error && (
        <View
          style={[
            styles.stateBox,
            { borderColor: '#fecaca', backgroundColor: '#fef2f2' },
          ]}
        >
          <Text style={[styles.stateText, { color: '#b91c1c' }]}>
            Không thể tải dữ liệu: {error}
          </Text>
          <Pressable onPress={onReload} style={styles.stateButton}>
            <Text style={styles.stateButtonLabel}>Thử lại</Text>
          </Pressable>
        </View>
      )}

      {loading && data.length === 0 ? (
        <View style={styles.stateBox}>
          <ActivityIndicator size="small" color="#0ea5e9" />
          <Text style={styles.stateText}>Đang tải dữ liệu...</Text>
        </View>
      ) : data.length === 0 ? (
        <EmptyState message={emptyMessage} onReload={onReload} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          refreshing={loading}
          onRefresh={onReload}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  )
}

export function TeamsMobileScreen() {
  const { items, uiState, load } = useEntityCollection<DonVi>(repositories.teams.mock)
  const renderRow = React.useCallback(
    (item: DonVi) => (
      <RowCard
        title={item.ten}
        meta={`${item.tinh} • ${item.so_vdv} VĐV • ${item.hlv} HLV`}
        extra={`Trưởng đoàn: ${item.truong_doan}`}
        badge={formatStateLabel(item.trang_thai)}
      />
    ),
    []
  )

  return (
    <ModuleList
      title="Đơn vị tham gia"
      subtitle={`${items.length} đơn vị đã đăng ký`}
      data={items}
      loading={uiState.loading}
      error={uiState.error}
      onReload={() => void load()}
      emptyMessage="Chưa có đơn vị nào."
      renderRow={renderRow}
    />
  )
}

export function AthletesMobileScreen() {
  const { items, uiState, load } = useEntityCollection<VanDongVien>(
    repositories.athletes.mock
  )
  const renderRow = React.useCallback(
    (item: VanDongVien) => (
      <RowCard
        title={item.ho_ten}
        meta={`${item.doan_ten} • ${item.can_nang}kg • ${item.chieu_cao}cm`}
        extra={`Nội dung: ${item.nd_quyen.length} quyền, ${item.nd_dk}`}
        badge={formatStateLabel(item.trang_thai)}
      />
    ),
    []
  )

  return (
    <ModuleList
      title="Vận động viên"
      subtitle={`${items.length} hồ sơ vận động viên`}
      data={items}
      loading={uiState.loading}
      error={uiState.error}
      onReload={() => void load()}
      emptyMessage="Chưa có hồ sơ vận động viên."
      renderRow={renderRow}
    />
  )
}

export function RegistrationMobileScreen() {
  const { items, uiState, load } = useEntityCollection<DangKy>(
    repositories.registration.mock
  )
  const renderRow = React.useCallback(
    (item: DangKy) => (
      <RowCard
        title={item.vdv_ten}
        meta={`${item.nd_ten} • ${item.doan_ten}`}
        extra={`Ngày đăng ký: ${item.ngay}`}
        badge={formatStateLabel(item.trang_thai)}
      />
    ),
    []
  )

  return (
    <ModuleList
      title="Đăng ký nội dung"
      subtitle={`${items.length} lượt đăng ký`}
      data={items}
      loading={uiState.loading}
      error={uiState.error}
      onReload={() => void load()}
      emptyMessage="Chưa có lượt đăng ký."
      renderRow={renderRow}
    />
  )
}

export function ResultsMobileScreen() {
  const { items, uiState, load } = useEntityCollection<ResultRecord>(
    repositories.results.mock
  )
  const renderRow = React.useCallback(
    (item: ResultRecord) => (
      <RowCard
        title={item.noi_dung}
        meta={`${item.vdv_ten} • ${item.doan} • ${item.ket_qua}`}
        extra={`Điểm: ${item.diem}`}
        badge={item.huy_chuong || item.loai}
      />
    ),
    []
  )

  return (
    <ModuleList
      title="Kết quả thi đấu"
      subtitle={`${items.length} kết quả đã ghi nhận`}
      data={items}
      loading={uiState.loading}
      error={uiState.error}
      onReload={() => void load()}
      emptyMessage="Chưa có kết quả nào."
      renderRow={renderRow}
    />
  )
}

export function ScheduleMobileScreen() {
  const { items, uiState, load } = useEntityCollection<LichThiDau>(
    repositories.schedule.mock
  )
  const renderRow = React.useCallback(
    (item: LichThiDau) => (
      <RowCard
        title={`${item.ngay} • ${item.phien}`}
        meta={`${item.noi_dung} • ${item.san_id}`}
        extra={`${item.gio_bat_dau} - ${item.gio_ket_thuc} • ${item.so_tran} trận`}
        badge={formatStateLabel(item.trang_thai)}
      />
    ),
    []
  )

  return (
    <ModuleList
      title="Lịch thi đấu"
      subtitle={`${items.length} phiên thi đấu`}
      data={items}
      loading={uiState.loading}
      error={uiState.error}
      onReload={() => void load()}
      emptyMessage="Chưa có lịch thi đấu."
      renderRow={renderRow}
    />
  )
}

export function RefereesMobileScreen() {
  const { items, uiState, load } = useEntityCollection<TrongTai>(
    repositories.referees.mock
  )
  const renderRow = React.useCallback(
    (item: TrongTai) => (
      <RowCard
        title={item.ho_ten}
        meta={`${item.cap_bac} • ${item.chuyen_mon} • ${item.don_vi}`}
        extra={item.kinh_nghiem}
        badge={formatStateLabel(item.trang_thai)}
      />
    ),
    []
  )

  return (
    <ModuleList
      title="Trọng tài"
      subtitle={`${items.length} hồ sơ trọng tài`}
      data={items}
      loading={uiState.loading}
      error={uiState.error}
      onReload={() => void load()}
      emptyMessage="Chưa có dữ liệu trọng tài."
      renderRow={renderRow}
    />
  )
}

export function ArenasMobileScreen() {
  const { items, uiState, load } = useEntityCollection<SanDau>(repositories.arenas.mock)
  const renderRow = React.useCallback(
    (item: SanDau) => (
      <RowCard
        title={`${item.ten} • ${item.vi_tri}`}
        meta={`${item.loai} • ${item.kich_thuoc} • ${item.phu_trach}`}
        extra={`Năng lực: ${item.capacity} chỗ • Đã xong ${item.done_today}/${item.total_today} trận`}
        badge={formatStateLabel(item.trang_thai)}
      />
    ),
    []
  )

  return (
    <ModuleList
      title="Sàn đấu"
      subtitle={`${items.length} sàn đang vận hành`}
      data={items}
      loading={uiState.loading}
      error={uiState.error}
      onReload={() => void load()}
      emptyMessage="Chưa có dữ liệu sàn đấu."
      renderRow={renderRow}
    />
  )
}

export function AppealsMobileScreen() {
  const { items, uiState, load } = useEntityCollection<KhieuNai>(
    repositories.appeals.mock
  )
  const renderRow = React.useCallback(
    (item: KhieuNai) => (
      <RowCard
        title={`${item.doan_ten} • ${item.loai}`}
        meta={item.noi_dung_lien_quan}
        extra={item.ly_do}
        badge={formatStateLabel(item.trang_thai)}
      />
    ),
    []
  )

  return (
    <ModuleList
      title="Khiếu nại & Kháng nghị"
      subtitle={`${items.length} hồ sơ đang theo dõi`}
      data={items}
      loading={uiState.loading}
      error={uiState.error}
      onReload={() => void load()}
      emptyMessage="Chưa có hồ sơ khiếu nại."
      renderRow={renderRow}
    />
  )
}

export function WeighInMobileScreen() {
  const { items, uiState, load } = useEntityCollection<CanKy>(repositories.weighIns.mock)
  const renderRow = React.useCallback(
    (item: CanKy) => (
      <RowCard
        title={item.vdv_ten}
        meta={`${item.doan_ten} • ${item.hang_can_dk} • ${item.can_thuc_te || '-'}kg`}
        extra={item.thoi_gian ? `Cân lúc ${item.thoi_gian}` : 'Chưa thực hiện cân'}
        badge={formatStateLabel(item.ket_qua)}
      />
    ),
    []
  )

  return (
    <ModuleList
      title="Cân ký"
      subtitle={`${items.length} bản ghi cân`}
      data={items}
      loading={uiState.loading}
      error={uiState.error}
      onReload={() => void load()}
      emptyMessage="Chưa có dữ liệu cân ký."
      renderRow={renderRow}
    />
  )
}

export function CombatMobileScreen() {
  const { items, uiState, load } = useEntityCollection<TranDauDK>(
    repositories.combatMatches.mock
  )
  const renderRow = React.useCallback(
    (item: TranDauDK) => (
      <RowCard
        title={`${item.vdv_do.ten} vs ${item.vdv_xanh.ten}`}
        meta={`${item.hang_can} • ${item.vong} • Sàn ${item.san_id}`}
        extra={`Tỷ số ${item.diem_do}:${item.diem_xanh} • Hiệp ${item.hiep}`}
        badge={formatStateLabel(item.trang_thai)}
      />
    ),
    []
  )

  return (
    <ModuleList
      title="Điều hành đối kháng"
      subtitle={`${items.length} trận đang quản lý`}
      data={items}
      loading={uiState.loading}
      error={uiState.error}
      onReload={() => void load()}
      emptyMessage="Chưa có dữ liệu trận đối kháng."
      renderRow={renderRow}
    />
  )
}

export function FormsMobileScreen() {
  const { items, uiState, load } = useEntityCollection<LuotThiQuyen>(
    repositories.formPerformances.mock
  )
  const renderRow = React.useCallback(
    (item: LuotThiQuyen) => (
      <RowCard
        title={`${item.vdv_ten} • ${item.noi_dung}`}
        meta={`${item.doan_ten} • Sàn ${item.san_id} • ${item.lua_tuoi}`}
        extra={
          item.diem.length > 0
            ? `Điểm TB ${item.diem_tb} • Xếp hạng ${item.xep_hang}`
            : 'Chưa có điểm chấm'
        }
        badge={formatStateLabel(item.trang_thai)}
      />
    ),
    []
  )

  return (
    <ModuleList
      title="Điều hành quyền"
      subtitle={`${items.length} lượt thi quyền`}
      data={items}
      loading={uiState.loading}
      error={uiState.error}
      onReload={() => void load()}
      emptyMessage="Chưa có dữ liệu thi quyền."
      renderRow={renderRow}
    />
  )
}

export function RefereeAssignmentsMobileScreen() {
  const { items, uiState, load } = useEntityCollection<RefereeAssignmentRecord>(
    repositories.refereeAssignments.mock
  )
  const renderRow = React.useCallback(
    (item: RefereeAssignmentRecord) => (
      <RowCard
        title={`Trọng tài ${item.tt_id} • Sàn ${item.san_id}`}
        meta={`${item.ngay} • ${item.phien}`}
        extra={`Vai trò: ${item.vai_tro}`}
      />
    ),
    []
  )

  return (
    <ModuleList
      title="Phân công trọng tài"
      subtitle={`${items.length} phân công đang có`}
      data={items}
      loading={uiState.loading}
      error={uiState.error}
      onReload={() => void load()}
      emptyMessage="Chưa có phân công nào."
      renderRow={renderRow}
    />
  )
}

export function TournamentConfigMobileScreen() {
  const { items, uiState, load } = useEntityCollection<TournamentConfigRecord>(
    repositories.tournamentConfig.mock
  )
  const renderRow = React.useCallback(
    (item: TournamentConfigRecord) => (
      <RowCard
        title={item.ten_giai}
        meta={`${item.ma_giai} • ${item.cap_do} • ${item.trang_thai}`}
        extra={`${item.ngay_bat_dau} - ${item.ngay_ket_thuc} • ${item.dia_diem}`}
      />
    ),
    []
  )

  return (
    <ModuleList
      title="Thông tin giải"
      subtitle={`${items.length} cấu hình giải`}
      data={items}
      loading={uiState.loading}
      error={uiState.error}
      onReload={() => void load()}
      emptyMessage="Chưa có cấu hình giải."
      renderRow={renderRow}
    />
  )
}

export function MobileModuleOverviewScreen({
  title,
  subtitle,
  webPath,
}: {
  title: string
  subtitle: string
  webPath: string
}) {
  return (
    <View style={styles.page}>
      <ModuleHeader title={title} subtitle={subtitle} />
      <View style={styles.card}>
        <Text style={styles.rowTitle}>Module đã mở trên mobile</Text>
        <Text style={styles.rowMeta}>
          Màn hình nghiệp vụ này đã được định tuyến cho mobile theo role.
        </Text>
        <Text style={styles.cardHint}>
          Đường dẫn web tương ứng: {webPath}
        </Text>
      </View>
      <View style={[styles.card, styles.helperCard]}>
        <Text style={styles.rowTitle}>Gợi ý tác nghiệp</Text>
        <Text style={styles.rowMeta}>1. Theo dõi thông báo từ trung tâm điều hành</Text>
        <Text style={styles.rowMeta}>2. Dùng các module dữ liệu để cập nhật realtime</Text>
        <Text style={styles.rowMeta}>3. Mở web app để thao tác nghiệp vụ nâng cao</Text>
      </View>
    </View>
  )
}

export function AccessDeniedMobileScreen() {
  return (
    <View style={styles.page}>
      <View
        style={[
          styles.stateBox,
          { borderColor: '#fecaca', backgroundColor: '#fef2f2' },
        ]}
      >
        <Text style={[styles.rowTitle, { color: '#991b1b' }]}>
          Không có quyền truy cập màn này
        </Text>
        <Text style={[styles.stateText, { color: '#b91c1c' }]}>
          Hãy đổi role phù hợp ở trang chủ hoặc quay về module được cấp quyền.
        </Text>
      </View>
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
