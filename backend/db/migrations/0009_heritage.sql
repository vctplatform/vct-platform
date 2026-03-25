-- ===============================================================
-- VCT Platform — Migration 0009: HERITAGE MODULE (Enterprise)
-- Schema: platform.* | Môn phái, phả hệ, kỹ thuật, từ điển, sự kiện
-- ===============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS platform.martial_schools (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  name              VARCHAR(200) NOT NULL,
  name_han_nom      VARCHAR(200),
  code              VARCHAR(50) NOT NULL,
  founder           VARCHAR(200),
  founded_year      INT,
  origin_location   VARCHAR(200),
  description       TEXT,
  philosophy        TEXT,
  history           TEXT,
  logo_url          TEXT,
  banner_url        TEXT,
  is_recognized     BOOLEAN DEFAULT false,
  federation_id     UUID,
  parent_school_id  UUID,
  status            VARCHAR(20) DEFAULT 'active',
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

CREATE TABLE IF NOT EXISTS platform.school_lineage (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  school_id         UUID NOT NULL,
  parent_school_id  UUID,
  relationship_type VARCHAR(50) NOT NULL
    CHECK (relationship_type IN ('origin', 'branch', 'influenced_by', 'merged')),
  description       TEXT,
  year_established  INT,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS platform.lineage_nodes (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  person_name       VARCHAR(200) NOT NULL,
  title             VARCHAR(100),
  generation        INT,
  school_id         UUID,
  parent_node_id    UUID,
  birth_year        INT,
  death_year        INT,
  bio               TEXT,
  photo_url         TEXT,
  notable_achievements TEXT,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version           INT NOT NULL DEFAULT 1,
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS platform.heritage_techniques (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  school_id         UUID,
  name_vi           VARCHAR(200) NOT NULL,
  name_han_nom      VARCHAR(200),
  name_en           VARCHAR(200),
  category          VARCHAR(50) NOT NULL
    CHECK (category IN ('quyen', 'binh_khi', 'don_thuc', 'song_luyen', 'dong_luyen')),
  difficulty        VARCHAR(20)
    CHECK (difficulty IN ('co_ban', 'trung_binh', 'nang_cao', 'bieu_dien')),
  description       TEXT,
  history           TEXT,
  video_url         TEXT,
  thumbnail_url     TEXT,
  is_signature      BOOLEAN DEFAULT false,
  metadata          JSONB DEFAULT '{}',
  is_deleted        BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by        UUID,
  version           INT NOT NULL DEFAULT 1,
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS platform.heritage_media (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  school_id         UUID,
  technique_id      UUID,
  node_id           UUID,
  media_type        VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video', 'document', 'audio')),
  title             VARCHAR(200) NOT NULL,
  description       TEXT,
  url               TEXT NOT NULL,
  thumbnail_url     TEXT,
  source            VARCHAR(200),
  year_created      INT,
  is_public         BOOLEAN DEFAULT true,
  tags              JSONB DEFAULT '[]',
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS platform.heritage_glossary (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  term_vi           VARCHAR(200) NOT NULL,
  term_han_nom      VARCHAR(200),
  term_en           VARCHAR(200),
  pronunciation     VARCHAR(200),
  category          VARCHAR(50),
  definition        TEXT NOT NULL,
  usage_example     TEXT,
  school_id         UUID,
  audio_url         TEXT,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version           INT NOT NULL DEFAULT 1,
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS platform.heritage_events (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  name              VARCHAR(200) NOT NULL,
  event_type        VARCHAR(50) NOT NULL
    CHECK (event_type IN ('le_ky_niem', 'giao_luu', 'bieu_dien', 'hoi_nghi', 'trung_bay')),
  school_id         UUID,
  location          VARCHAR(200),
  start_date        DATE NOT NULL,
  end_date          DATE,
  description       TEXT,
  organizer         VARCHAR(200),
  max_participants  INT,
  status            VARCHAR(20) DEFAULT 'upcoming'
    CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  banner_url        TEXT,
  metadata          JSONB DEFAULT '{}',
  is_deleted        BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by        UUID,
  version           INT NOT NULL DEFAULT 1,
  PRIMARY KEY (tenant_id, id)
);

-- RLS
DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'platform.martial_schools', 'platform.school_lineage', 'platform.lineage_nodes',
    'platform.heritage_techniques', 'platform.heritage_media',
    'platform.heritage_glossary', 'platform.heritage_events'
  ]) LOOP
    EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %s USING (tenant_id = COALESCE(current_setting(''app.current_tenant'', true)::UUID, ''00000000-0000-7000-8000-000000000001''::UUID))',
      tbl
    );
  END LOOP;
END $$;

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_schools_tenant ON platform.martial_schools(tenant_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_schools_federation ON platform.martial_schools(tenant_id, federation_id);
CREATE INDEX IF NOT EXISTS idx_lineage_nodes_school ON platform.lineage_nodes(tenant_id, school_id);
CREATE INDEX IF NOT EXISTS idx_lineage_nodes_parent ON platform.lineage_nodes(tenant_id, parent_node_id);
CREATE INDEX IF NOT EXISTS idx_heritage_tech_school ON platform.heritage_techniques(tenant_id, school_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_heritage_tech_cat ON platform.heritage_techniques(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_heritage_media_school ON platform.heritage_media(tenant_id, school_id);
CREATE INDEX IF NOT EXISTS idx_heritage_glossary_cat ON platform.heritage_glossary(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_heritage_events_date ON platform.heritage_events(tenant_id, start_date) WHERE is_deleted = false;

-- TRIGGERS
DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'platform.martial_schools', 'platform.lineage_nodes',
    'platform.heritage_techniques', 'platform.heritage_glossary', 'platform.heritage_events'
  ]) LOOP
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at()', tbl);
  END LOOP;
END $$;

COMMIT;
