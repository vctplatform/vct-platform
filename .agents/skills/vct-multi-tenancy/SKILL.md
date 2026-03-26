---
name: vct-multi-tenancy
description: Multi-tenant architecture for VCT Platform — tenant isolation, schema design, data scoping, auth context switching, and tenant-aware queries.
---

# VCT Platform Multi-Tenancy

> **When to activate**: Adding tenant-scoped features, creating tenant-aware queries, implementing data isolation, managing tenant configuration, or working with the `core.tenants` schema.

---


> [!IMPORTANT]
> **SUPREME ARCHITECTURE DIRECTIVE**: You are strictly bound by the 19 architecture pillars documented in `docs/architecture/`. As a VCT AI Agent, your absolute highest priority is 100% compliance with these rules. You MUST NOT generate code, propose designs, or execute workflows that violate these foundational rules. They are unchangeable and strictly enforced.

## 1. Architecture Overview

VCT Platform uses a **shared-database, schema-separated** multi-tenancy model with `tenant_id` foreign keys for data isolation.

```
┌──────────────────────────────────────────┐
│                 API Layer                │
│  (auth middleware extracts tenant_id)    │
├──────────────────────────────────────────┤
│              Service Layer               │
│  (all queries scoped by tenant_id)       │
├──────────────────────────────────────────┤
│             PostgreSQL Database          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │  core.*  │ │platform.*│ │ system.* │ │
│  │ (tenants │ │ (domain  │ │ (config, │ │
│  │  users)  │ │  data)   │ │  audit)  │ │
│  └──────────┘ └──────────┘ └──────────┘ │
└──────────────────────────────────────────┘
```

### Database Schemas
| Schema | Purpose | Tenant-scoped? |
|--------|---------|---------------|
| `core` | Tenants, users, roles | Users scoped by `tenant_id` |
| `platform` | Domain data (athletes, tournaments, etc.) | YES — all rows have `tenant_id` |
| `system` | Config, audit, CDC | Partially (config per tenant) |

---

## 2. Tenant Schema

Migration: `0004_enterprise_foundation.sql`

```sql
CREATE TABLE IF NOT EXISTS core.tenants (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(50) UNIQUE NOT NULL,    -- 'default', 'lien-doan-ha-noi', etc.
    name        VARCHAR(255) NOT NULL,
    domain      VARCHAR(255),                   -- Custom domain (optional)
    status      VARCHAR(20) DEFAULT 'active',   -- active, suspended, trial
    settings    JSONB DEFAULT '{}',             -- Tenant-specific config
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);
```

### System Tenant
```go
// internal/auth/pg_user_store.go
const SystemTenantID = "00000000-0000-7000-8000-000000000001"
```
- The system tenant is the root/default tenant
- All auth-level user records default to `SystemTenantID`
- New users without explicit `tenant_id` get `SystemTenantID`

---

## 3. Tenant-Aware Data

### User Model
```go
// internal/auth/user_store.go
type User struct {
    ID           string
    TenantID     string    // ← tenant isolation key
    Username     string
    Email        string
    Phone        string
    PasswordHash string
    FullName     string
    Role         string
    // ...
}
```

### Creating Users with Tenant
```go
tenantID := user.TenantID
if tenantID == "" {
    tenantID = SystemTenantID
}

_, err := db.Exec(`
    INSERT INTO core.users (id, tenant_id, username, ...) 
    VALUES ($1, $2, $3, ...)
    ON CONFLICT (tenant_id, username) DO NOTHING`,
    user.ID, tenantID, user.Username, ...)
```

> **IMPORTANT**: `UNIQUE(tenant_id, username)` — usernames are unique **per tenant**, not globally.

---

## 4. Auth Context Switching

Users can belong to multiple tenants/roles. Context switching allows changing the active scope:

```go
// internal/auth/multi_role.go
// POST /api/v1/auth/switch-context
func (s *Server) handleAuthSwitchContext(w http.ResponseWriter, r *http.Request) {
    // Switches active role + tenant scope
    // switchedUser.TenantID = binding.ScopeID
}
```

### Auth Claims with Tenant
```go
type Claims struct {
    UserID      string   `json:"userId"`
    TenantID    string   `json:"tenantId,omitempty"`
    Roles       []string `json:"roles"`
    ActiveRole  string   `json:"activeRole"`
}
```

---

## 5. Data Scoping Pattern

### Provincial Multi-Tenancy
The provincial module uses `province_id` as the tenant scope:

```go
// internal/domain/provincial/service.go
// All data is scoped by province_id for multi-tenant isolation.
```

### Query Pattern
```sql
-- Always include tenant_id in WHERE clause
SELECT * FROM platform.athletes 
WHERE tenant_id = $1 AND status = 'active';

-- Inserts always include tenant_id
INSERT INTO platform.athletes (id, tenant_id, name, ...)
VALUES ($1, $2, $3, ...);
```

---

## 6. Tenant Configuration

```sql
-- system.tenant_schema_config (migration 0067)
CREATE TABLE IF NOT EXISTS system.tenant_schema_config (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID REFERENCES core.tenants(id),
    config_key  VARCHAR(255) NOT NULL,
    config_val  JSONB DEFAULT '{}',
    UNIQUE(tenant_id, config_key)
);
```

### Settings per Tenant
```json
{
  "branding": { "logo": "url", "primary_color": "#0ea5e9" },
  "features": { "scoring": true, "community": false },
  "limits": { "max_athletes": 500, "max_clubs": 50 }
}
```

---

## 7. Admin Tenant Management

Frontend page: `Page_admin_tenants.tsx`

| Action | Endpoint | Role |
|--------|----------|------|
| List tenants | `GET /api/v1/admin/tenants` | super_admin |
| Create tenant | `POST /api/v1/admin/tenants` | super_admin |
| Update tenant | `PUT /api/v1/admin/tenants/{id}` | super_admin |
| Suspend tenant | `POST /api/v1/admin/tenants/{id}/suspend` | super_admin |

---

## 8. Anti-Patterns

1. ❌ **NEVER** query without `tenant_id` scoping (data leak across tenants)
2. ❌ **NEVER** allow users to access resources from other tenants
3. ❌ **NEVER** hardcode tenant IDs (except `SystemTenantID`)
4. ❌ **NEVER** create user without `tenant_id` (defaults to system tenant)
5. ❌ **NEVER** skip `ON CONFLICT (tenant_id, ...)` for unique constraints

---

## 9. New Tenant-Scoped Feature Checklist

1. [ ] Add `tenant_id UUID REFERENCES core.tenants(id)` to new tables
2. [ ] Add `UNIQUE(tenant_id, ...)` for business uniqueness constraints
3. [ ] Index `tenant_id` column
4. [ ] Scope all queries by `tenant_id` from auth claims
5. [ ] Test data isolation between tenants
6. [ ] Add RLS policies if needed (migration 0080)
