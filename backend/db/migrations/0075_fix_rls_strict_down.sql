-- Rollback 0075: Fix RLS Strict
BEGIN;
DROP FUNCTION IF EXISTS system.raise_tenant_required CASCADE;
DROP FUNCTION IF EXISTS system.create_strict_rls_policy CASCADE;
-- Strict policies are automatically dropped when function is dropped (CASCADE)
-- Re-apply old lenient policies
DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'tournaments','teams','athletes','registrations','referees',
    'arenas','combat_matches','form_performances','appeals',
    'match_events','rankings','clubs'
  ]) LOOP
    BEGIN
      EXECUTE format(
        'CREATE POLICY tenant_isolation_%I ON %I
          USING (tenant_id = COALESCE(
            current_setting(''app.current_tenant'', true)::UUID,
            ''00000000-0000-7000-8000-000000000001''::UUID))',
        tbl, tbl);
    EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL;
    END;
  END LOOP;
END $$;
COMMIT;
