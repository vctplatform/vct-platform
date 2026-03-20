import {
  KHIEU_NAIS,
  CAN_KYS,
  DANG_KYS,
  DON_VIS,
  HANG_CANS,
  LICH_THI_DAUS,
  LUA_TUOIS,
  LUOT_THI_QUYENS,
  NOI_DUNG_QUYENS,
  SAN_DAUS,
  TRAN_DAUS,
  TRONG_TAIS,
  VAN_DONG_VIENS,
} from '../mock-data'
import { TOURNAMENT_CONFIG } from '../tournament-config'
import type {
  CanKy,
  DangKy,
  DonVi,
  HangCan,
  KhieuNai,
  LichThiDau,
  LuaTuoi,
  LuotThiQuyen,
  NoiDungQuyen,
  SanDau,
  TournamentConfig,
  TranDauDK,
  TrongTai,
  VanDongVien,
} from '../types'
import { createApiAdapter, createMockAdapter } from './entity-repository'
import { resolveEntityEndpoints } from './api-contracts'

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

export interface RefereeAssignmentRecord {
  id: string
  tt_id: string
  san_id: string
  vai_tro: string
  ngay: string
  phien: string
}

export interface TournamentConfigRecord extends TournamentConfig {
  id: string
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

const isFormCategory = (value: unknown): value is NoiDungQuyen =>
  isObject(value) &&
  typeof value.id === 'string' &&
  typeof value.ten === 'string' &&
  typeof value.trang_thai === 'string'

const isCombatCategory = (value: unknown): value is HangCan =>
  isObject(value) &&
  typeof value.id === 'string' &&
  typeof value.lua_tuoi === 'string' &&
  typeof value.trang_thai === 'string'

const isAgeGroup = (value: unknown): value is LuaTuoi =>
  isObject(value) &&
  typeof value.id === 'string' &&
  typeof value.ten === 'string' &&
  typeof value.ma === 'string'

const isRefereeAssignment = (value: unknown): value is RefereeAssignmentRecord =>
  isObject(value) &&
  typeof value.id === 'string' &&
  typeof value.tt_id === 'string' &&
  typeof value.san_id === 'string'

const isTournamentConfig = (value: unknown): value is TournamentConfigRecord =>
  isObject(value) &&
  typeof value.id === 'string' &&
  typeof value.ten_giai === 'string' &&
  typeof value.ma_giai === 'string'

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

const ASSIGNMENT_SEED: RefereeAssignmentRecord[] = [
  { id: 'PA01', tt_id: 'TT01', san_id: 'S01', vai_tro: 'chinh', ngay: '2026-08-15', phien: 'sang' },
  { id: 'PA02', tt_id: 'TT03', san_id: 'S01', vai_tro: 'phu', ngay: '2026-08-15', phien: 'sang' },
  { id: 'PA03', tt_id: 'TT02', san_id: 'S02', vai_tro: 'chinh', ngay: '2026-08-15', phien: 'sang' },
]

const TOURNAMENT_CONFIG_SEED: TournamentConfigRecord[] = [
  { id: 'TOURNAMENT-2026', ...TOURNAMENT_CONFIG },
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

const createRepositoryBundle = <T extends { id: string }>(
  storageKey: string,
  seed: T[],
  validate: (item: unknown) => item is T,
  entityName: string
) => {
  const api = createApiAdapter<T>(entityName, {
    ...apiConfig,
    endpoints: resolveEntityEndpoints(entityName),
  })

  return {
    mock: createMockAdapter<T>(storageKey, seed, validate, api),
    api,
  }
}

export const repositories = {
  teams: createRepositoryBundle<DonVi>('vct:teams', DON_VIS, isDonVi, 'teams'),
  athletes: createRepositoryBundle<VanDongVien>('vct:athletes', VAN_DONG_VIENS, isAthlete, 'athletes'),
  registration: createRepositoryBundle<DangKy>('vct:registration', DANG_KYS, isRegistration, 'registration'),
  results: createRepositoryBundle<ResultRecord>('vct:results', RESULTS_SEED, isResult, 'results'),
  schedule: createRepositoryBundle<LichThiDau>('vct:schedule', LICH_THI_DAUS, isSchedule, 'schedule'),
  arenas: createRepositoryBundle<SanDau>('vct:arenas', SAN_DAUS, isArena, 'arenas'),
  referees: createRepositoryBundle<TrongTai>('vct:referees', TRONG_TAIS, isReferee, 'referees'),
  appeals: createRepositoryBundle<KhieuNai>('vct:appeals', KHIEU_NAIS, isAppeal, 'appeals'),
  weighIns: createRepositoryBundle<CanKy>('vct:weigh-ins', CAN_KYS, isWeighIn, 'weigh-ins'),
  combatMatches: createRepositoryBundle<TranDauDK>('vct:combat-matches', TRAN_DAUS, isCombatMatch, 'combat-matches'),
  formPerformances: createRepositoryBundle<LuotThiQuyen>(
    'vct:form-performances',
    LUOT_THI_QUYENS,
    isFormPerformance,
    'form-performances'
  ),
  formCategories: createRepositoryBundle<NoiDungQuyen>(
    'vct:form-categories',
    NOI_DUNG_QUYENS,
    isFormCategory,
    'content-categories'
  ),
  combatCategories: createRepositoryBundle<HangCan>(
    'vct:combat-categories',
    HANG_CANS,
    isCombatCategory,
    'content-categories'
  ),
  ageGroups: createRepositoryBundle<LuaTuoi>('vct:age-groups', LUA_TUOIS, isAgeGroup, 'content-categories'),
  refereeAssignments: createRepositoryBundle<RefereeAssignmentRecord>(
    'vct:referee-assignments',
    ASSIGNMENT_SEED,
    isRefereeAssignment,
    'referee-assignments'
  ),
  tournamentConfig: createRepositoryBundle<TournamentConfigRecord>(
    'vct:tournament-config',
    TOURNAMENT_CONFIG_SEED,
    isTournamentConfig,
    'tournament-config'
  ),
}
