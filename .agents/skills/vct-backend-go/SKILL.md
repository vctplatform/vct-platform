---
name: vct-backend-go
description: VCT Platform Go 1.26 backend — Clean Architecture, domain modules, HTTP API, PostgreSQL adapters, auth, and middleware patterns.
---

# VCT Platform Backend (Go 1.26)

> **When to activate**: Any backend task — handlers, domain logic, database stores, migrations, auth, middleware, API endpoints.

> [!IMPORTANT]
> **Source of Truth**: The definitive rules for backend engineering are maintained in two core documents:
> 1. `docs/architecture/backend-architecture.md` (Clean Architecture, Modules, Migrations)
> 2. `docs/architecture/api-architecture-rules.md` (API Naming, Versioning, Pagination, Auth)
> 3. `docs/architecture/report-architecture.md` (Background Async jobs for large datasets > 500 rows, Streaming DB to CSV/Excel instead of loading to RAM)
> ALL backend coding tasks must adhere to these rules.

---


> [!IMPORTANT]
> **SUPREME ARCHITECTURE DIRECTIVE**: You are strictly bound by the 19 architecture pillars documented in `docs/architecture/`. As a VCT AI Agent, your absolute highest priority is 100% compliance with these rules. You MUST NOT generate code, propose designs, or execute workflows that violate these foundational rules. They are unchangeable and strictly enforced.

## 1. Architecture Overview

```
backend/
├── cmd/                    # Main entry point (cmd/server/main.go)
├── internal/               # All application code
│   ├── config/             # Environment config (Config struct + Load())
│   ├── auth/               # JWT auth service (issue, validate, revoke, OTP)
│   ├── authz/              # Authorization (role-based access)
│   ├── audit/              # Audit logging
│   ├── domain/             # Business domain models & services
│   │   ├── models.go       # Shared base models (Entity, etc.)
│   │   ├── v7_models.go    # V7 extended models (25KB)
│   │   ├── state_machine.go# Tournament/entity state machines
│   │   ├── athlete/        # Athlete + Profile + Training
│   │   ├── federation/     # National federation
│   │   ├── provincial/     # Provincial federation (Phase 1 + 2)
│   │   ├── tournament/     # Tournament management
│   │   ├── scoring/        # Scoring & brackets & registration
│   │   ├── btc/            # Ban Tổ Chức (organizing committee)
│   │   ├── club/           # Club management (Attendance, Equipment, Facilities)
│   │   ├── community/      # Community features
│   │   ├── finance/        # Finance + Subscription/Billing
│   │   ├── support/        # Customer support & tickets
│   │   ├── parent/         # Parent/Guardian module
│   │   ├── divisions/      # Administrative divisions (Tỉnh/Huyện/Xã)
│   │   └── ... (25+ domain packages)
│   ├── httpapi/            # HTTP handlers & server (47 files)
│   │   ├── server.go       # Main server, wiring, Handler()
│   │   ├── middleware.go   # Auth, CORS, CSRF, logging, rate limit, security headers
│   │   ├── helpers.go      # JSON response helpers
│   │   ├── apierror.go     # APIError envelope
│   │   ├── metrics.go      # Metrics endpoint
│   │   ├── health.go       # Health & readiness checks
│   │   └── *_handler.go    # Domain-specific handlers (40+ files)
│   ├── store/              # Data storage layer
│   │   ├── store.go        # In-memory store
│   │   ├── postgres_store.go # PostgreSQL store
│   │   ├── cached_store.go # Cache wrapper
│   │   ├── models.go       # Store-level models
│   │   ├── v7_models.go    # V7 models
│   │   ├── v7_store.go     # V7 store methods
│   │   ├── storage.go      # Storage driver interface
│   │   ├── seed.go         # Seed data
│   │   └── inmemory/       # In-memory store components
│   ├── adapter/            # Repository adapters (domain ↔ store)
│   │   ├── repositories.go         # In-memory adapters
│   │   ├── domain_repositories.go  # Domain repository wiring
│   │   ├── store_adapter.go        # Base adapter
│   │   ├── *_pg.go / *_pg_repos.go # PostgreSQL adapters (15+ files)
│   │   ├── *_mem.go                # In-memory adapters
│   │   ├── meilisearch/            # Full-text search (stub)
│   │   ├── minio/                  # File storage (stub)
│   │   ├── nats/                   # Message queue (stub)
│   │   ├── postgres/               # PostgreSQL utilities
│   │   └── redis/                  # Cache adapter (stub)
│   ├── cache/              # In-memory cache with TTL
│   ├── email/              # Email service (Resend)
│   ├── events/             # Domain event bus (InMemoryBus)
│   ├── gamification/       # Gamification logic
│   ├── logger/             # Structured logging
│   ├── notifications/      # Notification system
│   ├── realtime/           # WebSocket hub
│   ├── service/            # Cross-cutting services
│   ├── validate/           # Input validation
│   ├── worker/             # Background workers
│   └── pkg/                # Shared packages
├── migrations/             # SQL migrations (0001–0085, 85 pairs)
├── sql/                    # SQL query files
├── data/                   # Static data files
├── go.mod                  # Go 1.26, pgx/v5, gorilla/websocket, golang-jwt/v5
├── Dockerfile              # Standard Docker build
└── Dockerfile.render       # Render.com deployment
```

