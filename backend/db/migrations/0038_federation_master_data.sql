-- ═══════════════════════════════════════════════════════════════
-- VCT PLATFORM — Migration 0038: Federation Master Data Tables
-- Belts, weight classes, age groups, competition contents
-- ═══════════════════════════════════════════════════════════════

-- 1. Master belts (hệ thống đai)
CREATE TABLE IF NOT EXISTS master_belts (
    level            INT          NOT NULL,
    name             TEXT         NOT NULL,
    color_hex        VARCHAR(7)   NOT NULL DEFAULT '#FFFFFF',
    required_time_min INT         NOT NULL DEFAULT 0,
    is_dan_level     BOOLEAN      NOT NULL DEFAULT FALSE,
    description      TEXT,
    scope            VARCHAR(20)  NOT NULL DEFAULT 'NATIONAL',  -- NATIONAL, PROVINCIAL, SCHOOL
    scope_id         UUID,
    inherits_from    TEXT,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (scope, scope_id, level)
);

-- Partial unique index for national scope
CREATE UNIQUE INDEX IF NOT EXISTS idx_master_belts_national_level
    ON master_belts (level) WHERE scope = 'NATIONAL' AND scope_id IS NULL;

-- 2. Master weight classes (hạng cân)
CREATE TABLE IF NOT EXISTS master_weight_classes (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    gender        VARCHAR(10) NOT NULL,          -- MALE, FEMALE
    category      VARCHAR(30) NOT NULL DEFAULT 'Kyorugi',
    min_weight    NUMERIC(5,1) NOT NULL DEFAULT 0,
    max_weight    NUMERIC(5,1) NOT NULL DEFAULT 0,
    is_heavy      BOOLEAN     NOT NULL DEFAULT FALSE,
    scope         VARCHAR(20) NOT NULL DEFAULT 'NATIONAL',
    scope_id      UUID,
    inherits_from TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_master_weights_gender ON master_weight_classes (gender);
CREATE INDEX idx_master_weights_scope  ON master_weight_classes (scope);

-- 3. Master age groups (nhóm tuổi)
CREATE TABLE IF NOT EXISTS master_age_groups (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT        NOT NULL,
    min_age       INT         NOT NULL DEFAULT 0,
    max_age       INT         NOT NULL DEFAULT 99,
    scope         VARCHAR(20) NOT NULL DEFAULT 'NATIONAL',
    scope_id      UUID,
    inherits_from TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_master_ages_scope ON master_age_groups (scope);

-- 4. Master competition contents (nội dung thi đấu)
CREATE TABLE IF NOT EXISTS master_competition_contents (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(50) NOT NULL,     -- e.g. "doi_khang", "quyen"
    name            TEXT        NOT NULL,
    description     TEXT,
    requires_weight BOOLEAN     NOT NULL DEFAULT FALSE,
    is_team_event   BOOLEAN     NOT NULL DEFAULT FALSE,
    min_athletes    INT         NOT NULL DEFAULT 1,
    max_athletes    INT         NOT NULL DEFAULT 1,
    has_weapon      BOOLEAN     NOT NULL DEFAULT FALSE,
    scope           VARCHAR(20) NOT NULL DEFAULT 'NATIONAL',
    scope_id        UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_master_contents_code  ON master_competition_contents (code);
CREATE INDEX idx_master_contents_scope ON master_competition_contents (scope);
