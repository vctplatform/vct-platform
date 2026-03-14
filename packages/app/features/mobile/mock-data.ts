import { Colors } from './mobile-theme'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Centralized Mock Data
// Single source for all demo data used across mobile screens
// Will be replaced with API calls in production
// ═══════════════════════════════════════════════════════════════

// ── Status config maps ──

export const SESSION_TYPE_CFG: Record<string, { label: string; emoji: string; color: string }> = {
  regular: { label: 'Thường', emoji: '🥋', color: Colors.accent },
  sparring: { label: 'Đối kháng', emoji: '⚔️', color: Colors.red },
  exam: { label: 'Thi / Đấu', emoji: '🏆', color: Colors.gold },
  special: { label: 'Đặc biệt', emoji: '⭐', color: Colors.purple },
}

export const SESSION_STATUS_CFG: Record<string, { label: string; bg: string; fg: string }> = {
  completed: { label: 'Đã tập', bg: Colors.statusOkBg, fg: Colors.statusOkFg },
  scheduled: { label: 'Sắp tới', bg: Colors.statusInfoBg, fg: Colors.statusInfoFg },
  absent: { label: 'Vắng', bg: Colors.statusErrorBg, fg: Colors.statusErrorFg },
  cancelled: { label: 'Hủy', bg: Colors.statusWarnBg, fg: Colors.statusWarnFg },
}

export const TOURNAMENT_STATUS_CFG: Record<string, { label: string; bg: string; fg: string }> = {
  ok: { label: 'Hợp lệ', bg: Colors.statusOkBg, fg: Colors.statusOkFg },
  missing: { label: 'Thiếu HS', bg: Colors.statusWarnBg, fg: Colors.statusWarnFg },
  rejected: { label: 'Từ chối', bg: Colors.statusErrorBg, fg: Colors.statusErrorFg },
}

// ── Mock Data Types ──

export interface MockSkill { label: string; value: number; color: string }
export interface MockGoal { title: string; progress: number; color: string; icon: string }
export interface MockBelt { belt: string; date: string; color: string }
export interface MockTournament {
  id: string; name: string; doan: string; date: string
  categories: string[]; status: 'ok' | 'missing' | 'rejected'
  docs: { kham_sk: boolean; bao_hiem: boolean; cmnd: boolean; anh: boolean }
}
export interface MockTraining {
  id: string; type: 'regular' | 'sparring' | 'exam' | 'special'
  date: string; time: string; location: string; coach: string
  status: 'completed' | 'scheduled' | 'absent' | 'cancelled'
}
export interface MockResult {
  id: string; name: string; medal: string; result: string; category: string; date: string
}
export interface MockNotification {
  id: string; type: 'tournament' | 'training' | 'system' | 'result'
  title: string; body: string; time: string; read: boolean
}
export interface MockRanking {
  label: string; rank: string; trend: string
}

// ── Mock Data ──

export const MOCK_SKILLS: MockSkill[] = [
  { label: 'Kỹ thuật', value: 78, color: Colors.accent },
  { label: 'Thể lực', value: 65, color: Colors.green },
  { label: 'Tốc độ', value: 72, color: Colors.gold },
  { label: 'Sức mạnh', value: 58, color: Colors.red },
  { label: 'Phản xạ', value: 82, color: Colors.purple },
  { label: 'Tinh thần', value: 88, color: Colors.cyan },
]

export const MOCK_GOALS: MockGoal[] = [
  { title: 'Nâng đẳng cấp đai', progress: 72, color: Colors.red, icon: '🎯' },
  { title: 'Thi đấu 10 giải', progress: 60, color: Colors.accent, icon: '🏆' },
  { title: 'Duy trì tập luyện', progress: 85, color: Colors.green, icon: '💪' },
]

export const MOCK_BELT_HISTORY: MockBelt[] = [
  { belt: 'Trắng đai', date: '01/2020', color: '#e2e8f0' },
  { belt: 'Lam đai 1', date: '06/2021', color: '#60a5fa' },
  { belt: 'Lam đai 2', date: '03/2023', color: '#3b82f6' },
  { belt: 'Lam đai 3', date: '09/2024', color: '#2563eb' },
]

export const MOCK_TOURNAMENTS: MockTournament[] = [
  {
    id: '1', name: 'VĐ Toàn Quốc 2025', doan: 'TP. Hồ Chí Minh', date: '15/08/2025',
    categories: ['ĐK Nam 60kg', 'Quyền đơn nam'], status: 'ok',
    docs: { kham_sk: true, bao_hiem: true, cmnd: true, anh: true },
  },
  {
    id: '2', name: 'Giải Trẻ TP.HCM 2025', doan: 'CLB Tân Bình', date: '20/06/2025',
    categories: ['ĐK Nam 60kg'], status: 'missing',
    docs: { kham_sk: true, bao_hiem: false, cmnd: true, anh: false },
  },
  {
    id: '3', name: 'Cúp CLB 2025', doan: 'TP. Hồ Chí Minh', date: '10/04/2025',
    categories: ['Quyền đơn nam'], status: 'rejected',
    docs: { kham_sk: true, bao_hiem: true, cmnd: false, anh: true },
  },
]

