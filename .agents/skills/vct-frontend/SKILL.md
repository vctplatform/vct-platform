---
name: vct-frontend
description: VCT Platform frontend patterns — Next.js 16 + Expo monorepo, App Router, shared features, routing, state management, API integration, and i18n.
---

# VCT Platform Frontend Architecture

> **When to activate**: Any frontend task — pages, components, routing, API calls, state management, navigation, or i18n.

---

## 1. Monorepo Structure

```
vct-platform/
├── apps/
│   ├── next/          # Next.js 16 web app (React 19, App Router)
│   └── expo/          # Expo/React Native mobile app
├── packages/
│   ├── app/           # Shared features (cross-platform)
│   │   ├── features/  # 33 feature modules (pages, components, hooks)
│   │   ├── hooks/     # Cross-feature hooks
│   │   ├── navigation/# Route config
│   │   ├── provider/  # Global providers
│   │   └── utils/     # Shared utilities
│   ├── ui/            # VCT component library (@vct/ui)
│   ├── shared-types/  # TypeScript shared types
│   └── shared-utils/  # Shared utilities
```

### Technology Stack
| Tech | Version | Usage |
|------|---------|-------|
| Next.js | **16.1.6** | Web framework (App Router) |
| React | **19.2.4** | UI library |
| TailwindCSS | **4.2.1** | CSS utility framework |
| Zustand | **5.0.12** | Global state management |
| Zod | **4.3.6** | Schema validation |
| Framer Motion | **12.37.0** | Animations |
| Vitest | **4.1.0** | Unit testing |
| Playwright | **1.52.0** | E2E testing |
| TypeScript | **5.9.3** | Type safety |
| Node.js | **≥22.0.0** | Runtime |

### Key Import Rules
```tsx
// Components — always from @vct/ui
import { VCT_Card, VCT_Button, VCT_Modal } from '@vct/ui'

// Icons — always from vct-icons
import { VCT_Icons } from '../components/vct-icons'

// i18n
import { useI18n } from '../i18n'

// Theme
import { useTheme } from '../theme/ThemeProvider'

// Cross-feature imports — always relative from features/
import { useAuth } from '../auth/useAuth'
```

---

## 2. Feature Module Structure

Each feature lives in `packages/app/features/{module}/`:

```
features/
├── admin/             # Admin workspace (22 pages + components, hooks, utils)
├── athletes/          # Athlete management
├── auth/              # Login, registration, auth state
├── calendar/          # Calendar & scheduling
├── club/              # Club internal management
├── clubs/             # Club directory (public-facing)
├── community/         # Community features
├── components/        # 59 shared UI components (VCT_*)
├── dashboard/         # Admin dashboard
├── data/              # Shared data/constants
├── federation/        # National federation
├── finance/           # Finance module
├── heritage/          # Belt ranking, techniques
├── home/              # Home/landing page
├── hooks/             # 20 shared hooks (API, pagination, toast, etc.)
├── i18n/              # Internationalization
├── layout/            # AppShell, Sidebar, Header
├── mobile/            # Mobile-specific screens
├── notifications/     # Notification system
├── organizations/     # Organization management
├── parent/            # Parent/guardian module
├── people/            # People directory
├── portals/           # Portal hub
├── provincial/        # Provincial federation
├── public/            # Public-facing pages (unauthenticated)
├── pwa/               # Progressive Web App config
├── rankings/          # Rankings & leaderboards
├── reporting/         # Reports & analytics
├── settings/          # User settings
├── theme/             # Theme system
├── tournament/        # Tournament management
├── training/          # Training programs
└── user/              # User profile & detail
```

---

## 3. Routing & Navigation

### ⚠️ App Router (NOT Pages Router)

The project uses **Next.js App Router** at `apps/next/app/`. Routes are **directory-based** with `page.tsx` files.

