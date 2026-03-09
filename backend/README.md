# VCT Backend (Go 1.26)

Backend REST API for VCT Platform with auth/session and repository-compatible entity contracts.

## Run

```bash
go run ./backend/cmd/server
```

Backend default URL: `http://localhost:18080`

## Env vars

- `VCT_BACKEND_ADDR` default `:18080`
- `VCT_CORS_ORIGINS` default `http://localhost:3000,http://127.0.0.1:3000,http://localhost:8081,http://localhost:3101,http://127.0.0.1:3101`
- `VCT_DISABLE_AUTH_FOR_DATA` default `false`
- `VCT_JWT_SECRET` default `change-me-before-production-vct-2026`
- `VCT_JWT_ISSUER` default `vct-backend`
- `VCT_ACCESS_TTL` default `15m`
- `VCT_REFRESH_TTL` default `168h`
- `VCT_AUDIT_LIMIT` default `5000`

Copy `backend/.env.example` into your environment.

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

