-- ════════════════════════════════════════════════════════════════
-- VCT PLATFORM — Migration #0035: Associations & Sub-Associations
-- Adds tables for district-level associations (Hội) and
-- ward-level sub-associations (Chi hội).
-- ════════════════════════════════════════════════════════════════

-- ── Prerequisite: provinces table ──
CREATE TABLE IF NOT EXISTS provinces (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    code            TEXT NOT NULL UNIQUE,
    region          TEXT,
    population      INT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Prerequisite: provincial_clubs table ──
CREATE TABLE IF NOT EXISTS provincial_clubs (
    id              TEXT PRIMARY KEY,
    province_id     TEXT NOT NULL REFERENCES provinces(id),
    name            TEXT NOT NULL,
    code            TEXT UNIQUE,
    address         TEXT,
    phone           TEXT,
    email           TEXT,
    president_name  TEXT,
    status          TEXT NOT NULL DEFAULT 'active',
    total_members   INT NOT NULL DEFAULT 0,
    founded_date    DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Association status type ──
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'association_status') THEN
        CREATE TYPE association_status AS ENUM
            ('pending','active','suspended','inactive','rejected');
    END IF;
END $$;

-- ── Provincial Associations (Hội Quận/Huyện) ──
CREATE TABLE IF NOT EXISTS provincial_associations (
    id              TEXT PRIMARY KEY,
    province_id     TEXT NOT NULL REFERENCES provinces(id),
    name            TEXT NOT NULL,
    short_name      TEXT,
    code            TEXT NOT NULL UNIQUE,
    district        TEXT NOT NULL,
    address         TEXT,
    phone           TEXT,
    email           TEXT,
    president_name  TEXT NOT NULL,
    president_phone TEXT,
    founded_date    DATE,
    decision_no     TEXT,
    status          association_status NOT NULL DEFAULT 'pending',
    total_sub_assoc INT NOT NULL DEFAULT 0,
    total_clubs     INT NOT NULL DEFAULT 0,
    total_athletes  INT NOT NULL DEFAULT 0,
    total_coaches   INT NOT NULL DEFAULT 0,
    term            TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prov_assoc_province
    ON provincial_associations(province_id);
CREATE INDEX IF NOT EXISTS idx_prov_assoc_status
    ON provincial_associations(status);

-- ── Provincial Sub-Associations (Chi hội Phường/Xã) ──
CREATE TABLE IF NOT EXISTS provincial_sub_associations (
    id               TEXT PRIMARY KEY,
    province_id      TEXT NOT NULL REFERENCES provinces(id),
    association_id   TEXT NOT NULL REFERENCES provincial_associations(id),
    name             TEXT NOT NULL,
    short_name       TEXT,
    code             TEXT NOT NULL UNIQUE,
    ward             TEXT NOT NULL,
    address          TEXT,
    phone            TEXT,
    email            TEXT,
    leader_name      TEXT NOT NULL,
    leader_phone     TEXT,
    founded_date     DATE,
    decision_no      TEXT,
    status           association_status NOT NULL DEFAULT 'pending',
    total_clubs      INT NOT NULL DEFAULT 0,
    total_athletes   INT NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prov_sub_assoc_province
    ON provincial_sub_associations(province_id);
CREATE INDEX IF NOT EXISTS idx_prov_sub_assoc_association
    ON provincial_sub_associations(association_id);
CREATE INDEX IF NOT EXISTS idx_prov_sub_assoc_status
    ON provincial_sub_associations(status);

-- ── Link Clubs to Associations ──
ALTER TABLE provincial_clubs
    ADD COLUMN IF NOT EXISTS association_id TEXT
        REFERENCES provincial_associations(id),
    ADD COLUMN IF NOT EXISTS sub_association_id TEXT
        REFERENCES provincial_sub_associations(id);

CREATE INDEX IF NOT EXISTS idx_prov_clubs_association
    ON provincial_clubs(association_id);
CREATE INDEX IF NOT EXISTS idx_prov_clubs_sub_association
    ON provincial_clubs(sub_association_id);