```
apps/next/app/
├── layout.tsx               # Root layout
├── page.tsx                 # Home → "/"
├── login/page.tsx           # → "/login"
├── register/page.tsx        # → "/register"
├── portal/page.tsx          # → "/portal"
├── dashboard/page.tsx       # → "/dashboard"
├── admin/                   # → "/admin/*"
│   ├── page.tsx
│   └── ...
├── athlete-portal/          # → "/athlete-portal/*"
│   ├── profile/page.tsx
│   └── tournaments/page.tsx
├── club/                    # → "/club/*"
├── provincial/              # → "/provincial/*"
├── federation/              # → "/federation/*"
├── public/                  # → "/public/*"
├── tournament-config/       # → "/tournament-config"
├── referee-scoring/         # → "/referee-scoring"
├── scoreboard/              # → "/scoreboard"
├── bracket-templates/       # → "/bracket-templates"
└── ... (58 route directories total)
```

### Creating a New Route
```tsx
// 1. Create feature page in packages/app/features/{module}/Page_{module}_{sub}.tsx
// 2. Create App Router page file:
//    apps/next/app/{route}/page.tsx

// apps/next/app/my-feature/page.tsx
import { Page_my_feature } from 'app/features/my-feature/Page_my_feature'
export default Page_my_feature
```

### Route Registry
- Central config: `packages/app/features/layout/route-registry.ts`
- Sidebar groups per role via `getSidebarGroups(role: UserRole)`
- Roles: `admin`, `athlete`, `coach`, `referee`, `spectator`, `club_manager`, `provincial_manager`

### URL Patterns
```
/login                           # Auth
/portal                          # Portal hub (role selection)
/dashboard                       # Admin dashboard
/athlete-portal/profile          # Athlete-specific pages
/club/dashboard                  # Club-specific pages
/provincial/dashboard            # Provincial pages
/federation/dashboard            # Federation pages
/public/clubs                    # Public-facing (no auth)
/referee-scoring                 # Real-time scoring
/scoreboard                      # Live scoreboard
/bracket-templates               # Tournament bracket templates
```

### Page File Naming
```
Page_{module}_{subpage}.tsx       # e.g., Page_athlete_profile.tsx
Page_{module}.tsx                 # e.g., Page_dashboard.tsx
```

---

## 4. API Integration

### API Base URL
```env
# Local development
NEXT_PUBLIC_API_BASE_URL=http://localhost:18080
# Production (Fly.io)
NEXT_PUBLIC_API_BASE_URL=https://vct-platform-api.fly.dev
# Staging (Render)
NEXT_PUBLIC_API_BASE_URL=https://vct-platform-api.onrender.com
```

### Standard Fetch Pattern
```tsx
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:18080'

async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('vct-access-token')
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`)
  return res.json()
}
```

### API Endpoints Convention
```
GET    /api/v1/{entity}/          # List
POST   /api/v1/{entity}/          # Create
GET    /api/v1/{entity}/{id}      # Get by ID
PUT    /api/v1/{entity}/{id}      # Update
DELETE /api/v1/{entity}/{id}      # Delete
```

### Auth Endpoints
```
POST /api/v1/auth/login           # { username, password }
POST /api/v1/auth/register        # { username, password, display_name }
POST /api/v1/auth/refresh         # { refresh_token }
GET  /api/v1/auth/me              # Current user info
POST /api/v1/auth/logout          # Invalidate session
GET  /api/v1/auth/my-roles        # List user roles
POST /api/v1/auth/switch-context  # Switch active role
POST /api/v1/auth/send-otp        # Send OTP email
POST /api/v1/auth/verify-otp      # Verify OTP code
```

### WebSocket (Real-time)
```tsx
const ws = new WebSocket(`ws://localhost:18080/api/v1/ws`)
// First message must be auth:
ws.send(JSON.stringify({ action: 'auth', token: accessToken }))
// Subscribe to channels:
ws.send(JSON.stringify({ action: 'subscribe', channel: 'athletes' }))
```

---

## 5. State Management

### Auth State
```tsx
// packages/app/features/auth/useAuth.ts
const { user, token, login, logout, isAuthenticated } = useAuth()
```

### Zustand (Global State)
Zustand 5 is available for global state management:
```tsx
import { create } from 'zustand'

