-- ════════════════════════════════════════════════════════════════
-- Migration 0041: Club / Võ Đường — Attendance, Equipment, Facilities
-- ════════════════════════════════════════════════════════════════

-- Attendance records (điểm danh)
CREATE TABLE IF NOT EXISTS club_attendance (
    id               TEXT PRIMARY KEY,
    club_id          TEXT NOT NULL,
    class_id         TEXT NOT NULL,
    class_name       TEXT NOT NULL DEFAULT '',
    member_id        TEXT NOT NULL,
    member_name      TEXT NOT NULL DEFAULT '',
    date             DATE NOT NULL,
    status           TEXT NOT NULL DEFAULT 'present',  -- present, absent, late, excused
    notes            TEXT NOT NULL DEFAULT '',
    recorded_by      TEXT NOT NULL DEFAULT '',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_club_attendance_club  ON club_attendance (club_id);
CREATE INDEX IF NOT EXISTS idx_club_attendance_class ON club_attendance (club_id, class_id);
CREATE INDEX IF NOT EXISTS idx_club_attendance_date  ON club_attendance (club_id, date);

-- Equipment inventory (trang thiết bị)
CREATE TABLE IF NOT EXISTS club_equipment (
    id               TEXT PRIMARY KEY,
    club_id          TEXT NOT NULL,
    name             TEXT NOT NULL,
    category         TEXT NOT NULL DEFAULT 'other',   -- protective, training, weapon, uniform, medical, other
    quantity         INT NOT NULL DEFAULT 0,
    condition        TEXT NOT NULL DEFAULT 'new',     -- new, good, worn, damaged, retired
    purchase_date    DATE,
    unit_value       NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_value      NUMERIC(15,2) NOT NULL DEFAULT 0,
    supplier         TEXT NOT NULL DEFAULT '',
    notes            TEXT NOT NULL DEFAULT '',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_club_equipment_club ON club_equipment (club_id);

-- Facilities (cơ sở vật chất)
CREATE TABLE IF NOT EXISTS club_facilities (
    id                     TEXT PRIMARY KEY,
    club_id                TEXT NOT NULL,
    name                   TEXT NOT NULL,
    type                   TEXT NOT NULL DEFAULT 'other',     -- training_hall, arena, gym, storage, office, changing_room, other
    area_sqm               NUMERIC(10,2) NOT NULL DEFAULT 0,
    capacity               INT NOT NULL DEFAULT 0,
    status                 TEXT NOT NULL DEFAULT 'active',    -- active, maintenance, closed
    address                TEXT NOT NULL DEFAULT '',
    last_maintenance_date  DATE,
    next_maintenance_date  DATE,
    monthly_rent           NUMERIC(15,2) NOT NULL DEFAULT 0,
    notes                  TEXT NOT NULL DEFAULT '',
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_club_facilities_club ON club_facilities (club_id);
