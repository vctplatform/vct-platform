# VCT Platform — Setup Guide

## Prerequisites

- Node.js 20+ and npm
- Go 1.26+
- Docker & Docker Compose
- PostgreSQL 18+ (or use Docker)

## Quick Start

```bash
# 1. Clone repository
git clone <repo-url>
cd vct-platform

# 2. Install Node dependencies
npm install

# 3. Start infrastructure (PostgreSQL, Redis, MinIO, NATS, Meilisearch)
docker compose up -d

# 4. Run database migrations
cd backend && go run ./cmd/migrate up

# 5. Seed reference data
cd backend && go run ./cmd/migrate seed

# 6. Start development
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend API
npm run dev:backend
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL=postgres://user:password@localhost:5432/vct_platform

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Redis
REDIS_URL=redis://localhost:6379

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# NATS
NATS_URL=nats://localhost:4222
```

## Project Structure

See [Architecture Overview](../architecture/overview.md) for detailed architecture documentation.

## Common Commands

```bash
make help          # Show all available commands
make dev           # Start everything
make test          # Run all tests
make lint          # Run linters
make typecheck     # TypeScript type checking
make migrate       # Run database migrations
make docker-up     # Start Docker services
```
