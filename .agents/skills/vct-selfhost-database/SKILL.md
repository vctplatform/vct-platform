---
name: vct-selfhost-database
description: VCT Platform self-hosted PostgreSQL — Docker setup, local development, backup/restore, migrations, replication, and production hardening.
---

# VCT Platform Self-Hosted Database

> **When to activate**: Any task involving local PostgreSQL setup, Docker database, backups, migrations, database administration, or self-hosted production deployment.

---


> [!IMPORTANT]
> **SUPREME ARCHITECTURE DIRECTIVE**: You are strictly bound by the 19 architecture pillars documented in `docs/architecture/`. As a VCT AI Agent, your absolute highest priority is 100% compliance with these rules. You MUST NOT generate code, propose designs, or execute workflows that violate these foundational rules. They are unchangeable and strictly enforced.

## 1. Overview

> **CRITICAL ARCHITECTURE HUB**: You MUST follow all immutable rules defined in [docs/architecture/database-architecture.md](file:///d:/VCT PLATFORM/vct-platform/docs/architecture/database-architecture.md) for Multi-Tenancy (RLS), Connection Pooling, Migrations, and Soft Deletes.

VCT Platform uses **PostgreSQL 17 Alpine** via Docker for self-hosted deployments.

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│ Next.js      │────▶│ Go Backend  │────▶│ PostgreSQL   │
│ :3000        │     │ :18080       │     │ :5432        │
└─────────────┘     └─────────────┘     └──────────────┘
                         │
                    CachedStore
                    (in-memory TTL)
```

---

## 2. Docker Compose Setup

### Development (docker-compose.yml)
```yaml
services:
  postgres:
    image: postgres:17-alpine
    container_name: vct-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-vct_platform}
      POSTGRES_USER: ${POSTGRES_USER:-vct_admin}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-vct_secret_2026}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-vct_admin}"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
    driver: local
```

### Environment Variables
```env
# .env file
POSTGRES_DB=vct_platform
POSTGRES_USER=vct_admin
POSTGRES_PASSWORD=vct_secret_2026
POSTGRES_PORT=5432

# Backend connects to:
VCT_STORAGE_DRIVER=postgres
VCT_POSTGRES_PROVIDER=selfhost
VCT_POSTGRES_URL=postgres://vct_admin:vct_secret_2026@localhost:5432/vct_platform?sslmode=disable
VCT_DB_AUTO_MIGRATE=true
```

---

## 3. Quick Start Commands

```bash
# Start PostgreSQL only
docker compose up -d postgres

# Start everything (postgres + backend + frontend)
docker compose up -d

# View postgres logs
docker compose logs -f postgres

# Stop everything
docker compose down

# Reset database (CAUTION: deletes all data)
docker compose down -v && docker compose up -d postgres
```

### Using Makefile
```bash
make dev          # Start development environment
make db-up        # Start PostgreSQL only
make db-down      # Stop PostgreSQL
make db-reset     # Reset database (drop + recreate)
make db-migrate   # Run migrations manually
make db-seed      # Seed initial data
```

---

## 4. Connection Configuration

### Local Development
```env
VCT_POSTGRES_URL=postgres://vct_admin:vct_secret_2026@localhost:5432/vct_platform?sslmode=disable
VCT_PG_POOL_MAX_CONNS=25
VCT_PG_POOL_MIN_CONNS=5
VCT_PG_POOL_MAX_IDLE_TIME=30m
```

### Docker Network (container-to-container)
```env
# Backend connects to postgres service name, not localhost
VCT_POSTGRES_URL=postgres://vct_admin:vct_secret_2026@postgres:5432/vct_platform?sslmode=disable
```

### Production Self-Host
```env
VCT_POSTGRES_URL=postgres://vct_admin:STRONG_PASSWORD@db.yourdomain.com:5432/vct_platform?sslmode=require
VCT_PG_POOL_MAX_CONNS=50
VCT_PG_POOL_MIN_CONNS=10
VCT_PG_POOL_MAX_IDLE_TIME=15m
```

---

## 5. Migrations

### Migration System
- Location: `backend/migrations/`
- 85 migration pairs: `{NNNN}_{name}.sql` + `{NNNN}_{name}_down.sql`
- Auto-runs on backend startup when `VCT_DB_AUTO_MIGRATE=true`
- Docker: migrations also run via `/docker-entrypoint-initdb.d` volume mount

### Migration Categories
```
0001-0005: Core schema (entities, relational, scoring)
0006-0010: Features (training, finance, heritage, community)
0011-0017: Enterprise (partitions, views, PII, infrastructure)
0018-0026: Production (permissions, geo, i18n, GDPR, circuit breaker)
0027-0034: v7 upgrade (UUID v7, aggregate schemas, API views)
0035-0036: Associations & audit logs
```

### Creating New Migration
```bash
# File: backend/migrations/0037_your_feature.sql
CREATE TABLE IF NOT EXISTS your_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_your_table_status 
    ON your_table(status) WHERE status = 'active';

