---
name: vct-micro-frontend
description: "Micro Frontend architecture patterns for VCT Platform. Activate when designing cross-domain features, splitting modules, defining frontend domain boundaries, planning independent deployments, or evaluating Module Federation strategies."
---

# VCT Micro Frontend Architecture

> **When to activate**: Designing cross-domain features, splitting frontend modules, defining domain boundaries, planning independent builds/deploys, evaluating Module Federation, or resolving cross-team feature conflicts.
>
> **📖 Primary Reference**: [`docs/architecture/micro-frontend-architecture.md`](file:///d:/VCT%20PLATFORM/vct-platform/docs/architecture/micro-frontend-architecture.md)

---

> [!IMPORTANT]
> **SUPREME MFE DIRECTIVE**: Micro Frontend is a MINDSET, not just a technology choice. Every frontend decision must consider domain ownership, blast radius isolation, and independent deployability — even within the current monorepo structure. This is about THINKING in bounded contexts, not necessarily splitting repos today.

---

## 1. MFE Philosophy — Tư Duy Lõi

### 1.1 Core Principles

| # | Principle | Description |
|---|-----------|-------------|
| MF1 | **Vertical Slicing** | Mỗi domain sở hữu full stack slice: UI → hooks → state → API calls |
| MF2 | **Team Autonomy** | Domain owner có quyền quyết định nội bộ (component patterns, local state) |
| MF3 | **Independent Deployability** | Thay đổi trong 1 domain KHÔNG BẮT BUỘC rebuild/redeploy domain khác |
| MF4 | **Shared Nothing** | Domains KHÔNG share mutable state trực tiếp — communication qua contracts |
| MF5 | **Technology Agnostic (Tương lai)** | Mỗi domain CÓ THỂ upgrade framework riêng (VD: React 19→20) mà không ảnh hưởng domain khác |
| MF6 | **Blast Radius Isolation** | Bug/crash trong domain A KHÔNG làm sập domain B |

### 1.2 MFE Maturity Model (VCT Platform)

```
Phase 1 (HIỆN TẠI): Monorepo + Domain Boundaries
├── Vẫn 1 repo, 1 build, 1 deploy
├── Nhưng TÁCH RÕ domain ownership trong code
├── Enforce import rules giữa domains
└── Mỗi domain có Error Boundary riêng

Phase 2 (NEXT): Module Federation
├── Next.js Multi-Zone hoặc Webpack Module Federation
├── Shared Shell (AppShell) + Remote domain apps
├── Independent build per domain
└── Shared dependencies versioned (React, @vct/ui)

Phase 3 (FUTURE): Full MFE
├── Independent repos per domain (nếu cần)
├── Independent deploy cadence
├── Contract testing between domains
└── Runtime composition via Module Federation
```

> [!NOTE]
> VCT Platform hiện ở **Phase 1**. Mọi quyết định kiến trúc phải tương thích với Phase 2 migration path. Không code gì ngăn cản việc tách domain ra sau này.

---

## 2. MFE Domain Map — 7 Domains

### 2.1 Domain Registry

| # | Domain | Modules (packages/app/features/) | Route Prefix | Owner Agent |
|---|--------|----------------------------------|-------------|-------------|
| D1 | **Tournament** | `tournament`, `calendar`, `rankings`, `pwa` | `/tournament/*`, `/referee-scoring/*`, `/scoreboard/*`, `/calendar/*` | Orchestrator → SA + TL |
| D2 | **Athlete** | `athletes`, `people`, `training`, `parent` | `/athlete-portal/*`, `/training/*`, `/people/*` | Orchestrator → BA + TL |
| D3 | **Organization** | `federation`, `provincial`, `club`, `clubs`, `organizations` | `/federation/*`, `/provincial/*`, `/club/*` | Orchestrator → SA + BA |
| D4 | **Admin** | `admin`, `settings`, `reporting`, `data` | `/admin/*`, `/settings/*` | Orchestrator → CTO + TL |
| D5 | **Finance** | `finance`, `marketplace`, `notifications` | `/finance/*`, `/marketplace/*` | Orchestrator → SecEng + BA |
| D6 | **Heritage** | `heritage`, `community`, `public` | `/heritage/*`, `/community/*`, `/public/*` | Orchestrator → DOM + UXD |
| D7 | **Platform** (Shared Shell) | `layout`, `auth`, `theme`, `i18n`, `hooks`, `components`, `home`, `dashboard`, `portals`, `user`, `mobile` | `/`, `/login`, `/dashboard`, `/portal/*` | Orchestrator → SA + CTO |

### 2.2 Domain Dependency Rules

```
┌─────────────────────────────────────────────────────────────┐
│                    D7: PLATFORM (Shell)                      │
│  layout, auth, theme, i18n, hooks, components               │
│  ← MỌI domain đều được import từ Platform                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │D1:Tourna-│  │D2:Athlete│  │D3:Organi-│  │D4:Admin  │   │
│  │ment      │  │          │  │zation    │  │          │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │              │              │              │         │
│       └──────────────┴──────────────┴──────────────┘         │
│       Cross-domain: QUA EVENT BUS hoặc SHARED CONTRACT      │
│                                                             │
│  ┌──────────┐  ┌──────────┐                                 │
│  │D5:Finance│  │D6:Heritag│                                 │
│  └──────────┘  └──────────┘                                 │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Import Rules Between Domains (NON-NEGOTIABLE)

| # | Rule | Description |
|---|------|-------------|
| MFI-1 | Domain → Platform | ✅ Mọi domain ĐƯỢC import từ `layout/`, `auth/`, `theme/`, `i18n/`, `hooks/`, `components/` |
| MFI-2 | Domain → Domain | ❌ **CẤM** import trực tiếp giữa 2 feature domains (VD: `tournament/` import `athletes/`) |
| MFI-3 | Domain → @vct/ui | ✅ Mọi domain ĐƯỢC import UI components từ `@vct/ui` |
| MFI-4 | Cross-domain data | ✅ Qua shared hooks (`useAthletes`), KHÔNG import internal components |
| MFI-5 | Cross-domain navigation | ✅ Qua `router.push('/athlete-portal/...')`, KHÔNG import page components |

---

## 3. Shared Shell Architecture (Domain D7 — Platform)

### 3.1 Shell Responsibilities

Shell là **nhà ga trung tâm** — nó cung cấp khung sườn chung, KHÔNG chứa business logic:

| Component | Responsibility | Rule |
|-----------|---------------|------|
| `layout/AppShell` | Sidebar, Header, Page transitions | ❌ KHÔNG chứa domain-specific UI |
| `auth/` | Login, JWT, RBAC context | ✅ Expose `useAuth()`, `useRouteActionGuard()` |
| `theme/` | Dark/Light, Design tokens | ✅ Expose `useTheme()` |
| `i18n/` | Language switching, dictionaries | ✅ Expose `useI18n()` |
| `hooks/` | Shared API hooks | ✅ Generic hooks only (`useApiQuery`, `usePagination`) |
| `components/` | Shared feature-level components | ✅ Cross-domain reusables (VCT_Icons, ErrorBoundary) |

### 3.2 Shell API Contract

```typescript
// Platform Shell exposes these contracts to all domains:
interface PlatformShellContract {
  // Auth
  useAuth(): { user: User; token: string; logout: () => void }
  useRouteActionGuard(route: string): { can: (action: string) => boolean }
  
  // Theme
  useTheme(): { theme: 'light' | 'dark'; toggle: () => void }
  
  // i18n
  useI18n(): { t: (key: string) => string; lang: string; setLang: (l: string) => void }
  
  // Navigation
  useNavigation(): { push: (path: string) => void; currentPath: string }
  
  // Toast
  useToast(): { success: (msg: string) => void; error: (msg: string) => void }
  
  // API
  useApiQuery<T>(endpoint: string): { data: T; loading: boolean; error: string | null }
}
```

---

## 4. Domain Internal Architecture

### 4.1 Standard Domain Structure

```
packages/app/features/{domain-module}/
├── index.ts                    # Public API — ONLY exports from this file
├── Page_{module}.tsx            # Main page (entry point)
├── Page_{module}_{sub}.tsx      # Sub-pages
├── components/                  # Domain-internal components
│   ├── {Module}List.tsx
│   ├── {Module}Form.tsx
│   └── {Module}Card.tsx
├── hooks/                       # Domain-internal hooks
│   └── use{Module}Data.ts
├── types/                       # Domain-internal types
│   └── {module}.types.ts
├── contracts/                   # Cross-domain contracts (nếu expose cho domain khác)
│   └── {module}.contract.ts
└── __tests__/                   # Domain tests
```

### 4.2 Domain Public API Pattern

```typescript
// packages/app/features/tournament/index.ts
// ✅ ONLY export what other domains need

// Pages (for routing)
export { Page_tournament } from './Page_tournament'
export { Page_tournament_schedule } from './Page_tournament_schedule'

// Contracts (for cross-domain use)
export type { TournamentSummary, TournamentStatus } from './contracts/tournament.contract'

// ❌ NEVER export internal components, hooks, or state
// ❌ NEVER: export { TournamentBracketTree } from './components/TournamentBracketTree'
```

### 4.3 Cross-Domain Communication Patterns

```
Pattern 1: SHARED HOOKS (Read-only data sharing)
─────────────────────────────────────────────────
Tournament domain cần hiển thị tên VĐV:
  ❌ import { AthleteCard } from '../athletes/components/AthleteCard'
  ✅ const { data: athlete } = useApiQuery('/api/v1/athletes/' + id)

Pattern 2: URL-BASED NAVIGATION (Cross-domain navigation)
─────────────────────────────────────────────────
Tournament page cần link đến Athlete profile:
  ❌ import { Page_athlete_profile } from '../athletes/Page_athlete_profile'
  ✅ router.push(`/athlete-portal/profile/${athleteId}`)

Pattern 3: EVENT BUS (State changes across domains)
─────────────────────────────────────────────────
Khi tournament kết thúc, cần update rankings:
  ❌ import { refreshRankings } from '../rankings/hooks/useRankings'
  ✅ eventBus.publish('tournament.completed', { tournamentId })
     // Rankings domain subscribes independently

Pattern 4: SHARED TYPES (Type-safe contracts)
─────────────────────────────────────────────
  ✅ import type { AthleteBasicInfo } from '@vct/shared-types'
  // shared-types is the ONLY place for cross-domain type sharing
```

---

## 5. Build & Deploy Strategy

### 5.1 Phase 1 (Current): Monorepo Build

```
npm run build
├── Builds ALL domains together
├── Single Next.js output
├── deploy cả app cùng lúc
└── ✅ Nhưng CODE đã tách rõ domain boundaries
```

### 5.2 Phase 2 (Future): Multi-Zone Federation

```
Shell App (layout, auth, theme)
├── Zone: /tournament/* → Tournament MFE
├── Zone: /athlete-portal/* → Athlete MFE
├── Zone: /admin/* → Admin MFE
├── Zone: /finance/* → Finance MFE
├── Zone: /heritage/* → Heritage MFE
├── Zone: /community/* → Community MFE
└── Zone: /public/* → Public MFE

// next.config.js (Shell)
async rewrites() {
  return [
    { source: '/tournament/:path*', destination: 'https://tournament.vctplatform.vn/:path*' },
    { source: '/admin/:path*', destination: 'https://admin.vctplatform.vn/:path*' },
  ]
}
```

---

## 6. MFE Testing Strategy

| Level | What | Tool | Who |
|-------|------|------|-----|
| **Unit** | Domain-internal logic | Vitest | Domain owner |
| **Integration** | Domain API contract | Vitest + MSW | Domain owner |
| **Contract** | Cross-domain contracts | Vitest type-check | Platform team |
| **E2E** | Cross-domain user flows | Playwright | QA + Platform team |
| **Visual** | Cross-domain visual consistency | Storybook + Chromatic | UXD + Domain owner |

---

## 7. MFE Anti-Patterns (CẤM TUYỆT ĐỐI)

| # | Anti-Pattern | Hậu quả | Giải pháp đúng |
|---|-------------|---------|----------------|
| AP1 | **God Shell** — Business logic trong Shell | Shell trở thành bottleneck | Shell chỉ có layout + auth + theme |
| AP2 | **Shared Mutable State** — Zustand store dùng chung giữa domains | Tight coupling, re-render cascade | Mỗi domain có local state riêng |
| AP3 | **Import Leak** — Domain A import internal component từ Domain B | Không thể deploy independently | Dùng shared hooks hoặc URL navigation |
| AP4 | **Mega Bundle** — 1 domain import heavy lib ảnh hưởng bundle size toàn app | Load time tệ | Dynamic import + domain-scoped code splitting |
| AP5 | **Shared CSS Leak** — Domain A override CSS của Domain B | Visual bugs khi deploy riêng | CSS Modules hoặc Tailwind scoped classes |
| AP6 | **Synchronous Cross-Domain Call** — `await otherDomain.getData()` | Deploy coupling | Event bus hoặc API call |

---

## 8. Decision Matrix — Khi nào Split vs Khi nào Giữ Chung

| Criteria | Giữ Chung (Monolith) | Split (MFE) |
|----------|----------------------|-------------|
| Team size | < 5 devs | ≥ 5 devs, ≥ 2 teams |
| Deploy frequency | Same cadence | Different cadence needed |
| Domain complexity | Simple CRUD | Complex business rules |
| Failure isolation | Acceptable blast radius | Must isolate failures |
| Technology | Same stack everywhere | Need different versions/frameworks |
| Bundle size | < 500KB per domain | > 500KB per domain |

> **VCT Platform Rule**: Luôn **TÁCH domain boundaries trong code** (Phase 1) bất kể team size. Chỉ **TÁCH deployment** (Phase 2+) khi có business need cụ thể.

---

## 9. MFE Checklist cho mỗi Feature Request

```
□ Feature này thuộc domain nào? → Route đến đúng Domain Owner
□ Feature có cross-domain dependencies không? → Xác định contracts cần thiết
□ Feature có import gì từ domain khác không? → Chuyển sang shared pattern
□ Feature có thêm shared state không? → Cân nhắc local state thay thế
□ Feature deployment có ảnh hưởng domain khác không? → Blast radius assessment
□ Error boundary đã wrap riêng cho domain chưa? → Isolation check
```
