import * as React from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
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
import type { RouteId } from '../layout/route-types'

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
  boardContent: {
    paddingBottom: 28,
    gap: 10,
  },
  boardSummary: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
  },
  statsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statItem: {
    minWidth: 100,
    flexGrow: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 3,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  statValueWarning: {
    color: '#b45309',
  },
  statValueSuccess: {
    color: '#047857',
  },
  boardSectionTitle: {
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    textTransform: 'uppercase',
  },
  boardLine: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 19,
    marginBottom: 5,
  },
  boardHintBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bae6fd',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  boardHintText: {
    fontSize: 11,
    color: '#0369a1',
  },
})

const formatStateLabel = (value: string) => value.replace(/_/g, ' ')

type OpsStatTone = 'default' | 'warning' | 'success'

interface OpsStat {
  label: string
  value: string
  tone?: OpsStatTone
}

interface MobileOpsPlaybook {
  summary: string
  stats: OpsStat[]
  focus: string[]
  alerts: string[]
}

const DEFAULT_OPS_PLAYBOOK: MobileOpsPlaybook = {
  summary:
    'Module đã sẵn sàng trên mobile để theo dõi vận hành. Có thể mở web app để thao tác nâng cao.',
  stats: [
    { label: 'Trạng thái', value: 'Sẵn sàng', tone: 'success' },
    { label: 'Ưu tiên', value: 'Theo dõi' },
    { label: 'Cập nhật', value: 'Realtime' },
  ],
  focus: [
    'Kiểm tra dữ liệu phát sinh trong ca trực hiện tại.',
    'Đối chiếu thay đổi quan trọng với điều phối viên.',
    'Xác nhận các mốc công việc trước khi khóa ca.',
  ],
  alerts: [
    'Nếu phát hiện lệch dữ liệu, chuyển sang web app để xử lý nghiệp vụ chi tiết.',
  ],
}