### Domain Modules Catalog (25+ packages)
| Module | Description | Key Entities |
|--------|-------------|-------------|
| `athlete` | VĐV management + profiles + training | Athlete, Profile, Membership, TrainingSession |
| `approval` | Phê duyệt workflow | ApprovalRequest, ApprovalStep, Workflow |
| `bracket` | Bracket/draw generation | Bracket, BracketMatch |
| `btc` | Ban Tổ Chức giải | BTC, BTCMember, BTCTask |
| `certification` | Chứng chỉ | Certificate, IssuedCert |
| `club` | CLB management (Attendance, Equipment, Facilities) | Club, Attendance, Equipment, Facility |
| `community` | Community features | Club, Member, Event |
| `discipline` | Kỷ luật & sanctions | Case, Hearing |
| `divisions` | Đơn vị hành chính (Tỉnh/Huyện/Xã) | Province, District, Ward |
| `document` | Official documents | Document |
| `federation` | Liên đoàn management | Province, Unit, Personnel, MasterData |
| `finance` | Tài chính + Subscription/Billing | Transaction, Budget, Invoice, Payment, Plan, Subscription |
| `heritage` | Đai hạng & kỹ thuật | BeltRank, Technique |
| `international` | Quan hệ quốc tế | Partner, IntlEvent, Delegation |
| `orchestrator` | Module coordination | Orchestrator |
| `organization` | Tổ chức nội bộ | Team, Referee, Arena |
| `parent` | Phụ huynh/Guardian | ParentLink, Consent, Attendance, Result |
| `provincial` | Liên đoàn cấp tỉnh (Phase 1 + 2) | Association, Club, Athlete, Coach, Referee, Transfer |
| `ranking` | Xếp hạng VĐV & đội | AthleteRanking, TeamRanking |
| `registration` | Đăng ký giải | Registration, Entry |
| `repository` | Shared repository interfaces | — |
| `scoring` | Chấm điểm live | ScoreEntry, ScoreResult, ScoringConfig |
| `support` | Customer support | Ticket, Category, FAQ |
| `tournament` | Tournament management | Tournament, Category, TournamentMgmt |
| `training` | Training programs | Training session management |

### Clean Architecture Layers
```
Domain (models, interfaces, services)
  ↓
Adapter (repository implementations — in-memory + PostgreSQL)
  ↓
Store (data persistence — memory/postgres/cached)
  ↓
HTTP API (handlers, middleware, routing)
```

---

## 2. Go Module & Dependencies

```go
module vct-platform/backend
go 1.26

// Key dependencies:
github.com/jackc/pgx/v5          // PostgreSQL driver (+ stdlib for database/sql)
github.com/golang-jwt/jwt/v5     // JWT authentication
github.com/gorilla/websocket     // WebSocket
github.com/joho/godotenv         // .env loading
golang.org/x/crypto              // Password hashing
github.com/resend/resend-go/v3   // Email (Resend)
```

