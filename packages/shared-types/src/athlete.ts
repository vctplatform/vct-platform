// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — ATHLETE DOMAIN TYPES
// ════════════════════════════════════════════════════════════════

import type {
    GioiTinh, TrangThaiVDV, TrangThaiDK, LoaiNoiDung,
    CapBacTT, ChuyenMonTT, TrangThaiTT, KetQuaCan,
} from './common';

export interface VanDongVien {
    id: string;
    ho_ten: string;
    gioi: GioiTinh;
    ngay_sinh: string;
    tuoi: number;
    can_nang: number;
    chieu_cao: number;
    doan_id: string;
    doan_ten: string;
    nd_quyen: string[];
    nd_dk: string;
    trang_thai: TrangThaiVDV;
    ho_so: {
        kham_sk: boolean;
        bao_hiem: boolean;
        anh: boolean;
        cmnd: boolean;
    };
    ghi_chu: string;
}

export interface DangKy {
    id: string;
    vdv_id: string;
    vdv_ten: string;
    doan_id: string;
    doan_ten: string;
    loai: LoaiNoiDung;
    nd_id: string;
    nd_ten: string;
    trang_thai: TrangThaiDK;
    ngay: string;
}

export interface TrongTai {
    id: string;
    ho_ten: string;
    gioi: GioiTinh;
    ngay_sinh: string;
    cap_bac: CapBacTT;
    chuyen_mon: ChuyenMonTT;
    don_vi: string;
    sdt: string;
    email: string;
    trang_thai: TrangThaiTT;
    kinh_nghiem: string;
    ghi_chu: string;
}

export interface CanKy {
    id: string;
    vdv_id: string;
    vdv_ten: string;
    doan_ten: string;
    gioi: GioiTinh;
    hang_can_dk: string;
    can_tu: number;
    can_den: number;
    can_thuc_te: number;
    ket_qua: KetQuaCan;
    ghi_chu: string;
    thoi_gian: string;
}
