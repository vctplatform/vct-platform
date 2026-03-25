-- Migration 0025 down: Remove audit logs table

DROP TABLE IF EXISTS system.audit_logs;
