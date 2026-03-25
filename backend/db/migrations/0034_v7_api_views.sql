-- ===============================================================
-- VCT Platform — Migration 0034: V7.0 API STABLE VIEWS
-- Read-only views in api_v1 schema for application consumption
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. DATA QUALITY DASHBOARD VIEW
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW api_v1.data_quality_dashboard AS
SELECT
    s.table_name,
    s.overall_score,
    s.completeness_score,
    s.accuracy_score,
    s.consistency_score,
    s.timeliness_score,
    s.calculated_at,
    (
        SELECT count(*) FROM system.data_quality_results r
        JOIN system.data_quality_rules rl ON rl.id = r.rule_id
        WHERE rl.table_name = s.table_name AND r.status = 'CRITICAL'
    ) AS critical_count,
    (
        SELECT count(*) FROM system.data_quality_results r
        JOIN system.data_quality_rules rl ON rl.id = r.rule_id
        WHERE rl.table_name = s.table_name AND r.status = 'WARNING'
    ) AS warning_count
FROM system.data_quality_scores s
WHERE s.calculated_at = (
    SELECT MAX(s2.calculated_at) FROM system.data_quality_scores s2
    WHERE s2.table_name = s.table_name
);

-- ════════════════════════════════════════════════════════
-- 2. DATA QUALITY RULES STATUS VIEW
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW api_v1.data_quality_rules_status AS
SELECT
    rl.id AS rule_id,
    rl.rule_name,
    rl.table_name,
    rl.rule_type,
    rl.severity,
    rl.is_active,
    r.status AS last_status,
    r.violation_count AS last_violations,
    r.total_records AS last_total,
    r.violation_rate AS last_rate,
    r.checked_at AS last_checked
FROM system.data_quality_rules rl
LEFT JOIN LATERAL (
    SELECT * FROM system.data_quality_results res
    WHERE res.rule_id = rl.id
    ORDER BY res.checked_at DESC LIMIT 1
) r ON true
WHERE rl.is_active = true;

-- ════════════════════════════════════════════════════════
-- 3. NOTIFICATION HISTORY VIEW
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW api_v1.notification_history AS
SELECT
    d.id,
    d.user_id,
    d.category,
    d.title,
    d.body,
    d.action_url,
    d.status,
    d.channels_attempted,
    d.channels_delivered,
    d.channels_failed,
    d.created_at,
    d.delivered_at,
    d.read_at
FROM system.notification_deliveries d
ORDER BY d.created_at DESC;

-- ════════════════════════════════════════════════════════
-- 4. ACTIVE INTEGRITY ALERTS VIEW
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW api_v1.active_integrity_alerts AS
SELECT
    ia.id,
    ia.alert_type,
    ia.severity,
    ia.trigger_source,
    ia.tournament_id,
    ia.match_id,
    ia.athlete_ids,
    ia.referee_ids,
    ia.status,
    ia.assigned_to,
    ia.investigation_notes,
    ia.reported_at,
    ia.resolved_at,
    ia.metadata
FROM tournament.integrity_alerts ia
WHERE ia.status NOT IN ('CLOSED', 'UNSUBSTANTIATED')
ORDER BY
    CASE ia.severity
        WHEN 'CRITICAL' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'MEDIUM' THEN 3
        WHEN 'LOW' THEN 4
    END,
    ia.reported_at DESC;

-- ════════════════════════════════════════════════════════
-- 5. ISSUED DOCUMENTS VIEW (with verification)
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW api_v1.issued_documents_list AS
SELECT
    doc.id,
    doc.document_number,
    dt.template_type,
    doc.recipient_type,
    doc.recipient_id,
    doc.document_data,
    doc.verification_code,
    doc.verification_url,
    doc.issued_at,
    doc.expires_at,
    doc.revoked_at,
    CASE
        WHEN doc.revoked_at IS NOT NULL THEN 'REVOKED'
        WHEN doc.expires_at IS NOT NULL AND doc.expires_at < now() THEN 'EXPIRED'
        ELSE 'VALID'
    END AS document_status
FROM platform.issued_documents doc
JOIN platform.document_templates dt ON dt.id = doc.template_id
ORDER BY doc.issued_at DESC;

-- ════════════════════════════════════════════════════════
-- 6. AUTHORIZATION CHECK VIEW (simplified ReBAC lookup)
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW api_v1.active_authorizations AS
SELECT
    at.id,
    at.object_type,
    at.object_id,
    at.relation,
    at.subject_type,
    at.subject_id,
    at.condition,
    at.granted_at,
    at.expires_at
FROM core.authorization_tuples at
WHERE at.revoked_at IS NULL
    AND (at.expires_at IS NULL OR at.expires_at > now());

-- ════════════════════════════════════════════════════════
-- 7. SYNC CONFLICTS PENDING VIEW
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW api_v1.pending_sync_conflicts AS
SELECT
    sc.id,
    sc.table_name,
    sc.record_id,
    sc.resolution_strategy,
    sc.status,
    sc.version_a,
    sc.version_a_timestamp,
    sc.version_b,
    sc.version_b_timestamp,
    sc.detected_at
FROM system.sync_conflicts sc
WHERE sc.status IN ('DETECTED', 'PENDING_MANUAL', 'ESCALATED')
ORDER BY sc.detected_at DESC;

-- ════════════════════════════════════════════════════════
-- 8. RESOURCE SCHEDULING VIEW
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW api_v1.resource_schedule AS
SELECT
    ra.id,
    ra.resource_type,
    ra.resource_id,
    ra.tournament_id,
    ra.available_from,
    ra.available_until,
    ra.max_continuous_hours,
    ra.break_minutes,
    ra.conflict_resource_ids
FROM tournament.resource_availability ra
ORDER BY ra.tournament_id, ra.resource_type, ra.available_from;

COMMIT;
