-- ===============================================================
-- VCT Platform — Migration 0024: CROSS-CUTTING FIXES (Phase 6A)
-- Resolve duplicate tables, legacy views, optimistic locking,
-- missing RLS on Phase 4-5 tables, covering indexes,
-- trigger execution ordering
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. RESOLVE DUPLICATE: system.feature_flags (0011 vs 0023)
--    0011 created system.feature_flags with (flag_key, flag_value)
--    0023 created SEPARATE system.feature_flags with (name, is_enabled)
--    Fix: merge 0011 version into 0023 structure
-- ════════════════════════════════════════════════════════

-- The 0023 version uses CREATE TABLE IF NOT EXISTS, so if 0011's ran first,
-- 0023's table creation was silently skipped. We need to ensure the columns
-- from 0023 exist on whatever table was created.

DO $$
BEGIN
  -- Add 0023 columns if they're missing (0011 schema was used)
  ALTER TABLE system.feature_flags ADD COLUMN IF NOT EXISTS name VARCHAR(200);
  ALTER TABLE system.feature_flags ADD COLUMN IF NOT EXISTS description TEXT;
  ALTER TABLE system.feature_flags ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT false;
  ALTER TABLE system.feature_flags ADD COLUMN IF NOT EXISTS rollout_pct INT DEFAULT 0;
  ALTER TABLE system.feature_flags ADD COLUMN IF NOT EXISTS target_rules JSONB DEFAULT '{}';

  -- Migrate 0011 data → 0023 format
  UPDATE system.feature_flags
  SET name = flag_key,
      is_enabled = COALESCE(flag_value, false),
      rollout_pct = COALESCE(rollout_percent, 0)
  WHERE name IS NULL AND flag_key IS NOT NULL;

  -- Ensure unique constraint on name
  BEGIN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_feature_flags_name
      ON system.feature_flags(name) WHERE name IS NOT NULL;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
EXCEPTION WHEN undefined_column THEN
  -- 0023 schema was used (0011 never ran), nothing to migrate
  NULL;
END $$;

-- ════════════════════════════════════════════════════════
-- 2. LEGACY TABLE BRIDGE VIEWS
--    0002 created public.users, 0004 created core.users
--    Both exist. Create views to bridge queries.
-- ════════════════════════════════════════════════════════

-- View: query legacy public.users → gets core.users data
CREATE OR REPLACE VIEW api_v1.users_legacy AS
SELECT
  u.id, u.full_name, u.email, u.avatar_url, u.is_active,
  u.tenant_id, u.created_at, u.updated_at
FROM core.users u
WHERE u.is_deleted = false;

-- ════════════════════════════════════════════════════════
-- 3. OPTIMISTIC LOCKING ENFORCEMENT
--    version column exists on 100+ tables but no trigger
--    enforces "UPDATE WHERE version = X" pattern.
--    The trigger_set_updated_at auto-bumps version, but
--    nothing REJECTS a stale version.
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION trigger_optimistic_lock()
RETURNS TRIGGER AS $$
BEGIN
  -- If caller explicitly sets version (from app layer), validate it
  -- App sends: UPDATE ... SET version = OLD.version WHERE id = X
  -- Trigger checks: if NEW.version == OLD.version (not bumped by app), OK
  -- If NEW.version < OLD.version → stale write attempt
  IF NEW.version IS NOT NULL AND OLD.version IS NOT NULL THEN
    IF NEW.version < OLD.version THEN
      RAISE EXCEPTION 'Optimistic lock violation on %.%: expected version %, got % (id: %)',
        TG_TABLE_SCHEMA, TG_TABLE_NAME, OLD.version, NEW.version, OLD.id
        USING ERRCODE = '40001';  -- serialization_failure
    END IF;
  END IF;
  -- Always bump version (trigger_set_updated_at does this too, but belt-and-suspenders)
  NEW.version := COALESCE(OLD.version, 0) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to critical high-contention tables
DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'tournaments', 'combat_matches', 'athletes', 'teams',
    'registrations', 'platform.payments', 'platform.invoices',
    'platform.sponsorships', 'core.users',
    'training.curricula', 'training.training_plans'
  ]) LOOP
    BEGIN
      EXECUTE format(
        'CREATE TRIGGER optimistic_lock BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION trigger_optimistic_lock()',
        tbl
      );
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN undefined_table THEN NULL;
    END;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════
-- 4. MISSING RLS ON PHASE 4-5 TABLES
--    Tables created in 0018-0023 need RLS + WITH CHECK
-- ════════════════════════════════════════════════════════

DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    -- Phase 4 (0018)
    'core.role_permissions', 'core.approval_workflows',
    'core.approval_requests', 'core.approval_actions',
    'system.webhooks', 'system.webhook_deliveries',
    -- Phase 4 (0019)
    'system.media_files',
    -- Phase 4 (0020)
    'system.import_jobs', 'system.import_rows',
    'system.export_jobs',
    -- Phase 5 (0021)
    'tournament.event_store', 'tournament.match_scores',
    'tournament.event_snapshots',
    -- Phase 5 (0022)
    'core.user_consents', 'core.user_activity_log'
  ]) LOOP
    BEGIN
      -- Ensure RLS enabled
      EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', tbl);
      -- Add WITH CHECK for INSERT
      EXECUTE format(
        'CREATE POLICY tenant_write_%s ON %s FOR INSERT WITH CHECK (
          tenant_id = COALESCE(current_setting(''app.current_tenant'', true)::UUID,
          ''00000000-0000-7000-8000-000000000001''::UUID)
        )',
        replace(replace(tbl, '.', '_'), ' ', ''), tbl
      );
      -- Add WITH CHECK for UPDATE
      EXECUTE format(
        'CREATE POLICY tenant_update_%s ON %s FOR UPDATE
          USING (tenant_id = COALESCE(current_setting(''app.current_tenant'', true)::UUID,
            ''00000000-0000-7000-8000-000000000001''::UUID))
          WITH CHECK (tenant_id = COALESCE(current_setting(''app.current_tenant'', true)::UUID,
            ''00000000-0000-7000-8000-000000000001''::UUID))',
        replace(replace(tbl, '.', '_'), ' ', ''), tbl
      );
    EXCEPTION
      WHEN undefined_table THEN NULL;
      WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════
-- 5. COVERING INDEXES (Include common SELECT columns)
--    Avoids heap lookups for the most common queries
-- ════════════════════════════════════════════════════════

-- Tournament list page: filter by status, show name+dates
CREATE INDEX IF NOT EXISTS idx_tournaments_covering
  ON tournaments(tenant_id, status, start_date DESC)
  INCLUDE (name, code, location)
  WHERE is_deleted = false;

-- Athlete lookup by tournament + status
CREATE INDEX IF NOT EXISTS idx_athletes_covering
  ON athletes(tenant_id, tournament_id, trang_thai)
  INCLUDE (ho_ten, can_nang)
  WHERE is_deleted = false;

-- Match list by tournament
CREATE INDEX IF NOT EXISTS idx_matches_covering
  ON combat_matches(tenant_id, tournament_id, trang_thai)
  INCLUDE (arena_id)
  WHERE is_deleted = false;

-- Payment lookup by status
CREATE INDEX IF NOT EXISTS idx_payments_covering
  ON platform.payments(tenant_id, status, created_at DESC)
  INCLUDE (amount, currency, payment_method)
  WHERE is_deleted = false;

-- Post feed (timeline)
CREATE INDEX IF NOT EXISTS idx_posts_covering
  ON platform.posts(tenant_id, created_at DESC)
  INCLUDE (author_id, title, post_type, like_count, comment_count)
  WHERE is_deleted = false;

-- Event store: stream replay
CREATE INDEX IF NOT EXISTS idx_events_covering
  ON tournament.event_store(tenant_id, stream_id, event_version)
  INCLUDE (event_type, event_data)
  WHERE TRUE;

-- ════════════════════════════════════════════════════════
-- 6. TRIGGER EXECUTION ORDERING
--    combat_matches now has 6+ triggers. Ensure correct order:
--    1. validate_match_status (BEFORE UPDATE) - state machine
--    2. immutable_match_status (BEFORE UPDATE) - lock after ket_thuc
--    3. prevent_tenant_change (BEFORE UPDATE) - tenant immutability
--    4. optimistic_lock (BEFORE UPDATE) - version check
--    5. set_updated_at (BEFORE UPDATE) - timestamp + version bump
--    6. notify_on_status_change (AFTER UPDATE) - LISTEN/NOTIFY
--    7. counter triggers (AFTER INSERT/DELETE) - counters
--    8. audit trigger (AFTER INSERT/UPDATE/DELETE) - logging
--
--    PostgreSQL fires triggers in alphabetical order within
--    same timing/event. We name them 01_validate, 02_immutable, etc.
-- ════════════════════════════════════════════════════════

