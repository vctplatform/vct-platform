-- ===============================================================
-- VCT Platform — Migration 0055: AUDIT SYSTEM UPGRADE
-- P2 Medium: Auto-attach audit triggers to ALL tenant-aware tables
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. ENHANCED AUDIT TRIGGER FUNCTION
--    Captures request context (IP, user-agent, request-id)
--    from session variables set by Go middleware
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION trigger_audit_log_v2()
RETURNS TRIGGER AS $$
DECLARE
  v_old     JSONB;
  v_new     JSONB;
  v_changed JSONB;
  v_tenant  UUID;
  v_record  UUID;
  v_user    UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD);
    v_new := NULL;
    v_tenant := OLD.tenant_id;
    v_record := OLD.id;
  ELSIF TG_OP = 'INSERT' THEN
    v_old := NULL;
    v_new := to_jsonb(NEW);
    v_tenant := NEW.tenant_id;
    v_record := NEW.id;
  ELSE -- UPDATE
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_tenant := NEW.tenant_id;
    v_record := NEW.id;
    
    -- Compute changed fields (exclude housekeeping columns)
    SELECT jsonb_agg(key) INTO v_changed
    FROM jsonb_each(v_new) AS n(key, val)
    WHERE v_old -> key IS DISTINCT FROM val
      AND key NOT IN ('updated_at', 'version', 'counts_refreshed_at',
                      'search_vector', 'cached_athlete_count',
                      'cached_team_count', 'cached_match_count',
                      'cached_registration_count');
    
    -- Skip if nothing meaningful changed
    IF v_changed IS NULL OR jsonb_array_length(v_changed) = 0 THEN
      RETURN NEW;
    END IF;
  END IF;

  -- Get current user from session
  BEGIN
    v_user := NULLIF(current_setting('app.current_user', true), '')::UUID;
  EXCEPTION WHEN others THEN
    v_user := NULL;
  END;

  INSERT INTO system.audit_log_partitioned
    (tenant_id, table_name, record_id, action,
     old_data, new_data, changed_fields,
     user_id, ip_address, request_id)
  VALUES (
    COALESCE(v_tenant, '00000000-0000-7000-8000-000000000001'),
    TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
    v_record,
    TG_OP,
    v_old, v_new,
    COALESCE(v_changed, '[]'),
    v_user,
    NULLIF(current_setting('app.client_ip', true), '')::INET,
    NULLIF(current_setting('app.request_id', true), '')
  );

  IF TG_OP = 'DELETE' THEN RETURN OLD;
  ELSE RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════
-- 2. AUTO-ATTACH AUDIT TO ALL TENANT-AWARE TABLES
--    Discovers tables with tenant_id column dynamically
-- ════════════════════════════════════════════════════════

DO $$
DECLARE
  r RECORD;
  trigger_name TEXT;
BEGIN
  FOR r IN
    SELECT DISTINCT c.table_schema, c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema
      AND t.table_name = c.table_name
      AND t.table_type = 'BASE TABLE'
    WHERE c.column_name = 'tenant_id'
      AND c.table_schema NOT IN ('pg_catalog', 'information_schema')
      -- Skip partitioned parent tables (triggers are on children)
      AND NOT EXISTS (
        SELECT 1 FROM pg_partitioned_table pt
        JOIN pg_class pc ON pt.partrelid = pc.oid
        JOIN pg_namespace pn ON pc.relnamespace = pn.oid
        WHERE pn.nspname = c.table_schema AND pc.relname = c.table_name
      )
      -- Must have 'id' column for record_id
      AND EXISTS (
        SELECT 1 FROM information_schema.columns c2
        WHERE c2.table_schema = c.table_schema
          AND c2.table_name = c.table_name
          AND c2.column_name = 'id'
      )
  LOOP
    trigger_name := 'audit_log_v2';
    BEGIN
      EXECUTE format(
        'CREATE TRIGGER %I
          AFTER INSERT OR UPDATE OR DELETE ON %I.%I
          FOR EACH ROW EXECUTE FUNCTION trigger_audit_log_v2()',
        trigger_name, r.table_schema, r.table_name
      );
      RAISE NOTICE 'Audit trigger created on %.%', r.table_schema, r.table_name;
    EXCEPTION
      WHEN duplicate_object THEN
        RAISE NOTICE 'Audit trigger already exists on %.%', r.table_schema, r.table_name;
    END;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════
-- 3. AUDIT SUMMARY VIEW
--    Quick overview of audit activity
-- ════════════════════════════════════════════════════════

DROP VIEW IF EXISTS system.v_audit_summary CASCADE;
CREATE VIEW system.v_audit_summary AS
SELECT
  date_trunc('hour', created_at) AS hour,
  table_name,
  action,
  count(*) AS event_count,
  count(DISTINCT user_id) AS unique_users
FROM system.audit_log_partitioned
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY date_trunc('hour', created_at), table_name, action
ORDER BY hour DESC, event_count DESC;

-- ════════════════════════════════════════════════════════
-- 4. AUDIT COVERAGE REPORT VIEW
--    Shows which tables have/lack audit triggers
-- ════════════════════════════════════════════════════════

DROP VIEW IF EXISTS system.v_audit_coverage CASCADE;
CREATE VIEW system.v_audit_coverage AS
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  EXISTS (
    SELECT 1 FROM pg_trigger t
    WHERE t.tgrelid = c.oid
    AND t.tgname LIKE 'audit_log%'
  ) AS has_audit_trigger,
  EXISTS (
    SELECT 1 FROM information_schema.columns ic
    WHERE ic.table_schema = n.nspname
    AND ic.table_name = c.relname
    AND ic.column_name = 'tenant_id'
  ) AS has_tenant_id,
  c.reltuples::BIGINT AS estimated_rows
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relkind = 'r'
  AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY n.nspname, c.relname;

COMMIT;
