# VCT PLATFORM — MASTER BUILD PROMPT
## Nền tảng Quản trị Võ thuật Toàn diện cho Võ Cổ Truyền Việt Nam

> **Mục đích**: Prompt này là bản thiết kế kỹ thuật và yêu cầu triển khai đầy đủ cho AI developer. AI nhận prompt này phải triển khai toàn bộ hệ thống VCT Platform từ đầu đến cuối, bao gồm cấu trúc thư mục, database schema, backend API, frontend UI, và tích hợp với module quản lý giải đấu đang triển khai.

---

## PHẦN 0: THÔNG TIN PHIÊN BẢN & TECH STACK

### Tech Stack bắt buộc

| Layer | Technology | Version | Ghi chú |
|-------|-----------|---------|---------|
| **Frontend** | Next.js (App Router) | 16.1+ | Server Components, React 19.2+, Turbopack |
| **Language** | TypeScript | 5.9 stable (sẵn sàng migrate lên 6.0) | Strict mode bắt buộc |
| **Backend API** | Go (Golang) | 1.26+ | Green Tea GC, cgo overhead giảm 30% |
| **Database Primary** | PostgreSQL | 18+ | Self-hosted production |
| **Database Cloud** | Supabase | PostgreSQL 17+ | Auth, Realtime, Storage, RLS |
| **Database Serverless** | Neon | PostgreSQL 17+ | Branching cho dev/staging, autoscaling |
| **ORM/Query Builder** | Drizzle ORM (TS) + sqlc (Go) | Latest | Type-safe queries cả hai phía |
| **Cache** | Redis 7+ / Valkey | Latest | Session, ranking cache, real-time |
| **Search** | Meilisearch | Latest | Full-text search tiếng Việt |
| **Object Storage** | MinIO (self-host) / Supabase Storage | Latest | Video, ảnh, tài liệu |
| **Message Queue** | NATS | Latest | Event streaming, async jobs |
| **Containerization** | Docker + Docker Compose | Latest | Dev environment |
| **Orchestration** | Kubernetes (production) | Latest | Scaling, HA |
| **CI/CD** | GitHub Actions | - | Auto test, deploy |
| **Monitoring** | Grafana + Prometheus + Loki | Latest | Metrics, logs, alerting |

### Nguyên tắc Kiến trúc Bất Di Bất Dịch

1. **Event-First** — Sự kiện là sự thật duy nhất. State là phép tính từ events.
2. **Bitemporal Design** — Mọi dữ liệu trả lời được "thực tế xảy ra khi nào?" và "hệ thống ghi nhận khi nào?"
3. **Config over Code** — Mọi quy tắc nghiệp vụ cấu hình được từ admin UI, không deploy lại.
4. **Stable View Layer** — Application giao tiếp qua API Views, không bao giờ query trực tiếp tables.
5. **Extension by Default** — Mọi entity table có `metadata JSONB`. Field mới = INSERT, không ALTER TABLE.
6. **Reference over Enum** — Dùng lookup/reference tables thay PostgreSQL ENUM cho domain values.
7. **Offline Resilience** — Chấm điểm, điểm danh hoạt động offline, sync khi có mạng.
8. **Zero Trust Isolation** — Multi-tenant RLS enforce tại database layer.
9. **Immutable History** — Dữ liệu đã ghi nhận không bao giờ bị xóa, chỉ soft-delete.
10. **Vietnamese-First** — UI, thuật ngữ, format tiền tệ/ngày tháng mặc định tiếng Việt.

---

## PHẦN 1: CẤU TRÚC THƯ MỤC DỰ ÁN