### Rules
- **Standard library HTTP** — use `net/http` directly, NO frameworks (Gin, Echo, Fiber)
- **Go 1.22+ ServeMux** — use subtree patterns `/api/v1/entity/` (trailing slash)
- **No ORM** — raw SQL with `pgx/v5` or `database/sql`
- **Dual storage** — both `database/sql` (for PG adapters) and `pgx` (for store layer)

---

## 3. Domain Module Pattern

> **DIP Rule (Dependency Inversion)**: "Accept Interfaces, Return Structs". Domain services MUST accept repository interfaces rather than concrete structs (e.g., `*PgUserRepo`). All dependencies must be manually injected during server wiring.
> **ISP Supremacy (Microscopic Interfaces)**: Interfaces must be highly segregated. Prefer 1-2 method interfaces. Define interfaces in the consumer package. Do not create massive `Repository` God Interfaces.

Each domain module follows this structure:

```go
// internal/domain/{module}/models.go
package module

type Entity struct {
    ID        string    `json:"id"`
    Name      string    `json:"name"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}

// internal/domain/{module}/repository.go
type Repository interface {
    List() ([]Entity, error)
    GetByID(id string) (Entity, error)
    Create(entity Entity) error
    Update(entity Entity) error
    Delete(id string) error
}

// internal/domain/{module}/service.go
type Service struct {
    repo    Repository
    newUUID func() string
}

func NewService(repo Repository, newUUID func() string) *Service {
    return &Service{repo: repo, newUUID: newUUID}
}

func (s *Service) Create(input CreateInput) (Entity, error) {
    entity := Entity{
        ID:        s.newUUID(),
        Name:      input.Name,
        CreatedAt: time.Now().UTC(),
        UpdatedAt: time.Now().UTC(),
    }
    if err := s.repo.Create(entity); err != nil {
        return Entity{}, fmt.Errorf("create entity: %w", err)
    }
    return entity, nil
}
```

---

## 4. HTTP Handler Pattern & RESTful API Supremacy

> **RESTful Supremacy**: All APIs must strictly adhere to the Richardson Maturity Model (Level 2+).
> 1. **Resource Nouns (Plural)**: e.g., `POST /tournaments`, NOT `POST /createTournament`.
> 2. **Strict HTTP Verbs**:
>    - `GET`: Idempotent read.
>    - `POST`: Create new resource.
>    - `PUT`: Complete idempotent replacement.
>    - `PATCH`: Partial update.
>    - `DELETE`: Idempotent removal.
> 3. **Exact HTTP Status Codes**: `200 OK` (read/update success), `201 Created` (inserted), `204 No Content` (deleted/empty), `400 Bad Request` (payload error), `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable Entity` (validation error), `500 Server Error`.

```go
// internal/httpapi/{module}_handler.go

func (s *Server) handleEntityRoutes(w http.ResponseWriter, r *http.Request) {
    switch r.Method {
    case http.MethodGet:
        s.handleEntityList(w, r)
    case http.MethodPost:
        s.handleEntityCreate(w, r)
    default:
        methodNotAllowed(w)
    }
}

func (s *Server) handleEntityList(w http.ResponseWriter, r *http.Request) {
    entities, err := s.entitySvc.List()
    if err != nil {
        internalError(w, err)
        return
    }
    success(w, http.StatusOK, entities)
}