# File: backend/migrations/0037_your_feature_down.sql
DROP INDEX IF EXISTS idx_your_table_status;
DROP TABLE IF EXISTS your_table;
```

### Running Migrations Manually
```bash
# Via psql
psql "postgres://vct_admin:vct_secret_2026@localhost:5432/vct_platform" \
  -f backend/migrations/0037_your_feature.sql

# Rollback
psql "postgres://vct_admin:vct_secret_2026@localhost:5432/vct_platform" \
  -f backend/migrations/0037_your_feature_down.sql
```

---

## 6. Backup & Restore

### Full Database Backup
```bash
# Backup (compressed)
docker exec vct-postgres pg_dump -U vct_admin -Fc vct_platform > backup_$(date +%Y%m%d).dump

# Backup (SQL text)
docker exec vct-postgres pg_dump -U vct_admin vct_platform > backup_$(date +%Y%m%d).sql
```

### Restore
```bash
# From compressed dump
docker exec -i vct-postgres pg_restore -U vct_admin -d vct_platform --clean < backup.dump

# From SQL text
docker exec -i vct-postgres psql -U vct_admin -d vct_platform < backup.sql
```

### Automated Backup Script
```bash
#!/bin/bash
# scripts/backup-db.sh
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="vct_platform_${TIMESTAMP}.dump"

docker exec vct-postgres pg_dump -U vct_admin -Fc vct_platform > "${BACKUP_DIR}/${FILENAME}"

# Keep only last 7 days
find "${BACKUP_DIR}" -name "vct_platform_*.dump" -mtime +7 -delete

echo "Backup saved: ${FILENAME}"
```

---

## 7. Database Administration

### Connect to Database
```bash
# Via docker exec
docker exec -it vct-postgres psql -U vct_admin -d vct_platform

# Via psql
psql "postgres://vct_admin:vct_secret_2026@localhost:5432/vct_platform"
```

### Useful Queries
```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('vct_platform'));

-- Table sizes
SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename::regclass))
FROM pg_tables WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;

-- Active connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'vct_platform';

-- Running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE datname = 'vct_platform' AND state != 'idle'
ORDER BY duration DESC;

-- Index usage stats
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

---

## 8. Production Hardening

### PostgreSQL Configuration (postgresql.conf)
```conf
# Memory (adjust to your server RAM)
shared_buffers = 256MB              # 25% of RAM
effective_cache_size = 768MB        # 75% of RAM
work_mem = 16MB
maintenance_work_mem = 64MB

# WAL & Checkpoints
wal_buffers = 16MB
checkpoint_completion_target = 0.9
max_wal_size = 1GB

# Connection limits
max_connections = 100

# Logging
log_min_duration_statement = 1000   # Log queries > 1s
log_checkpoints = on
log_connections = on
log_disconnections = on
```

### Docker Production Setup
```yaml
# docker-compose.prod.yml additions
services:
  postgres:
    image: postgres:17-alpine
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1'
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infra/postgresql.conf:/etc/postgresql/postgresql.conf
    command: postgres -c config_file=/etc/postgresql/postgresql.conf
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}  # Strong password!
```

### Security Checklist
- [ ] Change default password from `vct_secret_2026`
- [ ] Set `VCT_ALLOW_DEMO_USERS=false`
- [ ] Set `VCT_JWT_SECRET` to a strong random value
- [ ] Enable SSL if exposing postgres port externally
- [ ] Restrict `POSTGRES_PORT` to internal network (remove from `ports:`)
- [ ] Set up automated backups
- [ ] Monitor disk space for WAL growth
- [ ] Set `max_connections` appropriately

---

## 9. Replication (Optional)

### Read Replica Setup
```yaml
# docker-compose with replica
services:
  postgres-primary:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: vct_platform
      POSTGRES_USER: vct_admin
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - primary_data:/var/lib/postgresql/data

  postgres-replica:
    image: postgres:17-alpine
    environment:
      PGUSER: replicator
      PGPASSWORD: ${REPLICATION_PASSWORD}
    command: |
      bash -c "
        pg_basebackup -h postgres-primary -D /var/lib/postgresql/data -U replicator -vP
        echo 'primary_conninfo = host=postgres-primary port=5432 user=replicator password=${REPLICATION_PASSWORD}' >> /var/lib/postgresql/data/postgresql.auto.conf
        touch /var/lib/postgresql/data/standby.signal
        postgres
      "
```

---

## 10. Troubleshooting

| Issue | Solution |
|-------|----------|
| `connection refused` | Check if postgres container is running: `docker compose ps` |
| `password authentication failed` | Verify `POSTGRES_PASSWORD` matches `VCT_POSTGRES_URL` |
| `database does not exist` | Container init creates DB from `POSTGRES_DB` env var |
| `permission denied` | Ensure user matches `POSTGRES_USER` |
| Migrations fail | Check migration order, use `IF NOT EXISTS` |
| Out of disk space | Check WAL files, run `VACUUM FULL` |
| Slow queries | Check indexes, run `EXPLAIN ANALYZE` |
| Data not persisting | Ensure `postgres_data` volume is not deleted (`docker compose down` without `-v`) |