```
vct-platform/
├── README.md
├── docker-compose.yml                    # Dev environment
├── docker-compose.prod.yml               # Production
├── Makefile                              # Common commands
├── .github/
│   └── workflows/
│       ├── ci.yml                        # Lint, test, build
│       ├── cd-staging.yml                # Deploy staging
│       └── cd-production.yml             # Deploy production
│
├── packages/                             # Shared packages (monorepo)
│   ├── shared-types/                     # TypeScript types shared FE ↔ BE
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── tournament.ts             # Tournament domain types
│   │       ├── organization.ts           # Org/Club types
│   │       ├── athlete.ts               # Athlete/Coach types
│   │       ├── training.ts              # Training/Curriculum types
│   │       ├── scoring.ts              # Scoring/Judging types
│   │       ├── ranking.ts              # Ranking types
│   │       ├── heritage.ts             # Heritage/Lineage types
│   │       ├── community.ts            # Community/Social types
│   │       ├── finance.ts              # Financial types
│   │       └── common.ts               # Pagination, errors, enums
│   │
│   ├── shared-utils/                    # Shared utilities
│   │   ├── package.json
│   │   └── src/
│   │       ├── date.ts                  # Vietnamese date formatting
│   │       ├── currency.ts              # VND formatting
│   │       ├── validation.ts            # Zod schemas
│   │       ├── slug.ts                  # Vietnamese-safe slugify
│   │       └── constants.ts
│   │
│   └── ui/                              # Shared UI component library
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── primitives/              # Button, Input, Modal, Toast...
│           ├── composites/              # DataTable, FileUpload, RichEditor...
│           ├── domain/                  # BracketView, ScoreBoard, LineageTree...
│           └── layouts/                 # AppShell, Sidebar, TopBar...
│
├── apps/
│   ├── web/                             # ★ NEXT.JS FRONTEND (App Router)
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   ├── tsconfig.json
│   │   ├── tailwind.config.ts
│   │   ├── middleware.ts                # Auth, i18n, tenant routing
│   │   ├── public/
│   │   │   ├── locales/
│   │   │   │   ├── vi/                  # Vietnamese translations
│   │   │   │   └── en/                  # English translations
│   │   │   └── assets/
│   │   │
│   │   └── src/
│   │       ├── app/                     # ★ APP ROUTER — Route segments
│   │       │   ├── layout.tsx           # Root layout (providers, fonts)
│   │       │   ├── page.tsx             # Landing/Home
│   │       │   ├── globals.css
│   │       │   │
│   │       │   ├── (auth)/              # Auth group
│   │       │   │   ├── login/page.tsx
│   │       │   │   ├── register/page.tsx
│   │       │   │   └── forgot-password/page.tsx
│   │       │   │
│   │       │   ├── (public)/            # Public pages
│   │       │   │   ├── tournaments/
│   │       │   │   │   ├── page.tsx              # Danh sách giải đấu
│   │       │   │   │   └── [slug]/
│   │       │   │   │       ├── page.tsx           # Chi tiết giải
│   │       │   │   │       ├── brackets/page.tsx  # Bảng đấu
│   │       │   │   │       ├── results/page.tsx   # Kết quả
│   │       │   │   │       └── live/page.tsx      # Live scoring
│   │       │   │   ├── rankings/page.tsx          # BXH quốc gia
│   │       │   │   ├── clubs/page.tsx             # Tìm CLB
│   │       │   │   ├── athletes/[id]/page.tsx     # Profile VĐV
│   │       │   │   ├── heritage/                  # Di sản võ thuật
│   │       │   │   │   ├── page.tsx               # Tổng quan
│   │       │   │   │   ├── lineage/page.tsx       # Phả hệ
│   │       │   │   │   ├── techniques/page.tsx    # Thư viện kỹ thuật
│   │       │   │   │   └── [school]/page.tsx      # Chi tiết môn phái
│   │       │   │   └── community/
│   │       │   │       ├── page.tsx               # Newsfeed
│   │       │   │       └── [postId]/page.tsx
│   │       │   │
│   │       │   ├── (dashboard)/         # ★ AUTHENTICATED AREA
│   │       │   │   ├── layout.tsx       # Dashboard shell (sidebar, topbar)
│   │       │   │   │
│   │       │   │   ├── overview/page.tsx          # Dashboard tổng quan
│   │       │   │   │
│   │       │   │   ├── organizations/             # MODULE 1: Quản trị Tổ chức
│   │       │   │   │   ├── page.tsx               # Danh sách org
│   │       │   │   │   ├── [orgId]/
│   │       │   │   │   │   ├── page.tsx           # Chi tiết org
│   │       │   │   │   │   ├── members/page.tsx
│   │       │   │   │   │   ├── settings/page.tsx
│   │       │   │   │   │   └── finance/page.tsx
│   │       │   │   │   └── create/page.tsx
│   │       │   │   │
│   │       │   │   ├── clubs/                     # MODULE 2: Quản lý CLB/Võ đường
│   │       │   │   │   ├── page.tsx
│   │       │   │   │   ├── [clubId]/
│   │       │   │   │   │   ├── page.tsx           # Dashboard CLB
│   │       │   │   │   │   ├── members/page.tsx   # DS thành viên
│   │       │   │   │   │   ├── classes/page.tsx   # Lịch lớp học
│   │       │   │   │   │   ├── attendance/page.tsx # Điểm danh
│   │       │   │   │   │   ├── finance/page.tsx   # Thu chi CLB
│   │       │   │   │   │   ├── facilities/page.tsx
│   │       │   │   │   │   └── settings/page.tsx
│   │       │   │   │   └── create/page.tsx
│   │       │   │   │
│   │       │   │   ├── people/                    # MODULE 3: Quản lý Con người
│   │       │   │   │   ├── athletes/
│   │       │   │   │   │   ├── page.tsx           # DS VĐV
│   │       │   │   │   │   ├── [id]/page.tsx      # Hồ sơ VĐV
│   │       │   │   │   │   └── create/page.tsx
│   │       │   │   │   ├── coaches/
│   │       │   │   │   │   ├── page.tsx
│   │       │   │   │   │   └── [id]/page.tsx
│   │       │   │   │   └── referees/
│   │       │   │   │       ├── page.tsx
│   │       │   │   │       └── [id]/page.tsx
│   │       │   │   │
│   │       │   │   ├── training/                  # MODULE 4: Đào tạo
│   │       │   │   │   ├── curriculum/page.tsx     # Giáo trình
│   │       │   │   │   ├── techniques/page.tsx     # Thư viện kỹ thuật
│   │       │   │   │   ├── plans/page.tsx          # Kế hoạch tập
│   │       │   │   │   ├── belt-exams/page.tsx     # Thi đai
│   │       │   │   │   └── elearning/page.tsx      # E-learning
│   │       │   │   │
│   │       │   │   ├── tournaments/               # ★ MODULE 5: Giải đấu (TÍCH HỢP MODULE ĐANG CÓ)
│   │       │   │   │   ├── page.tsx               # DS giải đấu
│   │       │   │   │   ├── create/page.tsx        # Tạo giải mới
│   │       │   │   │   ├── [tournamentId]/
│   │       │   │   │   │   ├── page.tsx           # Dashboard giải
│   │       │   │   │   │   ├── config/page.tsx    # Cấu hình giải
│   │       │   │   │   │   ├── registration/page.tsx  # Đăng ký thi đấu
│   │       │   │   │   │   ├── weigh-in/page.tsx  # Cân VĐV
│   │       │   │   │   │   ├── draw/page.tsx      # Bốc thăm/xếp nhánh
│   │       │   │   │   │   ├── schedule/page.tsx  # Lịch thi đấu
│   │       │   │   │   │   ├── scoring/           # ★ CHẤM ĐIỂM (core)
│   │       │   │   │   │   │   ├── page.tsx       # Tổng quan scoring
│   │       │   │   │   │   │   ├── quyen/page.tsx # Chấm quyền thuật
│   │       │   │   │   │   │   ├── doi-khang/page.tsx # Chấm đối kháng
│   │       │   │   │   │   │   └── [matchId]/page.tsx # Chấm trận cụ thể
│   │       │   │   │   │   ├── results/page.tsx   # Kết quả
│   │       │   │   │   │   ├── protests/page.tsx  # Khiếu nại
│   │       │   │   │   │   ├── media/page.tsx     # Ảnh/Video
│   │       │   │   │   │   └── reports/page.tsx   # Báo cáo
│   │       │   │   │   └── templates/page.tsx     # Tournament templates
│   │       │   │   │
│   │       │   │   ├── rankings/                  # MODULE 6: Xếp hạng
│   │       │   │   │   ├── page.tsx               # BXH tổng
│   │       │   │   │   ├── doi-khang/page.tsx     # BXH đối kháng
│   │       │   │   │   ├── quyen/page.tsx         # BXH quyền thuật
│   │       │   │   │   └── analytics/page.tsx     # Phân tích
│   │       │   │   │
│   │       │   │   ├── heritage/                  # MODULE 7: Di sản Văn hóa
│   │       │   │   │   ├── lineage/page.tsx       # Quản lý phả hệ
│   │       │   │   │   ├── schools/page.tsx       # Quản lý môn phái
│   │       │   │   │   ├── library/page.tsx       # Thư viện di sản
│   │       │   │   │   └── events/page.tsx        # Sự kiện văn hóa
│   │       │   │   │
│   │       │   │   ├── finance/                   # MODULE 8: Tài chính
│   │       │   │   │   ├── page.tsx               # Tổng quan tài chính
│   │       │   │   │   ├── fees/page.tsx          # Học phí
│   │       │   │   │   ├── tournament-budget/page.tsx
│   │       │   │   │   ├── sponsorship/page.tsx
│   │       │   │   │   └── reports/page.tsx
│   │       │   │   │
│   │       │   │   ├── community/                 # MODULE 9: Cộng đồng
│   │       │   │   │   ├── feed/page.tsx
│   │       │   │   │   ├── groups/page.tsx
│   │       │   │   │   └── marketplace/page.tsx
│   │       │   │   │
│   │       │   │   └── admin/                     # MODULE 10: System Admin
│   │       │   │       ├── users/page.tsx
│   │       │   │       ├── roles/page.tsx
│   │       │   │       ├── reference-data/page.tsx
│   │       │   │       ├── feature-flags/page.tsx
│   │       │   │       ├── audit-log/page.tsx
│   │       │   │       └── system/page.tsx
│   │       │   │
│   │       │   └── api/                  # Next.js API Routes (BFF layer)
│   │       │       └── [...proxy]/route.ts   # Proxy to Go backend
│   │       │
│   │       ├── components/              # App-specific components
│   │       │   ├── tournament/          # Tournament-specific UI
│   │       │   ├── scoring/             # Scoring interfaces
│   │       │   ├── bracket/             # Bracket visualization
│   │       │   ├── lineage/             # Lineage tree
│   │       │   └── charts/              # Analytics charts
│   │       │
│   │       ├── hooks/                   # Custom React hooks
│   │       │   ├── use-auth.ts
│   │       │   ├── use-realtime.ts      # Supabase realtime subscription
│   │       │   ├── use-offline.ts       # Offline detection & queue
│   │       │   ├── use-scoring.ts       # Scoring state machine
│   │       │   └── use-tournament.ts
│   │       │
│   │       ├── stores/                  # Zustand stores
│   │       │   ├── auth-store.ts
│   │       │   ├── tournament-store.ts
│   │       │   ├── scoring-store.ts
│   │       │   └── offline-store.ts
│   │       │
│   │       ├── lib/                     # Utilities & configs
│   │       │   ├── api-client.ts        # Go backend API client
│   │       │   ├── supabase/
│   │       │   │   ├── client.ts        # Browser client
│   │       │   │   ├── server.ts        # Server component client
│   │       │   │   └── middleware.ts     # Auth middleware
│   │       │   ├── neon.ts              # Neon serverless driver
│   │       │   └── i18n.ts              # Internationalization config
│   │       │
│   │       └── styles/
│   │           └── globals.css
│   │
│   ├── api/                             # ★ GO BACKEND API
│   │   ├── go.mod
│   │   ├── go.sum
│   │   ├── Makefile
│   │   ├── Dockerfile
│   │   ├── cmd/
│   │   │   ├── server/                  # HTTP API server
│   │   │   │   └── main.go
│   │   │   ├── worker/                  # Background job worker
│   │   │   │   └── main.go
│   │   │   └── migrate/                 # DB migration runner
│   │   │       └── main.go
│   │   │
│   │   ├── internal/
│   │   │   ├── config/                  # Environment config
│   │   │   │   └── config.go
│   │   │   │
│   │   │   ├── domain/                  # ★ DOMAIN LAYER (business logic)
│   │   │   │   ├── tournament/
│   │   │   │   │   ├── entity.go        # Tournament, Match, Bracket entities
│   │   │   │   │   ├── service.go       # Tournament business logic
│   │   │   │   │   ├── repository.go    # Repository interface
│   │   │   │   │   ├── events.go        # Domain events
│   │   │   │   │   └── errors.go
│   │   │   │   ├── scoring/
│   │   │   │   │   ├── entity.go        # Score, JudgeScore, ScoringRule
│   │   │   │   │   ├── service.go       # Scoring engine
│   │   │   │   │   ├── calculator.go    # Score calculation strategies
│   │   │   │   │   ├── repository.go
│   │   │   │   │   └── events.go
│   │   │   │   ├── organization/
│   │   │   │   │   ├── entity.go        # Federation, Club, Branch
│   │   │   │   │   ├── service.go
│   │   │   │   │   └── repository.go
│   │   │   │   ├── athlete/
│   │   │   │   │   ├── entity.go        # Athlete, Coach, Referee
│   │   │   │   │   ├── service.go
│   │   │   │   │   └── repository.go
│   │   │   │   ├── training/
│   │   │   │   │   ├── entity.go        # Curriculum, Technique, BeltExam
│   │   │   │   │   ├── service.go
│   │   │   │   │   └── repository.go
│   │   │   │   ├── ranking/
│   │   │   │   │   ├── entity.go        # Ranking, EloRating
│   │   │   │   │   ├── service.go       # Ranking calculator
│   │   │   │   │   ├── elo.go           # ELO/Glicko algorithm
│   │   │   │   │   └── repository.go
│   │   │   │   ├── heritage/
│   │   │   │   │   ├── entity.go        # School, Lineage, Technique
│   │   │   │   │   ├── service.go
│   │   │   │   │   └── repository.go
│   │   │   │   ├── finance/
│   │   │   │   │   ├── entity.go
│   │   │   │   │   ├── service.go
│   │   │   │   │   └── repository.go
│   │   │   │   └── community/
│   │   │   │       ├── entity.go
│   │   │   │       ├── service.go
│   │   │   │       └── repository.go
│   │   │   │
│   │   │   ├── adapter/                 # ★ ADAPTER LAYER (infrastructure)
│   │   │   │   ├── postgres/            # PostgreSQL repositories
│   │   │   │   │   ├── tournament_repo.go
│   │   │   │   │   ├── scoring_repo.go
│   │   │   │   │   ├── athlete_repo.go
│   │   │   │   │   ├── organization_repo.go
│   │   │   │   │   ├── training_repo.go
│   │   │   │   │   ├── ranking_repo.go
│   │   │   │   │   ├── heritage_repo.go
│   │   │   │   │   ├── finance_repo.go
│   │   │   │   │   └── community_repo.go
│   │   │   │   ├── redis/               # Redis cache
│   │   │   │   │   ├── ranking_cache.go
│   │   │   │   │   └── session_cache.go
│   │   │   │   ├── nats/                # Event publisher
│   │   │   │   │   └── publisher.go
│   │   │   │   ├── minio/               # Object storage
│   │   │   │   │   └── storage.go
│   │   │   │   └── meilisearch/         # Search
│   │   │   │       └── indexer.go
│   │   │   │
│   │   │   ├── handler/                 # ★ HTTP HANDLER LAYER
│   │   │   │   ├── router.go            # Chi/Gin router setup
│   │   │   │   ├── middleware/
│   │   │   │   │   ├── auth.go          # JWT/Supabase auth
│   │   │   │   │   ├── rbac.go          # Role-based access
│   │   │   │   │   ├── tenant.go        # Multi-tenant context
│   │   │   │   │   ├── rate_limit.go
│   │   │   │   │   ├── cors.go
│   │   │   │   │   └── logging.go
│   │   │   │   ├── v1/                  # API v1 handlers
│   │   │   │   │   ├── tournament_handler.go
│   │   │   │   │   ├── scoring_handler.go
│   │   │   │   │   ├── athlete_handler.go
│   │   │   │   │   ├── organization_handler.go
│   │   │   │   │   ├── training_handler.go
│   │   │   │   │   ├── ranking_handler.go
│   │   │   │   │   ├── heritage_handler.go
│   │   │   │   │   ├── finance_handler.go
│   │   │   │   │   └── community_handler.go
│   │   │   │   └── ws/                  # WebSocket handlers
│   │   │   │       ├── scoring_ws.go    # Real-time scoring
│   │   │   │       └── tournament_ws.go # Live tournament updates
│   │   │   │
│   │   │   └── pkg/                     # Internal shared packages
│   │   │       ├── database/
│   │   │       │   ├── postgres.go      # Connection pool
│   │   │       │   └── migration.go
│   │   │       ├── auth/
│   │   │       │   └── supabase.go      # Supabase JWT validation
│   │   │       ├── event/
│   │   │       │   └── bus.go           # Event bus interface
│   │   │       ├── logger/
│   │   │       │   └── logger.go        # Structured logging
│   │   │       └── response/
│   │   │           └── response.go      # Standard API response
│   │   │
│   │   ├── sql/                         # ★ SQL FILES
│   │   │   ├── migrations/              # Numbered migrations
│   │   │   │   ├── 000001_init_reference_tables.up.sql
│   │   │   │   ├── 000001_init_reference_tables.down.sql
│   │   │   │   ├── 000002_init_iam.up.sql
│   │   │   │   ├── 000003_init_organizations.up.sql
│   │   │   │   ├── 000004_init_athletes.up.sql
│   │   │   │   ├── 000005_init_tournaments.up.sql
│   │   │   │   ├── 000006_init_scoring.up.sql
│   │   │   │   ├── 000007_init_rankings.up.sql
│   │   │   │   ├── 000008_init_training.up.sql
│   │   │   │   ├── 000009_init_heritage.up.sql
│   │   │   │   ├── 000010_init_finance.up.sql
│   │   │   │   ├── 000011_init_community.up.sql
│   │   │   │   └── 000012_init_views.up.sql       # API view layer
│   │   │   ├── queries/                 # sqlc query files
│   │   │   │   ├── tournaments.sql
│   │   │   │   ├── scoring.sql
│   │   │   │   ├── athletes.sql
│   │   │   │   ├── organizations.sql
│   │   │   │   ├── training.sql
│   │   │   │   ├── rankings.sql
│   │   │   │   ├── heritage.sql
│   │   │   │   ├── finance.sql
│   │   │   │   └── community.sql
│   │   │   ├── seeds/                   # Seed data
│   │   │   │   ├── reference_data.sql   # Lookup tables data
│   │   │   │   ├── demo_data.sql        # Demo/test data
│   │   │   │   └── vietnamese_martial_arts.sql  # Môn phái VCT seed
│   │   │   └── rls/                     # Row Level Security policies
│   │   │       └── policies.sql
│   │   │
│   │   └── sqlc.yaml                    # sqlc config
│   │
│   └── mobile/                          # (Phase 3) React Native / Expo
│       └── ...
│
├── infra/                               # Infrastructure as Code
│   ├── docker/
│   │   ├── postgres/
│   │   │   ├── Dockerfile
│   │   │   └── init.sql
│   │   ├── redis/
│   │   ├── meilisearch/
│   │   ├── minio/
│   │   └── nats/
│   ├── k8s/                             # Kubernetes manifests
│   │   ├── base/
│   │   ├── staging/
│   │   └── production/
│   └── terraform/                       # Cloud provisioning
│
├── docs/                                # Documentation
│   ├── architecture/
│   │   ├── overview.md
│   │   ├── database-schema-v5.md        # ★ Schema V5.0 ULTIMATE (đang có)
│   │   ├── api-design.md
│   │   └── decisions/                   # Architecture Decision Records
│   ├── api/
│   │   └── openapi.yaml                 # OpenAPI 3.1 spec
│   └── guides/
│       ├── setup.md
│       ├── deployment.md
│       └── contributing.md
│
├── scripts/                             # Utility scripts
│   ├── setup.sh                         # First-time setup
│   ├── seed.sh                          # Seed database
│   └── generate.sh                      # Code generation (sqlc, types)
│
├── turbo.json                           # Turborepo config
├── pnpm-workspace.yaml                  # PNPM workspace
├── package.json                         # Root package.json
└── tsconfig.base.json                   # Shared TS config
```

