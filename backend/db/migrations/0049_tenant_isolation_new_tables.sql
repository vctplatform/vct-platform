-- ===============================================================
-- VCT Platform — Migration 0049: TENANT ISOLATION FOR NEW TABLES
-- P0 Critical: Add tenant_id + RLS to all 0044-0048 tables
-- Covers: btc_*, tournament_*, parent_*, training_sessions
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. ADD tenant_id COLUMN TO ALL TABLES MISSING IT
-- ════════════════════════════════════════════════════════

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    -- BTC module (0048)
    'btc_members', 'btc_weigh_ins', 'btc_draws',
    'btc_assignments', 'btc_team_results', 'btc_content_results',
    'btc_finance', 'btc_meetings', 'btc_protests',
    -- Tournament management (0045)
    'tournament_categories', 'tournament_registrations',
    'tournament_registration_athletes', 'tournament_schedule_slots',
    'tournament_arena_assignments', 'tournament_results',
    'tournament_team_standings',
    -- Parent module (0048)
    'parent_links', 'parent_consents', 'parent_attendance',
    'parent_results',
    -- Training (0048)
    'training_sessions'
  ]) LOOP
    BEGIN
      EXECUTE format(
        'ALTER TABLE %I ADD COLUMN IF NOT EXISTS tenant_id UUID',
        tbl
      );
      RAISE NOTICE 'Added tenant_id to %', tbl;
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE 'Table % does not exist, skipping', tbl;
    END;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════
-- 2. SET DEFAULT tenant_id FOR EXISTING ROWS
--    Uses the default development tenant
-- ════════════════════════════════════════════════════════

DO $$
DECLARE
  tbl TEXT;
  default_tenant UUID := '00000000-0000-7000-8000-000000000001';
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'btc_members', 'btc_weigh_ins', 'btc_draws',
    'btc_assignments', 'btc_team_results', 'btc_content_results',
    'btc_finance', 'btc_meetings', 'btc_protests',
    'tournament_categories', 'tournament_registrations',
    'tournament_registration_athletes', 'tournament_schedule_slots',
    'tournament_arena_assignments', 'tournament_results',
    'tournament_team_standings',
    'parent_links', 'parent_consents', 'parent_attendance',
    'parent_results', 'training_sessions'
  ]) LOOP
    BEGIN
      EXECUTE format(
        'UPDATE %I SET tenant_id = %L WHERE tenant_id IS NULL',
        tbl, default_tenant
      );
    EXCEPTION WHEN undefined_table THEN NULL;
    END;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════
-- 3. ENABLE RLS + CREATE POLICIES
-- ════════════════════════════════════════════════════════

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'btc_members', 'btc_weigh_ins', 'btc_draws',
    'btc_assignments', 'btc_team_results', 'btc_content_results',
    'btc_finance', 'btc_meetings', 'btc_protests',
    'tournament_categories', 'tournament_registrations',
    'tournament_registration_athletes', 'tournament_schedule_slots',
    'tournament_arena_assignments', 'tournament_results',
    'tournament_team_standings',
    'parent_links', 'parent_consents', 'parent_attendance',
    'parent_results', 'training_sessions'
  ]) LOOP
    BEGIN
      -- Enable RLS
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);

      -- SELECT/UPDATE policy (tenant read/write isolation)
      EXECUTE format(
        'CREATE POLICY tenant_isolation ON %I
          USING (tenant_id = COALESCE(
            current_setting(''app.current_tenant'', true)::UUID,
            ''00000000-0000-7000-8000-000000000001''::UUID
          ))',
        tbl
      );

      -- INSERT policy (enforce correct tenant_id on write)
      EXECUTE format(
        'CREATE POLICY tenant_write_%s ON %I
          FOR INSERT
          WITH CHECK (tenant_id = COALESCE(
            current_setting(''app.current_tenant'', true)::UUID,
            ''00000000-0000-7000-8000-000000000001''::UUID
          ))',
        replace(tbl, '.', '_'), tbl
      );

      -- UPDATE policy (prevent tenant_id mutation)
      EXECUTE format(
        'CREATE POLICY tenant_update_%s ON %I
          FOR UPDATE
          USING (tenant_id = COALESCE(
            current_setting(''app.current_tenant'', true)::UUID,
            ''00000000-0000-7000-8000-000000000001''::UUID
          ))
          WITH CHECK (tenant_id = COALESCE(
            current_setting(''app.current_tenant'', true)::UUID,
            ''00000000-0000-7000-8000-000000000001''::UUID
          ))',
        replace(tbl, '.', '_'), tbl
      );

      RAISE NOTICE 'RLS enabled for %', tbl;

    EXCEPTION
      WHEN undefined_table THEN
        RAISE NOTICE 'Table % does not exist, skipping RLS', tbl;
      WHEN duplicate_object THEN
        RAISE NOTICE 'Policy already exists for %, skipping', tbl;
    END;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════