export const MOCK_TRAINING: MockTraining[] = [
  { id: '1', type: 'regular', date: '12/03/2026', time: '17:00 – 19:00', location: 'Nhà thi đấu Q.1', coach: 'HLV Nguyễn Văn A', status: 'completed' },
  { id: '2', type: 'sparring', date: '13/03/2026', time: '06:00 – 08:00', location: 'CLB Tân Bình', coach: 'HLV Trần Thị B', status: 'scheduled' },
  { id: '3', type: 'regular', date: '14/03/2026', time: '17:00 – 19:00', location: 'Nhà thi đấu Q.1', coach: 'HLV Nguyễn Văn A', status: 'scheduled' },
  { id: '4', type: 'exam', date: '16/03/2026', time: '08:00 – 12:00', location: 'SVĐ Thống Nhất', coach: 'HLV Trần Thị B', status: 'scheduled' },
  { id: '5', type: 'special', date: '18/03/2026', time: '15:00 – 17:00', location: 'CLB Phú Thọ', coach: 'HLV Lê Văn C', status: 'scheduled' },
]

export const MOCK_RESULTS: MockResult[] = [
  { id: '1', name: 'VĐ Toàn Quốc 2025', medal: '🥇', result: 'HCV', category: 'ĐK Nam 60kg', date: '15/08/2025' },
  { id: '2', name: 'Giải Trẻ TP.HCM 2025', medal: '🥈', result: 'HCB', category: 'ĐK Nam 60kg', date: '20/06/2025' },
  { id: '3', name: 'Cúp CLB 2025', medal: '🥉', result: 'HCĐ', category: 'Quyền đơn nam', date: '10/04/2025' },
  { id: '4', name: 'Giải Vô Địch Miền Nam 2024', medal: '🥇', result: 'HCV', category: 'ĐK Nam 57kg', date: '20/11/2024' },
  { id: '5', name: 'Giải Trẻ Quốc Gia 2024', medal: '🥈', result: 'HCB', category: 'Quyền đơn nam', date: '05/07/2024' },
]

export const MOCK_NOTIFICATIONS: MockNotification[] = [
  { id: '1', type: 'tournament', title: 'Đăng ký giải VĐ Toàn Quốc 2025', body: 'Hạn đăng ký: 01/08/2025. Vui lòng hoàn thiện hồ sơ trước thời hạn.', time: '5 phút trước', read: false },
  { id: '2', type: 'training', title: 'Buổi tập đối kháng hôm nay', body: 'Buổi tập đối kháng sẽ bắt đầu lúc 17:00 tại Nhà thi đấu Q.1.', time: '2 giờ trước', read: false },
  { id: '3', type: 'result', title: 'Cập nhật điểm Elo', body: 'Điểm Elo của bạn đã tăng +15 sau giải Cúp CLB 2025.', time: '1 ngày trước', read: false },
  { id: '4', type: 'system', title: 'Cập nhật ứng dụng', body: 'Phiên bản mới VCT Platform v1.1 đã sẵn sàng.', time: '2 ngày trước', read: true },
  { id: '5', type: 'tournament', title: 'Lịch thi đấu đã công bố', body: 'Lịch thi đấu Giải Trẻ TP.HCM 2025 đã được cập nhật.', time: '3 ngày trước', read: true },
  { id: '6', type: 'training', title: 'Chuỗi 7 buổi liên tiếp!', body: 'Chúc mừng! Bạn đã duy trì chuỗi 7 buổi tập liên tiếp.', time: '4 ngày trước', read: true },
  { id: '7', type: 'system', title: 'Bảo trì hệ thống', body: 'Hệ thống sẽ bảo trì vào 00:00 - 02:00 ngày 15/03.', time: '5 ngày trước', read: true },
  { id: '8', type: 'result', title: 'Kết quả giải Cúp CLB 2025', body: 'Bạn đạt HCĐ nội dung Quyền đơn nam. Chúc mừng!', time: '1 tuần trước', read: true },
]

export const MOCK_ATTENDANCE_STATS = { total: 48, attended: 42, streak: 7, absent: 4, cancelled: 2, rate: 87.5 }

export const MOCK_MEDALS = { gold: 2, silver: 2, bronze: 1, total: 5 }

export const MOCK_TYPE_BREAKDOWN = [
  { type: 'regular' as const, count: 30 },
  { type: 'sparring' as const, count: 8 },
  { type: 'exam' as const, count: 6 },
  { type: 'special' as const, count: 4 },
]

export const MOCK_RANKINGS: MockRanking[] = [
  { label: 'Toàn quốc (ĐK Nam 60kg)', rank: '#—', trend: '—' },
  { label: 'Khu vực', rank: '#—', trend: '—' },
  { label: 'Tỉnh/Thành', rank: '#—', trend: '—' },
]

export const MOCK_ELO_HISTORY: number[] = [
  1000, 1020, 1015, 1050, 1080, 1075, 1100, 1130, 1150, 1200,
  1220, 1250, 1280, 1300, 1320, 1350, 1380, 1400, 1420, 1450,
]
