---
description: Workflow phát triển tính năng full-stack end-to-end cho VCT Platform
---

# /new-feature — Phát triển Tính Năng Full-Stack

> Sử dụng khi cần phát triển một tính năng mới từ đầu đến cuối (backend + frontend).

// turbo-all

---

## Bước 1: Phân Tích Yêu Cầu (BA)

Đọc skill **vct-ba** (`/.agent/skills/vct-ba/SKILL.md`) và thực hiện:

1. Xác định rõ yêu cầu:
   - WHO — user role nào sử dụng? (admin, athlete, coach, referee, etc.)
   - WHAT — tính năng cụ thể là gì?
   - WHY — giá trị business?
   - WHERE — thuộc module nào?
2. Viết User Story theo format:
   ```
   As a [role], I want to [action], so that [business value].
   ```
3. Liệt kê Acceptance Criteria rõ ràng
4. Kiểm tra regulation nếu liên quan (`docs/regulations/`)
5. Xác định dependencies với các module khác

**Output**: User story + acceptance criteria trong implementation_plan.md

---

## Bước 2: Thiết Kế Kiến Trúc (SA)

Đọc skill **vct-sa** (`/.agent/skills/vct-sa/SKILL.md`) và thực hiện:

1. Xác định cần tạo/sửa những file nào
2. Thiết kế database schema (nếu cần bảng mới):
   - UUID primary keys, `created_at` + `updated_at`
   - Snake_case, plural table names
   - Indexes cho foreign keys
3. Thiết kế API contract:
   ```
   GET    /api/v1/{module}/       → List
   POST   /api/v1/{module}/       → Create
   GET    /api/v1/{module}/{id}   → Get
   PUT    /api/v1/{module}/{id}   → Update
   DELETE /api/v1/{module}/{id}   → Delete
   ```
4. Xác định frontend pages/components cần tạo
5. Viết implementation plan và request user review

**Output**: Implementation plan với file list, API contract, DB schema

---

## Bước 3: Backend Implementation

Thực hiện theo thứ tự Clean Architecture:

### 3.1 Database Migration
```
backend/migrations/{NNNN}_{description}.sql      — Up migration
backend/migrations/{NNNN}_{description}_down.sql  — Down migration
```
- Sử dụng `IF NOT EXISTS` / `IF EXISTS`
- UUIDs: `gen_random_uuid()` default
- Always `NOT NULL` trừ khi có lý do

### 3.2 Domain Layer
```
backend/internal/domain/{module}/model.go      — Entities + DTOs
backend/internal/domain/{module}/repository.go — Repository interface
backend/internal/domain/{module}/service.go    — Business logic
```
- Domain models là source of truth
- Service chứa business logic, KHÔNG đặt trong handler
- Repository interface để decouple storage

### 3.3 Adapter Layer
```
backend/internal/adapter/{module}_pg_repos.go — PostgreSQL implementation
```
- Dùng `pgx/v5` trực tiếp, KHÔNG dùng ORM
- Parameterized queries only (chống SQL injection)
- Wrap errors: `fmt.Errorf("context: %w", err)`

### 3.4 HTTP Handler
```
backend/internal/httpapi/{module}_handler.go — HTTP handlers
```
- Handlers chỉ parse request → gọi service → format response
- KHÔNG đặt business logic trong handler
- Đăng ký routes trong `server.go`
- Áp dụng auth middleware cho protected routes

### 3.5 Verify Backend
```bash
cd backend && go build ./...
cd backend && go vet ./...
```

---

## Bước 4: Frontend Implementation

### 4.1 Shared Types
```
packages/shared-types/src/{module}/common.ts — TypeScript types khớp Go structs
```

### 4.2 Page Component
```
packages/app/features/{module}/Page_{module}_{sub}.tsx
```
- Sử dụng `VCT_` prefix cho components
- Import icons từ `VCT_Icons` only
- Loading state: `VCT_PageSkeleton`
- Error handling: try/catch với error state

### 4.3 Route Registration
- Đăng ký route trong `route-registry.ts`
- Thêm sidebar entry trong config tương ứng
- Tạo page file trong `apps/next/pages/` (thin wrapper)

### 4.4 i18n Keys
- Thêm keys cho **cả vi và en**
- Sử dụng `useI18n()` hook → `t('key')`
- KHÔNG hardcode text

### 4.5 Styling
- Sử dụng CSS variable tokens từ design system
- KHÔNG dùng Tailwind `dark:` modifier
- KHÔNG inline styles
- Kiểm tra cả Light và Dark theme
- Responsive layout

---

## Bước 5: Kiểm Tra Chất Lượng (CTO)

Đọc skill **vct-cto** (`/.agent/skills/vct-cto/SKILL.md`) và kiểm tra:

### Backend Checklist
- [ ] Clean Architecture respected
- [ ] Business logic NOT in handlers
- [ ] Error wrapping with context
- [ ] Auth middleware applied
- [ ] Input validation
- [ ] SQL parameterized queries
- [ ] No hardcoded secrets

### Frontend Checklist
- [ ] Feature code in `packages/app/features/`, NOT in `apps/next/pages/`
- [ ] Using `@vct/ui` components with `VCT_` prefix
- [ ] All text uses `t('key')`
- [ ] Loading states with skeletons
- [ ] No `console.log` in production code
- [ ] Both themes verified

---

## Bước 6: Build Verification

Chạy các lệnh kiểm tra:

```bash
# Backend
cd backend && go build ./...
cd backend && go vet ./...

# Frontend
npm run typecheck
```

Sửa tất cả errors trước khi hoàn thành.

---

## Bước 7: Tạo Walkthrough

Tạo walkthrough artifact ghi lại:
1. Những gì đã thay đổi (files created/modified)
2. Screenshots/recordings nếu có UI
3. Kết quả verify
4. Lưu ý cho user
