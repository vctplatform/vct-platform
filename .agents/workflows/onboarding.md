---
description: Workflow setup môi trường phát triển VCT Platform từ đầu cho developer mới
---

# /onboarding — Setup Dev Environment

> Sử dụng khi cần setup môi trường dev từ đầu hoặc khi developer mới join project.

// turbo-all

---

## Bước 1: Prerequisites

Kiểm tra các tool đã cài đặt:

```bash
# Node.js (20+)
node --version

# Go (1.26+)
go version

# Docker
docker --version
docker compose version

# Git
git --version
```

### Cần cài nếu thiếu:
| Tool | Version | Link |
|------|---------|------|
| Node.js | 20+ | https://nodejs.org |
| Go | 1.26+ | https://go.dev/dl |
| Docker Desktop | latest | https://docker.com |
| Git | latest | https://git-scm.com |

---

## Bước 2: Clone & Install

```bash
# Clone repository
git clone <repo-url> vct-platform
cd vct-platform

# Install frontend dependencies
npm install

# Install Go dependencies
cd backend && go mod download && cd ..
```

---

## Bước 3: Environment Configuration

### 3.1 Copy environment files
```bash
# Root env
cp .env.example .env

# Backend env
cp backend/.env.example backend/.env
```

### 3.2 Cấu hình .env
Các biến PHẢI cấu hình:
```env
# Database
VCT_POSTGRES_URL=postgres://postgres:postgres@localhost:5432/vct_dev?sslmode=disable
VCT_STORAGE_DRIVER=postgres  # hoặc "memory" để chạy không cần DB

# Auth
VCT_JWT_SECRET=<generate-random-256bit-string>
VCT_JWT_ACCESS_TTL=15m
VCT_JWT_REFRESH_TTL=168h

# Server
VCT_PORT=18080
VCT_ENV=development
VCT_DB_AUTO_MIGRATE=true
```

---

## Bước 4: Infrastructure Services

### Start Docker services
```bash
docker compose up -d
```

### Verify services:
| Service | Port | Health Check |
|---------|------|-------------|
| PostgreSQL | 5432 | `pg_isready -h localhost` |
| Redis | 6379 | `redis-cli ping` |
| Meilisearch | 7700 | `curl http://localhost:7700/health` |
| MinIO | 9000 | `curl http://localhost:9000/minio/health/live` |
| NATS | 4222 | `nats-server --help` |

---

## Bước 5: Database Setup

```bash
# Run migrations
cd backend && go run ./cmd/migrate up

# Seed reference data
cd backend && go run ./cmd/migrate seed
```

Verify:
- [ ] Migration chạy thành công
- [ ] Seed data loaded (belt levels, provinces, etc.)

---

## Bước 6: Start Development Servers

### Terminal 1 — Backend
```bash
npm run dev:backend
# hoặc: cd backend && go run ./cmd/server
```
Backend sẽ chạy tại `http://localhost:18080`

### Terminal 2 — Frontend  
```bash
npm run dev:web
# hoặc: npm run dev --workspace next-app
```
Frontend sẽ chạy tại `http://localhost:3000`

### Hoặc chạy cả hai:
```bash
npm run dev
```

---

## Bước 7: Verify Setup

### Build check
```bash
cd backend && go build ./...
npm run typecheck
```

### Browser check
1. Mở `http://localhost:3000` — Trang login load thành công
2. Login với demo account
3. Sidebar navigation hoạt động
4. Light/Dark theme toggle hoạt động

### Checklist hoàn thành:
- [ ] Node.js + Go + Docker installed
- [ ] Dependencies installed (npm + go mod)
- [ ] `.env` files configured
- [ ] Docker services running
- [ ] Database migrated + seeded
- [ ] Backend server running (port 18080)
- [ ] Frontend server running (port 3000)
- [ ] Build passes (Go + TypeScript)
- [ ] Browser loads correctly

---

## Project Structure Overview

```
vct-platform/
├── apps/
│   ├── next/          → Next.js web app (Pages Router)
│   └── expo/          → Expo mobile app
├── packages/
│   ├── app/features/  → Shared feature code (pages, components)
│   ├── shared-types/  → TypeScript types shared across apps
│   ├── shared-utils/  → Shared utilities (i18n, helpers)
│   └── ui/            → @vct/ui component library (VCT_ prefix)
├── backend/
│   ├── cmd/           → Entry points (server, migrate)
│   ├── internal/
│   │   ├── domain/    → Business logic (Clean Architecture)
│   │   ├── adapter/   → PostgreSQL repository implementations
│   │   ├── httpapi/   → HTTP handlers + routing
│   │   ├── auth/      → JWT authentication
│   │   └── config/    → Configuration loading
│   └── migrations/    → SQL migration files
├── docs/              → Documentation, regulations
├── .agent/
│   ├── skills/        → AI agent skills (BA, SA, CTO, PM, etc.)
│   └── workflows/     → Development workflows (this file!)
└── docker-compose.yml → Infrastructure services
```
