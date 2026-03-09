# VCT Backend (Go 1.26)

Backend REST API for VCT Platform with auth/session and repository-compatible entity contracts.

## Run

```bash
go run ./cmd/server
```

Backend default URL: `http://localhost:18080`

## Env vars

- `VCT_ENV` default `development` (`development`, `staging`, `production`)
- `VCT_BACKEND_ADDR` default `:18080`
- `VCT_CORS_ORIGINS` default `http://localhost:3000,http://127.0.0.1:3000,http://localhost:8081,http://localhost:3101,http://127.0.0.1:3101`
- `VCT_DISABLE_AUTH_FOR_DATA` default `false`
- `VCT_ALLOW_DEMO_USERS` default `true` trong `development`, `false` trong `staging/production`
- `VCT_BOOTSTRAP_USERS_JSON` JSON credentials bootstrap (ưu tiên hơn demo users)
- `VCT_JWT_SECRET` default `change-me-before-production-vct-2026`
- `VCT_JWT_ISSUER` default `vct-backend`
- `VCT_ACCESS_TTL` default `15m`
- `VCT_REFRESH_TTL` default `168h`
- `VCT_AUDIT_LIMIT` default `5000`
- `VCT_STORAGE_DRIVER` default `memory` (`memory` hoặc `postgres`)
- `VCT_POSTGRES_URL` DSN Postgres khi dùng `VCT_STORAGE_DRIVER=postgres`
- `VCT_POSTGRES_PROVIDER` default `selfhost` (gợi ý: `selfhost`, `neon`, `supabase`)
- `VCT_DB_AUTO_MIGRATE` default `true`
- `VCT_CACHE_TTL` default `30s`
- `VCT_CACHE_MAX_ENTRIES` default `2000`

Copy `backend/.env.example` into your environment.
Provider presets: `backend/.env.providers.example`.

## Migrations

Migration command uses `VCT_POSTGRES_URL` (or fallback `DATABASE_URL`).

```bash
# Apply pending migrations
go run ./cmd/migrate up

# Show migration status
go run ./cmd/migrate status

# Apply SQL seeds from backend/sql/seeds
go run ./cmd/migrate seed

# Rollback latest migration (requires *_down.sql file)
go run ./cmd/migrate down
```

Seed files are executed in filename order:

- `backend/sql/seeds/0001_seed_entity_records.sql`: seed demo payload for JSON entity store.
- `backend/sql/seeds/0002_seed_relational_core.sql`: seed core relational rows (`users`, `tournaments`, `teams`, `athletes`, ...).

Both seed files are idempotent (`ON CONFLICT` upsert) and can be re-run safely.

## Auth API

- `POST /api/v1/auth/login`
  - body: `{ "username": "admin", "password": "Admin@123", "role": "admin", "tournamentCode": "VCT-2026", "operationShift": "sang" }`
  - response includes `accessToken`, `refreshToken`, `expiresAt`, `refreshExpiresAt`
- `POST /api/v1/auth/refresh`
  - body: `{ "refreshToken": "<refresh>" }`
- `POST /api/v1/auth/revoke`
  - header: `Authorization: Bearer <accessToken>`
  - body: `{ "refreshToken"?: "...", "accessToken"?: "...", "revokeAll"?: false, "reason"?: "..." }`
- `GET /api/v1/auth/me`
  - header: `Authorization: Bearer <accessToken>`
- `POST /api/v1/auth/logout`
  - header: `Authorization: Bearer <accessToken>`
- `GET /api/v1/auth/audit?limit=100&actor=<userId|username>&action=auth.login`
  - header: `Authorization: Bearer <accessToken>`
  - role: `admin` hoặc `btc`

## Entity API contract

Entities supported:

- `teams`, `athletes`, `registration`, `results`, `schedule`
- `arenas`, `referees`, `appeals`, `weigh-ins`
- `combat-matches`, `form-performances`
- `content-categories`, `referee-assignments`, `tournament-config`

Routes:

- `GET /api/v1/{entity}`
- `POST /api/v1/{entity}`
- `GET /api/v1/{entity}/{id}`
- `PATCH /api/v1/{entity}/{id}`
- `DELETE /api/v1/{entity}/{id}`
- `PUT /api/v1/{entity}/bulk`
- `POST /api/v1/{entity}/import`
- `GET /api/v1/{entity}/export?format=json|csv`

These endpoints match the frontend `EntityRepository` and `ApiAdapter` contracts.

## Realtime WebSocket

- `GET /api/v1/ws`
- Broadcast event format:
  - `type`: `entity.changed`
  - `entity`: tên entity (ví dụ `teams`, `schedule`)
  - `action`: `created|updated|deleted|replaced|imported`
  - `itemId`: id bản ghi (nếu có)
  - `payload`: metadata bản ghi/count
  - `timestamp`: UTC ISO time

Khi `VCT_DISABLE_AUTH_FOR_DATA=false`, WebSocket yêu cầu token qua query `?token=<accessToken>` hoặc header `Authorization`.

## Self-host data stack

Run PostgreSQL 18 + Redis + pgAdmin locally:

```bash
docker compose -f backend/docker-compose.data.yml up -d
```

Useful endpoints:
- Postgres: `127.0.0.1:5432`
- Redis: `127.0.0.1:6379`
- pgAdmin: `http://127.0.0.1:5050`

