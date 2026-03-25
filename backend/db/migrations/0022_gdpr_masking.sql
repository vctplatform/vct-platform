-- ===============================================================
-- VCT Platform — Migration 0022: GDPR + DATA MASKING (Phase 5B)
-- Right to erasure, data portability, dynamic masking,
-- consent management, activity logging
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. GDPR CONSENT MANAGEMENT
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS core.user_consents (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
  user_id         UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  consent_type    VARCHAR(100) NOT NULL,     -- 'data_processing', 'marketing', 'analytics', 'photo_video'
  status          VARCHAR(20) NOT NULL DEFAULT 'granted'
    CHECK (status IN ('granted', 'revoked', 'expired')),
  granted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at      TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  ip_address      INET,
  consent_text    TEXT,                      -- version of consent at time
  metadata        JSONB DEFAULT '{}',
  version         INT NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_user_consents_active
  ON core.user_consents(tenant_id, user_id, consent_type)
  WHERE status = 'granted';

ALTER TABLE core.user_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON core.user_consents
  USING (tenant_id = COALESCE(current_setting('app.current_tenant', true)::UUID, '00000000-0000-7000-8000-000000000001'::UUID));

-- ════════════════════════════════════════════════════════
-- 2. DATA ERASURE REQUESTS (Right to Be Forgotten)
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS core.erasure_requests (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
  user_id         UUID NOT NULL REFERENCES core.users(id),
  request_type    VARCHAR(30) NOT NULL DEFAULT 'full_erasure'
    CHECK (request_type IN ('full_erasure', 'partial_erasure', 'data_portability')),
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected', 'expired')),
  requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deadline_at     TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days',  -- GDPR 30-day deadline
  completed_at    TIMESTAMPTZ,
  processed_by    UUID,
  -- Track what was erased
  erased_tables   JSONB DEFAULT '[]',        -- ["core.users", "platform.posts"]
  erased_records  INT DEFAULT 0,
  rejection_reason TEXT,
  notes           TEXT,
  metadata        JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_erasure_pending
  ON core.erasure_requests(status, deadline_at)
  WHERE status IN ('pending', 'in_progress');

-- ════════════════════════════════════════════════════════
-- 3. RIGHT TO ERASURE PROCEDURE
--    Anonymize PII across all tables for a given user
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION core.execute_erasure(
  p_request_id UUID,
  p_dry_run BOOLEAN DEFAULT true
)
RETURNS TABLE (
  table_name TEXT,
  records_affected INT,
  action_taken TEXT
) AS $$
DECLARE
  v_user_id UUID;
  v_tenant_id UUID;
  v_count INT;
BEGIN
  SELECT user_id, tenant_id INTO v_user_id, v_tenant_id
  FROM core.erasure_requests WHERE id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Erasure request % not found', p_request_id;
  END IF;

  -- Anonymize core.users
  table_name := 'core.users';
  IF p_dry_run THEN
    SELECT count(*) INTO v_count FROM core.users WHERE id = v_user_id;
  ELSE
    UPDATE core.users SET
      full_name = 'ERASED_USER_' || left(id::TEXT, 8),
      email = 'erased_' || left(id::TEXT, 8) || '@erased.local',
      email_encrypted = NULL,
      phone_encrypted = NULL,
      email_hash = NULL,
      avatar_url = NULL,
      metadata = '{"erased": true}'::JSONB,
      is_active = false,
      updated_at = NOW()
    WHERE id = v_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
  END IF;
  records_affected := v_count;
  action_taken := CASE WHEN p_dry_run THEN 'DRY_RUN' ELSE 'anonymized' END;
  RETURN NEXT;

  -- Anonymize posts
  table_name := 'platform.posts';
  IF p_dry_run THEN
    SELECT count(*) INTO v_count FROM platform.posts WHERE author_id = v_user_id;
  ELSE
    UPDATE platform.posts SET
      content = '[Nội dung đã bị xóa theo yêu cầu GDPR]',
      media_urls = '[]'::JSONB,
      author_id = v_user_id,  -- keep for FK
      updated_at = NOW()
    WHERE author_id = v_user_id AND tenant_id = v_tenant_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
  END IF;
  records_affected := v_count;
  action_taken := CASE WHEN p_dry_run THEN 'DRY_RUN' ELSE 'content_erased' END;
  RETURN NEXT;

  -- Anonymize comments
  table_name := 'platform.comments';
  IF p_dry_run THEN
    SELECT count(*) INTO v_count FROM platform.comments WHERE author_id = v_user_id;
  ELSE
    UPDATE platform.comments SET
      content = '[Bình luận đã bị xóa]',
      updated_at = NOW()
    WHERE author_id = v_user_id AND tenant_id = v_tenant_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
  END IF;
  records_affected := v_count;
  action_taken := CASE WHEN p_dry_run THEN 'DRY_RUN' ELSE 'content_erased' END;
  RETURN NEXT;

  -- Soft-delete reactions, follows
  table_name := 'platform.reactions+follows';
  IF NOT p_dry_run THEN
    DELETE FROM platform.reactions WHERE user_id = v_user_id AND tenant_id = v_tenant_id;
    DELETE FROM platform.follows WHERE follower_id = v_user_id AND tenant_id = v_tenant_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
  ELSE
    SELECT count(*) INTO v_count FROM platform.reactions WHERE user_id = v_user_id;
  END IF;
  records_affected := v_count;
  action_taken := CASE WHEN p_dry_run THEN 'DRY_RUN' ELSE 'deleted' END;
  RETURN NEXT;

  -- Revoke all sessions
  table_name := 'core.sessions';
  IF NOT p_dry_run THEN
    DELETE FROM core.sessions WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
  ELSE
    SELECT count(*) INTO v_count FROM core.sessions WHERE user_id = v_user_id;
  END IF;
  records_affected := v_count;
  action_taken := CASE WHEN p_dry_run THEN 'DRY_RUN' ELSE 'revoked' END;
  RETURN NEXT;

  -- Mark request as completed
  IF NOT p_dry_run THEN
    UPDATE core.erasure_requests SET
      status = 'completed',
      completed_at = NOW(),
      erased_tables = '["core.users","platform.posts","platform.comments","platform.reactions","platform.follows","core.sessions"]'::JSONB
    WHERE id = p_request_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════
-- 4. DATA PORTABILITY (Export user's data as JSON)
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION core.export_user_data(
  p_user_id UUID,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_tenant UUID;
  v_result JSONB := '{}';
BEGIN
  v_tenant := COALESCE(p_tenant_id,
    current_setting('app.current_tenant', true)::UUID);

  -- User profile
  SELECT jsonb_build_object(
    'profile', row_to_json(u),
    'roles', (
      SELECT COALESCE(jsonb_agg(row_to_json(r)), '[]'::JSONB)
      FROM core.user_roles ur JOIN core.roles r ON r.id = ur.role_id
      WHERE ur.user_id = p_user_id AND ur.tenant_id = v_tenant
    ),
    'consents', (
      SELECT COALESCE(jsonb_agg(row_to_json(c)), '[]'::JSONB)
      FROM core.user_consents c
      WHERE c.user_id = p_user_id AND c.tenant_id = v_tenant
    ),
    'posts', (
      SELECT COALESCE(jsonb_agg(row_to_json(p)), '[]'::JSONB)
      FROM platform.posts p
      WHERE p.author_id = p_user_id AND p.tenant_id = v_tenant AND p.is_deleted = false
    ),
    'comments', (
      SELECT COALESCE(jsonb_agg(row_to_json(cm)), '[]'::JSONB)
      FROM platform.comments cm
      WHERE cm.author_id = p_user_id AND cm.tenant_id = v_tenant AND cm.is_deleted = false
    ),
    'export_timestamp', NOW()
  )
  INTO v_result
  FROM core.users u
  WHERE u.id = p_user_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

-- ════════════════════════════════════════════════════════
-- 5. DYNAMIC DATA MASKING
--    Views that mask PII based on current role
-- ════════════════════════════════════════════════════════

-- Masked user view (for non-admin roles)
CREATE OR REPLACE VIEW api_v1.users_masked AS
SELECT
  id,
  tenant_id,
  CASE
    WHEN current_setting('app.is_system_admin', true) = 'true' THEN full_name
    ELSE left(full_name, 1) || '***'
  END AS full_name,
  CASE
    WHEN current_setting('app.is_system_admin', true) = 'true' THEN email
    ELSE left(email, 2) || '***@' || split_part(email, '@', 2)
  END AS email,
  avatar_url,
  is_active,
  created_at
FROM core.users
WHERE is_deleted = false;

-- Masked athlete view (for public display)
CREATE OR REPLACE VIEW api_v1.athletes_public AS
SELECT
  a.id,
  a.tenant_id,
  a.ho_ten,
  a.ngay_sinh,
  a.gioi_tinh,
  a.can_nang,
  a.current_club_id,
  a.trang_thai,
  -- Mask personal details
  CASE
    WHEN current_setting('app.is_system_admin', true) = 'true'
      OR current_setting('app.current_user', true)::UUID = a.user_id
    THEN a.national_id
    ELSE '***' || right(COALESCE(a.national_id, ''), 3)
  END AS national_id_masked,
  a.belt_rank_id,
  a.created_at
FROM athletes a
WHERE a.is_deleted = false;

-- ════════════════════════════════════════════════════════
-- 6. ACTIVITY LOG (User-level audit for compliance)
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS core.user_activity_log (
  id              UUID DEFAULT uuidv7() NOT NULL,
  tenant_id       UUID NOT NULL,
  user_id         UUID NOT NULL,
  activity_type   VARCHAR(100) NOT NULL,     -- 'login', 'view_athlete', 'export_data'
  resource_type   VARCHAR(100),
  resource_id     UUID,
  ip_address      INET,
  user_agent      TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (created_at, tenant_id, id)
) PARTITION BY RANGE (created_at);

-- Monthly partitions
DO $$
DECLARE m INT; start_d TEXT; end_d TEXT;
BEGIN
  FOR m IN 1..12 LOOP
    start_d := format('2026-%s-01', lpad(m::TEXT, 2, '0'));
    IF m = 12 THEN end_d := '2027-01-01';
    ELSE end_d := format('2026-%s-01', lpad((m+1)::TEXT, 2, '0'));
    END IF;
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS core.user_activity_2026_%s PARTITION OF core.user_activity_log FOR VALUES FROM (%L) TO (%L)',
      lpad(m::TEXT, 2, '0'), start_d, end_d
    );
  END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS core.user_activity_default
  PARTITION OF core.user_activity_log DEFAULT;

CREATE INDEX IF NOT EXISTS idx_activity_user
  ON core.user_activity_log(tenant_id, user_id, created_at DESC);

ALTER TABLE core.user_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON core.user_activity_log
  USING (tenant_id = COALESCE(current_setting('app.current_tenant', true)::UUID, '00000000-0000-7000-8000-000000000001'::UUID));

COMMIT;
