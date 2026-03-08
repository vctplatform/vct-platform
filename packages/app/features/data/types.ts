// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — SHARED TYPE DEFINITIONS
// ════════════════════════════════════════════════════════════════

// ── Enums & Literals ──────────────────────────────────────────

export type TrangThaiGiai = 'nhap' | 'dang_ky' | 'khoa_dk' | 'thi_dau' | 'ket_thuc';
export type CapDoGiai = 'quoc_gia' | 'khu_vuc' | 'tinh' | 'clb';
export type GioiTinh = 'nam' | 'nu';
export type LoaiNoiDung = 'quyen' | 'doi_khang';
export type TrangThaiND = 'active' | 'draft' | 'closed';
export type HinhThucQuyen = 'ca_nhan' | 'doi' | 'dong_doi';
export type TrangThaiSan = 'dong' | 'san_sang' | 'dang_chuan_bi' | 'dang_thi_dau' | 'su_co' | 'bao_tri';
export type LoaiSan = 'quyen' | 'doi_khang' | 'ca_hai';
export type TrangThaiDoan = 'nhap' | 'cho_duyet' | 'yeu_cau_bo_sung' | 'da_xac_nhan' | 'da_checkin' | 'tu_choi';
export type LoaiDoan = 'doan_tinh' | 'clb' | 'ca_nhan';
export type TrangThaiVDV = 'du_dieu_kien' | 'cho_xac_nhan' | 'thieu_ho_so' | 'nhap';
export type TrangThaiDK = 'da_duyet' | 'cho_duyet' | 'tu_choi';
export type CapBacTT = 'quoc_gia' | 'cap_1' | 'cap_2' | 'cap_3';
export type ChuyenMonTT = 'quyen' | 'doi_khang' | 'ca_hai';
export type TrangThaiTT = 'xac_nhan' | 'cho_duyet' | 'tu_choi';
export type KetQuaCan = 'dat' | 'khong_dat' | 'cho_can';
export type VongDau = 'vong_loai' | 'tu_ket' | 'ban_ket' | 'chung_ket';
export type TrangThaiTranDau = 'chua_dau' | 'dang_dau' | 'ket_thuc';
export type TrangThaiQuyen = 'cho_thi' | 'dang_thi' | 'da_cham' | 'hoan';
export type TrangThaiLich = 'du_kien' | 'xac_nhan' | 'dang_dien_ra' | 'hoan_thanh';
export type PhienThi = 'sang' | 'chieu' | 'toi';
export type LoaiKN = 'khieu_nai' | 'khang_nghi';
export type TrangThaiKN = 'moi' | 'dang_xu_ly' | 'chap_nhan' | 'bac_bo';
export type LoaiTaiTro = 'chinh' | 'vang' | 'bac' | 'dong_hanh';
export type TrangThaiTrangBi = 'tot' | 'thieu' | 'hong';

// ── Audit Entry ───────────────────────────────────────────────

export interface AuditEntry {
    time: string;
    action: string;
    by: string;
}

// ── 1. Tournament Config ──────────────────────────────────────

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
        thoi_gian_hiep: number; // in seconds
        thoi_gian_nghi: number; // in seconds
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

// ── 2. Nội dung Quyền ─────────────────────────────────────────

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

// ── 3. Hạng cân Đối kháng ────────────────────────────────────

export interface HangCan {
    id: string;
    gioi: GioiTinh;
    lua_tuoi: string;
    can_tu: number;
    can_den: number; // 0 = vô hạn (∞)
    trang_thai: TrangThaiND;
}

// ── 4. Lứa tuổi ──────────────────────────────────────────────

export interface LuaTuoi {
    id: string;
    ma: string;
    ten: string;
    tu_tuoi: number;
    den_tuoi: number;
    trang_thai: 'active' | 'draft';
}

// ── 5. Sàn đấu ───────────────────────────────────────────────

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

// ── 6. Đơn vị (Teams) ────────────────────────────────────────

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

// ── 7. Vận động viên ─────────────────────────────────────────

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

// ── 8. Đăng ký nội dung ──────────────────────────────────────

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

