-- ===============================================================
-- VCT Platform — Migration 0006: TRAINING MODULE (Enterprise)
-- Schema: training.* | Template: tenant-aware, bitemporal, versioned
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- CURRICULA (Giáo trình)
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS training.curricula (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  name              VARCHAR(200) NOT NULL,
  code              VARCHAR(50) NOT NULL,
  school_style      VARCHAR(100),
  description       TEXT,
  is_active         BOOLEAN DEFAULT true,
  metadata          JSONB DEFAULT '{}',
  is_deleted        BOOLEAN DEFAULT false,
  deleted_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by        UUID,
  version           INT NOT NULL DEFAULT 1,
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS training.curriculum_levels (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  curriculum_id     UUID NOT NULL,
  belt_rank_id      UUID,
  level_order       INT NOT NULL,
  name              VARCHAR(200) NOT NULL,
  description       TEXT,
  min_training_months INT DEFAULT 0,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version           INT NOT NULL DEFAULT 1,
  PRIMARY KEY (tenant_id, id)
);

-- ════════════════════════════════════════════════════════
-- TECHNIQUES (Kỹ thuật)
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS training.techniques (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  name_vi           VARCHAR(200) NOT NULL,
  name_en           VARCHAR(200),
  name_han_nom      VARCHAR(200),
  category          VARCHAR(50) NOT NULL
    CHECK (category IN ('don', 'quyen', 'tu_ve', 'binh_khi', 'song_luyen')),
  difficulty_level  INT DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 10),
  description       TEXT,
  instructions      TEXT,
  is_active         BOOLEAN DEFAULT true,
  metadata          JSONB DEFAULT '{}',
  is_deleted        BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by        UUID,
  version           INT NOT NULL DEFAULT 1,
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS training.technique_media (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  technique_id      UUID NOT NULL,
  media_type        VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video', 'document')),
  url               TEXT NOT NULL,
  thumbnail_url     TEXT,
  title             VARCHAR(200),
  sort_order        INT DEFAULT 0,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS training.curriculum_techniques (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  curriculum_level_id UUID NOT NULL,
  technique_id      UUID NOT NULL,
  is_mandatory      BOOLEAN DEFAULT true,
  sort_order        INT DEFAULT 0,
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, curriculum_level_id, technique_id)
);

-- ════════════════════════════════════════════════════════
-- TRAINING PLANS & SESSIONS
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS training.training_plans (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  club_id           UUID,
  coach_id          UUID,
  name              VARCHAR(200) NOT NULL,
  description       TEXT,
  start_date        DATE,
  end_date          DATE,
  status            VARCHAR(20) DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  metadata          JSONB DEFAULT '{}',
  is_deleted        BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by        UUID,
  version           INT NOT NULL DEFAULT 1,
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS training.training_sessions (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  training_plan_id  UUID,
  club_id           UUID,
  coach_id          UUID,
  title             VARCHAR(200) NOT NULL,
  session_date      DATE NOT NULL,
  start_time        TIME NOT NULL,
  end_time          TIME NOT NULL,
  location          VARCHAR(200),
  description       TEXT,
  status            VARCHAR(20) DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  max_participants  INT,
  metadata          JSONB DEFAULT '{}',
  is_deleted        BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by        UUID,
  version           INT NOT NULL DEFAULT 1,
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS training.attendance_records (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  session_id        UUID NOT NULL,
  athlete_id        UUID NOT NULL,
  check_in_at       TIMESTAMPTZ,
  check_out_at      TIMESTAMPTZ,
  status            VARCHAR(20) NOT NULL DEFAULT 'present'
    CHECK (status IN ('present', 'absent', 'late', 'excused')),
  checked_by        UUID,
  device_id         VARCHAR(100),
  sync_status       VARCHAR(20) DEFAULT 'synced',
  note              TEXT,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, session_id, athlete_id)
);

-- ════════════════════════════════════════════════════════
-- BELT EXAMINATIONS (Thi đai)
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS training.belt_examinations (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  club_id           UUID,
  title             VARCHAR(200) NOT NULL,
  exam_date         DATE NOT NULL,
  location          VARCHAR(200),
  target_belt_id    UUID,
  status            VARCHAR(20) NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  chief_examiner    VARCHAR(200),
  max_candidates    INT,
  registration_deadline DATE,
  description       TEXT,
  metadata          JSONB DEFAULT '{}',
  is_deleted        BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by        UUID,
  version           INT NOT NULL DEFAULT 1,
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS training.belt_exam_results (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  examination_id    UUID NOT NULL,
  athlete_id        UUID NOT NULL,
  current_belt_id   UUID,
  target_belt_id    UUID,
  score             DECIMAL(5,2),
  result            VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (result IN ('pending', 'passed', 'failed', 'deferred')),
  examiner_notes    TEXT,
  certificate_number VARCHAR(100),
  certificate_date  DATE,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, examination_id, athlete_id)
);

-- ════════════════════════════════════════════════════════
-- E-LEARNING (Khóa học online)
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS training.courses (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  title             VARCHAR(200) NOT NULL,
  code              VARCHAR(50) NOT NULL,
  description       TEXT,
  instructor_id     UUID,
  category          VARCHAR(50)
    CHECK (category IN ('quyen', 'ky_thuat', 'ly_thuyet', 'trong_tai', 'hlv')),
  level             VARCHAR(20) DEFAULT 'beginner'
    CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  thumbnail_url     TEXT,
  duration_hours    DECIMAL(5,1),
  is_published      BOOLEAN DEFAULT false,
  is_free           BOOLEAN DEFAULT true,
  price             DECIMAL(12,2) DEFAULT 0,
  metadata          JSONB DEFAULT '{}',
  is_deleted        BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by        UUID,
  version           INT NOT NULL DEFAULT 1,
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS training.course_enrollments (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  course_id         UUID NOT NULL,
  user_id           UUID NOT NULL,
  progress_percent  DECIMAL(5,2) DEFAULT 0,
  status            VARCHAR(20) DEFAULT 'enrolled'
    CHECK (status IN ('enrolled', 'in_progress', 'completed', 'dropped')),
  enrolled_at       TIMESTAMPTZ DEFAULT NOW(),
  completed_at      TIMESTAMPTZ,
  metadata          JSONB DEFAULT '{}',
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, course_id, user_id)
);

-- ════════════════════════════════════════════════════════
-- RLS
-- ════════════════════════════════════════════════════════

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'training.curricula', 'training.curriculum_levels', 'training.techniques',
    'training.training_plans', 'training.training_sessions',
    'training.attendance_records', 'training.belt_examinations',
    'training.belt_exam_results', 'training.courses', 'training.course_enrollments'
  ]) LOOP
    EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %s
        USING (tenant_id = COALESCE(
          current_setting(''app.current_tenant'', true)::UUID,
          ''00000000-0000-7000-8000-000000000001''::UUID
        ))',
      tbl
    );
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════
-- INDEXES
-- ════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_curricula_tenant ON training.curricula(tenant_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_techniques_tenant_cat ON training.techniques(tenant_id, category) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_sessions_tenant_date ON training.training_sessions(tenant_id, session_date DESC) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_sessions_club ON training.training_sessions(tenant_id, club_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON training.attendance_records(tenant_id, session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_athlete ON training.attendance_records(tenant_id, athlete_id);
CREATE INDEX IF NOT EXISTS idx_belt_exams_tenant ON training.belt_examinations(tenant_id, exam_date) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_courses_tenant_pub ON training.courses(tenant_id, is_published) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON training.course_enrollments(tenant_id, user_id);

-- ════════════════════════════════════════════════════════
-- TRIGGERS
-- ════════════════════════════════════════════════════════

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'training.curricula', 'training.techniques', 'training.training_plans',
    'training.training_sessions', 'training.belt_examinations', 'training.courses'
  ]) LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %s
       FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at()',
      tbl
    );
  END LOOP;
END $$;

COMMIT;
