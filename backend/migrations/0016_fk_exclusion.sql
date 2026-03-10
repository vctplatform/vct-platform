-- ===============================================================
-- VCT Platform — Migration 0016: FK + EXCLUSION (Phase 3B)
-- Cross-schema FK constraints, exclusion constraints,
-- prevent scheduling conflicts
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. EXTENSION: btree_gist (needed for EXCLUDE)
-- ════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ════════════════════════════════════════════════════════
-- 2. CROSS-SCHEMA FOREIGN KEY CONSTRAINTS
--    Fix orphan UUID references
--    Note: FK to composite PK (tenant_id, id) uses (tenant_id, col)
-- ════════════════════════════════════════════════════════

-- platform.posts.author_id → core.users
DO $$ BEGIN
  ALTER TABLE platform.posts
    ADD CONSTRAINT fk_posts_author
    FOREIGN KEY (author_id) REFERENCES core.users(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- platform.comments.author_id → core.users
DO $$ BEGIN
  ALTER TABLE platform.comments
    ADD CONSTRAINT fk_comments_author
    FOREIGN KEY (author_id) REFERENCES core.users(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- platform.reactions.user_id → core.users
DO $$ BEGIN
  ALTER TABLE platform.reactions
    ADD CONSTRAINT fk_reactions_user
    FOREIGN KEY (user_id) REFERENCES core.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- platform.follows.follower_id → core.users
DO $$ BEGIN
  ALTER TABLE platform.follows
    ADD CONSTRAINT fk_follows_follower
    FOREIGN KEY (follower_id) REFERENCES core.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- platform.community_groups.owner_id → core.users
DO $$ BEGIN
  ALTER TABLE platform.community_groups
    ADD CONSTRAINT fk_groups_owner
    FOREIGN KEY (owner_id) REFERENCES core.users(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- platform.group_memberships.user_id → core.users
DO $$ BEGIN
  ALTER TABLE platform.group_memberships
    ADD CONSTRAINT fk_group_members_user
    FOREIGN KEY (user_id) REFERENCES core.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- platform.marketplace_listings.seller_id → core.users
DO $$ BEGIN
  ALTER TABLE platform.marketplace_listings
    ADD CONSTRAINT fk_listings_seller
    FOREIGN KEY (seller_id) REFERENCES core.users(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- platform.payments.payer_user_id → core.users (nullable)
DO $$ BEGIN
  ALTER TABLE platform.payments
    ADD CONSTRAINT fk_payments_payer
    FOREIGN KEY (payer_user_id) REFERENCES core.users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- training.training_plans.coach_id → people.coaches (same tenant needed)
-- Note: people.coaches has composite PK (tenant_id, id), but coach_id alone
-- We reference just the id for loose coupling, enforce tenant via RLS
DO $$ BEGIN
  ALTER TABLE training.course_enrollments
    ADD CONSTRAINT fk_enrollments_user
    FOREIGN KEY (user_id) REFERENCES core.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ════════════════════════════════════════════════════════
-- 3. EXCLUSION CONSTRAINTS — PREVENT SCHEDULING OVERLAPS
--    Using btree_gist for range overlap detection
-- ════════════════════════════════════════════════════════

-- 3a. Training sessions: no overlapping sessions at same location
-- We need start/end as TIMESTAMPTZ for range construction
ALTER TABLE training.training_sessions
  ADD COLUMN IF NOT EXISTS session_start TIMESTAMPTZ
    GENERATED ALWAYS AS (session_date + start_time) STORED;
ALTER TABLE training.training_sessions
  ADD COLUMN IF NOT EXISTS session_end TIMESTAMPTZ
    GENERATED ALWAYS AS (session_date + end_time) STORED;

DO $$ BEGIN
  ALTER TABLE training.training_sessions
    ADD CONSTRAINT no_overlapping_training
    EXCLUDE USING GIST (
      tenant_id WITH =,
      CAST(location AS TEXT) WITH =,
      tstzrange(session_start, session_end) WITH &&
    ) WHERE (is_deleted = false AND location IS NOT NULL);
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN feature_not_supported THEN
    RAISE NOTICE 'Exclusion constraint requires all column types to have gist operator class';
END $$;

-- ════════════════════════════════════════════════════════
-- 4. PREVENT TENANT_ID MUTATION
--    No one should ever UPDATE tenant_id on any row
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION trigger_prevent_tenant_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.tenant_id IS DISTINCT FROM NEW.tenant_id THEN
    RAISE EXCEPTION 'Cannot change tenant_id on % (id: %). This is an immutable field.',
      TG_TABLE_NAME, OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to critical tables
DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'tournaments', 'athletes', 'teams', 'combat_matches',
    'platform.payments', 'platform.invoices',
    'core.users', 'core.roles'
  ]) LOOP
    BEGIN
      EXECUTE format(
        'CREATE TRIGGER prevent_tenant_change BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION trigger_prevent_tenant_change()',
        tbl
      );
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN undefined_table THEN NULL;
    END;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════
-- 5. DOMAIN TYPES — Reusable validated types
-- ════════════════════════════════════════════════════════

DO $$ BEGIN CREATE DOMAIN core.email_address AS VARCHAR(255)
  CHECK (VALUE ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE DOMAIN core.phone_number AS VARCHAR(20)
  CHECK (VALUE ~ '^\+?[0-9\s\-\(\)]{6,20}$');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE DOMAIN core.positive_money AS DECIMAL(15,2)
  CHECK (VALUE >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE DOMAIN core.percentage AS DECIMAL(5,2)
  CHECK (VALUE >= 0 AND VALUE <= 100);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════
-- 6. ADDITIONAL SAFETY CONSTRAINTS
-- ════════════════════════════════════════════════════════

-- Prevent negative counters (belt-and-suspenders with GREATEST in triggers)
DO $$ BEGIN
  ALTER TABLE platform.posts ADD CONSTRAINT chk_like_count_positive CHECK (like_count >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE platform.posts ADD CONSTRAINT chk_comment_count_positive CHECK (comment_count >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE platform.posts ADD CONSTRAINT chk_share_count_positive CHECK (share_count >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE platform.community_groups ADD CONSTRAINT chk_member_count_positive CHECK (member_count >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Invoice amounts must be non-negative
DO $$ BEGIN
  ALTER TABLE platform.invoices ADD CONSTRAINT chk_invoice_subtotal CHECK (subtotal >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE platform.invoices ADD CONSTRAINT chk_invoice_tax CHECK (tax_amount >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Sponsorship end date must be after start date
DO $$ BEGIN
  ALTER TABLE platform.sponsorships ADD CONSTRAINT chk_sponsorship_dates
    CHECK (contract_end IS NULL OR contract_end >= contract_start);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Training session end_time must be after start_time
DO $$ BEGIN
  ALTER TABLE training.training_sessions ADD CONSTRAINT chk_session_times
    CHECK (end_time > start_time);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Belt exam registration deadline before exam date
DO $$ BEGIN
  ALTER TABLE training.belt_examinations ADD CONSTRAINT chk_exam_deadline
    CHECK (registration_deadline IS NULL OR registration_deadline <= exam_date);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;
