-- ===============================================================
-- VCT Platform — Migration 0024 DOWN
-- ===============================================================
BEGIN;

-- Drop soft-delete cascades
DROP TRIGGER IF EXISTS z02_cascade_soft_delete ON platform.posts;
DROP TRIGGER IF EXISTS z02_cascade_soft_delete ON tournaments;
DROP FUNCTION IF EXISTS trigger_cascade_post_delete() CASCADE;
DROP FUNCTION IF EXISTS trigger_cascade_tournament_delete() CASCADE;
DROP FUNCTION IF EXISTS trigger_cascade_soft_delete() CASCADE;

-- Restore original trigger names on combat_matches (approximate, won't be perfect)
DO $$ BEGIN
  DROP TRIGGER IF EXISTS a01_validate_match_status ON combat_matches;
  DROP TRIGGER IF EXISTS a02_immutable_match_status ON combat_matches;
  DROP TRIGGER IF EXISTS a03_prevent_tenant_change ON combat_matches;
  DROP TRIGGER IF EXISTS a04_optimistic_lock ON combat_matches;
  DROP TRIGGER IF EXISTS a05_set_updated_at ON combat_matches;
  DROP TRIGGER IF EXISTS z01_notify_on_status_change ON combat_matches;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS a01_validate_tournament_status ON tournaments;
  DROP TRIGGER IF EXISTS a02_prevent_tenant_change ON tournaments;
  DROP TRIGGER IF EXISTS a03_optimistic_lock ON tournaments;
  DROP TRIGGER IF EXISTS a04_set_updated_at ON tournaments;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS a01_validate_payment_status ON platform.payments;
  DROP TRIGGER IF EXISTS a02_immutable_payment_fields ON platform.payments;
  DROP TRIGGER IF EXISTS a03_prevent_tenant_change ON platform.payments;
  DROP TRIGGER IF EXISTS a04_optimistic_lock ON platform.payments;
  DROP TRIGGER IF EXISTS a05_set_updated_at ON platform.payments;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Drop covering indexes
DROP INDEX IF EXISTS idx_events_covering;
DROP INDEX IF EXISTS idx_posts_covering;
DROP INDEX IF EXISTS idx_payments_covering;
DROP INDEX IF EXISTS idx_matches_covering;
DROP INDEX IF EXISTS idx_athletes_covering;
DROP INDEX IF EXISTS idx_tournaments_covering;

-- Drop optimistic lock trigger function
DO $$ DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'tournaments', 'combat_matches', 'athletes', 'teams',
    'registrations', 'platform.payments', 'core.users'
  ]) LOOP
    BEGIN
      EXECUTE format('DROP TRIGGER IF EXISTS optimistic_lock ON %s', tbl);
    EXCEPTION WHEN undefined_table THEN NULL;
    END;
  END LOOP;
END $$;
DROP FUNCTION IF EXISTS trigger_optimistic_lock() CASCADE;

-- Drop legacy bridge view
DROP VIEW IF EXISTS api_v1.users_legacy;

COMMIT;
