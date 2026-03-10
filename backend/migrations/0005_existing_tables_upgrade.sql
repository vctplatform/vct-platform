-- ===============================================================
-- VCT Platform — Migration 0005: EXISTING TABLES UPGRADE
-- Add tenant_id, audit columns, version, constraints
-- to all tables created in 0002/0003
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- Default tenant for existing data
-- ════════════════════════════════════════════════════════
DO $$ BEGIN
  PERFORM id FROM core.tenants WHERE code = 'vct_system';
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

-- ════════════════════════════════════════════════════════
-- ADD tenant_id + audit columns to ALL existing tables
-- ════════════════════════════════════════════════════════

DO $$
DECLARE
  tbl TEXT;
  default_tenant UUID := '00000000-0000-7000-8000-000000000001';
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'tournaments', 'age_groups', 'content_categories', 'weight_classes',
    'teams', 'athletes', 'registrations', 'referees', 'arenas',
    'referee_assignments', 'combat_matches', 'form_performances',
    'weigh_ins', 'schedule_entries', 'appeals', 'notifications',
    'medical_records', 'media_files', 'data_audit_log',
    'match_events', 'judge_scores', 'rankings', 'medals_summary',
    'federations', 'clubs', 'organizations'
  ]) LOOP
    BEGIN
      -- tenant_id
      EXECUTE format(
        'ALTER TABLE %I ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT %L REFERENCES core.tenants(id)',
        tbl, default_tenant
      );
      -- created_by / updated_by
      EXECUTE format(
        'ALTER TABLE %I ADD COLUMN IF NOT EXISTS created_by UUID',
        tbl
      );
      EXECUTE format(
        'ALTER TABLE %I ADD COLUMN IF NOT EXISTS updated_by UUID',
        tbl
      );
      -- version (optimistic locking)
      EXECUTE format(
        'ALTER TABLE %I ADD COLUMN IF NOT EXISTS version INT DEFAULT 1',
        tbl
      );
      -- is_deleted + deleted_at + deleted_by
      EXECUTE format(
        'ALTER TABLE %I ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false',
        tbl
      );
      EXECUTE format(
        'ALTER TABLE %I ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ',
        tbl
      );
      EXECUTE format(
        'ALTER TABLE %I ADD COLUMN IF NOT EXISTS deleted_by UUID',
        tbl
      );
      -- metadata (if missing)
      EXECUTE format(
        'ALTER TABLE %I ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT ''{}''',
        tbl
      );
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE 'Table % does not exist, skipping', tbl;
    END;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════
-- SET tenant_id NOT NULL (after backfilling default)
-- ════════════════════════════════════════════════════════

DO $$
DECLARE
  tbl TEXT;
  default_tenant UUID := '00000000-0000-7000-8000-000000000001';
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'tournaments', 'teams', 'athletes', 'registrations', 'referees',
    'arenas', 'combat_matches', 'form_performances', 'appeals'
  ]) LOOP
    BEGIN
      EXECUTE format('UPDATE %I SET tenant_id = %L WHERE tenant_id IS NULL', tbl, default_tenant);
      EXECUTE format('ALTER TABLE %I ALTER COLUMN tenant_id SET NOT NULL', tbl);
    EXCEPTION WHEN undefined_table THEN
      NULL;
    END;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════
-- ADD CHECK CONSTRAINTS on status fields
-- ════════════════════════════════════════════════════════

DO $$ BEGIN
  ALTER TABLE tournaments ADD CONSTRAINT chk_tournaments_status
    CHECK (status IN ('nhap', 'dang_ky', 'khoa_dk', 'thi_dau', 'ket_thuc', 'huy'));
EXCEPTION WHEN duplicate_object OR check_violation THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE teams ADD CONSTRAINT chk_teams_status
    CHECK (trang_thai IN ('nhap', 'cho_duyet', 'da_duyet', 'tu_choi', 'rut'));
EXCEPTION WHEN duplicate_object OR check_violation THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE athletes ADD CONSTRAINT chk_athletes_status
    CHECK (trang_thai IN ('nhap', 'cho_duyet', 'da_duyet', 'tu_choi', 'rut'));
EXCEPTION WHEN duplicate_object OR check_violation THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE combat_matches ADD CONSTRAINT chk_matches_status
    CHECK (trang_thai IN ('chua_dau', 'dang_dau', 'tam_dung', 'ket_thuc', 'huy'));
EXCEPTION WHEN duplicate_object OR check_violation THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE registrations ADD CONSTRAINT chk_registrations_status
    CHECK (trang_thai IN ('cho_duyet', 'da_duyet', 'tu_choi', 'rut'));
EXCEPTION WHEN duplicate_object OR check_violation THEN NULL;
END $$;

-- ════════════════════════════════════════════════════════
-- COMPOSITE INDEXES (replace single-column)
-- ════════════════════════════════════════════════════════

-- Athletes: most common query pattern
CREATE INDEX IF NOT EXISTS idx_athletes_tenant_tournament
  ON athletes(tenant_id, tournament_id, trang_thai)
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_athletes_tenant_team
  ON athletes(tenant_id, team_id)
  WHERE is_deleted = false;

-- Matches: live scoring queries
CREATE INDEX IF NOT EXISTS idx_matches_tenant_tournament_status
  ON combat_matches(tenant_id, tournament_id, trang_thai)
  WHERE is_deleted = false;

-- Teams
CREATE INDEX IF NOT EXISTS idx_teams_tenant_tournament
  ON teams(tenant_id, tournament_id, trang_thai)
  WHERE is_deleted = false;

-- Registrations
CREATE INDEX IF NOT EXISTS idx_registrations_tenant_tournament
  ON registrations(tenant_id, tournament_id, trang_thai);

-- Match events: BRIN for append-only time-series
CREATE INDEX IF NOT EXISTS idx_match_events_recorded_brin
  ON match_events USING BRIN (recorded_at)
  WITH (pages_per_range = 32);

CREATE INDEX IF NOT EXISTS idx_match_events_match_seq
  ON match_events(match_id, sequence_number);

-- Rankings
CREATE INDEX IF NOT EXISTS idx_rankings_tenant_category
  ON rankings(tenant_id, category, weight_class)
  WHERE is_deleted = false;

-- ════════════════════════════════════════════════════════
-- RLS ON KEY TABLES
-- ════════════════════════════════════════════════════════

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'tournaments', 'teams', 'athletes', 'registrations', 'referees',
    'arenas', 'combat_matches', 'form_performances', 'appeals',
    'match_events', 'rankings', 'federations', 'clubs'
  ]) LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
      EXECUTE format(
        'CREATE POLICY tenant_isolation_%I ON %I
          USING (tenant_id = COALESCE(
            current_setting(''app.current_tenant'', true)::UUID,
            ''00000000-0000-7000-8000-000000000001''::UUID
          ))',
        tbl, tbl
      );
    EXCEPTION
      WHEN undefined_table THEN NULL;
      WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════
-- PREVENT HARD DELETES on critical tables
-- ════════════════════════════════════════════════════════

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'tournaments', 'athletes', 'teams', 'combat_matches', 'match_events'
  ]) LOOP
    BEGIN
      EXECUTE format(
        'CREATE TRIGGER prevent_hard_delete BEFORE DELETE ON %I
         FOR EACH ROW EXECUTE FUNCTION trigger_prevent_hard_delete()',
        tbl
      );
    EXCEPTION
      WHEN undefined_table THEN NULL;
      WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

COMMIT;
