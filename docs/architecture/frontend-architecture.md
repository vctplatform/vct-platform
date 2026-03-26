# VCT Platform — Frontend Rules (Engineering Architecture)

> **Vai trò**: Quy chuẩn KIẾN TRÚC KỸ THUẬT — mọi thứ liên quan đến **CÁCH XÂY DỰNG CODE** (engineering).
>
> **Phạm vi**: Monorepo, package boundaries, routing, state management, API, i18n, testing, performance, error handling, RBAC, real-time, mobile, code patterns.
>
> **Không thuộc phạm vi**: Design tokens, colors, typography, component catalog, animation → xem [`docs/architecture/ui-architecture-rules.md`](file:///d:/VCT%20PLATFORM/vct-platform/docs/architecture/ui-architecture-rules.md)

---

## MỤC LỤC

| #   | Phần                                                                        | Mục đích                                     |
| --- | --------------------------------------------------------------------------- | -------------------------------------------- |
| 1   | [Technology Stack](#1-technology-stack)                                     | Versions & dependencies                      |
| 2   | [Monorepo Architecture](#2-monorepo-architecture)                           | Package boundaries & dependency graph        |
| 3   | [Layout Architecture](#3-layout-architecture)                               | AppShell, Provider tree, page structure      |
| 4   | [Routing & Navigation](#4-routing--navigation)                              | App Router, RSC vs Client boundaries         |
| 5   | [Page Patterns](#5-page-patterns)                                           | Standard, Admin Table+Drawer, Dashboard      |
| 6   | [State Management](#6-state-management)                                     | Server vs Client vs Local state              |
| 7   | [API Integration](#7-api-integration)                                       | Fetch patterns, REST conventions, WebSocket  |
| 8   | [Form & Validation](#8-form--validation)                                    | Zod schemas, form patterns                   |
| 9   | [Internationalization](#9-internationalization)                             | i18n rules, key format                       |
| 10  | [Error Handling](#10-error-handling)                                        | Error Boundary, loading/empty states         |
| 11  | [Performance](#11-performance)                                              | Code splitting, lazy loading                 |
| 12  | [RBAC & Permissions UI](#12-rbac--permissions-ui)                           | `useRouteActionGuard`, conditional rendering |
| 13  | [Real-time UI](#13-real-time-ui)                                            | WebSocket, notifications, scoring            |
| 14  | [Mobile (Expo)](#14-mobile-expo)                                            | Cross-platform code sharing                  |
| 15  | [Testing Strategy](#15-testing-strategy)                                    | Vitest, Playwright, coverage targets         |
| 16  | [Naming Conventions](#16-naming-conventions)                                | Files, components, hooks, types              |
| 17  | [SEO & Meta Tags](#17-seo--meta-tags)                                       | Public page metadata                         |
| 18  | [Toast & Notifications](#18-toast--notifications)                           | Toast hook, notification system              |
| 19  | [Data Tables](#19-data-tables)                                              | VCT_DataGrid patterns                        |
| 20  | [PWA & Offline](#20-pwa--offline)                                           | Offline scoring, sync                        |
| 21  | [Print & Export](#21-print--export)                                         | CSV export, print styles                     |
| 22  | [Security & CSP](#22-security--csp)                                         | XSS, CSRF, DOMPurify, headers                |
| 23  | [Observability](#23-observability)                                          | Sentry, Web Vitals, logging                  |
| 24  | [CI/CD & Git Pipeline](#24-cicd--git-pipeline)                              | Husky, lint-staged, code review              |
| 24  | [Git Pipeline & Format](#24-git-pipeline--format)                   | pre-commit, prettier, lint-staged            |
| 25  | [Feature Flags](#25-feature-flags)                                          | Trunk-based dev, hidden WIP features         |
| 26  | [Performance Budgets & Dependencies](#26-performance-budgets)       | Giới hạn Bundle Size, cấm thư viện nặng        |
| A   | [Engineering Anti-Patterns](#a-engineering-anti-patterns)                   | Lỗi kiến trúc bị cấm                         |
| B   | [Pre-Delivery Engineering Checklist](#b-pre-delivery-engineering-checklist) | Quality gates                                |
| C   | [New Feature Workflow](#c-new-feature-workflow)                             | Step-by-step feature creation                |

---

## 1. Technology Stack

| Tech              | Version | Usage                      |
| ----------------- | ------- | -------------------------- |
| **Next.js**       | 16.1.6  | Web framework (App Router) |
| **React**         | 19.2.4  | UI library                 |
| **TypeScript**    | 5.9.3   | Type safety                |
| **TailwindCSS**   | 4.2.1   | CSS utility framework      |
| **Zustand**       | 5.0.12  | Global state management    |
| **Zod**           | 4.3.6   | Schema validation          |
| **Framer Motion** | 12.37.0 | Page transitions           |
| **Vitest**        | 4.1.0   | Unit/component testing     |
| **Playwright**    | 1.52.0  | E2E testing                |
| **Node.js**       | ≥22.0.0 | Runtime                    |
| **Expo**          | Latest  | Mobile (React Native)      |

---

## 2. Monorepo Architecture

### 2.1 Directory Structure

```
vct-platform/
├── apps/
│   ├── next/               # Next.js 16 (App Router) — Web
│   │   └── app/            # Route pages (thin wrappers ONLY)
│   └── expo/               # Expo/React Native — Mobile
├── packages/
│   ├── ui/                 # @vct/ui — Component library (59 components)
│   ├── app/                # @vct/app — Shared features & business logic
│   │   └── features/       # 34 feature modules
│   │       ├── admin/      # Admin workspace (22 pages)
│   │       ├── athletes/   # Athlete management
│   │       ├── auth/       # Authentication
│   │       ├── components/ # Shared feature-level components
│   │       ├── hooks/      # 22 shared hooks
│   │       ├── i18n/       # i18n config & dictionaries
│   │       ├── layout/     # AppShell, Sidebar, Route Registry
│   │       ├── theme/      # ThemeProvider
│   │       └── ...         # 34 feature modules total
│   ├── shared-types/       # TypeScript type definitions
│   └── shared-utils/       # Pure utility functions
```

### 2.2 Dependency Graph (MANDATORY)

```
apps/next ──────┐
apps/expo ──────┤
                ▼
          packages/app ──────→ packages/shared-types
                │
                ▼
          packages/ui ────────→ packages/shared-utils
```

### 2.3 Package Boundary Rules (7 Rules)

| Rule   | Description                                                       | Enforced By       |
| ------ | ----------------------------------------------------------------- | ----------------- |
| **F1** | `shared-types` KHÔNG import bất kỳ package nào khác               | ESLint boundaries |
| **F2** | `shared-utils` KHÔNG import `app` hoặc `ui`                       | ESLint boundaries |
| **F3** | `packages/ui` KHÔNG import `packages/app`                         | ESLint boundaries |
| **F4** | `packages/app` có thể import `shared-types`, `shared-utils`, `ui` | —                 |
| **F5** | `apps/next` và `apps/expo` import từ `packages/*`                 | —                 |
| **F6** | API calls chỉ nằm trong `features/` hoặc `hooks/`                 | Code review       |
| **F7** | Route pages (`apps/next/app/`) chỉ compose components — NO logic  | Code review       |

### 2.4 Import Standards

```tsx
// ✅ Components — luôn từ @vct/ui
import { VCT_Card, VCT_Button, VCT_Modal } from '@vct/ui'

// ✅ Icons — qua VCT_Icons wrapper
import { VCT_Icons } from '../components/vct-icons'

// ✅ i18n
import { useI18n } from '../i18n'

// ✅ Theme
import { useTheme } from '../theme/ThemeProvider'

// ✅ Auth
import { useAuth } from '../auth/useAuth'

// ❌ KHÔNG BAO GIỜ
import { Search } from 'lucide-react' // → VCT_Icons.Search
import { Button } from '../my-custom-button' // → VCT_Button từ @vct/ui
```

### 2.5 Enforcement

```bash
npm run lint:arch           # ESLint boundaries check
npm run lint:boundaries     # Custom grep-based check
```

---

## 3. Layout Architecture

### 3.1 AppShell Structure

```
┌──────────────────────────────────────────────────────────────┐
│  Header (breadcrumbs, search ⌘K, toggles, avatar dropdown)  │
├───────────┬──────────────────────────────────────────────────┤
│  Sidebar  │  Main Content Area                               │
│  272px    │  → <motion.div> Page Transition                  │
│  (full)   │    → Feature Page Component                      │
│  or 88px  │      → VCT_PageContainer / VCT_PageHeader        │
│  (mini)   │                                                  │
├───────────┴──────────────────────────────────────────────────┤
│  Mobile: Hamburger menu + bottom tab bar                     │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 Provider Tree

```tsx
<I18nProvider>
  {' '}
  // Internationalization
  <ThemeProvider>
    {' '}
    // Dark/Light theme
    <AuthProvider>
      {' '}
      // Authentication & RBAC
      <ShellLayout>
        {' '}
        // AppShell with sidebar + header
        {children} // Page content
      </ShellLayout>
    </AuthProvider>
  </ThemeProvider>
</I18nProvider>
```

### 3.3 Public Routes (No AppShell)

```typescript
const PUBLIC_ROUTES = [
  '/login',
  '/portal',
  '/register',
  '/forgot-password',
  '/public',
]
```

---

## 4. Routing & Navigation

### 4.1 App Router (**KHÔNG PHẢI Pages Router**)

```
apps/next/app/
├── layout.tsx               # Root layout (AppShell)
├── page.tsx                 # "/" → Portal Hub
├── login/page.tsx           # "/login"
├── dashboard/page.tsx       # "/dashboard"
├── admin/                   # "/admin/*" — 22 pages
├── athlete-portal/          # "/athlete-portal/*"
├── club/                    # "/club/*"
├── provincial/              # "/provincial/*"
├── federation/              # "/federation/*"
├── public/                  # "/public/*"
├── referee-scoring/         # Real-time scoring
├── scoreboard/              # Live scoreboard
└── ... (58 route directories total)
```

### 4.2 Creating a New Route

```tsx
// STEP 1: Create feature page in packages/app/features/{module}/
// File: packages/app/features/my-feature/Page_my_feature.tsx
// ❌ CẤM để 'use client' ở root page nếu không cần thiết
import { VCT_PageContainer, VCT_PageHeader, VCT_Card } from '@vct/ui'
import { getI18n } from '../i18n/server' // Dùng server i18n
import { ClientInteractiveWidget } from './components/client-widget'

export async function Page_my_feature() {
  const t = await getI18n()
  return (
    <VCT_PageContainer>
      <VCT_PageHeader
        title={t('my_feature.title')}
        subtitle={t('my_feature.subtitle')}
      />
      <VCT_Card>
        <ClientInteractiveWidget />
      </VCT_Card>
    </VCT_PageContainer>
  )
}

// STEP 2: Create route page (thin wrapper ONLY)
// File: apps/next/app/my-feature/page.tsx
import { Page_my_feature } from 'app/features/my-feature/Page_my_feature'
export default Page_my_feature

// STEP 3: Register in route-registry.ts
// STEP 4: Add i18n keys for vi and en
```

### 4.3 Route Registry

- **Central config**: `packages/app/features/layout/route-registry.ts`
- **Sidebar**: `getSidebarGroups(role: UserRole)` — nav items per role
- **RBAC matrix**: `packages/app/features/layout/rbac-matrix.ts`
- **Workspace configs**: `packages/app/features/layout/workspace-sidebar-configs.ts`

### 4.4 React Server Components (RSC) vs Client Boundary

**Sức mạnh của App Router nằm ở việc KHÔNG GỬI JAVASCRIPT XUỐNG BROWSER.**

| Loại Component | Render ở đâu? | JavaScript tới Browser? | Lúc nào dùng? |
| --- | --- | --- | --- |
| **Server Component** (Mặc định) | Server | **0kb JS** | Page layouts, SEO data fetching, tĩnh. |
| **Client Component** (`'use client'`) | Cả Server (SSR) & Client | Có (Hyration) | `onClick`, `useState`, `useEffect`, Animation, Hooks. |

**RSC Rules**:
1. ❌ **CẤM** đặt `'use client'` ở Root Layout hoặc Page ngoài cùng trừ khi trang đó 100% interactive (ví dụ: `refeere-scoring`).
2. ✅ **ĐẨY `'use client'` XUỐNG DƯỚI JUNCTION (LÁ)**: Nếu chỉ có cái nút bấm cần `onClick`, hãy tách cái nút đó ra file riêng có `'use client'`, đừng để cả page thành client.
3. ✅ Server Component có thể import Client Component, nhưng Client Component **KHÔNG THỂ** import Server Component trực tiếp (phải pass qua `children` props).

### 4.5 Navigation Rules

| #   | Rule                                                               |
| --- | ------------------------------------------------------------------ |
| N1  | ❌ **KHÔNG** dùng `<a>` tags → `router.push()` hoặc `onNavigate()` |
| N2  | ❌ **KHÔNG** dùng `next/router` → dùng `next/navigation`           |
| N3  | ✅ Route pages chỉ import và re-export feature page component      |
| N4  | ✅ Navigation logic nằm trong AppShell và route-registry           |

### 4.6 Error Boundaries & Suspense (Kiến Trúc Chịu Lỗi Cục Bộ)

Quản lý lỗi và tải trang không bao giờ được phép làm sập toàn bộ web (White Screen of Death). App Router của Next.js cung cấp File Conventions để chẻ nhỏ rủi ro:

1. ✅ **`error.tsx` (Error Boundary)**: Bắt buộc bọc các Module lớn. Lỗi xảy ra ở nhánh nào thì chỉ nhánh đó hiện Box cảnh báo (kèm Nút `Thử Lại`), giữ Sidebar và Header hoạt động bình thường.
2. ✅ **`loading.tsx` (Suspense)**: Bắt buộc dùng `loading.tsx` bọc các Page tốn thời gian Fetch API trên server. Next.js tự động streaming Shell UI.
3. ✅ **`not-found.tsx`**: Tại các file Dynamic Route (ví dụ `[tournamentId]/page.tsx`), thay vì redirect thủ công về trang 404, **phải** ném lỗi bằng hàm `notFound()` để hiển thị giao diện 404 chuyên nghiệp của hệ thống.

---

## 5. Page Patterns

### 5.1 Standard Page

```tsx
'use client'
import { VCT_PageContainer, VCT_PageHeader, VCT_Card } from '@vct/ui'
import { useI18n } from '../i18n'

export function Page_module_subpage() {
  const { t } = useI18n()
  return (
    <VCT_PageContainer>
      <VCT_PageHeader
        title={t('module.subpage.title')}
        subtitle={t('module.subpage.subtitle')}
        actions={[
          {
            label: t('common.add'),
            icon: <VCT_Icons.Plus size={16} />,
            onClick: () => {},
          },
        ]}
      />
      <VCT_Card>{/* Content */}</VCT_Card>
    </VCT_PageContainer>
  )
}
```

### 5.2 Admin Page (Table + Drawer)

```
┌──────────────────────────────────────────────────────────┐
│ Page Header: title, search, action buttons               │
├──────────────────────────────────────────────────────────┤
│ Stats Row: 3–4 VCT_StatBlock cards                       │
├──────────────────────────────────────────────────────────┤
│ VCT_DataGrid (sortable, paginated)                       │
│   Row → onClick → opens VCT_Drawer ─────────────────►   │
│                                    ┌────────────────────┐│
│                                    │ VCT_Drawer 480px   ││
│                                    │ VCT_InfoGrid       ││
│                                    │ VCT_Timeline       ││
│                                    │ Action buttons     ││
│                                    └────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

```tsx
const [selectedItem, setSelectedItem] = useState<Item | null>(null)

<VCT_DataGrid
  columns={columns}
  data={filteredData}
  onRowClick={(row) => setSelectedItem(row)}
/>

<VCT_Drawer
  open={!!selectedItem}
  onClose={() => setSelectedItem(null)}
  title={selectedItem?.name}
  width="480px"
>
  <VCT_InfoGrid data={infoFields} />
  <VCT_Timeline events={activityLog} />
</VCT_Drawer>
```

### 5.3 Dashboard Page

```
┌──────────────────────────────────────────────────┐
│ Hero Stats: 4 VCT_StatBlock cards                │
├──────────────────────────────────────────────────┤
│ Chart Row: VCT_BarChart + VCT_DonutChart         │
├──────────────────────────────────────────────────┤
│ Recent Activity: VCT_Timeline                    │
│ Quick Actions: VCT_Card grid                     │
└──────────────────────────────────────────────────┘
```

---

## 6. State Management

### 6.1 State Classification

| Type              | Tool                                        | Examples                  |
| ----------------- | ------------------------------------------- | ------------------------- |
| **Server State**  | Custom hooks (`useAdminAPI`, `useAthletes`) | API data                  |
| **Global Client** | Zustand stores                              | Sidebar, workspace, theme |
| **Local State**   | `useState`, `useReducer`                    | Form input, dropdown open |
| **URL State**     | `useSearchParams`, `usePathname`            | Filters, pagination       |

### 6.2 Rules

| #   | Rule                                                                   |
| --- | ---------------------------------------------------------------------- |
| S1  | ❌ **CẤM** `fetch()` rồi `setState(data)` trong `useEffect` trong page |
| S2  | ✅ Server State phải qua custom hooks                                  |
| S3  | ❌ **CẤM** Context API cho complex state → Zustand                     |
| S4  | ❌ **CẤM** local state (form input) lên Global Store                   |
| S5  | ✅ Global State chỉ cho: sidebar, workspace, theme, auth               |

### 6.3 Zustand Pattern

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

### 6.4 Custom Hooks (22 hooks in `packages/app/features/hooks/`)

| Hook                       | Purpose                 |
| -------------------------- | ----------------------- |
| `useAdminAPI`              | Admin CRUD              |
| `useApiQuery`              | Generic API fetching    |
| `useCalendarAPI`           | Calendar events         |
| `useClubAPI`               | Club management         |
| `useCommunityAPI`          | Community features      |
| `useDebounce`              | Debounced value         |
| `useDivisions`             | Province/District/Ward  |
| `useFederationAPI`         | Federation operations   |
| `useFinanceAPI`            | Finance & billing       |
| `useHeritageAPI`           | Belt ranking            |
| `useNotificationAPI`       | Notification CRUD       |
| `usePagination`            | Pagination logic        |
| `usePeopleAPI`             | People directory        |
| `usePublicAPI`             | Public data             |
| `useRankingsAPI`           | Rankings                |
| `useRealtimeNotifications` | WebSocket notifications |
| `useTrainingAPI`           | Training programs       |
| `useTournamentAPI`         | Tournament management   |
| `useMarketplaceAPI`        | Marketplace features    |
| `useWebSocket`             | Raw WebSocket           |
| `useRouteActionGuard`      | Permission checks       |
| `useToast`                 | Toast system            |

---

## 7. API Integration

### 7.1 Base URLs

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:18080      # Local
NEXT_PUBLIC_API_BASE_URL=https://vct-api.fly.dev     # Production
```

### 7.2 Standard Fetch Pattern

```tsx
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:18080'

async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('vct-access-token')
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`)
  return res.json()
}
```

### 7.3 REST Conventions

```
GET    /api/v1/{entity}       # List
POST   /api/v1/{entity}       # Create
GET    /api/v1/{entity}/{id}  # Get by ID
PUT    /api/v1/{entity}/{id}  # Update
DELETE /api/v1/{entity}/{id}  # Delete
```

### 7.4 Data Fetching (REQUIRED Pattern)

```tsx
// ✅ ALWAYS in a custom hook — NEVER in page component
function useAthletes() {
  const [data, setData] = useState<Athlete[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(() => {
    setLoading(true)
    apiCall<Athlete[]>('/api/v1/athletes')
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])
  return { data, loading, error, refetch }
}
```

### 7.5 Optimistic UI

```tsx
const handleDelete = async (id: string) => {
  setItems((prev) => prev.filter((i) => i.id !== id)) // Optimistic
  try {
    await apiCall(`/api/v1/entity/${id}`, { method: 'DELETE' })
  } catch {
    refetch() // Rollback
    toast.error(t('error.delete_failed'))
  }
}
```

### 7.6 Client-side Caching

| Loại dữ liệu | Strategy khuyên dùng | Thời gian TTL | Công cụ khuyến nghị |
| --- | --- | --- | --- |
| **Dữ liệu tĩnh** (Tỉnh thành, Hệ phái) | `Cache-First` (vĩnh viễn) | Vô hạn (Local Storage) | Zustand Persist |
| **Danh mục ít đổi** (DS Trọng tài, CLB) | `Stale-While-Revalidate` | Đọc cache, gọi ngầm API API (30p TTL) | Custom Hook + SWR pattern |
| **Dữ liệu động** (DS Thi đấu, Hồ sơ) | `Network-Only` | Không dùng cache | Fetch API trực tiếp |
| **Realtime** (Chấm điểm trực tiếp) | `WebSocket` | WebSocket Connection | `useWebSocket` |

---

## 8. Form & Validation

### 8.1 Zod 4 Schema

```tsx
import { z } from 'zod'

const CreateAthleteSchema = z.object({
  name: z.string().min(1, 'Required'),
  age: z.number().min(6).max(80),
  club_id: z.string().uuid(),
})

type CreateAthleteInput = z.infer<typeof CreateAthleteSchema>

const result = CreateAthleteSchema.safeParse(formData)
if (!result.success) {
  setErrors(result.error.flatten().fieldErrors)
}
```

### 8.2 Form Rules

1. ✅ All fields **MUST** have `<label>` (not just placeholder)
2. ✅ Validation errors shown below field
3. ✅ Submit button disabled when form invalid
4. ✅ Loading state on submit button during API call

---

## 9. Internationalization

### 9.1 Usage

```tsx
import { useI18n } from '../i18n'

function MyComponent() {
  const { t, lang, setLang } = useI18n()
  return <h1>{t('page.title')}</h1>
}
```

### 9.2 Rules

| #   | Rule                                                             |
| --- | ---------------------------------------------------------------- |
| I1  | ❌ **TUYỆT ĐỐI CẤM** hardcode text: `<button>Đăng nhập</button>` |
| I2  | ✅ BẮT BUỘC: `<button>{t('auth.login')}</button>`                |
| I3  | ✅ Key format: `module.section.label`                            |
| I4  | ✅ Default locale: Vietnamese (`vi`), supported: `vi`, `en`      |
| I5  | ✅ New keys → add for BOTH locales                               |
| I6  | ✅ Backend returns error codes, frontend translates              |

---

## 10. Error Handling

### 10.1 Error Boundary

```tsx
import { VCT_ErrorBoundary } from '../components/vct-error-boundary'

;<VCT_ErrorBoundary>
  <YourComponent />
</VCT_ErrorBoundary>
```

### 10.2 Loading States Pattern

```tsx
if (loading) return <VCT_PageSkeleton />
if (error) return <ErrorBanner message={error} onRetry={refetch} />
if (!data.length) return <VCT_EmptyState />
return <Content data={data} />
```

### 10.3 Rules

| #   | Rule                                                 |
| --- | ---------------------------------------------------- |
| E1  | ❌ NO blank page during loading → `VCT_PageSkeleton` |
| E2  | ❌ NO spinner → skeleton cards/rows                  |
| E3  | ✅ Error state → retry button                        |
| E4  | ✅ Empty state → `VCT_EmptyState`                    |
| E5  | ✅ Widget error → local fallback, NOT app crash      |

---

## 11. Performance

### 11.1 Guard Rails

| #   | Rule               | Solution                                       |
| --- | ------------------ | ---------------------------------------------- |
| P1  | No heavy imports   | Import submodules, not entire libraries        |
| P2  | Image optimization | `next/image`, no images > 2MB                  |
| P3  | Memoization        | `React.memo` for heavy list components         |
| P4  | Code splitting     | Dynamic import for heavy components            |
| P5  | SSR-safe           | No `window`/`localStorage` outside `useEffect` |
| P6  | Bundle monitoring  | `@next/bundle-analyzer`                        |

### 11.2 Lazy Load Candidates

```tsx
import dynamic from 'next/dynamic'

const VCT_RichTextEditor = dynamic(
  () => import('@vct/ui').then((m) => ({ default: m.VCT_RichTextEditor })),
  { ssr: false, loading: () => <VCT_Skeleton height={200} /> },
)
// Also: VCT_QRScanner, VCT_QRCode, VCT_DataGrid,
//        VCT_DigitalSignature, VCT_ImageGallery, Chart components
```

**Rule**: Components > 15KB → dynamic import candidates. Browser API components → `{ ssr: false }`.

---

## 12. RBAC & Permissions UI

### 12.1 Hook Usage

```tsx
import { useRouteActionGuard } from '../hooks/use-route-action-guard'

function Page_tournament_schedule() {
  const { can, requireAction } = useRouteActionGuard('/schedule', {
    notifyDenied: (msg) => showToast(msg, 'warning'),
  })

  return (
    <div>
      {can('create') && (
        <VCT_Button onClick={handleCreate}>{t('schedule.add')}</VCT_Button>
      )}

      <VCT_Button
        onClick={() => {
          if (requireAction('delete', 'xóa lịch thi đấu')) handleDelete()
        }}
      >
        {t('common.delete')}
      </VCT_Button>
    </div>
  )
}
```

### 12.2 12 Route Actions

`view` · `create` · `update` · `delete` · `approve` · `publish` · `assign` · `import` · `export` · `monitor` · `manage` · `lock`

### 12.3 Patterns

```tsx
{
  can('create') && <CreateButton />
} // Show/hide
;<VCT_Button disabled={!can('update')} /> // Disable
{
  can('manage') ? <AdminView /> : <ReadOnlyView />
} // Different content
```

### 12.4 Rules

1. ❌ **KHÔNG** check `if (user.role === 'admin')` → dùng `can('action')`
2. ✅ LUÔN ẩn UI elements user không có quyền
3. ✅ Backend PHẢI validate lại — frontend chỉ là UX

---

## 13. Real-time UI

### 13.1 WebSocket Integration

```tsx
import { useWebSocket } from '../hooks/useWebSocket'

function TournamentLive() {
  const { status, lastEvent } = useWebSocket({
    channels: ['tournaments', 'scoring'],
    onEntityChange: (event) => {
      if (event.entity === 'match') refetchMatches()
    },
  })
  return <ConnectionIndicator status={status} />
}
```

### 13.2 Connection Status

| Status         | Indicator                         |
| -------------- | --------------------------------- |
| `connecting`   | 🟡 "Đang kết nối..."              |
| `connected`    | 🟢 (hide after 2s)                |
| `disconnected` | 🟠 "Mất kết nối, đang thử lại..." |
| `error`        | 🔴 "Lỗi kết nối" + retry button   |

### 13.3 Rules

1. ✅ LUÔN show connection indicator
2. ✅ Auto-reconnect with exponential backoff
3. ❌ **KHÔNG** infinite re-render loops
4. ✅ Throttle high-frequency event renders

---

## 14. Mobile (Expo)

### 14.1 Architecture

```
packages/app/features/mobile/
├── app-entry.tsx              # Entry point
├── root-navigator.tsx         # Root navigation
├── tab-navigator.tsx          # Bottom tabs
├── screen-shell.tsx           # Layout shell
├── mobile-ui.tsx              # Mobile components
├── athlete/                   # Athlete screens
├── club/                      # Club screens
├── referee/                   # Scoring screens
└── offline/                   # Offline module
```

### 14.2 Web vs Mobile

| Feature    | Web (Next.js)      | Mobile (Expo)              |
| ---------- | ------------------ | -------------------------- |
| Navigation | App Router URLs    | React Navigation           |
| Layout     | AppShell (sidebar) | Bottom tabs + stack        |
| Theme      | CSS variables      | React context + StyleSheet |
| Storage    | localStorage       | AsyncStorage / SecureStore |
| Animations | Framer Motion      | Reanimated                 |
| Offline    | Service Worker     | OfflineManager + SQLite    |

### 14.3 Rules

1. ✅ Business logic hooks → shared in `packages/app/features/hooks/`
2. ❌ **KHÔNG** import web components in mobile
3. ✅ Mobile screen naming: `Screen_{module}_{name}.tsx`
4. ✅ Offline-first for scoring features

---

## 15. Testing Strategy

### 15.1 Stack

| Layer          | Tool           | Location                        |
| -------------- | -------------- | ------------------------------- |
| Unit/Component | Vitest + jsdom | `features/**/__tests__/`        |
| Mobile Unit    | Jest           | `features/mobile/**/__tests__/` |
| E2E (Web)      | Playwright     | `tests/e2e/`                    |
| E2E (Mobile)   | Maestro        | `maestro/`                      |

### 15.2 Test Pattern

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('Page_admin_dashboard', () => {
  it('renders dashboard title', () => {
    render(<Page_admin_dashboard />)
    expect(screen.getByText(/dashboard/i)).toBeDefined()
  })
  it('shows skeleton during loading', () => {
    /* ... */
  })
  it('shows error banner on API failure', () => {
    /* ... */
  })
})
```

### 15.3 Coverage Targets

| Category     | Target    | Priority   |
| ------------ | --------- | ---------- |
| Custom hooks | ≥ 80%     | **Cao**    |
| Admin pages  | ≥ 60%     | Trung bình |
| Auth flows   | ≥ 90% E2E | **Cao**    |
| Scoring UI   | ≥ 90% E2E | **Cao**    |

### 15.4 Rules

1. ✅ Every hook MUST have unit test
2. ✅ Every page MUST test: loading, error, success states
3. ❌ **KHÔNG** test implementation details → test behavior
4. ✅ Test by user interaction: `getByRole`, `getByText`

---

## 16. Naming Conventions

### 16.1 Files

| Type            | Pattern                       | Example                    |
| --------------- | ----------------------------- | -------------------------- |
| Page            | `Page_{module}_{subpage}.tsx` | `Page_athlete_profile.tsx` |
| Mobile Screen   | `Screen_{module}_{name}.tsx`  | `Screen_athlete_home.tsx`  |
| Component       | `VCT_{ComponentName}.tsx`     | `VCT_DataGrid.tsx`         |
| Multi-component | `vct-{group}.tsx`             | `vct-charts.tsx`           |
| Hook            | `use{Domain}API.ts`           | `useAdminAPI.ts`           |
| Types           | `{module}.types.ts`           | `admin.types.ts`           |
| CSS Module      | `{module}.module.css`         | `admin.module.css`         |
| Data            | `{module}.data.ts`            | `admin-users.data.ts`      |

### 16.2 TypeScript

| Item           | Convention         | Example              |
| -------------- | ------------------ | -------------------- |
| Component      | PascalCase         | `AthleteList`        |
| Hook           | `use` + PascalCase | `useAthletes`        |
| Type/Interface | PascalCase         | `Athlete`            |
| Feature folder | kebab-case         | `athlete-profile`    |
| API function   | camelCase          | `fetchAthletes`      |
| i18n key       | dot-notation       | `athlete.list.title` |

---

## 17. SEO & Meta Tags

```tsx
// Only /public/* pages need full SEO
export const metadata: Metadata = {
  title: { template: '%s | VCT Platform', default: 'VCT Platform' },
  description: 'Hệ thống quản lý thể thao cho Liên đoàn Võ Cổ Truyền Việt Nam',
  openGraph: { type: 'website', locale: 'vi_VN' },
}
```

```

### 17.1 Basic Meta Tags

**Rules**: Public pages → `<title>` + `description` + OG. Auth pages → basic title only.

### 17.2 Dynamic OpenGraph (`@vercel/og`)

Tính năng chia sẻ lên mạng xã hội là "bộ mặt Marketing" của VCT Platform:
1. ✅ **Trang Giải Đấu/Kết Quả**: Bắt buộc tạo Endpoint `@vercel/og` (ví dụ `app/api/og/route.tsx`) để vẽ ảnh động. Khi paste link giải đấu lên Facebook/Zalo, ảnh Thumbnail (ImageResponse) hiện ra phải báo luôn Logo + Tên Giải Đấu + Trạng thái.
2. ❌ **Cấm**: Share link kết quả Môn Phái mà chỉ ra dòng chữ vô hồn "Hệ thống VCT". Hình ảnh hiển thị phải được render SSR mang đậm tính Sports.

---

## 18. Toast & Notifications

### 18.1 Usage

```tsx
const { toast, showToast } = useToast(3500)
showToast(t('toast.save_success'), 'success')
```

### 18.2 Types

| Type      | Auto-dismiss | Sound              |
| --------- | ------------ | ------------------ |
| `success` | 3.5s         | None               |
| `error`   | Manual close | None               |
| `warning` | 5s           | Vibration (mobile) |
| `info`    | 3.5s         | None               |

**Rules**: Max 3 visible (FIFO). Messages use i18n. NO `alert()` or `window.confirm()`.

---

## 19. Data Tables

```tsx
const [search, setSearch] = useState('')
const debounced = useDebounce(search, 300)
const filtered = useMemo(() =>
  data.filter(item => item.name.toLowerCase().includes(debounced.toLowerCase())),
  [data, debounced]
)

<VCT_Input placeholder={t('common.search')} value={search}
  onChange={(e) => setSearch(e.target.value)}
  leftIcon={<VCT_Icons.Search size={16} />} />
<VCT_DataGrid columns={columns} data={filtered} />
```

**Rules**: LUÔN `VCT_DataGrid`. Search PHẢI `useDebounce(300)`. Loading → shimmer rows. Empty → `VCT_EmptyState`.

---

## 20. PWA & Offline

### Scoring MUST work offline

1. Referee opens scoring → data cached locally
2. Scores entered → saved to local queue
3. Network restored → auto-sync to server
4. Conflict resolution: last-write-wins

### Offline Indicators

| State   | Banner                                                 |
| ------- | ------------------------------------------------------ |
| Online  | Hidden                                                 |
| Offline | 🔴 "Đang ngoại tuyến — dữ liệu sẽ đồng bộ khi có mạng" |
| Syncing | 🟡 "Đang đồng bộ... (3/5)"                             |
| Failed  | 🔴 "Đồng bộ thất bại" + retry                          |

---

## 21. Print & Export

```tsx
function exportToCSV(data: Record<string, unknown>[], filename: string) {
  const headers = Object.keys(data[0])
  const csv = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`)
        .join(','),
    ),
  ].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  // ... download logic
}
```

**Rules**: CSV MUST have BOM for Vietnamese. Filename: `{entity}_{YYYY-MM-DD}.csv`. Print → hide sidebar/header.

---

## 22. Security & CSP

### 22.1 Strict HTML Sanitization

**TUYỆT ĐỐI CẤM** dùng `dangerouslySetInnerHTML` trực tiếp với dữ liệu trả về từ API/User input.

```tsx
// ✅ BẮT BUỘC SỬ DỤNG DOMPurify
import DOMPurify from 'dompurify'

function UserHtmlContent({ htmlString }) {
  const cleanHtml = DOMPurify.sanitize(htmlString)
  return <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />
}
```

### 22.2 Content Security Policy (CSP)

Cấu hình trong `next.config.ts`:

```typescript
const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://storage.googleapis.com;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
`
```

---

## 23. Observability

### 23.1 Error Reporting (Sentry)

Lỗi ở Client sẽ không hiển thị trên server logs. Bắt buộc có cơ chế track (Sentry/LogRocket).

- **Khi dùng `VCT_ErrorBoundary`**: LUÔN đẩy lỗi lên dịch vụ tracking thay vì chỉ hiện Modal lỗi.
- **Rule M3**: Cấm dùng `console.error` trên production để giấu thông tin kiến trúc. Thay vào đó dùng cơ chế custom logger (chỉ emit trace id).

### 23.2 Custom Logger

```tsx
// @vct/shared-utils/logger.ts
export const logger = {
  info: (msg, data) => process.env.NODE_ENV !== 'production' && console.log(msg, data),
  error: (msg, error) => {
    // 1. Log to Sentry
    // 2. console.error in dev
  }
}
```

---

## 24. CI/CD & Git Pipeline

### 24.1 Pre-commit Hooks

Việc thiết lập Boundary (`eslint-plugin-boundaries`) vô nghĩa nếu lập trình viên quên chạy.

**BẮT BUỘC cài đặt** husky + lint-staged:
```json
// package.json -> lint-staged
{
  "*.{ts,tsx}": [
    "eslint --fix",
    "npm run lint:arch",
    "npm run typecheck"
  ]
}
```

### 24.2 PR Requirements

- Branch phải build thành công (`npm run build`).
- TypeScript compiler phải qua (`tsc --noEmit`).
- eslint boundaries KHÔNG CÓ VI PHẠM.

---

## 25. Feature Flags

### 25.1 Giải quyết vấn đề "Code dở dang"

Khi dev một module lớn (mất 2-3 tuần), dev CẦN phải code và merge lên `main` liên tục (Trunk-based development) để tránh conflict lớn.

Sử dụng Feature Flag environment variables:
```env
NEXT_PUBLIC_ENABLE_MARKETPLACE=false
```

### 25.2 Cách sử dụng trong UI

```tsx
import { env } from '../utils/env'

export function Sidebar() {
  return (
    <nav>
      <Link href="/admin">Admin</Link>
      {/* Tính năng này đã merge code nhưng giấu trên Prod: */}
      {env.NEXT_PUBLIC_ENABLE_MARKETPLACE === 'true' && (
        <Link href="/marketplace">Marketplace</Link>
      )}
    </nav>
  )
}
```

---

## A. Engineering Anti-Patterns

| #   | ❌ CẤM                                   | ✅ ĐÚNG                                |
| --- | ---------------------------------------- | -------------------------------------- |
| 1   | Feature code trong `apps/next/app/`      | Feature trong `packages/app/features/` |
| 2   | Pages Router (`apps/next/pages/`)        | App Router: `apps/next/app/`           |
| 3   | `packages/ui` imports `packages/app`     | UI KHÔNG biết business logic           |
| 4   | API call trong page component            | API call trong custom hook             |
| 5   | Custom button/card trong feature         | Import từ `@vct/ui`                    |
| 6   | `<a>` tags trực tiếp                     | `router.push()` / `onNavigate()`       |
| 7   | `fetch()` + `setState` trong `useEffect` | Custom hook pattern                    |
| 8   | Hardcode text strings                    | `useI18n()` cho tất cả text            |
| 9   | Bỏ qua loading states                    | `VCT_PageSkeleton` / skeleton          |
| 10  | Bỏ qua error handling                    | Error boundary + retry                 |
| 11  | Context API cho complex state            | Zustand stores                         |
| 12  | `if (user.role === 'admin')`             | `can('action')` via RBAC hook          |

---

## B. Pre-Delivery Engineering Checklist

### Code Architecture

- [ ] Components imported từ `@vct/ui`
- [ ] Feature code trong `packages/app/features/`
- [ ] Route page chỉ là thin wrapper
- [ ] No import violations (package boundaries)

### Data & State

- [ ] API calls trong custom hooks
- [ ] Loading + Error + Empty states đầy đủ
- [ ] TypeScript types complete (no `any`)

### i18n

- [ ] i18n keys cho cả `vi` và `en`
- [ ] No hardcoded user-facing text

### Quality

- [ ] ESLint pass (`npm run lint`)
- [ ] TypeScript pass (`npm run typecheck`)
- [ ] Unit tests cho hooks
- [ ] E2E test cho critical flows

---

## C. New Feature Workflow

```
1. Xác định feature module
      ↓
2. Module đã tồn tại? → Thêm page/hook
   Chưa? → Tạo thư mục feature mới trong packages/app/features/
      ↓
3. Tạo Page component: Page_{module}_{subpage}.tsx
      ↓
4. Tạo custom hook (nếu cần API): use{Name}API.ts
      ↓
5. Thêm i18n keys cho vi và en
      ↓
6. Tạo route page: apps/next/app/{route}/page.tsx (thin wrapper)
      ↓
7. Đăng ký sidebar navigation trong route-registry.ts
      ↓
8. Implement loading/error/empty states
      ↓
9. Chạy Visual Checklist (xem ui-architecture-rules.md §B)
      ↓
10. Chạy Engineering Checklist (xem §B trên)
      ↓
11. Test + ESLint + TypeCheck
```

---

## 26. Performance Budgets & Dependencies

*(Kiểm Soát Dung Lượng - Ranh Giới Enterprise Code)*

Quản lý Bundle Size quyết định việc App khởi động ở miền núi mất 2s hay 15s.

### 26.1 Dependency Ban List (Luật "Cấm Mang Đồ Nặng")
| ❌ Thư Viện Bị Cấm (Quá Nặng) | ✅ Giải Pháp Thay Thế (Mỏng, Treeshake) |
| --- | --- |
| `moment.js` | `date-fns` hoặc `dayjs` |
| `lodash` (toàn cục) | `lodash-es` (hoặc import cục bộ `lodash/debounce`) |
| `framer-motion` (full import) | Nhúng file `LazyMotion` (giảm hàng trăm KB) |

### 26.2 Lazy Loading (`next/dynamic`)
- Bắt buộc dùng `const HeavyChart = dynamic(() => import('@vct/ui/Chart'))` đối với mọi thư viện vẽ Biểu Đồ, RichText Editor, PDF Viewer. **CẤM** import tĩnh gây nhồi nhét bundle size toàn cục.

---

## Cross-Reference

| Tài liệu                  | Đường dẫn                                         | Phạm vi                                         |
| ------------------------- | ------------------------------------------------- | ----------------------------------------------- |
| **UI Architecture Rules** | `/docs/architecture/ui-architecture.md`     | Design System: tokens, colors, components, a11y |
| Architecture Guard Rails  | `/docs/architecture/architecture-guard-rails.md`  | Full-stack architecture rules (26 rules)        |
| Route Registry            | `/packages/app/features/layout/route-registry.ts` | All routes & sidebar                            |
| RBAC Matrix               | `/packages/app/features/layout/rbac-matrix.ts`    | Role-action permissions                         |
| Component API             | `/packages/ui/src/index.ts`                       | 59 component exports                            |
