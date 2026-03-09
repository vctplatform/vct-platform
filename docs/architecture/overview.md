# VCT Platform — Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐│
│  │  Next.js      │   │   Expo       │   │   Browser (PWA)      ││
│  │  (App Router) │   │  (Mobile)    │   │   (Live Scoring)     ││
│  └──────┬───────┘   └──────┬───────┘   └──────────┬───────────┘│
├─────────┼──────────────────┼──────────────────────┼────────────┤
│         │                  │                      │             │
│         ▼                  ▼                      ▼             │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    GO BACKEND API                           ││
│  │  ┌───────────┐  ┌──────────────┐  ┌───────────────────────┐││
│  │  │  Handler   │  │  Domain      │  │    Adapter            │││
│  │  │  (HTTP)    │→ │  (Business)  │→ │  (Infrastructure)    │││
│  │  │  ┌─────┐   │  │  ┌────────┐  │  │  ┌────────────────┐  │││
│  │  │  │REST │   │  │  │Service │  │  │  │PostgreSQL     │  │││
│  │  │  │WS   │   │  │  │Entity  │  │  │  │Redis          │  │││
│  │  │  │Auth │   │  │  │Events  │  │  │  │NATS           │  │││
│  │  │  └─────┘   │  │  └────────┘  │  │  │MinIO          │  │││
│  │  └───────────┘  └──────────────┘  │  │Meilisearch    │  │││
│  │                                    │  └────────────────┘  │││
│  │                                    └───────────────────────┘││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│                       DATA LAYER                                 │
│  ┌───────────┐  ┌──────────────┐  ┌───────────────────────────┐│
│  │ Supabase   │  │ PostgreSQL   │  │ Neon                      ││
│  │ Auth       │  │ Self-hosted  │  │ Dev/Staging               ││
│  │ Realtime   │  │ Production   │  │ Serverless                ││
│  │ Storage    │  │ Primary DB   │  │ Analytics                 ││
│  └───────────┘  └──────────────┘  └───────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Key Principles

1. **Event-First** — Events are the source of truth
2. **Bitemporal Design** — Track both business time and system time
3. **Config over Code** — Business rules configurable from admin UI
4. **Stable View Layer** — Applications query API Views, not tables directly
5. **Extension by Default** — Every entity has `metadata JSONB`
6. **Reference over Enum** — Use lookup tables instead of PostgreSQL ENUM
7. **Offline Resilience** — Scoring works offline, syncs when connected
8. **Zero Trust Isolation** — Multi-tenant RLS at database layer
9. **Immutable History** — Soft-delete only, no data destruction
10. **Vietnamese-First** — UI, terminology, currency format default to Vietnamese

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router), TypeScript, React 19 |
| Backend | Go (Golang) 1.26+ |
| Database | PostgreSQL 18+, Supabase, Neon |
| ORM | Drizzle ORM (TS), sqlc (Go) |
| Cache | Redis 7+ |
| Search | Meilisearch |
| Storage | MinIO / Supabase Storage |
| Queue | NATS |
| Container | Docker + Kubernetes |
| CI/CD | GitHub Actions |
| Monitoring | Grafana + Prometheus + Loki |

## Module Structure

| Module | Description |
|--------|-------------|
| Organization | Federation, Club, Branch management |
| People | Athletes, Coaches, Referees |
| Training | Curriculum, Techniques, Belt Exams |
| Tournament | Core module — all competition management |
| Scoring | Real-time scoring (quyền + đối kháng) |
| Ranking | ELO/Glicko ratings, national rankings |
| Heritage | Cultural heritage, lineage trees |
| Finance | Fees, budgets, sponsorships |
| Community | Social features, marketplace |
| Admin | System administration, RBAC |
