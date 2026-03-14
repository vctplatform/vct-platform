---
name: vct-backend-go
description: VCT Platform Go 1.26 backend — Clean Architecture, domain modules, HTTP API, PostgreSQL adapters, auth, and middleware patterns.
---

# VCT Platform Backend (Go 1.26)

> **When to activate**: Any backend task — handlers, domain logic, database stores, migrations, auth, middleware, API endpoints.

---

## 1. Architecture Overview

```
backend/
├── cmd/                    # Main entry point
├── internal/               # All application code
│   ├── config/             # Environment config (Config struct + Load())
│   ├── auth/               # JWT auth service (issue, validate, revoke)
│   ├── authz/              # Authorization (role-based access)
│   ├── domain/             # Business domain models & services
│   │   ├── models.go       # Shared base models (Entity, etc.)
│   │   ├── state_machine.go# Tournament/entity state machines
│   │   ├── athlete/        # Athlete domain
│   │   ├── federation/     # National federation
│   │   ├── provincial/     # Provincial federation
│   │   ├── tournament/     # Tournament management
│   │   ├── scoring/        # Scoring & brackets
│   │   ├── btc/            # Ban Tổ Chức (organizing committee)
│   │   └── ... (22 domain packages)
│   ├── httpapi/            # HTTP handlers & server
│   │   ├── server.go       # Main server, wiring, Handler()
│   │   ├── middleware.go   # Auth, CORS, logging, rate limit
│   │   ├── helpers.go      # JSON response helpers
│   │   └── *_handler.go    # Domain-specific handlers
│   ├── store/              # Data storage layer
│   │   ├── store.go        # In-memory store
│   │   ├── postgres_store.go # PostgreSQL store
│   │   ├── cached_store.go # Cache wrapper
│   │   ├── models.go       # Store-level models
│   │   └── seed.go         # Seed data
│   ├── adapter/            # Repository adapters (domain ↔ store)
│   │   ├── repositories.go # In-memory adapters
│   │   ├── *_pg_repos.go   # PostgreSQL adapters
│   │   └── store_adapter.go# Base adapter
│   ├── cache/              # In-memory cache with TTL
│   ├── events/             # Domain event bus
│   ├── realtime/           # WebSocket hub
│   └── pkg/                # Shared packages
├── migrations/             # SQL migrations (0001–0036+)
├── go.mod                  # Go 1.26, pgx/v5, gorilla/websocket, golang-jwt/v5
└── Dockerfile
```

### Domain Modules Catalog (23 modules)
| Module | Description | Key Entities |
|--------|-------------|-------------|
| `athlete` | VĐV management | Athlete, BeltHistory |
| `auth` | Authentication + RBAC | User, Session, Role |
| `club` | CLB management | Club, Membership |
| `tournament` | Giải đấu management | Tournament, Category, Match |
| `bracket` | Bracket/draw generation | Bracket, BracketMatch |
| `finance` | Tài chính | Payment, Invoice, Budget |
| `registration` | Đăng ký giải | Registration, Entry |
| `score` | Chấm điểm live | ScoreEntry, ScoreResult |
| `coach` | HLV management | Coach, CoachAssignment |
| `referee` | Trọng tài management | Referee, RefAssignment |
| `venue` | Địa điểm thi đấu | Venue, Tatami, Schedule |
| `belt` | Đai hạng management | Belt, BeltExam |
| `activity_log` | Audit trail | ActivityLog |
| `notification` | Thông báo | Notification, Template |
| `federation` | Liên đoàn management | Federation, Member |
| `discipline` | Bộ môn/nội dung | Discipline, DisciplineRule |
| `certification` | Chứng chỉ | Certificate, IssuedCert |
| `approval` | Phê duyệt workflow | ApprovalRequest, ApprovalStep |
| `international` | Quan hệ quốc tế | IntlEvent, Delegation |
| `organization` | Tổ chức nội bộ | OrgUnit, OrgMember |
| `orchestrator` | Module coordination | Orchestrator |
| `report` | Báo cáo tổng hợp | Report, DataExport |
| `media` | Ảnh/video management | Media, MediaGallery |

### Clean Architecture Layers
```
Domain (models, interfaces, services)
  ↓
Adapter (repository implementations)
  ↓
Store (data persistence — memory/postgres)
  ↓
HTTP API (handlers, middleware, routing)
```

---

## 2. Go Module & Dependencies

```go
module vct-platform/backend
go 1.26

// Key dependencies:
github.com/jackc/pgx/v5          // PostgreSQL driver
github.com/golang-jwt/jwt/v5     // JWT authentication
github.com/gorilla/websocket     // WebSocket
```

### Rules
- **Standard library HTTP** — use `net/http` directly, NO frameworks (Gin, Echo, Fiber)
- **Go 1.22+ ServeMux** — use subtree patterns `/api/v1/entity/` (trailing slash)
- **No ORM** — raw SQL with `pgx/v5`

