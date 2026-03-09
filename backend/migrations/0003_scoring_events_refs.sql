-- ===============================================================
-- VCT Platform — Migration 0003: Scoring Events & Reference Tables
-- Adds Event Sourcing for match state, judge_scores, reference tables,
-- results/medals, and API views.
-- ===============================================================

BEGIN;

-- ============ REFERENCE TABLES ============

CREATE TABLE IF NOT EXISTS ref_sport_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name_vi VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  description TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS ref_competition_formats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name_vi VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  description TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS ref_penalty_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name_vi VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  category VARCHAR(50) NOT NULL, -- 'combat', 'forms'
  point_deduction DECIMAL(3,1) DEFAULT 0,
  description TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS ref_scoring_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name_vi VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  category VARCHAR(50) NOT NULL, -- 'quyen', 'doi_khang'
  max_score DECIMAL(5,2) NOT NULL,
  weight DECIMAL(3,2) DEFAULT 1.0,
  description TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS ref_belt_ranks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name_vi VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  level INT NOT NULL, -- numeric ordering
  color VARCHAR(50),
  requirements TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS ref_age_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name_vi VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  min_age INT NOT NULL,
  max_age INT NOT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS ref_equipment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name_vi VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  category VARCHAR(50),
  description TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'
);

-- ============ EVENT SOURCING: MATCH EVENTS ============

CREATE TABLE IF NOT EXISTS match_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL,
  match_type VARCHAR(20) NOT NULL CHECK (match_type IN ('combat', 'forms')),
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  sequence_number BIGINT NOT NULL,
  round_number INT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recorded_by UUID REFERENCES users(id),
  device_id VARCHAR(100),
  sync_status VARCHAR(20) DEFAULT 'synced',
  metadata JSONB DEFAULT '{}',

  UNIQUE (match_id, sequence_number)
);

-- ============ JUDGE SCORES (normalized) ============

CREATE TABLE IF NOT EXISTS judge_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  match_id UUID NOT NULL,
  match_type VARCHAR(20) NOT NULL CHECK (match_type IN ('combat', 'forms')),
  referee_id UUID REFERENCES referees(id),
  round_number INT,
  athlete_id UUID REFERENCES athletes(id),
  score DECIMAL(5,2) NOT NULL,
  penalties DECIMAL(5,2) DEFAULT 0,
  criteria_scores JSONB DEFAULT '{}',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_final BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'
);

-- ============ RESULTS & MEDALS ============

CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  content_category_id UUID REFERENCES content_categories(id),
  weight_class_id UUID,
  athlete_id UUID REFERENCES athletes(id),
  team_id UUID REFERENCES teams(id),
  event_type VARCHAR(20) NOT NULL,
  rank INT,
  medal VARCHAR(20) CHECK (medal IN ('gold', 'silver', 'bronze')),
  score DECIMAL(8,2),
  match_id UUID,
  performance_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medals_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  team_id UUID REFERENCES teams(id),
  gold INT DEFAULT 0,
  silver INT DEFAULT 0,
  bronze INT DEFAULT 0,
  total_points DECIMAL(8,2) DEFAULT 0,
  rank INT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ ORGANIZATIONS (Federation, Club) ============

CREATE TABLE IF NOT EXISTS federations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  level VARCHAR(50) NOT NULL, -- 'quoc_gia', 'tinh', 'khu_vuc'
  parent_id UUID REFERENCES federations(id),
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  website TEXT,
  logo_url TEXT,
  president VARCHAR(200),
  established_year INT,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  federation_id UUID REFERENCES federations(id),
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  address TEXT,
  city VARCHAR(100),
  province VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(255),
  website TEXT,
  logo_url TEXT,
  head_coach VARCHAR(200),
  established_year INT,
  member_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ RANKINGS ============

CREATE TABLE IF NOT EXISTS rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES athletes(id),
  category VARCHAR(50) NOT NULL, -- 'doi_khang', 'quyen'
  weight_class VARCHAR(50),
  age_category VARCHAR(50),
  elo_rating DECIMAL(8,2) DEFAULT 1500,
  points DECIMAL(8,2) DEFAULT 0,
  national_rank INT,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  draws INT DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- ============ ADDITIONAL INDEXES ============

