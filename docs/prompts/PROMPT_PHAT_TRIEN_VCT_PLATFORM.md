# PROMPT PHÁT TRIỂN TOÀN DIỆN VCT PLATFORM
## Yêu cầu: Code hoàn chỉnh, production-ready, chuyên nghiệp

---

## MỤC LỤC

1. [BỐI CẢNH DỰ ÁN](#1-bối-cảnh-dự-án)
2. [KIẾN TRÚC HIỆN TẠI](#2-kiến-trúc-hiện-tại)
3. [TECH STACK HIỆN TẠI](#3-tech-stack-hiện-tại)
4. [CẤU TRÚC THƯ MỤC HIỆN TẠI](#4-cấu-trúc-thư-mục-hiện-tại)
5. [TYPE SYSTEM HIỆN TẠI](#5-type-system-hiện-tại)
6. [COMPONENT LIBRARY HIỆN TẠI](#6-component-library-hiện-tại)
7. [ROUTE SYSTEM HIỆN TẠI](#7-route-system-hiện-tại)
8. [BACKEND HIỆN TẠI](#8-backend-hiện-tại)
9. [PHASE 1 - REFACTOR CẤU TRÚC & FOUNDATION](#9-phase-1---refactor-cấu-trúc--foundation)
10. [PHASE 2 - DATABASE & BACKEND NÂNG CẤP](#10-phase-2---database--backend-nâng-cấp)
11. [PHASE 3 - REAL-TIME SYSTEM](#11-phase-3---real-time-system)
12. [PHASE 4 - ROLE-BASED PORTALS](#12-phase-4---role-based-portals)
13. [PHASE 5 - SCORING ENGINE](#13-phase-5---scoring-engine)
14. [PHASE 6 - UI/UX NÂNG CẤP](#14-phase-6---uiux-nâng-cấp)
15. [PHASE 7 - BUSINESS LOGIC & WORKFLOW](#15-phase-7---business-logic--workflow)
16. [PHASE 8 - REPORTING & EXPORT](#16-phase-8---reporting--export)
17. [PHASE 9 - MOBILE & OFFLINE](#17-phase-9---mobile--offline)
18. [PHASE 10 - PRODUCTION READINESS](#18-phase-10---production-readiness)
19. [QUY TẮC CODE](#19-quy-tắc-code)

---

## 1. BỐI CẢNH DỰ ÁN

### Mô tả
VCT Platform (Võ Cổ Truyền Platform) là nền tảng quản lý giải đấu Võ Cổ Truyền Việt Nam toàn diện. Hệ thống phục vụ cho Liên đoàn Võ thuật Cổ truyền Việt Nam tổ chức các giải đấu từ cấp tỉnh đến quốc gia.

### Nghiệp vụ cốt lõi
- **Đối kháng (Combat)**: Thi đấu đối đầu theo hạng cân, loại trực tiếp hoặc vòng tròn
- **Quyền (Forms)**: Biểu diễn bài quyền, chấm điểm bởi hội đồng trọng tài (5 hoặc 7 trọng tài)
- **Quy trình giải đấu**: Đăng ký → Duyệt hồ sơ → Họp chuyên môn → Bốc thăm → Cân ký → Thi đấu → Trao giải

### Các vai trò người dùng (hiện tại 5, cần mở rộng lên 9)
| Vai trò | Mã role | Mô tả |
|---------|---------|-------|
| Quản trị hệ thống | `admin` | Toàn quyền hệ thống |
| Ban tổ chức | `btc` | Quản lý giải đấu |
| Điều phối trọng tài | `referee_manager` | Phân công, giám sát trọng tài |
| Trọng tài | `referee` | Chấm điểm, điều hành trận đấu |
| Cán bộ đoàn | `delegate` | Quản lý đoàn/đội |
| **VẬN ĐỘNG VIÊN** | `athlete` | **MỚI - Portal riêng cho VĐV** |
| **KHÁN GIẢ** | `spectator` | **MỚI - Xem trực tiếp, public** |
| **Y TẾ** | `medical` | **MỚI - Quản lý y tế giải đấu** |
| **TRUYỀN THÔNG** | `media` | **MỚI - Quản lý media, livestream** |

---

## 2. KIẾN TRÚC HIỆN TẠI

### Monorepo Structure
```
vct-platform/                    # Root monorepo (Turbo + Yarn 4 workspaces)
├── apps/
│   ├── next/                    # Web app - Next.js 16 (App Router, React 19)
│   └── expo/                    # Mobile app - Expo 54 + React Native 0.81
├── packages/
│   └── app/                     # Shared business logic + UI components
│       └── features/
│           ├── auth/            # Authentication (JWT + Context)
│           ├── components/      # VCT UI component library
│           ├── data/            # Types, mock data, repositories
│           ├── layout/          # AppShell, Sidebar, route-registry
│           ├── theme/           # Light/Dark mode
│           ├── hooks/           # useToast, useEntityCollection
│           ├── tournament/      # 20 page components
│           ├── home/            # Home screen
│           ├── mobile/          # Mobile routes
│           └── user/            # User detail
├── backend/                     # Go 1.26 REST API
│   ├── cmd/server/              # Entry point
│   └── internal/
│       ├── auth/                # JWT service
│       ├── httpapi/             # HTTP handlers
│       ├── store/               # In-memory store
│       └── config/              # Environment config
└── tests/e2e/                   # Playwright e2e tests
```

### Design Patterns đang dùng
1. **Repository Pattern**: EntityRepository<T> interface với Mock/API adapters
2. **Provider Pattern**: AuthProvider, ThemeProvider (React Context)
3. **Hook Pattern**: useEntityCollection cho CRUD + UI state
4. **Barrel Export**: vct-ui.tsx exports tất cả components
5. **Adapter Pattern**: createMockAdapter / createApiAdapter có thể swap runtime

---

## 3. TECH STACK HIỆN TẠI

### Frontend
```json
{
  "next": "^16.1.0",
  "react": "^19.1.0",
  "react-dom": "^19.1.0",
  "react-native-web": "~0.19.10",
  "framer-motion": "^12.35.0",
  "lucide-react": "^0.577.0",
  "solito": "next",
  "typescript": "^5.2.2"
}
```

### Mobile
```json
{
  "expo": "^54.0.16",
  "react-native": "0.81.4",
  "react-native-reanimated": "4.1.3",
  "@react-navigation/native": "^7.0.15"
}
```

### Backend
```go
module vct-platform/backend
go 1.26
require github.com/golang-jwt/jwt/v5 v5.3.1
```

### Build & Test
```json
{
  "turbo": "^2.4.4",
  "@playwright/test": "^1.52.0",
  "yarn": "4.7.0"
}
```

---

## 4. CẤU TRÚC THƯ MỤC HIỆN TẠI

### packages/app/features/ (Shared Package)
```
features/
├── auth/
│   ├── types.ts              # UserRole, AuthUser, AuthSession, LoginInput, RevokeInput
│   ├── auth-client.ts        # API calls: login, me, refresh, logout, revoke, getAuditLogs
│   ├── AuthProvider.tsx       # React Context: session, login, logout, canAccessRoute
│   └── Page_login.tsx         # Login page UI
├── components/
│   ├── vct-ui.tsx             # Barrel export
│   ├── vct-ui-layout.tsx      # VCT_Provider, VCT_Stack, VCT_Divider, VCT_Text, VCT_Button, VCT_Card
│   ├── vct-ui-form.tsx        # VCT_Field, VCT_Input, VCT_SearchInput, VCT_Select, VCT_Switch, VCT_SegmentedControl, VCT_Stepper, VCT_ScorePad
│   ├── vct-ui-data-display.tsx # VCT_Badge, VCT_KpiCard, VCT_Table, VCT_AvatarGroup, VCT_Skeleton, VCT_EmptyState, VCT_FilterChips, VCT_StatusPipeline, VCT_BulkActionsBar, VCT_ProgressBar, VCT_Tabs, VCT_AvatarLetter
│   ├── vct-ui-overlay.tsx     # VCT_LoadingOverlay, VCT_Modal, VCT_Toast, VCT_ConfirmDialog
│   ├── vct-ui.legacy.tsx      # TẤT CẢ implementations trong 1 file (~1200 dòng)
│   ├── vct-icons.tsx          # 50+ Lucide icons với chuẩn hóa props
│   └── ui-logo.tsx            # SVG animated VCT logo
├── data/
│   ├── types.ts               # 49 type definitions (ALL entities)
│   ├── mock-data.ts           # 100+ mock records, helper functions
│   ├── tournament-config.ts   # Master tournament config object
│   ├── export-utils.ts        # CSV, Excel XML, print utilities
│   └── repository/
│       ├── entity-repository.ts   # EntityRepository<T> interface
│       ├── adapters.ts            # createMockAdapter, createApiAdapter
│       ├── index.ts               # Repository instances
│       ├── ui-state.ts            # UIState, ListUIState types
│       └── use-entity-collection.ts # React hook for CRUD + state
├── layout/
│   ├── AppShell.tsx           # Master layout: sidebar + header + content + auth guard
│   ├── sidebar.tsx            # Collapsible sidebar with grouped navigation
│   └── route-registry.ts     # 24 routes, RBAC, helper functions
├── theme/
│   └── ThemeProvider.tsx      # Light/Dark mode with localStorage + OS detection
├── hooks/
│   └── use-toast.ts           # Toast notification hook (3500ms auto-dismiss)
├── tournament/                # 20 PAGE COMPONENTS - tất cả flat trong 1 thư mục
│   ├── Page_dashboard.tsx     # Hero + KPIs + Live arenas + Leaderboard
│   ├── Page_athletes.tsx      # KPIs + Search/Filter + Expandable rows + Print IDs
│   ├── Page_teams.tsx         # Pipeline + Table + Tabs (Info/Docs/Finance/History)
│   ├── Page_bracket.tsx       # SVG bracket engine (2-128 players) + Pan/Zoom
│   ├── Page_combat.tsx        # Match control + Scoring + Timer + Event log
│   ├── Page_forms.tsx         # Form scoring + Judge panels
│   ├── Page_registration.tsx  # Event sign-up + Quota validation
│   ├── Page_referees.tsx      # Referee CRUD + Status management
│   ├── Page_referee_assignments.tsx # Drag-drop assignment
│   ├── Page_schedule.tsx      # Calendar/Timeline view
│   ├── Page_medals.tsx        # Medal table + Rankings
│   ├── Page_appeals.tsx       # Appeal workflow + Resolution
│   ├── Page_results.tsx       # Results aggregation
│   ├── Page_weigh_in.tsx      # Weigh-in records + Pass/Fail
│   ├── Page_boc_tham.tsx      # Draw system
│   ├── Page_giai_dau.tsx      # Tournament info/config
│   ├── Page_noi_dung.tsx      # Content categories management
│   ├── Page_san_dau.tsx       # Arena management
│   ├── Page_technical_meeting.tsx # Technical meeting
│   └── Page_reports.tsx       # Reports + Print
├── home/
│   └── screen.tsx
├── mobile/
│   ├── mobile-routes.ts
│   └── tournament-screens.tsx
└── user/
    └── detail-screen.tsx
```

---

## 5. TYPE SYSTEM HIỆN TẠI

### Tất cả types đang dùng (packages/app/features/data/types.ts)

```typescript
// ============ ENUMS & STATUS ============
type TrangThaiGiai = 'nhap' | 'dang_ky' | 'khoa_dk' | 'thi_dau' | 'ket_thuc'
type CapDoGiai = 'quoc_gia' | 'khu_vuc' | 'tinh' | 'clb'
type GioiTinh = 'nam' | 'nu'
type LoaiNoiDung = 'quyen' | 'doi_khang'
type TrangThaiND = 'active' | 'draft' | 'closed'
type TrangThaiSan = 'dong' | 'san_sang' | 'dang_chuan_bi' | 'dang_thi_dau' | 'su_co' | 'bao_tri'
type TrangThaiDoan = 'nhap' | 'cho_duyet' | 'yeu_cau_bo_sung' | 'da_xac_nhan' | 'da_checkin' | 'tu_choi'
type TrangThaiVDV = 'du_dieu_kien' | 'cho_xac_nhan' | 'thieu_ho_so' | 'nhap'
type TrangThaiDK = 'da_duyet' | 'cho_duyet' | 'tu_choi'
type TrangThaiTT = 'xac_nhan' | 'cho_duyet' | 'tu_choi'
type TrangThaiTranDau = 'chua_dau' | 'dang_dau' | 'ket_thuc'
type TrangThaiQuyen = 'cho_thi' | 'dang_thi' | 'da_cham' | 'hoan'
type TrangThaiKN = 'moi' | 'dang_xu_ly' | 'chap_nhan' | 'bac_bo'
type KetQuaCan = 'dat' | 'khong_dat' | 'cho_xu_ly'
type CapBacTT = 'quoc_gia' | 'cap_1' | 'cap_2' | 'cap_3'

// ============ CORE ENTITIES ============

interface AuditEntry { time: string; action: string; by: string }

interface TournamentConfig {
  id: string; name: string; code: string; level: CapDoGiai
  round: number; startDate: string; endDate: string
  registrationDeadline: string; location: string; venue: string
  organizer: string; status: TrangThaiGiai
  // Rules
  formsScoringMethod: 'theo_diem' | 'dau_loai_ban_ket'
  formsJudgeCount: 5 | 7; combatRoundDuration: number
  combatBreakDuration: number; combatJudgeCount: 3 | 5
  combatMedalSystem: 'mot_hcb' | 'hai_hcd'
  // Quotas
  maxAthletesPerTeam: number; maxEventsPerAthlete: number
  maxCoachesPerTeam: number; maxTeams: number
  // Fees (VND)
  athleteFee: number; eventFee: number; teamFee: number
  // Prizes
  goldPrize: number; silverPrize: number; bronzePrize: number
  teamPrizes: Array<{ rank: number; prize: number }>
  // Ranking
  rankingPoints: Record<string, number>
  // Meta
  sponsors: Array<{ name: string; level: string; logo?: string }>
  committee: Array<{ role: string; name: string; title?: string }>
  medical: { hospital: string; distance: string; doctors: number; nurses: number }
  legal: { rules: string; version: string; insurance: string }
  checklist: Array<{ item: string; done: boolean }>
  auditTrail: AuditEntry[]
}

interface NoiDungQuyen {
  id: string; ten: string; loai: LoaiNoiDung
  gioiTinh: GioiTinh | 'chung'; luaTuoi: string
  soNguoi: number; moTa?: string
  trangThai: TrangThaiND
}

interface HangCan {
  id: string; ten: string; gioiTinh: GioiTinh
  luaTuoi: string; canNangMin: number; canNangMax: number
  trangThai: TrangThaiND
}

interface LuaTuoi {
  id: string; ten: string; tuoiMin: number; tuoiMax: number
}

interface SanDau {
  id: string; ten: string; loai: LoaiNoiDung
  trangThai: TrangThaiSan; sucChua: number
  viTri?: string; ghiChu?: string
  // Live match tracking
  currentMatch?: { id: string; red: string; blue: string; score: string; round: number }
  queue?: Array<{ id: string; red: string; blue: string }>
  referees?: string[]
  equipment?: Array<{ name: string; status: 'ok' | 'loi' | 'bao_tri' }>
}

interface DonVi {
  id: string; ten: string; maDoan: string
  loai: 'tinh' | 'clb' | 'ca_nhan'
  tinhThanh?: string; soVDV: number
  lienHe?: string; sdt?: string; email?: string
  trangThai: TrangThaiDoan
  docs?: Record<string, boolean>
  fees?: { total: number; paid: number; remaining: number }
  achievements?: string[]
  auditTrail?: AuditEntry[]
}

interface VanDongVien {
  id: string; hoTen: string; gioiTinh: GioiTinh
  ngaySinh: string; canNang: number
  donViId: string; noiDungIds: string[]
  trangThai: TrangThaiVDV
  chieuCao?: number
  docs?: Record<string, boolean>
  ghiChu?: string
}

interface DangKy {
  id: string; vanDongVienId: string; noiDungId: string
  hangCanId?: string; trangThai: TrangThaiDK
  ghiChu?: string
}

interface TrongTai {
  id: string; hoTen: string; capBac: CapBacTT
  chuyenMon: 'quyen' | 'doi_khang' | 'ca_hai'
  tinhThanh?: string; dienThoai?: string; email?: string
  namKinhNghiem?: number; trangThai: TrangThaiTT
  ghiChu?: string
  giaiDauThamGia?: string[]
}

interface CanKy {
  id: string; vanDongVienId: string; hangCanId: string
  canNangThuc: number; ketQua: KetQuaCan
  thoiGian: string; nguoiCan?: string; ghiChu?: string
}

interface TranDauDK {
  id: string; noiDungId: string; hangCanId: string
  vanDongVienDo: string; vanDongVienXanh: string
  sanDauId?: string; vong?: string
  diemDo?: number[]; diemXanh?: number[]
  ketQua?: string; nguoiThang?: string
  trangThai: TrangThaiTranDau
  thoiGian?: string; ghiChu?: string
}

interface LuotThiQuyen {
  id: string; vanDongVienId: string; noiDungId: string
  diemGiamKhao: number[]; diemTrungBinh: number
  diemTruHigh?: number; diemTruLow?: number
  tongDiem?: number; xepHang?: number
  trangThai: TrangThaiQuyen
  ghiChu?: string
}

interface LichThiDau {
  id: string; ngay: string; buoi: 'sang' | 'chieu' | 'toi'
  gioBatDau: string; gioKetThuc: string
  sanDauId: string; noiDungId?: string
  soTran: number; ghiChu?: string
}

interface KhieuNai {
  id: string; loai: 'khieu_nai' | 'khang_nghi'
  donViId: string; noiDung: string
  tranDauId?: string; luotThiId?: string
  trangThai: TrangThaiKN
  nguoiGui: string; thoiGianGui: string
  nguoiXuLy?: string; ketLuan?: string
  thoiGianXuLy?: string
}

interface ResultRecord {
  id: string; athleteId: string; athleteName: string
  teamId: string; teamName: string; eventId: string
  eventName: string; eventType: LoaiNoiDung
  score?: number; rank?: number
  medal?: 'gold' | 'silver' | 'bronze'
  matchId?: string
}

// ============ STATUS MAPS (label + color) ============
const TRANG_THAI_DOAN_MAP: Record<TrangThaiDoan, { label: string; color: string }>
const TRANG_THAI_VDV_MAP: Record<TrangThaiVDV, { label: string; color: string }>
const TRANG_THAI_DK_MAP: Record<TrangThaiDK, { label: string; color: string }>
const TRANG_THAI_TT_MAP: Record<TrangThaiTT, { label: string; color: string }>
const CAP_BAC_TT_MAP: Record<CapBacTT, { label: string; color: string }>
const TRANG_THAI_KN_MAP: Record<TrangThaiKN, { label: string; color: string }>
const DOC_CHECKLIST: Array<{ key: string; label: string }>
```

---

## 6. COMPONENT LIBRARY HIỆN TẠI

### Tất cả VCT components đã xây dựng

**Layout:** VCT_Provider, VCT_Stack, VCT_Divider, VCT_Text (h1/h2/h3/body/small/mono), VCT_Button (primary/secondary/danger/ghost), VCT_Card (glassmorphism + mouse tracking)

**Form:** VCT_Field (label + error + tip), VCT_Input, VCT_SearchInput, VCT_Select, VCT_Switch, VCT_SegmentedControl, VCT_Stepper, VCT_ScorePad

**Data Display:** VCT_Badge (success/warning/danger/info + pulse), VCT_KpiCard, VCT_Table, VCT_AvatarGroup, VCT_AvatarLetter, VCT_Skeleton, VCT_EmptyState, VCT_FilterChips, VCT_StatusPipeline, VCT_BulkActionsBar, VCT_ProgressBar, VCT_Tabs

**Overlay:** VCT_LoadingOverlay, VCT_Modal, VCT_Toast, VCT_ConfirmDialog

### Design Tokens (CSS Variables trong globals.css)
```css
/* Light Mode */
--vct-bg-base: #f0f4f8;
--vct-bg-elevated: #ffffff;
--vct-bg-glass: rgba(255,255,255,0.85);
--vct-bg-input: #e8edf3;
--vct-text-primary: #0f172a;
--vct-text-secondary: #334155;
--vct-text-tertiary: #64748b;
--vct-border-subtle: #dde3ec;
--vct-border-strong: #c1c9d6;
--vct-accent-cyan: #0ea5e9;
--vct-accent-gradient: linear-gradient(135deg, #0ea5e9, #6366f1);

/* Dark Mode (class .dark on :root) */
--vct-bg-base: #0b1120;
--vct-bg-elevated: #162032;
--vct-accent-cyan: #22d3ee;
/* ... tương ứng dark versions */
```

### Icons: 50+ Lucide icons chuẩn hóa (size: 20, strokeWidth: 2)

---

## 7. ROUTE SYSTEM HIỆN TẠI

### 24 Routes với RBAC
```typescript
// Route Groups
type RouteGroupId = 'cau_hinh' | 'dang_ky' | 'trong_tai' | 'thi_dau' | 'tong_hop'

// Role Constants
const ALL_ROLES = ['admin', 'btc', 'referee_manager', 'referee', 'delegate']
const ADMIN_BTC = ['admin', 'btc']
const TEAM_OPERATORS = ['admin', 'btc', 'delegate']
const REFEREE_OPERATORS = ['admin', 'btc', 'referee_manager', 'referee']
const REPORT_VIEWERS = ['admin', 'btc', 'delegate', 'referee_manager']

// Routes:
/ → Dashboard (ALL_ROLES)
/giai-dau → Tournament Info (ADMIN_BTC)
/noi-dung → Content Categories (ADMIN_BTC)
/san-dau → Arena Management (ADMIN_BTC)
/teams → Teams (TEAM_OPERATORS)
/athletes → Athletes (TEAM_OPERATORS)
/registration → Registration (TEAM_OPERATORS)
/referees → Referee List (admin, btc, referee_manager)
/referee-assignments → Assignments (admin, btc, referee_manager)
/hop-chuyen-mon → Technical Meeting (REFEREE_OPERATORS)
/boc-tham → Draw (REFEREE_OPERATORS)
/weigh-in → Weigh-in (REFEREE_OPERATORS)
/combat → Combat (REFEREE_OPERATORS)
/forms → Forms (REFEREE_OPERATORS)
/bracket → Bracket (REFEREE_OPERATORS)
/results → Results (ALL_ROLES)
/schedule → Schedule (ALL_ROLES)
/medals → Medals (REPORT_VIEWERS)
/appeals → Appeals (REPORT_VIEWERS)
/reports → Reports (REPORT_VIEWERS)
/users/[userId] → User Detail (ADMIN_BTC)
```

---

## 8. BACKEND HIỆN TẠI

### Go HTTP Server (backend/internal/httpapi/server.go)
```
Auth Routes:
  POST   /api/v1/auth/login
  POST   /api/v1/auth/refresh
  GET    /api/v1/auth/me          (protected)
  POST   /api/v1/auth/logout      (protected)
  POST   /api/v1/auth/revoke      (protected)
  GET    /api/v1/auth/audit       (admin/btc only)
  GET    /healthz

Entity CRUD (cho mỗi entity):
  GET    /api/v1/{entity}
  POST   /api/v1/{entity}
  GET    /api/v1/{entity}/{id}
  PATCH  /api/v1/{entity}/{id}
  DELETE /api/v1/{entity}/{id}
  PUT    /api/v1/{entity}/bulk
  POST   /api/v1/{entity}/import
  GET    /api/v1/{entity}/export?format=json|csv

Allowed entities: teams, athletes, registration, results, schedule, arenas, referees, appeals, weigh-ins, combat-matches, form-performances, content-categories, referee-assignments, tournament-config
```

### Auth Service (JWT HS256)
- Access token: 15m TTL
- Refresh token: 7d TTL
- Session tracking, token revocation, audit logging
- 5 hardcoded demo accounts

### In-Memory Store
- `map[string]map[string]map[string]any` (entity → id → data)
- RWMutex thread-safe
- Seed data on startup
- **KHÔNG CÓ DATABASE THẬT**

### Config (Environment Variables)
```
VCT_BACKEND_ADDR=:18080
VCT_CORS_ORIGINS=http://localhost:3000,http://localhost:8081
VCT_JWT_SECRET=change-me-before-production-vct-2026
VCT_ACCESS_TTL=15m
VCT_REFRESH_TTL=168h
VCT_AUDIT_LIMIT=5000
VCT_DISABLE_AUTH_FOR_DATA=false
```

---

## 9. PHASE 1 - REFACTOR CẤU TRÚC & FOUNDATION

### 1.1 Tái cấu trúc thư mục theo Domain-Driven Design

**YÊU CẦU: Tách mỗi feature module thành thư mục độc lập với components, hooks, types riêng.**

```
packages/app/features/
├── auth/                        # GIỮ NGUYÊN
├── shared/                      # MỚI - Shared utilities
│   ├── components/              # MỚI - Mỗi component 1 file riêng
│   │   ├── VCT_Button.tsx
│   │   ├── VCT_Card.tsx
│   │   ├── VCT_Input.tsx
│   │   ├── VCT_Modal.tsx
│   │   ├── VCT_Table.tsx        # MỚI - Enhanced DataTable
│   │   ├── VCT_DataGrid.tsx     # MỚI - Virtualized data grid
│   │   ├── VCT_Drawer.tsx       # MỚI - Side drawer
│   │   ├── VCT_Tooltip.tsx      # MỚI
│   │   ├── VCT_Popover.tsx      # MỚI
│   │   ├── VCT_Dropdown.tsx     # MỚI - Dropdown menu
│   │   ├── VCT_DatePicker.tsx   # MỚI
│   │   ├── VCT_TimePicker.tsx   # MỚI
│   │   ├── VCT_FileUpload.tsx   # MỚI
│   │   ├── VCT_RichText.tsx     # MỚI - Rich text editor
│   │   ├── VCT_Chart.tsx        # MỚI - Chart wrapper
│   │   ├── VCT_Wizard.tsx       # MỚI - Multi-step form
│   │   ├── VCT_QRCode.tsx       # MỚI
│   │   ├── VCT_Notification.tsx # MỚI - Notification center
│   │   └── index.ts             # Barrel export
│   ├── hooks/
│   │   ├── use-toast.ts
│   │   ├── use-debounce.ts      # MỚI
│   │   ├── use-pagination.ts    # MỚI
│   │   ├── use-keyboard.ts      # MỚI - Keyboard shortcuts
│   │   ├── use-media-query.ts   # MỚI - Responsive hooks
│   │   ├── use-infinite-scroll.ts # MỚI
│   │   └── use-local-storage.ts # MỚI
│   ├── utils/
│   │   ├── export-utils.ts      # Di chuyển từ data/
│   │   ├── format.ts            # MỚI - Date, number, currency formatters
│   │   ├── validation.ts        # MỚI - Zod schemas
│   │   └── cn.ts                # MỚI - className utility
│   └── types/
│       ├── common.ts            # MỚI - Shared types (Pagination, Sort, Filter)
│       └── api.ts               # MỚI - API response types
│
├── athletes/                    # MỚI - Tách từ tournament/
│   ├── components/
│   │   ├── AthleteCard.tsx
│   │   ├── AthleteForm.tsx
│   │   ├── AthleteTable.tsx
│   │   ├── AthleteExpandedRow.tsx
│   │   ├── AthleteIdCard.tsx    # Print ID card
│   │   └── AthleteDocChecklist.tsx
│   ├── hooks/
│   │   ├── use-athlete-filters.ts
│   │   ├── use-athlete-validation.ts
│   │   └── use-athlete-import.ts
│   ├── types.ts                 # VanDongVien + related types
│   └── Page.tsx                 # Main page (thin orchestrator)
│
├── teams/                       # MỚI - Tách từ tournament/
│   ├── components/
│   │   ├── TeamCard.tsx
│   │   ├── TeamForm.tsx
│   │   ├── TeamTable.tsx
│   │   ├── TeamDocTab.tsx
│   │   ├── TeamFinanceTab.tsx
│   │   └── TeamHistoryTab.tsx
│   ├── hooks/
│   │   └── use-team-workflow.ts # State machine transitions
│   ├── types.ts
│   └── Page.tsx
│
├── combat/                      # MỚI - Tách từ tournament/
│   ├── components/
│   │   ├── MatchCard.tsx
│   │   ├── MatchControl.tsx     # Live scoring UI
│   │   ├── ScoreBoard.tsx       # Real-time scoreboard
│   │   ├── Timer.tsx            # Match timer
│   │   ├── PenaltyPanel.tsx
│   │   └── EventLog.tsx
│   ├── hooks/
│   │   ├── use-match-timer.ts
│   │   ├── use-scoring.ts
│   │   └── use-match-websocket.ts # MỚI - WebSocket connection
│   ├── types.ts
│   └── Page.tsx
│
├── forms-scoring/               # MỚI - Tách từ tournament/
│   ├── components/
│   │   ├── JudgeScorePanel.tsx  # MỚI - Individual judge scoring
│   │   ├── ScoreSummary.tsx
│   │   ├── PerformanceCard.tsx
│   │   └── RankingTable.tsx
│   ├── hooks/
│   │   ├── use-forms-scoring-engine.ts # MỚI - Scoring algorithm
│   │   └── use-judge-websocket.ts     # MỚI
│   ├── types.ts
│   └── Page.tsx
│
├── bracket/                     # MỚI
│   ├── components/
│   │   ├── BracketCanvas.tsx    # SVG bracket
│   │   ├── MatchNode.tsx
│   │   └── ChampionCard.tsx
│   ├── hooks/
│   │   └── use-bracket-engine.ts
│   ├── types.ts
│   └── Page.tsx
│
├── schedule/                    # MỚI
│   ├── components/
│   │   ├── ScheduleCalendar.tsx # MỚI - Calendar view
│   │   ├── ScheduleTimeline.tsx # MỚI - Timeline view
│   │   ├── ScheduleGrid.tsx     # MỚI - Arena x Time grid
│   │   └── ConflictAlert.tsx    # MỚI - Conflict detection
│   ├── hooks/
│   │   └── use-schedule-engine.ts # MỚI - Auto-scheduling
│   ├── types.ts
│   └── Page.tsx
│
├── referees/                    # MỚI
│   ├── components/
│   ├── types.ts
│   └── Page.tsx
│
├── weigh-in/                    # MỚI
│   ├── components/
│   ├── types.ts
│   └── Page.tsx
│
├── appeals/                     # MỚI
│   ├── components/
│   ├── types.ts
│   └── Page.tsx
│
├── medals/                      # MỚI
│   ├── components/
│   ├── types.ts
│   └── Page.tsx
│
├── draw/                        # MỚI (bốc thăm)
│   ├── components/
│   │   ├── DrawEngine.tsx       # MỚI - Auto draw algorithm
│   │   ├── DrawVisualization.tsx
│   │   └── SeedingConfig.tsx    # MỚI - Seeding rules
│   ├── hooks/
│   │   └── use-draw-algorithm.ts
│   ├── types.ts
│   └── Page.tsx
│
├── registration/                # MỚI
│   ├── components/
│   ├── types.ts
│   └── Page.tsx
│
├── tournament-config/           # MỚI
│   ├── components/
│   ├── types.ts
│   └── Page.tsx
│
├── reports/                     # MỚI
│   ├── components/
│   │   ├── ReportBuilder.tsx    # MỚI - Custom report builder
│   │   ├── PrintTemplates/     # MỚI
│   │   │   ├── CertificateTemplate.tsx
│   │   │   ├── AthleteIdTemplate.tsx
│   │   │   ├── ScoreSheetTemplate.tsx
│   │   │   ├── MedalTableTemplate.tsx
│   │   │   └── MatchReportTemplate.tsx
│   │   └── ChartWidgets/      # MỚI
│   │       ├── TeamComparisonChart.tsx
│   │       ├── MedalDistributionChart.tsx
│   │       └── MatchProgressChart.tsx
│   ├── types.ts
│   └── Page.tsx
│
├── arenas/                      # MỚI
│   ├── components/
│   ├── types.ts
│   └── Page.tsx
│
├── technical-meeting/           # MỚI
│   ├── components/
│   │   ├── AgendaBuilder.tsx    # MỚI
│   │   ├── MinutesEditor.tsx    # MỚI - Meeting minutes
│   │   ├── VotePanel.tsx        # MỚI - Live voting
│   │   └── AttendanceTracker.tsx # MỚI
│   ├── types.ts
│   └── Page.tsx
│
│ ========== MỚI HOÀN TOÀN - PORTALS THEO VAI TRÒ ==========
│
├── athlete-portal/              # MỚI - Portal cho VĐV
│   ├── components/
│   │   ├── AthleteProfileCard.tsx
│   │   ├── MyScheduleView.tsx
│   │   ├── MyResultsView.tsx
│   │   ├── MyBracketPosition.tsx
│   │   ├── DigitalBadge.tsx     # QR code badge
│   │   ├── AppealSubmitForm.tsx
│   │   ├── WeighInStatus.tsx
│   │   └── NotificationFeed.tsx
│   ├── hooks/
│   │   └── use-athlete-session.ts
│   ├── types.ts
│   └── Page.tsx
│
├── spectator-portal/            # MỚI - Portal cho khán giả (public, no auth)
│   ├── components/
│   │   ├── PublicScoreboard.tsx  # Live scoreboard
│   │   ├── LiveBracket.tsx      # Real-time bracket
│   │   ├── PublicSchedule.tsx
│   │   ├── MedalTable.tsx
│   │   ├── MatchDetail.tsx
│   │   ├── LiveStreamEmbed.tsx
│   │   └── PhotoGallery.tsx
│   ├── types.ts
│   └── Page.tsx
│
├── medical-portal/              # MỚI - Portal y tế
│   ├── components/
│   │   ├── InjuryReportForm.tsx
│   │   ├── MedicalCheckForm.tsx
│   │   ├── FirstAidLog.tsx
│   │   ├── EmergencyStopButton.tsx
│   │   └── AthleteMedicalHistory.tsx
│   ├── types.ts
│   └── Page.tsx
│
├── referee-scoring/             # MỚI - Giao diện chấm điểm cho trọng tài (tablet)
│   ├── components/
│   │   ├── CombatScoringPad.tsx # Chấm điểm đối kháng
│   │   ├── FormsScoringPad.tsx  # Chấm điểm quyền
│   │   ├── MatchInfoBar.tsx
│   │   ├── PenaltyButtons.tsx
│   │   ├── ScoreSubmitConfirm.tsx
│   │   └── TimerDisplay.tsx
│   ├── hooks/
│   │   ├── use-scoring-websocket.ts
│   │   └── use-haptic-feedback.ts # MỚI - Vibration for mobile
│   ├── types.ts
│   └── Page.tsx
│
├── notifications/               # MỚI - Notification system
│   ├── components/
│   │   ├── NotificationCenter.tsx
│   │   ├── NotificationBell.tsx
│   │   └── NotificationItem.tsx
│   ├── hooks/
│   │   └── use-notifications.ts
│   ├── types.ts
│   └── provider.tsx
│
└── realtime/                    # MỚI - WebSocket/SSE infrastructure
    ├── RealtimeProvider.tsx
    ├── use-channel.ts
    ├── use-presence.ts
    └── types.ts
```

### 1.2 Tách vct-ui.legacy.tsx thành file riêng

**YÊU CẦU: Mỗi component phải là 1 file riêng biệt, có props interface rõ ràng, có JSDoc documentation.**

Ví dụ cấu trúc mới cho VCT_Button:
```typescript
// packages/app/features/shared/components/VCT_Button.tsx

import { motion } from 'framer-motion'
import type { ReactNode, CSSProperties, MouseEvent } from 'react'

export interface VCT_ButtonProps {
  children?: ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  icon?: ReactNode
  iconRight?: ReactNode          // MỚI
  type?: 'button' | 'submit' | 'reset'
  fullWidth?: boolean            // MỚI
  onClick?: (e: MouseEvent) => void
  title?: string
  'aria-label'?: string          // MỚI - Accessibility
  className?: string
  style?: CSSProperties
}

/** Primary action button with gradient, hover effects, and loading state */
export function VCT_Button(props: VCT_ButtonProps) {
  // ... implementation
}
```

### 1.3 Form Validation với Zod

**YÊU CẦU: Tạo Zod schemas cho TẤT CẢ entities, tích hợp với React Hook Form.**

```typescript
// packages/app/features/shared/utils/validation.ts
import { z } from 'zod'

export const VanDongVienSchema = z.object({
  hoTen: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự').max(100),
  gioiTinh: z.enum(['nam', 'nu']),
  ngaySinh: z.string().refine(v => {
    const age = calculateAge(v)
    return age >= 10 && age <= 60
  }, 'Tuổi phải từ 10-60'),
  canNang: z.number().min(25, 'Cân nặng tối thiểu 25kg').max(150),
  donViId: z.string().min(1, 'Phải chọn đơn vị'),
  noiDungIds: z.array(z.string()).min(1, 'Phải đăng ký ít nhất 1 nội dung'),
  chieuCao: z.number().min(100).max(250).optional(),
})

export const DonViSchema = z.object({ ... })
export const TrongTaiSchema = z.object({ ... })
export const DangKySchema = z.object({ ... })
export const TranDauSchema = z.object({ ... })
export const KhieuNaiSchema = z.object({ ... })
export const TournamentConfigSchema = z.object({ ... })
// ... schemas cho TẤT CẢ entities
```

### 1.4 Page Template System

**YÊU CẦU: Tạo reusable page templates để chuẩn hóa layout cho các loại trang.**

```typescript
// packages/app/features/shared/components/VCT_PageTemplate.tsx

interface PageTemplateListProps {
  title: string
  kpis?: KpiConfig[]
  toolbar?: ReactNode
  bulkActions?: BulkActionItem[]
  children: ReactNode              // Table/List content
  pagination?: PaginationConfig
  emptyState?: EmptyStateConfig
}

// Template cho trang danh sách: KPIs → Toolbar → Content → Pagination
export function VCT_PageTemplate_List(props: PageTemplateListProps) { ... }

// Template cho trang chi tiết: Header → Tabs → Content → Actions
export function VCT_PageTemplate_Detail(props: PageTemplateDetailProps) { ... }

// Template cho form nhiều bước: Stepper → Form → Submit
export function VCT_PageTemplate_Wizard(props: PageTemplateWizardProps) { ... }

// Template cho dashboard: KPIs → Charts → Activity feed
export function VCT_PageTemplate_Dashboard(props: PageTemplateDashboardProps) { ... }
```

---

## 10. PHASE 2 - DATABASE & BACKEND NÂNG CẤP

### 2.1 PostgreSQL Database

**YÊU CẦU: Thay thế hoàn toàn in-memory store bằng PostgreSQL. Viết migration files, models, và repository layer.**

#### Database Schema (Đầy đủ)

```sql
-- migrations/001_initial.sql

-- ============ USERS & AUTH ============

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin','btc','referee_manager','referee','delegate','athlete','medical','media')),
  email VARCHAR(255),
  phone VARCHAR(20),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  access_token_jti VARCHAR(100) UNIQUE NOT NULL,
  refresh_token_jti VARCHAR(100) UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  tournament_code VARCHAR(50),
  operation_shift VARCHAR(10),
  expires_at TIMESTAMPTZ NOT NULL,
  refresh_expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE auth_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  username VARCHAR(50),
  role VARCHAR(20),
  action VARCHAR(50) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ TOURNAMENT ============

CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  level VARCHAR(20) NOT NULL,
  round_number INT DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  registration_deadline DATE,
  location TEXT,
  venue TEXT,
  organizer TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'nhap',
  config JSONB NOT NULL DEFAULT '{}',  -- TournamentConfig as JSONB
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ CONTENT & CATEGORIES ============

CREATE TABLE content_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  ten VARCHAR(200) NOT NULL,
  loai VARCHAR(20) NOT NULL CHECK (loai IN ('quyen','doi_khang')),
  gioi_tinh VARCHAR(10) CHECK (gioi_tinh IN ('nam','nu','chung')),
  lua_tuoi_id UUID,
  so_nguoi INT DEFAULT 1,
  mo_ta TEXT,
  trang_thai VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE weight_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  ten VARCHAR(100) NOT NULL,
  gioi_tinh VARCHAR(5) NOT NULL CHECK (gioi_tinh IN ('nam','nu')),
  lua_tuoi_id UUID,
  can_nang_min DECIMAL(5,1) NOT NULL,
  can_nang_max DECIMAL(5,1) NOT NULL,
  trang_thai VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE age_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  ten VARCHAR(100) NOT NULL,
  tuoi_min INT NOT NULL,
  tuoi_max INT NOT NULL
);

-- ============ TEAMS & ATHLETES ============

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  ten VARCHAR(200) NOT NULL,
  ma_doan VARCHAR(20) NOT NULL,
  loai VARCHAR(20) CHECK (loai IN ('tinh','clb','ca_nhan')),
  tinh_thanh VARCHAR(100),
  lien_he VARCHAR(100),
  sdt VARCHAR(20),
  email VARCHAR(255),
  trang_thai VARCHAR(20) NOT NULL DEFAULT 'nhap',
  docs JSONB DEFAULT '{}',
  fees JSONB DEFAULT '{"total":0,"paid":0,"remaining":0}',
  achievements JSONB DEFAULT '[]',
  delegate_user_id UUID REFERENCES users(id),  -- Linked user account
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  ho_ten VARCHAR(200) NOT NULL,
  gioi_tinh VARCHAR(5) NOT NULL CHECK (gioi_tinh IN ('nam','nu')),
  ngay_sinh DATE NOT NULL,
  can_nang DECIMAL(5,1) NOT NULL,
  chieu_cao DECIMAL(5,1),
  trang_thai VARCHAR(20) NOT NULL DEFAULT 'nhap',
  docs JSONB DEFAULT '{}',
  ghi_chu TEXT,
  avatar_url TEXT,
  user_id UUID REFERENCES users(id),  -- Linked user account for athlete portal
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  content_category_id UUID REFERENCES content_categories(id),
  weight_class_id UUID,
  trang_thai VARCHAR(20) NOT NULL DEFAULT 'cho_duyet',
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ REFEREES ============

CREATE TABLE referees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  ho_ten VARCHAR(200) NOT NULL,
  cap_bac VARCHAR(20) NOT NULL,
  chuyen_mon VARCHAR(20) NOT NULL,
  tinh_thanh VARCHAR(100),
  dien_thoai VARCHAR(20),
  email VARCHAR(255),
  nam_kinh_nghiem INT,
  trang_thai VARCHAR(20) NOT NULL DEFAULT 'cho_duyet',
  ghi_chu TEXT,
  user_id UUID REFERENCES users(id),  -- Linked account
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE referee_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  referee_id UUID REFERENCES referees(id),
  arena_id UUID REFERENCES arenas(id),
  session_date DATE NOT NULL,
  session_shift VARCHAR(10) NOT NULL,
  role VARCHAR(20) DEFAULT 'chinh',  -- chinh, phu, giam_sat
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ ARENAS ============

CREATE TABLE arenas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  ten VARCHAR(200) NOT NULL,
  loai VARCHAR(20) NOT NULL,
  trang_thai VARCHAR(20) NOT NULL DEFAULT 'dong',
  suc_chua INT DEFAULT 0,
  vi_tri TEXT,
  ghi_chu TEXT,
  equipment JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ COMPETITION ============

CREATE TABLE combat_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  content_category_id UUID REFERENCES content_categories(id),
  weight_class_id UUID,
  arena_id UUID REFERENCES arenas(id),
  athlete_red_id UUID REFERENCES athletes(id),
  athlete_blue_id UUID REFERENCES athletes(id),
  vong VARCHAR(50),
  bracket_position INT,
  diem_do JSONB DEFAULT '[]',    -- Score per round: [round1, round2, round3]
  diem_xanh JSONB DEFAULT '[]',
  penalties_red JSONB DEFAULT '[]',
  penalties_blue JSONB DEFAULT '[]',
  ket_qua TEXT,
  nguoi_thang_id UUID REFERENCES athletes(id),
  trang_thai VARCHAR(20) NOT NULL DEFAULT 'chua_dau',
  thoi_gian_bat_dau TIMESTAMPTZ,
  thoi_gian_ket_thuc TIMESTAMPTZ,
  event_log JSONB DEFAULT '[]',   -- [{time, action, detail}]
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE form_performances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  content_category_id UUID REFERENCES content_categories(id),
  arena_id UUID REFERENCES arenas(id),
  athlete_id UUID REFERENCES athletes(id),
  -- Judge scores
  judge_scores JSONB NOT NULL DEFAULT '[]',  -- [{judgeId, score, timestamp}]
  diem_trung_binh DECIMAL(5,2),
  diem_tru_high DECIMAL(5,2),
  diem_tru_low DECIMAL(5,2),
  tong_diem DECIMAL(5,2),
  xep_hang INT,
  trang_thai VARCHAR(20) NOT NULL DEFAULT 'cho_thi',
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE weigh_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  athlete_id UUID REFERENCES athletes(id),
  weight_class_id UUID,
  can_nang_thuc DECIMAL(5,1) NOT NULL,
  ket_qua VARCHAR(20) NOT NULL DEFAULT 'cho_xu_ly',
  thoi_gian TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  nguoi_can VARCHAR(100),
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ SCHEDULE ============

CREATE TABLE schedule_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  ngay DATE NOT NULL,
  buoi VARCHAR(10) NOT NULL CHECK (buoi IN ('sang','chieu','toi')),
  gio_bat_dau TIME NOT NULL,
  gio_ket_thuc TIME NOT NULL,
  arena_id UUID REFERENCES arenas(id),
  content_category_id UUID REFERENCES content_categories(id),
  so_tran INT DEFAULT 0,
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ APPEALS ============

CREATE TABLE appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  loai VARCHAR(20) NOT NULL CHECK (loai IN ('khieu_nai','khang_nghi')),
  team_id UUID REFERENCES teams(id),
  noi_dung TEXT NOT NULL,
  match_id UUID,
  performance_id UUID,
  trang_thai VARCHAR(20) NOT NULL DEFAULT 'moi',
  nguoi_gui VARCHAR(200) NOT NULL,
  thoi_gian_gui TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  nguoi_xu_ly VARCHAR(200),
  ket_luan TEXT,
  thoi_gian_xu_ly TIMESTAMPTZ,
  attachments JSONB DEFAULT '[]',  -- [{url, type, name}]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ MỚI: NOTIFICATIONS ============

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  user_id UUID REFERENCES users(id),
  type VARCHAR(50) NOT NULL,  -- schedule_change, result, appeal_update, weigh_in_reminder...
  title VARCHAR(200) NOT NULL,
  body TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ MỚI: MEDICAL ============

CREATE TABLE medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  athlete_id UUID REFERENCES athletes(id),
  match_id UUID,
  type VARCHAR(50) NOT NULL,  -- pre_check, injury, first_aid, emergency
  description TEXT NOT NULL,
  severity VARCHAR(20),  -- minor, moderate, severe, critical
  action_taken TEXT,
  can_continue BOOLEAN,
  reported_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ MỚI: MEDIA ============

CREATE TABLE media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  uploaded_by UUID REFERENCES users(id),
  type VARCHAR(20) NOT NULL,  -- photo, video, document
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  title VARCHAR(200),
  description TEXT,
  tags JSONB DEFAULT '[]',
  match_id UUID,
  athlete_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ MỚI: AUDIT TRAIL (Data Changes) ============

CREATE TABLE data_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL,  -- create, update, delete
  old_data JSONB,
  new_data JSONB,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ INDEXES ============

CREATE INDEX idx_athletes_tournament ON athletes(tournament_id);
CREATE INDEX idx_athletes_team ON athletes(team_id);
CREATE INDEX idx_registrations_athlete ON registrations(athlete_id);
CREATE INDEX idx_combat_matches_tournament ON combat_matches(tournament_id);
CREATE INDEX idx_combat_matches_status ON combat_matches(trang_thai);
CREATE INDEX idx_form_performances_tournament ON form_performances(tournament_id);
CREATE INDEX idx_schedule_tournament_date ON schedule_entries(tournament_id, ngay);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_data_audit_entity ON data_audit_log(entity_type, entity_id);
CREATE INDEX idx_sessions_user ON sessions(user_id) WHERE revoked_at IS NULL;
```

### 2.2 Backend Go - Nâng cấp

**YÊU CẦU: Tái cấu trúc backend theo clean architecture, thêm PostgreSQL, WebSocket, và tất cả API endpoints mới.**

```
backend/
├── cmd/
│   └── server/main.go
├── internal/
│   ├── config/config.go          # Environment config + DB config
│   ├── database/
│   │   ├── postgres.go           # MỚI - Connection pool (pgxpool)
│   │   ├── migrations/           # MỚI - SQL migration files
│   │   └── migrate.go            # MỚI - Migration runner
│   ├── models/                   # MỚI - Go structs matching DB schema
│   │   ├── user.go
│   │   ├── tournament.go
│   │   ├── team.go
│   │   ├── athlete.go
│   │   ├── match.go
│   │   ├── form_performance.go
│   │   ├── referee.go
│   │   ├── schedule.go
│   │   ├── appeal.go
│   │   ├── notification.go
│   │   ├── medical.go
│   │   └── media.go
│   ├── repository/               # MỚI - Data access layer
│   │   ├── interface.go          # Repository interfaces
│   │   ├── user_repo.go
│   │   ├── tournament_repo.go
│   │   ├── team_repo.go
│   │   ├── athlete_repo.go
│   │   ├── match_repo.go
│   │   ├── schedule_repo.go
│   │   └── ...
│   ├── service/                  # MỚI - Business logic layer
│   │   ├── auth_service.go       # Refactored from auth/service.go
│   │   ├── tournament_service.go
│   │   ├── registration_service.go  # Registration business rules
│   │   ├── scoring_service.go    # MỚI - Scoring engine
│   │   ├── draw_service.go       # MỚI - Draw algorithm
│   │   ├── schedule_service.go   # MỚI - Auto-scheduling
│   │   ├── notification_service.go
│   │   └── export_service.go     # MỚI - PDF/Excel export
│   ├── handler/                  # MỚI - HTTP handlers (renamed from httpapi)
│   │   ├── auth_handler.go
│   │   ├── tournament_handler.go
│   │   ├── team_handler.go
│   │   ├── athlete_handler.go
│   │   ├── match_handler.go
│   │   ├── scoring_handler.go
│   │   ├── schedule_handler.go
│   │   ├── notification_handler.go
│   │   ├── media_handler.go
│   │   ├── export_handler.go
│   │   └── websocket_handler.go  # MỚI
│   ├── middleware/               # MỚI
│   │   ├── auth.go
│   │   ├── cors.go
│   │   ├── logging.go
│   │   ├── ratelimit.go          # MỚI
│   │   └── audit.go              # MỚI - Auto audit trail
│   ├── websocket/                # MỚI
│   │   ├── hub.go                # Connection management
│   │   ├── client.go             # Client wrapper
│   │   ├── channels.go           # Channel subscriptions
│   │   └── messages.go           # Message types
│   └── storage/                  # MỚI
│       ├── s3.go                 # File upload (S3/CloudFlare R2)
│       └── local.go              # Local file storage fallback
├── go.mod
├── go.sum
├── Dockerfile
└── docker-compose.yml            # PostgreSQL + Redis + Backend
```

### 2.3 API Endpoints mới

```
# ============ EXISTING (giữ nguyên) ============
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
GET    /api/v1/auth/me
POST   /api/v1/auth/logout
POST   /api/v1/auth/revoke
GET    /api/v1/auth/audit
GET    /healthz

# Entity CRUD (giữ nguyên pattern, thêm pagination)
GET    /api/v1/{entity}?page=1&limit=20&sort=name&filter[status]=active
POST   /api/v1/{entity}
GET    /api/v1/{entity}/{id}
PATCH  /api/v1/{entity}/{id}
DELETE /api/v1/{entity}/{id}
PUT    /api/v1/{entity}/bulk
POST   /api/v1/{entity}/import
GET    /api/v1/{entity}/export?format=json|csv|pdf|xlsx

# ============ MỚI - SCORING ============
POST   /api/v1/matches/{id}/start          # Bắt đầu trận đấu
POST   /api/v1/matches/{id}/end            # Kết thúc trận đấu
POST   /api/v1/matches/{id}/score          # Gửi điểm (judge)
POST   /api/v1/matches/{id}/penalty        # Ghi nhận lỗi
POST   /api/v1/matches/{id}/timer          # Điều khiển timer

POST   /api/v1/forms/{id}/start            # Bắt đầu lượt thi quyền
POST   /api/v1/forms/{id}/score            # Judge gửi điểm
POST   /api/v1/forms/{id}/finalize         # Kết thúc chấm điểm

# ============ MỚI - DRAW ============
POST   /api/v1/draw/generate               # Tạo sơ đồ bốc thăm
GET    /api/v1/draw/{contentCategoryId}     # Lấy kết quả bốc thăm
POST   /api/v1/draw/{id}/seed              # Đặt seed (hạt giống)

# ============ MỚI - SCHEDULE ============
POST   /api/v1/schedule/auto-generate      # Tự động xếp lịch
POST   /api/v1/schedule/validate           # Kiểm tra conflict
GET    /api/v1/schedule/conflicts           # Danh sách conflict

# ============ MỚI - NOTIFICATIONS ============
GET    /api/v1/notifications               # Lấy notifications
PATCH  /api/v1/notifications/{id}/read     # Đánh dấu đã đọc
POST   /api/v1/notifications/read-all      # Đọc tất cả
POST   /api/v1/notifications/send          # Gửi notification (admin)

# ============ MỚI - MEDICAL ============
POST   /api/v1/medical/report              # Báo cáo y tế
GET    /api/v1/medical/athlete/{id}        # Hồ sơ y tế VĐV
POST   /api/v1/medical/match/{id}/stop     # Dừng trận vì y tế

# ============ MỚI - MEDIA ============
POST   /api/v1/media/upload                # Upload file
GET    /api/v1/media?type=photo&matchId=x  # Lấy media
DELETE /api/v1/media/{id}                  # Xóa media

# ============ MỚI - WEBSOCKET ============
GET    /ws                                 # WebSocket upgrade
# Channels:
#   match:{matchId}        - Live match updates
#   arena:{arenaId}        - Arena status
#   scoring:{matchId}      - Judge scoring
#   notifications:{userId} - Personal notifications
#   public:scoreboard      - Public scoreboard
#   public:bracket:{id}    - Public bracket updates

# ============ MỚI - PUBLIC (no auth) ============
GET    /api/v1/public/scoreboard           # Bảng điểm live
GET    /api/v1/public/bracket/{id}         # Sơ đồ nhánh
GET    /api/v1/public/schedule             # Lịch thi đấu
GET    /api/v1/public/medals               # Bảng huy chương
GET    /api/v1/public/match/{id}           # Chi tiết trận đấu

# ============ MỚI - ATHLETE PORTAL ============
GET    /api/v1/athlete/me                  # Profile VĐV
GET    /api/v1/athlete/schedule            # Lịch cá nhân
GET    /api/v1/athlete/results             # Kết quả cá nhân
GET    /api/v1/athlete/bracket-position    # Vị trí bốc thăm
POST   /api/v1/athlete/appeal              # Gửi khiếu nại
GET    /api/v1/athlete/weigh-in            # Trạng thái cân ký
GET    /api/v1/athlete/badge               # QR badge data

# ============ MỚI - EXPORT/REPORTS ============
GET    /api/v1/reports/medals-summary      # Tổng hợp huy chương
GET    /api/v1/reports/team-ranking        # Xếp hạng đoàn
GET    /api/v1/reports/match-results       # Kết quả thi đấu
POST   /api/v1/reports/generate-pdf        # Tạo PDF report
POST   /api/v1/reports/generate-certificate # Tạo giấy chứng nhận
```

---

## 11. PHASE 3 - REAL-TIME SYSTEM

### 3.1 WebSocket Infrastructure

**YÊU CẦU: Xây dựng hệ thống WebSocket cho real-time scoring, live updates, và notifications.**

#### Backend WebSocket Hub (Go)
```go
// internal/websocket/hub.go

type Hub struct {
  channels   map[string]map[*Client]bool   // channel → clients
  register   chan *Subscription
  unregister chan *Subscription
  broadcast  chan *Message
}

type Message struct {
  Channel string          `json:"channel"`
  Event   string          `json:"event"`     // score_update, match_start, timer_tick, notification
  Data    json.RawMessage `json:"data"`
  SentAt  time.Time       `json:"sentAt"`
}

// Channel patterns:
// match:{matchId}          - Live match events
// arena:{arenaId}          - Arena status changes
// scoring:{matchId}        - Judge score submissions
// forms:{performanceId}    - Form scoring updates
// notifications:{userId}   - Personal notifications
// public:scoreboard        - Public live scoreboard
// public:bracket:{catId}   - Public bracket updates
// timer:{matchId}          - Server-authoritative timer
```

#### Frontend WebSocket Client
```typescript
// packages/app/features/realtime/RealtimeProvider.tsx

interface RealtimeContextValue {
  connected: boolean
  subscribe: (channel: string, handler: (msg: Message) => void) => () => void
  publish: (channel: string, event: string, data: unknown) => void
  presence: (channel: string) => PresenceInfo[]
}

// Usage in components:
const { subscribe } = useRealtime()
useEffect(() => {
  const unsub = subscribe(`match:${matchId}`, (msg) => {
    if (msg.event === 'score_update') updateScore(msg.data)
    if (msg.event === 'timer_tick') updateTimer(msg.data)
    if (msg.event === 'match_end') handleMatchEnd(msg.data)
  })
  return unsub
}, [matchId])
```

### 3.2 Server-Authoritative Timer

**YÊU CẦU: Timer trận đấu phải chạy trên server, broadcast tick qua WebSocket, để tất cả clients đồng bộ.**

```go
// internal/service/timer_service.go

type MatchTimer struct {
  MatchID     string
  Duration    time.Duration  // 120s per round
  Remaining   time.Duration
  Round       int
  Status      string         // running, paused, stopped
  ticker      *time.Ticker
}

// Timer broadcasts every 100ms via WebSocket channel timer:{matchId}
// All clients (referee pad, scoreboard, spectator) receive same time
// Only authorized referee can start/pause/stop timer
```

---

## 12. PHASE 4 - ROLE-BASED PORTALS

### 4.1 Athlete Portal (role: `athlete`)

**YÊU CẦU: Xây dựng hoàn chỉnh portal cho VĐV, mobile-first design.**

#### Routes mới:
```
/athlete                    → Dashboard cá nhân
/athlete/profile            → Hồ sơ, upload ảnh
/athlete/schedule           → Lịch thi đấu cá nhân (filter từ lịch tổng)
/athlete/results            → Kết quả thi đấu (điểm chi tiết)
/athlete/bracket            → Vị trí trên sơ đồ nhánh
/athlete/weigh-in           → Trạng thái cân ký + lịch hẹn
/athlete/appeals            → Gửi & theo dõi khiếu nại
/athlete/badge              → Thẻ VĐV digital (QR code)
/athlete/notifications      → Thông báo
```

#### Tính năng chi tiết:

**Dashboard VĐV:**
- Card "Trận tiếp theo" (thời gian, đối thủ, sàn đấu)
- Trạng thái cân ký (pass/fail/pending)
- Lịch thi đấu hôm nay (timeline)
- Kết quả gần nhất
- Thông báo mới

**Digital Badge (QR):**
- QR code chứa: athleteId, tournamentCode
- Thông tin: Ảnh, họ tên, đoàn, hạng cân, nội dung đăng ký
- Dùng cho check-in tại sàn đấu
- Nhân viên quét QR để xác nhận VĐV

**Gửi khiếu nại:**
- Form: chọn trận đấu, mô tả, upload ảnh/video
- Theo dõi trạng thái (mới → đang xử lý → kết luận)
- Nhận notification khi có kết quả

### 4.2 Spectator Portal (public, no auth)

**YÊU CẦU: Giao diện public không cần đăng nhập, real-time, responsive.**

#### Routes mới:
```
/live                       → Tổng quan giải (public landing page)
/live/scoreboard            → Bảng điểm trực tiếp
/live/bracket/{categoryId}  → Sơ đồ nhánh real-time
/live/schedule              → Lịch thi đấu
/live/medals                → Bảng huy chương
/live/match/{matchId}       → Chi tiết trận đấu
/live/stream                → Embed livestream
```

#### Tính năng chi tiết:

**Public Scoreboard:**
- Cập nhật real-time qua WebSocket (channel: `public:scoreboard`)
- Hiển thị: trận đang diễn ra trên các sàn, điểm số, timer
- Auto-scroll giữa các sàn đấu
- Fullscreen mode cho màn hình LED tại nhà thi đấu
- Sound notification khi có kết quả

**Live Bracket:**
- SVG bracket cập nhật real-time khi có kết quả
- Highlight trận đang đấu (blinking)
- Click vào trận để xem chi tiết
- Responsive: scroll horizontal trên mobile

### 4.3 Medical Portal (role: `medical`)

**YÊU CẦU: Giao diện đơn giản, nhanh, cho nhân viên y tế sử dụng ngay trong tình huống khẩn cấp.**

#### Routes:
```
/medical                    → Dashboard y tế
/medical/pre-check          → Kiểm tra y tế trước giải
/medical/injury-report      → Báo cáo chấn thương
/medical/first-aid          → Nhật ký sơ cứu
/medical/athlete/{id}       → Hồ sơ y tế VĐV
```

#### Tính năng:
- **Emergency Stop Button**: NÚT LỚN MÀU ĐỎ - dừng trận đấu ngay lập tức
  - Gửi signal qua WebSocket → referee pad nhận → timer dừng
  - Ghi nhận lý do, VĐV liên quan
- **Quick Injury Report**: Form nhanh (3 fields: VĐV, mô tả, mức độ)
- **Pre-competition Check**: Checklist y tế cho VĐV trước khi thi đấu

### 4.4 Referee Scoring Pad (role: `referee`) - TABLET OPTIMIZED

**YÊU CẦU: Đây là tính năng QUAN TRỌNG NHẤT. Giao diện tablet cho trọng tài chấm điểm real-time.**

#### Routes:
```
/referee/pad                → Scoring pad chính
/referee/assignments        → Ca trực, trận được phân công
/referee/history            → Lịch sử chấm điểm
```

#### Combat Scoring Pad:
```
+----------------------------------+
|  [HIỆP 1]  [HIỆP 2]  [HIỆP 3] |
|  Timer: 01:45   Arena: Sàn 1    |
+----------------------------------+
|                                  |
|  🔴 NGUYỄN VĂN A                |
|  +------+------+------+         |
|  | +1   | +2   | +3   |         |
|  +------+------+------+         |
|  | -1   | KD   | GAM  |         |  (Knockout, Gamjeom)
|  +------+------+------+         |
|  Score: [  7  ]                  |
|                                  |
|  ──────────────────────────      |
|                                  |
|  🔵 TRẦN VĂN B                  |
|  +------+------+------+         |
|  | +1   | +2   | +3   |         |
|  +------+------+------+         |
|  | -1   | KD   | GAM  |         |
|  +------+------+------+         |
|  Score: [  5  ]                  |
|                                  |
+----------------------------------+
|  [SUBMIT SCORE]  [RESET ROUND]  |
+----------------------------------+
```

#### Forms Scoring Pad (Chấm điểm Quyền):
```
+----------------------------------+
|  VĐV: Phạm Hoàng Nam            |
|  Bài: Ngọc Trản Quyền           |
|  Đoàn: Bình Định                 |
+----------------------------------+
|                                  |
|  ĐIỂM SỐ (0.0 - 10.0)          |
|                                  |
|  +---+---+---+---+---+---+---+  |
|  | 0 | 1 | 2 | 3 | 4 | 5 | 6 | |
|  +---+---+---+---+---+---+---+  |
|  | 7 | 8 | 9 | . | C | ← | → | |
|  +---+---+---+---+---+---+---+  |
|                                  |
|  Điểm của bạn: [ 8.75 ]         |
|                                  |
|  Trừ điểm kỹ thuật:             |
|  [ ] Mất thăng bằng (-0.1)      |
|  [ ] Sai động tác (-0.2)        |
|  [ ] Quên bài (-0.5)            |
|                                  |
+----------------------------------+
|  [ GỬI ĐIỂM ] [ XÁC NHẬN ]     |
+----------------------------------+
```

**Real-time scoring flow:**
1. Trọng tài trưởng bấm "Bắt đầu lượt thi"
2. Server broadcast channel `forms:{performanceId}` → event `start`
3. Mỗi trọng tài nhập điểm trên tablet → POST /api/v1/forms/{id}/score
4. Server nhận đủ điểm (5/5 hoặc 7/7) → tính trung bình, loại cao/thấp
5. Broadcast `score_final` → tất cả client nhận kết quả
6. Hiển thị bảng điểm công khai (spectator view)

---

## 13. PHASE 5 - SCORING ENGINE

### 5.1 Combat Scoring Engine

**YÊU CẦU: Implement đầy đủ logic chấm điểm đối kháng theo quy tắc Võ Cổ Truyền.**

```typescript
// Quy tắc chấm điểm đối kháng:
interface CombatScoringRules {
  roundCount: 3                    // 3 hiệp
  roundDuration: 120               // 120 giây/hiệp
  breakDuration: 60                // 60 giây nghỉ
  judgeCount: 3 | 5                // 3 hoặc 5 trọng tài

  // Điểm
  bodyKick: 1                      // Đá thân
  headKick: 2                      // Đá đầu
  spinning: 3                      // Đá xoay

  // Phạt
  caution: 0                       // Nhắc nhở (không trừ điểm)
  gamjeom: -1                      // Phạt (trừ 1 điểm)
  knockdown: 0                     // Ngã (đánh giá bởi trọng tài)

  // Kết thúc sớm
  knockout: 'TKO'                  // Knock-out
  rsc: 'RSC'                       // Referee Stops Contest
  dsq: 'DSQ'                       // Truất quyền
  withdrawal: 'WDR'               // Bỏ cuộc

  // Quy tắc thắng
  winByPoints: true                // Thắng điểm (tổng 3 hiệp)
  winByKO: true                    // Thắng knock-out
  winByRSC: true                   // Trọng tài dừng trận
  winByDSQ: true                   // Đối phương bị truất
  winByGap: { points: 12, action: 'rsc' }  // Chênh lệch 12 điểm → dừng
}
```

### 5.2 Forms Scoring Engine

**YÊU CẦU: Implement đầy đủ logic chấm điểm Quyền theo quy tắc.**

```typescript
// Quy tắc chấm điểm Quyền:
interface FormsScoringRules {
  judgeCount: 5 | 7
  maxScore: 10.0
  minScore: 0.0
  precision: 0.05                  // Bội số 0.05

  // Tính điểm (5 trọng tài):
  // 1. Loại điểm cao nhất
  // 2. Loại điểm thấp nhất
  // 3. Tính trung bình 3 điểm còn lại

  // Tính điểm (7 trọng tài):
  // 1. Loại 2 điểm cao nhất
  // 2. Loại 2 điểm thấp nhất
  // 3. Tính trung bình 3 điểm còn lại

  // Tie-break: Nếu bằng điểm:
  // 1. So sánh tổng điểm gốc (trước loại)
  // 2. Nếu vẫn bằng: so sánh điểm cao nhất
  // 3. Nếu vẫn bằng: đấu lại (hoặc chia đều)

  // Phạt kỹ thuật:
  penalties: {
    lostBalance: -0.1              // Mất thăng bằng
    wrongMove: -0.2                // Sai động tác
    forgotRoutine: -0.5            // Quên bài
    timeViolation: -0.3            // Vi phạm thời gian
    outOfBounds: -0.1              // Ra ngoài khu vực
  }
}

// Server-side scoring function
function calculateFormsScore(judgeScores: number[], judgeCount: 5 | 7): FormsScoreResult {
  const sorted = [...judgeScores].sort((a, b) => a - b)

  if (judgeCount === 5) {
    // Loại 1 cao nhất, 1 thấp nhất
    const trimmed = sorted.slice(1, -1)  // 3 điểm giữa
    const avg = trimmed.reduce((s, v) => s + v, 0) / trimmed.length
    return {
      diemGiamKhao: judgeScores,
      diemTruHigh: sorted[sorted.length - 1],
      diemTruLow: sorted[0],
      diemTrungBinh: Math.round(avg * 100) / 100,
      tongDiem: Math.round(avg * 100) / 100,
    }
  }

  if (judgeCount === 7) {
    // Loại 2 cao nhất, 2 thấp nhất
    const trimmed = sorted.slice(2, -2)  // 3 điểm giữa
    const avg = trimmed.reduce((s, v) => s + v, 0) / trimmed.length
    return {
      diemGiamKhao: judgeScores,
      diemTruHigh: sorted[sorted.length - 1] + sorted[sorted.length - 2],
      diemTruLow: sorted[0] + sorted[1],
      diemTrungBinh: Math.round(avg * 100) / 100,
      tongDiem: Math.round(avg * 100) / 100,
    }
  }
}
```

### 5.3 Draw Algorithm

**YÊU CẦU: Implement thuật toán bốc thăm đảm bảo công bằng.**

```typescript
// Quy tắc bốc thăm:
// 1. VĐV cùng đoàn KHÔNG gặp nhau ở vòng đầu tiên (nếu có thể)
// 2. Hạt giống (seed) được phân đều các nhánh
// 3. BYE (miễn đấu) ưu tiên cho hạt giống
// 4. Số lượng VĐV tự động round up lên lũy thừa 2 (pad BYEs)

interface DrawConfig {
  athletes: Array<{ id: string; teamId: string; seed?: number }>
  separateTeams: boolean        // Tách đoàn ở vòng đầu
  seedCount: number             // Số hạt giống (0, 2, 4, 8)
}

function generateDraw(config: DrawConfig): BracketMatch[] {
  // 1. Pad to nearest power of 2
  // 2. Place seeds at correct positions (1 vs 2 meet in final)
  // 3. Fill remaining slots with team separation
  // 4. Assign BYEs
  // 5. Return bracket matches
}
```

---

## 14. PHASE 6 - UI/UX NÂNG CẤP

### 6.1 Components mới cần xây dựng

**YÊU CẦU: Tất cả components mới phải tuân thủ design system hiện tại (CSS variables, Framer Motion animations, dark mode support).**

```typescript
// ============ COMPONENTS CẦN THÊM ============

// 1. VCT_DataGrid - Virtualized data grid (thay thế VCT_Table cho danh sách lớn)
interface VCT_DataGridProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  rowHeight?: number
  onRowClick?: (row: T) => void
  onSelectionChange?: (ids: string[]) => void
  sorting?: SortConfig
  onSort?: (sort: SortConfig) => void
  pagination?: { page: number; pageSize: number; total: number }
  onPageChange?: (page: number) => void
  loading?: boolean
  emptyState?: ReactNode
  expandedRowRender?: (row: T) => ReactNode
  stickyHeader?: boolean
}

// 2. VCT_Drawer - Side panel
interface VCT_DrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  position?: 'left' | 'right'
  width?: string | number       // default 480px
}

// 3. VCT_DatePicker
interface VCT_DatePickerProps {
  value?: string                // ISO date
  onChange: (date: string) => void
  min?: string
  max?: string
  locale?: 'vi' | 'en'
}

// 4. VCT_Chart (wrapper cho Recharts)
interface VCT_ChartProps {
  type: 'bar' | 'line' | 'pie' | 'donut' | 'area'
  data: ChartData[]
  xKey: string
  yKeys: string[]
  colors?: string[]
  height?: number
  showLegend?: boolean
  showGrid?: boolean
}

// 5. VCT_Wizard - Multi-step form
interface VCT_WizardProps {
  steps: Array<{ title: string; content: ReactNode; validate?: () => boolean }>
  onComplete: () => void
  onStepChange?: (step: number) => void
}

// 6. VCT_FileUpload
interface VCT_FileUploadProps {
  accept?: string               // 'image/*', '.pdf,.doc'
  multiple?: boolean
  maxSize?: number              // bytes
  onUpload: (files: File[]) => Promise<void>
  preview?: boolean
}

// 7. VCT_QRCode
interface VCT_QRCodeProps {
  value: string
  size?: number
  includeMargin?: boolean
}

// 8. VCT_Tooltip
interface VCT_TooltipProps {
  content: ReactNode
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

// 9. VCT_Dropdown (Action menu)
interface VCT_DropdownProps {
  trigger: ReactNode
  items: Array<{ label: string; icon?: ReactNode; onClick: () => void; danger?: boolean }>
}

// 10. VCT_NotificationBell
interface VCT_NotificationBellProps {
  count: number
  onClick: () => void
}

// 11. VCT_Timeline
interface VCT_TimelineProps {
  events: Array<{ time: string; title: string; description?: string; icon?: ReactNode; color?: string }>
}

// 12. VCT_Calendar
interface VCT_CalendarProps {
  events: CalendarEvent[]
  onDateClick?: (date: string) => void
  onEventClick?: (event: CalendarEvent) => void
  view?: 'month' | 'week' | 'day'
}
```

### 6.2 Design System chuẩn hóa

**YÊU CẦU: Thêm spacing scale, typography scale, breakpoint system chuẩn.**

```css
/* Thêm vào globals.css */

:root {
  /* ============ SPACING SCALE ============ */
  --vct-space-0: 0;
  --vct-space-1: 4px;
  --vct-space-2: 8px;
  --vct-space-3: 12px;
  --vct-space-4: 16px;
  --vct-space-5: 20px;
  --vct-space-6: 24px;
  --vct-space-8: 32px;
  --vct-space-10: 40px;
  --vct-space-12: 48px;
  --vct-space-16: 64px;

  /* ============ TYPOGRAPHY SCALE ============ */
  --vct-font-xs: 11px;
  --vct-font-sm: 13px;
  --vct-font-base: 14px;
  --vct-font-md: 16px;
  --vct-font-lg: 18px;
  --vct-font-xl: 22px;
  --vct-font-2xl: 26px;
  --vct-font-3xl: 32px;

  /* ============ BREAKPOINTS ============ */
  --vct-bp-mobile: 480px;
  --vct-bp-tablet: 768px;
  --vct-bp-laptop: 1024px;
  --vct-bp-desktop: 1280px;
  --vct-bp-wide: 1536px;

  /* ============ Z-INDEX SCALE ============ */
  --vct-z-dropdown: 100;
  --vct-z-sticky: 200;
  --vct-z-drawer: 300;
  --vct-z-modal: 400;
  --vct-z-toast: 500;
  --vct-z-tooltip: 600;

  /* ============ BORDER RADIUS ============ */
  --vct-radius-sm: 6px;
  --vct-radius-md: 10px;
  --vct-radius-lg: 16px;
  --vct-radius-xl: 20px;
  --vct-radius-full: 9999px;
}
```

### 6.3 Accessibility (WCAG 2.1 AA)

**YÊU CẦU:**
- Tất cả interactive elements phải có `aria-label` hoặc visible label
- Color contrast ratio >= 4.5:1 cho text, >= 3:1 cho large text
- Keyboard navigation hoàn chỉnh (Tab, Enter, Escape, Arrow keys)
- Focus trap cho modals/drawers
- Skip-to-content link
- Screen reader announcements cho dynamic content (aria-live)
- Touch targets >= 44x44px trên mobile

---

## 15. PHASE 7 - BUSINESS LOGIC & WORKFLOW

### 7.1 State Machine cho Entity Transitions

**YÊU CẦU: Implement state machine pattern cho tất cả entities có status workflow.**

```typescript
// packages/app/features/shared/utils/state-machine.ts

type StateMachine<State extends string, Action extends string> = {
  transitions: Record<State, Partial<Record<Action, {
    target: State
    guard?: (context: any) => boolean | string  // string = error message
    onTransition?: (context: any) => void
  }>>>
}

// ============ TEAM STATE MACHINE ============
const teamStateMachine: StateMachine<TrangThaiDoan, string> = {
  transitions: {
    nhap: {
      submit: {
        target: 'cho_duyet',
        guard: (team) => {
          if (team.soVDV < 1) return 'Đoàn phải có ít nhất 1 VĐV'
          if (!team.lienHe) return 'Thiếu thông tin liên hệ'
          return true
        }
      }
    },
    cho_duyet: {
      approve: { target: 'da_xac_nhan', guard: (_, user) => ['admin', 'btc'].includes(user.role) },
      request_supplement: { target: 'yeu_cau_bo_sung' },
      reject: { target: 'tu_choi' }
    },
    yeu_cau_bo_sung: {
      resubmit: { target: 'cho_duyet' }
    },
    da_xac_nhan: {
      checkin: { target: 'da_checkin' }
    },
    da_checkin: {},
    tu_choi: {
      resubmit: { target: 'nhap' }
    }
  }
}

// ============ MATCH STATE MACHINE ============
const matchStateMachine = {
  transitions: {
    chua_dau: {
      start: {
        target: 'dang_dau',
        guard: (match) => {
          if (!match.vanDongVienDo || !match.vanDongVienXanh) return 'Thiếu VĐV'
          if (!match.sanDauId) return 'Chưa phân sàn đấu'
          return true
        },
        onTransition: (match) => {
          // Start timer, notify WebSocket
        }
      }
    },
    dang_dau: {
      end: {
        target: 'ket_thuc',
        guard: (match) => {
          if (!match.nguoiThang) return 'Chưa xác định người thắng'
          return true
        },
        onTransition: (match) => {
          // Update bracket, calculate medals, notify
        }
      }
    },
    ket_thuc: {}  // Terminal state
  }
}

// Tương tự cho: VĐV, đăng ký, trọng tài, khiếu nại, cân ký, lượt thi quyền
```

### 7.2 Validation Rules (Business)

**YÊU CẦU: Implement tất cả validation rules nghiệp vụ.**

```typescript
// Registration validation
function validateRegistration(athlete: VanDongVien, event: NoiDungQuyen, weightClass?: HangCan): ValidationResult {
  const errors: string[] = []

  // 1. Tuổi vs hạng tuổi
  const age = calculateAge(athlete.ngaySinh)
  const ageGroup = getAgeGroup(event.luaTuoi)
  if (age < ageGroup.tuoiMin || age > ageGroup.tuoiMax) {
    errors.push(`VĐV ${age} tuổi, hạng tuổi yêu cầu ${ageGroup.tuoiMin}-${ageGroup.tuoiMax}`)
  }

  // 2. Giới tính
  if (event.gioiTinh !== 'chung' && event.gioiTinh !== athlete.gioiTinh) {
    errors.push(`Nội dung chỉ dành cho ${event.gioiTinh === 'nam' ? 'Nam' : 'Nữ'}`)
  }

  // 3. Cân nặng vs hạng cân (cho đối kháng)
  if (event.loai === 'doi_khang' && weightClass) {
    if (athlete.canNang < weightClass.canNangMin || athlete.canNang > weightClass.canNangMax) {
      errors.push(`Cân nặng ${athlete.canNang}kg không thuộc hạng ${weightClass.ten}`)
    }
  }

  // 4. Quota (max events per athlete)
  const currentRegistrations = getRegistrationsByAthlete(athlete.id)
  if (currentRegistrations.length >= config.maxEventsPerAthlete) {
    errors.push(`VĐV đã đăng ký tối đa ${config.maxEventsPerAthlete} nội dung`)
  }

  // 5. Hồ sơ đầy đủ
  if (athlete.trangThai !== 'du_dieu_kien') {
    errors.push('VĐV chưa đủ điều kiện (thiếu hồ sơ)')
  }

  return { valid: errors.length === 0, errors }
}

// Weigh-in validation
function validateWeighIn(athlete: VanDongVien, actualWeight: number, weightClass: HangCan): WeighInResult {
  const tolerance = 0.5  // 0.5kg tolerance
  const passed = actualWeight >= weightClass.canNangMin - tolerance
              && actualWeight <= weightClass.canNangMax + tolerance
  return {
    ketQua: passed ? 'dat' : 'khong_dat',
    canNangThuc: actualWeight,
    deviation: actualWeight - (weightClass.canNangMin + weightClass.canNangMax) / 2
  }
}

// Schedule conflict detection
function detectScheduleConflicts(entries: LichThiDau[]): Conflict[] {
  const conflicts: Conflict[] = []
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      // Same arena, overlapping time
      if (entries[i].sanDauId === entries[j].sanDauId
          && entries[i].ngay === entries[j].ngay
          && isTimeOverlap(entries[i], entries[j])) {
        conflicts.push({ type: 'arena_overlap', entries: [entries[i], entries[j]] })
      }
      // Same athlete in two matches at same time
      // ... check athlete overlap
    }
  }
  return conflicts
}
```

---

## 16. PHASE 8 - REPORTING & EXPORT

### 8.1 Print Templates

**YÊU CẦU: Tạo templates in ấn chuyên nghiệp cho tất cả biểu mẫu giải đấu.**

```
Templates cần xây dựng:
1. Giấy chứng nhận huy chương (A4 landscape, có viền vàng, logo)
2. Thẻ VĐV (badge size, ảnh + QR + thông tin)
3. Biên bản trận đấu đối kháng (A4, bảng điểm chi tiết)
4. Phiếu chấm điểm Quyền (A4, bảng điểm từng trọng tài)
5. Bảng tổng sắp huy chương (A4/A3, xếp hạng đoàn)
6. Lịch thi đấu (A3, theo ngày + sàn)
7. Danh sách VĐV theo đoàn (A4, table)
8. Biên bản họp chuyên môn (A4, minutes template)
9. Biên bản cân ký (A4, table kết quả)
10. Biên bản khiếu nại (A4, form + kết luận)
```

### 8.2 Chart Dashboard

**YÊU CẦU: Thêm charts vào Dashboard và Reports page.**

```
Charts cần xây dựng:
1. Medal distribution by team (bar chart)
2. Athlete count by weight class (bar chart)
3. Match progress over time (area chart)
4. Arena utilization (donut chart)
5. Registration status breakdown (pie chart)
6. Scoring distribution for forms (histogram)
7. Team comparison radar chart
```

### 8.3 PDF Export

**YÊU CẦU: Backend generate PDF cho reports, certificates. Sử dụng library Go PDF (gofpdf hoặc wkhtmltopdf).**

---

## 17. PHASE 9 - MOBILE & OFFLINE

### 9.1 Mobile App Improvements (Expo)

**YÊU CẦU: Nâng cấp app Expo với các tính năng:**
1. Push notifications (expo-notifications)
2. QR Scanner (expo-camera) cho check-in
3. Offline data sync (expo-sqlite + sync queue)
4. Haptic feedback cho scoring pad
5. Biometric auth (expo-local-authentication)

### 9.2 PWA Support

**YÊU CẦU: Thêm Service Worker cho web app:**
1. Cache static assets
2. Offline fallback page
3. Background sync cho scoring data
4. Push notification subscription

---

## 18. PHASE 10 - PRODUCTION READINESS

### 10.1 DevOps & Infrastructure

```yaml
# docker-compose.production.yml
services:
  postgres:
    image: postgres:16
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: vct_platform
      POSTGRES_USER: vct
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  redis:
    image: redis:7-alpine
    # Dùng cho: session cache, rate limiting, WebSocket pub/sub

  backend:
    build: ./backend
    depends_on: [postgres, redis]
    environment:
      DATABASE_URL: postgres://vct:${DB_PASSWORD}@postgres:5432/vct_platform
      REDIS_URL: redis://redis:6379
      VCT_JWT_SECRET: ${JWT_SECRET}

  frontend:
    build: ./apps/next
    depends_on: [backend]
    environment:
      NEXT_PUBLIC_API_BASE_URL: http://backend:18080
      NEXT_PUBLIC_WS_URL: ws://backend:18080/ws

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    # Reverse proxy + SSL termination
```

### 10.2 Monitoring & Observability

**YÊU CẦU:**
1. **Error tracking**: Sentry integration (frontend + backend)
2. **Logging**: Structured logging (JSON) with correlation IDs
3. **Metrics**: Prometheus metrics endpoint
4. **Health checks**: /healthz, /readyz endpoints
5. **Rate limiting**: Per-IP and per-user rate limits

### 10.3 Security Hardening

**YÊU CẦU:**
1. HTTPS everywhere (TLS 1.3)
2. CSRF protection
3. XSS prevention (CSP headers)
4. SQL injection prevention (parameterized queries)
5. Rate limiting on auth endpoints
6. Input sanitization
7. JWT secret rotation support
8. Password hashing (bcrypt, not plaintext comparison)
9. File upload validation (type, size, malware scan)
10. CORS strict mode in production

### 10.4 Testing Strategy

**YÊU CẦU:**
```
Unit tests:
  - Scoring engine (forms + combat) - 100% coverage
  - State machine transitions - all valid/invalid paths
  - Draw algorithm - edge cases (odd numbers, same team)
  - Validation rules - all business rules

Integration tests:
  - Auth flow (login → refresh → logout → revoke)
  - Registration workflow (create team → add athletes → register events)
  - Scoring workflow (start match → score → end → results)
  - WebSocket connections (subscribe → receive → unsubscribe)

E2E tests (Playwright):
  - Full tournament lifecycle
  - Multi-role scenarios (admin creates, delegate registers, referee scores)
  - Public scoreboard updates
  - Mobile responsive layouts
  - Print templates rendering
```

---

## 19. QUY TẮC CODE

### Conventions bắt buộc

1. **TypeScript strict mode** - noUncheckedIndexedAccess, strictNullChecks
2. **Component naming**: `VCT_ComponentName` cho shared, `FeatureName` cho feature-specific
3. **File naming**: PascalCase cho components, kebab-case cho utilities
4. **CSS**: Dùng CSS variables (`var(--vct-*)`) - KHÔNG dùng hardcoded colors
5. **Vietnamese**: Tất cả labels, messages, enums ở UI phải bằng tiếng Việt
6. **Code comments**: Tiếng Việt cho business logic, tiếng Anh cho technical
7. **Git**: Conventional Commits (feat:, fix:, refactor:, docs:)
8. **Error handling**: Luôn có error state, loading state, empty state cho mọi data fetch
9. **Accessibility**: Mọi button/link phải có aria-label, mọi form field phải có label
10. **Performance**: Virtualize lists > 50 items, lazy load images, debounce search
11. **Animation**: Dùng Framer Motion, duration 0.15-0.3s, ease [0.4, 0, 0.2, 1]
12. **State management**: React Context cho global, useState cho local, KHÔNG dùng Redux
13. **Data fetching**: Repository pattern qua useEntityCollection hook
14. **Backend Go**: Standard library net/http, pgx cho PostgreSQL, KHÔNG dùng framework

### Quy tắc giao diện

1. **Dark mode**: Mọi component phải support dark mode qua CSS variables
2. **Responsive**: Mobile-first, breakpoints: 480, 768, 1024, 1280, 1536
3. **Touch targets**: Minimum 44x44px cho mobile
4. **Loading states**: Skeleton loading cho lists, spinner cho actions
5. **Empty states**: Icon + title + description + action button
6. **Error states**: Red border + error message + retry button
7. **Success feedback**: Toast notification (3.5s auto-dismiss)
8. **Transitions**: Smooth page transitions (opacity + y translate)

---

## TÓM TẮT TOÀN BỘ CÔNG VIỆC

### Tổng số features mới cần xây dựng: ~85 items

**Backend:**
- [ ] PostgreSQL migration (18 tables)
- [ ] Repository layer (12 repos)
- [ ] Service layer (8 services)
- [ ] WebSocket hub + channels
- [ ] 30+ new API endpoints
- [ ] Scoring engine (combat + forms)
- [ ] Draw algorithm
- [ ] Auto-schedule engine
- [ ] PDF generation
- [ ] File upload (S3)
- [ ] Notification service
- [ ] Rate limiting + security

**Frontend:**
- [ ] 12 new UI components
- [ ] 4 new portal pages (athlete, spectator, medical, referee-pad)
- [ ] Refactor 20 existing pages into module structure
- [ ] WebSocket client + RealtimeProvider
- [ ] Form validation (Zod + React Hook Form)
- [ ] Chart integration (Recharts)
- [ ] Print templates (10 templates)
- [ ] Notification center
- [ ] Design system chuẩn hóa
- [ ] Accessibility audit + fixes
- [ ] State machine implementation
- [ ] Offline support (Service Worker)

**Mobile:**
- [ ] Push notifications
- [ ] QR Scanner
- [ ] Offline sync
- [ ] Referee scoring pad (tablet)
- [ ] Athlete portal mobile

**DevOps:**
- [ ] Docker Compose production
- [ ] CI/CD pipeline
- [ ] Monitoring (Sentry + Prometheus)
- [ ] SSL/TLS setup
- [ ] Backup strategy

---

## HƯỚNG DẪN SỬ DỤNG PROMPT NÀY

Khi gửi cho AI (Google Gemini hoặc Claude), hãy gửi TỪNG PHASE một:

1. **Bước 1**: Gửi toàn bộ phần "BỐI CẢNH" (sections 1-8) làm context
2. **Bước 2**: Gửi PHASE cụ thể (ví dụ: "Hãy implement Phase 1 - Refactor cấu trúc")
3. **Bước 3**: Yêu cầu code HOÀN CHỈNH cho từng file, bao gồm imports, types, implementations
4. **Bước 4**: Test, review, rồi tiếp tục Phase tiếp theo

**Lưu ý quan trọng:**
- Yêu cầu AI viết code HOÀN CHỈNH, không viết "// ... rest of implementation"
- Yêu cầu AI giữ nguyên conventions hiện tại (VCT_ prefix, CSS variables, Framer Motion)
- Yêu cầu AI viết cả unit tests cho mỗi module
- Kiểm tra TypeScript compile trước khi merge
