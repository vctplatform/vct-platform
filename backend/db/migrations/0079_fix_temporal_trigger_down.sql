-- Rollback 0079: Fix Temporal Trigger
BEGIN;
DROP FUNCTION IF EXISTS temporal.register_temporal_table CASCADE;
DROP TABLE IF EXISTS temporal.column_mappings CASCADE;
-- Restore original trigger function (from 0064)
CREATE OR REPLACE FUNCTION trigger_temporal_versioning()
RETURNS TRIGGER AS $$
DECLARE
  v_history_table TEXT;
  v_user_id UUID;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  v_history_table := 'temporal.' || TG_TABLE_NAME || '_history';
  v_user_id := NULLIF(current_setting('app.current_user', true), '')::UUID;
  IF TG_OP = 'INSERT' THEN
    BEGIN
      EXECUTE format('INSERT INTO %s SELECT ($1).*, $2, $3, $4, $5', v_history_table)
        USING NEW, v_now, 'infinity'::TIMESTAMPTZ, v_user_id, 'INSERT';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    BEGIN
      EXECUTE format('UPDATE %s SET valid_to = $1 WHERE id = $2 AND valid_to = ''infinity''::TIMESTAMPTZ', v_history_table)
        USING v_now, OLD.id;
      EXECUTE format('INSERT INTO %s SELECT ($1).*, $2, $3, $4, $5', v_history_table)
        USING NEW, v_now, 'infinity'::TIMESTAMPTZ, v_user_id, 'UPDATE';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    BEGIN
      EXECUTE format('UPDATE %s SET valid_to = $1, change_type = $2 WHERE id = $3 AND valid_to = ''infinity''::TIMESTAMPTZ', v_history_table)
        USING v_now, 'DELETE', OLD.id;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;
COMMIT;