func (s *Server) handleEntityCreate(w http.ResponseWriter, r *http.Request) {
    var input CreateInput
    if !decodeJSON(w, r, &input) { return }
    
    entity, err := s.entitySvc.Create(input)
    if err != nil {
        internalError(w, err)
        return
    }
    success(w, http.StatusCreated, entity)
}
```

### Response Helpers (in helpers.go)
```go
func success(w http.ResponseWriter, code int, data any)
func internalError(w http.ResponseWriter, err error)
func badRequest(w http.ResponseWriter, msg string)
func notFound(w http.ResponseWriter)
func methodNotAllowed(w http.ResponseWriter)
func decodeJSON(w http.ResponseWriter, r *http.Request, dst any) bool
```

### APIError Envelope (apierror.go)
```go
type APIError struct {
    Code    string `json:"code"`
    Message string `json:"message"`
    Details any    `json:"details,omitempty"`
}
```

---

## 5. Route Registration

In `server.go` → `Handler()` method — current registrations:

```go
func (s *Server) Handler() http.Handler {
    mux := http.NewServeMux()
    
    // ── Health & Monitoring ──────────────────────────────
    mux.HandleFunc("/", s.handleRoot)
    mux.HandleFunc("/healthz", s.handleHealth)
    mux.HandleFunc("/readyz", s.handleReadiness)
    
    // ── WebSocket ────────────────────────────────────────
    mux.HandleFunc("/api/v1/ws", s.handleWebSocket)
    
    // ── Auth (stricter rate limiting) ────────────────────
    mux.Handle("/api/v1/auth/login", loginRL(loginBody(http.HandlerFunc(s.handleAuthLogin))))
    mux.Handle("/api/v1/auth/register", loginRL(loginBody(http.HandlerFunc(s.handleAuthRegister))))
    mux.HandleFunc("/api/v1/auth/refresh", s.handleAuthRefresh)
    mux.HandleFunc("/api/v1/auth/me", s.withAuth(s.handleAuthMe))
    mux.HandleFunc("/api/v1/auth/logout", s.withAuth(s.handleAuthLogout))
    mux.HandleFunc("/api/v1/auth/revoke", s.withAuth(s.handleAuthRevoke))
    mux.HandleFunc("/api/v1/auth/audit", s.withAuth(s.handleAuthAudit))
    mux.HandleFunc("/api/v1/auth/switch-context", s.withAuth(s.handleAuthSwitchContext))
    mux.HandleFunc("/api/v1/auth/my-roles", s.withAuth(s.handleAuthMyRoles))
    mux.Handle("/api/v1/auth/send-otp", loginRL(loginBody(http.HandlerFunc(s.handleAuthSendOTP))))
    mux.Handle("/api/v1/auth/verify-otp", loginRL(loginBody(http.HandlerFunc(s.handleAuthVerifyOTP))))
    
    // ── Domain Entity APIs ───────────────────────────────
    mux.HandleFunc("/api/v1/scoring/", s.handleScoringRoutes)
    mux.HandleFunc("/api/v1/public/", s.handlePublicRoutes)
    mux.HandleFunc("/api/v1/athletes/", s.handleAthleteRoutes)
    mux.HandleFunc("/api/v1/teams/", s.handleTeamRoutes)
    mux.HandleFunc("/api/v1/referees/", s.handleRefereeRoutes)
    mux.HandleFunc("/api/v1/arenas/", s.handleArenaRoutes)
    mux.HandleFunc("/api/v1/registration/", s.handleRegistrationRoutes)
    mux.HandleFunc("/api/v1/tournaments/", s.handleTournamentRoutes)
    mux.HandleFunc("/api/v1/rankings/", s.handleRankingRoutes)
    mux.HandleFunc("/api/v1/belts/", s.handleBeltRoutes)
    mux.HandleFunc("/api/v1/techniques/", s.handleTechniqueRoutes)
    mux.HandleFunc("/api/v1/transactions/", s.handleTransactionRoutes)
    mux.HandleFunc("/api/v1/budgets", s.handleBudgetRoutes)
    mux.HandleFunc("/api/v1/clubs/", s.handleClubRoutes)
    mux.HandleFunc("/api/v1/members/", s.handleMemberRoutes)
    mux.HandleFunc("/api/v1/community-events/", s.handleCommunityEventRoutes)
    
    // ── Module Route Groups (delegated registration) ─────
    s.handleApprovalRoutes(mux)
    s.handleFederationRoutes(mux)
    s.handleExtendedFederationRoutes(mux)
    s.handleDocumentRoutes(mux)
    s.handleDisciplineRoutes(mux)
    s.handleCertificationRoutes(mux)
    s.handleInternationalRoutes(mux)
    s.handleAthleteProfileRoutes(mux)
    s.handleProvincialRoutes(mux)
    s.handleProvincialPhase2Routes(mux)
    s.handleClubInternalRoutes(mux)
    s.handleClubV2Routes(mux)
    s.handleBTCRoutes(mux)
    s.handleParentRoutes(mux)
    s.handleTournamentMgmtRoutes(mux)
    s.handleProvincialFederationRoutes(mux)
    divisions.NewHandler().RegisterRoutes(mux)
    s.handleSupportRoutes(mux)
    s.handleAdminRoutes(mux)
    
    // ── Finance V2 + Subscription/Billing ────────────────
    // (See server.go for full finance route list)
    
    // ── Bracket & Tournament Actions ─────────────────────
    // (See server.go for full action route list)
    
    // ── Domain Events ────────────────────────────────────
    mux.HandleFunc("/api/v1/events/recent", s.withAuth(s.handleRecentEvents))
    
    // ── Generic entity CRUD (catch-all) ──────────────────
    mux.HandleFunc("/api/v1/", s.handleEntityRoutes)
    
    // Middleware stack
    return withRecover(withRequestID(withSecurityHeaders(
        withRateLimit(s.rateLimiter)(withBodyLimit(
            s.withCSRF(s.withCORS(s.withLogging(mux))))))))
}
```

### URL Path Convention
```
/api/v1/{module}/                      # List / Create
/api/v1/{module}/{id}                  # Get / Update / Delete
/api/v1/{module}-action/{verb}         # Custom actions
/api/v1/finance/{sub-module}           # Finance sub-routes
/api/v1/finance/{sub-module}/{id}      # Finance entity detail
```

---

## 6. Middleware Stack

```
Request → Recover → RequestID → SecurityHeaders → RateLimit → BodyLimit → CSRF → CORS → Logging → Auth → Handler
```

| Middleware | Purpose |
|-----------|---------|
| `withRecover` | Panic recovery → 500 response |
| `withRequestID` | Inject `X-Request-ID` header |
| `withSecurityHeaders` | Security headers (X-Content-Type-Options, etc.) |
| `withRateLimit` | Token bucket rate limiting |
| `withBodyLimit` | Max body size (default 1MB) |
| `withCSRF` | CSRF protection |
| `withCORS` | CORS headers from `VCT_CORS_ORIGINS` |
| `withLogging` | Request/response logging |
| `withAuth` | JWT authentication, extracts `auth.Claims` |

### Auth Middleware
```go
func (s *Server) withAuth(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        token := extractBearerToken(r)
        claims, err := s.authService.AuthenticateAccessToken(token, reqCtx)
        if err != nil {
            unauthorized(w, err.Error())
            return
        }
        ctx := context.WithValue(r.Context(), authClaimsKey, claims)
        next(w, r.WithContext(ctx))
    }
}
```

---

## 7. Storage Layer

### Dual Storage Driver
```env
VCT_STORAGE_DRIVER=memory    # In-memory (development)
VCT_STORAGE_DRIVER=postgres  # PostgreSQL (staging/production)
```

### PostgreSQL Config
```env
VCT_POSTGRES_URL=postgres://user:pass@host:5432/dbname?sslmode=disable
VCT_POSTGRES_PROVIDER=selfhost|neon|supabase
VCT_DB_AUTO_MIGRATE=true
VCT_PG_POOL_MAX_CONNS=25
VCT_PG_POOL_MIN_CONNS=5
```

### Store Interface
```go
type DataStore interface {
    Get(entityType, id string) (map[string]any, error)
    List(entityType string) ([]map[string]any, error)
    Create(entityType string, data map[string]any) error
    Update(entityType, id string, data map[string]any) error
    Delete(entityType, id string) error
    Close() error
}
```

### CachedStore
- Wraps any `DataStore` with in-memory TTL cache
- Configured via `VCT_CACHE_TTL` (default 30s) and `VCT_CACHE_MAX_ENTRIES` (default 2000)

### PG Adapter Upgrade Pattern
When `VCT_STORAGE_DRIVER=postgres`, the server automatically creates both:
1. `store.PostgresStore` — for generic entity storage via `DataStore` interface
2. `*sql.DB` — for dedicated PG adapters with raw SQL (higher performance)

Services are initially wired with in-memory stores, then **upgraded** to PG adapters when `sql.DB` is available.

---

## 8. Repository Adapter Pattern

### In-Memory (default)
```go
// internal/adapter/repositories.go or {module}_mem.go
type AthleteRepository struct {
    store store.DataStore
}

