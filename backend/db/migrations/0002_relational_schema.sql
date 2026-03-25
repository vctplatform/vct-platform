-- ===============================================================
-- VCT Platform — Migration 0002: Relational Schema
-- Replaces JSONB EAV (entity_records) with typed tables.
-- Run AFTER 0001_entity_records.sql
-- ===============================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============ AUTH ============

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin','btc','referee_manager','referee','delegate','athlete','spectator','medical','media')),
  full_name VARCHAR(200) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  access_token_jti VARCHAR(100) UNIQUE NOT NULL,
  refresh_token_jti VARCHAR(100) UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  tournament_code VARCHAR(50),
  operation_shift VARCHAR(10),
  expires_at TIMESTAMPTZ NOT NULL,
  refresh_expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  username VARCHAR(50),
  role VARCHAR(20),
  action VARCHAR(50) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ TOURNAMENT ============

CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  level VARCHAR(20) NOT NULL,
  round_number INT DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  registration_deadline DATE,
  location TEXT,
  venue TEXT,
  organizer TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'nhap',
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ CONTENT & CATEGORIES ============

CREATE TABLE IF NOT EXISTS age_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  ten VARCHAR(100) NOT NULL,
  tuoi_min INT NOT NULL,
  tuoi_max INT NOT NULL
);

CREATE TABLE IF NOT EXISTS content_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  ten VARCHAR(200) NOT NULL,
  loai VARCHAR(20) NOT NULL CHECK (loai IN ('quyen','doi_khang')),
  gioi_tinh VARCHAR(10) CHECK (gioi_tinh IN ('nam','nu','chung')),
  lua_tuoi_id UUID REFERENCES age_groups(id),
  so_nguoi INT DEFAULT 1,
  mo_ta TEXT,
  trang_thai VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weight_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  ten VARCHAR(100) NOT NULL,
  gioi_tinh VARCHAR(5) NOT NULL CHECK (gioi_tinh IN ('nam','nu')),
  lua_tuoi_id UUID REFERENCES age_groups(id),
  can_nang_min DECIMAL(5,1) NOT NULL,
  can_nang_max DECIMAL(5,1) NOT NULL,
  trang_thai VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ TEAMS & ATHLETES ============

CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  ten VARCHAR(200) NOT NULL,
  ma_doan VARCHAR(20) NOT NULL,
  loai VARCHAR(20) CHECK (loai IN ('tinh','clb','ca_nhan')),
  tinh_thanh VARCHAR(100),
  lien_he VARCHAR(100),
  sdt VARCHAR(20),
  email VARCHAR(255),
  trang_thai VARCHAR(20) NOT NULL DEFAULT 'nhap',
  docs JSONB DEFAULT '{}',
  fees JSONB DEFAULT '{"total":0,"paid":0,"remaining":0}',
  achievements JSONB DEFAULT '[]',
  delegate_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  ho_ten VARCHAR(200) NOT NULL,
  gioi_tinh VARCHAR(5) NOT NULL CHECK (gioi_tinh IN ('nam','nu')),
  ngay_sinh DATE NOT NULL,
  can_nang DECIMAL(5,1) NOT NULL,
  chieu_cao DECIMAL(5,1),
  trang_thai VARCHAR(20) NOT NULL DEFAULT 'nhap',
  docs JSONB DEFAULT '{}',
  ghi_chu TEXT,
  avatar_url TEXT,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  content_category_id UUID REFERENCES content_categories(id),
  weight_class_id UUID,
  trang_thai VARCHAR(20) NOT NULL DEFAULT 'cho_duyet',
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ REFEREES ============

CREATE TABLE IF NOT EXISTS referees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  ho_ten VARCHAR(200) NOT NULL,
  cap_bac VARCHAR(20) NOT NULL,
  chuyen_mon VARCHAR(20) NOT NULL,
  tinh_thanh VARCHAR(100),
  dien_thoai VARCHAR(20),
  email VARCHAR(255),
  nam_kinh_nghiem INT,
  trang_thai VARCHAR(20) NOT NULL DEFAULT 'cho_duyet',
  ghi_chu TEXT,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ ARENAS ============

CREATE TABLE IF NOT EXISTS arenas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  ten VARCHAR(200) NOT NULL,
  loai VARCHAR(20) NOT NULL,
  trang_thai VARCHAR(20) NOT NULL DEFAULT 'dong',
  suc_chua INT DEFAULT 0,
  vi_tri TEXT,
  ghi_chu TEXT,
  equipment JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referee_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  referee_id UUID REFERENCES referees(id),
  arena_id UUID REFERENCES arenas(id),
  session_date DATE NOT NULL,
  session_shift VARCHAR(10) NOT NULL,
  role VARCHAR(20) DEFAULT 'chinh',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ COMPETITION ============