---

## PHẦN 2: DATABASE SCHEMA — TÍCH HỢP VỚI V5.0 ULTIMATE

### Chiến lược Database 3 tầng

```
┌─────────────────────────────────────────────────────┐
│                    APPLICATION                       │
├──────────┬──────────────────┬───────────────────────┤
│          │                  │                        │
│  Supabase│   PostgreSQL     │      Neon              │
│  (Auth,  │   Self-hosted    │   (Dev/Staging,        │
│  Realtime│   (Production    │    Branch per PR,      │
│  Storage,│    Primary DB)   │    Serverless          │
│  Edge)   │                  │    Analytics)          │
│          │                  │                        │
└──────────┴──────────────────┴───────────────────────┘
```

**Phân vai trò:**
- **Supabase**: Authentication (GoTrue), Realtime subscriptions (live scoring, notifications), Storage (media files), Edge Functions (lightweight triggers)
- **PostgreSQL Self-hosted**: Production primary database, full control, Event Sourcing store, OLTP workload
- **Neon**: Development branches (1 branch per PR/feature), staging environment, serverless analytics queries, read replicas

### Schema Groups (từ V5.0 ULTIMATE đã thiết kế)

**Nhóm 0 — Reference Tables** (8+ bảng): `ref_sport_types`, `ref_competition_formats`, `ref_weight_classes`, `ref_belt_ranks`, `ref_penalty_types`, `ref_scoring_criteria`, `ref_age_categories`, `ref_equipment_types`... Tất cả domain values dùng reference tables thay ENUM.