const MOBILE_OPS_PLAYBOOKS: Partial<Record<RouteId, MobileOpsPlaybook>> = {
  organizations: {
    summary:
      'Theo dõi trạng thái tổ chức, phân tầng đơn vị và tiến độ duyệt hồ sơ liên đoàn/chi nhánh.',
    stats: [
      { label: 'Đơn vị cấp cao', value: '12' },
      { label: 'Đang chờ duyệt', value: '3', tone: 'warning' },
      { label: 'Đã đồng bộ', value: '100%', tone: 'success' },
    ],
    focus: [
      'Rà soát đơn vị mới đăng ký trong ngày.',
      'Đảm bảo thông tin pháp lý và người đại diện đầy đủ.',
      'Chốt danh sách tổ chức được cấp quyền tác nghiệp.',
    ],
    alerts: ['Bất kỳ thay đổi quyền tổ chức cần có xác nhận của Admin.'],
  },
  clubs: {
    summary:
      'Quản lý danh sách CLB/võ đường, theo dõi hiệu lực hoạt động và mức độ tham gia giải.',
    stats: [
      { label: 'CLB hoạt động', value: '48' },
      { label: 'CLB cần rà soát', value: '5', tone: 'warning' },
      { label: 'Check-in đúng hạn', value: '92%', tone: 'success' },
    ],
    focus: [
      'Xác minh thông tin huấn luyện viên chủ nhiệm.',
      'Theo dõi thiếu hồ sơ định danh CLB.',
      'Đồng bộ lịch sinh hoạt với module đào tạo.',
    ],
    alerts: ['CLB bị khóa trạng thái sẽ không thể đăng ký VĐV mới.'],
  },
  people: {
    summary:
      'Theo dõi nhân sự vận hành giải: cán bộ BTC, hỗ trợ chuyên môn và người dùng nội bộ.',
    stats: [
      { label: 'Nhân sự trực', value: '86' },
      { label: 'Ca còn thiếu', value: '2', tone: 'warning' },
      { label: 'Điểm danh', value: '97%', tone: 'success' },
    ],
    focus: [
      'Kiểm tra phân ca trước giờ thi đấu 30 phút.',
      'Xác nhận danh sách nhân sự thay ca đột xuất.',
      'Đồng bộ quyền truy cập theo vai trò mới.',
    ],
    alerts: ['Không cấp quyền hệ thống nếu thiếu xác thực danh tính.'],
  },
  curriculum: {
    summary: 'Kho giáo trình và bài quyền chuẩn hóa cho công tác huấn luyện toàn hệ thống.',
    stats: [
      { label: 'Giáo trình', value: '24' },
      { label: 'Bản nháp', value: '4', tone: 'warning' },
      { label: 'Đã xuất bản', value: '20', tone: 'success' },
    ],
    focus: [
      'Duyệt phiên bản giáo trình mới theo cấp độ.',
      'Gắn thẻ nội dung cho E-learning.',
      'Rà soát quy chuẩn mô tả kỹ thuật.',
    ],
    alerts: ['Giáo trình chưa xuất bản không hiển thị cho học viên.'],
  },
  techniques: {
    summary: 'Thư viện kỹ thuật, video hướng dẫn và tiêu chí chấm điểm tham chiếu.',
    stats: [
      { label: 'Kỹ thuật', value: '132' },
      { label: 'Chờ kiểm duyệt', value: '9', tone: 'warning' },
      { label: 'Đã chuẩn hóa', value: '89%', tone: 'success' },
    ],
    focus: [
      'Đánh dấu kỹ thuật cốt lõi theo từng đai.',
      'Kiểm tra metadata video trước khi publish.',
      'Đồng bộ thang điểm với module chấm điểm.',
    ],
    alerts: ['Nội dung thiếu nguồn tham chiếu sẽ bị gắn cờ kiểm duyệt.'],
  },
  'training-plans': {
    summary: 'Kế hoạch huấn luyện theo giai đoạn, bám sát mùa giải và lịch thi đấu.',
    stats: [
      { label: 'Kế hoạch', value: '37' },
      { label: 'Trễ tiến độ', value: '6', tone: 'warning' },
      { label: 'Đúng tiến độ', value: '84%', tone: 'success' },
    ],
    focus: [
      'Theo dõi milestone chuẩn bị trước giải.',
      'Tối ưu tải luyện tập theo nhóm tuổi.',
      'Rà soát kế hoạch cá nhân của VĐV trọng điểm.',
    ],
    alerts: ['Kế hoạch quá tải có thể ảnh hưởng kết quả cân ký.'],
  },
  attendance: {
    summary: 'Điểm danh huấn luyện và theo dõi tính chuyên cần của VĐV/HLV.',
    stats: [
      { label: 'Buổi hôm nay', value: '18' },
      { label: 'Vắng bất thường', value: '4', tone: 'warning' },
      { label: 'Tỷ lệ có mặt', value: '95%', tone: 'success' },
    ],
    focus: [
      'Xác nhận danh sách điểm danh theo ca tập.',
      'Cập nhật lý do nghỉ cho VĐV.',
      'Báo cáo tự động cho trưởng bộ môn.',
    ],
    alerts: ['VĐV vắng 3 buổi liên tiếp cần cảnh báo huấn luyện viên.'],
  },
  'belt-exams': {
    summary: 'Quản lý kỳ thi thăng đai, lịch thi, hội đồng và kết quả xét đạt.',
    stats: [
      { label: 'Thí sinh', value: '214' },
      { label: 'Đang xét', value: '18', tone: 'warning' },
      { label: 'Đạt', value: '91%', tone: 'success' },
    ],
    focus: [
      'Đối chiếu điều kiện dự thi theo hồ sơ.',
      'Chốt danh sách hội đồng giám khảo.',
      'Công bố kết quả theo từng đợt thi.',
    ],
    alerts: ['Bắt buộc lưu biên bản hội đồng trước khi công bố.'],
  },
  elearning: {
    summary: 'Theo dõi tiến độ học trực tuyến, nội dung khóa học và mức độ hoàn thành.',
    stats: [
      { label: 'Khóa học', value: '26' },
      { label: 'Bài chưa duyệt', value: '11', tone: 'warning' },
      { label: 'Tỷ lệ hoàn thành', value: '78%', tone: 'success' },
    ],
    focus: [
      'Kiểm tra học phần bắt buộc trước mùa giải.',
      'Gắn bài kiểm tra đánh giá cuối khóa.',
      'Xử lý phản hồi chất lượng nội dung học.',
    ],
    alerts: ['Khóa học chưa publish sẽ không đồng bộ sang app học viên.'],
  },
  rankings: {
    summary: 'Bảng xếp hạng quốc gia theo huy chương, điểm và phong độ thi đấu.',
    stats: [
      { label: 'Đơn vị xếp hạng', value: '64' },
      { label: 'Thay đổi top 10', value: '2', tone: 'warning' },
      { label: 'Đồng bộ mới nhất', value: 'Đã xong', tone: 'success' },
    ],
    focus: [
      'Theo dõi biến động thứ hạng sau mỗi ngày thi.',
      'Đối chiếu điểm xếp hạng với báo cáo tổng hợp.',
      'Chuẩn bị bản công bố truyền thông.',
    ],
    alerts: ['Chỉ công bố BXH khi kết quả đã được BTC xác nhận.'],
  },
  heritage: {
    summary: 'Kho dữ liệu di sản, gia phả võ đường và nội dung bảo tồn văn hóa.',
    stats: [
      { label: 'Hồ sơ di sản', value: '356' },
      { label: 'Cần chuẩn hóa', value: '27', tone: 'warning' },
      { label: 'Số hóa hoàn tất', value: '81%', tone: 'success' },
    ],
    focus: [
      'Rà soát metadata cho tư liệu lịch sử.',
      'Xác minh nguồn gốc gia phả trước khi công bố.',
      'Liên kết dữ liệu với module cộng đồng.',
    ],
    alerts: ['Tư liệu chưa xác thực không được phép xuất bản công khai.'],
  },
  finance: {
    summary: 'Theo dõi giao dịch, phí đăng ký và cân đối ngân sách vận hành giải.',
    stats: [
      { label: 'Thu hôm nay', value: '128M' },
      { label: 'Khoản chờ duyệt', value: '9', tone: 'warning' },
      { label: 'Đối soát', value: '99%', tone: 'success' },
    ],
    focus: [
      'Đối chiếu lệ phí theo từng đoàn.',
      'Gắn chứng từ cho giao dịch lớn.',
      'Rà soát ngân sách theo hạng mục.',
    ],
    alerts: ['Giao dịch bất thường cần lock và yêu cầu xác minh hai bước.'],
  },
  'content-categories': {
    summary: 'Theo dõi danh mục nội dung thi: quyền, đối kháng, nhóm tuổi và tiêu chí.',
    stats: [
      { label: 'Danh mục', value: '43' },
      { label: 'Chờ duyệt', value: '5', tone: 'warning' },
      { label: 'Đang hiệu lực', value: '38', tone: 'success' },
    ],
    focus: [
      'Kiểm tra xung đột nội dung theo nhóm tuổi.',
      'Đảm bảo mã nội dung đồng nhất ở mọi module.',
      'Khóa danh mục trước khi bốc thăm.',
    ],
    alerts: ['Thay đổi danh mục sau bốc thăm cần biên bản xác nhận.'],
  },
  'technical-meeting': {
    summary: 'Điều phối họp chuyên môn, xác nhận thay đổi kỹ thuật và biên bản quyết nghị.',
    stats: [
      { label: 'Đầu việc', value: '17' },
      { label: 'Mở chưa chốt', value: '4', tone: 'warning' },
      { label: 'Đã công bố', value: '13', tone: 'success' },
    ],
    focus: [
      'Tổng hợp vấn đề từ các ban chuyên môn.',
      'Chốt biên bản và danh sách quyết nghị.',
      'Đẩy thông báo xuống các module liên quan.',
    ],
    alerts: ['Quyết nghị chưa ký số không được áp dụng.'],
  },
  draw: {
    summary: 'Theo dõi tiến độ bốc thăm, seed hạt giống và xác nhận nhánh thi đấu.',
    stats: [
      { label: 'Nội dung bốc', value: '22' },
      { label: 'Còn treo', value: '2', tone: 'warning' },
      { label: 'Đã khóa', value: '20', tone: 'success' },
    ],
    focus: [
      'Kiểm tra seed và xung đột lịch.',
      'Xác nhận kết quả bốc thăm trước khi publish.',
      'Đồng bộ nhánh sang module Bracket.',
    ],
    alerts: ['Mọi lần bốc lại phải có nhật ký thao tác và lý do.'],
  },
  bracket: {
    summary: 'Theo dõi sơ đồ nhánh thi đấu và tiến trình lên vòng theo thời gian thực.',
    stats: [
      { label: 'Nhánh đang chạy', value: '14' },
      { label: 'Trận chậm lịch', value: '3', tone: 'warning' },
      { label: 'Cập nhật kết quả', value: 'Gần realtime', tone: 'success' },
    ],
    focus: [
      'Xác nhận kết quả từng cặp trước khi đẩy nhánh.',
      'Theo dõi các nhánh có nguy cơ dồn lịch.',
      'Đối soát với điều phối sàn đấu.',
    ],
    alerts: ['Không cập nhật nhánh khi trận chưa khóa kết quả.'],
  },
  medals: {
    summary: 'Bảng huy chương theo đoàn và nhóm nội dung, phục vụ tổng kết giải.',
    stats: [
      { label: 'Đoàn có huy chương', value: '29' },
      { label: 'Chờ xác nhận', value: '4', tone: 'warning' },
      { label: 'Đã công bố', value: '95%', tone: 'success' },
    ],
    focus: [
      'Đối chiếu HCV/HCB/HCĐ với kết quả trận.',
      'Theo dõi thay đổi thứ hạng toàn đoàn.',
      'Chuẩn bị bản in trao thưởng.',
    ],
    alerts: ['Sửa huy chương sau công bố cần phê duyệt BTC.'],
  },
  reports: {
    summary: 'Trung tâm báo cáo tác nghiệp, hỗ trợ xuất nhanh cho BTC và truyền thông.',
    stats: [
      { label: 'Mẫu báo cáo', value: '18' },
      { label: 'Đợi dữ liệu', value: '3', tone: 'warning' },
      { label: 'Sẵn sàng xuất', value: '15', tone: 'success' },
    ],
    focus: [
      'Kiểm tra tính nhất quán dữ liệu đầu vào.',
      'Chọn mẫu báo cáo theo đối tượng nhận.',
      'Lưu vết lần xuất và người phụ trách.',
    ],
    alerts: ['Không xuất bản công khai báo cáo nội bộ chưa ẩn thông tin nhạy cảm.'],
  },
  community: {
    summary: 'Theo dõi hoạt động cộng đồng, thông báo và tương tác từ người hâm mộ.',
    stats: [
      { label: 'Bài mới', value: '26' },
      { label: 'Chờ kiểm duyệt', value: '7', tone: 'warning' },
      { label: 'Tương tác tích cực', value: '88%', tone: 'success' },
    ],
    focus: [
      'Duyệt nội dung truyền thông trước giờ cao điểm.',
      'Ưu tiên xử lý phản hồi tiêu cực.',
      'Liên kết bài nổi bật với kết quả thi đấu.',
    ],
    alerts: ['Nội dung vi phạm cần ẩn ngay và ghi log kiểm duyệt.'],
  },
  'admin-dashboard': {
    summary: 'Giám sát sức khỏe hệ thống, cảnh báo dịch vụ và các thay đổi cấu hình quan trọng.',
    stats: [
      { label: 'Dịch vụ sống', value: '12/12', tone: 'success' },
      { label: 'Cảnh báo mở', value: '2', tone: 'warning' },
      { label: 'Uptime 24h', value: '99.98%' },
    ],
    focus: [
      'Theo dõi cảnh báo hiệu năng backend.',
      'Kiểm tra đồng bộ auth/session.',
      'Rà soát thay đổi cấu hình production.',
    ],
    alerts: ['Sự cố mức cao cần kích hoạt quy trình incident ngay.'],
  },
  'audit-logs': {
    summary: 'Theo dõi nhật ký thao tác, truy vết thay đổi và kiểm soát tuân thủ hệ thống.',
    stats: [
      { label: 'Log 24h', value: '8,240' },
      { label: 'Sự kiện nghi vấn', value: '5', tone: 'warning' },
      { label: 'Đã xác minh', value: '80%', tone: 'success' },
    ],
    focus: [
      'Lọc thao tác quyền cao theo user.',
      'Đối chiếu bất thường đăng nhập/đăng xuất.',
      'Chuẩn bị báo cáo kiểm toán cuối ngày.',
    ],
    alerts: ['Không xóa log kiểm toán khi chưa có chính sách lưu trữ.'],
  },
}

