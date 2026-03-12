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

// ════════════════════════════════════════════════════════════════
// TOURNAMENT MANAGEMENT TYPES
// ════════════════════════════════════════════════════════════════

// ── Status Enums ─────────────────────────────────────────────

export const TRANG_THAI_DANG_KY_GIAI_VALUES = ['nhap', 'cho_duyet', 'da_duyet', 'tu_choi', 'yeu_cau_bo_sung'] as const;
export type TrangThaiDangKyGiai = typeof TRANG_THAI_DANG_KY_GIAI_VALUES[number];

export const TRANG_THAI_DANG_KY_GIAI_MAP: Record<TrangThaiDangKyGiai, { label: string; color: string; type: string }> = {
    nhap:            { label: 'Nháp',            color: '#94a3b8', type: 'info' },
    cho_duyet:       { label: 'Chờ duyệt',       color: '#f59e0b', type: 'warning' },
    da_duyet:        { label: 'Đã duyệt',        color: '#10b981', type: 'success' },
    tu_choi:         { label: 'Từ chối',          color: '#ef4444', type: 'danger' },
    yeu_cau_bo_sung: { label: 'Yêu cầu bổ sung', color: '#f97316', type: 'warning' },
};

export const TRANG_THAI_SLOT_VALUES = ['du_kien', 'xac_nhan', 'dang_dien_ra', 'hoan_thanh', 'hoan'] as const;
export type TrangThaiSlot = typeof TRANG_THAI_SLOT_VALUES[number];

export const TRANG_THAI_SLOT_MAP: Record<TrangThaiSlot, { label: string; color: string; type: string }> = {
    du_kien:      { label: 'Dự kiến',       color: '#94a3b8', type: 'info' },
    xac_nhan:     { label: 'Xác nhận',      color: '#3b82f6', type: 'info' },
    dang_dien_ra: { label: 'Đang diễn ra',  color: '#f59e0b', type: 'warning' },
    hoan_thanh:   { label: 'Hoàn thành',    color: '#10b981', type: 'success' },
    hoan:         { label: 'Hoãn',          color: '#ef4444', type: 'danger' },
};

// ── Category ─────────────────────────────────────────────────

export interface TournamentCategory {
    id: string;
    tournament_id: string;
    content_type: string;
    age_group: string;
    weight_class: string;
    gender: string;
    name: string;
    max_athletes: number;
    min_athletes: number;
    is_team_event: boolean;
    status: 'active' | 'closed' | 'cancelled';
    sort_order: number;
    created_at: string;
    updated_at: string;
}

// ── Registration ─────────────────────────────────────────────

export interface TournamentRegistration {
    id: string;
    tournament_id: string;
    team_id: string;
    team_name: string;
    province: string;
    team_type: string;
    status: TrangThaiDangKyGiai;
    head_coach: string;
    head_coach_id: string;
    total_athletes: number;
    total_contents: number;
    submitted_at?: string;
    approved_by?: string;
    approved_at?: string;
    rejected_by?: string;
    reject_reason?: string;
    notes: string;
    created_at: string;
    updated_at: string;
}

export interface RegistrationAthlete {
    id: string;
    registration_id: string;
    athlete_id: string;
    athlete_name: string;
    date_of_birth: string;
    gender: string;
    weight: number;
    belt_rank: string;
    category_ids: string[];
    status: string;
    notes: string;
    created_at: string;
}

// ── Schedule ─────────────────────────────────────────────────

export interface ScheduleSlot {
    id: string;
    tournament_id: string;
    arena_id: string;
    arena_name: string;
    date: string;
    session: PhienThi;
    start_time: string;
    end_time: string;
    category_id: string;
    category_name: string;
    content_type: string;
    match_count: number;
    status: TrangThaiSlot;
    notes: string;
    created_at: string;
    updated_at: string;
}

export interface ArenaAssignment {
    id: string;
    tournament_id: string;
    arena_id: string;
    arena_name: string;
    date: string;
    content_types: string[];
    session: string;
    is_active: boolean;
    created_at: string;
}

// ── Results ──────────────────────────────────────────────────

export interface TournamentResult {
    id: string;
    tournament_id: string;
    category_id: string;
    category_name: string;
    content_type: string;
    gold_id: string;
    gold_name: string;
    gold_team: string;
    silver_id: string;
    silver_name: string;
    silver_team: string;
    bronze1_id: string;
    bronze1_name: string;
    bronze1_team: string;
    bronze2_id: string;
    bronze2_name: string;
    bronze2_team: string;
    is_finalized: boolean;
    finalized_by?: string;
    finalized_at?: string;
    created_at: string;
    updated_at: string;
}

export interface TeamStanding {
    id: string;
    tournament_id: string;
    team_id: string;
    team_name: string;
    province: string;
    gold: number;
    silver: number;
    bronze: number;
    total_medals: number;
    points: number;
    rank: number;
    updated_at: string;
}

// ── Dashboard Stats ──────────────────────────────────────────

export interface TournamentDashboardStats {
    total_categories: number;
    total_registrations: number;
    pending_registrations: number;
    approved_registrations: number;
    total_athletes: number;
    total_teams: number;
    total_schedule_slots: number;
    completed_slots: number;
    total_results: number;
    finalized_results: number;
    total_gold: number;
    total_silver: number;
    total_bronze: number;
    registration_rate: number;
    completion_rate: number;
}

