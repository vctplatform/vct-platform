-- ═══════════════════════════════════════════════════════════════
-- VCT PLATFORM — Migration 0039: Approval Workflow Tables
-- Generic approval request system for federation operations
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS approval_requests (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_code  VARCHAR(50) NOT NULL,         -- e.g. "club_registration", "belt_promotion"
    entity_type    VARCHAR(50) NOT NULL,         -- e.g. "club", "belt_exam"
    entity_id      UUID        NOT NULL,
    requester_id   UUID        NOT NULL,
    requester_name TEXT        NOT NULL,
    current_step   INT         NOT NULL DEFAULT 1,
    status         VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, DRAFT
    notes          TEXT,
    submitted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_approvals_status       ON approval_requests (status);
CREATE INDEX idx_approvals_workflow     ON approval_requests (workflow_code);
CREATE INDEX idx_approvals_requester    ON approval_requests (requester_id);
CREATE INDEX idx_approvals_entity       ON approval_requests (entity_type, entity_id);
CREATE INDEX idx_approvals_submitted_at ON approval_requests (submitted_at DESC);