-- 4. ADD tenant_id INDEXES FOR QUERY PERFORMANCE
-- ════════════════════════════════════════════════════════

-- BTC tables (all filtered by giai_id + tenant)
CREATE INDEX IF NOT EXISTS idx_btc_members_tenant ON btc_members(tenant_id, giai_id);
CREATE INDEX IF NOT EXISTS idx_btc_weigh_ins_tenant ON btc_weigh_ins(tenant_id, giai_id);
CREATE INDEX IF NOT EXISTS idx_btc_draws_tenant ON btc_draws(tenant_id, giai_id);
CREATE INDEX IF NOT EXISTS idx_btc_assignments_tenant ON btc_assignments(tenant_id, giai_id);
CREATE INDEX IF NOT EXISTS idx_btc_team_results_tenant ON btc_team_results(tenant_id, giai_id);
CREATE INDEX IF NOT EXISTS idx_btc_content_results_tenant ON btc_content_results(tenant_id, giai_id);
CREATE INDEX IF NOT EXISTS idx_btc_finance_tenant ON btc_finance(tenant_id, giai_id);
CREATE INDEX IF NOT EXISTS idx_btc_meetings_tenant ON btc_meetings(tenant_id, giai_id);
CREATE INDEX IF NOT EXISTS idx_btc_protests_tenant ON btc_protests(tenant_id, giai_id);

-- Tournament management
CREATE INDEX IF NOT EXISTS idx_tourn_categories_tenant ON tournament_categories(tenant_id, tournament_id);
CREATE INDEX IF NOT EXISTS idx_tourn_registrations_tenant ON tournament_registrations(tenant_id, tournament_id);
CREATE INDEX IF NOT EXISTS idx_tourn_reg_athletes_tenant ON tournament_registration_athletes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tourn_schedule_tenant ON tournament_schedule_slots(tenant_id, tournament_id);
CREATE INDEX IF NOT EXISTS idx_tourn_arena_assign_tenant ON tournament_arena_assignments(tenant_id, tournament_id);
CREATE INDEX IF NOT EXISTS idx_tourn_results_tenant ON tournament_results(tenant_id, tournament_id);
CREATE INDEX IF NOT EXISTS idx_tourn_standings_tenant ON tournament_team_standings(tenant_id, tournament_id);

-- Parent module
CREATE INDEX IF NOT EXISTS idx_parent_links_tenant ON parent_links(tenant_id);
CREATE INDEX IF NOT EXISTS idx_parent_consents_tenant ON parent_consents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_parent_attendance_tenant ON parent_attendance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_parent_results_tenant ON parent_results(tenant_id);

-- Training
CREATE INDEX IF NOT EXISTS idx_training_sess_tenant ON training_sessions(tenant_id);

-- ════════════════════════════════════════════════════════
-- 5. ADD updated_at TRIGGER WHERE MISSING
-- ════════════════════════════════════════════════════════

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'btc_members', 'btc_weigh_ins', 'btc_draws',
    'btc_assignments', 'btc_finance', 'btc_meetings', 'btc_protests',
    'tournament_categories', 'tournament_registrations',
    'tournament_schedule_slots', 'tournament_results',
    'parent_links', 'parent_consents', 'training_sessions'
  ]) LOOP
    BEGIN
      -- Add updated_at column if missing
      EXECUTE format(
        'ALTER TABLE %I ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()',
        tbl
      );
      -- Add trigger
      EXECUTE format(
        'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I
          FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at()',
        tbl
      );
    EXCEPTION
      WHEN undefined_table THEN NULL;
      WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════
-- 6. ADD is_deleted + SOFT DELETE TRIGGER WHERE MISSING
-- ════════════════════════════════════════════════════════

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'btc_members', 'btc_weigh_ins', 'btc_draws',
    'btc_assignments', 'btc_finance', 'btc_meetings', 'btc_protests',
    'tournament_categories', 'tournament_registrations',
    'tournament_registration_athletes', 'tournament_schedule_slots',
    'tournament_arena_assignments', 'tournament_results',
    'tournament_team_standings',
    'parent_links', 'parent_consents',
    'training_sessions'
  ]) LOOP
    BEGIN
      EXECUTE format(
        'ALTER TABLE %I ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false',
        tbl
      );
      EXECUTE format(
        'ALTER TABLE %I ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ',
        tbl
      );
    EXCEPTION WHEN undefined_table THEN NULL;
    END;
  END LOOP;
END $$;

COMMIT;
