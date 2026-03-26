# VCT Platform Database Architecture

This document defines the unyielding architectural laws for the **VCT Platform Database Layer**. Whether the platform is hosted on a managed cloud (Supabase/Neon) or a self-hosted Vietnamese cloud server (Bizfly, VNG), these rules **MUST** be strictly enforced to ensure uncompromising data isolation, performance at scale, and bulletproof legal auditability.

---

## 1. Core Principles & Agnostic Design

- **PostgreSQL 15+ Mandatory**: The platform exclusively relies on PostgreSQL (version 15 or higher). MySQL, SQLite, and MongoDB are permanently banned.
- **Vendor Agnosticism**: The database architecture must not lock the platform into a specific vendor. Proprietary features (like Supabase Auth triggers directly touching business logic) must be abstracted. The entire database must theoretically be able to migrate from Neon to a Raw Ubuntu `docker-compose` setup within 4 hours.
- **UUIDv7 as Primary Keys**: All new tables must use `UUIDv7` (time-ordered UUIDs) for primary keys instead of `SERIAL` to prevent ID guessing (Insecure Direct Object Reference) and guarantee clustered index insertion speed. `UUIDv4` is deprecated for primary keys due to index fragmentation.

---

## 2. Multi-Tenancy & Schema Isolation

The VCT Platform manages multiple Federations, Clubs, and Tournaments. Data leakage across tenants is a critical security vulnerability.

- **Tenant Isolation**: Every query accessing user or operational data MUST either:
  1. Pass through a middleware that automatically injects `tenant_id` into the `context.Context` and appends `WHERE tenant_id = ?` to the query.
  2. Enforce physical exclusion using **Row-Level Security (RLS)** directly in PostgreSQL. (e.g., `CREATE POLICY tenant_isolation ON athletes USING (tenant_id = current_setting('app.current_tenant_id')::uuid);`).
- **Schema Segregation**: Use schemas to partition domains logically.
  - `public`: Core business tables (`athletes`, `tournaments`, `matches`).
  - `audit`: Tables storing historical trails (`audit_logs`).
  - `tenant`: Dynamic views or isolated specific federation extensions.

---

## 3. Connection Pooling Strategy
For modern Serverless/Edge compute (Vercel/Next.js) and concurrent Go backends, direct connections will instantly exhaust PostgreSQL memory.

- **Port 5432 (Direct / Session Mode)**: **BANNED** for application backends. ONLY allowed for CI/CD Migration runners (e.g., `golang-migrate`) and internal DBA terminal access.
- **Port 6543 (Transaction Mode / PgBouncer / Supavisor)**: **MANDATORY** for all Application servers (Go backend, Next.js). Allows tens of thousands of requests to multiplex over a small pool of actual DB connections.
- **Pool Exhaustion Prevention**: Default application database pool (`max_open_conns`) in Go must not exceed `25` per node to ensure overall DB health under horizontal scaling.

---

## 4. Migration & Version Control
Modifying the database state manually in Production via `pgAdmin` or `DBeaver` is a **FIRING OFFENSE**.

- **Migration-Based Control**: The schema is strictly controlled via ordered `UP`/`DOWN` migration scripts (e.g., using `golang-migrate` files like `00001_init.up.sql`). State-based schema diffs are forbidden in CI/CD.
- **Zero-Downtime Rule**: **NEVER** execute a `DROP COLUMN` or `ALTER COLUMN TYPE` directly in production while the old version of the API is still running.
- **Safe Rollout Strategy** (The 3-Step Dance):
  1. Add the new column `new_col` (Migration 1).
  2. Deploy Code that writes to BOTH `old_col` and `new_col`, and run a backfill script.
  3. Deploy Code that only reads/writes `new_col`, followed by a delayed Migration 2 to `DROP old_col` one week later.

---

## 5. Indexing & Query Performance (O(1) Scaling)

- **Mandatory Foreign Key Indexes**: PostgreSQL does *not* automatically index Foreign Keys. Every FK (e.g., `tournament_id`) MUST have a corresponding `CREATE INDEX` to prevent full table scans during `JOIN` or `DELETE CASCADE` operations.
- **Cursor-Based Pagination**: `OFFSET` and `LIMIT` (`OFFSET 50000 LIMIT 20`) are **EXPLICITLY BANNED** on tables with high growth potential (e.g., `match_events`, `audit_logs`). You MUST use Keyset/Cursor pagination (`WHERE id > :last_id ORDER BY id LIMIT 20`).
- **GIN & Partial Indexes**:
  - Use GIN indexes for JSONB fields (`metadata`).
  - Use Partial Indexes aggressively for Boolean flags (e.g., `CREATE INDEX active_users_idx ON users (id) WHERE is_active = true;`) to save RAM.

