-- Rollback 0063: ltree Hierarchy
BEGIN;
DROP FUNCTION IF EXISTS system.tree_stats CASCADE;
DROP FUNCTION IF EXISTS system.get_ancestors CASCADE;
DROP FUNCTION IF EXISTS system.get_subtree CASCADE;
DROP FUNCTION IF EXISTS trigger_update_school_path CASCADE;
DROP FUNCTION IF EXISTS trigger_update_tenant_path CASCADE;
DROP FUNCTION IF EXISTS system.to_ltree_label CASCADE;
DROP TRIGGER IF EXISTS maintain_tenant_path ON core.tenants;
DROP TRIGGER IF EXISTS maintain_school_path ON platform.martial_schools;
DROP INDEX IF EXISTS idx_tenants_tree; DROP INDEX IF EXISTS idx_tenants_tree_btree;
DROP INDEX IF EXISTS idx_schools_tree; DROP INDEX IF EXISTS idx_schools_tree_btree;
DROP INDEX IF EXISTS idx_groups_tree; DROP INDEX IF EXISTS idx_clubs_tree;
ALTER TABLE core.tenants DROP COLUMN IF EXISTS tree_path;
ALTER TABLE platform.martial_schools DROP COLUMN IF EXISTS tree_path;
ALTER TABLE platform.community_groups DROP COLUMN IF EXISTS tree_path;
ALTER TABLE clubs DROP COLUMN IF EXISTS tree_path;
COMMIT;