**Nhóm 1 — IAM & Tổ chức**: `users`, `user_roles` (context-aware RBAC), `federations`, `clubs`, `club_branches`, `club_memberships`

**Nhóm 2 — Con người**: `athletes`, `athlete_belt_history`, `athlete_weight_history`, `athlete_medical_records`, `coaches`, `coach_certifications`, `referees`, `referee_certifications`

**Nhóm 3 — Đào tạo**: `curricula`, `curriculum_levels`, `techniques`, `technique_media`, `training_plans`, `training_sessions`, `attendance_records`, `belt_examinations`, `belt_exam_results`, `courses` (e-learning)

**Nhóm 4 — Giải đấu (★ TÍCH HỢP MODULE ĐANG CÓ)**: `tournaments`, `tournament_categories`, `tournament_entries`, `registrations`, `weigh_ins`, `draws`, `bracket_slots`, `venues`, `arenas`, `sessions`, `tournament_templates`

**Nhóm 5 — Trận đấu & Chấm điểm**: `matches`, `match_events` (Event Sourcing — append-only), `judge_scores`, `flag_votes`, `scoring_criteria_snapshots`, `scoring_rules`, `video_reviews`

**Nhóm 6 — Kết quả & Xếp hạng**: `results`, `medals`, `rankings`, `ranking_snapshots`, `elo_ratings`, `head_to_head_records`

