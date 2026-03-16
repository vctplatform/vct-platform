-- ===============================================================
-- VCT Platform — Migration 0051: SCHEMA CONSOLIDATION
-- P0 Critical: Resolve dual-schema conflicts by creating
-- compatibility views and deprecating legacy duplicates
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. COMPATIBILITY VIEWS
--    Create unified views that JOIN legacy + new tables
--    API layer should query views, not tables directly
-- ════════════════════════════════════════════════════════

-- 1a. Unified Registrations View
-- Merges: public.registrations (0002) + tournament_registrations (0045)
CREATE OR REPLACE VIEW api_v1.registrations_unified AS
-- New-style registrations (0045)
SELECT
  tr.id,
  tr.tournament_id,
  tr.team_name,
  tr.province,
  tr.status,
  tr.head_coach,
  tr.total_athletes,
  tr.total_contents,
  tr.submitted_at,
  tr.approved_at,
  tr.notes,
  tr.created_at,
  tr.updated_at,
  tr.tenant_id,
  'v2' AS source_version
FROM tournament_registrations tr
WHERE tr.is_deleted = false

UNION ALL

-- Legacy registrations (0002) not in new system
SELECT
  r.id,
  r.tournament_id,
  '' AS team_name,
  '' AS province,
  r.trang_thai AS status,
  '' AS head_coach,
  0 AS total_athletes,
  0 AS total_contents,
  NULL AS submitted_at,
  NULL AS approved_at,
  r.ghi_chu AS notes,
  r.created_at,
  r.updated_at,
  r.tenant_id,
  'v1' AS source_version
FROM registrations r
WHERE r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM tournament_registrations tr
    WHERE tr.tournament_id = r.tournament_id
  );

-- 1b. Unified Results View
-- Merges: public.results + public.medals (0003) + tournament_results (0045)
CREATE OR REPLACE VIEW api_v1.results_unified AS
SELECT
  tr.id,
  tr.tournament_id,
  tr.category_name,
  tr.content_type,
  tr.gold_name,
  tr.gold_team,
  tr.silver_name,
  tr.silver_team,
  tr.bronze1_name,
  tr.bronze1_team,
  tr.bronze2_name,
  tr.bronze2_team,
  tr.is_finalized,
  tr.created_at,
  tr.updated_at,
  tr.tenant_id,
  'v2' AS source_version
FROM tournament_results tr
WHERE tr.is_deleted = false;

-- 1c. Unified Team Standings View
CREATE OR REPLACE VIEW api_v1.standings_unified AS
SELECT
  ts.id,
  ts.tournament_id,
  ts.team_name,
  ts.province,
  ts.gold,
  ts.silver,
  ts.bronze,
  ts.total_medals,
  ts.points,
  ts.rank,
  ts.updated_at,
  ts.tenant_id
FROM tournament_team_standings ts;

-- ════════════════════════════════════════════════════════
-- 2. RENAME LEGACY TABLES (DEPRECATION MARKERS)
--    Add comments to mark legacy tables for future removal
-- ════════════════════════════════════════════════════════

COMMENT ON TABLE registrations IS 
  '[DEPRECATED] Use tournament_registrations (0045) instead. Kept for backward compatibility.';

DO $$ BEGIN
  COMMENT ON TABLE medals IS 
    '[DEPRECATED] Use tournament_results (0045) instead. Kept for backward compatibility.';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  COMMENT ON TABLE results IS 
    '[DEPRECATED] Use tournament_results (0045) instead. Kept for backward compatibility.';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ════════════════════════════════════════════════════════
-- 3. SCHEMA MAPPING TABLE
--    Track which tables are legacy vs active
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.schema_registry (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  table_schema    VARCHAR(50) NOT NULL,
  table_name      VARCHAR(100) NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'deprecated', 'archived', 'removed')),
  replaced_by     VARCHAR(200),          -- 'tournament_registrations'
  migration_ref   VARCHAR(20),           -- '0045'
  notes           TEXT,
  deprecated_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (table_schema, table_name)
);

-- Seed: mark deprecated tables
INSERT INTO system.schema_registry (table_schema, table_name, status, replaced_by, migration_ref, notes, deprecated_at)
VALUES
  ('public', 'registrations', 'deprecated', 'tournament_registrations', '0045',
   'Legacy registration system. New tables have team_type, province, approval workflow.', NOW()),
  ('public', 'medals', 'deprecated', 'tournament_results', '0045',
   'Legacy medal tracking. New tournament_results has full denormalized results.', NOW()),
  ('public', 'results', 'deprecated', 'tournament_results', '0045',
   'Legacy results. See tournament_results for unified results.', NOW())
ON CONFLICT (table_schema, table_name) DO NOTHING;

-- Mark active tables
INSERT INTO system.schema_registry (table_schema, table_name, status, migration_ref)
VALUES
  ('public', 'tournament_categories', 'active', '0045'),
  ('public', 'tournament_registrations', 'active', '0045'),
  ('public', 'tournament_registration_athletes', 'active', '0045'),
  ('public', 'tournament_schedule_slots', 'active', '0045'),
  ('public', 'tournament_arena_assignments', 'active', '0045'),
  ('public', 'tournament_results', 'active', '0045'),
  ('public', 'tournament_team_standings', 'active', '0045'),
  ('public', 'btc_members', 'active', '0048'),
  ('public', 'btc_weigh_ins', 'active', '0048'),
  ('public', 'btc_draws', 'active', '0048'),
  ('public', 'btc_assignments', 'active', '0048'),
  ('public', 'btc_team_results', 'active', '0048'),
  ('public', 'btc_content_results', 'active', '0048'),
  ('public', 'btc_finance', 'active', '0048'),
  ('public', 'btc_meetings', 'active', '0048'),
  ('public', 'btc_protests', 'active', '0048'),
  ('public', 'parent_links', 'active', '0048'),
  ('public', 'parent_consents', 'active', '0048'),
  ('public', 'parent_attendance', 'active', '0048'),
  ('public', 'parent_results', 'active', '0048'),
  ('public', 'training_sessions', 'active', '0048')
ON CONFLICT (table_schema, table_name) DO NOTHING;

COMMIT;
