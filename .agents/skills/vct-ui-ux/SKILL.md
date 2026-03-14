---
name: vct-ui-ux
description: VCT Platform UI/UX master skill — design tokens, component catalog, persona maps, user research, theming, accessibility (WCAG 2.1 AA), responsive layout, animation standards, and pre-delivery visual quality checklist.
---

# VCT Platform UI/UX Design System

> **When to activate**: Any task involving UI design, styling, component creation, theming, layout, visual polish, user research, wireframes, usability audit, or accessibility review.

---

## 1. Design Philosophy

VCT Platform is a **sports management system** for Vietnamese Traditional Martial Arts (Võ Cổ Truyền). The design must feel:

- **Professional & Authoritative** — National federation platform, not a consumer app
- **Dark-first with Light support** — Both modes MUST use design tokens, never hardcoded colors
- **Information-dense but clean** — Dashboards, data tables, forms are the primary UI patterns
- **Culturally respectful** — Honor Vietnamese martial arts heritage through subtle design cues
- **Premium feel** — NEVER ship a "basic/simple" UI

---

## 2. User Personas (from UX Research)

| Persona | Role | Tech Level | Primary Device | Key Need |
|---|---|---|---|---|
| Chủ tịch LĐ | Federation President | Medium | Desktop | Executive oversight |
| Quản lý tỉnh | Provincial Manager | Medium | Desktop + Mobile | Province management |
| Chủ CLB | Club Owner | Low-Medium | Mobile | Club operations |
| HLV | Coach | Medium | Tablet + Mobile | Training management |
| VĐV | Athlete | High | Mobile | Competition & progress |
| Trọng tài | Referee | Medium | Tablet | Real-time scoring |
| Phụ huynh | Parent | Low-Medium | Mobile | Child's progress |

---

## 3. CSS Design Tokens (Mandatory)

All styling MUST use VCT CSS custom properties. **NEVER hardcode colors.**

### Background Tokens
```css
var(--vct-bg)                  /* Page background */
var(--vct-bg-elevated)         /* Cards, panels */
var(--vct-bg-glass)            /* Glass effect overlay */
var(--vct-bg-glass-heavy)      /* Sidebar, heavy glass */
```

### Text Tokens
```css
var(--vct-text)                /* Primary text */
var(--vct-text-secondary)      /* Secondary/muted text */
var(--vct-text-muted)          /* Labels, captions */
```

### Border & Input Tokens
```css
var(--vct-border)              /* All borders */
var(--vct-input)               /* Input backgrounds */
```

### Accent Colors
```css
var(--vct-accent)              /* Primary accent — sky blue (#0ea5e9) */
```

### Tailwind Utility Classes (mapped to tokens)
```
bg-vct-bg, bg-vct-elevated, bg-vct-input, bg-vct-accent
text-vct-text, text-vct-text-muted, text-vct-text-secondary
border-vct-border
```

### Theme System
- Toggle via `document.documentElement.classList.add('dark')`
- `ThemeProvider` at `packages/app/features/theme/ThemeProvider.tsx`
- `useTheme()` hook: `{ theme, toggleTheme }`
- Stored in `localStorage` key: `vct-theme`
- Light mode: `--bg: #ffffff; --surface: #f8fafc; --text: #0f172a;`
- Dark mode: `--bg: #0f172a; --surface: #1e293b; --text: #f8fafc;`

---

## 4. Component Library (`@vct/ui`)

All reusable components live in `packages/app/features/components/` and are exported from `packages/ui/src/index.ts`.

### Naming Convention
- All components: `VCT_ComponentName` (e.g., `VCT_Button`, `VCT_Card`, `VCT_Modal`)

### Key Components
| Component | Usage |
|-----------|-------|
| `VCT_Card` | Container with elevation |
| `VCT_Button` / `VCT_IconButton` | Primary/icon actions |
| `VCT_Input` / `VCT_Select` / `VCT_Textarea` | Form elements |
| `VCT_Modal` / `VCT_Drawer` / `VCT_Sheet` | Overlays/side panels |
| `VCT_Badge` / `VCT_Tooltip` | Status indicators / hover info |
| `VCT_Tabs` / `VCT_Dropdown` | Tab nav / context menus |
| `VCT_DataGrid` / `VCT_ResponsiveTable` | Data display |
| `VCT_DatePicker` / `VCT_Calendar` | Date/time selection |
| `VCT_Wizard` / `VCT_FileUpload` | Multi-step forms / uploads |
| `VCT_Timeline` / `VCT_StatBlock` / `VCT_InfoGrid` | Info display |
| `VCT_PageSkeleton` | Loading skeleton |
| `VCT_CommandPalette` | Keyboard-driven command |
| `VCT_QRCode` / `VCT_QRScanner` | QR functionality |

### VCT_Drawer (Admin Detail Panel)
```tsx
// Used extensively in admin pages for detail panels
<VCT_Drawer
  open={!!selectedItem}
  onClose={() => setSelectedItem(null)}
  title={selectedItem?.name}
  width="480px"  // Default width for detail panels
>
  {/* Header with avatar/icon */}
  <VCT_InfoGrid data={infoFields} />
  
  {/* Activity timeline */}
  <VCT_Timeline events={activityLog} />
  
  {/* Action buttons */}
  <div className="drawer-actions">
    <VCT_Button variant="primary">{t('actions.edit')}</VCT_Button>
    <VCT_Button variant="danger">{t('actions.delete')}</VCT_Button>
  </div>
</VCT_Drawer>
```

