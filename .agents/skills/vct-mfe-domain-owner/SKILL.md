---
name: vct-mfe-domain-owner
description: "Frontend Domain Ownership model for VCT Platform. Activate when assigning feature ownership, resolving cross-domain conflicts, managing domain health metrics, or deciding which agent team owns a frontend change."
---

# VCT MFE Domain Owner — Quản lý Sở hữu Domain Frontend

> **When to activate**: Assigning feature ownership to the correct domain, resolving cross-domain conflicts, checking domain health metrics, auditing domain boundary violations, or deciding which agent/team owns a frontend change.

---

> [!IMPORTANT]
> **OWNERSHIP PRINCIPLE**: Mỗi dòng code frontend PHẢI có 1 domain owner rõ ràng. Không có code "vô chủ". Khi feature request đến, bước đầu tiên là xác định domain owner — KHÔNG phải bắt đầu code.

---

## 1. Domain Ownership Registry

### 1.1 The 7 Domains & Responsibilities

| Domain | Owner Team | Scope | Decision Authority |
|--------|-----------|-------|-------------------|
| **D1: Tournament** | SA + TL + QA | Giải đấu, lịch thi đấu, xếp hạng, scoring PWA | API contract, bracket logic, scoring UX |
| **D2: Athlete** | BA + TL | Hồ sơ VĐV, quản lý people, training, parent portal | Athlete data model, training workflow |
| **D3: Organization** | SA + BA | Liên đoàn, tỉnh thành, CLB, tổ chức | Org hierarchy, approval flows |
| **D4: Admin** | CTO + TL | Admin workspace, settings, reporting, data | Admin patterns, bulk operations, reports |
| **D5: Finance** | SecEng + BA | Tài chính, marketplace, notifications | Payment flow, billing rules, audit trail |
| **D6: Heritage** | DOM + UXD | Đai hạng, cộng đồng, trang công cộng | Cultural accuracy, heritage display |
| **D7: Platform** | SA + CTO | Shell, auth, theme, i18n, shared hooks | Cross-cutting infrastructure |

### 1.2 Module → Domain Mapping (Complete)

| Module (packages/app/features/) | Domain | Route Prefix |
|----------------------------------|--------|-------------|
| `tournament` | D1: Tournament | `/tournament/*` |
| `calendar` | D1: Tournament | `/calendar/*` |
| `rankings` | D1: Tournament | `/rankings/*` |
| `pwa` | D1: Tournament | `/referee-scoring/*`, `/scoreboard/*` |
| `athletes` | D2: Athlete | `/athlete-portal/*` |
| `people` | D2: Athlete | `/people/*` |
| `training` | D2: Athlete | `/training/*` |
| `parent` | D2: Athlete | `/parent/*` |
| `federation` | D3: Organization | `/federation/*` |
| `provincial` | D3: Organization | `/provincial/*` |
| `club` | D3: Organization | `/club/*` |
| `clubs` | D3: Organization | `/clubs/*` |
| `organizations` | D3: Organization | `/organizations/*` |
| `admin` | D4: Admin | `/admin/*` |
| `settings` | D4: Admin | `/settings/*` |
| `reporting` | D4: Admin | `/admin/reports/*` |
| `data` | D4: Admin | `/admin/data/*` |
| `finance` | D5: Finance | `/finance/*` |
| `marketplace` | D5: Finance | `/marketplace/*` |
| `notifications` | D5: Finance | `/notifications/*` |
| `heritage` | D6: Heritage | `/heritage/*` |
| `community` | D6: Heritage | `/community/*` |
| `public` | D6: Heritage | `/public/*` |
| `layout` | D7: Platform | — (internal) |
| `auth` | D7: Platform | `/login`, `/register` |
| `theme` | D7: Platform | — (internal) |
| `i18n` | D7: Platform | — (internal) |
| `hooks` | D7: Platform | — (internal) |
| `components` | D7: Platform | — (internal) |
| `home` | D7: Platform | `/` |
| `dashboard` | D7: Platform | `/dashboard` |
| `portals` | D7: Platform | `/portal/*` |
| `user` | D7: Platform | `/user/*` |
| `mobile` | D7: Platform | — (Expo) |

---

## 2. Ownership Rules — Quy tắc Sở hữu

### 2.1 Domain Owner Rights & Responsibilities

```
RIGHTS (Quyền):
├── Quyết định internal architecture trong domain
├── Chọn component patterns phù hợp
├── Define local state management
├── Set build/test priorities cho domain
└── Approve/reject PRs touching domain code

RESPONSIBILITIES (Trách nhiệm):
├── Maintain domain health metrics (bundle size, error rate)
├── Keep domain-internal code clean (Boy Scout Rule)
├── Document public API (index.ts exports)
├── Handle domain-specific bugs within SLA
├── Update i18n keys khi thay đổi UI
└── Write domain-specific tests (unit + integration)
```

### 2.2 Change Classification by Domain Impact

