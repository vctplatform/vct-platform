-- ===============================================================
-- VCT Platform — Migration 0076: MIGRATION TRACKING TABLE
-- P1 High: Track which migrations have been applied
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. MIGRATION TRACKING TABLE
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.schema_migrations (
  id              SERIAL PRIMARY KEY,
  version         VARCHAR(10) NOT NULL UNIQUE,   -- '0001', '0002', etc.
  name            VARCHAR(200) NOT NULL,          -- 'entity_records', etc.
  applied_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  applied_by      VARCHAR(100) DEFAULT current_user,
  execution_time  INTERVAL,
  checksum        VARCHAR(64),                    -- SHA-256 of migration file
  status          VARCHAR(20) NOT NULL DEFAULT 'applied'
                  CHECK (status IN ('applied', 'rolled_back', 'failed', 'skipped')),
  rollback_at     TIMESTAMPTZ,
  notes           TEXT
);

CREATE INDEX IF NOT EXISTS idx_migrations_version
  ON system.schema_migrations(version);

CREATE INDEX IF NOT EXISTS idx_migrations_status
  ON system.schema_migrations(status) WHERE status = 'applied';

-- ════════════════════════════════════════════════════════
-- 2. BACKFILL: Register all existing migrations
-- ════════════════════════════════════════════════════════

