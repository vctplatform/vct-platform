# VCT Platform — UI Architecture Rules (Design System)

> **Vai trò**: Quy chuẩn HỆ THỐNG THIẾT KẾ — mọi thứ liên quan đến **GIAO DIỆN NHÌN THẤY** (visual).
>
> **Phạm vi**: Design tokens, colors, typography, component catalog, theme, animation, icons, responsive, accessibility, visual checklist.
>
> **Không thuộc phạm vi**: Monorepo structure, routing, state management, API, testing → xem [`FRONTEND_RULES.md`](file:///d:/VCT%20PLATFORM/vct-platform/FRONTEND_RULES.md)

---

## MỤC LỤC

| #   | Phần                                                              | Mục đích                       |
| --- | ----------------------------------------------------------------- | ------------------------------ |
| 1   | [Design Philosophy](#1-design-philosophy)                         | Tinh thần thiết kế             |
| 2   | [User Personas](#2-user-personas)                                 | Đối tượng sử dụng              |
| 3   | [Design Token System](#3-design-token-system)                     | CSS Custom Properties          |
| 4   | [Theme System](#4-theme-system)                                   | Dark/Light mode                |
| 5   | [Color System](#5-color-system)                                   | Semantic colors, status colors |
| 6   | [Typography](#6-typography)                                       | Font scale, font family        |
| 7   | [Spacing & Layout Tokens](#7-spacing--layout-tokens)              | Spacing, radius, z-index       |
| 8   | [Shadow & Effects](#8-shadow--effects)                            | Shadows, glass, glow           |
| 9   | [Icon System](#9-icon-system)                                     | VCT_Icons                      |
| 10  | [Component Library](#10-component-library-vctui)                  | 59 VCT\_\* components          |
| 11  | [Animation & Motion](#11-animation--motion)                       | Framer Motion, CSS transitions |
| 12  | [Responsive Design](#12-responsive-design)                        | Breakpoints, grid              |
| 13  | [Accessibility](#13-accessibility-wcag-21-aa)                     | WCAG 2.1 AA                    |
| 14  | [Overlays Decision Guide](#14-overlays-decision-guide)            | Modal vs Drawer vs Popover     |
| 15  | [Loading & Empty States UX](#15-loading--empty-states-ux)         | Skeletons, empty illustrations |
| 16  | [Critical Operations UX](#16-critical-operations-ux)              | Destructive actions, hard delete |
| 17  | [CSS Architecture](#17-css-architecture)                          | Tailwind 4, naming             |
| 18  | [CSS Utility Classes](#18-css-utility-classes)                    | vct-glass, vct-card-hover...   |
| 19  | [Print Media UX](#19-print-media-ux)                              | @media print utilities         |
| A   | [Visual Anti-Patterns](#a-visual-anti-patterns)                   | Lỗi thiết kế bị cấm            |
| B   | [Pre-Delivery Visual Checklist](#b-pre-delivery-visual-checklist) | Quality gate trước merge       |

---

## 1. Design Philosophy

VCT Platform là hệ thống quản lý thể thao cho **Liên đoàn Võ Cổ Truyền Việt Nam**. Thiết kế phải:

| #   | Nguyên tắc                       | Giải thích                                          |
| --- | -------------------------------- | --------------------------------------------------- |
| 1   | **Professional & Authoritative** | Nền tảng cấp quốc gia, không phải consumer app      |
| 2   | **Dark-first, Light-supported**  | Cả 2 mode PHẢI dùng design tokens                   |
| 3   | **Information-dense but clean**  | Dashboards, data tables, forms là UI patterns chính |
| 4   | **Culturally respectful**        | Tôn trọng di sản Võ thuật                           |
| 5   | **Premium feel**                 | ❌ TUYỆT ĐỐI CẤM ship UI "basic/simple"             |
| 6   | **Vietnamese-first**             | UI, thuật ngữ, tiền tệ mặc định tiếng Việt          |

---

## 2. User Personas

| Persona      | Vai trò              | Tech Level | Device chính     | Nhu cầu             |
| ------------ | -------------------- | ---------- | ---------------- | ------------------- |
| Chủ tịch LĐ  | Federation President | Medium     | Desktop          | Tổng quan điều hành |
| Quản lý tỉnh | Provincial Manager   | Medium     | Desktop + Mobile | Quản lý tỉnh/thành  |
| Chủ CLB      | Club Owner           | Low-Medium | Mobile           | Vận hành câu lạc bộ |
| HLV          | Coach                | Medium     | Tablet + Mobile  | Quản lý tập luyện   |
| VĐV          | Athlete              | High       | Mobile           | Thi đấu & tiến độ   |
| Trọng tài    | Referee              | Medium     | Tablet           | Chấm điểm real-time |
| Phụ huynh    | Parent               | Low-Medium | Mobile           | Theo dõi con em     |

---

## 3. Design Token System

### Nguồn định nghĩa

| File                                           | Import           | Vai trò                                      |
| ---------------------------------------------- | ---------------- | -------------------------------------------- |
| `apps/next/app/globals.css`                    | CSS variables    | **Primary source** — `:root` và `:root.dark` |
| `packages/ui/src/tokens.ts`                    | `@vct/ui/tokens` | JS/TS token cho component library            |
| `packages/app/features/theme/design-tokens.ts` | App-level        | Mở rộng (belt colors, đai...)                |

### 3.1 Surface (Background) Tokens

```css
var(--vct-bg-base)           /* Nền trang (page background) */
var(--vct-bg-elevated)       /* Cards, panels, modal */
var(--vct-bg-glass)          /* Glass overlay */
var(--vct-bg-glass-heavy)    /* Sidebar, heavy glass */
var(--vct-bg-input)          /* Input backgrounds */
var(--vct-bg-card)           /* Card backgrounds */
var(--vct-bg-hover)          /* Hover states */
```

### 3.2 Text Tokens

```css
var(--vct-text-primary)      /* Text chính */
var(--vct-text-secondary)    /* Text phụ, mô tả */
var(--vct-text-tertiary)     /* Labels, captions, muted */
var(--vct-text-on-accent)    /* Text trên nền accent */
```

### 3.3 Border Tokens

```css
var(--vct-border-subtle)     /* Viền mặc định */
var(--vct-border-strong)     /* Viền nhấn mạnh */
```

### 3.4 Accent Tokens

```css
var(--vct-accent-cyan)       /* Accent chính (sky blue) */
var(--vct-accent-gradient)   /* Gradient 135deg */
```

### 3.5 Tailwind Utility Mapping

```
bg-vct-base, bg-vct-elevated, bg-vct-glass, bg-vct-card, bg-vct-input, bg-vct-hover
text-vct-text, text-vct-secondary, text-vct-tertiary, text-vct-on-accent
border-vct-border, border-vct-strong
```

---

## 4. Theme System

### Cơ chế hoạt động

```
ThemeProvider (Context API)
    ↓
localStorage('vct-theme') ←→ :root / :root.dark (CSS)
    ↓
document.documentElement.classList.toggle('dark')
```

- **Provider**: `packages/app/features/theme/ThemeProvider.tsx`
- **Hook**: `useTheme()` → `{ theme, toggleTheme }`
- **Default**: Theo OS preference (`prefers-color-scheme: dark`)

### Theme Rules

| #   | Rule                                                                              |
| --- | --------------------------------------------------------------------------------- |
| T1  | ❌ **TUYỆT ĐỐI CẤM** dùng Tailwind `dark:` modifier — CSS variables tự chuyển đổi |
| T2  | ❌ **CẤM** hardcode: `color: '#fff'`, `background: '#0f172a'`                     |
| T3  | ✅ **LUÔN** dùng token: `text-vct-text`, `bg-vct-elevated`, `border-vct-border`   |
| T4  | ✅ **LUÔN** test cả 2 modes trước delivery                                        |

---

## 5. Color System

### 5.1 Semantic Colors

```css
var(--vct-success)           /* Green — thành công */
var(--vct-success-muted)     /* Green muted background */
var(--vct-danger)            /* Red — lỗi, xóa */
var(--vct-danger-muted)      /* Red muted background */
var(--vct-warning)           /* Amber — cảnh báo */
var(--vct-warning-muted)     /* Amber muted background */
var(--vct-info)              /* Blue — thông tin */
var(--vct-info-muted)        /* Blue muted background */
var(--vct-gold)              /* Gold — huy chương, premium */
var(--vct-gold-muted)        /* Gold muted background */
```

### 5.2 Status Badge Colors

| Status          | Token      | Vietnamese           | Sử dụng             |
| --------------- | ---------- | -------------------- | ------------------- |
| Active/Approved | `success`  | Hoạt động / Đã duyệt | VĐV, CLB, tài khoản |
| Pending         | `warning`  | Chờ duyệt            | Đăng ký, yêu cầu    |
| Rejected        | `danger`   | Từ chối              | Hồ sơ bị từ chối    |
| Draft           | `tertiary` | Bản nháp             | Chưa gửi            |
| Locked          | `info`     | Đã khóa              | Tài khoản bị khóa   |
| Champion        | `gold`     | Vô địch              | Kết quả thi đấu     |
| Suspended       | `danger`   | Đình chỉ             | Vi phạm, kỷ luật    |

### 5.3 Gradient Tokens

```css
var(--vct-accent-gradient)   /* Accent gradient (135deg cyan→indigo) */
var(--vct-gradient-warm)     /* Warm gradient (red→amber) */
var(--vct-gradient-gold)     /* Gold gradient (3 stops) */
var(--vct-gradient-sport)    /* Sport gradient (red→green) */
var(--vct-gradient-glass)    /* Glass gradient (subtle white) */
```

### 5.4 Categorical Colors (Data Viz)

Dành riêng cho các thành phần biểu đồ (`VCT_DonutChart`, `VCT_BarChart`) để tránh trùng màu với semantic status (chỉ mang ý nghĩa thành công/thất bại).

```css
var(--vct-chart-1)           /* Teal / Blue-green */
var(--vct-chart-2)           /* Purple / Violet */
var(--vct-chart-3)           /* Orange / Coral */
var(--vct-chart-4)           /* Pink / Rose */
var(--vct-chart-5)           /* Yellow / Amber-light */
```
**Rule C3**: ❌ TUYỆT ĐỐI CẤM dùng màu `danger` (Đỏ) cho 1 item trong biểu đồ tròn chỉ vì nó đẹp, màu `danger` chỉ dùng cho số liệu Xấu/Lỗi.

---

## 6. Typography

### 6.1 Font Family

```css
font-family: 'Be Vietnam Pro', 'Inter', system-ui, sans-serif;
```

### 6.2 Font Scale

| Token             | Size | Line Height | Sử dụng                |
| ----------------- | ---- | ----------- | ---------------------- |
| `--vct-font-xs`   | 11px | 16px        | Badges, micro-labels   |
| `--vct-font-sm`   | 13px | 20px        | Table cells, captions  |
| `--vct-font-base` | 14px | 22px        | Body text, form fields |
| `--vct-font-md`   | 16px | 24px        | Card titles            |
| `--vct-font-lg`   | 18px | 28px        | Section headers        |
| `--vct-font-xl`   | 22px | 32px        | Page subtitles         |
| `--vct-font-2xl`  | 26px | 36px        | Page titles            |
| `--vct-font-3xl`  | 32px | 40px        | Hero headers, KPIs     |

### 6.3 Font Weight

| Weight         | Sử dụng                      |
| -------------- | ---------------------------- |
| 400 (Regular)  | Body text, descriptions      |
| 500 (Medium)   | Labels, table headers        |
| 600 (Semibold) | Card titles, section headers |
| 700 (Bold)     | Page titles, KPI numbers     |

---

## 7. Spacing & Layout Tokens

### 7.1 Spacing Scale (4px base unit)

```css
var(--vct-space-0)   /* 0px */     var(--vct-space-1)   /* 4px */
var(--vct-space-2)   /* 8px */     var(--vct-space-3)   /* 12px */
var(--vct-space-4)   /* 16px */    var(--vct-space-5)   /* 20px */
var(--vct-space-6)   /* 24px */    var(--vct-space-8)   /* 32px */
var(--vct-space-10)  /* 40px */    var(--vct-space-12)  /* 48px */
var(--vct-space-16)  /* 64px */
```

### 7.2 Border Radius

```css
var(--vct-radius-sm)    /* 8px  — badges, tags, inputs */
var(--vct-radius-md)    /* 12px — buttons, cards */
var(--vct-radius-lg)    /* 16px — panels, modals */
var(--vct-radius-xl)    /* 20px — large containers */
var(--vct-radius-2xl)   /* 24px — hero sections */
var(--vct-radius-full)  /* 9999px — avatars, pills */
```

### 7.3 Z-Index Scale

| Token              | Value | Sử dụng                  |
| ------------------ | ----- | ------------------------ |
| `--vct-z-dropdown` | 100   | Dropdown menus, popovers |
| `--vct-z-sticky`   | 200   | Sticky headers, toolbars |
| `--vct-z-drawer`   | 300   | Side drawers, sheets     |
| `--vct-z-modal`    | 400   | Modal dialogs            |
| `--vct-z-toast`    | 500   | Toast notifications      |
| `--vct-z-tooltip`  | 600   | Tooltips (always on top) |

---

## 8. Shadow & Effects

### 8.1 Shadow Scale

```css
var(--vct-shadow-xs)    /* 0 1px 2px — subtle depth */
var(--vct-shadow-sm)    /* 0 2px 4px — cards */
var(--vct-shadow-md)    /* 0 4px 8px — elevated elements */
var(--vct-shadow-lg)    /* 0 8px 16px — modals, drawers */
var(--vct-shadow-xl)    /* 0 16px 32px — floating panels */
var(--vct-shadow-glow)  /* 0 0 20px accent — accent glow */
```

### 8.2 Glassmorphism

```css
var(--vct-glass-blur)       /* blur(16px) */
var(--vct-glass-saturate)   /* saturate(180%) */
var(--vct-shadow-glow-strong) /* Stronger accent glow */

.vct-glass {
  background: var(--vct-bg-glass);
  backdrop-filter: var(--vct-glass-blur);
  -webkit-backdrop-filter: var(--vct-glass-blur);
}
```

---

## 9. Icon System

### Quy tắc

```tsx
// ✅ ĐÚNG — Luôn dùng VCT_Icons
import { VCT_Icons } from '../components/vct-icons'
<VCT_Icons.Users size={18} />
<VCT_Icons.Search size={16} />

// ❌ CẤM — Không import trực tiếp
import { Search } from 'lucide-react'
```

| #   | Rule                                                                         |
| --- | ---------------------------------------------------------------------------- |
| I1  | ✅ Luôn import từ `VCT_Icons` (wraps Lucide)                                 |
| I2  | ❌ KHÔNG import trực tiếp từ `lucide-react`                                  |
| I3  | ❌ KHÔNG dùng emoji thay icon                                                |
| I4  | ✅ Size chuẩn: `14` (inline), `16` (button), `18` (navigation), `20`+ (hero) |

---

## 10. Component Library (@vct/ui)

### Overview

- **59 components** trong `packages/ui/src/components/`
- **Export**: `packages/ui/src/index.ts`
- **Import**: `import { VCT_Card, VCT_Button } from '@vct/ui'`
- **Prefix**: TẤT CẢ **PHẢI** có prefix `VCT_`

### 10.1 Layout & Container

| Component            | Mô tả                                     |
| -------------------- | ----------------------------------------- |
| `VCT_PageContainer`  | Page content wrapper với padding chuẩn    |
| `VCT_PageHeader`     | Title + subtitle + action buttons         |
| `VCT_PageToolbar`    | Toolbar dưới header (filters, search)     |
| `VCT_PageTransition` | Animated page transitions (framer-motion) |
| `VCT_SectionCard`    | Section grouping card                     |
| `VCT_Card`           | Base card component                       |

### 10.2 Data Display

| Component                           | Mô tả                                              |
| ----------------------------------- | -------------------------------------------------- |
| `VCT_DataGrid`                      | Advanced data grid (sort, filter, paginate) — 18KB |
| `VCT_ResponsiveTable`               | Mobile-responsive table                            |
| `VCT_InfoGrid`                      | Key-value info display                             |
| `VCT_Timeline`                      | Event timeline vertical                            |
| `VCT_StatBlock`                     | Stat card với icon                                 |
| `VCT_StatRow`                       | Inline stat display                                |
| `VCT_ListItem`                      | List item với icon                                 |
| `VCT_ProfileHeader`                 | Profile card header                                |
| `VCT_Avatar`                        | User avatar (fallback initials)                    |
| `VCT_Badge`                         | Status badge với semantic colors                   |
| `VCT_EmptyState`                    | Empty data illustration                            |
| `VCT_Skeleton` / `VCT_PageSkeleton` | Loading skeleton shimmer                           |
| `VCT_Image`                         | Optimized image (next/image)                       |
| `VCT_ImageGallery`                  | Image gallery viewer                               |

### 10.3 Charts

| Component                | Mô tả                    |
| ------------------------ | ------------------------ |
| `VCT_BarChart`           | Vertical bar chart       |
| `VCT_HorizontalBarChart` | Horizontal bar chart     |
| `VCT_DonutChart`         | Pie/donut chart          |
| `VCT_StatCard`           | Stat card with sparkline |
| `VCT_ChartProgressBar`   | Progress bar chart       |

### 10.4 Form Elements

| Component              | Mô tả                           |
| ---------------------- | ------------------------------- |
| `VCT_Input`            | Text input                      |
| `VCT_NumberInput`      | Number input with stepper       |
| `VCT_Select`           | Select dropdown                 |
| `VCT_Textarea`         | Multi-line text                 |
| `VCT_Checkbox`         | Checkbox with label             |
| `VCT_RadioGroup`       | Radio button group              |
| `VCT_Slider`           | Range slider                    |
| `VCT_TagInput`         | Tag/chip input                  |
| `VCT_DatePicker`       | Date picker                     |
| `VCT_AddressSelect`    | Province/District/Ward selector |
| `VCT_FileUpload`       | File upload area                |
| `VCT_RichTextEditor`   | Rich text editor                |
| `VCT_DigitalSignature` | Digital signature pad           |

### 10.5 Overlays & Panels

| Component            | Mô tả                      |
| -------------------- | -------------------------- |
| `VCT_Modal`          | Modal dialog               |
| `VCT_Drawer`         | Side panel (480px default) |
| `VCT_Sheet`          | Bottom sheet (mobile)      |
| `VCT_Popover`        | Popover content            |
| `VCT_Tooltip`        | Hover tooltip              |
| `VCT_CommandPalette` | ⌘K search command palette  |
| `VCT_ShortcutsPanel` | Keyboard shortcuts panel   |

### 10.6 Navigation

| Component       | Mô tả                 |
| --------------- | --------------------- |
| `VCT_Tabs`      | Tab navigation        |
| `VCT_Dropdown`  | Context menu dropdown |
| `VCT_Accordion` | Collapsible accordion |
| `VCT_Calendar`  | Calendar widget       |

### 10.7 Feedback & Interactive

| Component              | Mô tả                           |
| ---------------------- | ------------------------------- |
| `VCT_NotificationBell` | Notification icon + badge count |
| `NotificationCenter`   | Full notification panel         |
| `VCT_CopyToClipboard`  | Copy button                     |
| `VCT_CommentThread`    | Discussion thread               |

### 10.8 Special

| Component       | Mô tả                    |
| --------------- | ------------------------ |
| `VCT_Wizard`    | Multi-step wizard        |
| `VCT_QRCode`    | QR code generator        |
| `VCT_QRScanner` | QR code scanner (camera) |

### Component Rules

| #   | Rule                                                                              |
| --- | --------------------------------------------------------------------------------- |
| C1  | ✅ Import từ `@vct/ui` — KHÔNG import trực tiếp file                              |
| C2  | ✅ Tất cả component dùng prefix `VCT_`                                            |
| C3  | ❌ Component KHÔNG chứa business logic — chỉ nhận data qua props                  |
| C4  | ✅ Component PHẢI support dark/light qua CSS tokens                               |
| C5  | ✅ Component PHẢI có TypeScript types đầy đủ                                      |
| C6  | ✅ Component mới → tạo trong `packages/ui/src/components/`, export qua `index.ts` |

---

## 11. Animation & Motion

### 11.1 Framer Motion Defaults

```tsx
// Page transition
<motion.div
  key={pathname}
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -8 }}
  transition={{ duration: 0.2 }}
/>
```

### 11.2 Duration Limits

| Element                            | Max Duration  | Easing                          |
| ---------------------------------- | ------------- | ------------------------------- |
| Micro-interactions (hover, toggle) | 150ms         | `ease-out`                      |
| UI transitions (expand, slide)     | 250ms         | `var(--vct-ease-out)`           |
| Page transitions                   | 200ms         | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Complex animations                 | **400ms max** | `var(--vct-ease-spring)`        |
| Sidebar collapse                   | 220ms         | `ease-out`                      |

### 11.3 Easing Tokens

```css
var(--vct-ease-out)    /* cubic-bezier(0.16, 1, 0.3, 1) — standard */
var(--vct-ease-spring) /* cubic-bezier(0.34, 1.56, 0.64, 1) — bouncy */
var(--vct-duration-fast)   /* 150ms */
var(--vct-duration-normal) /* 250ms */
var(--vct-duration-slow)   /* 400ms */
```

### 11.4 Rules

| #   | Rule                                           |
| --- | ---------------------------------------------- |
| M1  | ❌ KHÔNG animation > 400ms                     |
| M2  | ✅ Respect `prefers-reduced-motion`            |
| M3  | ❌ KHÔNG animation gây layout shift            |
| M4  | ✅ Hover → `translateY(-2px)` + shadow (cards) |
| M5  | ✅ Press → `scale(0.98)` (buttons)             |

### 11.5 Physical Feedback (Haptics & Sound)

*(Đặc thù Web/App Thể Thao: Chấm điểm đối kháng, bấm giờ)*

**Phản hồi vật lý** là bắt buộc trên Bàn Trọng Tài (Referee Dashboard):
1. ✅ **Haptic Feedback (Mobile/Tablet)**: Mọi thao tác cộng/trừ điểm đều phải trigger `Haptics.impactAsync` (Expo Haptics) để giám định viên biết đã chạm trúng mà không cần nhìn màn hình.
2. ✅ **Sound UI (Web/Tablet)**: Bắt buộc cấu hình Audio Context để phát âm thanh:
   - *Time up* (Tiếng cồng/chuông hết giờ trận đấu).
   - *Action success* (Tiếng bíp nhẹ khi xác nhận submit điểm thành công).
   - *Error* (Tiếng tít lỗi khi vi phạm rules nhập điểm vi phạm/knock-out).
3. ❌ **CẤM** spam âm thanh ở các màn hình quản trị thông thường (CRUD trang Admin) để tránh làm phiền môi trường văn phòng.

---

## 12. Responsive Design

### 12.1 Breakpoints

| Name    | Width      | Target | Sidebar           |
| ------- | ---------- | ------ | ----------------- |
| Mobile  | < 768px    | Phone  | Hidden, hamburger |
| Tablet  | 768–1199px | Tablet | Collapsed (88px)  |
| Desktop | ≥ 1200px   | Admin  | Full (272px)      |

### 12.2 Test Points

Mọi page PHẢI test tại: **375px**, **768px**, **1024px**, **1440px**

### 12.3 Mobile Rules

| #   | Rule                                    |
| --- | --------------------------------------- |
| R1  | ❌ NO horizontal scroll trên mobile     |
| R2  | ❌ NO content ẩn sau fixed elements     |
| R3  | ✅ Touch targets ≥ 44px                 |
| R4  | ✅ DataGrid → card layout trên mobile   |
| R5  | ✅ Sidebar → hamburger menu trên mobile |

---

## 13. Accessibility (WCAG 2.1 AA)

| #   | Requirement         | Chi tiết                                                           |
| --- | ------------------- | ------------------------------------------------------------------ |
| A1  | **Keyboard**        | Tab, Arrow, Enter, Space, Esc — PHẢI hoạt động                     |
| A2  | **Semantic HTML**   | `<button>`, `<nav>`, `<article>`, `<main>` — ❌ NO `<div onClick>` |
| A3  | **Skip-to-content** | `<a href="#vct-main-content">` (trong AppShell)                    |
| A4  | **ARIA labels**     | Icon-only buttons → `aria-label="Đóng"`                            |
| A5  | **Form labels**     | Mọi input PHẢI có `<label>` — KHÔNG chỉ placeholder                |
| A6  | **Alt text**        | Mọi `<img>` PHẢI có `alt`                                          |
| A7  | **Color contrast**  | Text ≥ 4.5:1, large text ≥ 3:1                                     |
| A8  | **Focus visible**   | `:focus-visible` outline (trong globals.css)                       |
| A9  | **Active nav**      | `aria-current="page"` trên nav item active                         |
| A10 | **Touch targets**   | ≥ 44px trên mobile                                                 |
| A11 | **Focus Trap**      | Modal/Drawer mở lên PHẢI nhốt Tab vòng lặp (Focus Trap) bên trong  |
| A12 | **Aria Live**       | Toast báo điểm/kết quả chớp nhoáng PHẢI có `aria-live="polite"`      |

---

## 14. Overlays Decision Guide

| Overlay              | Content Size | Blocks?        | Use Case              | Z-Index |
| -------------------- | ------------ | -------------- | --------------------- | ------- |
| `VCT_Tooltip`        | 1 line       | No             | Hover hint            | 600     |
| `VCT_Popover`        | Small card   | Click-away     | Mini-form, context    | 100     |
| `VCT_Dropdown`       | Menu list    | Click-away     | Context menu, actions | 100     |
| `VCT_Sheet`          | Medium       | Yes (mobile)   | Mobile action list    | 300     |
| `VCT_Drawer`         | Large panel  | Side panel     | Record detail, edit   | 300     |
| `VCT_Modal`          | Medium       | Yes (backdrop) | Confirmation, alert   | 400     |
| `VCT_CommandPalette` | Full search  | Yes            | ⌘K global search      | 400     |

**Rules**: Modal cho confirmations. Drawer cho detail views. Tooltip chỉ 1 dòng. Esc đóng tất cả.

---

## 15. Loading & Empty States UX

### 15.1 Loading Pattern Matrix

Để tránh tình trạng giật lag thị giác (Layout Shift) hoặc quá tải Spinner:

| Thời gian chờ dự kiến | Giải pháp khuyên dùng | Ứng dụng cụ thể |
| --- | --- | --- |
| **< 300ms** | **Không hiện loading** | Đổi tab cục bộ, validation form |
| **1s - 2s** | **VCT_Spinner (Inline)** | Submit form (trên nút Button), load danh sách dropdown |
| **> 2s** | **VCT_Skeleton** | Lần đầu load trang, load báo cáo thống kê, chuyển route |
| **Global Load** | **Top Progress Bar** | Chuyển trang Next.js App Router (NProgress) |
| **Background Sync** | **VCT_Toast (Loading)** | Đang upload file lớn, đang xuất file Excel |

### 15.2 Empty States Architecture

Mọi bảng (DataGrid) hoặc danh sách khi chưa có dữ liệu **TUYỆT ĐỐI CẤM** chỉ hiện text "Không có dữ liệu". Bắt buộc sử dụng `VCT_EmptyState` với cấu trúc 3 phần:

1. **Illustration**: Hình ảnh minh họa (mờ, watermark style).
2. **Title & Description**: Giải thích rõ ràng tại sao trống (VD: "Chưa có vận động viên nào. Vui lòng thêm mới hoặc import từ Excel").
3. **Call-to-Action (CTA)**: Nút thao tác chính (Thêm VĐV) nằm ngay bên dưới.

---

## 16. Critical Operations UX

### 16.1 Destructive Actions (Operations rủi ro cao)

Xóa dữ liệu dùng chung (Giải đấu, Đơn vị, Hạng cân) có tầm ảnh hưởng lớn.

| Mức độ | Ý nghĩa | Yêu cầu UX | Ví dụ |
| --- | --- | --- | --- |
| **Soft Lock** | Khóa tạm thời, có thể mở lại | `VCT_Modal` hỏi Yes/No bình thường | Khóa tài khoản, Đình chỉ VĐV |
| **Hard Delete** | Xóa vĩnh viễn, mất dữ liệu liên đới | **Confirmation Modal yêu cầu nhập Text** | Xóa một Giải Đấu, Xóa một hạng cân đã có kết quả |
| **Transfer** | Chuyển đổi quyền sở hữu lớn | **Xác thực OTP/Password lần 2** | Duyệt chuyển CLB cho VĐV, Cấp quyền Admin |

### 16.2 Hard Delete Implementation

Khi thực thi Hard Delete, modal xác nhận bắt buộc người dùng gõ chuỗi xác nhận:

```tsx
<VCT_Modal title="Xóa Giải Đấu?">
  <p className="text-vct-danger">Hành động này không thể hoàn tác và sẽ xóa TOÀN BỘ trận đấu liên quan.</p>
  <p>Vui lòng gõ <strong>XOA GIAI DAU</strong> để tiếp tục.</p>
  <VCT_Input value={confirmText} onChange={...} />
  <VCT_Button disabled={confirmText !== 'XOA GIAI DAU'} variant="danger">
    Xác nhận xóa
  </VCT_Button>
</VCT_Modal>
```

---

## 17. CSS Architecture

### 17.1 Stack

| Layer                 | Sử dụng                                    |
| --------------------- | ------------------------------------------ |
| TailwindCSS 4.2+      | Utility-first styling                      |
| CSS Custom Properties | `--vct-*` design tokens                    |
| CSS Modules           | Module-specific (e.g., `admin.module.css`) |

### 17.2 Convention

```tsx
// ✅ Token-based
className="bg-vct-elevated text-vct-text border border-vct-border rounded-lg"

// ❌ NEVER hardcode
className="bg-[#1e293b] text-[#f1f5f9]"
style={{ color: '#fff', background: '#0f172a' }}
```

### 17.3 CSS Naming

```css
.vct-{component}-{modifier}
/* .vct-th, .vct-td, .vct-cell-primary, .vct-icon-btn */
```

---

## 18. CSS Utility Classes

### 18.1 Core Utilities

```css
.vct-glass           /* Glassmorphism (blur + background) */
.vct-card-hover      /* translateY(-2px) + shadow on hover */
.vct-card-press      /* scale(0.98) on :active */
.vct-stagger         /* Staggered fade-in (60ms delay, up to 12 children) */
.vct-skeleton        /* Shimmer loading animation */
.vct-gradient-text   /* Accent gradient text */
.vct-dot-pulse       /* Pulsing dot indicator */
```

### 18.2 Layout Utilities

```css
.vct-hide-scrollbar  /* Thin 4px scrollbar, transparent track */
.vct-shell-grid      /* Responsive grid: 1→2→3 columns */
.vct-responsive-grid /* Responsive grid: 1→2→4 columns */
.vct-skip-link       /* Skip-to-content accessibility link */
.vct-breadcrumb-link /* Breadcrumb styling */
```

### 18.3 Table Utilities

```css
.vct-th              /* Table header cell (sticky, uppercase) */
.vct-td              /* Table data cell */
.vct-cell-primary    /* Bold primary text cell */
.vct-cell-secondary  /* Small muted text cell */
.vct-cell-accent     /* Accent-colored cell */
.vct-cell-semibold   /* Semibold cell */
.vct-cell-stat       /* Bold accent stat cell */
.vct-checkbox        /* Styled checkbox (16px, accent) */
```

### 18.4 Interactive Utilities

```css
.vct-icon-btn        /* Transparent icon button */
.vct-icon-btn-danger /* Red icon button (delete) */
.vct-dark-input      /* Input for dark modals */
.vct-dark-ghost-btn  /* Ghost button on dark background */
.vct-dark-revoke-btn /* Red revoke button */
```

### 18.5 Feedback Utilities

```css
.vct-skeleton-block  /* Skeleton placeholder block */
.vct-error-banner    /* Error message banner */
.vct-error-retry-btn /* Error retry button */
.vct-modal-overlay   /* Modal backdrop */
.vct-modal-panel     /* Modal panel */
.vct-progress-fill   /* Dynamic-color progress bar */
.vct-pct-label       /* Percentage label */
.vct-count-badge     /* Dynamic-color count badge */
.vct-status-dot      /* Dynamic-color status dot */
```

### 18.6 Keyframe Animations

```css
@keyframes vct-pulse     /* Pulse opacity (loading indicators) */
@keyframes vct-shimmer   /* Shimmer sweep (skeletons) */
@keyframes vct-fade-in   /* Fade up 8px (stagger children) */
@keyframes vct-scale-in  /* Scale from 0.95 (modals) */
@keyframes vct-count-up; /* Count-up fade 12px (stats) */
```

---

## 19. Print Media UX

*(Đặc thù: In Thẻ VĐV, Lịch Thi Đấu, Bảng Điểm, Sơ đồ Bốc thăm ngay từ Trình duyệt bằng `Ctrl + P`)*

### 19.1 CSS Print Utilities (`@media print`)

```css
@media print {
  .vct-no-print {
    display: none !important; /* Ẩn Sidebar, Header, Nút Action, Pagination */
  }
  .vct-print-only {
    display: block !important; /* Chỉ hiện thị khi in (VD: Chữ ký giáp lai, Watermark chìm) */
  }
  .vct-print-exact-colors {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .vct-print-break-before {
    page-break-before: always;
  }
  .vct-print-avoid-break {
    page-break-inside: avoid; /* Tránh bảng VĐV bị đứt nửa trang */
  }
}
```

### 19.2 Print Quality Gates
1. ✅ **Force Light Theme**: Trình duyệt in phải luôn ép về biến CSS Light Theme (nền trắng, chữ đen). Tuyệt đối cấm in nền Xám/Đen tốn mực.
2. ✅ **Ẩn Menu**: Sidebar và Header phải gắn class `.vct-no-print`.
3. ✅ **A4 Sizing**: Sơ đồ bốc thăm/Lịch đấu phải wrap trong khung `.vct-print-a4` (width `210mm`, padding `20mm`).

---

## A. Visual Anti-Patterns

| #   | ❌ CẤM                                 | ✅ ĐÚNG                       |
| --- | -------------------------------------- | ----------------------------- |
| 1   | Hardcode colors: `color: '#FF0000'`    | Token: `text-vct-danger`      |
| 2   | Tailwind `dark:` modifier              | CSS variables tự chuyển đổi   |
| 3   | Inline style: `style={{ margin: 15 }}` | Tailwind utilities / tokens   |
| 4   | Import `lucide-react` trực tiếp        | `VCT_Icons` wrapper           |
| 5   | Emoji làm icon: 👤                     | SVG qua `VCT_Icons`           |
| 6   | Component không có `VCT_` prefix       | Luôn prefix `VCT_`            |
| 7   | Ship UI "basic/simple/MVP"             | Premium, professional feel    |
| 8   | Custom button/card không qua `@vct/ui` | Import từ `@vct/ui`           |
| 9   | Font hardcode: `font-size: 14px`       | Token: `var(--vct-font-base)` |
| 10  | Z-index hardcode: `z-index: 999`       | Token: `var(--vct-z-modal)`   |

---

## B. Pre-Delivery Visual Checklist

### Visual Quality

- [ ] Không emoji làm icon (dùng VCT_Icons)
- [ ] Hover states không gây layout shift
- [ ] Chỉ dùng theme tokens (không hardcode colors)
- [ ] Giao diện premium, professional

### Light/Dark Mode

- [ ] Test CẢ 2 modes
- [ ] Glass elements visible cả 2 modes
- [ ] Text contrast ≥ 4.5:1
- [ ] Borders visible cả 2 modes

### Interaction

- [ ] Clickable elements có `cursor-pointer`
- [ ] Transitions smooth (150–300ms)
- [ ] Focus states visible cho keyboard
- [ ] Touch targets ≥ 44px trên mobile

### Layout

- [ ] Responsive tại 375px, 768px, 1024px, 1440px
- [ ] Không horizontal scroll trên mobile
- [ ] Không content ẩn sau fixed elements

### Accessibility

- [ ] Interactive elements keyboard-navigable
- [ ] Images có alt text
- [ ] Form fields có labels
- [ ] Skip-to-content link hoạt động

---

## Cross-Reference

| Tài liệu                 | Đường dẫn                                        | Phạm vi                                             |
| ------------------------ | ------------------------------------------------ | --------------------------------------------------- |
| **Frontend Architecture**    | `/docs/architecture/frontend-architecture.md`                             | Engineering: monorepo, routing, state, API, testing |
| Architecture Guard Rails | `/docs/architecture/architecture-guard-rails.md` | Full-stack architecture rules                       |
| Global CSS               | `/apps/next/app/globals.css`                     | Token definitions                                   |
| JS Tokens                | `/packages/ui/src/tokens.ts`                     | JS token exports                                    |
| Component API            | `/packages/ui/src/index.ts`                      | Component exports                                   |