| Change Type | Domain Owner Action | Orchestrator Action |
|------------|-------------------|-------------------|
| **Intra-domain** (chỉ ảnh hưởng 1 domain) | Owner tự quyết định & implement | Không cần can thiệp |
| **Cross-domain** (2 domains liên quan) | Cả 2 owners phải agree trên contract | Orchestrator mediates contract negotiation |
| **Platform-wide** (ảnh hưởng Shell) | Platform owner (SA+CTO) quyết định | Orchestrator ensures all domains tested |
| **Breaking change** (thay đổi shared contract) | HITL required — User must approve | Orchestrator escalates + coordination |

---

## 3. Cross-Domain Coordination Protocol

### 3.1 Contract Negotiation Flow

```
Domain A cần data từ Domain B:
    │
    ├─── Step 1: Domain A Owner xác định data cần
    │
    ├─── Step 2: Check shared-types có type phù hợp không?
    │    ├── Có → Dùng existing shared hook
    │    └── Không → Negotiate với Domain B Owner
    │
    ├─── Step 3: Domain B Owner define contract trong shared-types
    │
    ├─── Step 4: Platform team implement shared hook (nếu cần)
    │
    └─── Step 5: Cả 2 domains test contract independently
```

### 3.2 Feature Spanning Multiple Domains

```
VD: "Hiển thị danh sách VĐV đã đăng ký giải đấu X"
    │
    ├── Thuộc Domain: D1 (Tournament) — vì đây là context giải đấu
    │
    ├── Cần data từ: D2 (Athlete) — thông tin VĐV
    │
    ├── Implementation:
    │   ├── D1 (Tournament): Page có table hiển thị registrations
    │   ├── API: Backend endpoint GET /api/v1/tournaments/{id}/registrations
    │   │         (backend JOIN athlete data — frontend KHÔNG cần call 2 API)
    │   └── D2 (Athlete): Chỉ provide AthleteBasicInfo type trong shared-types
    │
    └── ❌ KHÔNG: D1 import component từ D2
```

---

## 4. Domain Health Metrics

### 4.1 Per-Domain Dashboard

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| **Bundle Size** | < 200KB per domain (gzipped) | > 300KB |
| **Error Rate** | < 0.5% | > 1% |
| **Load Time (LCP)** | < 2.5s | > 4s |
| **Test Coverage** | > 70% | < 50% |
| **i18n Coverage** | 100% | < 95% |
| **Accessibility Score** | > 90 (Lighthouse) | < 80 |
| **Dependency Count** | Domain-specific deps < 5 | > 10 |

### 4.2 Domain Audit Checklist

```
□ Tất cả imports đúng boundary rules (MFI-1 through MFI-5)
□ index.ts chỉ export public API
□ Không có cross-domain component imports
□ Error boundary wrap toàn bộ domain pages
□ i18n keys đầy đủ cho cả vi và en
□ No shared mutable state leaking to other domains
□ Bundle size within limit
□ All tests passing
```

---

## 5. Escalation Protocol

### 5.1 When to Escalate to Orchestrator

| Situation | Escalation Path |
|-----------|----------------|
| 2 domain owners **disagree** on contract | → Orchestrator mediates → SA decides |
| Feature affects **3+ domains** | → Orchestrator full coordination workflow |
| Domain **bundle size exceeds** 300KB | → Orchestrator → SA review → split decision |
| Domain needs **new shared hook** | → Orchestrator → Platform team (SA+CTO) |
| **Breaking change** to shared contract | → Orchestrator → HITL → User approve |

### 5.2 Priority of Concerns (Khi conflict)

```
1. User Experience (UXD) — user path must work seamlessly
2. Data Integrity (SA) — contracts must be type-safe
3. Performance (CTO) — bundle + load time within budget
4. Autonomy (Domain Owner) — respect domain boundaries
5. Simplicity (Simplifier) — fewer moving parts is better
```

---

## 6. Integration with Agent System

### 6.1 Request Routing by Domain

Khi Orchestrator nhận frontend request:

```
1. Phân tích: request thuộc route prefix nào?
2. Map route prefix → Domain (xem bảng §1.2)
3. Activate Domain Owner agent team
4. Nếu cross-domain → activate cả 2+ Domain Owner teams
5. Platform changes → SA + CTO approval required
```

### 6.2 Agent Activation per Domain

| Domain | Primary Skills Activated | Supporting Skills |
|--------|------------------------|-------------------|
| D1: Tournament | `vct-realtime-scoring`, `vct-frontend` | `vct-qa`, `vct-mobile-offline` |
| D2: Athlete | `vct-frontend`, `vct-ba` | `vct-qa` |
| D3: Organization | `vct-frontend`, `vct-ba` | `vct-multi-tenancy` |
| D4: Admin | `vct-frontend`, `vct-cto` | `vct-security`, `vct-qa` |
| D5: Finance | `vct-frontend`, `vct-security` | `vct-subscription`, `vct-ba` |
| D6: Heritage | `vct-frontend`, `vct-domain-expert` | `vct-ui-ux` |
| D7: Platform | `vct-frontend`, `vct-sa` | `vct-cto`, `vct-design-patterns` |
