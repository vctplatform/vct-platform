import {
  KHIEU_NAIS,
  CAN_KYS,
  DANG_KYS,
  DON_VIS,
  LICH_THI_DAUS,
  LUOT_THI_QUYENS,
  SAN_DAUS,
  TRAN_DAUS,
  TRONG_TAIS,
  VAN_DONG_VIENS,
} from '../mock-data'
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
} from '../types'
import { createApiAdapter, createMockAdapter } from './entity-repository'

export interface ResultRecord {
  id: string
  loai: 'doi_khang' | 'quyen'
  noi_dung: string
  vdv_ten: string
  doan: string
  ket_qua: string
  diem: string
  huy_chuong: string
  vong?: string
  doi_thu?: string
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object')

const isDonVi = (value: unknown): value is DonVi =>
  isObject(value) &&
  typeof value.id === 'string' &&
  typeof value.ten === 'string' &&
  typeof value.ma === 'string' &&
  typeof value.trang_thai === 'string'

const isAthlete = (value: unknown): value is VanDongVien =>
  isObject(value) &&
  typeof value.id === 'string' &&
  typeof value.ho_ten === 'string' &&
  typeof value.doan_id === 'string' &&
  typeof value.trang_thai === 'string'

const isRegistration = (value: unknown): value is DangKy =>
  isObject(value) &&
  typeof value.id === 'string' &&
  typeof value.vdv_id === 'string' &&
  typeof value.nd_id === 'string' &&
  typeof value.trang_thai === 'string'

const isSchedule = (value: unknown): value is LichThiDau =>
  isObject(value) &&
  typeof value.id === 'string' &&
  typeof value.ngay === 'string' &&
  typeof value.san_id === 'string' &&
  typeof value.trang_thai === 'string'

const isArena = (value: unknown): value is SanDau =>
  isObject(value) &&
  typeof value.id === 'string' &&
  typeof value.ten === 'string' &&
  typeof value.loai === 'string' &&
  typeof value.trang_thai === 'string'

const isReferee = (value: unknown): value is TrongTai =>
  isObject(value) &&
  typeof value.id === 'string' &&
  typeof value.ho_ten === 'string' &&
  typeof value.cap_bac === 'string' &&
  typeof value.trang_thai === 'string'

const isAppeal = (value: unknown): value is KhieuNai =>
  isObject(value) &&
  typeof value.id === 'string' &&
  typeof value.doan_ten === 'string' &&
  typeof value.loai === 'string' &&
  typeof value.trang_thai === 'string'

const isWeighIn = (value: unknown): value is CanKy =>
  isObject(value) &&
  typeof value.id === 'string' &&
  typeof value.vdv_ten === 'string' &&
  typeof value.doan_ten === 'string' &&
  typeof value.ket_qua === 'string'

const isCombatMatch = (value: unknown): value is TranDauDK =>
  isObject(value) &&
  typeof value.id === 'string' &&
  typeof value.san_id === 'string' &&
  typeof value.hang_can === 'string' &&
  typeof value.trang_thai === 'string'

const isFormPerformance = (value: unknown): value is LuotThiQuyen =>
  isObject(value) &&
  typeof value.id === 'string' &&
  typeof value.vdv_ten === 'string' &&
  typeof value.noi_dung === 'string' &&
  Array.isArray(value.diem)

const isResult = (value: unknown): value is ResultRecord =>
  isObject(value) &&
  typeof value.id === 'string' &&
  typeof value.vdv_ten === 'string' &&
  typeof value.noi_dung === 'string' &&
  typeof value.ket_qua === 'string'

const RESULTS_SEED: ResultRecord[] = [
  ...TRAN_DAUS.filter((m) => m.trang_thai === 'ket_thuc').map((m) => ({
    id: `R-${m.id}`,
    loai: 'doi_khang' as const,
    noi_dung: m.hang_can,
    vdv_ten: m.ket_qua.includes('Đỏ') ? m.vdv_do.ten : m.vdv_xanh.ten,
    doan: m.ket_qua.includes('Đỏ') ? m.vdv_do.doan : m.vdv_xanh.doan,
    ket_qua: m.ket_qua || 'Thắng',
    diem: `${m.diem_do}:${m.diem_xanh}`,
    huy_chuong: '',
  })),
  ...CAN_KYS.filter((w) => w.ket_qua === 'dat').slice(0, 2).map((w) => ({
    id: `Q-${w.id}`,
    loai: 'quyen' as const,
    noi_dung: w.hang_can_dk,
    vdv_ten: w.vdv_ten,
    doan: w.doan_ten,
    ket_qua: 'Đạt',
    diem: `${w.can_thuc_te}`,
    huy_chuong: '',
  })),
]

const resolveApiBaseUrl = () => {
  const value = process.env.NEXT_PUBLIC_API_BASE_URL?.trim()
  if (!value) return '/api/v1'
  const normalized = value.replace(/\/$/, '')
  return normalized.endsWith('/api/v1') ? normalized : `${normalized}/api/v1`
}

const getStoredAuthToken = () => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem('vct:auth-session')
    if (!raw) return null
    const parsed = JSON.parse(raw) as { token?: string; accessToken?: string }
    if (typeof parsed?.accessToken === 'string' && parsed.accessToken.trim()) {
      return parsed.accessToken
    }
    return parsed?.token ?? null
  } catch {
    return null
  }
}