CREATE INDEX IF NOT EXISTS idx_match_events_match ON match_events(match_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_match_events_type ON match_events(event_type);
CREATE INDEX IF NOT EXISTS idx_judge_scores_match ON judge_scores(match_id, round_number);
CREATE INDEX IF NOT EXISTS idx_results_tournament ON results(tournament_id);
CREATE INDEX IF NOT EXISTS idx_results_athlete ON results(athlete_id);
CREATE INDEX IF NOT EXISTS idx_medals_summary_tournament ON medals_summary(tournament_id);
CREATE INDEX IF NOT EXISTS idx_rankings_athlete ON rankings(athlete_id);
CREATE INDEX IF NOT EXISTS idx_clubs_federation ON clubs(federation_id);
CREATE INDEX IF NOT EXISTS idx_federations_parent ON federations(parent_id);

-- ============ REFERENCE DATA SEEDS ============

INSERT INTO ref_sport_types (code, name_vi, name_en, sort_order) VALUES
  ('vo_co_truyen', 'Võ Cổ Truyền', 'Traditional Vietnamese Martial Arts', 1),
  ('quyen_thuat', 'Quyền thuật', 'Forms / Kata', 2),
  ('doi_khang', 'Đối kháng', 'Combat / Sparring', 3),
  ('binh_khi', 'Binh khí', 'Weapons', 4),
  ('song_luyen', 'Song luyện', 'Paired Practice', 5),
  ('dong_luyen', 'Đồng luyện', 'Group Practice', 6)
ON CONFLICT (code) DO NOTHING;

INSERT INTO ref_competition_formats (code, name_vi, name_en, sort_order) VALUES
  ('loai_truc_tiep', 'Loại trực tiếp', 'Single Elimination', 1),
  ('vong_tron', 'Vòng tròn', 'Round Robin', 2),
  ('loai_kep', 'Loại kép', 'Double Elimination', 3),
  ('hybrid', 'Vòng bảng + Loại trực tiếp', 'Group Stage + Knockout', 4),
  ('diem_tich_luy', 'Điểm tích lũy', 'Cumulative Score', 5)
ON CONFLICT (code) DO NOTHING;

INSERT INTO ref_penalty_types (code, name_vi, category, point_deduction, sort_order) VALUES
  ('canh_cao', 'Cảnh cáo', 'combat', 0, 1),
  ('tru_diem', 'Trừ điểm', 'combat', 1.0, 2),
  ('pham_loi_nang', 'Phạm lỗi nặng', 'combat', 2.0, 3),
  ('loai', 'Truất quyền thi đấu', 'combat', 0, 4),
  ('sai_dong_tac', 'Sai động tác', 'forms', 0.5, 5),
  ('mat_thang_bang', 'Mất thăng bằng', 'forms', 0.3, 6),
  ('quen_bai', 'Quên bài', 'forms', 1.0, 7)
ON CONFLICT (code) DO NOTHING;

INSERT INTO ref_belt_ranks (code, name_vi, name_en, level, color, sort_order) VALUES
  ('trang', 'Đai trắng', 'White Belt', 1, '#FFFFFF', 1),
  ('vang', 'Đai vàng', 'Yellow Belt', 2, '#FFD700', 2),
  ('xanh_la', 'Đai xanh lá', 'Green Belt', 3, '#228B22', 3),
  ('xanh_duong', 'Đai xanh dương', 'Blue Belt', 4, '#0000FF', 4),
  ('do', 'Đai đỏ', 'Red Belt', 5, '#FF0000', 5),
  ('den', 'Đai đen', 'Black Belt', 6, '#000000', 6)
ON CONFLICT (code) DO NOTHING;

INSERT INTO ref_age_categories (code, name_vi, name_en, min_age, max_age, sort_order) VALUES
  ('thieu_nhi', 'Thiếu nhi', 'Children', 8, 12, 1),
  ('thieu_nien', 'Thiếu niên', 'Juniors', 13, 15, 2),
  ('thanh_nien', 'Thanh niên', 'Youth', 16, 18, 3),
  ('tuyen', 'Tuyển', 'Senior', 19, 35, 4),
  ('cao_tuoi', 'Cao tuổi', 'Veterans', 36, 60, 5)
ON CONFLICT (code) DO NOTHING;

INSERT INTO ref_scoring_criteria (code, name_vi, category, max_score, weight, sort_order) VALUES
  ('ky_thuat', 'Kỹ thuật', 'quyen', 10, 0.4, 1),
  ('luc', 'Lực', 'quyen', 10, 0.2, 2),
  ('toc_do', 'Tốc độ', 'quyen', 10, 0.2, 3),
  ('phong_thai', 'Phong thái', 'quyen', 10, 0.2, 4),
  ('tan_cong', 'Tấn công', 'doi_khang', 5, 0.5, 5),
  ('phong_thu', 'Phòng thủ', 'doi_khang', 5, 0.3, 6),
  ('the_hien', 'Thể hiện', 'doi_khang', 5, 0.2, 7)
ON CONFLICT (code) DO NOTHING;

-- ============ TRIGGERS FOR NEW TABLES ============

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'federations', 'clubs', 'medals_summary'
  ]) LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at()',
      tbl
    );
  END LOOP;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

COMMIT;
