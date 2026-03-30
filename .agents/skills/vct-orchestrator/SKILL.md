---
name: vct-orchestrator
description: "Meta-orchestrator for VCT Platform. Routes requests to the correct mega-skill based on category. Manages workflows from intake to delivery."
---

# VCT Orchestrator — Điều phối viên AI Agent

> Activate at the START of any significant request to determine which skills participate.

## 1. Available Mega-Skills

| Skill | Domain | Key Capabilities |
|-------|--------|-----------------|
| `vct-backend` | Go backend | Clean Architecture, modules, HTTP API, PostgreSQL, auth, middleware, caching, events, state machines, queues, multi-tenancy |
| `vct-frontend` | Web frontend | Next.js 16, React 19, Tailwind 4, Zustand 5, micro-frontends, i18n, accessibility, design system |
| `vct-mobile` | Mobile | Expo/React Native, EAS Build, offline-first, CI/CD, performance, testing |
| `vct-database` | Data layer | PostgreSQL, Neon, migrations, search, indexing, backup, query optimization |
| `vct-infra` | Infrastructure | Docker/K8s, CI/CD, monitoring, file storage, notifications, incident response |
| `vct-security` | Security | OWASP, secrets, CORS/CSP, vulnerability scanning, project auditing |
| `vct-domain` | Business domains | VCT rules, scoring, payments, e-learning, medical, media, gamification, integrations |
| `vct-leadership` | Tech decisions | Architecture, code review, design patterns, troubleshooting, simplification |
| `vct-product` | Process | PM, PO, Scrum, BA, release management, documentation, data analysis |
| `vct-qa` | Quality | Test automation, E2E, test strategies, self-improvement |

## 2. Request Classification (Category → Skill)

| Category | Primary Skill | Supporting |
|----------|--------------|------------|
| New Feature | `vct-product` → `vct-backend`/`vct-frontend` | `vct-leadership` |
| Bug Fix | `vct-leadership` → relevant skill | `vct-qa` |
| Refactor | `vct-leadership` → relevant skill | `vct-product` |
| Architecture | `vct-leadership` | `vct-backend`/`vct-frontend` |
| Database | `vct-database` | `vct-backend` |
| DevOps/Deploy | `vct-infra` | `vct-security` |
| Security | `vct-security` | `vct-leadership` |
| Mobile | `vct-mobile` | `vct-backend` |
| Domain/Business | `vct-domain` | `vct-backend` |
| Performance | `vct-leadership` + relevant skill | `vct-database` |
| Planning/Sprint | `vct-product` | — |
| Documentation | `vct-product` | relevant skill |

## 3. Pipeline Workflows (O(1) & Map-Reduce Dispatch)

Orchestrator định tuyến Task theo 3 **Pipeline Graphs** thay vì các workflow rời rạc.
> Luôn gọi `view_file` tới đúng Graph tương ứng để đọc luồng xử lý chi tiết.

### ⚠️ Engineering Discipline Gate (Adapted from superpowers)
**TRƯỚC KHI vào bất kỳ Graph nào**, mọi task M/L PHẢI tuân thủ:
1. Đọc `workflows/engineering_discipline.md` — 5 Iron Laws
2. **Brainstorm** → Design approved → **Plan** → Tasks defined → **THEN** enter Graph
3. Trong Graph: Áp dụng **TDD** + **Systematic Debugging** + **Verification Gate**

Flow: `Request → Classify (S/M/L) → [M/L: Discipline Gate] → Select Graph → Execute → Verify`

### A. Chuẩn bị (Triage)
- Đọc `AGENT_INDEX.md` nạp skill. Đánh giá Mức S, M hay L.

### B. Chọn Graph Workflow
- **`workflows/engineering_graph.md`**: Feature (Brainstorm → Design → Plan → Code → Test → Review), Bug Fix (Systematic Debug 4-phase), Database Schema, Code review (2-stage).
- **`workflows/ops_graph.md`**: Deploy (Build → Migration → Up), Health (Ping), Release, Infra.
- **`workflows/product_graph.md`**: PM (Docs), Translating (i18n), Team process, Admin tasks.

### C. Map-Reduce (Large Task)
Nếu tác vụ là mức độ Large (VD: Tạo module mới toàn diện Backend+Frontend):
- **BẮT BUỘC** Orchestrator phải ngắt luồng thành nhiều Node. 
- Mỗi Node tuân thủ TDD Iron Law + Verification Gate.
- Gọi Backend Skill hoàn thành → Ghi file JSON memory → Trả kết quả trung gian → Chuyển sang Data Layer/Frontend vòng kế tiếp.

## 4. MFE Domain Routing (Frontend)

| Route | Domain |
|-------|--------|
| `/tournament/*`, `/referee-scoring/*`, `/scoreboard/*` | D1: Tournament |
| `/athlete-portal/*`, `/people/*`, `/training/*` | D2: Athlete |
| `/federation/*`, `/club/*`, `/organizations/*` | D3: Organization |
| `/admin/*`, `/settings/*` | D4: Admin |
| `/finance/*`, `/marketplace/*` | D5: Finance |
| `/heritage/*`, `/community/*` | D6: Heritage |
| Shell, auth, theme, i18n, shared | D7: Platform |

Cross-Domain: Define contracts via `shared-types` trước khi implementation.

## 5. Convention Enforcement

**Backend**: Clean Architecture (domain→adapter→store→handler) · Go 1.26+ · pgx/v5 · Error wrapping · Auth middleware · Migration pairs
**Frontend**: App Router `app/{route}/page.tsx` · Feature code in `packages/app/features/` · `@vct/ui` components · `useI18n()` · CSS variables `--vct-*` · Zod 4 · Zustand 5

## 6. Conflict Resolution

Priority: **Security > Regulation > Architecture > Business Value > Timeline**
Escalation: Role → Skill Lead → CTO → Javis → User

## 7. Output Format

Every significant response includes:
1. 📌 **Classification** — Category + S/M/L
2. 🔧 **Skills Activated** — Which mega-skills and why
3. 📋 **Workflow** — Which template
4. 📤 **Deliverables** — Expected outputs
5. ⏭️ **Next Steps**
