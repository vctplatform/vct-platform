// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — ORGANIZATION DOMAIN TYPES
// ════════════════════════════════════════════════════════════════

import type {
    TrangThaiDoan, LoaiDoan, TrangThaiSan, LoaiSan,
    TrangThaiTrangBi, AuditEntry,
} from './common';

export interface DonVi {
    id: string;
    ma: string;
    ten: string;
    tat: string;
    loai: LoaiDoan;
    tinh: string;
    truong_doan: string;
    sdt: string;
    email: string;
    dia_chi: string;
    so_vdv: number;
    nam: number;
    nu: number;
    hlv: number;
    nd_q: number;
    nd_dk: number;
    trang_thai: TrangThaiDoan;
    le_phi: { tong: number; da_dong: number };
    docs: Record<number, boolean>;
    ngay_dk: string;
    audit: AuditEntry[];
    ghi_chu: string;
    thanh_tich: string;
}

export interface SanDau {
    id: string;
    ten: string;
    vi_tri: string;
    loai: LoaiSan;
    kich_thuoc: string;
    trang_thai: TrangThaiSan;
    phu_trach: string;
    phu_trach_sdt: string;
    sub_state: string;
    noi_dung: string;
    match_live: {
        vdv1: string; vdv2: string;
        diem1: number; diem2: number;
        hiep: number; time: string;
    } | null;
    queue: Array<{ id: string; noi_dung: string; vdv1: string; vdv2: string }>;
    done_today: number;
    total_today: number;
    capacity: number;
    trong_tai: string[];
    trang_bi: Array<{ ten: string; sl: number; tt: TrangThaiTrangBi }>;
    history: AuditEntry[];
    ghi_chu: string;
}
