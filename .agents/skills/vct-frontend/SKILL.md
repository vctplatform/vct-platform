---
name: vct-frontend
description: VCT Platform frontend engineering patterns — delegates to docs/architecture/frontend-architecture.md for monorepo architecture, routing, state management, API integration, i18n, testing, and code patterns.
---

# VCT Platform Frontend Architecture

> **When to activate**: Tasks involving frontend engineering — pages, routing, API calls, state management, navigation, i18n, testing, or code structure.
>
> **📖 Primary Reference**: [`docs/architecture/frontend-architecture.md`](file:///d:/VCT%20PLATFORM/vct-platform/docs/architecture/frontend-architecture.md) & [`docs/architecture/dashboard-architecture.md`](file:///d:/VCT%20PLATFORM/vct-platform/docs/architecture/dashboard-architecture.md)

---

## Scope

This skill covers **HOW THINGS ARE BUILT** — the Engineering Architecture:

| Topic | Document Section |
|-------|-----------------|
| Technology Stack & Versions | **§1** |
| Monorepo & Package Boundaries | **§2** |
| Layout Architecture (AppShell) | **§3** |
| Routing & App Router | **§4** |
| Page Patterns (Standard, Admin, Dashboard) | **§5** |
| State Management (Zustand, hooks) | **§6** |
| API Integration & Fetch | **§7** |
| Form & Validation (Zod 4) | **§8** |
| i18n Rules | **§9** |
| Error Handling | **§10** |
| Performance & Code Splitting | **§11** |
| RBAC & Permissions UI | **§12** |
| Real-time UI & WebSocket | **§13** |
| Mobile (Expo) | **§14** |
| Testing Strategy | **§15** |
| Naming Conventions | **§16** |
| Engineering Anti-Patterns | **§A** |
| Engineering Checklist | **§B** |
| New Feature Workflow | **§C** |

## NOT in scope

Design tokens, colors, typography, component catalog, animations → see `vct-ui-ux` SKILL / `docs/architecture/ui-architecture.md`

---

## Quick Access — Package Boundaries

```
apps/next ──→ packages/app ──→ packages/shared-types
apps/expo ──→       │               │
                    ▼               ▼
              packages/ui ──→ packages/shared-utils
```

| Rule | Description |
|------|-------------|
| F1 | `shared-types` → imports NOTHING |
| F2 | `shared-utils` → NO `ui` or `app` |
| F3 | `packages/ui` → NO `packages/app` |
| F7 | Route pages → thin wrappers ONLY |

## Quick Access — Import Standards

```tsx
import { VCT_Card, VCT_Button } from '@vct/ui'
import { VCT_Icons } from '../components/vct-icons'
import { useI18n } from '../i18n'
import { useTheme } from '../theme/ThemeProvider'
```

## Quick Access — Custom Hooks (20)

`useAdminAPI` · `useApiQuery` · `useCalendarAPI` · `useClubAPI` · `useCommunityAPI` · `useDebounce` · `useDivisions` · `useFederationAPI` · `useFinanceAPI` · `useHeritageAPI` · `useNotificationAPI` · `usePagination` · `usePeopleAPI` · `usePublicAPI` · `useRankingsAPI` · `useRealtimeNotifications` · `useTrainingAPI` · `useWebSocket` · `useRouteActionGuard` · `useToast`

## Enforcement

```bash
npm run lint:arch           # ESLint boundaries
npm run lint:boundaries     # Custom grep-based check
npm run typecheck           # TypeScript
npm run lint                # Full lint
```
