-- ===============================================================
-- VCT Platform — Migration 0013: MATERIALIZED + COUNTERS (Phase 2B)
-- Materialized views, counter triggers, idempotency keys
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. MATERIALIZED VIEW: TOURNAMENT DASHBOARD
--    Replaces correlated subqueries with pre-computed aggregates
--    REFRESH CONCURRENTLY every 30s or on-demand
-- ════════════════════════════════════════════════════════

CREATE MATERIALIZED VIEW IF NOT EXISTS api_v1.tournament_dashboard AS
SELECT
  t.id,
  t.tenant_id,
  t.name,
  t.status,
  t.start_date,
  t.end_date,
  t.location,
  COUNT(DISTINCT a.id)
    FILTER (WHERE a.is_deleted = false) AS athlete_count,
  COUNT(DISTINCT tm.id)
    FILTER (WHERE tm.is_deleted = false) AS team_count,
  COUNT(DISTINCT m.id)
    FILTER (WHERE m.is_deleted = false) AS match_count,
  COUNT(DISTINCT m.id)
    FILTER (WHERE m.trang_thai = 'ket_thuc' AND m.is_deleted = false) AS completed_matches,
  COUNT(DISTINCT m.id)
    FILTER (WHERE m.trang_thai = 'dang_dau' AND m.is_deleted = false) AS live_matches,
  t.created_at,
  t.updated_at
FROM tournaments t
LEFT JOIN athletes a ON a.tournament_id = t.id
LEFT JOIN teams tm ON tm.tournament_id = t.id
LEFT JOIN combat_matches m ON m.tournament_id = t.id
WHERE t.is_deleted = false
GROUP BY t.id, t.tenant_id, t.name, t.status,
         t.start_date, t.end_date, t.location,
         t.created_at, t.updated_at
WITH NO DATA;

-- Unique index required for REFRESH CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS idx_tournament_dashboard_pk
  ON api_v1.tournament_dashboard(id);

CREATE INDEX IF NOT EXISTS idx_tournament_dashboard_tenant
  ON api_v1.tournament_dashboard(tenant_id);

CREATE INDEX IF NOT EXISTS idx_tournament_dashboard_status
  ON api_v1.tournament_dashboard(tenant_id, status);

-- Initial refresh
REFRESH MATERIALIZED VIEW api_v1.tournament_dashboard;

-- ════════════════════════════════════════════════════════
-- 2. MATERIALIZED VIEW: RANKINGS LEADERBOARD
-- ════════════════════════════════════════════════════════

CREATE MATERIALIZED VIEW IF NOT EXISTS api_v1.rankings_leaderboard AS
SELECT
  r.id,
  r.tenant_id,
  r.category,
  r.weight_class,
  r.national_rank AS rank,
  r.points,
  r.athlete_id,
  a.ho_ten AS athlete_name,
  a.gioi_tinh AS gender,
  a.current_club_id,
  r.metadata,
  r.last_updated AS updated_at
FROM rankings r
JOIN athletes a ON r.athlete_id = a.id AND a.is_deleted = false
WHERE r.is_deleted = false
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_rankings_lb_pk
  ON api_v1.rankings_leaderboard(id);

CREATE INDEX IF NOT EXISTS idx_rankings_lb_tenant_cat
  ON api_v1.rankings_leaderboard(tenant_id, category, weight_class);

REFRESH MATERIALIZED VIEW api_v1.rankings_leaderboard;

-- ════════════════════════════════════════════════════════
-- 3. REPLACE api_v1.tournaments VIEW
--    Use matviews instead of correlated subqueries
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW api_v1.tournaments AS
SELECT
  t.id, t.tenant_id, t.name,
  t.start_date,
  t.end_date,
  t.location,
  t.status,
  t.is_deleted,
  t.created_at,
  t.updated_at,
  t.metadata,
  COALESCE(d.athlete_count, 0) AS athlete_count,
  COALESCE(d.team_count, 0) AS team_count,
  COALESCE(d.match_count, 0) AS match_count,
  COALESCE(d.completed_matches, 0) AS completed_matches,
  COALESCE(d.live_matches, 0) AS live_matches
FROM tournaments t
LEFT JOIN api_v1.tournament_dashboard d ON d.id = t.id
WHERE t.is_deleted = false;

