-- Migration 0008 DOWN
BEGIN;
DROP TABLE IF EXISTS platform.budget_items CASCADE;
DROP TABLE IF EXISTS platform.tournament_budgets CASCADE;
DROP TABLE IF EXISTS platform.sponsorships CASCADE;
DROP TABLE IF EXISTS platform.invoice_items CASCADE;
DROP TABLE IF EXISTS platform.invoices CASCADE;
DROP TABLE IF EXISTS platform.payments CASCADE;
DROP TABLE IF EXISTS platform.fee_schedules CASCADE;
COMMIT;