**Nhóm 7 — Khiếu nại & Kỷ luật**: `protests`, `protest_decisions`, `disciplinary_actions`, `sanctions`

**Nhóm 8 — Di sản Văn hóa**: `martial_schools`, `school_lineage`, `lineage_nodes`, `heritage_techniques`, `heritage_media`, `heritage_glossary`

**Nhóm 9 — Tài chính**: `fee_schedules`, `payments`, `invoices`, `sponsorships`, `tournament_budgets`, `budget_items`, `fundraising_campaigns`

**Nhóm 10 — Cộng đồng**: `posts`, `comments`, `reactions`, `follows`, `groups`, `group_memberships`, `marketplace_listings`

**Nhóm 11 — Audit & Hệ thống**: `audit_log`, `sync_queue` (offline), `sync_conflicts`, `feature_flags`, `schema_versions`, `device_registry`, `notification_queue`

### Đặc biệt — Event Sourcing cho Match State

```sql
-- match_events: Source of Truth (append-only, immutable)
CREATE TABLE match_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id),
    event_type TEXT NOT NULL,           -- ref table: 'SCORE_RED', 'PENALTY_BLUE', 'TIMEOUT', 'ROUND_START'...
    event_data JSONB NOT NULL,          -- Flexible payload
    sequence_number BIGINT NOT NULL,    -- Ordering guarantee
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recorded_by UUID REFERENCES users(id),
    device_id UUID REFERENCES device_registry(id),
    sync_status TEXT DEFAULT 'synced',  -- 'pending', 'synced', 'conflict'
    metadata JSONB DEFAULT '{}',

    UNIQUE (match_id, sequence_number)
);

-- matches table: computed state (materialized from events)
-- Trigger/function rebuilds match state from match_events on demand
```

### Bitemporal Design (cho 7 bảng critical)

```sql
-- Ví dụ: athlete_belt_history
CREATE TABLE athlete_belt_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES athletes(id),
    belt_rank_id UUID NOT NULL REFERENCES ref_belt_ranks(id),
    valid_from DATE NOT NULL,           -- Ngày thực tế thăng đai
    valid_to DATE DEFAULT 'infinity',   -- Ngày hết hiệu lực
    recorded_at TIMESTAMPTZ DEFAULT NOW(), -- Hệ thống ghi nhận khi nào
    recorded_by UUID REFERENCES users(id),
    superseded_by UUID REFERENCES athlete_belt_history(id),
    metadata JSONB DEFAULT '{}'
);
```

### API View Layer (Stable Contracts)

```sql
-- App KHÔNG BAO GIỜ query table trực tiếp
CREATE SCHEMA api_v1;

CREATE VIEW api_v1.athletes AS
SELECT
    a.id, a.full_name, a.date_of_birth,
    abh.belt_rank_id AS current_belt,
    c.name AS club_name,
    -- computed fields
    r.elo_rating,
    r.national_rank
FROM athletes a
LEFT JOIN LATERAL (
    SELECT belt_rank_id FROM athlete_belt_history
    WHERE athlete_id = a.id AND valid_to = 'infinity'
    ORDER BY valid_from DESC LIMIT 1
) abh ON true
LEFT JOIN clubs c ON a.current_club_id = c.id
LEFT JOIN rankings r ON r.athlete_id = a.id;
```

---

## PHẦN 3: TÍCH HỢP VỚI MODULE GIẢI ĐẤU ĐANG TRIỂN KHAI

### Hiện trạng Module Giải đấu

Module quản lý giải đấu đã được thiết kế qua 5 vòng phản biện (V1 → V5 ULTIMATE) với:
- Database Schema V5.0: Event Sourcing, Bitemporal, Stable View Layer, 11 nhóm bảng
- Stress-tested 15 kịch bản cực đoan (VĐV ma, sập server, gian lận, 10K VĐV, sáp nhập liên đoàn...)
- 6 cơ chế tự tiến hóa (ref tables, metadata, feature flags, scoring config, event types, view versioning)

### Chiến lược Tích hợp

```
★ QUAN TRỌNG: Module giải đấu là CORE của platform.
Các module khác ORBIT xung quanh nó.

Tournament Module (existing schema) = Nhóm 4 + 5 + 6 + 7
                    ↑ references ↓ feeds into
Organization Module ─────────────→ Tournament (CLB đăng ký VĐV thi đấu)
People Module ───────────────────→ Tournament (VĐV, trọng tài tham gia)
Training Module ─────────────────→ Tournament (kết quả ảnh hưởng giáo trình)
Ranking Module ←─────────────────  Tournament (kết quả feed ranking)
Heritage Module ←────────────────  Tournament (liên kết môn phái)
Finance Module ←─────────────────  Tournament (lệ phí, giải thưởng, ngân sách)
Community Module ←───────────────  Tournament (live updates, highlights)
```

### Mapping cụ thể

| Bảng đang có (V5.0) | Module mới | Cách tích hợp |
|---|---|---|
| `tournaments` | Organization | `federation_id` FK → `federations` |
| `registrations` | People + Clubs | `athlete_id` → `athletes`, `club_id` → `clubs` |
| `matches` + `match_events` | Scoring | Event Sourcing giữ nguyên, thêm UI components |
| `results` + `medals` | Ranking | Trigger: kết quả mới → recalculate ranking |
| `judge_scores` | People (Referees) | `referee_id` → `referees` + certification check |
| `tournament_budgets` | Finance | Expand thành module tài chính đầy đủ |
| `martial_schools` | Heritage | Standalone heritage module + link từ athlete profiles |

---

## PHẦN 4: YÊU CẦU TRIỂN KHAI CHI TIẾT TỪNG MODULE

### MODULE 1: QUẢN TRỊ TỔ CHỨC (Organization Management)

**Backend (Go):**
- CRUD Liên đoàn: tạo, sửa, phân cấp (Quốc gia → Tỉnh/Thành)
- CRUD Câu lạc bộ/Võ đường: đầy đủ hồ sơ, logo, lịch sử, dòng phái
- Quản lý chi nhánh (multi-location): đồng bộ thành viên, lịch tập
- Dashboard tổng quan: thống kê CLB, võ sinh, giải đấu theo vùng
- Phân quyền: FEDERATION_ADMIN, CLUB_MANAGER roles