// ── 9. Trọng tài ─────────────────────────────────────────────

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

// ── 10. Cân ký ────────────────────────────────────────────────

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

// ── 11. Trận đấu Đối kháng ───────────────────────────────────

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
    hiep: number;
    thoi_gian: string;
    ket_qua: string;
    trong_tai: string[];
}

// ── 12. Lượt thi Quyền ───────────────────────────────────────

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
        tb1: number; // max(middle)
        tb2: number; // min(middle)
        tb3: number; // max(dropped)
        tb4: number; // min(dropped)
    };
    tie_breaker_reason?: string;
    xep_hang: number;
    trang_thai: TrangThaiQuyen;
}

// ── 13. Lịch thi đấu ─────────────────────────────────────────

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

// ── 14. Khiếu nại ────────────────────────────────────────────

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

// ── Status Maps (shared label+color lookups) ──────────────────

export const TRANG_THAI_DOAN_MAP: Record<TrangThaiDoan, { label: string; color: string; type: string }> = {
    nhap: { label: 'Nháp', color: '#94a3b8', type: 'info' },
    cho_duyet: { label: 'Chờ duyệt', color: '#f59e0b', type: 'warning' },
    yeu_cau_bo_sung: { label: 'Yêu cầu bổ sung', color: '#ef4444', type: 'danger' },
    da_xac_nhan: { label: 'Đã xác nhận', color: '#10b981', type: 'success' },
    da_checkin: { label: 'Đã check-in', color: '#22d3ee', type: 'info' },
    tu_choi: { label: 'Từ chối', color: '#ef4444', type: 'danger' },
};

export const TRANG_THAI_VDV_MAP: Record<TrangThaiVDV, { label: string; color: string; type: string }> = {
    du_dieu_kien: { label: 'Đủ điều kiện', color: '#10b981', type: 'success' },
    cho_xac_nhan: { label: 'Chờ xác nhận', color: '#f59e0b', type: 'warning' },
    thieu_ho_so: { label: 'Thiếu hồ sơ', color: '#ef4444', type: 'danger' },
    nhap: { label: 'Nháp', color: '#94a3b8', type: 'info' },
};

export const TRANG_THAI_DK_MAP: Record<TrangThaiDK, { label: string; color: string; type: string }> = {
    da_duyet: { label: 'Đã duyệt', color: '#10b981', type: 'success' },
    cho_duyet: { label: 'Chờ duyệt', color: '#f59e0b', type: 'warning' },
    tu_choi: { label: 'Từ chối', color: '#ef4444', type: 'danger' },
};

export const TRANG_THAI_TT_MAP: Record<TrangThaiTT, { label: string; color: string; type: string }> = {
    xac_nhan: { label: 'Xác nhận', color: '#10b981', type: 'success' },
    cho_duyet: { label: 'Chờ duyệt', color: '#f59e0b', type: 'warning' },
    tu_choi: { label: 'Từ chối', color: '#ef4444', type: 'danger' },
};

export const CAP_BAC_TT_MAP: Record<CapBacTT, { label: string; color: string }> = {
    quoc_gia: { label: 'Quốc gia', color: '#a78bfa' },
    cap_1: { label: 'Cấp 1', color: '#22d3ee' },
    cap_2: { label: 'Cấp 2', color: '#10b981' },
    cap_3: { label: 'Cấp 3', color: '#94a3b8' },
};

export const TRANG_THAI_KN_MAP: Record<TrangThaiKN, { label: string; color: string; type: string }> = {
    moi: { label: 'Mới', color: '#ef4444', type: 'danger' },
    dang_xu_ly: { label: 'Đang xử lý', color: '#f59e0b', type: 'warning' },
    chap_nhan: { label: 'Chấp nhận', color: '#10b981', type: 'success' },
    bac_bo: { label: 'Bác bỏ', color: '#94a3b8', type: 'info' },
};

export const DOC_CHECKLIST = [
    'Công văn cử đoàn',
    'Danh sách VĐV',
    'Ảnh VĐV 3x4',
    'Giấy khám sức khoẻ',
    'Bảo hiểm y tế',
    'Bằng HLV',
];