---

## 6. Audit Trails & Soft Deletion

Protect against unauthorized tampering and irreversible mistakes by platform administrators.

- **Soft Delete Mandatory**: The destructive `DELETE FROM <table>` is banned from Application code. All core business entities must implement `deleted_at (timestamptz)`. Deletions are strictly `UPDATE <table> SET deleted_at = NOW()`.
- **Immutable Audit Logging**: For hyper-sensitive objects (Belt Certifications, Official Scores), implement Triggers or Application-Layer interception that writes to an `audit_logs` table (Tracking: `actor_id`, `action`, `old_json`, `new_json`, `ip_address`).

---

## 7. Database Naming Conventions
A strict schema ensures cognitive uniformity for all developers.

- **Tables**: `snake_case`, strictly **plural** (`athletes`, `tournaments`, `match_scores`).
- **Primary Keys**: Always `id` (UUIDv7). **Never** `user_id` inside the `users` table.
- **Foreign Keys**: Singular table name + `_id` (`athlete_id`, `tournament_id`).
- **Booleans**: Always prefixed with `is_`, `has_`, or `can_` (`is_active`, `has_paid`).
- **Timestamps**: Always `timestamptz` (never `timestamp` without timezone). Standard columns: `created_at`, `updated_at`, `deleted_at`.
- **Enums/Status**: Avoid native PostgreSQL `ENUM` types because adding values requires taking a table lock. Use `VARCHAR(50)` with Application-Level validation and/or `CHECK (status IN ('PENDING', 'ACTIVE'))` constraints.

---

## 8. Ultimate SRE-Level Database Guard Rails
To ensure the database survives hyper-growth and extreme load without human intervention, these 4 advanced Site Reliability Engineering (SRE) rules are mandatory.

### 8.1 Table Partitioning (Phân Mảnh Bảng Dữ Liệu)
For tables projected to exceed 10 million rows per year (e.g., `audit_logs`, `match_events`).
- **Rule**: BANNED from being a single monolithic table. 
- **Solution**: MUST use **PostgreSQL Declarative Partitioning** by time (`RANGE (created_at)` per month). This maintains small index depths and allows instant data retention pruning (e.g., `DROP TABLE audit_logs_2024_01` takes 0.1s instead of a heavy `DELETE` taking hours and locking the table).

### 8.2 CQRS & Read Replicas (Tách Bạch Đọc/Ghi)
To prevent heavy analytics queries or tens of thousands of spectators requesting "Live Brackets" from degrading the Referee's ability to input scores.
- **Rule**: The Application Server MUST maintain 2 separate connection pools:
  1. `Primary Pool` (WRITE/Master): Exclusively for `INSERT/UPDATE/DELETE`.
  2. `Replica Pool` (READ/Follower): Exclusively for `SELECT` queries across public dashboards, rankings, and reporting.

### 8.3 Statement Timeouts (Cắt Phễu Truy Vấn Điên)
To prevent a single unoptimized query from exhausting the entire connection pool and causing cascading application failure.
- **Rule**: The Application DB Role MUST be configured with a strict `statement_timeout` (e.g., `SET statement_timeout = 5000;` / 5 seconds). Any query exceeding this limit is instantly aborted by Postgres. ONLY specific Backend Worker Roles or Migration Roles bypass this limit.

### 8.4 Autovacuum & Bloat Control (Quản Trị Rác MVCC)
PostgreSQL MVCC accumulates "dead tuples" during heavy `UPDATE` workflows (common in Scoring Modules), causing table and index bloat if Autovacuum doesn't trigger fast enough.
- **Rule**: High-churn tables MUST explicitly override default autovacuum thresholds.
  - e.g., `ALTER TABLE match_scores SET (autovacuum_vacuum_scale_factor = 0.02);` (Vacuum at 2% dead tuples instead of the default 20%, ensuring the index remains extremely fast and compact).
