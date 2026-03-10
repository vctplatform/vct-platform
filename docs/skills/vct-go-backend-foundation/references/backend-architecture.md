# Backend Architecture (Go 1.26)

## Repository Layout

- `backend/go.mod`: module `vct-platform/backend`, `go 1.26`
- `backend/cmd/server/main.go`: process entry point, HTTP server lifecycle, graceful shutdown
- `backend/internal/config/config.go`: environment-driven runtime configuration
- `backend/internal/httpapi/server.go`: route registration, middleware, request/response helpers
- `backend/internal/auth/service.go`: JWT auth, refresh sessions, revocation, audit log
- `backend/internal/store/store.go`: in-memory entity storage, import/export, bulk replace

## Runtime Composition

1. `main.go` loads config and instantiates `httpapi.New(cfg)`.
2. HTTP server timeouts are defined centrally in `cmd/server/main.go`.
3. `httpapi.Server` composes auth service and entity store.
4. `/api/v1/auth/*` routes run through auth-specific handlers.
5. `/api/v1/{entity}` routes run through generic entity handlers.

## Existing Contracts

- Health endpoint: `GET /healthz`
- Auth endpoints:
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`
  - `POST /api/v1/auth/revoke`
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/auth/me`
  - `GET /api/v1/auth/audit`
- Entity endpoint shape:
  - `GET /api/v1/{entity}`
  - `POST /api/v1/{entity}`
  - `GET /api/v1/{entity}/{id}`
  - `PATCH /api/v1/{entity}/{id}`
  - `DELETE /api/v1/{entity}/{id}`
  - `PUT /api/v1/{entity}/bulk`
  - `POST /api/v1/{entity}/import`
  - `GET /api/v1/{entity}/export?format=json|csv`

## Extension Points

- Add domain package under `backend/internal/<domain>` when logic grows beyond transport concerns.
- Extend `config.Config` and `Load()` for new runtime settings.
- Add route wiring in `internal/httpapi/server.go` through clear handler methods.
- Preserve `decodeJSON`, `success`, and error response helpers for consistent HTTP behavior.

## Non-Negotiable Invariants

- Keep UTC timestamps for auth/session/audit behavior.
- Keep request parsing strict with `decoder.DisallowUnknownFields()`.
- Keep graceful shutdown path with context timeout.
- Keep explicit allow-list checks for entities and CORS origins.