func NewAthleteRepository(store store.DataStore) *AthleteRepository {
    return &AthleteRepository{store: store}
}
```

### PostgreSQL (via database/sql)
```go
// internal/adapter/{module}_pg.go or {module}_pg_repos.go
type PgEntityRepo struct {
    db *sql.DB
}

func NewPgEntityRepo(db *sql.DB) *PgEntityRepo {
    return &PgEntityRepo{db: db}
}

func (r *PgEntityRepo) Create(e Entity) error {
    _, err := r.db.Exec(
        `INSERT INTO entities (id, name, created_at) VALUES ($1, $2, $3)`,
        e.ID, e.Name, e.CreatedAt,
    )
    return err
}
```

### Infrastructure Adapters (Planned)
| Adapter | Status | Purpose |
|---------|--------|---------|
| `adapter/postgres/` | Active | PostgreSQL utilities |
| `adapter/meilisearch/` | Stub | Full-text search |
| `adapter/minio/` | Stub | S3-compatible file storage |
| `adapter/nats/` | Stub | Message queue / pub-sub |
| `adapter/redis/` | Stub | Distributed cache |

---

## 9. SQL Migrations

- Location: `backend/migrations/`
- Format: `{NNNN}_{description}.sql` + `{NNNN}_{description}_down.sql`
- **Current: 85 migration pairs (0001–0085)**
- Auto-run on startup when `VCT_DB_AUTO_MIGRATE=true`

### Creating a New Migration
```sql
-- backend/migrations/0086_new_feature.sql
CREATE TABLE IF NOT EXISTS new_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_new_table_name ON new_table(name);