**Frontend (Next.js):**
- Trang quản lý tổ chức: tree view cấu trúc Liên đoàn → CLB
- Form tạo/sửa CLB: multi-step wizard, upload logo, map location
- Dashboard CLB: số thành viên, lịch tập tuần, thu chi, sắp thi đấu
- Quản lý cơ sở vật chất: phòng tập, lịch sử dụng, trang thiết bị

**API Endpoints:**
```
GET    /api/v1/federations
POST   /api/v1/federations
GET    /api/v1/federations/:id
PUT    /api/v1/federations/:id
GET    /api/v1/federations/:id/clubs

GET    /api/v1/clubs
POST   /api/v1/clubs
GET    /api/v1/clubs/:id
PUT    /api/v1/clubs/:id
GET    /api/v1/clubs/:id/members
GET    /api/v1/clubs/:id/dashboard
GET    /api/v1/clubs/:id/branches
POST   /api/v1/clubs/:id/branches
```

### MODULE 2: QUẢN LÝ CON NGƯỜI (People Management)

**Backend (Go):**
- CRUD Athlete: hồ sơ đầy đủ, ảnh, CCCD, y tế, bảo hiểm
- Belt history: bitemporal tracking, thi lên đai
- Weight history: tracking cân nặng theo thời gian
- Medical records: tiền sử chấn thương, nhóm máu
- Coach/Referee profiles: chứng chỉ, chuyên môn, lịch sử
- Transfer system: chuyển CLB, giữ lịch sử

**Frontend (Next.js):**
- Athlete profile page: tabs (Hồ sơ / Thành tích / Chỉ số / Y tế / Lịch sử)
- Athlete search & filter: theo CLB, đai, hạng cân, tuổi
- Coach dashboard: danh sách học trò, tiến độ, lịch dạy
- Referee panel: lịch điều hành, certification status

**API Endpoints:**
```
GET    /api/v1/athletes?club_id=&belt=&weight_class=&age_category=
POST   /api/v1/athletes
GET    /api/v1/athletes/:id
PUT    /api/v1/athletes/:id
GET    /api/v1/athletes/:id/belt-history
POST   /api/v1/athletes/:id/belt-history
GET    /api/v1/athletes/:id/weight-history
GET    /api/v1/athletes/:id/medical-records
GET    /api/v1/athletes/:id/results
GET    /api/v1/athletes/:id/rankings

GET    /api/v1/coaches
GET    /api/v1/coaches/:id
GET    /api/v1/coaches/:id/students

GET    /api/v1/referees
GET    /api/v1/referees/:id
GET    /api/v1/referees/:id/certifications
```

### MODULE 3: QUẢN LÝ ĐÀO TẠO (Training Management)

**Backend (Go):**
- Curriculum builder: giáo trình theo cấp bậc/đai, tùy chỉnh theo môn phái
- Technique library: CRUD bài quyền, kỹ thuật, binh khí + media
- Training plans: tạo kế hoạch tập, periodization, giao bài tập
- Attendance: điểm danh check-in/check-out mỗi buổi tập
- Belt examination: đăng ký thi, chấm điểm, cấp chứng nhận digital
- E-learning: CRUD khóa học, video, quiz

**Frontend (Next.js):**
- Curriculum editor: drag-drop sắp xếp bài theo level
- Technique detail: video player, ảnh phân tích tư thế, annotations
- Training plan calendar: weekly/monthly view, assign to athletes
- Attendance tracker: QR code scan hoặc manual check-in
- Belt exam form: giám khảo chấm trên tablet, tổng hợp real-time
- E-learning portal: video player, progress tracker, quiz engine

### MODULE 4: GIẢI ĐẤU — Tournament (★ TÍCH HỢP SCHEMA ĐANG CÓ)

**Đây là module core, dùng toàn bộ schema V5.0 ULTIMATE đã thiết kế. Triển khai:**

**Backend (Go):**
- Tournament CRUD: tạo giải từ template hoặc custom
- Registration engine: đăng ký online, validate điều kiện (tuổi, đai, cân)
- Weigh-in system: ghi nhận cân nặng, phân hạng cân tự động
- Draw engine: bốc thăm/seeding (loại trực tiếp, vòng tròn, hybrid), anti-clubmate collision
- Schedule optimizer: xếp lịch nhiều sàn đồng thời, giảm thời gian chờ
- Scoring engine:
  - Quyền thuật: N giám khảo chấm parallel → tổng hợp (bỏ cao/thấp)
  - Đối kháng: bấm điểm real-time → WebSocket broadcast
  - Event Sourcing: mọi thao tác chấm = append event
- Video review (VAR): đánh dấu timestamp, linked to match_events
- Protest system: submit, review, quyết định, appeal
- Results aggregator: BXH cá nhân, đồng đội, toàn đoàn
- Report generator: bảng vàng, thống kê, xuất PDF/Excel

**Frontend (Next.js):**
- Tournament wizard: multi-step tạo giải (thông tin → nội dung → cấu hình → xác nhận)
- Registration portal: CLB đăng ký VĐV, drag-drop chọn nội dung
- Bracket viewer: interactive bracket (D3.js), click vào trận xem chi tiết
- Scoring interface:
  - Quyền thuật: tablet-optimized, slide-to-score, confirm button
  - Đối kháng: full-screen score buttons, timer, penalty buttons
  - Offline mode: score locally → sync khi có mạng
- Live scoreboard: public real-time view, auto-refresh
- Arena management: drag-drop assign matches to arenas/mats
- Call system: hiển thị VĐV tiếp theo trên màn hình lớn
- Results dashboard: medals table, team standings, charts

### MODULE 5: XẾP HẠNG & THỐNG KÊ (Ranking & Analytics)

**Backend (Go):**
- Ranking engine:
  - ELO/Glicko rating cho đối kháng (theo hạng cân + lứa tuổi)
  - Points-based ranking cho quyền thuật
  - Thuật toán tính điểm: quy mô giải × thứ hạng × chất lượng đối thủ
- Ranking snapshots: lưu BXH theo mốc thời gian
- Head-to-head: lịch sử đối đầu giữa 2 VĐV
- Analytics API: win rate, scoring trends, progression charts

**Frontend (Next.js):**
- National ranking page: filter theo nội dung, hạng cân, lứa tuổi
- Athlete comparison: side-by-side stats, head-to-head record
- Progression charts: Recharts line chart ELO/ranking theo thời gian
- CLB analytics: overall performance, medal count, member growth
- Federation dashboard: heatmap CLB theo vùng, growth metrics

### MODULE 6: DI SẢN VĂN HÓA (Heritage & Culture)

