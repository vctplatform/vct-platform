// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — SCORING DOMAIN TYPES
// ════════════════════════════════════════════════════════════════

import type {
    VongDau, TrangThaiTranDau, TrangThaiQuyen,
    HinhThucQuyen, TrangThaiND, GioiTinh,
    LoaiKN, TrangThaiKN,
} from './common';

export interface NoiDungQuyen {
    id: string;
    ten: string;
    hinh_thuc: HinhThucQuyen;
    hinh_thuc_thi_dau?: 'theo_diem' | 'dau_loai_ban_ket';
    gioi: 'nam' | 'nu' | 'nam_nu';
    lua_tuoi: string;
    trang_thai: TrangThaiND;
    ghi_chu: string;
    updated: string;
}

export interface HangCan {
    id: string;
    gioi: GioiTinh;
    lua_tuoi: string;
    can_tu: number;
    can_den: number; // 0 = vô hạn (∞)
    trang_thai: TrangThaiND;
}

export interface LuaTuoi {
    id: string;
    ma: string;
    ten: string;
    tu_tuoi: number;
    den_tuoi: number;
    trang_thai: 'active' | 'draft';
}

export interface TranDauDK {
    id: string;
    san_id: string;
    vdv_do: { id: string; ten: string; doan: string };
    vdv_xanh: { id: string; ten: string; doan: string };
    hang_can: string;
    vong: VongDau;
    trang_thai: TrangThaiTranDau;
    diem_do: number;
    diem_xanh: number;
    diem_hiep_do: number[];
    diem_hiep_xanh: number[];
    hiep: number;
    thoi_gian: string;
    ket_qua: string;
    trong_tai: string[];
}

export interface LuotThiQuyen {
    id: string;
    san_id: string;
    vdv_id: string;
    vdv_ten: string;
    doan_ten: string;
    noi_dung: string;
    gioi_tinh: string;
    lua_tuoi: string;
    diem: number[];
    diem_tb: number;
    tie_breakers?: {
        tb1: number;
        tb2: number;
        tb3: number;
        tb4: number;
    };
    tie_breaker_reason?: string;
    xep_hang: number;
    trang_thai: TrangThaiQuyen;
}

export interface KhieuNai {
    id: string;
    doan_id: string;
    doan_ten: string;
    loai: LoaiKN;
    noi_dung_lien_quan: string;
    tran_dau_id: string;
    ly_do: string;
    bang_chung: string;
    trang_thai: TrangThaiKN;
    ket_luan: string;
    nguoi_xu_ly: string;
    thoi_gian_nop: string;
    thoi_gian_xu_ly: string;
}