-- backend/migrations/0086_new_feature_down.sql
DROP TABLE IF EXISTS new_table;
```

### Recent Migration Areas
| Range | Description |
|-------|-------------|
| 0001–0036 | Core schema, scoring, enterprise, audit |
| 0037–0043 | Federation (core, master data, approvals, PR, international, workflows) |
| 0044–0048 | Scoring, tournament mgmt, clubs, athlete profiles, BTC/parent/training |
| 0049–0058 | Tenant isolation, FK constraints, consolidation, partitions, indexes, audit, archival, PG17 |
| 0059–0073 | Fuzzy search, ELO ratings, query cache, CDC outbox, ltree, temporal, BRIN, backups |
| 0074–0085 | Fixes (dual tables, RLS, migration tracking, status values, triggers, enums, FK, security), system admin, subscriptions |

---

## 10. Server Struct & Service Wiring

The `Server` struct holds all service dependencies:

```go
type Server struct {
    cfg              config.Config
    authService      *auth.Service
    store            store.DataStore
    cachedStore      *store.CachedStore
    realtimeHub      *realtime.Hub
    eventBus         *events.InMemoryBus
    emailService     *email.Service
    sqlDB            *sql.DB              // only when PG driver

    // Domain services
    athleteService      *athlete.Service
    athleteProfileSvc   *athlete.ProfileService
    trainingSessionSvc  *athlete.TrainingService
    orgService          *organization.Service
    scoringService      *scoring.Service
    registrationService *scoring.RegistrationService
    tournamentCRUD      adapter.TournamentCRUD
    tournamentMgmtSvc   *tournament.MgmtService
    rankingService      *ranking.Service
    heritageService     *heritage.Service
    financeService      *finance.Service
    communityService    *community.Service
    federationSvc       *federation.Service
    approvalSvc         *approval.Service
    certificationSvc    *certification.Service
    disciplineSvc       *discipline.Service
    documentSvc         *document.Service
    internationalSvc    *international.Service
    provincialSvc       *provincial.Service
    btcSvc              *btc.Service
    parentSvc           *parent.Service
    clubSvc             *clubdomain.Service
    supportSvc          *support.Service
    subscriptionSvc     *finance.SubscriptionService
    
    // Provincial Phase 2 stores
    tournamentStore     provincial.TournamentStore
    financeStore        provincial.FinanceStore
    certStore           provincial.CertStore
    disciplineStore     provincial.DisciplineStore
    docStore            provincial.DocStore
}
```

---

## 11. Event Bus & WebSocket

### Domain Events
```go
import "vct-platform/backend/internal/events"

