---
name: vct-subscription
description: SaaS subscription and billing management for VCT Platform — plans, subscriptions, billing cycles, renewals, upgrades, and admin management.
---

# VCT Platform Subscription & Billing

> **When to activate**: Working with subscription plans, billing cycles, subscription lifecycle (create/renew/cancel/upgrade/suspend), or the admin subscriptions page.

---


> [!IMPORTANT]
> **SUPREME ARCHITECTURE DIRECTIVE**: You are strictly bound by the 19 architecture pillars documented in `docs/architecture/`. As a VCT AI Agent, your absolute highest priority is 100% compliance with these rules. You MUST NOT generate code, propose designs, or execute workflows that violate these foundational rules. They are unchangeable and strictly enforced.

## 1. Architecture

```
finance/ domain package
├── subscription.go              # Models: Plan, Subscription, BillingCycle, RenewalLog
├── subscription_service.go      # Business logic: Subscribe, Renew, Cancel, Upgrade
├── postgres_subscription_store.go # PostgreSQL repository
└── errors.go                    # ErrNotFound, ErrConflict, ErrForbidden, ErrValidation

httpapi/
└── subscription_handler.go      # 15 HTTP endpoints (473 lines)

migrations/
└── 0085_subscriptions.sql       # Tables: subscription_plans, subscriptions, billing_cycles, renewal_logs
```

---

## 2. Database Schema

Migration: `0085_subscriptions.sql`

### Subscription Plans
```sql
CREATE TABLE platform.subscription_plans (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID REFERENCES core.tenants(id),
    code         VARCHAR(50) UNIQUE NOT NULL,   -- 'free', 'basic', 'pro', 'enterprise'
    name         VARCHAR(255) NOT NULL,
    description  TEXT,
    entity_type  VARCHAR(50),                   -- 'club', 'federation', 'provincial'
    features     JSONB DEFAULT '[]',            -- Feature list
    price        NUMERIC(12,2) DEFAULT 0,
    currency     VARCHAR(3) DEFAULT 'VND',
    duration_days INTEGER DEFAULT 365,
    max_members  INTEGER,
    max_events   INTEGER,
    is_active    BOOLEAN DEFAULT true,
    sort_order   INTEGER DEFAULT 0,
    created_at   TIMESTAMPTZ DEFAULT now(),
    updated_at   TIMESTAMPTZ DEFAULT now()
);
```

### Subscriptions
```sql
CREATE TABLE platform.subscriptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID REFERENCES core.tenants(id),
    plan_id         UUID REFERENCES platform.subscription_plans(id),
    plan_code       VARCHAR(50),
    plan_name       VARCHAR(255),
    entity_type     VARCHAR(50),                  -- 'club', 'federation'
    entity_id       UUID,                         -- Club/Federation ID
    entity_name     VARCHAR(255),
    status          VARCHAR(20) DEFAULT 'active',  -- active, cancelled, expired, suspended
    start_date      TIMESTAMPTZ,
    end_date        TIMESTAMPTZ,
    auto_renew      BOOLEAN DEFAULT true,
    cancel_reason   TEXT,
    cancelled_at    TIMESTAMPTZ,
    created_by      UUID,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);
```

---

## 3. Subscription Lifecycle

```
             ┌──────────┐
             │  Created  │
             └────┬─────┘
                  ▼
           ┌──────────┐
    ┌──────│  Active   │──────┐
    │      └────┬─────┘      │
    │           │             │
    ▼           ▼             ▼
┌────────┐ ┌────────┐  ┌──────────┐
│Renewed │ │Upgraded│  │Suspended │
│(→Active)│ │(→Active)│  └────┬─────┘
└────────┘ └────────┘       │
                             ▼
                       ┌──────────┐
              ┌────────│Cancelled │
              │        └──────────┘
              ▼
        ┌──────────┐
        │ Expired  │
        └──────────┘
              │
              ▼ (Reactivate)
        ┌──────────┐
        │  Active  │
        └──────────┘
```

