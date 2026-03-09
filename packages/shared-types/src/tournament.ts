// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — TOURNAMENT DOMAIN TYPES
// ════════════════════════════════════════════════════════════════

import type {
    TrangThaiGiai, CapDoGiai, LoaiTaiTro, AuditEntry,
    TrangThaiLich, PhienThi,
} from './common';

export interface TournamentConfig {
    ten_giai: string;
    ma_giai: string;
    cap_do: CapDoGiai;
    lan_thu: number;
    nam: string;
    ngay_bat_dau: string;
    ngay_ket_thuc: string;
    ngay_dk_cuoi: string;
    dia_diem: string;
    dia_chi: string;
    tinh: string;
    dv_to_chuc: string;
    dv_dang_cai: string;
    website: string;
    email: string;
    dien_thoai: string;
    trang_thai: TrangThaiGiai;
    link_dieu_le: string;

    cau_hinh_quyen: {
        hinh_thuc: 'theo_diem' | 'dau_loai_ban_ket';
        so_giam_dinh: 5 | 7;
    };

    cau_hinh_doi_khang: {
        dong_huy_chuong_dong: boolean;
        so_giam_dinh: 3 | 5;
        thoi_gian_hiep: number;
        thoi_gian_nghi: number;
    };

    quota: {
        max_vdv_per_doan: number;
        max_nd_per_vdv: number;
        max_hlv_per_doan: number;
        max_doan: number;
    };

    le_phi: { vdv: number; noi_dung: number; doan: number };
    giai_thuong: { hcv: number; hcb: number; hcd: number };
    giai_thuong_toan_doan: { nhat: number; nhi: number; ba: number };
    cach_tinh_diem_toan_doan: 'theo_huy_chuong' | 'theo_diem';
    diem_xep_hang: Array<{ thu_hang: number; diem: number }>;

    tai_tro: Array<{ ten: string; loai: LoaiTaiTro }>;

    btc: Array<{
        ten: string;
        chuc_vu: string;
        ban: string;
        cap: number;
        sdt: string;
        email: string;
        dv: string;
    }>;

    y_te: { benh_vien: string; bv_kc: string; bv_sdt: string; xe_cap_cuu: string; doi_y_te: string };
    phap_ly: { qd_to_chuc: string; phien_ban_luat: string; bao_hiem: string };
    dieu_le: string;
    ghi_chu: string;

    checklist: Array<{ id: string; label: string; done: boolean }>;
    audit: AuditEntry[];
}

export interface LichThiDau {
    id: string;
    ngay: string;
    phien: PhienThi;
    gio_bat_dau: string;
    gio_ket_thuc: string;
    san_id: string;
    noi_dung: string;
    so_tran: number;
    trang_thai: TrangThaiLich;
}
