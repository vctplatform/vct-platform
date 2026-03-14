---
name: vct-cloud-database
description: VCT Platform cloud database setup — Neon & Supabase PostgreSQL integration, connection pooling, SSL, migrations, and production deployment.
---

# VCT Platform Cloud Database (Neon & Supabase)

> **When to activate**: Any task involving cloud database setup, Neon/Supabase configuration, production deployment, connection strings, or cloud-specific PostgreSQL features.

---

## 1. Overview

VCT Platform supports two cloud PostgreSQL providers:

| Provider | Best For | Free Tier |
|----------|----------|-----------|
| **Neon** | Serverless, branching, auto-scaling | 0.5 GB storage, 190 compute hours |
| **Supabase** | Full BaaS (auth, storage, realtime) | 500 MB database, 50K auth users |

Both are configured via environment variables — **zero code changes** required.

---

## 2. Environment Configuration

### Common Settings
```env
VCT_STORAGE_DRIVER=postgres
VCT_DB_AUTO_MIGRATE=true
VCT_CACHE_TTL=30s
VCT_CACHE_MAX_ENTRIES=2000
```

### Neon Configuration
```env
VCT_POSTGRES_PROVIDER=neon
VCT_POSTGRES_URL=postgres://user:password@ep-xxx-xxx-123456.us-east-2.aws.neon.tech/neondb?sslmode=require

# Connection pool tuning for serverless
VCT_PG_POOL_MAX_CONNS=10       # Neon free tier recommends lower
VCT_PG_POOL_MIN_CONNS=1        # Allow scale to zero
VCT_PG_POOL_MAX_IDLE_TIME=5m   # Shorter idle for serverless
```

### Supabase Configuration
```env
VCT_POSTGRES_PROVIDER=supabase
VCT_POSTGRES_URL=postgres://postgres.[project-ref]:password@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require

# Supabase connection pooling (via Supavisor)
VCT_PG_POOL_MAX_CONNS=15
VCT_PG_POOL_MIN_CONNS=2
VCT_PG_POOL_MAX_IDLE_TIME=15m
```

---

## 3. Neon-Specific Guide

### Setup Steps
1. Create project at [console.neon.tech](https://console.neon.tech)
2. Copy connection string (with `sslmode=require`)
3. Set `VCT_POSTGRES_URL` and `VCT_POSTGRES_PROVIDER=neon`

### Neon Features to Leverage
| Feature | How VCT Uses It |
|---------|----------------|
| **Branching** | Create dev branches from production data |
| **Auto-suspend** | Compute suspends after 5min idle (free tier) |
| **Connection pooling** | Use `-pooler` endpoint for high concurrency |
| **Point-in-time restore** | Recover from migration mistakes |

### Connection String Format
```
# Direct (for migrations, admin)
postgres://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# Pooled (for app — recommended)
postgres://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Branching for Development
```bash
# Create a dev branch via Neon CLI or console
neonctl branches create --name dev --project-id xxx

# Point local dev to branch
VCT_POSTGRES_URL=postgres://user:pass@ep-branch-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

---

## 4. Supabase-Specific Guide

### Setup Steps
1. Create project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Go to Settings → Database → Connection String
3. Choose **Session Mode** (port 5432) for migrations
4. Choose **Transaction Mode** (port 6543) for app connections
5. Set `VCT_POSTGRES_URL` and `VCT_POSTGRES_PROVIDER=supabase`

### Connection String Format
```
# Session mode (migrations, DDL)
postgres://postgres.[ref]:pass@aws-0-[region].pooler.supabase.com:5432/postgres

# Transaction mode (app, recommended)
postgres://postgres.[ref]:pass@aws-0-[region].pooler.supabase.com:6543/postgres

# Direct (bypasses pooler)
postgres://postgres:pass@db.[ref].supabase.co:5432/postgres
```

### Supabase-Specific Notes
- Use **Transaction mode** (port 6543) for the app — better for connection pooling
- Use **Session mode** (port 5432) for running migrations (`VCT_DB_AUTO_MIGRATE`)
- Supabase adds default schemas (`auth`, `storage`) — VCT uses `public` schema only
- Row Level Security (RLS): **NOT enabled** by VCT (app uses JWT at API level)

---

## 5. SSL & Security

### Both Providers
```env
# Always use SSL for cloud
?sslmode=require
```

### Production Security Checklist
- [ ] `sslmode=require` in connection string
- [ ] JWT secret changed from default: `VCT_JWT_SECRET=<random-64-chars>`
- [ ] Demo users DISABLED: `VCT_ALLOW_DEMO_USERS=false`
- [ ] CORS origins restricted: `VCT_CORS_ORIGINS=https://yourdomain.com`
- [ ] Database password is strong and unique
- [ ] IP allowlist configured (if provider supports it)

---

## 6. Migrations on Cloud

### Auto-Migration
```env
VCT_DB_AUTO_MIGRATE=true  # Runs all 36 migrations on startup
```

### Manual Migration
```bash
# Connect directly and run migration files
psql "postgres://user:pass@host/db?sslmode=require" -f backend/migrations/0037_new_feature.sql
```

### Rollback
```bash
psql "postgres://user:pass@host/db?sslmode=require" -f backend/migrations/0037_new_feature_down.sql
```

### Migration Safety on Cloud
- **Always test migrations on a branch first** (Neon branching or Supabase staging)
- All migrations use `IF NOT EXISTS` / `IF EXISTS` for idempotency
- Each migration has a corresponding `_down.sql` for rollback
- Never truncate or drop tables in production migrations

---

## 7. Performance Tuning

### Connection Pool Sizing

| Environment | Max Conns | Min Conns | Max Idle |
|------------|-----------|-----------|----------|
| Dev (local) | 5 | 1 | 30m |
| Neon Free | 10 | 1 | 5m |
| Neon Pro | 25 | 5 | 15m |
| Supabase Free | 10 | 2 | 10m |
| Supabase Pro | 25 | 5 | 15m |

### Cache Layer
```env
VCT_CACHE_TTL=30s           # Item expiry
VCT_CACHE_MAX_ENTRIES=2000  # Max cached items
```
- CachedStore wraps PostgreSQL with in-memory TTL cache
- Reduces read queries by ~80% for list operations
- Cache invalidated on write operations

---

## 8. Docker Compose for Cloud DB

When using cloud database, the `postgres` service is not needed:

```yaml
# docker-compose.cloud.yml
services:
  backend:
    build:
      context: ./backend
    environment:
      VCT_STORAGE_DRIVER: postgres
      VCT_POSTGRES_PROVIDER: neon    # or supabase
      VCT_POSTGRES_URL: ${VCT_POSTGRES_URL}
      VCT_DB_AUTO_MIGRATE: "true"
    ports:
      - "18080:18080"

  frontend:
    build:
      context: .
      dockerfile: apps/next/Dockerfile
    environment:
      NEXT_PUBLIC_API_BASE_URL: http://backend:18080
    ports:
      - "3000:3000"
```

---

## 9. Monitoring & Debugging

### Health Check
```
GET /healthz
→ { "storage": { "driver": "postgres", "provider": "neon" }, "cache": {...} }
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Connection timeout | Check SSL mode, firewall, IP allowlist |
| Too many connections | Reduce `VCT_PG_POOL_MAX_CONNS` |
| Neon cold start | First request after idle takes ~500ms, use min_conns=1 |
| Supabase RLS blocking | VCT doesn't use RLS, ensure tables are in `public` |
| Migration conflict | Use `IF NOT EXISTS` in all DDL statements |
