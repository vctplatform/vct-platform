-- ===============================================================
-- VCT Platform — Migration 0082: COMPLETE RLS COVERAGE
-- P1 High: Apply strict RLS to all missing tenant-scoped tables
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. BTC MODULE TABLES (9 tables)
-- ════════════════════════════════════════════════════════

DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'btc_members', 'btc_weigh_ins', 'btc_draws',
    'btc_assignments', 'btc_team_results', 'btc_content_results',
    'btc_finance', 'btc_meetings', 'btc_protests'
  ]) LOOP
    BEGIN
      -- Drop old lenient policy
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_write_%s ON %I', replace(tbl,'.','_'), tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_update_%s ON %I', replace(tbl,'.','_'), tbl);

      -- Create strict policy
      EXECUTE format(
        'CREATE POLICY strict_tenant_%s ON %I
          USING (
            current_setting(''app.is_system_admin'', true) = ''true''
            OR tenant_id = (
              CASE
                WHEN current_setting(''app.current_tenant'', true) IS NULL
                  OR current_setting(''app.current_tenant'', true) = ''''
                THEN (SELECT system.raise_tenant_required())::UUID
                ELSE current_setting(''app.current_tenant'', true)::UUID
              END
            )
          )',
        replace(tbl,'.','_'), tbl
      );
      RAISE NOTICE 'Strict RLS applied to %', tbl;
    EXCEPTION
      WHEN undefined_table THEN RAISE NOTICE 'Table % not found, skipping', tbl;
      WHEN duplicate_object THEN RAISE NOTICE 'Policy exists for %, skipping', tbl;
    END;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════
-- 2. TOURNAMENT MANAGEMENT TABLES (7 tables)
-- ════════════════════════════════════════════════════════

DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'tournament_categories', 'tournament_registrations',
    'tournament_registration_athletes', 'tournament_schedule_slots',
    'tournament_arena_assignments', 'tournament_results',
    'tournament_team_standings'
  ]) LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_write_%s ON %I', replace(tbl,'.','_'), tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_update_%s ON %I', replace(tbl,'.','_'), tbl);

      EXECUTE format(
        'CREATE POLICY strict_tenant_%s ON %I
          USING (
            current_setting(''app.is_system_admin'', true) = ''true''
            OR tenant_id = (
              CASE
                WHEN current_setting(''app.current_tenant'', true) IS NULL
                  OR current_setting(''app.current_tenant'', true) = ''''
                THEN (SELECT system.raise_tenant_required())::UUID
                ELSE current_setting(''app.current_tenant'', true)::UUID
              END
            )
          )',
        replace(tbl,'.','_'), tbl
      );
    EXCEPTION
      WHEN undefined_table THEN NULL;
      WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════
-- 3. PARENT MODULE TABLES (4 tables)
-- ════════════════════════════════════════════════════════

DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'parent_links', 'parent_consents',
    'parent_attendance', 'parent_results'
  ]) LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_write_%s ON %I', replace(tbl,'.','_'), tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_update_%s ON %I', replace(tbl,'.','_'), tbl);

      EXECUTE format(
        'CREATE POLICY strict_tenant_%s ON %I
          USING (
            current_setting(''app.is_system_admin'', true) = ''true''
            OR tenant_id = (
              CASE
                WHEN current_setting(''app.current_tenant'', true) IS NULL
                  OR current_setting(''app.current_tenant'', true) = ''''
                THEN (SELECT system.raise_tenant_required())::UUID
                ELSE current_setting(''app.current_tenant'', true)::UUID
              END
            )
          )',
        replace(tbl,'.','_'), tbl
      );
    EXCEPTION
      WHEN undefined_table THEN NULL;
      WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════
-- 4. TRAINING + SCORING TABLES
-- ════════════════════════════════════════════════════════

DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'training_sessions', 'judge_scores',
    'match_events', 'results', 'medals_summary'
  ]) LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', tbl);

      -- Only add RLS if tenant_id column exists
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = tbl AND column_name = 'tenant_id'
      ) THEN
        EXECUTE format(
          'CREATE POLICY strict_tenant_%s ON %I
            USING (
              current_setting(''app.is_system_admin'', true) = ''true''
              OR tenant_id = (
                CASE
                  WHEN current_setting(''app.current_tenant'', true) IS NULL
                    OR current_setting(''app.current_tenant'', true) = ''''
                  THEN (SELECT system.raise_tenant_required())::UUID
                  ELSE current_setting(''app.current_tenant'', true)::UUID
                END
              )
            )',
          replace(tbl,'.','_'), tbl
        );
      ELSE
        RAISE NOTICE 'Table % has no tenant_id, skipping RLS', tbl;
      END IF;
    EXCEPTION
      WHEN undefined_table THEN NULL;
      WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════
-- 5. MONITORING: View all tables with/without RLS
-- ════════════════════════════════════════════════════════

DROP VIEW IF EXISTS system.v_rls_coverage CASCADE;
CREATE VIEW system.v_rls_coverage AS
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced,
  EXISTS (
    SELECT 1 FROM pg_policy p WHERE p.polrelid = c.oid
      AND p.polname LIKE 'strict_tenant_%'
  ) AS has_strict_policy,
  (SELECT count(*) FROM pg_policy p WHERE p.polrelid = c.oid) AS policy_count,
  EXISTS (
    SELECT 1 FROM information_schema.columns col
    WHERE col.table_schema = n.nspname
      AND col.table_name = c.relname
      AND col.column_name = 'tenant_id'
  ) AS has_tenant_id
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r'
  AND n.nspname NOT IN ('pg_catalog','information_schema','pg_toast','temporal')
ORDER BY
  CASE WHEN c.relrowsecurity THEN 0 ELSE 1 END,
  n.nspname, c.relname;

COMMIT;