-- ════════════════════════════════════════════════════════
-- 4. COUNTER TRIGGERS — COMMUNITY
--    Atomic counter update on reaction/comment INSERT/DELETE
--    Uses GREATEST(0) to prevent negative counters
-- ════════════════════════════════════════════════════════

-- 4a. Reaction counter → posts.like_count
CREATE OR REPLACE FUNCTION trigger_update_post_reactions()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.target_type = 'post' THEN
      UPDATE platform.posts
        SET like_count = like_count + 1
        WHERE id = NEW.target_id AND tenant_id = NEW.tenant_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.target_type = 'post' THEN
      UPDATE platform.posts
        SET like_count = GREATEST(like_count - 1, 0)
        WHERE id = OLD.target_id AND tenant_id = OLD.tenant_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER update_reactions_count
    AFTER INSERT OR DELETE ON platform.reactions
    FOR EACH ROW EXECUTE FUNCTION trigger_update_post_reactions();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4b. Comment counter → posts.comment_count
CREATE OR REPLACE FUNCTION trigger_update_post_comments()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE platform.posts
      SET comment_count = comment_count + 1
      WHERE id = NEW.post_id AND tenant_id = NEW.tenant_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE platform.posts
      SET comment_count = GREATEST(comment_count - 1, 0)
      WHERE id = OLD.post_id AND tenant_id = OLD.tenant_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER update_comments_count
    AFTER INSERT OR DELETE ON platform.comments
    FOR EACH ROW EXECUTE FUNCTION trigger_update_post_comments();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4c. Group member counter → community_groups.member_count
CREATE OR REPLACE FUNCTION trigger_update_group_members()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE platform.community_groups
      SET member_count = member_count + 1
      WHERE id = NEW.group_id AND tenant_id = NEW.tenant_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
    UPDATE platform.community_groups
      SET member_count = GREATEST(member_count - 1, 0)
      WHERE id = OLD.group_id AND tenant_id = OLD.tenant_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle status change
    IF OLD.status = 'active' AND NEW.status != 'active' THEN
      UPDATE platform.community_groups
        SET member_count = GREATEST(member_count - 1, 0)
        WHERE id = NEW.group_id AND tenant_id = NEW.tenant_id;
    ELSIF OLD.status != 'active' AND NEW.status = 'active' THEN
      UPDATE platform.community_groups
        SET member_count = member_count + 1
        WHERE id = NEW.group_id AND tenant_id = NEW.tenant_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER update_group_members_count
    AFTER INSERT OR UPDATE OR DELETE ON platform.group_memberships
    FOR EACH ROW EXECUTE FUNCTION trigger_update_group_members();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ════════════════════════════════════════════════════════
-- 5. IDEMPOTENCY KEY — PAYMENTS
--    Prevents duplicate payments on retry
-- ════════════════════════════════════════════════════════

ALTER TABLE platform.payments
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_idempotency
  ON platform.payments(tenant_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- ════════════════════════════════════════════════════════
-- 6. FOLLOW COUNTER TRIGGERS
--    follower_count, following_count don't exist on user table
--    but we pre-compute for clubs and athletes
-- ════════════════════════════════════════════════════════

-- Add follower_count to key entities
ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS follower_count INT DEFAULT 0;

ALTER TABLE platform.martial_schools
  ADD COLUMN IF NOT EXISTS follower_count INT DEFAULT 0;

CREATE OR REPLACE FUNCTION trigger_update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.following_type = 'club' THEN
      UPDATE clubs SET follower_count = follower_count + 1
        WHERE id = NEW.following_id;
    ELSIF NEW.following_type = 'school' THEN
      UPDATE platform.martial_schools SET follower_count = follower_count + 1
        WHERE id = NEW.following_id AND tenant_id = NEW.tenant_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.following_type = 'club' THEN
      UPDATE clubs SET follower_count = GREATEST(follower_count - 1, 0)
        WHERE id = OLD.following_id;
    ELSIF OLD.following_type = 'school' THEN
      UPDATE platform.martial_schools SET follower_count = GREATEST(follower_count - 1, 0)
        WHERE id = OLD.following_id AND tenant_id = OLD.tenant_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER update_follow_counts
    AFTER INSERT OR DELETE ON platform.follows
    FOR EACH ROW EXECUTE FUNCTION trigger_update_follow_counts();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMIT;
