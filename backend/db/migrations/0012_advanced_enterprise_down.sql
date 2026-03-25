-- ===============================================================
-- VCT Platform — Migration 0012 DOWN
-- ===============================================================
BEGIN;

-- Drop search triggers and columns
DO $$
DECLARE tbl TEXT; trig_name TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'athletes', 'tournaments',
    'platform.martial_schools', 'platform.posts',
    'platform.heritage_glossary', 'platform.heritage_techniques'
  ]) LOOP
    BEGIN
      EXECUTE format('DROP TRIGGER IF EXISTS set_search_vector ON %s', tbl);
      EXECUTE format('ALTER TABLE %s DROP COLUMN IF EXISTS search_vector', tbl);
    EXCEPTION WHEN undefined_table THEN NULL;
    END;
  END LOOP;
END $$;

-- Drop search functions
DROP FUNCTION IF EXISTS trigger_athletes_search_vector() CASCADE;
DROP FUNCTION IF EXISTS trigger_schools_search_vector() CASCADE;
DROP FUNCTION IF EXISTS trigger_posts_search_vector() CASCADE;
DROP FUNCTION IF EXISTS trigger_glossary_search_vector() CASCADE;
DROP FUNCTION IF EXISTS trigger_tournaments_search_vector() CASCADE;
DROP FUNCTION IF EXISTS trigger_heritage_tech_search_vector() CASCADE;

-- Drop audit triggers from tables
DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'tournaments', 'athletes', 'teams', 'combat_matches',
    'registrations', 'referees', 'rankings',
    'platform.payments', 'platform.invoices',
    'platform.sponsorships', 'people.coaches',
    'core.users', 'core.roles'
  ]) LOOP
    BEGIN
      EXECUTE format('DROP TRIGGER IF EXISTS audit_log ON %s', tbl);
    EXCEPTION WHEN undefined_table THEN NULL;
    END;
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS trigger_audit_log() CASCADE;

-- Drop outbox
DROP TABLE IF EXISTS system.event_outbox CASCADE;

-- Drop partitioned audit log (and all partitions)
DROP TABLE IF EXISTS system.audit_log_partitioned CASCADE;

-- Drop partitioned match events (and all partitions)
DROP TABLE IF EXISTS tournament.match_events CASCADE;

-- Drop FTS config
DROP TEXT SEARCH CONFIGURATION IF EXISTS vietnamese CASCADE;
DROP EXTENSION IF EXISTS unaccent CASCADE;

COMMIT;