### Admin Page Design Pattern
```
Admin pages follow Table + Drawer pattern:
1. Page header: title, description, search bar, action buttons
2. Stats row: 3-4 VCT_StatBlock cards showing key metrics
3. Data table: sortable columns, row click → opens Drawer
4. Drawer: detail panel with InfoGrid, Timeline, action buttons
5. Pagination: usePagination hook for client-side paging
```

### Chart Components
| Component | Usage |
|-----------|-------|
| `VCT_BarChart` / `VCT_HorizontalBarChart` | Bar charts |
| `VCT_DonutChart` | Pie/donut charts |
| `VCT_StatCard` | Stat with sparkline |
| `VCT_ChartProgressBar` | Progress indicators |

### Icons
```tsx
import { VCT_Icons } from '../components/vct-icons'
// Usage: <VCT_Icons.Users size={18} />
```
- **NEVER** import icons directly from `lucide-react`
- Always use `VCT_Icons.IconName`

---

## 5. Layout Architecture

### AppShell Pattern
```
┌─────────────────────────────────────────────────┐
│ Header (role label, search, theme toggle, user) │
├──────────┬──────────────────────────────────────┤
│ Sidebar  │  Main Content Area                   │
│ (nav)    │  ┌──────────────────────────────────┐ │
│          │  │ PageHeader                       │ │
│          │  │ Content                          │ │
│          │  └──────────────────────────────────┘ │
├──────────┴──────────────────────────────────────┤
│ Mobile: Bottom Tab Bar                          │
└─────────────────────────────────────────────────┘
```

### Responsive Breakpoints
| Breakpoint | Width | Target | Sidebar |
|---|---|---|---|
| Mobile | < 640px | Phone (VĐV, Phụ huynh) | Hidden, hamburger |
| Tablet | 640–1024px | Tablet (Trọng tài scoring) | Collapsed (88px) |
| Desktop | > 1024px | Admin dashboards | Full (272px) |

---

## 6. Page Pattern

```tsx
'use client'
import { VCT_Card } from '@vct/ui'
import { VCT_Icons } from '../components/vct-icons'
import { useI18n } from '../i18n'
import { useTheme } from '../theme/ThemeProvider'

export function Page_feature_name() {
  const { t } = useI18n()
  const { theme } = useTheme()

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 className="text-2xl font-bold text-vct-text">{t('feature.title')}</h1>
      <p className="text-vct-text-muted">{t('feature.subtitle')}</p>
      <VCT_Card>{/* Content */}</VCT_Card>
    </div>
  )
}
```

### File Naming
- Pages: `Page_module_submodule.tsx`
- Components: `VCT_ComponentName.tsx`
- Feature dirs: `packages/app/features/{module}/`

---

## 7. Animation Standards

Using `framer-motion`:
```tsx
transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
initial={{ opacity: 0, y: 8 }}
animate={{ opacity: 1, y: 0 }}
```
- Max transition: 300ms for UI elements
- Always respect `prefers-reduced-motion`
- Sidebar collapse/expand: 220ms ease-out

---

## 8. Pre-Delivery Visual Quality Checklist

### Visual Quality
- [ ] No emojis used as icons (use SVG/VCT_Icons instead)
- [ ] All icons from `VCT_Icons` (wraps Lucide)
- [ ] Hover states don't cause layout shift
- [ ] Use theme tokens (never hardcode colors)

### Interaction
- [ ] All clickable elements have `cursor-pointer`
- [ ] Hover states provide clear visual feedback
- [ ] Transitions are smooth (150–300ms)
- [ ] Focus states visible for keyboard navigation

### Light/Dark Mode
- [ ] Light mode: text contrast ≥ 4.5:1
- [ ] Glass/transparent elements visible in both modes
- [ ] Borders visible in both modes
- [ ] Test BOTH modes before delivery

### Layout
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile
- [ ] No content hidden behind fixed elements

### Accessibility (WCAG 2.1 AA)
- [ ] All interactive elements keyboard-navigable
- [ ] Images have alt text
- [ ] Form fields have labels (not just placeholders)
- [ ] Touch targets ≥ 44px on mobile
- [ ] Skip-to-content link present
- [ ] `aria-current="page"` on active nav items

---

## 9. Anti-Patterns (NEVER Do These)

1. ❌ **NEVER** hardcode colors — use `var(--vct-*)` tokens
2. ❌ **NEVER** import icons from `lucide-react` — use `VCT_Icons`
3. ❌ **NEVER** use inline `color: '#fff'` — use token classes
4. ❌ **NEVER** create components without `VCT_` prefix
5. ❌ **NEVER** use `dark:` Tailwind modifier — use CSS vars
6. ❌ **NEVER** skip `useI18n()` for user-facing text
7. ❌ **NEVER** use `<a>` tags directly — use `onNavigate()`
8. ❌ **NEVER** make the design look "simple/basic"

---

## 10. Cross-Reference to Other Roles

| Situation | Consult |
|---|---|
| Component doesn't exist | → **Tech Lead** for implementation |
| Business flow unclear | → **BA** for requirements |
| Feature priority | → **PO** for backlog order |
| Implementation feasibility | → **SA** for architecture constraints |
