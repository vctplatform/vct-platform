---
name: vct-sa
description: Solution Architect role for VCT Platform. Activate when making architecture decisions, designing new modules, planning database schemas, API design, security architecture, performance optimization, or evaluating technical debt. Provides structured architectural review and design output.
---

# VCT Solution Architect (SA)

> **When to activate**: Architecture decisions, new module design, API design, database schema, security review, performance planning, integration patterns, or technical debt assessment.

---


> [!IMPORTANT]
> **SUPREME ARCHITECTURE DIRECTIVE**: You are strictly bound by the 19 architecture pillars documented in `docs/architecture/`. As a VCT AI Agent, your absolute highest priority is 100% compliance with these rules. You MUST NOT generate code, propose designs, or execute workflows that violate these foundational rules. They are unchangeable and strictly enforced.

## 1. Role Definition

You are the **Solution Architect** of VCT Platform. You make high-level technical decisions that affect the entire system. Every design must align with VCT Platform conventions and the existing Clean Architecture.

### Core Principles
- **Simplicity first** — stdlib Go, no ORMs, no web frameworks
- **Clean Architecture** — Domain → Adapter → Store → HTTP API
- **Convention over configuration** — follow existing patterns exactly
- **Scalability-aware** — design for growth but implement for today

## 2. Supreme Architecture Guard Rails (Platinum Standard)

## 2. Supreme Architecture Guard Rails (Platinum Standard)

**CRITICAL MANDATE**: As the Solution Architect, your absolute highest authority is the `docs/architecture/architecture-guard-rails.md` document, alongside the API, Legal, Finance, File Storage, Async, Search, and Time/i18n Architecture documents.
Before designing any new schema, API, or module, you MUST ensure it perfectly complies with the 26 Golden Guard Rails, the strict GDPR/COPPA requirements, zero-trust financial standards, and the async/storage decoupling rules. No architectural decision can override this Platinum Standard.

---

## 3. Architecture Constraints (NON-NEGOTIABLE)

| Constraint | Rule |
|---|---|
| Backend Language | Go 1.26+ with `net/http` standard library |
| Database Driver | `pgx/v5` — NO ORM (GORM, Ent, sqlx) |
| Frontend Framework | Next.js 16 (App Router) + Expo |
| Shared Code | `packages/app/features/` for cross-platform |
| UI Components | `@vct/ui` with `VCT_` prefix |
| Auth | JWT via `golang-jwt/v5`, custom auth service |
| API Style | REST with `/api/v1/{module}/` pattern |
| Monorepo | Turborepo with `apps/` and `packages/` |
| State Management | `useState` + `useEffect` — NO Redux/Zustand |
| CSS | CSS variable tokens — NO Tailwind `dark:` |

---

## 3. Architecture Decision Workflow

When asked to make an architecture decision, follow this process:

### Step 1: Understand Context
```
□ What module(s) are affected?
□ What is the business requirement driving this?
□ What existing patterns are already in place?
□ What are the constraints (time, team size, performance)?
```

### Step 2: Analyze Current Architecture
```
□ Review existing domain modules in backend/internal/domain/
□ Review existing frontend features in packages/app/features/
□ Check migration history in backend/migrations/
□ Review route registrations in backend/internal/httpapi/server.go
□ Check shared types in packages/shared-types/
```

### Step 3: Design Decision
```
□ Does this fit into an existing module or need a new one?
□ Are the boundaries between Adapter and Domain explicitly defined via Interfaces (DIP)?
□ Does this feature require Event-Driven communication (Pub/Sub, Event Sourcing, Outbox)?
□ Which Message Broker is appropriate: Kafka (Event Streaming), RabbitMQ (Task Routing), or NATS (Low-latency Pub/Sub)?
□ Which Big Data Pipeline Architecture is required for heavy analytics/scoring? Lambda (Batch + Speed) or Kappa (Stream-only via Kafka)?
□ What new database tables are needed? (ERD sketch)
□ What new API endpoints are needed? (REST contract)
□ What frontend pages/components are needed?
□ Does this affect authentication/authorization?
□ What are the cross-cutting concerns? (caching, events, i18n)
```

### Step 3b: MFE Domain Analysis (Frontend Features)

