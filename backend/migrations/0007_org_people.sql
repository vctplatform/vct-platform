-- ===============================================================
-- VCT Platform — Migration 0007: ORGANIZATION + PEOPLE (Enterprise)
-- Schema: people.* | Club branches, coaches, certifications,
-- bitemporal belt/weight history
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- CLUB BRANCHES (Chi nhánh CLB)
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS people.club_branches (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  club_id           UUID NOT NULL,
  name              VARCHAR(200) NOT NULL,
  address           TEXT,
  city              VARCHAR(100),
  province          VARCHAR(100),
  phone             VARCHAR(20),
  email             VARCHAR(255),
  head_instructor   VARCHAR(200),
  capacity          INT DEFAULT 0,
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

-- ════════════════════════════════════════════════════════
-- CLUB MEMBERSHIPS (Thành viên CLB)
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS people.club_memberships (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  club_id           UUID NOT NULL,
  user_id           UUID,
  athlete_id        UUID,
  full_name         VARCHAR(200) NOT NULL,
  role              VARCHAR(50) NOT NULL DEFAULT 'member'
    CHECK (role IN ('owner', 'manager', 'instructor', 'member', 'trial')),
  join_date         DATE NOT NULL DEFAULT CURRENT_DATE,
  leave_date        DATE,
  status            VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'suspended', 'transferred')),
  membership_number VARCHAR(50),
  notes             TEXT,
  metadata          JSONB DEFAULT '{}',
  is_deleted        BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by        UUID,
  version           INT NOT NULL DEFAULT 1,
  PRIMARY KEY (tenant_id, id)
);

-- ════════════════════════════════════════════════════════
-- COACHES (Huấn luyện viên)
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS people.coaches (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  user_id           UUID,
  full_name         VARCHAR(200) NOT NULL,
  date_of_birth     DATE,
  gender            VARCHAR(5) CHECK (gender IN ('nam', 'nu')),
  phone             VARCHAR(20),
  email             VARCHAR(255),
  club_id           UUID,
  specialization    VARCHAR(100),
  belt_rank_id      UUID,
  experience_years  INT DEFAULT 0,
  bio               TEXT,
  avatar_url        TEXT,
  status            VARCHAR(20) DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'retired', 'suspended')),
  metadata          JSONB DEFAULT '{}',
  is_deleted        BOOLEAN DEFAULT false,
  deleted_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by        UUID,
  version           INT NOT NULL DEFAULT 1,
  PRIMARY KEY (tenant_id, id)
);

-- ════════════════════════════════════════════════════════
-- CERTIFICATIONS (Chứng chỉ — coaches & referees)
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS people.certifications (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  holder_type       VARCHAR(20) NOT NULL CHECK (holder_type IN ('coach', 'referee', 'athlete')),
  holder_id         UUID NOT NULL,
  cert_type         VARCHAR(100) NOT NULL,
  issuing_authority VARCHAR(200),
  certificate_number VARCHAR(100),
  issue_date        DATE NOT NULL,
  expiry_date       DATE,
  status            VARCHAR(20) DEFAULT 'valid'
    CHECK (status IN ('valid', 'expired', 'revoked', 'pending_renewal')),
  document_url      TEXT,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID,
  version           INT NOT NULL DEFAULT 1,
  PRIMARY KEY (tenant_id, id)
);

-- ════════════════════════════════════════════════════════
-- ATHLETE BELT HISTORY (Bitemporal)
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS people.athlete_belt_history (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  athlete_id        UUID NOT NULL,
  belt_rank_id      UUID NOT NULL,
  -- Bitemporal: valid_time
  valid_from        DATE NOT NULL,
  valid_to          DATE DEFAULT 'infinity',
  -- Bitemporal: transaction_time
  recorded_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  superseded_at     TIMESTAMPTZ DEFAULT 'infinity',
  recorded_by       UUID,
  superseded_by_id  UUID,
  examination_id    UUID,
  certificate_number VARCHAR(100),
  notes             TEXT,
  metadata          JSONB DEFAULT '{}',
  PRIMARY KEY (tenant_id, id)
);

-- ════════════════════════════════════════════════════════
-- ATHLETE WEIGHT HISTORY
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS people.athlete_weight_history (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  athlete_id        UUID NOT NULL,
  weight            DECIMAL(5,1) NOT NULL,
  measured_at       DATE NOT NULL,
  measured_by       VARCHAR(200),
  context           VARCHAR(50)
    CHECK (context IN ('routine', 'weigh_in', 'medical', 'self_report')),
  notes             TEXT,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, id)
);

-- ════════════════════════════════════════════════════════
-- ENHANCE ATHLETES TABLE (add columns if missing)
-- ════════════════════════════════════════════════════════

DO $$
BEGIN
  ALTER TABLE athletes ADD COLUMN IF NOT EXISTS current_club_id UUID;
  ALTER TABLE athletes ADD COLUMN IF NOT EXISTS belt_rank_id UUID;
  ALTER TABLE athletes ADD COLUMN IF NOT EXISTS national_id VARCHAR(20);
  ALTER TABLE athletes ADD COLUMN IF NOT EXISTS blood_type VARCHAR(5);
  ALTER TABLE athletes ADD COLUMN IF NOT EXISTS insurance_number VARCHAR(50);
  ALTER TABLE athletes ADD COLUMN IF NOT EXISTS insurance_expiry DATE;
  ALTER TABLE referees ADD COLUMN IF NOT EXISTS date_of_birth DATE;
  ALTER TABLE referees ADD COLUMN IF NOT EXISTS gender VARCHAR(5);
  ALTER TABLE referees ADD COLUMN IF NOT EXISTS avatar_url TEXT;
END $$;

-- ════════════════════════════════════════════════════════
-- RLS
-- ════════════════════════════════════════════════════════

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'people.club_branches', 'people.club_memberships', 'people.coaches',
    'people.certifications', 'people.athlete_belt_history',
    'people.athlete_weight_history'
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

CREATE INDEX IF NOT EXISTS idx_branches_club ON people.club_branches(tenant_id, club_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_memberships_club ON people.club_memberships(tenant_id, club_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_memberships_user ON people.club_memberships(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_coaches_club ON people.coaches(tenant_id, club_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_coaches_status ON people.coaches(tenant_id, status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_certs_holder ON people.certifications(tenant_id, holder_type, holder_id);
CREATE INDEX IF NOT EXISTS idx_certs_expiry ON people.certifications(tenant_id, expiry_date) WHERE status = 'valid';
CREATE INDEX IF NOT EXISTS idx_belt_history_athlete ON people.athlete_belt_history(tenant_id, athlete_id);
CREATE INDEX IF NOT EXISTS idx_belt_history_current ON people.athlete_belt_history(tenant_id, athlete_id, valid_to)
  WHERE valid_to = 'infinity';
CREATE INDEX IF NOT EXISTS idx_weight_history_athlete ON people.athlete_weight_history(tenant_id, athlete_id, measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_athletes_club ON athletes(current_club_id);
CREATE INDEX IF NOT EXISTS idx_athletes_belt ON athletes(belt_rank_id);

-- TRIGGERS
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'people.club_branches', 'people.club_memberships', 'people.coaches'
  ]) LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %s
       FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at()',
      tbl
    );
  END LOOP;
END $$;

COMMIT;
