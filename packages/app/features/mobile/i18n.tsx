import * as React from 'react'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Mobile i18n
// Lightweight translation hook for mobile screens
// ═══════════════════════════════════════════════════════════════

const vi: Record<string, string> = {
  // Tab navigation
  'nav.home': 'Trang chủ',
  'nav.tournaments': 'Giải đấu',
  'nav.training': 'Lịch tập',
  'nav.profile': 'Hồ sơ',
  'nav.settings': 'Cài đặt',
  'nav.notifications': 'Thông báo',

  // Common actions
  'action.save': 'Lưu',
  'action.cancel': 'Hủy',
  'action.edit': 'Chỉnh sửa',
  'action.delete': 'Xóa',
  'action.submit': 'Gửi',
  'action.retry': 'Thử lại',
  'action.close': 'Đóng',
  'action.readAll': 'Đọc tất cả',
  'action.logout': 'Đăng xuất',
  'action.login': 'Đăng nhập',
  'action.register': 'Đăng ký',
  'action.back': 'Quay lại',

  // Login
  'login.title': 'VCT PLATFORM',
  'login.subtitle': 'Nền tảng Võ Cổ Truyền Việt Nam',
  'login.username': 'Tên đăng nhập',
  'login.password': 'Mật khẩu',
  'login.usernamePlaceholder': 'Nhập tên đăng nhập',
  'login.passwordPlaceholder': 'Nhập mật khẩu',
  'login.submit': 'ĐĂNG NHẬP',
  'login.demoTitle': 'Tài khoản demo',
  'login.demoHint': 'Bạn có thể bỏ qua đăng nhập để dùng chế độ demo.',
  'login.demoCredentials': 'Hoặc đăng nhập với:',
  'login.demoSkip': 'Bỏ qua → Dùng chế độ Demo',
  'login.forgotPassword': 'Quên mật khẩu?',
  'login.failed': 'Đăng nhập thất bại',
  'login.demoFailed': 'Không thể khởi tạo chế độ demo',

  // Profile
  'profile.title': 'Hồ sơ',
  'profile.subtitle': 'Thông tin cá nhân',
  'profile.athlete': 'Vận động viên',
  'profile.editProfile': 'Chỉnh sửa hồ sơ',
  'profile.belt': 'Đai',
  'profile.elo': 'Elo',
  'profile.active': 'Đang hoạt động',
  'profile.tournaments': 'Giải đấu',
  'profile.medals': 'Huy chương',
  'profile.attendance': 'Tỷ lệ tập',
  'profile.skills': 'Chỉ số kỹ năng',
  'profile.average': 'Trung bình',
  'profile.good': 'Tốt',
  'profile.history': 'Lịch sử thi đấu gần đây',
  'profile.portal': 'Cổng VĐV',
  'profile.training': 'Lịch tập',
  'profile.results': 'Thành tích',
  'profile.rankings': 'Xếp hạng',

  // Edit profile
  'editProfile.title': 'Chỉnh sửa hồ sơ',
  'editProfile.fullName': 'Họ và tên',
  'editProfile.email': 'Email',
  'editProfile.phone': 'Số điện thoại',
  'editProfile.club': 'Câu lạc bộ',
  'editProfile.clubNote': 'Để thay đổi CLB hoặc cấp đai, vui lòng liên hệ Ban tổ chức hoặc HLV trưởng.',
  'editProfile.avatarHint': 'Nhấn để thay đổi ảnh đại diện (sắp ra mắt)',
  'editProfile.success': 'Đã cập nhật hồ sơ',
  'editProfile.error': 'Không thể cập nhật hồ sơ',
  'editProfile.nameRequired': 'Họ tên không được để trống',

  // Portal
  'portal.title': 'Cổng VĐV',
  'portal.subtitle': 'Tổng quan hoạt động',
  'portal.quickAccess': 'Truy cập nhanh',
  'portal.skills': 'Chỉ số kỹ năng',
  'portal.goals': 'Mục tiêu cá nhân',
  'portal.beltTimeline': 'Hành trình thăng đai',

  // Tournaments
  'tournaments.title': 'Giải đấu',
  'tournaments.subtitle': 'Theo dõi thi đấu và hồ sơ',
  'tournaments.total': 'Tổng giải',
  'tournaments.valid': 'Hợp lệ',
  'tournaments.missing': 'Thiếu HS',
  'tournaments.rejected': 'Từ chối',
  'tournaments.docsProgress': 'Tiến độ hồ sơ',
  'tournaments.register': 'Đăng ký giải đấu',
  'tournaments.registerSuccess': 'Đã gửi đăng ký giải đấu. Vui lòng chờ phê duyệt.',
  'tournaments.registerError': 'Không thể đăng ký giải đấu',
  'tournaments.name': 'Tên giải đấu',
  'tournaments.namePlaceholder': 'VD: VĐ Toàn Quốc 2026',
  'tournaments.category': 'Nội dung thi đấu',
  'tournaments.weightClass': 'Hạng cân',
  'tournaments.notes': 'Ghi chú',
  'tournaments.notesPlaceholder': 'Ghi chú bổ sung (tùy chọn)',
  'tournaments.docsNote': 'Đơn đăng ký sẽ được gửi đến Ban tổ chức. Bạn cần hoàn thiện hồ sơ (khám sức khỏe, bảo hiểm, CCCD, ảnh thẻ) trước thời hạn.',

  // Training
  'training.title': 'Lịch tập',
  'training.subtitle': 'Lịch tập luyện và điểm danh',
  'training.total': 'Tổng buổi',
  'training.attended': 'Đã tập',
  'training.streak': 'Chuỗi',
  'training.absent': 'Vắng',
  'training.rate': 'Tỷ lệ chuyên cần',
  'training.upcoming': 'Buổi tập sắp tới',
  'training.completed': 'Buổi tập đã hoàn thành',
  'training.breakdown': 'Phân loại buổi tập',

  // Results
  'results.title': 'Kết quả thi đấu',
  'results.subtitle': 'Thành tích qua các giải đấu',
  'results.gold': 'Vàng',
  'results.silver': 'Bạc',
  'results.bronze': 'Đồng',
  'results.eloScore': 'Điểm Elo',
  'results.totalTournaments': 'Tổng giải',
  'results.totalMedals': 'Tổng HC',
  'results.history': 'Lịch sử thi đấu',

  // Rankings
  'rankings.title': 'BXH & Chỉ số',
  'rankings.subtitle': 'Xếp hạng và thành tích cá nhân',
  'rankings.eloChart': 'Biểu đồ Elo',
  'rankings.eloChartHint': 'Biểu đồ lịch sử xếp hạng Elo sẽ được hiển thị tại đây. Tính năng đang phát triển.',
  'rankings.positions': 'Vị trí xếp hạng',

  // Notifications
  'notifications.title': 'Thông báo',
  'notifications.empty': 'Không có thông báo',
  'notifications.emptyHint': 'Bạn chưa có thông báo nào',
  'notifications.all': 'Tất cả',
  'notifications.tournament': 'Giải đấu',
  'notifications.training': 'Tập luyện',
  'notifications.result': 'Kết quả',
  'notifications.system': 'Hệ thống',

  // Settings
  'settings.account': 'Tài khoản',
  'settings.personalProfile': 'Hồ sơ cá nhân',
  'settings.switchRole': 'Chuyển vai trò',
  'settings.changePassword': 'Đổi mật khẩu',
  'settings.devices': 'Thiết bị đăng nhập',
  'settings.app': 'Ứng dụng',
  'settings.language': 'Ngôn ngữ',
  'settings.languageValue': 'Tiếng Việt',
  'settings.notificationsLabel': 'Thông báo',
  'settings.notificationsValue': 'Bật',
  'settings.darkMode': 'Chế độ tối',
  'settings.darkModeOff': 'Tắt',
  'settings.darkModeOn': 'Bật',
  'settings.dataUsage': 'Sử dụng dữ liệu',
  'settings.dataUsageValue': 'Wi-Fi',
  'settings.info': 'Thông tin',
  'settings.about': 'Giới thiệu VCT',
  'settings.terms': 'Điều khoản sử dụng',
  'settings.privacy': 'Chính sách bảo mật',
  'settings.support': 'Liên hệ hỗ trợ',
  'settings.rate': 'Đánh giá ứng dụng',
  'settings.version': 'Phiên bản',
  'settings.logoutConfirm': 'Bạn có chắc muốn đăng xuất khỏi ứng dụng?',
  'settings.rolePrompt': 'Chuyển đổi vai trò để xem module tương ứng',
  'settings.roleTitle': 'Chọn vai trò',

  // Offline / Errors
  'offline.banner': 'Đang dùng dữ liệu offline',
  'offline.retry': 'Kết nối lại',
  'error.generic': 'Có lỗi xảy ra',
  'error.title': 'Lỗi',
  'success.title': 'Thành công',

  // Common labels
  'common.comingSoon': 'Sắp ra mắt',
  'common.comingSoonHint': 'đang được phát triển.',
  'common.loading': 'Đang tải...',

  // Document checklist
  'doc.healthCheck': 'Khám sức khỏe',
  'doc.insurance': 'Bảo hiểm y tế',
  'doc.id': 'CCCD/CMND',
  'doc.photo': 'Ảnh thẻ',
}

const en: Record<string, string> = {
  'nav.home': 'Home',
  'nav.tournaments': 'Tournaments',
  'nav.training': 'Training',
  'nav.profile': 'Profile',
  'nav.settings': 'Settings',
  'nav.notifications': 'Notifications',
  'action.save': 'Save',
  'action.cancel': 'Cancel',
  'action.login': 'Sign In',
  'action.logout': 'Sign Out',
  'login.title': 'VCT PLATFORM',
  'login.subtitle': 'Vietnamese Traditional Martial Arts',
  'common.loading': 'Loading...',
  // ... más keys as needed
}

const locales: Record<string, Record<string, string>> = { vi, en }

interface I18nContextValue {
  locale: string
  setLocale: (locale: string) => void
  t: (key: string, fallback?: string) => string
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'vi',
  setLocale: () => {},
  t: (key) => key,
})

export function MobileI18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState('vi')

  const t = useCallback(
    (key: string, fallback?: string) => locales[locale]?.[key] ?? fallback ?? key,
    [locale]
  )

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useT() {
  return useContext(I18nContext)
}
