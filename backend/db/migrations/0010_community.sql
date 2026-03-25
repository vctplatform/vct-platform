-- ===============================================================
-- VCT Platform — Migration 0010: COMMUNITY MODULE (Enterprise)
-- Schema: platform.* | Posts, comments, follows, groups, marketplace
-- ===============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS platform.posts (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  author_id         UUID NOT NULL,
  title             VARCHAR(500),
  content           TEXT NOT NULL,
  post_type         VARCHAR(20) DEFAULT 'text'
    CHECK (post_type IN ('text', 'image', 'video', 'tournament_update', 'achievement', 'article')),
  visibility        VARCHAR(20) DEFAULT 'public'
    CHECK (visibility IN ('public', 'members', 'group', 'private')),
  club_id           UUID,
  tournament_id     UUID,
  group_id          UUID,
  like_count        INT DEFAULT 0,
  comment_count     INT DEFAULT 0,
  share_count       INT DEFAULT 0,
  is_pinned         BOOLEAN DEFAULT false,
  media_urls        JSONB DEFAULT '[]',
  tags              JSONB DEFAULT '[]',
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

CREATE TABLE IF NOT EXISTS platform.comments (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  post_id           UUID NOT NULL,
  author_id         UUID NOT NULL,
  parent_comment_id UUID,
  content           TEXT NOT NULL,
  like_count        INT DEFAULT 0,
  metadata          JSONB DEFAULT '{}',
  is_deleted        BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version           INT NOT NULL DEFAULT 1,
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS platform.reactions (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  user_id           UUID NOT NULL,
  target_type       VARCHAR(20) NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id         UUID NOT NULL,
  reaction_type     VARCHAR(20) DEFAULT 'like'
    CHECK (reaction_type IN ('like', 'love', 'fire', 'clap', 'sad')),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, user_id, target_type, target_id)
);

CREATE TABLE IF NOT EXISTS platform.follows (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  follower_id       UUID NOT NULL,
  following_type    VARCHAR(20) NOT NULL
    CHECK (following_type IN ('user', 'club', 'athlete', 'tournament', 'school')),
  following_id      UUID NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, follower_id, following_type, following_id)
);

CREATE TABLE IF NOT EXISTS platform.community_groups (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  name              VARCHAR(200) NOT NULL,
  description       TEXT,
  group_type        VARCHAR(50)
    CHECK (group_type IN ('mon_phai', 'vung_mien', 'so_thich', 'giai_dau', 'hlv', 'trong_tai')),
  cover_image_url   TEXT,
  avatar_url        TEXT,
  owner_id          UUID NOT NULL,
  privacy           VARCHAR(20) DEFAULT 'public'
    CHECK (privacy IN ('public', 'private', 'secret')),
  member_count      INT DEFAULT 0,
  is_active         BOOLEAN DEFAULT true,
  rules             TEXT,
  metadata          JSONB DEFAULT '{}',
  is_deleted        BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by        UUID,
  version           INT NOT NULL DEFAULT 1,
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS platform.group_memberships (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  group_id          UUID NOT NULL,
  user_id           UUID NOT NULL,
  role              VARCHAR(20) DEFAULT 'member'
    CHECK (role IN ('admin', 'moderator', 'member')),
  status            VARCHAR(20) DEFAULT 'active'
    CHECK (status IN ('active', 'pending', 'banned', 'left')),
  joined_at         TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, group_id, user_id)
);

CREATE TABLE IF NOT EXISTS platform.marketplace_listings (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  seller_id         UUID NOT NULL,
  title             VARCHAR(200) NOT NULL,
  description       TEXT,
  category          VARCHAR(50) NOT NULL
    CHECK (category IN ('trang_phuc', 'bao_ho', 'binh_khi', 'sach', 'thiet_bi', 'khac')),
  condition_state   VARCHAR(20) DEFAULT 'new'
    CHECK (condition_state IN ('new', 'like_new', 'good', 'fair')),
  price             DECIMAL(12,2) NOT NULL CHECK (price >= 0),
  currency          VARCHAR(10) DEFAULT 'VND',
  images            JSONB DEFAULT '[]',
  location          VARCHAR(200),
  status            VARCHAR(20) DEFAULT 'active'
    CHECK (status IN ('active', 'sold', 'reserved', 'expired', 'deleted')),
  view_count        INT DEFAULT 0,
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
    'platform.posts', 'platform.comments', 'platform.reactions',
    'platform.follows', 'platform.community_groups',
    'platform.group_memberships', 'platform.marketplace_listings'
  ]) LOOP
    EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %s USING (tenant_id = COALESCE(current_setting(''app.current_tenant'', true)::UUID, ''00000000-0000-7000-8000-000000000001''::UUID))',
      tbl
    );
  END LOOP;
END $$;

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_posts_tenant_created ON platform.posts(tenant_id, created_at DESC) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_posts_author ON platform.posts(tenant_id, author_id);
CREATE INDEX IF NOT EXISTS idx_posts_club ON platform.posts(tenant_id, club_id) WHERE club_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_post ON platform.comments(tenant_id, post_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_reactions_target ON platform.reactions(tenant_id, target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON platform.follows(tenant_id, follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON platform.follows(tenant_id, following_type, following_id);
CREATE INDEX IF NOT EXISTS idx_groups_tenant ON platform.community_groups(tenant_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_group_members_group ON platform.group_memberships(tenant_id, group_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_marketplace_cat ON platform.marketplace_listings(tenant_id, category) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_marketplace_seller ON platform.marketplace_listings(tenant_id, seller_id);

-- TRIGGERS
DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'platform.posts', 'platform.comments', 'platform.community_groups', 'platform.marketplace_listings'
  ]) LOOP
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at()', tbl);
  END LOOP;
END $$;

COMMIT;
