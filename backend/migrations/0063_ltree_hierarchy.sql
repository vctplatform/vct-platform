-- ===============================================================
-- VCT Platform — Migration 0063: ltree HIERARCHICAL DATA
-- P1 High: Native tree operators for federations, schools, orgs
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. ENABLE ltree EXTENSION
-- ════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS ltree;

-- ════════════════════════════════════════════════════════
-- 2. ADD ltree PATH COLUMNS
--    Encode hierarchical position as dot-separated path
--    e.g., 'vn.mienbac.hanoi.caulacbo_thanglong'
-- ════════════════════════════════════════════════════════

-- Tenants (org hierarchy)
ALTER TABLE core.tenants
  ADD COLUMN IF NOT EXISTS tree_path ltree;

-- Martial schools (lineage)
ALTER TABLE platform.martial_schools
  ADD COLUMN IF NOT EXISTS tree_path ltree;

-- Community groups (nested groups)
ALTER TABLE platform.community_groups
  ADD COLUMN IF NOT EXISTS tree_path ltree;

-- Clubs (regional hierarchy)
ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS tree_path ltree;

-- ════════════════════════════════════════════════════════
-- 3. GIST INDEXES FOR ltree QUERIES
-- ════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_tenants_tree
  ON core.tenants USING GIST (tree_path);

CREATE INDEX IF NOT EXISTS idx_schools_tree
  ON platform.martial_schools USING GIST (tree_path);

CREATE INDEX IF NOT EXISTS idx_groups_tree
  ON platform.community_groups USING GIST (tree_path);

CREATE INDEX IF NOT EXISTS idx_clubs_tree
  ON clubs USING GIST (tree_path);

-- Also add B-tree indexes for sorting/equality
CREATE INDEX IF NOT EXISTS idx_tenants_tree_btree
  ON core.tenants USING BTREE (tree_path);

CREATE INDEX IF NOT EXISTS idx_schools_tree_btree
  ON platform.martial_schools USING BTREE (tree_path);

-- ════════════════════════════════════════════════════════
-- 4. PATH GENERATION HELPER
--    Converts name to ltree-safe label
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION system.to_ltree_label(p_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(
    regexp_replace(
      unaccent(trim(p_name)),
      '[^a-zA-Z0-9]+', '_', 'g'  -- Replace non-alnum with underscore
    ),
    '^_+|_+$', '', 'g'           -- Trim leading/trailing underscores
  ));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ════════════════════════════════════════════════════════
-- 5. PATH MAINTENANCE TRIGGERS
--    Auto-update tree_path when parent changes
-- ════════════════════════════════════════════════════════

-- Tenant path: builds from parent_id chain
CREATE OR REPLACE FUNCTION trigger_update_tenant_path()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_path ltree;
  v_label TEXT;
BEGIN
  v_label := system.to_ltree_label(COALESCE(NEW.code, NEW.name, NEW.id::TEXT));

  IF NEW.parent_id IS NULL THEN
    NEW.tree_path := v_label::ltree;
  ELSE
    SELECT tree_path INTO v_parent_path
    FROM core.tenants WHERE id = NEW.parent_id;
    NEW.tree_path := COALESCE(v_parent_path, ''::ltree) || v_label::ltree;
  END IF;

  -- Cascade to children
  IF TG_OP = 'UPDATE' AND OLD.tree_path IS DISTINCT FROM NEW.tree_path THEN
    UPDATE core.tenants SET
      tree_path = NEW.tree_path || subpath(tree_path, nlevel(OLD.tree_path))
    WHERE tree_path <@ OLD.tree_path
      AND id != NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER maintain_tenant_path
    BEFORE INSERT OR UPDATE ON core.tenants
    FOR EACH ROW EXECUTE FUNCTION trigger_update_tenant_path();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- School path: builds from lineage
CREATE OR REPLACE FUNCTION trigger_update_school_path()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_path ltree;
  v_label TEXT;
  v_parent_id UUID;
BEGIN
  v_label := system.to_ltree_label(COALESCE(NEW.name, NEW.id::TEXT));

  -- Find parent from school_lineage
  SELECT parent_school_id INTO v_parent_id
  FROM platform.school_lineage
  WHERE child_school_id = NEW.id
  LIMIT 1;

  IF v_parent_id IS NULL THEN
    NEW.tree_path := v_label::ltree;
  ELSE
    SELECT tree_path INTO v_parent_path
    FROM platform.martial_schools WHERE id = v_parent_id;
    NEW.tree_path := COALESCE(v_parent_path, ''::ltree) || v_label::ltree;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER maintain_school_path
    BEFORE INSERT OR UPDATE ON platform.martial_schools
    FOR EACH ROW EXECUTE FUNCTION trigger_update_school_path();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ════════════════════════════════════════════════════════
