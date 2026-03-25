-- ===============================================================
-- VCT Platform — Migration 0013 DOWN
-- ===============================================================
BEGIN;

-- Drop follow counters
DROP TRIGGER IF EXISTS update_follow_counts ON platform.follows;
DROP FUNCTION IF EXISTS trigger_update_follow_counts() CASCADE;
ALTER TABLE clubs DROP COLUMN IF EXISTS follower_count;
ALTER TABLE platform.martial_schools DROP COLUMN IF EXISTS follower_count;

-- Drop idempotency
DROP INDEX IF EXISTS platform.idx_payments_idempotency;
ALTER TABLE platform.payments DROP COLUMN IF EXISTS idempotency_key;

-- Drop counter triggers
DROP TRIGGER IF EXISTS update_group_members_count ON platform.group_memberships;
DROP TRIGGER IF EXISTS update_comments_count ON platform.comments;
DROP TRIGGER IF EXISTS update_reactions_count ON platform.reactions;
DROP FUNCTION IF EXISTS trigger_update_group_members() CASCADE;
DROP FUNCTION IF EXISTS trigger_update_post_comments() CASCADE;
DROP FUNCTION IF EXISTS trigger_update_post_reactions() CASCADE;

-- Restore original tournaments view (with correlated subqueries as fallback)
CREATE OR REPLACE VIEW api_v1.tournaments AS
SELECT
  t.id, t.tenant_id, t.ten AS name,
  t.ngay_bat_dau AS start_date,
  t.ngay_ket_thuc AS end_date,
  t.dia_diem AS location,
  t.status,
  t.federation_id,
  f.ten AS federation_name,
  t.is_deleted,
  t.created_at, t.updated_at, t.metadata,
  (SELECT COUNT(*) FROM athletes a WHERE a.tournament_id = t.id AND a.is_deleted = false) AS athlete_count,
  (SELECT COUNT(*) FROM teams tm WHERE tm.tournament_id = t.id AND tm.is_deleted = false) AS team_count,
  (SELECT COUNT(*) FROM combat_matches m WHERE m.tournament_id = t.id AND m.is_deleted = false) AS match_count
FROM tournaments t
LEFT JOIN federations f ON t.federation_id = f.id
WHERE t.is_deleted = false;

-- Drop materialized views
DROP MATERIALIZED VIEW IF EXISTS api_v1.rankings_leaderboard CASCADE;
DROP MATERIALIZED VIEW IF EXISTS api_v1.tournament_dashboard CASCADE;

COMMIT;