-- Rename triggers for deterministic ordering on combat_matches
DO $$
BEGIN
  -- Drop old names, recreate with ordered names
  DROP TRIGGER IF EXISTS validate_match_status ON combat_matches;
  CREATE TRIGGER a01_validate_match_status
    BEFORE UPDATE ON combat_matches
    FOR EACH ROW EXECUTE FUNCTION trigger_validate_match_status();

  DROP TRIGGER IF EXISTS immutable_match_status ON combat_matches;
  CREATE TRIGGER a02_immutable_match_status
    BEFORE UPDATE ON combat_matches
    FOR EACH ROW EXECUTE FUNCTION trigger_immutable_match();

  DROP TRIGGER IF EXISTS prevent_tenant_change ON combat_matches;
  CREATE TRIGGER a03_prevent_tenant_change
    BEFORE UPDATE ON combat_matches
    FOR EACH ROW EXECUTE FUNCTION trigger_prevent_tenant_change();

  DROP TRIGGER IF EXISTS optimistic_lock ON combat_matches;
  CREATE TRIGGER a04_optimistic_lock
    BEFORE UPDATE ON combat_matches
    FOR EACH ROW EXECUTE FUNCTION trigger_optimistic_lock();

  DROP TRIGGER IF EXISTS set_updated_at ON combat_matches;
  CREATE TRIGGER a05_set_updated_at
    BEFORE UPDATE ON combat_matches
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

  DROP TRIGGER IF EXISTS notify_on_status_change ON combat_matches;
  CREATE TRIGGER z01_notify_on_status_change
    AFTER UPDATE ON combat_matches
    FOR EACH ROW EXECUTE FUNCTION notify_match_status_change();
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Same for tournaments
DO $$
BEGIN
  DROP TRIGGER IF EXISTS validate_tournament_status ON tournaments;
  CREATE TRIGGER a01_validate_tournament_status
    BEFORE UPDATE ON tournaments
    FOR EACH ROW EXECUTE FUNCTION trigger_validate_tournament_status();

  DROP TRIGGER IF EXISTS prevent_tenant_change ON tournaments;
  CREATE TRIGGER a02_prevent_tenant_change
    BEFORE UPDATE ON tournaments
    FOR EACH ROW EXECUTE FUNCTION trigger_prevent_tenant_change();

  DROP TRIGGER IF EXISTS optimistic_lock ON tournaments;
  CREATE TRIGGER a03_optimistic_lock
    BEFORE UPDATE ON tournaments
    FOR EACH ROW EXECUTE FUNCTION trigger_optimistic_lock();

  DROP TRIGGER IF EXISTS set_updated_at ON tournaments;
  CREATE TRIGGER a04_set_updated_at
    BEFORE UPDATE ON tournaments
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Same for payments
DO $$
BEGIN
  DROP TRIGGER IF EXISTS validate_payment_status ON platform.payments;
  CREATE TRIGGER a01_validate_payment_status
    BEFORE UPDATE ON platform.payments
    FOR EACH ROW EXECUTE FUNCTION trigger_validate_payment_status();

  DROP TRIGGER IF EXISTS immutable_payment_fields ON platform.payments;
  CREATE TRIGGER a02_immutable_payment_fields
    BEFORE UPDATE ON platform.payments
    FOR EACH ROW EXECUTE FUNCTION trigger_immutable_payment();

  DROP TRIGGER IF EXISTS prevent_tenant_change ON platform.payments;
  CREATE TRIGGER a03_prevent_tenant_change
    BEFORE UPDATE ON platform.payments
    FOR EACH ROW EXECUTE FUNCTION trigger_prevent_tenant_change();

  DROP TRIGGER IF EXISTS optimistic_lock ON platform.payments;
  CREATE TRIGGER a04_optimistic_lock
    BEFORE UPDATE ON platform.payments
    FOR EACH ROW EXECUTE FUNCTION trigger_optimistic_lock();

  DROP TRIGGER IF EXISTS set_updated_at ON platform.payments;
  CREATE TRIGGER a05_set_updated_at
    BEFORE UPDATE ON platform.payments
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ════════════════════════════════════════════════════════
-- 7. SOFT-DELETE CASCADING
--    When parent is soft-deleted, cascade to children
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION trigger_cascade_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_deleted = true AND OLD.is_deleted = false THEN
    NEW.deleted_at := COALESCE(NEW.deleted_at, NOW());
    NEW.deleted_by := COALESCE(NEW.deleted_by,
      NULLIF(current_setting('app.current_user', true), '')::UUID);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tournament soft-delete → cascade to matches, registrations
CREATE OR REPLACE FUNCTION trigger_cascade_tournament_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_deleted = true AND OLD.is_deleted = false THEN
    UPDATE combat_matches SET
      is_deleted = true, deleted_at = NOW(), deleted_by = NEW.deleted_by
    WHERE tournament_id = NEW.id AND is_deleted = false;

    UPDATE registrations SET
      is_deleted = true, deleted_at = NOW(), deleted_by = NEW.deleted_by
    WHERE tournament_id = NEW.id AND is_deleted = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER z02_cascade_soft_delete
    AFTER UPDATE OF is_deleted ON tournaments
    FOR EACH ROW EXECUTE FUNCTION trigger_cascade_tournament_delete();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Post soft-delete → cascade to comments
CREATE OR REPLACE FUNCTION trigger_cascade_post_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_deleted = true AND OLD.is_deleted = false THEN
    UPDATE platform.comments SET
      is_deleted = true, deleted_at = NOW(), deleted_by = NEW.deleted_by
    WHERE post_id = NEW.id AND is_deleted = false;

    UPDATE platform.reactions SET
      is_deleted = true, deleted_at = NOW()
    WHERE target_id = NEW.id AND is_deleted = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER z02_cascade_soft_delete
    AFTER UPDATE OF is_deleted ON platform.posts
    FOR EACH ROW EXECUTE FUNCTION trigger_cascade_post_delete();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMIT;
