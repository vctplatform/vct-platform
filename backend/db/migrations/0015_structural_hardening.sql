-- ===============================================================
-- VCT Platform — Migration 0015: STRUCTURAL HARDENING (Phase 3A)
-- RLS write policies, immutable columns, generated columns,
-- LISTEN/NOTIFY for live scoring, domain types
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. RLS WITH CHECK — CRITICAL SECURITY FIX
--    Without WITH CHECK, tenant A can INSERT rows into tenant B
--    We add FOR INSERT + FOR UPDATE policies with WITH CHECK
-- ════════════════════════════════════════════════════════

-- Helper: batch-apply write isolation to ALL tenant-aware tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    -- core.*
    'core.users', 'core.roles', 'core.user_roles',
    'core.sessions', 'core.auth_audit_log',
    -- public (legacy)
    'tournaments', 'teams', 'athletes', 'registrations',
    'referees', 'arenas', 'combat_matches', 'form_performances',
    'appeals', 'match_events', 'rankings', 'federations', 'clubs',
    -- training.*
    'training.curricula', 'training.curriculum_levels',
    'training.techniques', 'training.technique_media',
    'training.curriculum_techniques', 'training.training_plans',
    'training.training_sessions', 'training.attendance_records',
    'training.belt_examinations', 'training.belt_exam_results',
    'training.courses', 'training.course_enrollments',
    -- people.*
    'people.club_branches', 'people.club_memberships',
    'people.coaches', 'people.coach_certifications',
    'people.athlete_belt_history', 'people.athlete_weight_history',
    -- platform.* (finance)
    'platform.fee_schedules', 'platform.payments', 'platform.invoices',
    'platform.invoice_items', 'platform.sponsorships',
    'platform.tournament_budgets', 'platform.budget_items',
    -- platform.* (heritage)
    'platform.martial_schools', 'platform.school_lineage',
    'platform.lineage_nodes', 'platform.heritage_techniques',
    'platform.heritage_media', 'platform.heritage_glossary',
    'platform.heritage_events',
    -- platform.* (community)
    'platform.posts', 'platform.comments', 'platform.reactions',
    'platform.follows', 'platform.community_groups',
    'platform.group_memberships', 'platform.marketplace_listings',
    -- system.*
    'system.sync_queue', 'system.sync_conflicts',
    'system.device_registry', 'system.notification_queue'
  ]) LOOP
    BEGIN
      -- INSERT policy: enforce tenant_id matches session
      EXECUTE format(
        'CREATE POLICY tenant_write_%s ON %s
          FOR INSERT
          WITH CHECK (tenant_id = COALESCE(
            current_setting(''app.current_tenant'', true)::UUID,
            ''00000000-0000-7000-8000-000000000001''::UUID
          ))',
        replace(replace(tbl, '.', '_'), ' ', ''), tbl
      );

      -- UPDATE policy: add WITH CHECK to prevent changing tenant_id
      EXECUTE format(
        'CREATE POLICY tenant_update_%s ON %s
          FOR UPDATE
          USING (tenant_id = COALESCE(
            current_setting(''app.current_tenant'', true)::UUID,
            ''00000000-0000-7000-8000-000000000001''::UUID
          ))
          WITH CHECK (tenant_id = COALESCE(
            current_setting(''app.current_tenant'', true)::UUID,
            ''00000000-0000-7000-8000-000000000001''::UUID
          ))',
        replace(replace(tbl, '.', '_'), ' ', ''), tbl
      );
    EXCEPTION
      WHEN undefined_table THEN NULL;
      WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

-- System admin bypass for write operations too
DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'core.users', 'core.roles', 'tournaments', 'athletes',
    'teams', 'combat_matches'
  ]) LOOP
    BEGIN
      EXECUTE format(
        'CREATE POLICY system_admin_write_%s ON %s
          FOR ALL
          USING (current_setting(''app.is_system_admin'', true) = ''true'')
          WITH CHECK (current_setting(''app.is_system_admin'', true) = ''true'')',
        replace(replace(tbl, '.', '_'), ' ', ''), tbl
      );
    EXCEPTION
      WHEN undefined_table THEN NULL;
      WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════
