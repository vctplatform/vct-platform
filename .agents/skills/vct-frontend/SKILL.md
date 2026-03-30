---
name: vct-frontend
description: "VCT Platform frontend — Next.js 16, React 19, TailwindCSS 4, Zustand 5, Atomic Design, micro-frontend architecture, domain ownership, i18n, accessibility (WCAG 2.1 AA), and design system."
---

# VCT Frontend — Web Platform Engineering

> Consolidated: frontend + micro-frontend + mfe-domain-owner + ui-ux + accessibility + i18n-manager + web-design-guidelines
> **⚠️ BẮT BUỘC (V5.0 Architecture)**: Sử dụng lệnh `node ai-tools/scripts/ast-parser.js <đường_dẫn_file>` để lấy sơ đồ X-quang của file trước khi dùng `view_file`. Tuyệt đối không đọc mù toàn bộ file code dài.

## 1. Architecture

```
apps/next/app/         # App Router pages (Templates / Pages)
packages/app/features/ # Feature code — shared web+mobile (Organisms + Pages)
packages/ui/src/       # @vct/ui — Atomic component library (Atoms + Molecules)
packages/i18n/         # Locale files & useI18n hook
```

**Reference**: Full architecture in `docs/architecture/frontend-architecture.md`

## 2. Atomic Design System

VCT Platform áp dụng **Atomic Design** (Brad Frost) với 5 tầng mapping vào codebase thực:

```
┌──────────────────────────────────────────────────────────────┐
│  PAGES          apps/next/app/{route}/page.tsx               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ TEMPLATES   packages/app/features/{domain}/Page_*.tsx  │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │ ORGANISMS  Portal*, Dashboard*, Form sections    │  │  │
│  │  │  ┌────────────────────────────────────────────┐  │  │  │
│  │  │  │ MOLECULES  VCT_SearchBar, VCT_StatBlock,  │  │  │  │
│  │  │  │            VCT_ProfileHeader, VCT_Wizard   │  │  │  │
│  │  │  │  ┌──────────────────────────────────────┐  │  │  │  │
│  │  │  │  │ ATOMS  VCT_Avatar, VCT_Checkbox,    │  │  │  │  │
│  │  │  │  │        VCT_Tooltip, VCT_Skeleton     │  │  │  │  │
│  │  │  │  └──────────────────────────────────────┘  │  │  │  │
│  │  │  └────────────────────────────────────────────┘  │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 2.1 Tầng phân loại

| Tầng | Vị trí | Mô tả | Ví dụ thực tế |
|------|--------|-------|----------------|
| **Atoms** | `packages/ui/src/components/` | Primitive UI: nút, input, icon, label. Không chứa business logic. Tái sử dụng 100%. | `VCT_Avatar`, `VCT_Checkbox`, `VCT_Tooltip`, `VCT_Skeleton`, `VCT_Slider` |
| **Molecules** | `packages/ui/src/components/` | Nhóm atoms thành đơn vị chức năng. Có tương tác nhẹ. | `VCT_StatBlock`, `VCT_TagInput`, `VCT_NumberInput`, `VCT_DatePicker`, `VCT_FileUpload` |
| **Organisms** | `packages/app/features/{domain}/` | Nhóm molecules thành section phức tạp. Có logic domain. | `PortalSearchBar`, `PortalWorkspaceCard`, `PortalActivityFeed`, `DashboardStatsGrid` |
| **Templates** | `packages/app/features/{domain}/Page_*.tsx` | Layout skeleton cho feature page. Tổ chức organisms. | `Page_portal_hub`, `Page_dashboard`, `Page_tournament_bracket` |
| **Pages** | `apps/next/app/{route}/page.tsx` | Next.js route entry. Server Component, metadata, SEO. | `app/portal/page.tsx`, `app/dashboard/page.tsx` |

### 2.2 Quy tắc khi tạo/sửa component

1. **Atom KHÔNG ĐƯỢC import Molecule/Organism.** Dependency chỉ chảy xuôi (Atom ← Molecule ← Organism ← Template ← Page).
2. **Atom phải stateless hoặc chỉ UI state.** Business state thuộc về Organism trở lên.
3. **Molecule = 2+ Atoms kết hợp.** VD: `VCT_SearchBar` = `Input` (atom) + `Icon` (atom) + `Button` (atom).
4. **Organism chứa domain logic.** VD: `PortalWorkspaceCard` biết về `WorkspaceCard` type, gọi `useWorkspaceStore`.
5. **Template = layout + composition.** VD: `Page_portal_hub` tổ chức `WelcomeHeader` + `SearchBar` + `Grid` + `ActivityFeed`.
6. **Page = thin route wrapper.** Chỉ có metadata + Suspense + import Template. Tối đa 15 dòng code.

### 2.3 Checklist phân tầng (TRƯỚC khi viết code)

```
□ Component này có chứa business logic không?
  → Không: Atom hoặc Molecule → đặt vào packages/ui/
  → Có: Organism → đặt vào packages/app/features/{domain}/

□ Component này kết hợp bao nhiêu primitive?
  → 1 (đơn lẻ): Atom
  → 2-5 (nhóm nhỏ): Molecule
  → 6+ (section phức tạp): Organism

