import {
  KHIEU_NAIS,
  CAN_KYS,
  DANG_KYS,
  DON_VIS,
  LICH_THI_DAUS,
  SAN_DAUS,
  TRAN_DAUS,
  TRONG_TAIS,
  VAN_DONG_VIENS,
} from '../mock-data'
import type {
  DangKy,
  DonVi,
  KhieuNai,
  LichThiDau,
  SanDau,
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

export const repositories = {
  teams: {
    mock: createMockAdapter<DonVi>('vct:teams', DON_VIS, isDonVi),
    api: createApiAdapter<DonVi>('teams'),
  },
  athletes: {
    mock: createMockAdapter<VanDongVien>('vct:athletes', VAN_DONG_VIENS, isAthlete),
    api: createApiAdapter<VanDongVien>('athletes'),
  },
  registration: {
    mock: createMockAdapter<DangKy>('vct:registration', DANG_KYS, isRegistration),
    api: createApiAdapter<DangKy>('registration'),
  },
  results: {
    mock: createMockAdapter<ResultRecord>('vct:results', RESULTS_SEED, isResult),
    api: createApiAdapter<ResultRecord>('results'),
  },
  schedule: {
    mock: createMockAdapter<LichThiDau>('vct:schedule', LICH_THI_DAUS, isSchedule),
    api: createApiAdapter<LichThiDau>('schedule'),
  },
  arenas: {
    mock: createMockAdapter<SanDau>('vct:arenas', SAN_DAUS, isArena),
    api: createApiAdapter<SanDau>('arenas'),
  },
  referees: {
    mock: createMockAdapter<TrongTai>('vct:referees', TRONG_TAIS, isReferee),
    api: createApiAdapter<TrongTai>('referees'),
  },
  appeals: {
    mock: createMockAdapter<KhieuNai>('vct:appeals', KHIEU_NAIS, isAppeal),
    api: createApiAdapter<KhieuNai>('appeals'),
  },
}