interface AppState {
  sidebarOpen: boolean
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}))
```

### Local Component State
- Use `useState` + `useEffect` for page-level state
- Use Zustand for cross-component shared state

### Data Fetching Pattern
```tsx
const [data, setData] = useState<T[]>([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

useEffect(() => {
  apiCall<T[]>('/api/v1/endpoint')
    .then(setData)
    .catch(e => setError(e.message))
    .finally(() => setLoading(false))
}, [])
```

---

## 6. Internationalization (i18n)

```tsx
import { useI18n } from '../i18n'

function MyComponent() {
  const { t, locale, setLocale } = useI18n()
  return <h1>{t('page.title')}</h1>
}
```

### Rules
- ALL user-facing text must use `t('key')`
- Key format: `module.section.label` (e.g., `athlete.profile.title`)
- Default locale: Vietnamese (`vi`)
- Supported: `vi`, `en`

---

## 7. Form Validation (Zod 4)

```tsx
import { z } from 'zod'

const CreateAthleteSchema = z.object({
  name: z.string().min(1, 'Required'),
  age: z.number().min(6).max(80),
  club_id: z.string().uuid(),
})

type CreateAthleteInput = z.infer<typeof CreateAthleteSchema>

// Usage:
const result = CreateAthleteSchema.safeParse(formData)
if (!result.success) {
  setErrors(result.error.flatten().fieldErrors)
}
```

---

## 8. Error Handling

### Error Boundary
```tsx
import { VCT_ErrorBoundary } from '../components/vct-error-boundary'

<VCT_ErrorBoundary>
  <YourComponent />
</VCT_ErrorBoundary>
```

### Loading States
- Always show `VCT_PageSkeleton` during initial data load
- Use skeleton cards/rows instead of spinners for content areas

---

## 9. Anti-Patterns (NEVER Do These)

1. ❌ **NEVER** put feature code directly in `apps/next/app/` — always in `packages/app/features/`
2. ❌ **NEVER** create `apps/next/pages/` files — use App Router `apps/next/app/{route}/page.tsx`
3. ❌ **NEVER** use `next/router` directly — use the `onNavigate` callback from layout
4. ❌ **NEVER** create API calls without error handling
5. ❌ **NEVER** skip loading states — always show skeleton or placeholder
6. ❌ **NEVER** hardcode text strings — use `useI18n()` for all labels
7. ❌ **NEVER** import from `lucide-react` directly — use `VCT_Icons`
8. ❌ **NEVER** create components without `VCT_` prefix
9. ❌ **NEVER** use Tailwind `dark:` modifier — use CSS variable tokens

---

## 10. New Feature Checklist

When creating a new feature:

1. [ ] Create feature directory: `packages/app/features/{name}/`
2. [ ] Create page component: `Page_{name}.tsx`
3. [ ] Register routes in `route-registry.ts`
4. [ ] Add i18n keys for all labels
5. [ ] Create App Router page: `apps/next/app/{route}/page.tsx` (thin import wrapper)
6. [ ] Implement API integration with loading/error states
7. [ ] Add sidebar navigation entry for the appropriate role
8. [ ] Test in both light and dark themes

---

## 11. Custom Hooks Catalog

20 hooks in `packages/app/features/hooks/`:

| Hook | Purpose |
|------|---------|
| `useAdminAPI` | Admin CRUD (users, roles, system, docs) |
| `useApiQuery` | Generic API fetching with loading/error |
| `useCalendarAPI` | Calendar events |
| `useClubAPI` | Club management |
| `useCommunityAPI` | Community features |
| `useDebounce` | Debounced value |
| `useDivisions` | Administrative divisions (Province/District/Ward) |
| `useFederationAPI` | Federation PR, international, workflow |
| `useFinanceAPI` | Finance & billing |
| `useHeritageAPI` | Belt ranking & techniques |
| `useNotificationAPI` | Notification CRUD |
| `usePagination` | Client-side pagination logic |
| `usePeopleAPI` | People directory |
| `usePublicAPI` | Public (unauthenticated) data |
| `useRankingsAPI` | Rankings & leaderboards |
| `useRealtimeNotifications` | WebSocket notification stream |
| `useTrainingAPI` | Training programs |
| `useWebSocket` | Raw WebSocket connection |
| `useRouteActionGuard` | Route-level permission checks |
| `useToast` | Toast notification system |

### Usage Pattern
```tsx
import { useAdminAPI } from '../hooks/useAdminAPI'

function Page_admin_users() {
  const { users, loading, error, refetch } = useAdminAPI().useUsers()

  if (loading) return <VCT_PageSkeleton />
  if (error) return <ErrorBanner message={error} onRetry={refetch} />

  return <UserTable data={users} />
}
```

---

## 12. Admin Workspace Patterns

Admin pages in `packages/app/features/admin/` follow a **Table + Drawer Detail** pattern:

```
┌──────────────────────────────────────────────────────┐
│ Page Header (title, search, filters, action buttons) │
├──────────────────────────────────────────────────────┤
│ Data Table (sortable, paginated)                     │
│   Row → onClick → opens Drawer ─────────────────────►│
│                                    ┌────────────────┐│
│                                    │ VCT_Drawer     ││
│                                    │ Detail Panel   ││
│                                    │ (user info,    ││
│                                    │  timeline,     ││
│                                    │  actions)      ││
│                                    └────────────────┘│
└──────────────────────────────────────────────────────┘
```

### Admin Pages (22 pages):
| Page | File | Features |
|------|------|---------|
| Dashboard | `Page_admin_dashboard.tsx` | Overview stats, charts |
| Users | `Page_admin_users.tsx` | Data table, search, Drawer detail |
| User Detail | `Page_admin_user_detail.tsx` | Profile, timeline, skeleton loading |
| Roles | `Page_admin_roles.tsx` | Role matrix, permissions |
| System | `Page_admin_system.tsx` | Health, config, metrics |
| Clubs | `Page_admin_clubs.tsx` | Club management |
| Federation | `Page_admin_federation.tsx` | Federation overview |
| Finance | `Page_admin_finance.tsx` | Financial overview |
| People | `Page_admin_people.tsx` | People directory |
| Rankings | `Page_admin_rankings.tsx` | Rankings management |
| Scoring | `Page_admin_scoring.tsx` | Scoring configuration |
| Subscriptions | `Page_admin_subscriptions.tsx` | Subscription/billing management |
| Support | `Page_admin_support.tsx` | Customer support tickets |
| Tenants | `Page_admin_tenants.tsx` | Multi-tenant management |
| Tournaments | `Page_admin_tournaments.tsx` | Tournament management |
| Documents | `Page_documents.tsx` | Doc management, Drawer preview |
| Integrity | `Page_integrity.tsx` | Data integrity checks |
| Notifications | `Page_notifications_admin.tsx` | Notification center |
| Data Quality | `Page_data_quality.tsx` | Quality metrics, validation |
| Audit Logs | `Page_audit_logs.tsx` | Activity audit trail |
| Feature Flags | `Page_admin_feature_flags.tsx` | Toggle features |
| Reference Data | `Page_admin_reference_data.tsx` | Master data management |

### Admin Sub-Structure
```
features/admin/
├── Page_admin_*.tsx           # 22 page components
├── admin.module.css           # Admin-specific CSS module
├── admin.types.ts             # Shared TypeScript types
├── admin-users.data.ts        # Data helpers
├── components/                # Admin-specific components
├── hooks/                     # Admin-specific hooks
├── utils/                     # Admin-specific utilities
└── __tests__/                 # Admin tests
```

### Drawer Detail Pattern
```tsx
const [selectedItem, setSelectedItem] = useState<Item | null>(null)

<VCT_Drawer
  open={!!selectedItem}
  onClose={() => setSelectedItem(null)}
  title={selectedItem?.name}
>
  <VCT_InfoGrid data={[
    { label: t('admin.field'), value: selectedItem?.field },
  ]} />
  <VCT_Timeline events={selectedItem?.history} />
</VCT_Drawer>
```

---

## 13. Deployment

### Vercel (Frontend)
- Config: `apps/next/vercel.json`
- Analytics: `@vercel/analytics` + `@vercel/speed-insights`
- Build: `npm run build` (includes authz sync + typecheck)

### Backend
- Fly.io: `backend/fly.toml`
- Render: `render.yaml` + `backend/Dockerfile.render`
- Docker: `docker-compose.yml`, `docker-compose.prod.yml`

---

## 14. Optimistic UI

```tsx
const handleDelete = async (id: string) => {
  setItems(prev => prev.filter(i => i.id !== id))
  try {
    await apiCall(`/api/v1/entity/${id}`, { method: 'DELETE' })
  } catch {
    mutate()  // Re-fetch on failure
    toast.error(t('error.delete_failed'))
  }
}
```