□ Component này có gọi API, store, hoặc auth không?
  → Có: Organism trở lên (TUYỆT ĐỐI KHÔNG ở Atom/Molecule)
  → Không: Atom/Molecule

□ Component có thể dùng ở nhiều domain không?
  → Có: packages/ui/ (Atom/Molecule)
  → Không, chỉ dùng trong 1 domain: packages/app/features/{domain}/
```

## 3. Code Conventions

- **Router**: App Router `app/{route}/page.tsx` (NOT `pages/`)
- **Components**: `VCT_` prefix from `@vct/ui` (Atoms + Molecules)
- **State**: Zustand 5 stores in `packages/app/features/{feature}/store.ts`
- **Validation**: Zod 4 schemas
- **i18n**: All text via `useI18n()` → `t('key')` — NO hardcoded strings
- **Styling**: CSS variable tokens `--vct-*`, no Tailwind `dark:` modifier
- **Loading**: Skeleton components for all async data
- **Errors**: Error boundaries for critical sections

## 4. Micro-Frontend Domains

| Domain | Routes | Owner Focus |
|--------|--------|-------------|
| D1: Tournament | `/tournament/*`, `/referee-scoring/*`, `/scoreboard/*`, `/calendar/*`, `/rankings/*` | Competition flows |
| D2: Athlete | `/athlete-portal/*`, `/people/*`, `/training/*`, `/parent/*` | Athlete lifecycle |
| D3: Organization | `/federation/*`, `/provincial/*`, `/club/*`, `/organizations/*` | Org management |
| D4: Admin | `/admin/*`, `/settings/*`, reporting | Admin tools |
| D5: Finance | `/finance/*`, `/marketplace/*`, notifications | Financial flows |
| D6: Heritage | `/heritage/*`, `/community/*`, `/public/*` | Cultural content |
| D7: Platform | Shell, auth, theme, i18n, shared hooks, dashboard | Core infrastructure |

**Cross-Domain**: Define contracts via `shared-types` before implementation.

## 5. Design System (`@vct/ui`)

- **Reference**: `docs/architecture/ui-architecture.md` for design tokens, component catalog, theming
- 56+ components organized by Atomic tiers
- Dark/light theme via CSS variables `--vct-*`
- Animation: subtle micro-interactions, no janky transitions

**Component Classification** (current `packages/ui/src/components/`):

| Tier | Components |
|------|-----------|
| **Atoms** | `VCT_Avatar`, `VCT_Checkbox`, `VCT_Tooltip`, `VCT_Skeleton`, `VCT_Slider`, `VCT_Image`, `VCT_CopyToClipboard`, `VCT_RadioGroup`, `VCT_Textarea`, `VCT_EmptyState`, `VCT_PageTransition`, `vct-icons` |
| **Molecules** | `VCT_StatBlock`, `VCT_StatRow`, `VCT_InfoGrid`, `VCT_ListItem`, `VCT_TagInput`, `VCT_NumberInput`, `VCT_DatePicker`, `VCT_FileUpload`, `VCT_Dropdown`, `VCT_Popover`, `VCT_QRCode`, `VCT_NotificationBell` |
| **Organisms** | `VCT_DataGrid`, `VCT_Calendar`, `VCT_RichTextEditor`, `VCT_Wizard`, `VCT_ImageGallery`, `VCT_CommentThread`, `VCT_Timeline`, `VCT_ShortcutsPanel`, `NotificationCenter`, `VCT_DigitalSignature`, `VCT_QRScanner` |
| **Layout** | `VCT_PageContainer`, `VCT_PageHeader`, `VCT_PageToolbar`, `VCT_SectionCard`, `vct-ui-layout`, `VCT_Accordion`, `VCT_Drawer`, `VCT_Sheet` |
| **Composite** | `vct-ui-form` (form primitives), `vct-ui-data-display`, `vct-ui-feedback`, `vct-ui-navigation`, `vct-ui-overlay`, `vct-page-templates`, `vct-charts` |

## 6. Accessibility (WCAG 2.1 AA)

- ARIA labels on all interactive elements
- Keyboard navigation (Tab, Enter, Escape, Arrow keys)
- Color contrast ratio ≥ 4.5:1 (text), ≥ 3:1 (large text)
- Focus management: visible focus ring, logical tab order
- Screen reader: `aria-live` for dynamic updates
- Testing: axe-core automated checks

## 7. i18n Management

- Default: Vietnamese (`vi`) + English (`en`)
- Locale files: `packages/i18n/locales/{lang}.json`
- Number/date/currency: `Intl` API with locale-aware formatting
- RTL: prepared but not active
- Audit: no hardcoded strings, all keys in locale files

## 8. Data Analytics & Telemetry (Tracking)

- **Implementation Responsibility**: Frontend is responsible for integrating all client-side UI tracking tools (Google Analytics, Mixpanel, Meta Pixel, etc.).
- **Event Tracking**: Implement tracking hooks/services (`useTracking`) to capture User Actions without polluting business logic.
- **Micro-Frontend Alignment**: Each MF Domain must expose standardized tracking events to the shell application.
