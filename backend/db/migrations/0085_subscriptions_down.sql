-- ===============================================================
-- VCT Platform — Migration 0085 DOWN: Remove Subscription & Billing
-- ===============================================================

BEGIN;

DROP TABLE IF EXISTS platform.renewal_logs CASCADE;
DROP TABLE IF EXISTS platform.billing_cycles CASCADE;
DROP TABLE IF EXISTS platform.subscriptions CASCADE;
DROP TABLE IF EXISTS platform.subscription_plans CASCADE;

COMMIT;
