---
description: Workflow tạo module mới hoàn chỉnh cho VCT Platform (từ BA đến QA)
---

# /add-module — Tạo Module Mới Hoàn Chỉnh

> Sử dụng khi cần tạo một module mới hoàn chỉnh (backend + frontend + migration + i18n).
> Đây là workflow lớn nhất, kết hợp nhiều vai trò (BA → SA → Dev → CTO).

// turbo-all

---

## Bước 1: Phân Tích Requirements (BA)

Đọc skill **vct-ba** (`/.agent/skills/vct-ba/SKILL.md`):

1. Module này thuộc domain nào trong 10 domain của VCT?
   ```
   1. Tổ chức  2. Con người  3. Đào tạo   4. Giải đấu ★
   5. Chấm điểm 6. Xếp hạng  7. Di sản    8. Tài chính
   9. Cộng đồng 10. Admin
   ```
2. Liệt kê entities chính (với attributes + relationships)
3. Liệt kê business rules và regulations liên quan
4. Xác định user roles tương tác với module
5. Viết user stories cho core functionality

---

## Bước 2: Thiết Kế Kiến Trúc (SA)

Đọc skill **vct-sa** (`/.agent/skills/vct-sa/SKILL.md`):

1. **Database Schema** — ERD với tables, columns, relationships
2. **API Contract** — Endpoints list với method, path, request/response
3. **File Structure** — Danh sách files cần tạo:
   ```
   Backend:
   ├── backend/internal/domain/{module}/model.go
   ├── backend/internal/domain/{module}/repository.go
   ├── backend/internal/domain/{module}/service.go
   ├── backend/internal/adapter/{module}_pg_repos.go
   ├── backend/internal/httpapi/{module}_handler.go
   └── backend/migrations/{NNNN}_{module}_*.sql
   
   Frontend:
   ├── packages/shared-types/src/{module}/common.ts
   ├── packages/app/features/{module}/Page_{module}.tsx
   ├── packages/app/features/{module}/Page_{module}_*.tsx
   ├── packages/app/features/{module}/components/
   └── apps/next/pages/{module}/*.tsx  (thin wrappers)
   ```
4. **Dependencies** — Module nào phải hoàn thành trước?
5. Viết implementation plan và request user review

---

## Bước 3: Database Migration

Tạo files migration:
```
backend/migrations/{NNNN}_{module}_tables.sql       — Up
backend/migrations/{NNNN}_{module}_tables_down.sql   — Down
```

Quy tắc SQL:
- `IF NOT EXISTS` / `IF EXISTS` cho idempotent
- UUID primary keys: `gen_random_uuid()`
- Always `created_at` + `updated_at` timestamps
- `snake_case`, plural table names
- Indexes cho foreign keys
- `NOT NULL` by default
- `REFERENCES` với `ON DELETE` policy

---

## Bước 4: Backend — Domain Layer

### 4.1 Model (`domain/{module}/model.go`)
- Define entities matching database schema
- Include DTOs cho request/response
- JSON tags cho serialization

### 4.2 Repository Interface (`domain/{module}/repository.go`)
- CRUD interface methods
- Context-aware (luôn nhận `context.Context`)
- Return errors cho mọi operation

### 4.3 Service (`domain/{module}/service.go`)
- ALL business logic ở đây
- Validation trước khi gọi repository
- Error wrapping: `fmt.Errorf("svc.Method: %w", err)`

---

## Bước 5: Backend — Adapter & Handler

### 5.1 PostgreSQL Adapter (`adapter/{module}_pg_repos.go`)
- Implement repository interface bằng `pgx/v5`
- Parameterized queries only
- Error wrapping

### 5.2 HTTP Handler (`httpapi/{module}_handler.go`)
- Parse request → call service → write response
- KHÔNG chứa business logic
- Input validation

### 5.3 Route Registration (`httpapi/server.go`)
- Thêm handler dependency injection
- Đăng ký routes với auth middleware
- Pattern: `{METHOD} /api/v1/{module}/{resource}`

### 5.4 Verify Backend
```bash
cd backend && go build ./...
cd backend && go vet ./...
```

---

## Bước 6: Frontend — Pages & Components

### 6.1 Tạo page files
```
packages/app/features/{module}/Page_{module}.tsx            — Main page
packages/app/features/{module}/Page_{module}_{sub}.tsx      — Sub pages
packages/app/features/{module}/components/{Component}.tsx    — Components
```

### 6.2 Conventions
- `VCT_` prefix cho tất cả UI components
- `VCT_Icons` cho icons
- `VCT_PageSkeleton` cho loading
- `useI18n()` → `t('key')` cho mọi text
- Try/catch cho API calls
- Error state handling

---

## Bước 7: i18n Keys

Thêm translation keys cho module mới:
- Tiếng Việt (vi) + Tiếng Anh (en)
- Keys cho: page titles, buttons, labels, error messages, descriptions
- Format: `{module}.{sub}.{element}`

---

## Bước 8: Shared Types Sync

File: `packages/shared-types/src/{module}/common.ts`

- TypeScript types PHẢI khớp Go structs
- Export interfaces cho entities, request DTOs, response DTOs
- Cập nhật `index.ts` nếu cần

---

## Bước 9: Route Registration & Sidebar

### 9.1 Next.js Pages (thin wrappers)
```
apps/next/pages/{module}/index.tsx
apps/next/pages/{module}/{sub}.tsx
```

### 9.2 Route Registry
Đăng ký routes trong file config tương ứng.

### 9.3 Sidebar Config
Thêm sidebar entries cho roles có quyền truy cập:
- Icon, label (i18n key), href
- Sub-items nếu có

---

## Bước 10: Quality Review & Verify (CTO)

Đọc skill **vct-cto** (`/.agent/skills/vct-cto/SKILL.md`) và kiểm tra:

### Backend
- [ ] Clean Architecture layers respected
- [ ] No business logic in handlers
- [ ] Error wrapping with context
- [ ] Auth middleware on all protected routes
- [ ] SQL parameterized queries
- [ ] Migration has up + down scripts

### Frontend
- [ ] Code in `packages/app/features/`, NOT `apps/next/pages/`
- [ ] `VCT_` prefix on all components
- [ ] All text uses `t('key')`
- [ ] Loading states with `VCT_PageSkeleton`
- [ ] Both Light + Dark theme verified
- [ ] No `console.log` left

### Build
```bash
cd backend && go build ./...
cd backend && go vet ./...
npm run typecheck
```

### Tạo Walkthrough
Document toàn bộ thay đổi trong walkthrough artifact.
