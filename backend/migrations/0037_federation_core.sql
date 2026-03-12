-- ═══════════════════════════════════════════════════════════════
-- VCT PLATFORM — Migration 0037: Federation Core Tables
-- Provinces, federation units, personnel assignments
-- ═══════════════════════════════════════════════════════════════

-- 1. Provinces (tỉnh/thành phố)
CREATE TABLE IF NOT EXISTS federation_provinces (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    code          VARCHAR(10) NOT NULL UNIQUE,        -- e.g. "HCM", "HN"
    name          TEXT        NOT NULL,                -- e.g. "TP Hồ Chí Minh"
    region        VARCHAR(20) NOT NULL DEFAULT 'south', -- north, central, south
    has_fed       BOOLEAN     NOT NULL DEFAULT FALSE,
    fed_unit_id   UUID,
    club_count    INT         NOT NULL DEFAULT 0,
    coach_count   INT         NOT NULL DEFAULT 0,
    vdv_count     INT         NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fed_provinces_region ON federation_provinces (region);
CREATE INDEX idx_fed_provinces_code   ON federation_provinces (code);

-- 2. Federation units (đơn vị tổ chức)
CREATE TABLE IF NOT EXISTS federation_units (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name         TEXT         NOT NULL,
    short_name   TEXT,
    type         VARCHAR(20)  NOT NULL DEFAULT 'province', -- central, province, district, committee
    parent_id    UUID         REFERENCES federation_units(id) ON DELETE SET NULL,
    province_id  UUID         REFERENCES federation_provinces(id) ON DELETE SET NULL,
    status       VARCHAR(20)  NOT NULL DEFAULT 'active',
    address      TEXT,
    phone        VARCHAR(20),
    email        VARCHAR(255),
    website      TEXT,
    founded_date VARCHAR(10),
    leader_name  TEXT,
    leader_title TEXT,
    club_count   INT          NOT NULL DEFAULT 0,
    member_count INT          NOT NULL DEFAULT 0,
    metadata     JSONB,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fed_units_type      ON federation_units (type);
CREATE INDEX idx_fed_units_parent    ON federation_units (parent_id);
CREATE INDEX idx_fed_units_province  ON federation_units (province_id);
CREATE INDEX idx_fed_units_status    ON federation_units (status);

-- 3. Personnel assignments (bổ nhiệm nhân sự)
CREATE TABLE IF NOT EXISTS federation_personnel (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL,
    user_name    TEXT        NOT NULL,
    unit_id      UUID        NOT NULL REFERENCES federation_units(id) ON DELETE CASCADE,
    unit_name    TEXT        NOT NULL,
    position     TEXT        NOT NULL,        -- e.g. "Chủ tịch", "Phó CT", "Ủy viên"
    role_code    VARCHAR(50),                 -- maps to auth role
    start_date   VARCHAR(10) NOT NULL,
    end_date     VARCHAR(10),
    is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
    decision_no  TEXT,                        -- QĐ bổ nhiệm
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fed_personnel_unit   ON federation_personnel (unit_id);
CREATE INDEX idx_fed_personnel_user   ON federation_personnel (user_id);
CREATE INDEX idx_fed_personnel_active ON federation_personnel (is_active);

-- 4. Organizations (tổ chức thành viên)
CREATE TABLE IF NOT EXISTS federation_organizations (
    id               UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
    type             VARCHAR(20)        NOT NULL DEFAULT 'PROVINCIAL', -- NATIONAL, PROVINCIAL, SECTOR
    name             TEXT               NOT NULL,
    abbreviation     VARCHAR(20),
    region           VARCHAR(20),
    province_id      UUID               REFERENCES federation_provinces(id) ON DELETE SET NULL,
    contact_name     TEXT,
    contact_phone    VARCHAR(20),
    contact_email    VARCHAR(255),
    address          TEXT,
    status           VARCHAR(20)        NOT NULL DEFAULT 'ACTIVE',
    established_date VARCHAR(10),
    created_at       TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fed_orgs_type   ON federation_organizations (type);
CREATE INDEX idx_fed_orgs_status ON federation_organizations (status);
CREATE INDEX idx_fed_orgs_region ON federation_organizations (region);