INSERT INTO system.schema_migrations (version, name, notes) VALUES
  ('0001', 'entity_records', 'Legacy EAV store'),
  ('0002', 'relational_schema', 'Full relational schema'),
  ('0003', 'scoring_events_refs', 'Scoring, events, reference data'),
  ('0004', 'enterprise_foundation', 'Schemas, UUIDv7, tenants, roles'),
  ('0005', 'existing_tables_upgrade', 'Tenant/audit backfill'),
  ('0006', 'training_module', 'Training courses, sessions'),
  ('0007', 'org_people', 'Org structure, people'),
  ('0008', 'finance', 'Payments, invoices'),
  ('0009', 'heritage', 'Cultural heritage, techniques'),
  ('0010', 'community', 'Posts, comments, social'),
  ('0011', 'system_partitions_views', 'Partitions, system views'),
  ('0012', 'advanced_enterprise', 'Advanced enterprise patterns'),
  ('0013', 'materialized_counters', 'Counters, stats'),
  ('0014', 'infrastructure', 'System infrastructure'),
  ('0015', 'structural_hardening', 'Schema hardening'),
  ('0016', 'fk_exclusion', 'FK + exclusion constraints'),
  ('0017', 'pii_advisory', 'PII advisory locks'),
  ('0018', 'permissions_workflows', 'Permissions, workflows'),
  ('0019', 'geo_analytics', 'Geo, analytics'),
  ('0020', 'bulk_config_i18n', 'Bulk import, config, i18n'),
  ('0021', 'event_sourcing', 'Event sourcing, CQRS'),
  ('0022', 'gdpr_masking', 'GDPR, data masking'),
  ('0023', 'flags_circuit_breaker', 'Feature flags, circuit breaker'),
  ('0024', 'cross_cutting_fixes', 'Cross-cutting fixes'),
  ('0025', 'maintenance_patterns', 'Maintenance patterns'),
  ('0026', 'production_readiness', 'Production readiness'),
  ('0027', 'v7_layer_a', 'UUIDv7 layer A'),
  ('0028', 'v7_layer_b', 'UUIDv7 layer B'),
  ('0029', 'v7_layer_c', 'UUIDv7 layer C'),
  ('0030', 'v7_layer_d', 'UUIDv7 layer D'),
  ('0031', 'uuid_v7_upgrade', 'UUIDv7 default upgrade'),
  ('0032', 'v7_seeds_functions', 'Seeds + functions'),
  ('0033', 'v7_aggregate_schemas', 'Aggregate schemas'),
  ('0034', 'v7_api_views', 'API views'),
  ('0035', 'associations', 'Associations'),
  ('0036', 'audit_logs', 'Audit logs'),
  ('0037', 'federation_core', 'Federation core'),
  ('0038', 'federation_master_data', 'Federation master data'),
  ('0039', 'federation_approvals', 'Federation approvals'),
  ('0040', 'federation_seed_data', 'Federation seed data'),
  ('0041', 'federation_pr', 'Federation PR'),
  ('0042', 'federation_international', 'Federation international'),
  ('0043', 'federation_workflows', 'Federation workflows'),
  ('0044', 'scoring_tables', 'Scoring tables'),
  ('0045', 'tournament_management', 'Tournament management'),
  ('0046', 'club_voduong', 'Club/Vo Duong'),
  ('0047', 'athlete_profiles', 'Athlete profiles'),
  ('0048', 'btc_parent_training', 'BTC + parent + training'),
  ('0049', 'tenant_isolation', 'Tenant isolation'),
  ('0050', 'fk_constraints', 'FK constraints integrity'),
  ('0051', 'schema_consolidation', 'Schema consolidation'),
  ('0052', 'auto_partition', 'Auto partition + connection'),
  ('0053', 'query_optimization', 'Query optimization'),
  ('0054', 'matview_refresh', 'Matview refresh strategy'),
  ('0055', 'data_lifecycle', 'Data lifecycle'),
  ('0056', 'health_monitoring', 'Health monitoring'),
  ('0057', 'archival_pipeline', 'Archival pipeline'),
  ('0058', 'pg17_testing', 'PG17 testing + docs'),
  ('0059', 'fuzzy_search_trgm', 'pg_trgm fuzzy search'),
  ('0060', 'elo_rating_system', 'ELO/Glicko ratings'),
  ('0061', 'query_cache_layer', 'Query result cache'),
  ('0062', 'cdc_outbox', 'CDC outbox pattern'),
  ('0063', 'ltree_hierarchy', 'ltree hierarchy'),
  ('0064', 'temporal_tables', 'Temporal versioning'),
  ('0065', 'brin_indexes', 'BRIN indexes'),
  ('0066', 'backup_vacuum', 'Backup + vacuum tuning'),
  ('0067', 'searchpath_webhooks', 'Search path + webhooks'),
  ('0068', 'matviews_abtesting', 'Matviews + A/B testing'),
  ('0069', 'graphql_functions', 'GraphQL functions'),
  ('0070', 'aiml_pipeline', 'AI/ML pipeline'),
  ('0071', 'enum_types', 'Native ENUM types'),
  ('0072', 'read_replica_routing', 'Read replica routing'),
  ('0073', 'dev_anonymization', 'Dev anonymization'),
  ('0074', 'fix_dual_tables', 'Fix dual table architecture'),
  ('0075', 'fix_rls_strict', 'Strict RLS mode'),
  ('0076', 'migration_tracking', 'This migration')
ON CONFLICT (version) DO NOTHING;

-- ════════════════════════════════════════════════════════
-- 3. HELPER FUNCTIONS
-- ════════════════════════════════════════════════════════

-- Check if a migration has been applied
CREATE OR REPLACE FUNCTION system.migration_applied(p_version TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM system.schema_migrations
    WHERE version = p_version AND status = 'applied'
  );
$$ LANGUAGE sql STABLE;

-- Get current schema version
CREATE OR REPLACE FUNCTION system.current_schema_version()
RETURNS TEXT AS $$
  SELECT version FROM system.schema_migrations
  WHERE status = 'applied'
  ORDER BY version DESC
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Schema drift detection view
DROP VIEW IF EXISTS system.v_migration_status CASCADE;
CREATE VIEW system.v_migration_status AS
SELECT
  version,
  name,
  status,
  applied_at,
  applied_by,
  execution_time,
  CASE
    WHEN status = 'applied' THEN '✅'
    WHEN status = 'rolled_back' THEN '⏪'
    WHEN status = 'failed' THEN '❌'
    ELSE '⏭️'
  END AS status_icon
FROM system.schema_migrations
ORDER BY version;

COMMIT;