**Backend (Go):**
- CRUD Môn phái: tên, lịch sử, đặc trưng, kỹ thuật signature
- Lineage tree: quan hệ sư phụ-đệ tử, graph database-style queries
- Heritage media: ảnh/video/tài liệu lịch sử, OCR cho tài liệu cũ
- Glossary: từ điển thuật ngữ Việt-Anh-Hán Nôm
- Events: CRUD sự kiện văn hóa, lễ hội, giao lưu

**Frontend (Next.js):**
- Lineage tree: interactive D3.js force-directed graph / tree layout
- School detail page: lịch sử, kỹ thuật, video, gallery
- Heritage timeline: chronological visualization
- Technique encyclopedia: search, filter, video player
- Glossary: searchable dictionary, audio pronunciation

### MODULE 7: TÀI CHÍNH (Finance Management)

**Backend (Go):**
- Fee management: CRUD gói học phí, gia hạn, nhắc nhở
- Payment processing: integration QR code (VietQR), chuyển khoản
- Tournament budget: ngân sách giải, thu lệ phí, chi giải thưởng
- Sponsorship: quản lý nhà tài trợ, gói tài trợ, quyền lợi
- Reports: báo cáo thu chi tự động (theo tháng/quý/năm)
- Crowdfunding: gây quỹ cho VĐV, dự án bảo tồn

**Frontend (Next.js):**
- Finance dashboard: biểu đồ thu chi, cash flow
- Fee collection: danh sách học phí, trạng thái thanh toán
- Invoice generator: tạo hóa đơn, gửi email/Zalo
- Budget planner: tạo ngân sách giải, theo dõi thực chi
- Sponsorship portal: quản lý nhà tài trợ, dashboard ROI

### MODULE 8: CỘNG ĐỒNG (Community & Social)

**Backend (Go):**
- Post CRUD: bài viết, ảnh, video, rich text
- Social features: like, comment, share, follow
- Groups: tạo nhóm theo môn phái, vùng, sở thích
- Notifications: push notification qua NATS + FCM
- Marketplace: đăng bán/thuê trang phục, dụng cụ

**Frontend (Next.js):**
- Newsfeed: infinite scroll, real-time updates (Supabase Realtime)
- Profile page: portfolio VĐV, timeline thành tích
- Group pages: discussion, events, member list
- Notification center: bell icon + dropdown
- Marketplace: product grid, filter, messaging

### MODULE 9: SYSTEM ADMIN

**Backend (Go):**
- User management: CRUD, activate/deactivate, impersonate
- Role management: RBAC config, permission matrix
- Reference data admin: CRUD tất cả reference tables từ UI
- Feature flags: enable/disable features per tenant/user
- Audit log viewer: filter, search, export
- System health: DB connections, cache hit rate, queue depth

**Frontend (Next.js):**
- Admin dashboard: system metrics, active users, error rate
- User management table: search, filter, bulk actions
- Permission matrix: visual grid roles × permissions
- Reference data editor: generic CRUD cho mọi ref table
- Feature flag toggles: on/off switches, rollout percentage
- Audit log viewer: timeline, filters, detail modal

---

## PHẦN 5: YÊU CẦU KỸ THUẬT CROSS-CUTTING

### 5.1 Authentication & Authorization

```
Flow:
1. User login → Supabase Auth (email/password, Google, phone OTP)
2. Supabase returns JWT
3. Frontend stores JWT in httpOnly cookie (Next.js middleware)
4. API requests → Go backend validates JWT via Supabase public key
5. Go middleware extracts user_id → query user_roles → inject vào context
6. Handler checks permissions via RBAC middleware
```

**RBAC Model:**
```go
// Context-aware: quyền gắn với scope cụ thể
type UserRole struct {
    Role      string    // FEDERATION_ADMIN, CLUB_MANAGER, REFEREE...
    ScopeType string    // SYSTEM, FEDERATION, TOURNAMENT, CLUB
    ScopeID   uuid.UUID // ID của entity
}

// Ví dụ: "Nguyễn Văn A là CLUB_MANAGER của CLB XYZ"
// → Chỉ thấy data của CLB XYZ, không thấy CLB khác
```

### 5.2 Multi-tenancy

- Mỗi Federation = 1 tenant
- RLS policies trên PostgreSQL enforce tại DB layer
- Go middleware inject `tenant_id` vào mọi query
- Supabase RLS bổ sung cho realtime subscriptions

### 5.3 Offline-First (Scoring Module)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Scoring UI  │────→│  IndexedDB   │────→│  Sync Queue │
│  (React)     │     │  (local)     │     │  (NATS)     │
└─────────────┘     └──────────────┘     └─────────────┘
                           │                     │
                     Offline Mode           Online Mode
                     (queue events)     (push to server)
                           │                     │
                           └──────── Conflict ───→│
                                   Resolution     │
                                                  ▼
                                          ┌─────────────┐
                                          │  PostgreSQL  │
                                          │  (source of  │
                                          │   truth)     │
                                          └─────────────┘