---

## 3. Domain Module Pattern

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

## 4. HTTP Handler Pattern

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

---

## 5. Route Registration

In `server.go` → `Handler()` method:

```go
func (s *Server) Handler() http.Handler {
    mux := http.NewServeMux()
    
    // Health check
    mux.HandleFunc("/healthz", s.handleHealth)
    
    // Auth routes (stricter rate limiting)
    mux.Handle("/api/v1/auth/login", loginRL(loginBody(http.HandlerFunc(s.handleAuthLogin))))
    
    // Protected routes
    mux.HandleFunc("/api/v1/entity/", s.withAuth(s.handleEntityRoutes))
    
    // Route group registration
    s.handleModuleRoutes(mux)
    
    // Wrap with middleware
    return withRecover(withRequestID(withRateLimit(s.rateLimiter)(
        withBodyLimit(s.withCORS(s.withLogging(mux))))))
}
```

### URL Path Convention
```
/api/v1/{module}/              # List / Create
/api/v1/{module}/{id}          # Get / Update / Delete
/api/v1/{module}-action/{verb} # Custom actions
```

---

## 6. Middleware Stack

```
Request → Recover → RequestID → RateLimit → BodyLimit → CORS → Logging → Auth → Handler
```

| Middleware | Purpose |
|-----------|---------|
| `withRecover` | Panic recovery → 500 response |
| `withRequestID` | Inject `X-Request-ID` header |
| `withRateLimit` | Token bucket rate limiting |
| `withBodyLimit` | Max body size (default 1MB) |
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

---

## 8. Repository Adapter Pattern

```go
// internal/adapter/repositories.go

type AthleteRepository struct {
    store store.DataStore
}

func NewAthleteRepository(store store.DataStore) *AthleteRepository {
    return &AthleteRepository{store: store}
}

func (r *AthleteRepository) List() ([]athlete.Athlete, error) {
    raw, err := r.store.List("athletes")
    if err != nil { return nil, err }
    // Convert map[string]any → domain model
    return convertToAthletes(raw), nil
}
```

### PostgreSQL Adapter Pattern
```go
// internal/adapter/{module}_pg_repos.go

type PgEntityRepo struct {
    store *store.CachedStore
}

func NewPgEntityRepo(s *store.CachedStore) *PgEntityRepo {
    return &PgEntityRepo{store: s}
}

func (r *PgEntityRepo) Create(e Entity) error {
    return r.store.ExecSQL(
        `INSERT INTO entities (id, name, created_at) VALUES ($1, $2, $3)`,
        e.ID, e.Name, e.CreatedAt,
    )
}
```

---

## 9. SQL Migrations

- Location: `backend/migrations/`
- Format: `{NNNN}_{description}.sql` + `{NNNN}_{description}_down.sql`
- Current: 36 migration pairs (0001–0036)
- Auto-run on startup when `VCT_DB_AUTO_MIGRATE=true`

### Creating a New Migration
```sql
-- backend/migrations/0037_new_feature.sql
CREATE TABLE IF NOT EXISTS new_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_new_table_name ON new_table(name);

-- backend/migrations/0037_new_feature_down.sql
DROP TABLE IF EXISTS new_table;
```

---

## 10. UUID Generation
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

---

## 11. Event Bus & WebSocket

### Domain Events
```go
import "vct-platform/backend/internal/events"

// Publishing
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
- Auto-broadcast from EventBus → WebSocket hub

---

## 12. Anti-Patterns (NEVER Do These)

1. ❌ **NEVER** use a web framework (Gin, Echo, Fiber) — use `net/http`
2. ❌ **NEVER** use an ORM (GORM, Ent) — use raw SQL with `pgx`
3. ❌ **NEVER** put business logic in handlers — handlers call services
4. ❌ **NEVER** access `store` directly from handlers — go through service → adapter
5. ❌ **NEVER** return errors without wrapping — use `fmt.Errorf("context: %w", err)`
6. ❌ **NEVER** skip the `_down.sql` migration — always create both up and down
7. ❌ **NEVER** add new dependencies without strong justification (stdlib-first)
8. ❌ **NEVER** use `panic` for error handling — return errors properly

---

## 13. New Module Checklist

1. [ ] Create domain package: `internal/domain/{module}/`
2. [ ] Define models, repository interface, service
3. [ ] Create adapter: `internal/adapter/{module}_pg_repos.go`
4. [ ] Create handler: `internal/httpapi/{module}_handler.go`
5. [ ] Register routes in `server.go` → `Handler()`
6. [ ] Wire service in `server.go` → `New()`
7. [ ] Create migration: `migrations/{NNNN}_{desc}.sql` + `_down.sql`
8. [ ] Add tests: `internal/httpapi/{module}_handler_test.go`

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
store.Close()              // Close DB connections
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
    _, err := r.pool.Exec(ctx, `INSERT INTO ...`, e.ID, e.Name)
    return err
}
```
