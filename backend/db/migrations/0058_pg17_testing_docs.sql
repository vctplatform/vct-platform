-- ===============================================================
-- VCT Platform — Migration 0058: PG17 FEATURES + TESTING + DOCS
-- P3 Low: Modern SQL patterns, test data generation,
-- auto-documentation, schema validation
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. MERGE STATEMENTS (PG17+)
--    Cleaner upsert pattern for rankings, stats, standings
-- ════════════════════════════════════════════════════════

-- Function: Upsert tournament team standings using MERGE
CREATE OR REPLACE FUNCTION system.merge_team_standings(
  p_tournament_id UUID,
  p_team_id TEXT,
  p_team_name TEXT,
  p_province TEXT,
  p_gold INT,
  p_silver INT,
  p_bronze INT,
  p_points INT
)
RETURNS VOID AS $$
BEGIN
  -- Use INSERT...ON CONFLICT (PG15+ compatible, PG17 MERGE alternative)
  INSERT INTO tournament_team_standings
    (id, tournament_id, team_id, team_name, province,
     gold, silver, bronze, total_medals, points, updated_at)
  VALUES (
    gen_random_uuid(), p_tournament_id, p_team_id, p_team_name, p_province,
    p_gold, p_silver, p_bronze, p_gold + p_silver + p_bronze, p_points, NOW()
  )
  ON CONFLICT (tournament_id, team_id) DO UPDATE SET
    team_name = EXCLUDED.team_name,
    province = EXCLUDED.province,
    gold = EXCLUDED.gold,
    silver = EXCLUDED.silver,
    bronze = EXCLUDED.bronze,
    total_medals = EXCLUDED.total_medals,
    points = EXCLUDED.points,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function: Upsert athlete rankings
