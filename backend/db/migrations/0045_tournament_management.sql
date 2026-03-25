-- ═══════════════════════════════════════════════════════════════
-- VCT PLATFORM — 0041 TOURNAMENT MANAGEMENT
-- Categories, Registrations, Schedule, Arena, Results, Standings
-- ═══════════════════════════════════════════════════════════════

-- ── Tournament Categories ────────────────────────────────────
CREATE TABLE IF NOT EXISTS tournament_categories (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL,
    content_type TEXT NOT NULL,          -- doi_khang, quyen, song_luyen, etc.
    age_group    TEXT NOT NULL DEFAULT '',
    weight_class TEXT NOT NULL DEFAULT '',
    gender       TEXT NOT NULL,          -- nam, nu
    name         TEXT NOT NULL,
    max_athletes INT NOT NULL DEFAULT 0,
    min_athletes INT NOT NULL DEFAULT 0,
    is_team_event BOOLEAN NOT NULL DEFAULT FALSE,
    status       TEXT NOT NULL DEFAULT 'active',  -- active, closed, cancelled
    sort_order   INT NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tournament_categories_tid ON tournament_categories(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_categories_content ON tournament_categories(content_type);

-- ── Tournament Registrations ─────────────────────────────────
CREATE TABLE IF NOT EXISTS tournament_registrations (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id  UUID NOT NULL,
    team_id        TEXT NOT NULL DEFAULT '',
    team_name      TEXT NOT NULL,
    province       TEXT NOT NULL DEFAULT '',
    team_type      TEXT NOT NULL DEFAULT 'doan_tinh',  -- doan_tinh, clb, ca_nhan
    status         TEXT NOT NULL DEFAULT 'nhap',       -- nhap, cho_duyet, da_duyet, tu_choi, yeu_cau_bo_sung
    head_coach     TEXT NOT NULL DEFAULT '',
    head_coach_id  TEXT NOT NULL DEFAULT '',
    total_athletes INT NOT NULL DEFAULT 0,
    total_contents INT NOT NULL DEFAULT 0,
    submitted_at   TIMESTAMPTZ,
    approved_by    TEXT NOT NULL DEFAULT '',
    approved_at    TIMESTAMPTZ,
    rejected_by    TEXT NOT NULL DEFAULT '',
    reject_reason  TEXT NOT NULL DEFAULT '',
    notes          TEXT NOT NULL DEFAULT '',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tournament_registrations_tid ON tournament_registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_status ON tournament_registrations(status);

-- ── Registration Athletes ────────────────────────────────────
CREATE TABLE IF NOT EXISTS tournament_registration_athletes (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id  UUID NOT NULL REFERENCES tournament_registrations(id) ON DELETE CASCADE,
    athlete_id       TEXT NOT NULL DEFAULT '',
    athlete_name     TEXT NOT NULL,
    date_of_birth    TEXT NOT NULL DEFAULT '',
    gender           TEXT NOT NULL DEFAULT '',
    weight           NUMERIC(6,2) NOT NULL DEFAULT 0,
    belt_rank        TEXT NOT NULL DEFAULT '',
    category_ids     TEXT[] NOT NULL DEFAULT '{}',
    status           TEXT NOT NULL DEFAULT 'cho_xac_nhan',
    notes            TEXT NOT NULL DEFAULT '',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reg_athletes_rid ON tournament_registration_athletes(registration_id);

-- ── Schedule Slots ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tournament_schedule_slots (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL,
    arena_id      TEXT NOT NULL DEFAULT '',
    arena_name    TEXT NOT NULL DEFAULT '',
    date          TEXT NOT NULL,
    session       TEXT NOT NULL DEFAULT '',    -- sang, chieu, toi
    start_time    TEXT NOT NULL DEFAULT '',    -- HH:MM
    end_time      TEXT NOT NULL DEFAULT '',    -- HH:MM
    category_id   TEXT NOT NULL DEFAULT '',
    category_name TEXT NOT NULL DEFAULT '',
    content_type  TEXT NOT NULL DEFAULT '',
    match_count   INT NOT NULL DEFAULT 0,
    status        TEXT NOT NULL DEFAULT 'du_kien',  -- du_kien, xac_nhan, dang_dien_ra, hoan_thanh, hoan
    notes         TEXT NOT NULL DEFAULT '',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedule_slots_tid ON tournament_schedule_slots(tournament_id);
CREATE INDEX IF NOT EXISTS idx_schedule_slots_date ON tournament_schedule_slots(date, session);

-- ── Arena Assignments ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tournament_arena_assignments (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL,
    arena_id      TEXT NOT NULL,
    arena_name    TEXT NOT NULL DEFAULT '',
    date          TEXT NOT NULL,
    content_types TEXT[] NOT NULL DEFAULT '{}',
    session       TEXT NOT NULL DEFAULT 'ca_ngay',
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_arena_assignments_tid ON tournament_arena_assignments(tournament_id);

-- ── Tournament Results ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS tournament_results (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL,
    category_id   TEXT NOT NULL,
    category_name TEXT NOT NULL DEFAULT '',
    content_type  TEXT NOT NULL DEFAULT '',
    gold_id       TEXT NOT NULL DEFAULT '',
    gold_name     TEXT NOT NULL DEFAULT '',
    gold_team     TEXT NOT NULL DEFAULT '',
    silver_id     TEXT NOT NULL DEFAULT '',
    silver_name   TEXT NOT NULL DEFAULT '',
    silver_team   TEXT NOT NULL DEFAULT '',
    bronze1_id    TEXT NOT NULL DEFAULT '',
    bronze1_name  TEXT NOT NULL DEFAULT '',
    bronze1_team  TEXT NOT NULL DEFAULT '',
    bronze2_id    TEXT NOT NULL DEFAULT '',
    bronze2_name  TEXT NOT NULL DEFAULT '',
    bronze2_team  TEXT NOT NULL DEFAULT '',
    is_finalized  BOOLEAN NOT NULL DEFAULT FALSE,
    finalized_by  TEXT NOT NULL DEFAULT '',
    finalized_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tournament_results_tid ON tournament_results(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_results_cat ON tournament_results(category_id);

-- ── Team Standings (Toàn đoàn) ──────────────────────────────
CREATE TABLE IF NOT EXISTS tournament_team_standings (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL,
    team_id       TEXT NOT NULL,
    team_name     TEXT NOT NULL DEFAULT '',
    province      TEXT NOT NULL DEFAULT '',
    gold          INT NOT NULL DEFAULT 0,
    silver        INT NOT NULL DEFAULT 0,
    bronze        INT NOT NULL DEFAULT 0,
    total_medals  INT NOT NULL DEFAULT 0,
    points        INT NOT NULL DEFAULT 0,
    rank          INT NOT NULL DEFAULT 0,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tournament_id, team_id)
);

CREATE INDEX IF NOT EXISTS idx_team_standings_tid ON tournament_team_standings(tournament_id);
CREATE INDEX IF NOT EXISTS idx_team_standings_rank ON tournament_team_standings(tournament_id, rank);