### Status Transitions
| From | Action | To |
|------|--------|-----|
| active | `renew` | active (new billing cycle) |
| active | `cancel` | cancelled |
| active | `suspend` (admin) | suspended |
| active | `upgrade` | active (new plan) |
| active | (expiry) | expired |
| cancelled | `reactivate` (admin) | active |
| suspended | `reactivate` (admin) | active |
| expired | `reactivate` (admin) | active |

---

## 4. API Endpoints

### Plans Management (admin only)
```
GET    /api/v1/finance/plans              # List plans (?entity_type=club)
POST   /api/v1/finance/plans              # Create plan
GET    /api/v1/finance/plans/{id}         # Get plan
PUT    /api/v1/finance/plans/{id}         # Update plan
DELETE /api/v1/finance/plans/{id}         # Deactivate plan
```

### Subscription CRUD
```
GET    /api/v1/finance/subscriptions              # List (?entity_type, ?status, ?sort_by)
POST   /api/v1/finance/subscriptions              # Subscribe (create + first billing cycle)
GET    /api/v1/finance/subscriptions/{id}         # Get subscription detail
```

### Subscription Actions
```
POST   /api/v1/finance/subscriptions/{id}/renew       # Renew subscription
POST   /api/v1/finance/subscriptions/{id}/cancel      # Cancel (with reason)
POST   /api/v1/finance/subscriptions/{id}/upgrade     # Upgrade/downgrade plan
POST   /api/v1/finance/subscriptions/{id}/reactivate  # Reactivate (admin)
POST   /api/v1/finance/subscriptions/{id}/suspend     # Suspend (admin)
PUT    /api/v1/finance/subscriptions/{id}/auto-renew  # Toggle auto-renew
```

### Billing
```
GET    /api/v1/finance/subscriptions/{id}/billing-cycles   # Billing history
GET    /api/v1/finance/subscriptions/{id}/renewal-logs     # Renewal audit trail
GET    /api/v1/finance/subscriptions/expiring              # Expiring in 30 days
GET    /api/v1/finance/billing-cycles                      # All billing cycles
POST   /api/v1/finance/billing-cycles/{id}/pay             # Mark paid
```

---

## 5. Domain Models

```go
type SubscriptionPlan struct {
    ID           string   `json:"id"`
    Code         string   `json:"code"`          // 'free', 'basic', 'pro'
    Name         string   `json:"name"`
    EntityType   string   `json:"entity_type"`   // 'club', 'federation'
    Features     []string `json:"features"`
    Price        float64  `json:"price"`
    Currency     string   `json:"currency"`      // 'VND'
    DurationDays int      `json:"duration_days"`
    IsActive     bool     `json:"is_active"`
}

type SubscriptionStatus string
const (
    StatusActive    SubscriptionStatus = "active"
    StatusCancelled SubscriptionStatus = "cancelled"
    StatusExpired   SubscriptionStatus = "expired"
    StatusSuspended SubscriptionStatus = "suspended"
)

type Subscription struct {
    ID         string             `json:"id"`
    PlanID     string             `json:"plan_id"`
    EntityType string             `json:"entity_type"`
    EntityID   string             `json:"entity_id"`
    Status     SubscriptionStatus `json:"status"`
    StartDate  time.Time          `json:"start_date"`
    EndDate    time.Time          `json:"end_date"`
    AutoRenew  bool               `json:"auto_renew"`
}
```

---

## 6. RBAC

| Action | Required Roles |
|--------|---------------|
| List/Get plans | Any authenticated |
| Create/Update/Delete plans | `admin`, `super_admin` |
| Subscribe | Entity owner + admin |
| Renew, Cancel | Subscription owner |
| Suspend, Reactivate | `admin`, `super_admin` only |
| Toggle auto-renew | Subscription owner |
| Mark billing paid | `admin`, `super_admin` |

---

## 7. Frontend

- Admin page: `Page_admin_subscriptions.tsx`
- Hook: `useFinanceAPI` (subscription methods)
- i18n keys: `admin.subscriptions.*`

---

## 8. Anti-Patterns

1. ❌ **NEVER** allow non-admin to suspend/reactivate subscriptions
2. ❌ **NEVER** delete subscription records — use status changes
3. ❌ **NEVER** skip billing cycle creation on subscribe/renew
4. ❌ **NEVER** hardcode plan features — use JSONB `features` array