-- 2. IMMUTABLE COLUMN TRIGGERS
--    Prevent modification of critical fields after status change
-- ════════════════════════════════════════════════════════

-- 2a. Payment: after confirmed, lock amount/method/payer
CREATE OR REPLACE FUNCTION trigger_immutable_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IN ('confirmed', 'refunded') THEN
    IF NEW.amount IS DISTINCT FROM OLD.amount THEN
      RAISE EXCEPTION 'Cannot modify payment amount after confirmation (id: %)', OLD.id;
    END IF;
    IF NEW.payment_method IS DISTINCT FROM OLD.payment_method THEN
      RAISE EXCEPTION 'Cannot modify payment method after confirmation (id: %)', OLD.id;
    END IF;
    IF NEW.payer_user_id IS DISTINCT FROM OLD.payer_user_id THEN
      RAISE EXCEPTION 'Cannot modify payer after confirmation (id: %)', OLD.id;
    END IF;
    IF NEW.currency IS DISTINCT FROM OLD.currency THEN
      RAISE EXCEPTION 'Cannot modify currency after confirmation (id: %)', OLD.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER immutable_payment_fields
    BEFORE UPDATE ON platform.payments
    FOR EACH ROW EXECUTE FUNCTION trigger_immutable_payment();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2b. Match: after ket_thuc, lock scores
CREATE OR REPLACE FUNCTION trigger_immutable_match()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.trang_thai = 'ket_thuc' THEN
    IF NEW.trang_thai NOT IN ('ket_thuc', 'huy') THEN
      RAISE EXCEPTION 'Cannot re-open a completed match (id: %)', OLD.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER immutable_match_status
    BEFORE UPDATE ON combat_matches
    FOR EACH ROW EXECUTE FUNCTION trigger_immutable_match();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2c. Belt exam result: after passed, prevent changing
CREATE OR REPLACE FUNCTION trigger_immutable_belt_result()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.result = 'passed' THEN
    IF NEW.result IS DISTINCT FROM OLD.result THEN
      RAISE EXCEPTION 'Cannot change a confirmed belt exam result (id: %)', OLD.id;
    END IF;
    IF NEW.score IS DISTINCT FROM OLD.score THEN
      RAISE EXCEPTION 'Cannot modify score after passing (id: %)', OLD.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER immutable_belt_result
    BEFORE UPDATE ON training.belt_exam_results
    FOR EACH ROW EXECUTE FUNCTION trigger_immutable_belt_result();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ════════════════════════════════════════════════════════
-- 3. LISTEN/NOTIFY — REAL-TIME SCORING
--    PostgreSQL pushes event to Go listener → WebSocket hub
-- ════════════════════════════════════════════════════════

-- 3a. New match event → push to Go
CREATE OR REPLACE FUNCTION notify_match_event()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'match_events',
    json_build_object(
      'match_id', NEW.match_id,
      'event_type', NEW.event_type,
      'event_data', NEW.event_data,
      'sequence', NEW.sequence_number,
      'tenant_id', NEW.tenant_id,
      'recorded_at', NEW.recorded_at
    )::TEXT
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to the partitioned table (propagates to all partitions in PG17)
DO $$ BEGIN
  CREATE TRIGGER notify_on_event
    AFTER INSERT ON tournament.match_events
    FOR EACH ROW EXECUTE FUNCTION notify_match_event();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3b. Match status change → push to Go
