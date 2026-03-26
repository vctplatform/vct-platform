---
name: vct-migration-safety
description: Zero-downtime database migration patterns for VCT Platform — safe migration workflow, rollback procedures, locking awareness, multi-step column changes, data backfill strategies, and CI migration validation.
---

# VCT Platform Migration Safety

> **When to activate**: Creating new migrations, modifying tables in production, adding/removing columns, changing constraints, or planning schema changes that affect running applications.

---


> [!IMPORTANT]
> **SUPREME ARCHITECTURE DIRECTIVE**: You are strictly bound by the 19 architecture pillars documented in `docs/architecture/`. As a VCT AI Agent, your absolute highest priority is 100% compliance with these rules. You MUST NOT generate code, propose designs, or execute workflows that violate these foundational rules. They are unchangeable and strictly enforced.

## 1. Migration Architecture

```
backend/migrations/
├── 0001_entity_records.sql          # Up migration
├── 0001_entity_records_down.sql     # Down (rollback)
├── 0002_relational_schema.sql
├── 0002_relational_schema_down.sql
├── ...
└── NNNN_description.sql
```

### Naming Convention
```
{NNNN}_{snake_case_description}.sql       # Up
{NNNN}_{snake_case_description}_down.sql  # Down (rollback)
```
- `NNNN`: Sequential 4-digit number
- Both up AND down migrations are **MANDATORY**

---

## 2. Safe vs. Dangerous Operations

### ✅ Safe Operations (No Downtime)
| Operation | Why Safe |
|-----------|----------|
| `CREATE TABLE` | New table, no impact |
| `ADD COLUMN` (nullable, no default) | No table rewrite |
| `ADD COLUMN` with static default | PG 11+: metadata-only |
| `CREATE INDEX CONCURRENTLY` | No table lock |
| `DROP INDEX CONCURRENTLY` | No table lock |
| `ADD CHECK CONSTRAINT ... NOT VALID` | No validation scan |
| `VALIDATE CONSTRAINT` | Share Update Exclusive lock (reads/writes OK) |

### ⚠️ Dangerous Operations (Require Care)
| Operation | Risk | Mitigation |
|-----------|------|------------|
| `ADD COLUMN` with volatile default (e.g., `now()`) | Table rewrite + lock | Add nullable → backfill → set NOT NULL |
| `ALTER COLUMN SET NOT NULL` | Full table scan | Add CHECK NOT VALID → validate → set NOT NULL |
| `ALTER COLUMN TYPE` | Table rewrite | Create new column → copy → rename |
| `DROP COLUMN` | May block writers briefly | Set unused → remove in next deploy |
| `CREATE INDEX` (non-concurrent) | Blocks writes | Always use `CONCURRENTLY` |
| `RENAME COLUMN` | Breaks running code | Deploy new code first → rename → cleanup |

---

## 3. Multi-Step Column Addition (with default)

**Wrong** (locks table):
```sql
ALTER TABLE athletes ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
```

**Correct** (zero-downtime, 3 migrations):
```sql
-- Migration N: Add nullable column
ALTER TABLE athletes ADD COLUMN is_active BOOLEAN;

-- Migration N+1: Backfill existing rows (in batches)
UPDATE athletes SET is_active = true WHERE is_active IS NULL;

-- Migration N+2: Add NOT NULL constraint
ALTER TABLE athletes ADD CONSTRAINT athletes_is_active_not_null
  CHECK (is_active IS NOT NULL) NOT VALID;
ALTER TABLE athletes VALIDATE CONSTRAINT athletes_is_active_not_null;
ALTER TABLE athletes ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE athletes ALTER COLUMN is_active SET DEFAULT true;
ALTER TABLE athletes DROP CONSTRAINT athletes_is_active_not_null;
```

---

## 4. Safe Index Creation

**Wrong** (blocks writes):
```sql
CREATE INDEX idx_athletes_club ON athletes(club_id);
```

**Correct**:
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_athletes_club ON athletes(club_id);
```

> Note: `CONCURRENTLY` cannot run inside a transaction. The migration runner must support this.

---

## 5. Rollback Strategy

### Always Write Down Migrations
```sql
-- 0042_add_athlete_is_active.sql (UP)
ALTER TABLE athletes ADD COLUMN is_active BOOLEAN;

-- 0042_add_athlete_is_active_down.sql (DOWN)
ALTER TABLE athletes DROP COLUMN IF EXISTS is_active;
```

### Rollback Workflow
```bash
# 1. Check current status
cd backend && go run ./cmd/migrate status

# 2. Rollback last migration
cd backend && go run ./cmd/migrate down 1

# 3. Verify
cd backend && go run ./cmd/migrate status
```

---

## 6. Pre-Migration Checklist

```
□ Both up and down migration files created
□ Down migration tested (can rollback cleanly)
□ No ALTER TYPE on large tables (use multi-step)
□ Indexes use CONCURRENTLY
□ No NOT NULL without prior backfill
□ Foreign keys added with NOT VALID + VALIDATE
□ Database backup taken (or Neon branch created)
□ Application code handles both old and new schema
□ Migration tested on staging/dev first
□ Estimated lock time < 1 second
```

---

## 7. Batch Data Backfill

For large tables, update in batches to avoid long transactions:

```sql
-- Backfill in chunks of 1000
DO $$
DECLARE
    batch_size INT := 1000;
    updated INT;
BEGIN
    LOOP
        UPDATE athletes
        SET is_active = true
        WHERE id IN (
            SELECT id FROM athletes
            WHERE is_active IS NULL
            LIMIT batch_size
            FOR UPDATE SKIP LOCKED
        );
        GET DIAGNOSTICS updated = ROW_COUNT;
        EXIT WHEN updated = 0;
        COMMIT;
        PERFORM pg_sleep(0.1);  -- Small pause between batches
    END LOOP;
END $$;
```

---

## 8. CI Migration Validation

```yaml
# In GitHub Actions
- name: Test migrations
  run: |
    cd backend
    go run ./cmd/migrate up      # Run all up
    go run ./cmd/migrate down 0  # Rollback all
    go run ./cmd/migrate up      # Re-apply all (idempotency test)
```

---

## 9. Anti-Patterns

1. ❌ **NEVER** run `ALTER TABLE ... ADD COLUMN ... DEFAULT now()` on large tables
2. ❌ **NEVER** skip the down migration — **always** write rollback SQL
3. ❌ **NEVER** use `CREATE INDEX` without `CONCURRENTLY` on production
4. ❌ **NEVER** rename columns while the old code is still running
5. ❌ **NEVER** deploy migrations without testing rollback
6. ❌ **NEVER** modify an already-applied migration — create a new one
7. ❌ **NEVER** drop columns that running application code still references
