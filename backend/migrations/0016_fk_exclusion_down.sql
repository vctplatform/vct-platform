-- ===============================================================
-- VCT Platform — Migration 0016 DOWN
-- ===============================================================
BEGIN;

-- Drop safety constraints
DO $$ BEGIN ALTER TABLE training.belt_examinations DROP CONSTRAINT IF EXISTS chk_exam_deadline; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE training.training_sessions DROP CONSTRAINT IF EXISTS chk_session_times; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE platform.sponsorships DROP CONSTRAINT IF EXISTS chk_sponsorship_dates; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE platform.invoices DROP CONSTRAINT IF EXISTS chk_invoice_tax; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE platform.invoices DROP CONSTRAINT IF EXISTS chk_invoice_subtotal; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE platform.community_groups DROP CONSTRAINT IF EXISTS chk_member_count_positive; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE platform.posts DROP CONSTRAINT IF EXISTS chk_share_count_positive; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE platform.posts DROP CONSTRAINT IF EXISTS chk_comment_count_positive; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE platform.posts DROP CONSTRAINT IF EXISTS chk_like_count_positive; EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- Drop domain types
DROP DOMAIN IF EXISTS core.percentage CASCADE;
DROP DOMAIN IF EXISTS core.positive_money CASCADE;
DROP DOMAIN IF EXISTS core.phone_number CASCADE;
DROP DOMAIN IF EXISTS core.email_address CASCADE;

-- Drop tenant immutability
DO $$ DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'tournaments', 'athletes', 'teams', 'combat_matches',
    'platform.payments', 'platform.invoices', 'core.users', 'core.roles'
  ]) LOOP
    BEGIN
      EXECUTE format('DROP TRIGGER IF EXISTS prevent_tenant_change ON %s', tbl);
    EXCEPTION WHEN undefined_table THEN NULL;
    END;
  END LOOP;
END $$;
DROP FUNCTION IF EXISTS trigger_prevent_tenant_change() CASCADE;

-- Drop exclusion
DO $$ BEGIN
  ALTER TABLE training.training_sessions DROP CONSTRAINT IF EXISTS no_overlapping_training;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- Drop generated columns
DO $$ BEGIN
  ALTER TABLE training.training_sessions DROP COLUMN IF EXISTS session_end;
  ALTER TABLE training.training_sessions DROP COLUMN IF EXISTS session_start;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- Drop FK constraints
DO $$ BEGIN ALTER TABLE training.course_enrollments DROP CONSTRAINT IF EXISTS fk_enrollments_user; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE platform.payments DROP CONSTRAINT IF EXISTS fk_payments_payer; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE platform.marketplace_listings DROP CONSTRAINT IF EXISTS fk_listings_seller; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE platform.group_memberships DROP CONSTRAINT IF EXISTS fk_group_members_user; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE platform.community_groups DROP CONSTRAINT IF EXISTS fk_groups_owner; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE platform.follows DROP CONSTRAINT IF EXISTS fk_follows_follower; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE platform.reactions DROP CONSTRAINT IF EXISTS fk_reactions_user; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE platform.comments DROP CONSTRAINT IF EXISTS fk_comments_author; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE platform.posts DROP CONSTRAINT IF EXISTS fk_posts_author; EXCEPTION WHEN undefined_table THEN NULL; END $$;

DROP EXTENSION IF EXISTS btree_gist CASCADE;

COMMIT;
