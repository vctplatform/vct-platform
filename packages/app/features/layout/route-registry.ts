import type { UserRole } from '../auth/types'

export type RouteGroupId =
  | 'cau_hinh'
  | 'dang_ky'
  | 'trong_tai'
  | 'thi_dau'
  | 'tong_hop'

export interface RouteItem {
  path: string
  title: string
  label: string
  icon: string
  group: RouteGroupId
  showInSidebar?: boolean
  roles?: UserRole[]
}

export interface RouteGroup {
  id: RouteGroupId
  label: string
}

const ALL_ROLES: UserRole[] = [
  'admin',
  'btc',
  'referee_manager',
  'referee',
  'delegate',
]

const ADMIN_BTC: UserRole[] = ['admin', 'btc']
const REFEREE_OPERATORS: UserRole[] = [
  'admin',
  'btc',
  'referee_manager',
  'referee',
]
const TEAM_OPERATORS: UserRole[] = ['admin', 'btc', 'delegate']
const REPORT_VIEWERS: UserRole[] = ['admin', 'btc', 'delegate', 'referee_manager']

export const ROUTE_GROUPS: RouteGroup[] = [
  { id: 'cau_hinh', label: 'Cấu hình giải' },
  { id: 'dang_ky', label: 'Đăng ký' },
  { id: 'trong_tai', label: 'Nhân sự trọng tài' },
  { id: 'thi_dau', label: 'Thi đấu' },
  { id: 'tong_hop', label: 'Tổng hợp' },
]

export const ROUTE_REGISTRY: RouteItem[] = [
  { path: '/', title: 'TỔNG QUAN 360', label: 'Tổng quan 360', icon: 'Dashboard', group: 'cau_hinh', showInSidebar: true, roles: ALL_ROLES },
  { path: '/giai-dau', title: 'THÔNG TIN GIẢI', label: 'Thông tin giải', icon: 'Trophy', group: 'cau_hinh', showInSidebar: true, roles: ADMIN_BTC },
  { path: '/noi-dung', title: 'NỘI DUNG & HẠNG MỤC', label: 'Nội dung & Hạng mục', icon: 'List', group: 'cau_hinh', showInSidebar: true, roles: ADMIN_BTC },
  { path: '/san-dau', title: 'QUẢN LÝ SÀN ĐẤU', label: 'Quản lý Sàn', icon: 'LayoutGrid', group: 'cau_hinh', showInSidebar: true, roles: ADMIN_BTC },

  { path: '/teams', title: 'ĐƠN VỊ THAM GIA', label: 'Đơn vị tham gia', icon: 'Building2', group: 'dang_ky', showInSidebar: true, roles: TEAM_OPERATORS },
  { path: '/athletes', title: 'VẬN ĐỘNG VIÊN', label: 'Vận động viên', icon: 'Users', group: 'dang_ky', showInSidebar: true, roles: TEAM_OPERATORS },
  { path: '/registration', title: 'ĐĂNG KÝ NỘI DUNG', label: 'Đăng ký nội dung', icon: 'ClipboardCheck', group: 'dang_ky', showInSidebar: true, roles: TEAM_OPERATORS },

  { path: '/referees', title: 'DANH SÁCH TRỌNG TÀI', label: 'Danh sách trọng tài', icon: 'UserCheck', group: 'trong_tai', showInSidebar: true, roles: ['admin', 'btc', 'referee_manager'] },
  { path: '/referee-assignments', title: 'PHÂN CÔNG TRỌNG TÀI', label: 'Phân công trọng tài', icon: 'GitMerge', group: 'trong_tai', showInSidebar: true, roles: ['admin', 'btc', 'referee_manager'] },

  { path: '/hop-chuyen-mon', title: 'HỌP CHUYÊN MÔN', label: 'Họp chuyên môn', icon: 'ClipboardList', group: 'thi_dau', showInSidebar: true, roles: REFEREE_OPERATORS },
  { path: '/boc-tham', title: 'BỐC THĂM', label: 'Bốc thăm', icon: 'Shuffle', group: 'thi_dau', showInSidebar: true, roles: REFEREE_OPERATORS },
  { path: '/weigh-in', title: 'CÂN KÝ', label: 'Cân ký', icon: 'Scale', group: 'thi_dau', showInSidebar: true, roles: REFEREE_OPERATORS },
  { path: '/combat', title: 'ĐỐI KHÁNG', label: 'Đối kháng', icon: 'Swords', group: 'thi_dau', showInSidebar: true, roles: REFEREE_OPERATORS },
  { path: '/forms', title: 'QUYỀN', label: 'Quyền', icon: 'Star', group: 'thi_dau', showInSidebar: true, roles: REFEREE_OPERATORS },
  { path: '/bracket', title: 'SƠ ĐỒ NHÁNH', label: 'Sơ đồ nhánh', icon: 'GitMerge', group: 'thi_dau', showInSidebar: true, roles: REFEREE_OPERATORS },
  { path: '/results', title: 'KẾT QUẢ', label: 'Kết quả', icon: 'Award', group: 'thi_dau', showInSidebar: true, roles: ALL_ROLES },

  { path: '/schedule', title: 'LỊCH THI ĐẤU', label: 'Lịch thi đấu', icon: 'Calendar', group: 'tong_hop', showInSidebar: true, roles: ALL_ROLES },
  { path: '/medals', title: 'BẢNG HUY CHƯƠNG', label: 'Bảng huy chương', icon: 'Medal', group: 'tong_hop', showInSidebar: true, roles: REPORT_VIEWERS },
  { path: '/appeals', title: 'KHIẾU NẠI & KHÁNG NGHỊ', label: 'Khiếu nại & Kháng nghị', icon: 'AlertCircle', group: 'tong_hop', showInSidebar: true, roles: REPORT_VIEWERS },
  { path: '/reports', title: 'BÁO CÁO & IN ẤN', label: 'Báo cáo & In ấn', icon: 'Printer', group: 'tong_hop', showInSidebar: true, roles: REPORT_VIEWERS },
]

const hasRouteAccess = (route: RouteItem, role: UserRole) =>
  !route.roles || route.roles.includes(role)

export const getRouteByPath = (path: string) => {
  if (!path) return undefined
  if (path.startsWith('/users/')) {
    return {
      path: '/users/[userId]',
      title: 'CHI TIẾT NGƯỜI DÙNG',
      label: 'Chi tiết người dùng',
      icon: 'User',
      group: 'tong_hop',
      showInSidebar: false,
      roles: ['admin', 'btc'],
    } satisfies RouteItem
  }
  return ROUTE_REGISTRY.find((r) => r.path === path)
}

export const isRouteAccessible = (path: string, role: UserRole) => {
  const route = getRouteByPath(path)
  if (!route) return true
  return hasRouteAccess(route, role)
}

export const getDefaultRouteForRole = (role: UserRole) =>
  ROUTE_REGISTRY.find(
    (route) => route.showInSidebar && hasRouteAccess(route, role)
  )?.path ?? '/'

export const getPageTitle = (path: string) =>
  getRouteByPath(path)?.title ?? 'VCT PLATFORM'

export const getBreadcrumbs = (path: string) => {
  const route = getRouteByPath(path)
  if (!route) return ['VCT PLATFORM']
  return ['VCT PLATFORM', route.label]
}

export const getSidebarGroups = (role: UserRole = 'admin') =>
  ROUTE_GROUPS.map((group) => ({
    ...group,
    items: ROUTE_REGISTRY.filter(
      (route) =>
        route.group === group.id &&
        route.showInSidebar &&
        hasRouteAccess(route, role)
    ),
  })).filter((group) => group.items.length > 0)

