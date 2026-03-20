import { useApiQuery } from './useApiQuery';
import type { 
    DonVi, VanDongVien, DangKy, TrongTai, CanKy,
    TranDauDK, LuotThiQuyen, LichThiDau, KhieuNai,
    NoiDungQuyen, HangCan, LuaTuoi, SanDau
} from '../data/types';

let _idCounter = 1000;
export const genId = (prefix: string = 'ID') => {
    _idCounter++;
    return `${prefix}${_idCounter}`;
};

export function useDonVis() {
    return useApiQuery<DonVi[]>('/api/v1/tournament/don-vis', { fallbackData: [] });
}

export function useVanDongViens() {
    return useApiQuery<VanDongVien[]>('/api/v1/tournament/vdv', { fallbackData: [] });
}

export function useTrongTais() {
    return useApiQuery<TrongTai[]>('/api/v1/tournament/trong-tais', { fallbackData: [] });
}

export function useSanDaus() {
    return useApiQuery<SanDau[]>('/api/v1/tournament/san-daus', { fallbackData: [] });
}

export function useHangCans() {
    return useApiQuery<HangCan[]>('/api/v1/tournament/hang-cans', { fallbackData: [] });
}

export function useNoiDungQuyens() {
    return useApiQuery<NoiDungQuyen[]>('/api/v1/tournament/noi-dung-quyens', { fallbackData: [] });
}

export function useTranDaus() {
    return useApiQuery<TranDauDK[]>('/api/v1/tournament/tran-daus', { fallbackData: [] });
}

export function useLuotThiQuyens() {
    return useApiQuery<LuotThiQuyen[]>('/api/v1/tournament/luot-thi-quyens', { fallbackData: [] });
}

export function useCanKys() {
    return useApiQuery<CanKy[]>('/api/v1/tournament/can-kys', { fallbackData: [] });
}

export function useLuaTuois() {
    return useApiQuery<LuaTuoi[]>('/api/v1/tournament/lua-tuois', { fallbackData: [] });
}

export function useDangKys() {
    return useApiQuery<DangKy[]>('/api/v1/tournament/dang-kys', { fallbackData: [] });
}

export function useLichThiDaus() {
    return useApiQuery<LichThiDau[]>('/api/v1/tournament/lich-thi-daus', { fallbackData: [] });
}

export function useKhieuNais() {
    return useApiQuery<KhieuNai[]>('/api/v1/tournament/khieu-nais', { fallbackData: [] });
}

export function getVDVsByDoan(doanId: string, vdvs: VanDongVien[]) {
    return vdvs.filter(v => v.doan_id === doanId);
}