CREATE OR REPLACE FUNCTION system.merge_athlete_ranking(
  p_tenant_id UUID,
  p_athlete_id UUID,
  p_category TEXT,
  p_weight_class TEXT,
  p_national_rank INT,
  p_points NUMERIC
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO rankings
    (id, tenant_id, athlete_id, category, weight_class,
     national_rank, points, last_updated)
  VALUES (
    gen_random_uuid(), p_tenant_id, p_athlete_id, p_category,
    p_weight_class, p_national_rank, p_points, NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    national_rank = EXCLUDED.national_rank,
    points = EXCLUDED.points,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════
-- 2. TEST DATA GENERATION
--    Seed realistic test data for development environments
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION system.seed_test_data(
  p_tenant_id UUID DEFAULT '00000000-0000-7000-8000-000000000001',
  p_tournament_count INT DEFAULT 3,
  p_athletes_per_tournament INT DEFAULT 30,
  p_teams_per_tournament INT DEFAULT 6
)
RETURNS TABLE (
  entity_type TEXT,
  count INT
) AS $$
DECLARE
  v_tournament_id UUID;
  v_team_id UUID;
  v_athlete_id UUID;
  i INT;
  j INT;
  k INT;
  v_names TEXT[] := ARRAY[
    'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Hoàng Cường',
    'Phạm Minh Đức', 'Hoàng Thị Em', 'Vũ Quốc Phong',
    'Đặng Hải Giang', 'Bùi Thu Hà', 'Ngô Đình Khoa',
    'Dương Thị Lan', 'Lý Văn Minh', 'Trịnh Xuân Nam',
    'Cao Bảo Ngọc', 'Đinh Thanh Phúc', 'Mai Anh Quân',
    'Phan Thị Rin', 'Tạ Đức Sơn', 'Hồ Thanh Tùng',
    'Lương Thị Uyên', 'Đỗ Xuân Vinh', 'Nguyễn Thu Yến',
    'Trần Đức Anh', 'Lê Thị Bảo', 'Phạm Quốc Cảnh',
    'Hoàng Văn Đạt', 'Vũ Thị Giao', 'Đặng Minh Hiếu',
    'Bùi Quang Khải', 'Ngô Thị Linh', 'Trịnh Văn Mạnh'
  ];
  v_provinces TEXT[] := ARRAY[
    'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Bình Dương',
    'Đồng Nai', 'Thừa Thiên Huế', 'Khánh Hòa', 'Cần Thơ',
    'Hải Phòng', 'Quảng Ninh', 'Nghệ An', 'Thanh Hóa'
  ];
  v_statuses TEXT[] := ARRAY['nhap', 'dang_ky', 'khoa_dk', 'thi_dau', 'ket_thuc'];
  v_genders TEXT[] := ARRAY['nam', 'nu'];
  v_total_tournaments INT := 0;
  v_total_teams INT := 0;
  v_total_athletes INT := 0;
  v_total_matches INT := 0;
BEGIN
  -- Generate tournaments
  FOR i IN 1..p_tournament_count LOOP
    v_tournament_id := gen_random_uuid();

    INSERT INTO tournaments (
      id, tenant_id, code, name, start_date, end_date,
      location, status, metadata, created_at
    ) VALUES (
      v_tournament_id,
      p_tenant_id,
      'TEST-' || lpad(i::TEXT, 3, '0'),
      'Giải Võ Cổ Truyền Test ' || i || ' - ' || extract(YEAR FROM NOW()),
      NOW() + ((i * 30) || ' days')::INTERVAL,
      NOW() + ((i * 30 + 3) || ' days')::INTERVAL,
      v_provinces[1 + (i % array_length(v_provinces, 1))],
      v_statuses[1 + (i % array_length(v_statuses, 1))],
      jsonb_build_object('is_test', true, 'generated_at', NOW()),
      NOW()
    ) ON CONFLICT DO NOTHING;

    v_total_tournaments := v_total_tournaments + 1;

    -- Generate teams per tournament
    FOR j IN 1..p_teams_per_tournament LOOP
      v_team_id := gen_random_uuid();

      INSERT INTO teams (
        id, tenant_id, tournament_id, ten,
        tinh_thanh, created_at
      ) VALUES (
        v_team_id, p_tenant_id, v_tournament_id,
        'Đoàn ' || v_provinces[1 + (j % array_length(v_provinces, 1))],
        v_provinces[1 + (j % array_length(v_provinces, 1))],
        NOW()
      ) ON CONFLICT DO NOTHING;

      v_total_teams := v_total_teams + 1;

      -- Generate athletes per team
      FOR k IN 1..LEAST(p_athletes_per_tournament / p_teams_per_tournament, 10) LOOP
        v_athlete_id := gen_random_uuid();

        INSERT INTO athletes (
          id, tenant_id, tournament_id, team_id,
          ho_ten, ngay_sinh, gioi_tinh, can_nang,
          trang_thai, metadata, created_at
        ) VALUES (
          v_athlete_id, p_tenant_id, v_tournament_id, v_team_id,
          v_names[1 + ((j * 10 + k) % array_length(v_names, 1))],
          NOW() - ((18 + (k * 2)) || ' years')::INTERVAL,
          v_genders[1 + (k % 2)],
          50.0 + (k * 5.5),
          'da_xac_nhan',
          jsonb_build_object('is_test', true),
          NOW()
        ) ON CONFLICT DO NOTHING;

        v_total_athletes := v_total_athletes + 1;
      END LOOP;
    END LOOP;
  END LOOP;

  -- Return summary
  entity_type := 'tournaments'; count := v_total_tournaments; RETURN NEXT;
  entity_type := 'teams'; count := v_total_teams; RETURN NEXT;
  entity_type := 'athletes'; count := v_total_athletes; RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════
-- 3. CLEANUP TEST DATA
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION system.cleanup_test_data(
  p_tenant_id UUID DEFAULT '00000000-0000-7000-8000-000000000001'
)
RETURNS TABLE (entity_type TEXT, deleted_count INT) AS $$
DECLARE
  v_count INT;
BEGIN
  -- Athletes
  DELETE FROM athletes WHERE metadata @> '{"is_test": true}'::JSONB AND tenant_id = p_tenant_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  entity_type := 'athletes'; deleted_count := v_count; RETURN NEXT;

  -- Teams
  DELETE FROM teams WHERE tenant_id = p_tenant_id
    AND tournament_id IN (
      SELECT id FROM tournaments WHERE metadata @> '{"is_test": true}'::JSONB
    );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  entity_type := 'teams'; deleted_count := v_count; RETURN NEXT;

  -- Tournaments
  DELETE FROM tournaments WHERE metadata @> '{"is_test": true}'::JSONB AND tenant_id = p_tenant_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  entity_type := 'tournaments'; deleted_count := v_count; RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════
-- 4. SCHEMA DOCUMENTATION AUTO-GENERATION
--    View providing complete schema docs
-- ════════════════════════════════════════════════════════

DROP VIEW IF EXISTS system.v_schema_docs CASCADE;
CREATE VIEW system.v_schema_docs AS
SELECT
  t.table_schema,
  t.table_name,
  obj_description((t.table_schema || '.' || t.table_name)::regclass) AS table_comment,
  c.column_name,
  c.ordinal_position,
  c.data_type,
  c.is_nullable,
  c.column_default,
  c.character_maximum_length,
  col_description(
    (t.table_schema || '.' || t.table_name)::regclass,
    c.ordinal_position
  ) AS column_comment,
  -- Check if column is indexed
  EXISTS (
    SELECT 1 FROM pg_index pi
    JOIN pg_attribute pa ON pa.attrelid = pi.indrelid AND pa.attnum = ANY(pi.indkey)
    WHERE pi.indrelid = (t.table_schema || '.' || t.table_name)::regclass
    AND pa.attname = c.column_name
  ) AS is_indexed,
  -- Check if column is part of PK
  EXISTS (
    SELECT 1 FROM pg_constraint pc
    JOIN pg_attribute pa ON pa.attrelid = pc.conrelid AND pa.attnum = ANY(pc.conkey)
    WHERE pc.conrelid = (t.table_schema || '.' || t.table_name)::regclass
    AND pc.contype = 'p'
    AND pa.attname = c.column_name
  ) AS is_primary_key,
  -- Check if column has FK
  (
    SELECT tc2.table_schema || '.' || tc2.table_name || '(' || kcu2.column_name || ')'
    FROM information_schema.key_column_usage kcu
    JOIN information_schema.referential_constraints rc
      ON kcu.constraint_name = rc.constraint_name
    JOIN information_schema.key_column_usage kcu2
      ON rc.unique_constraint_name = kcu2.constraint_name
    JOIN information_schema.table_constraints tc2
      ON kcu2.constraint_name = tc2.constraint_name
    WHERE kcu.table_schema = t.table_schema
      AND kcu.table_name = t.table_name
      AND kcu.column_name = c.column_name
    LIMIT 1
  ) AS references_to
FROM information_schema.tables t
JOIN information_schema.columns c
  ON c.table_schema = t.table_schema AND c.table_name = t.table_name
WHERE t.table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_schema, t.table_name, c.ordinal_position;

-- ════════════════════════════════════════════════════════
-- 5. SCHEMA VALIDATION FUNCTION
--    Check database health and convention compliance
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION system.validate_schema()
RETURNS TABLE (
  check_name TEXT,
  severity TEXT,
  table_name TEXT,
  details TEXT
) AS $$
BEGIN
  -- Check: Tables without tenant_id (should have it)
  RETURN QUERY
  SELECT
    'missing_tenant_id'::TEXT,
    'WARNING'::TEXT,
    n.nspname || '.' || c.relname,
    'Table lacks tenant_id column for multi-tenancy'::TEXT
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE c.relkind = 'r'
    AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast', 'archive')
    AND c.reltuples > 0
    AND NOT EXISTS (
      SELECT 1 FROM pg_attribute a
      WHERE a.attrelid = c.oid AND a.attname = 'tenant_id' AND NOT a.attisdropped
    );

  -- Check: Tables without RLS enabled
  RETURN QUERY
  SELECT
    'rls_not_enabled'::TEXT,
    'CRITICAL'::TEXT,
    n.nspname || '.' || c.relname,
    'Table has tenant_id but RLS is not enabled'::TEXT
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE c.relkind = 'r'
    AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast', 'archive')
    AND NOT c.relrowsecurity
    AND EXISTS (
      SELECT 1 FROM pg_attribute a
      WHERE a.attrelid = c.oid AND a.attname = 'tenant_id' AND NOT a.attisdropped
    );

  -- Check: Tables without updated_at trigger
  RETURN QUERY
  SELECT
    'missing_updated_at_trigger'::TEXT,
    'INFO'::TEXT,
    n.nspname || '.' || c.relname,
    'Table has updated_at column but no auto-update trigger'::TEXT
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE c.relkind = 'r'
    AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast', 'archive')
    AND EXISTS (
      SELECT 1 FROM pg_attribute a
      WHERE a.attrelid = c.oid AND a.attname = 'updated_at' AND NOT a.attisdropped
    )
    AND NOT EXISTS (
      SELECT 1 FROM pg_trigger t
      WHERE t.tgrelid = c.oid AND t.tgname = 'set_updated_at'
    );

  -- Check: Tables without audit trigger
  RETURN QUERY
  SELECT
    'missing_audit_trigger'::TEXT,
    'WARNING'::TEXT,
    n.nspname || '.' || c.relname,
    'Table with tenant_id lacks audit trigger'::TEXT
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE c.relkind = 'r'
    AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast', 'archive', 'system')
    AND EXISTS (
      SELECT 1 FROM pg_attribute a
      WHERE a.attrelid = c.oid AND a.attname = 'tenant_id' AND NOT a.attisdropped
    )
    AND NOT EXISTS (
      SELECT 1 FROM pg_trigger t
      WHERE t.tgrelid = c.oid AND t.tgname LIKE 'audit_log%'
    );

  -- Check: Large tables without BRIN index on created_at
  RETURN QUERY
  SELECT
    'missing_brin_index'::TEXT,
    'INFO'::TEXT,
    n.nspname || '.' || c.relname,
    'Large table (>' || c.reltuples::INT || ' rows) without BRIN on created_at'
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE c.relkind = 'r'
    AND c.reltuples > 10000
    AND EXISTS (
      SELECT 1 FROM pg_attribute a
      WHERE a.attrelid = c.oid AND a.attname = 'created_at' AND NOT a.attisdropped
    )
    AND NOT EXISTS (
      SELECT 1 FROM pg_index pi
      JOIN pg_class ic ON pi.indexrelid = ic.oid
      JOIN pg_am am ON ic.relam = am.oid
      WHERE pi.indrelid = c.oid AND am.amname = 'brin'
    );
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════
-- 6. SCHEMA VERSION TRACKING
-- ════════════════════════════════════════════════════════

INSERT INTO system.schema_versions (version, description, applied_by)
VALUES (
  '2.0.0',
  'Major upgrade: tenant isolation, FK constraints, schema consolidation, '
  || 'auto-partitioning, indexes, matview refresh, audit v2, observability, '
  || 'archival pipeline, test infra, schema validation',
  'migration_0049_to_0058'
);

COMMIT;