s.eventBus.Publish(events.DomainEvent{
    Type:       events.EventCreated,
    EntityType: "athlete",
    EntityID:   athlete.ID,
    ActorID:    claims.UserID,
    Payload:    map[string]any{"name": athlete.Name},
    Timestamp:  time.Now().UTC(),
})
```

### WebSocket Real-time
- Hub at `internal/realtime/`
- First-message auth: `{"action":"auth","token":"xxx"}`
- Channel subscription: `{"action":"subscribe","channel":"athletes"}`
- Auto-broadcast from EventBus → WebSocket hub (entity + entity:id channels)

---

## 12. Anti-Patterns (NEVER Do These)

1. ❌ **NEVER** use a web framework (Gin, Echo, Fiber) — use `net/http`
2. ❌ **NEVER** use an ORM (GORM, Ent) — use raw SQL with `pgx` / `database/sql`
3. ❌ **NEVER** put business logic in handlers — handlers call services
4. ❌ **NEVER** access `store` directly from handlers — go through service → adapter
5. ❌ **NEVER** return errors without wrapping — use `fmt.Errorf("context: %w", err)`
6. ❌ **NEVER** skip the `_down.sql` migration — always create both up and down
7. ❌ **NEVER** add new dependencies without strong justification (stdlib-first)
8. ❌ **NEVER** use `panic` for error handling — return errors properly
9. ❌ **NEVER** forget to wire PG adapter upgrade in `server.go` when adding new PG stores

---

## 13. New Module Checklist

1. [ ] Create domain package: `internal/domain/{module}/`
2. [ ] Define models, repository interface, service
3. [ ] Create in-memory adapter: `internal/adapter/{module}_mem.go`
4. [ ] Create PG adapter: `internal/adapter/{module}_pg.go`
5. [ ] Create handler: `internal/httpapi/{module}_handler.go`
6. [ ] Register routes in `server.go` → `Handler()`
7. [ ] Wire service in `server.go` → `New()` (in-memory first)
8. [ ] Wire PG upgrade in `server.go` → `if storageDriver == "postgres"` block
9. [ ] Create migration: `migrations/0086_{desc}.sql` + `_down.sql`
10. [ ] Add tests: `internal/httpapi/{module}_handler_test.go` or `internal/adapter/{module}_pg_test.go`

---

## 14. Structured Logging

```go
// Use structured JSON logging — never fmt.Println in production
log.Printf(`{"level":"info","module":"%s","action":"%s","entity_id":"%s","duration_ms":%d}`,
    module, action, entityID, duration.Milliseconds())
```

### Rules
- Always include `request_id` from `X-Request-ID` header
- Use `log.Printf` with JSON format, not `fmt.Println`
- Levels: `debug` (dev), `info` (staging), `warn`+`error` (production)
- Include `module`, `action`, `entity_id`, `duration_ms` in every log

---

## 15. Graceful Shutdown

```go
// In cmd/server/main.go
ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
defer stop()

srv := &http.Server{Addr: ":18080", Handler: handler}
go func() { srv.ListenAndServe() }()

<-ctx.Done()
shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
defer cancel()
srv.Shutdown(shutdownCtx)  // Graceful: finish in-flight requests
server.Close()             // Close DB, WebSocket, auth cleanup
```

---

## 16. Context Propagation

```go
// Pass context through the entire chain
func (s *Service) Create(ctx context.Context, input CreateInput) (Entity, error) {
    // Use ctx for cancellation, deadlines, and tracing
    return s.repo.Create(ctx, entity)
}

// In PostgreSQL adapter
func (r *PgRepo) Create(ctx context.Context, e Entity) error {
    _, err := r.db.ExecContext(ctx, `INSERT INTO ...`, e.ID, e.Name)
    return err
}
```

---

## 17. UUID Generation

```go
// The project uses custom v4 UUID generation (no external lib)
func newUUID() string {
    b := make([]byte, 16)
    _, _ = rand.Read(b)
    b[6] = (b[6] & 0x0f) | 0x40
    b[8] = (b[8] & 0x3f) | 0x80
    return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}
```
