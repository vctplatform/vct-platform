-- ═══════════════════════════════════════════════════════════════
-- VCT Platform — Migration 0048: BTC, Parent, Training Tables
-- Migrates in-memory stores to persistent PostgreSQL tables.
-- ═══════════════════════════════════════════════════════════════

-- ── BTC Members ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS btc_members (
    id          TEXT PRIMARY KEY,
    ten         TEXT NOT NULL,
    chuc_vu     TEXT NOT NULL DEFAULT '',
    ban         TEXT NOT NULL DEFAULT '',
    cap         INT  NOT NULL DEFAULT 3,
    sdt         TEXT NOT NULL DEFAULT '',
    email       TEXT NOT NULL DEFAULT '',
    don_vi      TEXT NOT NULL DEFAULT '',
    giai_id     TEXT NOT NULL DEFAULT '',
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_btc_members_giai ON btc_members(giai_id);

-- ── BTC Weigh-Ins ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS btc_weigh_ins (
    id          TEXT PRIMARY KEY,
    giai_id     TEXT NOT NULL,
    vdv_id      TEXT NOT NULL,
    vdv_ten     TEXT NOT NULL DEFAULT '',
    doan_id     TEXT NOT NULL DEFAULT '',
    doan_ten    TEXT NOT NULL DEFAULT '',
    hang_can    TEXT NOT NULL DEFAULT '',
    can_nang    DOUBLE PRECISION NOT NULL DEFAULT 0,
    gioi_han    DOUBLE PRECISION NOT NULL DEFAULT 0,
    sai_so      DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    ket_qua     TEXT NOT NULL DEFAULT 'cho_can',
    lan_can     INT  NOT NULL DEFAULT 1,
    ghi_chu     TEXT NOT NULL DEFAULT '',
    nguoi_can   TEXT NOT NULL DEFAULT '',
    thoi_gian   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_btc_weigh_ins_giai ON btc_weigh_ins(giai_id);

-- ── BTC Draws ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS btc_draws (
    id          TEXT PRIMARY KEY,
    giai_id     TEXT NOT NULL,
    noi_dung_id TEXT NOT NULL DEFAULT '',
    noi_dung_ten TEXT NOT NULL DEFAULT '',
    loai_nd     TEXT NOT NULL DEFAULT '',
    hang_can    TEXT NOT NULL DEFAULT '',
    lua_tuoi    TEXT NOT NULL DEFAULT '',
    so_vdv      INT  NOT NULL DEFAULT 0,
    nhanh       JSONB NOT NULL DEFAULT '[]',
    thu_tu      JSONB NOT NULL DEFAULT '[]',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by  TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_btc_draws_giai ON btc_draws(giai_id);

-- ── BTC Referee Assignments ─────────────────────────────────
CREATE TABLE IF NOT EXISTS btc_assignments (
    id             TEXT PRIMARY KEY,
    giai_id        TEXT NOT NULL,
    trong_tai_id   TEXT NOT NULL,
    trong_tai_ten  TEXT NOT NULL DEFAULT '',
    cap_bac        TEXT NOT NULL DEFAULT '',
    chuyen_mon     TEXT NOT NULL DEFAULT '',
    san_id         TEXT NOT NULL DEFAULT '',
    san_ten        TEXT NOT NULL DEFAULT '',
    ngay           TEXT NOT NULL DEFAULT '',
    phien          TEXT NOT NULL DEFAULT '',
    vai_tro        TEXT NOT NULL DEFAULT '',
    trang_thai     TEXT NOT NULL DEFAULT 'phan_cong',
    ghi_chu        TEXT NOT NULL DEFAULT '',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_btc_assignments_giai ON btc_assignments(giai_id);

-- ── BTC Team Results ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS btc_team_results (
    id       TEXT PRIMARY KEY,
    giai_id  TEXT NOT NULL,
    doan_id  TEXT NOT NULL DEFAULT '',
    doan_ten TEXT NOT NULL DEFAULT '',
    tinh     TEXT NOT NULL DEFAULT '',
    hcv      INT  NOT NULL DEFAULT 0,
    hcb      INT  NOT NULL DEFAULT 0,
    hcd      INT  NOT NULL DEFAULT 0,
    tong_hc  INT  NOT NULL DEFAULT 0,
    diem     INT  NOT NULL DEFAULT 0,
    xep_hang INT  NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_btc_team_results_giai ON btc_team_results(giai_id);

-- ── BTC Content Results ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS btc_content_results (
    id           TEXT PRIMARY KEY,
    giai_id      TEXT NOT NULL,
    noi_dung_id  TEXT NOT NULL DEFAULT '',
    noi_dung_ten TEXT NOT NULL DEFAULT '',
    hang_can     TEXT NOT NULL DEFAULT '',
    lua_tuoi     TEXT NOT NULL DEFAULT '',
    vdv_id_nhat  TEXT NOT NULL DEFAULT '',
    vdv_ten_nhat TEXT NOT NULL DEFAULT '',
    doan_nhat    TEXT NOT NULL DEFAULT '',
    vdv_id_nhi   TEXT NOT NULL DEFAULT '',
    vdv_ten_nhi  TEXT NOT NULL DEFAULT '',
    doan_nhi     TEXT NOT NULL DEFAULT '',
    vdv_id_ba_1  TEXT NOT NULL DEFAULT '',
    vdv_ten_ba_1 TEXT NOT NULL DEFAULT '',
    doan_ba_1    TEXT NOT NULL DEFAULT '',
    vdv_id_ba_2  TEXT NOT NULL DEFAULT '',
    vdv_ten_ba_2 TEXT NOT NULL DEFAULT '',
    doan_ba_2    TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_btc_content_results_giai ON btc_content_results(giai_id);

-- ── BTC Finance ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS btc_finance (
    id         TEXT PRIMARY KEY,
    giai_id    TEXT NOT NULL,
    loai       TEXT NOT NULL DEFAULT 'thu',
    danh_muc   TEXT NOT NULL DEFAULT '',
    mo_ta      TEXT NOT NULL DEFAULT '',
    so_tien    DOUBLE PRECISION NOT NULL DEFAULT 0,
    doan_id    TEXT NOT NULL DEFAULT '',
    doan_ten   TEXT NOT NULL DEFAULT '',
    trang_thai TEXT NOT NULL DEFAULT 'chua_thu',
    ngay_gd    TEXT NOT NULL DEFAULT '',
    ghi_chu    TEXT NOT NULL DEFAULT '',
    created_by TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_btc_finance_giai ON btc_finance(giai_id);

-- ── BTC Technical Meetings ──────────────────────────────────
CREATE TABLE IF NOT EXISTS btc_meetings (
    id           TEXT PRIMARY KEY,
    giai_id      TEXT NOT NULL,
    tieu_de      TEXT NOT NULL DEFAULT '',
    ngay         TEXT NOT NULL DEFAULT '',
    dia_diem     TEXT NOT NULL DEFAULT '',
    chu_tri      TEXT NOT NULL DEFAULT '',
    tham_du      JSONB NOT NULL DEFAULT '[]',
    noi_dung     TEXT NOT NULL DEFAULT '',
    quyet_dinh   JSONB NOT NULL DEFAULT '[]',
    bien_ban_file TEXT NOT NULL DEFAULT '',
    trang_thai   TEXT NOT NULL DEFAULT 'du_kien',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_btc_meetings_giai ON btc_meetings(giai_id);

-- ── BTC Protests ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS btc_protests (
    id         TEXT PRIMARY KEY,
    giai_id    TEXT NOT NULL,
    tran_id    TEXT NOT NULL DEFAULT '',
    tran_mo_ta TEXT NOT NULL DEFAULT '',
    nguoi_nop  TEXT NOT NULL DEFAULT '',
    doan_ten   TEXT NOT NULL DEFAULT '',
    loai_kn    TEXT NOT NULL DEFAULT '',
    ly_do      TEXT NOT NULL DEFAULT '',
    trang_thai TEXT NOT NULL DEFAULT 'moi',
    has_video  BOOLEAN NOT NULL DEFAULT FALSE,
    quyet_dinh TEXT NOT NULL DEFAULT '',
    nguoi_xl   TEXT NOT NULL DEFAULT '',
    ngay_nop   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ngay_xl    TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_btc_protests_giai ON btc_protests(giai_id);

-- ═══════════════════════════════════════════════════════════════
-- PARENT MODULE
-- ═══════════════════════════════════════════════════════════════

-- ── Parent Links ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parent_links (
    id           TEXT PRIMARY KEY,
    parent_id    TEXT NOT NULL,
    parent_name  TEXT NOT NULL DEFAULT '',
    athlete_id   TEXT NOT NULL,
    athlete_name TEXT NOT NULL DEFAULT '',
    club_name    TEXT NOT NULL DEFAULT '',
    belt_level   TEXT NOT NULL DEFAULT '',
    relation     TEXT NOT NULL DEFAULT '',
    status       TEXT NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_parent_links_parent ON parent_links(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_links_athlete ON parent_links(athlete_id);

-- ── Parent Consents ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parent_consents (
    id           TEXT PRIMARY KEY,
    parent_id    TEXT NOT NULL,
    athlete_id   TEXT NOT NULL,
    athlete_name TEXT NOT NULL DEFAULT '',
    type         TEXT NOT NULL DEFAULT '',
    title        TEXT NOT NULL DEFAULT '',
    description  TEXT NOT NULL DEFAULT '',
    status       TEXT NOT NULL DEFAULT 'active',
    signed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at   TIMESTAMPTZ,
    revoked_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_parent_consents_parent ON parent_consents(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_consents_athlete ON parent_consents(athlete_id);

-- ── Parent Attendance (child attendance view) ───────────────
CREATE TABLE IF NOT EXISTS parent_attendance (
    id         SERIAL PRIMARY KEY,
    athlete_id TEXT NOT NULL,
    date       TEXT NOT NULL DEFAULT '',
    session    TEXT NOT NULL DEFAULT '',
    status     TEXT NOT NULL DEFAULT 'present',
    coach      TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_parent_attendance_athlete ON parent_attendance(athlete_id);

-- ── Parent Results (child competition results) ──────────────
CREATE TABLE IF NOT EXISTS parent_results (
    id         SERIAL PRIMARY KEY,
    athlete_id TEXT NOT NULL,
    tournament TEXT NOT NULL DEFAULT '',
    category   TEXT NOT NULL DEFAULT '',
    result     TEXT NOT NULL DEFAULT '',
    date       TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_parent_results_athlete ON parent_results(athlete_id);

-- ═══════════════════════════════════════════════════════════════
-- TRAINING MODULE
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS training_sessions (
    id          TEXT PRIMARY KEY,
    athlete_id  TEXT NOT NULL,
    coach_id    TEXT NOT NULL DEFAULT '',
    club_id     TEXT NOT NULL DEFAULT '',
    date        TEXT NOT NULL DEFAULT '',
    start_time  TEXT NOT NULL DEFAULT '',
    end_time    TEXT NOT NULL DEFAULT '',
    type        TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    notes       TEXT NOT NULL DEFAULT '',
    status      TEXT NOT NULL DEFAULT 'scheduled',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_training_sessions_athlete ON training_sessions(athlete_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_club ON training_sessions(club_id);
