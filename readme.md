# VCT PLATFORM

> **Nền tảng Quản trị Võ thuật Toàn diện cho Võ Cổ Truyền Việt Nam**

Hệ thống quản lý toàn diện cho môn Võ Cổ Truyền Việt Nam — từ quản trị tổ chức, đào tạo, giải đấu, chấm điểm real-time, xếp hạng, đến bảo tồn di sản văn hóa.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start infrastructure (Docker)
docker compose up -d

# Run database migrations
cd backend && go run ./cmd/migrate up

# Start development
npm run dev              # Frontend (Next.js)
npm run dev:backend      # Backend (Go API)
```

## 📁 Project Structure

```
vct-platform/
├── apps/
│   ├── next/              # Next.js Frontend (App Router)
│   └── expo/              # React Native Mobile App
├── packages/
│   ├── app/               # Shared application features
│   ├── shared-types/      # TypeScript types (shared FE ↔ BE)
│   ├── shared-utils/      # Shared utilities
│   └── ui/                # UI Component Library
├── backend/               # Go Backend API (Clean Architecture)
│   ├── cmd/               # Entry points (server, worker, migrate)
│   ├── internal/
│   │   ├── domain/        # Business logic layer
│   │   ├── adapter/       # Infrastructure adapters
│   │   ├── handler/       # HTTP handlers
│   │   └── pkg/           # Shared internal packages
│   └── sql/               # Migrations, queries, seeds
├── infra/                 # Docker, Kubernetes, Terraform
├── docs/                  # Architecture, API, guides
└── scripts/               # Utility scripts
```

## 🏗️ Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router), TypeScript, React 19 |
| Backend | Go 1.26+ (Clean Architecture) |
| Database | PostgreSQL 18+, Supabase, Neon |
| Cache | Redis 7+ |
| Search | Meilisearch |
| Storage | MinIO / Supabase Storage |
| Queue | NATS |
| CI/CD | GitHub Actions |

## 📦 Modules

| # | Module | Description |
|---|--------|-------------|
| 1 | **Tổ chức** | Liên đoàn, CLB, Chi nhánh |
| 2 | **Con người** | VĐV, HLV, Trọng tài |
| 3 | **Đào tạo** | Giáo trình, Kỹ thuật, Thi đai |
| 4 | **Giải đấu** ★ | CORE — Quản lý toàn bộ giải đấu |
| 5 | **Chấm điểm** | Real-time scoring (Quyền + Đối kháng) |
| 6 | **Xếp hạng** | ELO/Glicko rating, BXH quốc gia |
| 7 | **Di sản** | Bảo tồn văn hóa, phả hệ |
| 8 | **Tài chính** | Học phí, ngân sách, tài trợ |
| 9 | **Cộng đồng** | Mạng xã hội, marketplace |
| 10 | **Admin** | Quản trị hệ thống, RBAC |

## 🧪 Testing

```bash
make test            # All tests
make test-e2e        # End-to-end tests
make test-backend    # Go backend tests
make lint            # Linting
make typecheck       # TypeScript checks
```

## 📖 Documentation

- [Architecture Overview](docs/architecture/overview.md)
- [API Design](docs/architecture/api-design.md)
- [Setup Guide](docs/guides/setup.md)

## 📝 License

Private — VCT Platform. All rights reserved.
