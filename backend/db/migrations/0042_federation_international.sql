-- ═══════════════════════════════════════════════════════════════
-- VCT PLATFORM — FEDERATION INTERNATIONAL: partners + events
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS federation_intl_partners (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    abbreviation    VARCHAR(50) DEFAULT '',
    country         VARCHAR(100) NOT NULL DEFAULT '',
    country_code    VARCHAR(10) DEFAULT '',
    type            VARCHAR(50) NOT NULL DEFAULT 'Lưỡng phương',
    contact_name    VARCHAR(200) DEFAULT '',
    contact_email   VARCHAR(200) DEFAULT '',
    website         TEXT DEFAULT '',
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('active', 'pending', 'expired')),
    partner_since   VARCHAR(4) DEFAULT '',
    notes           TEXT DEFAULT '',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fed_partners_status ON federation_intl_partners(status);
CREATE INDEX idx_fed_partners_country ON federation_intl_partners(country_code);

CREATE TABLE IF NOT EXISTS federation_intl_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    location        VARCHAR(200) NOT NULL DEFAULT '',
    country         VARCHAR(100) NOT NULL DEFAULT '',
    start_date      DATE,
    end_date        DATE,
    athlete_count   INTEGER NOT NULL DEFAULT 0,
    coach_count     INTEGER NOT NULL DEFAULT 0,
    medal_gold      INTEGER NOT NULL DEFAULT 0,
    medal_silver    INTEGER NOT NULL DEFAULT 0,
    medal_bronze    INTEGER NOT NULL DEFAULT 0,
    status          VARCHAR(20) NOT NULL DEFAULT 'planning'
                    CHECK (status IN ('planning', 'confirmed', 'ongoing', 'completed')),
    description     TEXT DEFAULT '',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fed_intl_events_status ON federation_intl_events(status);
CREATE INDEX idx_fed_intl_events_date ON federation_intl_events(start_date DESC);

-- Seed partners
INSERT INTO federation_intl_partners (name, abbreviation, country, country_code, type, status, partner_since) VALUES
('World Martial Arts Union', 'WoMAU', 'Hàn Quốc', 'KR', 'Liên đoàn Quốc tế', 'active', '2018'),
('Asian Martial Arts Federation', '', 'Nhật Bản', 'JP', 'Liên đoàn Châu Á', 'active', '2019'),
('Chinese Wushu Association', '', 'Trung Quốc', 'CN', 'Lưỡng phương', 'active', '2023'),
('SEA Games Federation', '', 'Đông Nam Á', 'ASEAN', 'Đa phương', 'active', '2015'),
('French Martial Arts Federation', '', 'Pháp', 'FR', 'Lưỡng phương', 'pending', '2024')
ON CONFLICT DO NOTHING;

-- Seed events
INSERT INTO federation_intl_events (name, location, country, start_date, end_date, athlete_count, medal_gold, medal_silver, medal_bronze, status) VALUES
('SEA Games 2025 — Võ Cổ Truyền', 'Bangkok', 'Thái Lan', '2025-12-01', '2025-12-07', 12, 0, 0, 0, 'planning'),
('Asian Martial Arts Championship', 'Seoul', 'Hàn Quốc', '2024-08-15', '2024-08-20', 8, 2, 3, 1, 'completed'),
('World Martial Arts Festival', 'Chungju', 'Hàn Quốc', '2024-10-10', '2024-10-15', 15, 0, 0, 0, 'confirmed')
ON CONFLICT DO NOTHING;