const getStatToneStyle = (tone?: OpsStatTone) => {
  if (tone === 'warning') return styles.statValueWarning
  if (tone === 'success') return styles.statValueSuccess
  return null
}

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

export function MobileOpsBoardScreen({
  routeId,
  title,
  subtitle,
  webPath,
}: {
  routeId: RouteId
  title: string
  subtitle: string
  webPath: string
}) {
  const board = MOBILE_OPS_PLAYBOOKS[routeId] ?? DEFAULT_OPS_PLAYBOOK

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.boardContent}>
      <ModuleHeader title={title} subtitle={subtitle} />

      <View style={styles.card}>
        <Text style={styles.boardSummary}>{board.summary}</Text>
        <View style={styles.statsWrap}>
          {board.stats.map((stat) => (
            <View key={`${routeId}-${stat.label}`} style={styles.statItem}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={[styles.statValue, getStatToneStyle(stat.tone)]}>
                {stat.value}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.boardSectionTitle}>Trọng tâm trong ca</Text>
        {board.focus.map((line, index) => (
          <Text key={`${routeId}-focus-${index}`} style={styles.boardLine}>
            {index + 1}. {line}
          </Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.boardSectionTitle}>Cảnh báo vận hành</Text>
        {board.alerts.map((line, index) => (
          <Text key={`${routeId}-alert-${index}`} style={styles.boardLine}>
            {index + 1}. {line}
          </Text>
        ))}
      </View>

      <View style={styles.boardHintBox}>
        <Text style={styles.boardHintText}>Đường dẫn web tương ứng: {webPath}</Text>
      </View>
    </ScrollView>
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
