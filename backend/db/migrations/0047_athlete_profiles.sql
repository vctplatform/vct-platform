-- ════════════════════════════════════════════════════════════════
-- Migration 0043: Athlete Profile, Membership, Tournament Entries
-- Supports the athlete.AthleteProfileRepository,
-- athlete.ClubMembershipRepository, athlete.TournamentEntryRepository
-- ════════════════════════════════════════════════════════════════

-- Athlete profiles (hồ sơ thể thao)
CREATE TABLE IF NOT EXISTS athlete_profiles (
    id               TEXT PRIMARY KEY,
    user_id          TEXT NOT NULL UNIQUE,
    full_name        TEXT NOT NULL,
    gender           TEXT NOT NULL DEFAULT '',
    date_of_birth    TEXT NOT NULL DEFAULT '',
    weight           NUMERIC(6,2) NOT NULL DEFAULT 0,
    height           NUMERIC(6,2) NOT NULL DEFAULT 0,
    belt_rank        TEXT NOT NULL DEFAULT 'none',
    belt_label       TEXT NOT NULL DEFAULT '',
    coach_name       TEXT NOT NULL DEFAULT '',
    phone            TEXT NOT NULL DEFAULT '',
    email            TEXT NOT NULL DEFAULT '',
    photo_url        TEXT NOT NULL DEFAULT '',
    address          TEXT NOT NULL DEFAULT '',
    id_number        TEXT NOT NULL DEFAULT '',
    province         TEXT NOT NULL DEFAULT '',
    nationality      TEXT NOT NULL DEFAULT 'Việt Nam',
    ho_so            JSONB NOT NULL DEFAULT '{}',
    status           TEXT NOT NULL DEFAULT 'draft',
    belt_history     JSONB NOT NULL DEFAULT '[]',
    goals            JSONB NOT NULL DEFAULT '[]',
    skill_stats      JSONB NOT NULL DEFAULT '[]',
    total_clubs       INT NOT NULL DEFAULT 0,
    total_tournaments INT NOT NULL DEFAULT 0,
    total_medals      INT NOT NULL DEFAULT 0,
    elo_rating        INT NOT NULL DEFAULT 1200,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_athlete_profiles_user   ON athlete_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_status ON athlete_profiles (status);
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_prov   ON athlete_profiles (province);

-- Club memberships
CREATE TABLE IF NOT EXISTS athlete_memberships (
    id          TEXT PRIMARY KEY,
    athlete_id  TEXT NOT NULL,
    club_id     TEXT NOT NULL,
    club_name   TEXT NOT NULL DEFAULT '',
    role        TEXT NOT NULL DEFAULT 'member',
    join_date   TEXT NOT NULL DEFAULT '',
    status      TEXT NOT NULL DEFAULT 'pending',
    coach_name  TEXT NOT NULL DEFAULT '',
    province_id TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_athlete_memberships_athlete ON athlete_memberships (athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_memberships_club    ON athlete_memberships (club_id);

-- Tournament entries
CREATE TABLE IF NOT EXISTS athlete_tournament_entries (
    id              TEXT PRIMARY KEY,
    athlete_id      TEXT NOT NULL,
    athlete_name    TEXT NOT NULL DEFAULT '',
    tournament_id   TEXT NOT NULL,
    tournament_name TEXT NOT NULL DEFAULT '',
    doan_id         TEXT NOT NULL DEFAULT '',
    doan_name       TEXT NOT NULL DEFAULT '',
    categories      JSONB NOT NULL DEFAULT '[]',
    ho_so           JSONB NOT NULL DEFAULT '{}',
    status          TEXT NOT NULL DEFAULT 'nhap',
    weigh_in_result TEXT NOT NULL DEFAULT '',
    start_date      TEXT NOT NULL DEFAULT '',
    notes           TEXT NOT NULL DEFAULT '',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_athlete_entries_athlete    ON athlete_tournament_entries (athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_entries_tournament ON athlete_tournament_entries (tournament_id);