CREATE TABLE IF NOT EXISTS combat_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  content_category_id UUID REFERENCES content_categories(id),
  weight_class_id UUID,
  arena_id UUID REFERENCES arenas(id),
  athlete_red_id UUID REFERENCES athletes(id),
  athlete_blue_id UUID REFERENCES athletes(id),
  vong VARCHAR(50),
  bracket_position INT,
  diem_do JSONB DEFAULT '[]',
  diem_xanh JSONB DEFAULT '[]',
  penalties_red JSONB DEFAULT '[]',
  penalties_blue JSONB DEFAULT '[]',
  ket_qua TEXT,
  nguoi_thang_id UUID REFERENCES athletes(id),
  trang_thai VARCHAR(20) NOT NULL DEFAULT 'chua_dau',
  thoi_gian_bat_dau TIMESTAMPTZ,
  thoi_gian_ket_thuc TIMESTAMPTZ,
  event_log JSONB DEFAULT '[]',
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS form_performances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  content_category_id UUID REFERENCES content_categories(id),
  arena_id UUID REFERENCES arenas(id),
  athlete_id UUID REFERENCES athletes(id),
  judge_scores JSONB NOT NULL DEFAULT '[]',
  diem_trung_binh DECIMAL(5,2),
  diem_tru_high DECIMAL(5,2),
  diem_tru_low DECIMAL(5,2),
  tong_diem DECIMAL(5,2),
  xep_hang INT,
  trang_thai VARCHAR(20) NOT NULL DEFAULT 'cho_thi',
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weigh_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  athlete_id UUID REFERENCES athletes(id),
  weight_class_id UUID,
  can_nang_thuc DECIMAL(5,1) NOT NULL,
  ket_qua VARCHAR(20) NOT NULL DEFAULT 'cho_xu_ly',
  thoi_gian TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  nguoi_can VARCHAR(100),
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ SCHEDULE ============

CREATE TABLE IF NOT EXISTS schedule_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  ngay DATE NOT NULL,
  buoi VARCHAR(10) NOT NULL CHECK (buoi IN ('sang','chieu','toi')),
  gio_bat_dau TIME NOT NULL,
  gio_ket_thuc TIME NOT NULL,
  arena_id UUID REFERENCES arenas(id),
  content_category_id UUID REFERENCES content_categories(id),
  so_tran INT DEFAULT 0,
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ APPEALS ============

CREATE TABLE IF NOT EXISTS appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  loai VARCHAR(20) NOT NULL CHECK (loai IN ('khieu_nai','khang_nghi')),
  team_id UUID REFERENCES teams(id),
  noi_dung TEXT NOT NULL,
  match_id UUID,
  performance_id UUID,
  trang_thai VARCHAR(20) NOT NULL DEFAULT 'moi',
  nguoi_gui VARCHAR(200) NOT NULL,
  thoi_gian_gui TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  nguoi_xu_ly VARCHAR(200),
  ket_luan TEXT,
  thoi_gian_xu_ly TIMESTAMPTZ,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ NOTIFICATIONS ============

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  user_id UUID REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ MEDICAL ============

CREATE TABLE IF NOT EXISTS medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  athlete_id UUID REFERENCES athletes(id),
  match_id UUID,
  type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  severity VARCHAR(20),
  action_taken TEXT,
  can_continue BOOLEAN,
  reported_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ MEDIA ============

CREATE TABLE IF NOT EXISTS media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  uploaded_by UUID REFERENCES users(id),
  type VARCHAR(20) NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  title VARCHAR(200),
  description TEXT,
  tags JSONB DEFAULT '[]',
  match_id UUID,
  athlete_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ DATA AUDIT TRAIL ============

CREATE TABLE IF NOT EXISTS data_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL,
  old_data JSONB,
  new_data JSONB,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ INDEXES ============

CREATE INDEX IF NOT EXISTS idx_athletes_tournament ON athletes(tournament_id);
CREATE INDEX IF NOT EXISTS idx_athletes_team ON athletes(team_id);
CREATE INDEX IF NOT EXISTS idx_registrations_athlete ON registrations(athlete_id);
CREATE INDEX IF NOT EXISTS idx_combat_matches_tournament ON combat_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_combat_matches_status ON combat_matches(trang_thai);
CREATE INDEX IF NOT EXISTS idx_form_performances_tournament ON form_performances(tournament_id);
CREATE INDEX IF NOT EXISTS idx_schedule_tournament_date ON schedule_entries(tournament_id, ngay);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_data_audit_entity ON data_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_teams_tournament ON teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_weight_classes_tournament ON weight_classes(tournament_id);
CREATE INDEX IF NOT EXISTS idx_content_categories_tournament ON content_categories(tournament_id);
CREATE INDEX IF NOT EXISTS idx_referees_tournament ON referees(tournament_id);
CREATE INDEX IF NOT EXISTS idx_arenas_tournament ON arenas(tournament_id);
CREATE INDEX IF NOT EXISTS idx_appeals_tournament ON appeals(tournament_id);
CREATE INDEX IF NOT EXISTS idx_weigh_ins_athlete ON weigh_ins(athlete_id);

-- ============ UPDATED_AT TRIGGER ============

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'users','tournaments','teams','athletes','registrations',
    'combat_matches','form_performances','appeals'
  ]) LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at()',
      tbl
    );
  END LOOP;
EXCEPTION WHEN duplicate_object THEN
  NULL; -- triggers already exist
END $$;

COMMIT;