```

### 5.4 Real-time (WebSocket)

- **Scoring broadcast**: match events → NATS → WebSocket server → all clients viewing that match
- **Live scoreboard**: Supabase Realtime subscription trên `results` table
- **Notifications**: NATS → notification service → FCM/WebSocket push

### 5.5 Internationalization (i18n)

- Default: Tiếng Việt (vi)
- Supported: English (en), Chinese (zh) — cho hợp tác quốc tế
- Use `next-intl` hoặc `react-i18next`
- URL pattern: `/vi/tournaments`, `/en/tournaments`
- Thuật ngữ võ thuật: giữ nguyên tiếng Việt + tooltip giải thích tiếng Anh

### 5.6 SEO & Performance

- Server-side rendering cho public pages (giải đấu, ranking, heritage)
- Static generation cho heritage content (ít thay đổi)
- Dynamic rendering cho dashboard (cần auth)
- Image optimization: Next.js `<Image>` + CDN
- Core Web Vitals targets: LCP < 2.5s, INP < 200ms, CLS < 0.1

### 5.7 Testing Strategy

```
├── Unit Tests (Go):        go test ./... (domain logic, calculators)
├── Unit Tests (TS):         vitest (utils, hooks, stores)
├── Integration Tests (Go):  testcontainers-go (PostgreSQL, Redis)
├── Component Tests:         Testing Library + vitest
├── E2E Tests:               Playwright (critical flows)
└── Load Tests:              k6 (scoring concurrent users)
```

### 5.8 Error Handling & Logging

```go
// Structured logging (Go)
logger.Info("match scored",
    "match_id", matchID,
    "event_type", "SCORE_RED",
    "judge_id", judgeID,
    "tournament_id", tournamentID,
    "latency_ms", elapsed,
)
```

```typescript
// Frontend error boundary
// Sentry integration for error tracking
// Toast notifications for user-facing errors
```

---

## PHẦN 6: PHÂN PHASE TRIỂN KHAI

### Phase 1 — MVP (3-4 tháng)
**Ưu tiên: Module Giải đấu hoạt động end-to-end**

- [ ] Setup monorepo (Turborepo + PNPM)
- [ ] Docker Compose dev environment (PostgreSQL, Redis, MinIO, NATS)
- [ ] Database migrations Phase 1 (Nhóm 0, 1, 2, 4, 5)
- [ ] Go backend: Tournament CRUD, Registration, Draw, Scoring APIs
- [ ] Go backend: Authentication middleware (Supabase JWT)
- [ ] Next.js: Auth flow (login, register, forgot password)
- [ ] Next.js: Tournament management (create, config, registration)
- [ ] Next.js: Bracket viewer
- [ ] Next.js: Scoring interface (quyền + đối kháng)
- [ ] Next.js: Results & medal table
- [ ] Organization module: basic CLB + Federation CRUD
- [ ] People module: Athlete + Referee profiles
- [ ] Supabase: Realtime for live scoring

### Phase 2 — Growth (2-3 tháng)
**Mở rộng: Ranking, Đào tạo, Tài chính cơ bản**

- [ ] Ranking engine (ELO + points-based)
- [ ] Training module: curriculum, technique library, attendance
- [ ] Belt examination system
- [ ] Finance: học phí, lệ phí giải, báo cáo cơ bản
- [ ] Offline scoring mode
- [ ] Mobile-responsive scoring UI
- [ ] Community: basic newsfeed, profiles
- [ ] SEO optimization cho public pages

### Phase 3 — Scale (2-3 tháng)
**Nâng cao: E-learning, Live streaming, AI, Marketplace**

- [ ] E-learning platform (video courses, quiz)
- [ ] Live streaming integration
- [ ] AI Coach: video analysis, personalized plans
- [ ] Heritage module: lineage tree, encyclopedia
- [ ] Marketplace
- [ ] Mobile app (React Native / Expo)
- [ ] Advanced analytics dashboards
- [ ] Push notifications (FCM)

### Phase 4 — Ecosystem (ongoing)
**Hệ sinh thái: API mở, quốc tế hóa, IoT**

- [ ] Public API for partners
- [ ] Internationalization (EN, ZH)
- [ ] IoT integration (force sensors, wearables)
- [ ] Crowdfunding platform
- [ ] Multi-sport expansion (Taekwondo, Karate, Wushu...)
- [ ] Kubernetes production deployment
- [ ] Performance optimization & load testing

---

## PHẦN 7: QUY TẮC CODE STYLE & CONVENTIONS

### Go Backend
```
- Package naming: lowercase, short (tournament, not tournament_management)
- Error handling: Always wrap with context: fmt.Errorf("create tournament: %w", err)
- Struct naming: PascalCase, no prefix (Tournament, not TournamentModel)
- Interface naming: end with -er when possible (Scorer, Drawer)
- File naming: snake_case (tournament_service.go)
- Table-driven tests
- Context propagation: ctx as first parameter always
```

### TypeScript/Next.js Frontend
```
- Components: PascalCase files (BracketViewer.tsx)
- Hooks: camelCase with "use" prefix (useTournament.ts)
- Stores: camelCase with "-store" suffix (tournament-store.ts)
- Types: PascalCase, no "I" prefix (Tournament, not ITournament)
- Server Components by default, "use client" only when needed
- Co-locate component styles (Tailwind utility classes)
- Zod for runtime validation
- Absolute imports (@/components, @/lib, @/hooks)
```

### Database
```
- Table naming: snake_case, plural (tournaments, match_events)
- Column naming: snake_case (created_at, belt_rank_id)
- FK naming: {referenced_table_singular}_id (tournament_id)
- Index naming: idx_{table}_{columns} (idx_matches_tournament_id)
- Migration naming: {number}_{description}.up.sql
- Always include created_at, updated_at, metadata JSONB
```

---

## PHẦN 8: YÊU CẦU ĐẶC BIỆT

### 8.1 Vietnamese-Specific
- Tên bài quyền giữ nguyên tiếng Việt, có dấu: "Lão Hổ Thượng Sơn", "Ngọc Trản Quyền"
- Format tiền: 1.000.000 VNĐ (dấu chấm ngăn cách hàng nghìn)
- Format ngày: DD/MM/YYYY (ngày/tháng/năm kiểu Việt Nam)
- Timezone: Asia/Ho_Chi_Minh (UTC+7)
- Phone: +84 format

### 8.2 Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation cho scoring interface
- Screen reader support cho kết quả
- High contrast mode cho outdoor sử dụng (nhà thi đấu)

### 8.3 Security
- OWASP Top 10 compliance
- SQL injection prevention (parameterized queries via sqlc)
- XSS prevention (React auto-escaping + CSP headers)
- CSRF protection (SameSite cookies)
- Rate limiting per user/IP
- Data encryption at rest (PostgreSQL TDE) and in transit (TLS)
- GDPR-like compliance (Nghị định 13/2023 về bảo vệ dữ liệu cá nhân)
- Right to erasure: pseudonymization thay vì hard delete

---

## PHẦN 9: LỆNH KHỞI TẠO DỰ ÁN

```bash
# 1. Khởi tạo monorepo
mkdir vct-platform && cd vct-platform
pnpm init
npx create-turbo@latest

# 2. Tạo Next.js app
cd apps
npx create-next-app@latest web --typescript --tailwind --eslint --app --src-dir

# 3. Tạo Go module
mkdir -p api && cd api
go mod init github.com/vct-platform/api

# 4. Setup Docker
cd ../.. && docker compose up -d  # PostgreSQL, Redis, MinIO, NATS, Meilisearch

# 5. Run migrations
cd apps/api && go run cmd/migrate/main.go up

# 6. Seed reference data
psql $DATABASE_URL < sql/seeds/reference_data.sql
psql $DATABASE_URL < sql/seeds/vietnamese_martial_arts.sql

# 7. Generate sqlc code
sqlc generate

# 8. Start development
# Terminal 1: Go backend
cd apps/api && go run cmd/server/main.go

# Terminal 2: Next.js frontend
cd apps/web && pnpm dev
```

---

> **KẾT LUẬN**: Prompt này cung cấp đầy đủ blueprint để triển khai VCT Platform từ A-Z. AI developer nhận prompt này cần:
> 1. Setup monorepo đúng cấu trúc
> 2. Triển khai database migrations theo V5.0 schema
> 3. Build Go backend theo Clean Architecture (domain → adapter → handler)
> 4. Build Next.js frontend theo App Router patterns
> 5. Tích hợp liền mạch với module giải đấu đang có
> 6. Tuân thủ mọi convention và nguyên tắc kiến trúc
> 7. Triển khai theo đúng thứ tự Phase 1 → 4