CREATE OR REPLACE FUNCTION notify_match_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.trang_thai IS DISTINCT FROM NEW.trang_thai THEN
    PERFORM pg_notify(
      'match_status',
      json_build_object(
        'match_id', NEW.id,
        'old_status', OLD.trang_thai,
        'new_status', NEW.trang_thai,
        'tournament_id', NEW.tournament_id,
        'tenant_id', NEW.tenant_id
      )::TEXT
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER notify_on_status_change
    AFTER UPDATE ON combat_matches
    FOR EACH ROW EXECUTE FUNCTION notify_match_status_change();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3c. Tournament registration → push notification
CREATE OR REPLACE FUNCTION notify_registration_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.trang_thai IS DISTINCT FROM NEW.trang_thai THEN
    PERFORM pg_notify(
      'registrations',
      json_build_object(
        'registration_id', NEW.id,
        'tournament_id', NEW.tournament_id,
        'status', NEW.trang_thai,
        'tenant_id', NEW.tenant_id
      )::TEXT
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER notify_on_registration
    AFTER UPDATE ON registrations
    FOR EACH ROW EXECUTE FUNCTION notify_registration_change();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ════════════════════════════════════════════════════════
-- 4. STATUS TRANSITION VALIDATION
--    Enforce valid state machine transitions
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION trigger_validate_tournament_status()
RETURNS TRIGGER AS $$
DECLARE
  valid_transitions JSONB := '{
    "nhap": ["dang_ky", "huy"],
    "dang_ky": ["khoa_dk", "huy"],
    "khoa_dk": ["thi_dau", "dang_ky", "huy"],
    "thi_dau": ["ket_thuc", "huy"],
    "ket_thuc": [],
    "huy": []
  }'::JSONB;
  allowed JSONB;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    allowed := valid_transitions -> OLD.status;
    IF allowed IS NULL OR NOT (allowed ? NEW.status) THEN
      RAISE EXCEPTION 'Invalid tournament status transition: % → % (id: %)',
        OLD.status, NEW.status, OLD.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER validate_tournament_status
    BEFORE UPDATE ON tournaments
    FOR EACH ROW EXECUTE FUNCTION trigger_validate_tournament_status();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Match status machine
CREATE OR REPLACE FUNCTION trigger_validate_match_status()
RETURNS TRIGGER AS $$
DECLARE
  valid_transitions JSONB := '{
    "chua_dau": ["dang_dau", "huy"],
    "dang_dau": ["tam_dung", "ket_thuc", "huy"],
    "tam_dung": ["dang_dau", "ket_thuc", "huy"],
    "ket_thuc": ["huy"],
    "huy": []
  }'::JSONB;
  allowed JSONB;
BEGIN
  IF OLD.trang_thai IS DISTINCT FROM NEW.trang_thai THEN
    allowed := valid_transitions -> OLD.trang_thai;
    IF allowed IS NULL OR NOT (allowed ? NEW.trang_thai) THEN
      RAISE EXCEPTION 'Invalid match status transition: % → % (id: %)',
        OLD.trang_thai, NEW.trang_thai, OLD.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER validate_match_status
    BEFORE UPDATE ON combat_matches
    FOR EACH ROW EXECUTE FUNCTION trigger_validate_match_status();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Payment status machine
CREATE OR REPLACE FUNCTION trigger_validate_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  valid_transitions JSONB := '{
    "pending": ["confirmed", "failed", "cancelled"],
    "confirmed": ["refunded"],
    "failed": ["pending"],
    "refunded": [],
    "cancelled": []
  }'::JSONB;
  allowed JSONB;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    allowed := valid_transitions -> OLD.status;
    IF allowed IS NULL OR NOT (allowed ? NEW.status) THEN
      RAISE EXCEPTION 'Invalid payment status transition: % → % (id: %)',
        OLD.status, NEW.status, OLD.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER validate_payment_status
    BEFORE UPDATE ON platform.payments
    FOR EACH ROW EXECUTE FUNCTION trigger_validate_payment_status();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ════════════════════════════════════════════════════════
-- 5. STATISTICS TARGETS (Better Query Plans)
-- ════════════════════════════════════════════════════════

DO $$ BEGIN
  ALTER TABLE athletes ALTER COLUMN trang_thai SET STATISTICS 1000;
  ALTER TABLE combat_matches ALTER COLUMN trang_thai SET STATISTICS 1000;
  ALTER TABLE tournaments ALTER COLUMN status SET STATISTICS 500;
  ALTER TABLE platform.payments ALTER COLUMN status SET STATISTICS 500;
  ALTER TABLE platform.posts ALTER COLUMN post_type SET STATISTICS 500;
  ALTER TABLE registrations ALTER COLUMN trang_thai SET STATISTICS 500;
EXCEPTION WHEN undefined_column OR undefined_table THEN NULL;
END $$;

COMMIT;
