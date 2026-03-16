-- ===============================================================
-- VCT Platform — Migration 0053: COMPOSITE & COVERING INDEXES
-- P1 High: Optimize query performance for common access patterns
-- Wrapped in exception handlers for schema resilience
-- ===============================================================

BEGIN;

-- Helper: create index safely (skip if column/table missing)
DO $$
DECLARE
  v_indexes TEXT[] := ARRAY[
    -- Athletes
    'CREATE INDEX IF NOT EXISTS idx_athletes_tournament_status ON athletes(tournament_id, trang_thai) WHERE is_deleted = false',
    'CREATE INDEX IF NOT EXISTS idx_athletes_club ON athletes(current_club_id, trang_thai) WHERE is_deleted = false AND current_club_id IS NOT NULL',
    'CREATE INDEX IF NOT EXISTS idx_athletes_belt_rank ON athletes(belt_rank_id) WHERE is_deleted = false AND belt_rank_id IS NOT NULL',
    -- Combat Matches
    'CREATE INDEX IF NOT EXISTS idx_matches_tournament_round ON combat_matches(tournament_id, vong, trang_thai) WHERE is_deleted = false',
    'CREATE INDEX IF NOT EXISTS idx_matches_arena_active ON combat_matches(arena_id, trang_thai) WHERE is_deleted = false AND trang_thai IN (''chua_dau'', ''dang_dau'', ''tam_dung'')',
    'CREATE INDEX IF NOT EXISTS idx_matches_category ON combat_matches(content_category_id, tournament_id) WHERE is_deleted = false',
    -- Tournaments
    'CREATE INDEX IF NOT EXISTS idx_tournaments_covering ON tournaments(tenant_id, status, start_date DESC) INCLUDE (name, end_date, location) WHERE is_deleted = false',
    'CREATE INDEX IF NOT EXISTS idx_tournaments_upcoming ON tournaments(start_date) WHERE is_deleted = false AND status IN (''nhap'', ''dang_ky'', ''khoa_dk'')',
    -- Payments
    'CREATE INDEX IF NOT EXISTS idx_payments_confirmed_date ON platform.payments(tenant_id, created_at DESC) WHERE status = ''confirmed''',
    'CREATE INDEX IF NOT EXISTS idx_payments_pending ON platform.payments(tenant_id, fee_schedule_id) WHERE status = ''pending''',
    'CREATE INDEX IF NOT EXISTS idx_invoices_status_date ON platform.invoices(tenant_id, status, due_date) WHERE is_deleted = false',
    -- Registrations
    'CREATE INDEX IF NOT EXISTS idx_new_reg_pending ON tournament_registrations(tournament_id, status) WHERE status IN (''nhap'', ''cho_duyet'')',
    'CREATE INDEX IF NOT EXISTS idx_new_reg_province ON tournament_registrations(province) WHERE status = ''da_duyet''',
    -- Community
    'CREATE INDEX IF NOT EXISTS idx_posts_feed ON platform.posts(tenant_id, created_at DESC) WHERE is_deleted = false AND visibility = ''public''',
    'CREATE INDEX IF NOT EXISTS idx_posts_author ON platform.posts(author_id, created_at DESC) WHERE is_deleted = false',
    'CREATE INDEX IF NOT EXISTS idx_comments_post ON platform.comments(post_id, created_at) WHERE is_deleted = false',
    -- Training
    'CREATE INDEX IF NOT EXISTS idx_training_sess_athlete_date ON training_sessions(athlete_id, date)',
    'CREATE INDEX IF NOT EXISTS idx_belt_exams_tenant_date ON training.belt_examinations(tenant_id, exam_date DESC) WHERE is_deleted = false',
    -- People
    'CREATE INDEX IF NOT EXISTS idx_coaches_club_status ON people.coaches(club_id, status) WHERE is_deleted = false',
    'CREATE INDEX IF NOT EXISTS idx_memberships_active ON people.club_memberships(club_id, status) WHERE status = ''active'' AND is_deleted = false',
    -- BTC
    'CREATE INDEX IF NOT EXISTS idx_btc_weigh_result ON btc_weigh_ins(giai_id, ket_qua)',
    'CREATE INDEX IF NOT EXISTS idx_btc_protests_pending ON btc_protests(giai_id, trang_thai) WHERE trang_thai IN (''moi'', ''dang_xu_ly'')',
    'CREATE INDEX IF NOT EXISTS idx_schedule_active ON tournament_schedule_slots(tournament_id, date, session) WHERE status != ''hoan''',
    -- Heritage
    'CREATE INDEX IF NOT EXISTS idx_heritage_tech_school ON platform.heritage_techniques(school_id, category) WHERE is_deleted = false',
    'CREATE INDEX IF NOT EXISTS idx_glossary_alpha ON platform.heritage_glossary(term_vi) WHERE is_deleted = false'
  ];
  v_sql TEXT;
  v_count INT := 0;
  v_skip INT := 0;
BEGIN
  FOREACH v_sql IN ARRAY v_indexes LOOP
    BEGIN
      EXECUTE v_sql;
      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipped index: % — %', v_sql, SQLERRM;
      v_skip := v_skip + 1;
    END;
  END LOOP;
  RAISE NOTICE 'Indexes: % created, % skipped', v_count, v_skip;
END $$;

COMMIT;
