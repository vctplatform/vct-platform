-- Migration 0025: Audit logs persistence
-- Store auth and system audit logs in the database instead of in-memory

-- Create audit_logs table in the system schema (created in 0004)
CREATE TABLE IF NOT EXISTS system.audit_logs (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action        TEXT NOT NULL,                  -- e.g. 'auth.login', 'auth.refresh', 'auth.revoke'
    actor         TEXT NOT NULL DEFAULT '',        -- username or system identifier
    role          TEXT NOT NULL DEFAULT '',        -- role at time of action
    success       BOOLEAN NOT NULL DEFAULT true,
    ip_address    TEXT NOT NULL DEFAULT '',
    user_agent    TEXT NOT NULL DEFAULT '',
    details       JSONB,                          -- additional context
    error_message TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_logs_action     ON system.audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor      ON system.audit_logs (actor);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON system.audit_logs (created_at DESC);

-- Composite index for filtered queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_action
    ON system.audit_logs (actor, action, created_at DESC);

-- Comment
COMMENT ON TABLE system.audit_logs IS 'Persistent audit trail for auth and system events';