const apiConfig = {
  baseUrl: resolveApiBaseUrl(),
  getAuthToken: getStoredAuthToken,
}

export const repositories = {
  teams: {
    mock: createMockAdapter<DonVi>('vct:teams', DON_VIS, isDonVi),
    api: createApiAdapter<DonVi>('teams', apiConfig),
  },
  athletes: {
    mock: createMockAdapter<VanDongVien>('vct:athletes', VAN_DONG_VIENS, isAthlete),
    api: createApiAdapter<VanDongVien>('athletes', apiConfig),
  },
  registration: {
    mock: createMockAdapter<DangKy>('vct:registration', DANG_KYS, isRegistration),
    api: createApiAdapter<DangKy>('registration', apiConfig),
  },
  results: {
    mock: createMockAdapter<ResultRecord>('vct:results', RESULTS_SEED, isResult),
    api: createApiAdapter<ResultRecord>('results', apiConfig),
  },
  schedule: {
    mock: createMockAdapter<LichThiDau>('vct:schedule', LICH_THI_DAUS, isSchedule),
    api: createApiAdapter<LichThiDau>('schedule', apiConfig),
  },
  arenas: {
    mock: createMockAdapter<SanDau>('vct:arenas', SAN_DAUS, isArena),
    api: createApiAdapter<SanDau>('arenas', apiConfig),
  },
  referees: {
    mock: createMockAdapter<TrongTai>('vct:referees', TRONG_TAIS, isReferee),
    api: createApiAdapter<TrongTai>('referees', apiConfig),
  },
  appeals: {
    mock: createMockAdapter<KhieuNai>('vct:appeals', KHIEU_NAIS, isAppeal),
    api: createApiAdapter<KhieuNai>('appeals', apiConfig),
  },
  weighIns: {
    mock: createMockAdapter<CanKy>('vct:weigh-ins', CAN_KYS, isWeighIn),
    api: createApiAdapter<CanKy>('weigh-ins', apiConfig),
  },
  combatMatches: {
    mock: createMockAdapter<TranDauDK>('vct:combat-matches', TRAN_DAUS, isCombatMatch),
    api: createApiAdapter<TranDauDK>('combat-matches', apiConfig),
  },
  formPerformances: {
    mock: createMockAdapter<LuotThiQuyen>('vct:form-performances', LUOT_THI_QUYENS, isFormPerformance),
    api: createApiAdapter<LuotThiQuyen>('form-performances', apiConfig),
  },
}
