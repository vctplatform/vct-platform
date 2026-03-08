# VCT Platform Monorepo

Nền tảng quản trị giải đấu võ thuật chạy song song:
- Web: Next.js App Router (`apps/next`)
- Mobile: Expo + React Navigation (`apps/expo`)
- Shared app layer: `packages/app`

## Muc tieu san pham

- Quan tri giai dau tu dang ky den ket qua, bang huy chuong, bao cao.
- Dong bo logic nghiep vu giua Web va Expo qua code dung chung trong `packages/app`.
- San sang mo rong backend hybrid qua `EntityRepository` + adapter mock/api.

## Cau truc thu muc

```text
apps/
  next/      # Web app (App Router)
  expo/      # Mobile app (Expo)
packages/
  app/
    features/
      components/  # UI primitives (VCT_*)
      data/        # mock data, types, repositories, export utils
      layout/      # AppShell, Sidebar, RouteRegistry
      mobile/      # Mobile screens (Expo)
      tournament/  # Web modules theo nghiep vu
    navigation/    # Native navigation
    provider/      # Theme, safe-area, navigation providers
scripts/
  run-tests.mjs    # smoke tests
```

## Feature map hien tai

- Cau hinh giai: thong tin giai, noi dung/hang can, san dau.
- Dang ky: don vi, van dong vien, dang ky noi dung.
- Trong tai: danh sach va phan cong.
- Thi dau: hop chuyen mon, boc tham, can ky, doi khang, quyen, bracket, ket qua.
- Tong hop: lich thi dau, huy chuong, khieu nai, bao cao.
- Expo parity: Teams, Athletes, Registration, Results, Schedule.

## Data architecture

`packages/app/features/data/repository` cung cap:

- `EntityRepository<T>` contract:
  - `list/getById/create/update/remove/replaceAll/importItems/exportItems`
- `createMockAdapter`:
  - luu local qua `localStorage` (web) hoac memory fallback
- `createApiAdapter`:
  - khung san sang noi backend

Repositories da co:
- `teams`, `athletes`, `registration`, `results`, `schedule`
- `arenas`, `referees`, `appeals`

## Navigation architecture

- Route source of truth: `packages/app/features/layout/route-registry.ts`
- Dung chung cho:
  - Sidebar group/menu
  - Page title
  - Breadcrumbs
- Co metadata `roles` cho tung route de lam RBAC menu/guard.
- Da mapping day du route web nghiep vu (bao gom `hop-chuyen-mon`).

## RBAC mock layer

- `AuthProvider` trong `packages/app/features/auth` quan ly role hien tai.
- AppShell co role switcher de mo phong quyen:
  - admin
  - btc
  - referee_manager
  - referee
  - delegate
- Route khong du quyen se hien AccessDenied state va dieu huong ve route hop le.

## UI/UX va accessibility baseline

- AppShell responsive: desktop sidebar, mobile drawer.
- Icon buttons da co `aria-label` o cac luong chinh.
- `:focus-visible` global style.
- Modal co `role="dialog"` + `aria-modal`.
- Toast co `role="status"` + `aria-live`.

## Lenh phat trien

Tu root:

```bash
npm run dev         # web dev
npm run dev:web     # web dev
npm run dev:native  # expo dev
npm run lint
npm run typecheck
npm run test
npm run build
npm run ci
```

## Quy trinh chat luong

- CI workflow: `.github/workflows/frontend-ci.yml`
  - typecheck
  - lint
  - smoke tests
  - web build
- Smoke tests script: `scripts/run-tests.mjs`

## Quy uoc code

- Uu tien dung lai UI primitives trong `vct-ui.tsx`.
- Trang nghiep vu su dung repository thay vi clone state cuc bo tu mock arrays.
- Uu tien dung `useToast` tai `packages/app/features/hooks/use-toast.ts` thay vi tu tao `setTimeout` moi man.
- Khi them module moi:
  1. Khai bao route trong `route-registry.ts`
  2. Them page wrapper trong `apps/next/app/*/page.tsx`
  3. Them repository + validator neu co CRUD
  4. Bo sung smoke test/toi thieu

## Huong nang cap tiep theo

- Tach `vct-ui.tsx` thanh nhom component typed theo domain (form/data-display/overlay).
- Thay them cac man con lai sang repository-driven state de dong bo du lieu xuyen module.
- Bo sung test UI theo breakpoint cho AppShell va e2e cho luong nghiep vu chinh.
- Hoan thien `ApiAdapter` voi endpoint contracts de chuyen tu mock sang backend hybrid.