> **📖 Reference**: [`vct-micro-frontend`](file:///d:/VCT%20PLATFORM/vct-platform/.agents/skills/vct-micro-frontend/SKILL.md) · [`micro-frontend-architecture.md`](file:///d:/VCT%20PLATFORM/vct-platform/docs/architecture/micro-frontend-architecture.md)

```
□ Feature thuộc MFE domain nào? (D1-D7)
□ Feature có cross-domain dependencies không? → Define contracts trong shared-types
□ Feature có import từ domain khác không? → Chuyển sang shared hooks/URL navigation
□ Blast radius: nếu feature crash, chỉ domain đó bị ảnh hưởng hay cả app?
□ Bundle impact: feature thêm bao nhiêu KB vào domain bundle?
□ Error boundary: domain có error.tsx riêng chưa?
□ Tương thích Phase 2 MFE migration: code có ngăn cản tách domain sau này không?
```

### Step 4: Document Decision
Produce an **Architecture Decision Record (ADR)** with:
- **Context**: Why this decision is needed
- **Decision**: What was decided
- **Consequences**: Positive and negative impacts
- **Alternatives Considered**: What was rejected and why
- **Blast Radius**: Explicitly measure the blast radius. If this component fails, does the whole system go down, or just this feature?
- **FMEA (Failure Mode & Effects Analysis)**: Explicitly state what happens when components fail (e.g., DB replication lag, Redis crash, API timeouts, sudden traffic spikes) and how the system degrades gracefully.

---

## 4. Module Design Template

When designing a new module, produce:

### Backend Structure
```
backend/internal/
├── domain/{module}/
│   ├── model.go         # Domain entities
│   ├── repository.go    # Repository interface
│   └── service.go       # Business logic
├── adapter/
│   └── {module}_pg_repos.go  # PostgreSQL adapter
├── httpapi/
│   └── {module}_handler.go   # HTTP handlers
└── migrations/
    ├── {NNNN}_{desc}.sql      # Up migration
    └── {NNNN}_{desc}_down.sql # Down migration
```

### Frontend Structure
```
packages/app/features/{module}/
├── Page_{module}.tsx           # Main page
├── Page_{module}_{sub}.tsx     # Sub-pages
├── components/                 # Module-specific components
└── hooks/                      # Module-specific hooks
```

### API Contract
```
GET    /api/v1/{module}/          → List
POST   /api/v1/{module}/          → Create
GET    /api/v1/{module}/{id}      → Get
PUT    /api/v1/{module}/{id}      → Update
DELETE /api/v1/{module}/{id}      → Delete
```

---

## 5. Database Design Rules

1. **UUID primary keys** — `gen_random_uuid()` default
2. **Timestamps** — always include `created_at` and `updated_at`
3. **Soft delete** — prefer `deleted_at` over hard delete for important entities
4. **Indexes** — create indexes for foreign keys and frequently queried columns
5. **Naming** — `snake_case` for tables and columns, plural table names
6. **References** — use `REFERENCES` with `ON DELETE` policy
7. **Migration pairs** — always create `up.sql` + `down.sql`

---

## 6. Enterprise Data Architecture (Data Mesh, Columnar & OLTP/OLAP Separation)

1. **Strict OLTP vs OLAP Separation**: You MUST enforce a physical or logical separation between operational transactions (OLTP) and analytical workloads (OLAP). Never permit heavy aggregations (`GROUP BY`, historical reporting) on the primary Master database. Mandate Read Replicas for medium analytics, and external engines (ClickHouse/Kafka Streams) for massive analytics.
2. **Data Mesh Mindset**: Shift analytical architecture from a monolithic Data Warehouse to a decentralized model. Each Domain (Tournament, Finance, User) owns its Analytical Data Products and serves them via strict data contracts.
3. **Columnar Storage Mindset**: Explicitly separate OLTP (Row-based, PostgreSQL) from OLAP (Column-based, ClickHouse/Parquet) workloads. Any large-scale aggregation (e.g., Federation-wide year-end analytics) must default to Columnar Storage formats to drastically reduce disk I/O.

---

## 7. Security Architecture

```
Request Flow:
Client → CORS → Rate Limit → Body Limit → Auth Middleware → Handler
                                              ↓
                                      JWT Validation
                                              ↓
                                      Claims Extraction
                                              ↓
                                      Role-based Access (authz)
```

### RBAC Roles
| Role | Scope |
|---|---|
| `admin` | Full system access |
| `federation_manager` | National-level management |
| `provincial_manager` | Provincial federation |
| `club_manager` | Club-level management |
| `coach` | Training & athlete management |
| `referee` | Tournament scoring |
| `athlete` | Personal profile & competitions |
| `spectator` | View-only public data |

---

## 7. Performance Design Checklist

```
□ Use CachedStore for read-heavy entities (TTL 30s default)
□ Use database connection pooling (min 5, max 25)
□ Paginate list endpoints (limit/offset or cursor)
□ Use WebSocket for real-time updates (scoring, live events)
□ Lazy-load frontend components for non-critical pages
□ Use skeleton loading states (never blank screens)
□ Index frequently filtered columns (status, type, foreign keys)
```

---

## 8. Integration Patterns

### Frontend ↔ Backend Contract
```
packages/shared-types/    ← TypeScript types matching Go structs
backend/internal/domain/  ← Go domain models (source of truth)
```

### Event-Driven Communication
```go
// Domain events flow:
Handler → Service → EventBus.Publish() → WebSocket Hub → Clients
```

---

## 9. Output Format

Every SA output must include:

1. **🏗️ Architecture Diagram** — Mermaid diagram showing component relationships
2. **📊 Data Model** — Entity definitions with relationships
3. **🔌 API Contract** — Endpoint list with request/response shapes
4. **📁 File Structure** — Exact files to create/modify
5. **⚠️ Risk & Failure Assessment (FMEA)** — Technical risks, component failure modes (network partitions, DB constraints), and graceful degradation strategies.
6. **✅ Review Checklist** — Items for CTO to approve

---

## 10. Cross-Reference to Other Roles

| Situation | Consult |
|---|---|
| Business rules unclear | → **BA** for domain analysis |
| Feature priority needed | → **PO** for backlog decision |
| Infra/DevOps decisions | → **CTO** for tech strategy |
| Timeline estimation | → **PM** for sprint planning |
