---
name: vct-frontend
description: VCT Platform frontend patterns — Next.js + Expo monorepo, shared features, routing, state management, API integration, and i18n.
---

# VCT Platform Frontend Architecture

> **When to activate**: Any frontend task — pages, components, routing, API calls, state management, navigation, or i18n.

---

## 1. Monorepo Structure

```
vct-platform/
├── apps/
│   ├── next/          # Next.js 15+ web app (React 19, pages router via File System)
│   └── expo/          # Expo/React Native mobile app
├── packages/
│   ├── app/           # Shared features (cross-platform)
│   │   ├── features/  # Feature modules (pages, components, hooks)
│   │   ├── navigation/# Route config
│   │   └── provider/  # Global providers
│   ├── ui/            # VCT component library (@vct/ui)
│   ├── shared-types/  # TypeScript shared types
│   └── shared-utils/  # Shared utilities
```

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
├── admin/             # Admin workspace (users, roles, system, docs, integrity)
├── athletes/          # Athlete management
├── auth/              # Login, registration, auth state
├── calendar/          # Calendar & scheduling
├── club/              # Club internal management
├── clubs/             # Club directory (public-facing)
├── community/         # Community features
├── dashboard/         # Admin dashboard
├── data/              # Shared data/constants
├── federation/        # National federation
├── finance/           # Finance module
├── heritage/          # Belt ranking, techniques
├── home/              # Home/landing page
├── hooks/             # 18 shared hooks (API, pagination, toast, etc.)
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
├── user/              # User profile & detail
└── components/        # Shared UI components (VCT_*)
```

---

## 3. Routing & Navigation

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
/athlete-portal/tournaments
/athlete-portal/rankings
/club-portal/dashboard           # Club-specific pages
/provincial/dashboard            # Provincial pages
/federation/dashboard            # Federation pages
/public/clubs                    # Public-facing (no auth)
/public/provinces
```

### Page File Naming
```
Page_{module}_{subpage}.tsx       # e.g., Page_athlete_profile.tsx
Page_{module}.tsx                 # e.g., Page_dashboard.tsx
```

### Next.js Pages (apps/next)
```
apps/next/pages/
├── index.tsx           # → Home/Landing
├── login.tsx           # → Auth
├── portal.tsx          # → Portal Hub
├── dashboard.tsx       # → Admin Dashboard
├── athlete-portal/
│   ├── profile.tsx
│   ├── tournaments.tsx
│   └── ...
```

---

## 4. API Integration

### API Base URL
```env
# Local development
NEXT_PUBLIC_API_BASE_URL=http://localhost:18080
# Production (Vercel) — set in Vercel dashboard
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
POST /api/v1/auth/refresh          # { refresh_token }
GET  /api/v1/auth/me              # Current user info
POST /api/v1/auth/logout          # Invalidate session
GET  /api/v1/auth/my-roles        # List user roles
POST /api/v1/auth/switch-context  # Switch active role
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

### Local Component State
- Use `useState` + `useEffect` for page-level state
- No global state library (Redux/Zustand) — keep it simple

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

## 7. Error Handling

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

## 8. Anti-Patterns (NEVER Do These)

1. ❌ **NEVER** put feature code directly in `apps/next/pages/` — always in `packages/app/features/`
2. ❌ **NEVER** use `next/router` directly — use the `onNavigate` callback from layout
3. ❌ **NEVER** create API calls without error handling
4. ❌ **NEVER** skip loading states — always show skeleton or placeholder
5. ❌ **NEVER** hardcode text strings — use `useI18n()` for all labels
6. ❌ **NEVER** import from `lucide-react` directly — use `VCT_Icons`
7. ❌ **NEVER** create components without `VCT_` prefix
8. ❌ **NEVER** use Tailwind `dark:` modifier — use CSS variable tokens

---

## 9. New Feature Checklist

When creating a new feature:

1. [ ] Create feature directory: `packages/app/features/{name}/`
2. [ ] Create page component: `Page_{name}.tsx`
3. [ ] Register routes in `route-registry.ts`
4. [ ] Add i18n keys for all labels
5. [ ] Add page file in `apps/next/pages/{route}.tsx`
6. [ ] Implement API integration with loading/error states
7. [ ] Add sidebar navigation entry for the appropriate role
8. [ ] Test in both light and dark themes

---

## 10. Custom Hooks Catalog

18 hooks in `packages/app/features/hooks/`:

| Hook | Purpose |
|------|---------|
| `useAdminAPI` | Admin CRUD (users, roles, system, docs) |
| `useApiQuery` | Generic API fetching with loading/error |
| `useCalendarAPI` | Calendar events |
| `useClubAPI` | Club management |
| `useCommunityAPI` | Community features |
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

## 11. Admin Workspace Patterns

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

### Admin Pages:
| Page | File | Features |
|------|------|---------|
| Users | `Page_admin_users.tsx` | Data table, search, Drawer detail |
| User Detail | `Page_admin_user_detail.tsx` | Profile, timeline, skeleton loading |
| Roles | `Page_admin_roles.tsx` | Role matrix, permissions |
| System | `Page_admin_system.tsx` | Health, config, metrics |
| Documents | `Page_documents.tsx` | Doc management, Drawer preview |
| Integrity | `Page_integrity.tsx` | Data integrity checks |
| Notifications | `Page_notifications_admin.tsx` | Notification center, Drawer |
| Data Quality | `Page_data_quality.tsx` | Quality metrics, validation |
| Audit Logs | `Page_audit_logs.tsx` | Activity audit trail |
| Feature Flags | `Page_admin_feature_flags.tsx` | Toggle features |
| Reference Data | `Page_admin_reference_data.tsx` | Master data management |

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

## 12. Form Validation

```tsx
function validateForm(data: CreateAthleteInput): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!data.name.trim()) errors.name = t('validation.required')
  if (data.age < 6 || data.age > 80) errors.age = t('validation.age_range')
  if (!data.club_id) errors.club_id = t('validation.select_club')
  return errors
}
```

---

## 13. Optimistic UI

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
