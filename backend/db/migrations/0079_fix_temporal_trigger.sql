-- ===============================================================
-- VCT Platform — Migration 0079: FIX TEMPORAL TRIGGER
-- P0 Critical: Rewrite trigger_temporal_versioning() to use
-- dynamic column mapping instead of ($1).* expansion
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. COLUMN MAPPING CONFIG TABLE
--    Maps main table columns → history table columns
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS temporal.column_mappings (
  id            SERIAL PRIMARY KEY,
  source_table  TEXT NOT NULL,           -- 'athletes'
  history_table TEXT NOT NULL,           -- 'temporal.athletes_history'
  source_cols   TEXT[] NOT NULL,         -- columns to copy from main
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (source_table)
);

-- Seed mappings for existing temporal tables
INSERT INTO temporal.column_mappings (source_table, history_table, source_cols) VALUES
  ('athletes', 'temporal.athletes_history',
   ARRAY['id','tenant_id','ho_ten','ngay_sinh','gioi_tinh','can_nang',
         'ma_vdv','tournament_id','current_club_id','trang_thai','metadata']),
  ('tournaments', 'temporal.tournaments_history',
   ARRAY['id','tenant_id','name','code','status','start_date','end_date',
         'location','config']),
  ('combat_matches', 'temporal.combat_matches_history',
   ARRAY['id','tenant_id','tournament_id','arena_id','vdv_do_id','vdv_xanh_id',
         'trang_thai','ket_qua','diem_do','diem_xanh','thu_tu','metadata'])
ON CONFLICT (source_table) DO UPDATE SET
  source_cols = EXCLUDED.source_cols;

-- ════════════════════════════════════════════════════════
-- 2. REWRITE: trigger_temporal_versioning()
--    Uses dynamic column list from mapping table
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION trigger_temporal_versioning()
RETURNS TRIGGER AS $$
DECLARE
  v_history_table TEXT;
  v_user_id       UUID;
  v_now           TIMESTAMPTZ := NOW();
  v_source_cols   TEXT[];
  v_col_list      TEXT;
  v_val_refs      TEXT;
  v_col           TEXT;
  v_idx           INT;
BEGIN
  -- Lookup history table and column mapping
  SELECT cm.history_table, cm.source_cols
    INTO v_history_table, v_source_cols
    FROM temporal.column_mappings cm
   WHERE cm.source_table = TG_TABLE_NAME;

  -- Fallback: if no mapping configured, skip silently
  IF v_history_table IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  v_user_id := NULLIF(current_setting('app.current_user', true), '')::UUID;

  -- Build column list: "id, tenant_id, ho_ten, ..."
  v_col_list := array_to_string(v_source_cols, ', ');

  -- Build value references using json extraction
  -- For each column: ($1::jsonb)->>'{col}' cast to appropriate type
  -- Since types vary, use a simpler approach: build dynamic SELECT

  IF TG_OP = 'INSERT' THEN
    BEGIN
      EXECUTE format(
        'INSERT INTO %s (%s, valid_from, valid_to, changed_by, change_type)
         SELECT %s, $1, $2, $3, $4
         FROM (SELECT ($5::%I).*) sub',
        v_history_table,
        v_col_list,
        v_col_list,
        TG_TABLE_NAME
      ) USING v_now, 'infinity'::TIMESTAMPTZ, v_user_id, 'INSERT', NEW;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Temporal INSERT failed for %.%: %', TG_TABLE_SCHEMA, TG_TABLE_NAME, SQLERRM;
    END;
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    BEGIN
      -- Close previous version
      EXECUTE format(
        'UPDATE %s SET valid_to = $1
         WHERE id = $2 AND valid_to = ''infinity''::TIMESTAMPTZ',
        v_history_table
      ) USING v_now, OLD.id;

      -- Insert new version with mapped columns only
      EXECUTE format(
        'INSERT INTO %s (%s, valid_from, valid_to, changed_by, change_type)
         SELECT %s, $1, $2, $3, $4
         FROM (SELECT ($5::%I).*) sub',
        v_history_table,
        v_col_list,
        v_col_list,
        TG_TABLE_NAME
      ) USING v_now, 'infinity'::TIMESTAMPTZ, v_user_id, 'UPDATE', NEW;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Temporal UPDATE failed for %.%: %', TG_TABLE_SCHEMA, TG_TABLE_NAME, SQLERRM;
    END;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    BEGIN
      EXECUTE format(
        'UPDATE %s SET valid_to = $1, change_type = $2
         WHERE id = $3 AND valid_to = ''infinity''::TIMESTAMPTZ',
        v_history_table
      ) USING v_now, 'DELETE', OLD.id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Temporal DELETE failed for %.%: %', TG_TABLE_SCHEMA, TG_TABLE_NAME, SQLERRM;
    END;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql
SET search_path = temporal, public, pg_catalog;

-- ════════════════════════════════════════════════════════
-- 3. ADD change_reason TO HISTORY TABLES (missing column)
-- ════════════════════════════════════════════════════════

ALTER TABLE temporal.tournaments_history
  ADD COLUMN IF NOT EXISTS change_reason TEXT;

ALTER TABLE temporal.combat_matches_history
  ADD COLUMN IF NOT EXISTS change_reason TEXT;

-- ════════════════════════════════════════════════════════
-- 4. HELPER: Add new table to temporal tracking
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION temporal.register_temporal_table(
  p_source_table TEXT,
  p_columns TEXT[],
  p_history_schema TEXT DEFAULT 'temporal'
)
RETURNS VOID AS $$
DECLARE
  v_history_table TEXT;
  v_col TEXT;
  v_create_sql TEXT;
BEGIN
  v_history_table := p_history_schema || '.' || p_source_table || '_history';

  -- Build CREATE TABLE with mapped columns
  v_create_sql := format('CREATE TABLE IF NOT EXISTS %s (', v_history_table);
  FOREACH v_col IN ARRAY p_columns LOOP
    -- Get column type from source table
    v_create_sql := v_create_sql || format(
      '%I %s, ',
      v_col,
      (SELECT format_type(atttypid, atttypmod)
       FROM pg_attribute
       WHERE attrelid = p_source_table::regclass
         AND attname = v_col
         AND NOT attisdropped)
    );
  END LOOP;

  v_create_sql := v_create_sql ||
    'valid_from TIMESTAMPTZ NOT NULL, ' ||
    'valid_to TIMESTAMPTZ NOT NULL, ' ||
    'changed_by UUID, ' ||
    'change_type VARCHAR(10) NOT NULL CHECK (change_type IN (''INSERT'',''UPDATE'',''DELETE'')), ' ||
    'change_reason TEXT, ' ||
    'PRIMARY KEY (id, valid_from))';

  EXECUTE v_create_sql;

  -- Register in mapping table
  INSERT INTO temporal.column_mappings (source_table, history_table, source_cols)
  VALUES (p_source_table, v_history_table, p_columns)
  ON CONFLICT (source_table) DO UPDATE SET source_cols = EXCLUDED.source_cols;

  -- Create trigger
  EXECUTE format(
    'CREATE TRIGGER temporal_version
       AFTER INSERT OR UPDATE OR DELETE ON %I
       FOR EACH ROW EXECUTE FUNCTION trigger_temporal_versioning()',
    p_source_table
  );
END;
$$ LANGUAGE plpgsql
SET search_path = temporal, public, pg_catalog;

COMMIT;
