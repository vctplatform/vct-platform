-- ===============================================================
-- VCT Platform — Migration 0030: V7.0 LAYER D
-- Stress test support
-- Tables: federation_merges, sport_profiles, team_entries,
--         match_bouts, athlete_daily_loads,
--         auth_provider_mappings, storage_provider_mappings
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- STRESS 1: FEDERATION MERGES
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS core.federation_merges (
    id UUID PRIMARY KEY DEFAULT uuidv7(),

    source_federation_id UUID NOT NULL,
    target_federation_id UUID NOT NULL,

    status TEXT NOT NULL DEFAULT 'PLANNED'
        CHECK (status IN (
            'PLANNED', 'MAPPING', 'EXECUTING',
            'VALIDATING', 'COMPLETED', 'ROLLED_BACK'
        )),

    entity_mappings JSONB NOT NULL DEFAULT '{}',

    duplicate_athletes JSONB,
    duplicate_clubs JSONB,

    rollback_snapshot_id UUID,

    planned_at TIMESTAMPTZ DEFAULT now(),
    executed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    executed_by UUID,
    metadata JSONB DEFAULT '{}'
);

COMMENT ON TABLE core.federation_merges IS
    'V7.0 Stress 1: Federation merge/acquisition tracking';

-- ════════════════════════════════════════════════════════
-- STRESS 2: MULTI-SPORT PROFILES
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS platform.sport_profiles (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    sport_code TEXT NOT NULL UNIQUE,       -- 'VCT', 'TKD', 'JUD', 'KAR'
    sport_name TEXT NOT NULL,

    competition_types JSONB NOT NULL,
    weight_class_config JSONB NOT NULL,
    default_match_config JSONB NOT NULL,

    ranking_config JSONB,
    equipment_config JSONB,

    international_federation TEXT,
    national_federation TEXT,

    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'
);

COMMENT ON TABLE platform.sport_profiles IS
    'V7.0 Stress 2: Multi-sport configuration (VCT/TKD/JUD)';

-- Seed VCT sport profile
INSERT INTO platform.sport_profiles (
    sport_code, sport_name,
    competition_types, weight_class_config, default_match_config,
    international_federation, national_federation
) VALUES (
    'VCT', 'Vovinam - Việt Võ Đạo',
    '["DOI_KHANG", "QUYEN", "BINH_KHI", "SONG_LUYEN", "DA_LUYEN"]'::JSONB,
    '{"units": "kg", "classes_by_gender": true}'::JSONB,
    '{"rounds": 3, "round_duration_sec": 120, "break_sec": 60, "judges": 5, "scoring_type": "FLAG"}'::JSONB,
    'WVVF', 'LVNVN'
) ON CONFLICT (sport_code) DO NOTHING;

-- ════════════════════════════════════════════════════════
-- STRESS 3: TEAM EVENTS
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS tournament.team_entries (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    entry_id UUID NOT NULL,              -- References tournament_entries

    athlete_id UUID NOT NULL,
    role_in_team TEXT NOT NULL,             -- 'CAPTAIN', 'MEMBER', 'RESERVE'
    order_in_team INTEGER,

    weight_class TEXT,

    status TEXT DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'SUBSTITUTED', 'WITHDRAWN', 'DISQUALIFIED')),
    substituted_by UUID,
    substitution_reason TEXT,

    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_team_entries_entry
    ON tournament.team_entries(entry_id);
CREATE INDEX IF NOT EXISTS idx_team_entries_athlete
    ON tournament.team_entries(athlete_id);

COMMENT ON TABLE tournament.team_entries IS
    'V7.0 Stress 3: Team event athlete composition';

CREATE TABLE IF NOT EXISTS tournament.match_bouts (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    match_id UUID NOT NULL,
    bout_number INTEGER NOT NULL,

    red_athlete_id UUID NOT NULL,
    blue_athlete_id UUID NOT NULL,

    winner_athlete_id UUID,
    result_type TEXT,                     -- 'POINTS', 'KO', 'SUBMISSION', 'WALKOVER'
    red_score JSONB,
    blue_score JSONB,

    status TEXT DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),

    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_match_bouts_match
    ON tournament.match_bouts(match_id, bout_number);

COMMENT ON TABLE tournament.match_bouts IS
    'V7.0 Stress 3: Individual bouts within team matches';

-- ════════════════════════════════════════════════════════
-- STRESS 4: ATHLETE DAILY LOAD TRACKING
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS tournament.athlete_daily_loads (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    athlete_id UUID NOT NULL,
    tournament_id UUID NOT NULL,
    competition_date DATE NOT NULL,

    total_matches INTEGER DEFAULT 0,
    total_rounds INTEGER DEFAULT 0,
    total_competition_minutes INTEGER DEFAULT 0,
    total_rest_minutes INTEGER DEFAULT 0,

    max_matches_per_day INTEGER,
    max_rounds_per_day INTEGER,
    max_competition_minutes_per_day INTEGER,
    min_rest_between_matches_minutes INTEGER,

    load_status TEXT DEFAULT 'NORMAL'
        CHECK (load_status IN ('NORMAL', 'HIGH', 'EXCESSIVE', 'BLOCKED')),

    medical_clearance BOOLEAN DEFAULT false,
    medical_cleared_by UUID,

    last_updated TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_athlete_daily_load_unique
    ON tournament.athlete_daily_loads(athlete_id, tournament_id, competition_date);

COMMENT ON TABLE tournament.athlete_daily_loads IS
    'V7.0 Stress 4: Safety load tracking per athlete per day';

-- ════════════════════════════════════════════════════════
-- STRESS 5: VENDOR ABSTRACTION
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS core.auth_provider_mappings (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    internal_user_id UUID NOT NULL,

    provider TEXT NOT NULL,              -- 'SUPABASE', 'AUTH0', 'FIREBASE', 'KEYCLOAK'
    provider_user_id TEXT NOT NULL,

    migrated_from_provider TEXT,
    migrated_at TIMESTAMPTZ,

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_provider_unique
    ON core.auth_provider_mappings(provider, provider_user_id);
CREATE INDEX IF NOT EXISTS idx_auth_provider_internal_user
    ON core.auth_provider_mappings(internal_user_id);

COMMENT ON TABLE core.auth_provider_mappings IS
    'V7.0 Stress 5: Auth vendor abstraction layer';

CREATE TABLE IF NOT EXISTS system.storage_provider_mappings (
    id UUID PRIMARY KEY DEFAULT uuidv7(),

    logical_path TEXT NOT NULL UNIQUE,    -- 'athletes/photos/uuid.jpg'

    provider TEXT NOT NULL,              -- 'SUPABASE_STORAGE', 'S3', 'GCS'
    provider_path TEXT NOT NULL,
    provider_bucket TEXT,

    file_size BIGINT,
    content_type TEXT,
    checksum TEXT,

    uploaded_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'
);

COMMENT ON TABLE system.storage_provider_mappings IS
    'V7.0 Stress 5: Storage vendor abstraction layer';

COMMIT;