-- 6. TREE QUERY FUNCTIONS
-- ════════════════════════════════════════════════════════

-- Get all descendants (children, grandchildren, etc.)
CREATE OR REPLACE FUNCTION system.get_subtree(
  p_table TEXT,      -- 'core.tenants', 'platform.martial_schools'
  p_node_id UUID,
  p_max_depth INT DEFAULT 10
)
RETURNS TABLE (
  node_id UUID,
  node_path ltree,
  depth INT
) AS $$
DECLARE
  v_path ltree;
BEGIN
  -- Get the node's path
  EXECUTE format('SELECT tree_path FROM %s WHERE id = $1', p_table)
  INTO v_path USING p_node_id;

  IF v_path IS NULL THEN RETURN; END IF;

  RETURN QUERY EXECUTE format(
    'SELECT id, tree_path, nlevel(tree_path) - nlevel($1) AS depth
     FROM %s
     WHERE tree_path <@ $1
       AND nlevel(tree_path) - nlevel($1) BETWEEN 1 AND $2
     ORDER BY tree_path',
    p_table
  ) USING v_path, p_max_depth;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get all ancestors (parent, grandparent, etc.)
CREATE OR REPLACE FUNCTION system.get_ancestors(
  p_table TEXT,
  p_node_id UUID
)
RETURNS TABLE (
  node_id UUID,
  node_path ltree,
  depth INT
) AS $$
DECLARE
  v_path ltree;
BEGIN
  EXECUTE format('SELECT tree_path FROM %s WHERE id = $1', p_table)
  INTO v_path USING p_node_id;

  IF v_path IS NULL THEN RETURN; END IF;

  RETURN QUERY EXECUTE format(
    'SELECT id, tree_path, nlevel($1) - nlevel(tree_path) AS depth
     FROM %s
     WHERE $1 <@ tree_path
       AND id != $2
     ORDER BY tree_path',
    p_table
  ) USING v_path, p_node_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get tree statistics
CREATE OR REPLACE FUNCTION system.tree_stats(p_table TEXT)
RETURNS TABLE (
  max_depth INT,
  total_nodes BIGINT,
  root_nodes BIGINT,
  leaf_nodes BIGINT,
  avg_children NUMERIC
) AS $$
BEGIN
  RETURN QUERY EXECUTE format(
    'WITH tree AS (
       SELECT tree_path, nlevel(tree_path) AS depth FROM %s WHERE tree_path IS NOT NULL
     )
     SELECT
       max(depth)::INT AS max_depth,
       count(*)::BIGINT AS total_nodes,
       count(*) FILTER (WHERE depth = 1)::BIGINT AS root_nodes,
       count(*) FILTER (WHERE NOT EXISTS (
         SELECT 1 FROM %s c WHERE c.tree_path <@ t.tree_path AND c.tree_path != t.tree_path
       ))::BIGINT AS leaf_nodes,
       CASE WHEN count(*) FILTER (WHERE depth > 0) > 0
         THEN round(count(*)::NUMERIC / NULLIF(count(DISTINCT subpath(tree_path, 0, depth - 1)), 0), 2)
         ELSE 0
       END AS avg_children
     FROM tree t',
    p_table, p_table
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ════════════════════════════════════════════════════════
-- 7. BACKFILL EXISTING DATA
--    Set tree_path for tenants with parent_id
-- ════════════════════════════════════════════════════════

-- Backfill tenants (triggers will fire but we need recursive update)
DO $$
DECLARE
  r RECORD;
  v_path ltree;
  v_label TEXT;
BEGIN
  -- First: set root tenants
  FOR r IN SELECT id, name, code FROM core.tenants WHERE parent_id IS NULL AND tree_path IS NULL LOOP
    v_label := system.to_ltree_label(COALESCE(r.code, r.name, r.id::TEXT));
    UPDATE core.tenants SET tree_path = v_label::ltree WHERE id = r.id;
  END LOOP;

  -- Then: cascade down (up to 10 levels)
  FOR i IN 1..10 LOOP
    FOR r IN
      SELECT c.id, c.name, c.code, p.tree_path AS parent_path
      FROM core.tenants c
      JOIN core.tenants p ON p.id = c.parent_id
      WHERE c.tree_path IS NULL AND p.tree_path IS NOT NULL
    LOOP
      v_label := system.to_ltree_label(COALESCE(r.code, r.name, r.id::TEXT));
      UPDATE core.tenants SET tree_path = r.parent_path || v_label::ltree WHERE id = r.id;
    END LOOP;
  END LOOP;
END $$;

COMMIT;
