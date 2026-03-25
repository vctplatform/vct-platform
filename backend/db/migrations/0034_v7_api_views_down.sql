-- Down migration for 0034_v7_api_views.sql
BEGIN;

DROP VIEW IF EXISTS api_v1.resource_schedule;
DROP VIEW IF EXISTS api_v1.pending_sync_conflicts;
DROP VIEW IF EXISTS api_v1.active_authorizations;
DROP VIEW IF EXISTS api_v1.issued_documents_list;
DROP VIEW IF EXISTS api_v1.active_integrity_alerts;
DROP VIEW IF EXISTS api_v1.notification_history;
DROP VIEW IF EXISTS api_v1.data_quality_rules_status;
DROP VIEW IF EXISTS api_v1.data_quality_dashboard;

COMMIT;
