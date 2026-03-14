---
description: Workflow review chất lượng code cho VCT Platform (CTO role)
---

# /code-review — Review Chất Lượng Code

> Sử dụng khi cần review code quality theo tiêu chuẩn CTO.
> Đọc skill **vct-cto** (`/.agent/skills/vct-cto/SKILL.md`) trước khi bắt đầu.

// turbo-all

---

## Bước 1: Kiểm Tra Clean Architecture

### Backend
- [ ] Domain layer (`domain/`) KHÔNG import adapter hoặc httpapi
- [ ] Business logic nằm trong Service, KHÔNG nằm trong Handler
- [ ] Handler chỉ: parse request → call service → write response
- [ ] Repository interface ở domain, implementation ở adapter
- [ ] Không có circular dependencies

### Frontend
- [ ] Feature code ở `packages/app/features/`, KHÔNG ở `apps/next/pages/`
- [ ] Pages trong `apps/next/pages/` chỉ là thin wrappers
- [ ] Components tái sử dụng ở `packages/ui/`
- [ ] Shared types ở `packages/shared-types/`

---

## Bước 2: Kiểm Tra Coding Standards

### Go Backend Standards
- [ ] Error handling: luôn wrap với context → `fmt.Errorf("ctx: %w", err)`
- [ ] Không dùng `panic()` cho control flow
- [ ] Naming: camelCase private, PascalCase exported, snake_case SQL
- [ ] Package size: max ~500 LOC per file
- [ ] Exported functions có doc comments
- [ ] Imports grouped: stdlib → external → internal

### Frontend Standards
- [ ] Component prefix: `VCT_` cho tất cả components
- [ ] Icons: `VCT_Icons` only, KHÔNG import `lucide-react` trực tiếp
- [ ] i18n: mọi text hiển thị dùng `t('key')`
- [ ] Theme: CSS variable tokens, KHÔNG dùng Tailwind `dark:`
- [ ] Loading: `VCT_PageSkeleton` khi fetch data
- [ ] Error handling: try/catch cho mọi API call
- [ ] File naming: `Page_{module}_{subpage}.tsx`
- [ ] Không có inline styles

### SQL Standards
- [ ] Migration pairs: up.sql + down.sql
- [ ] Idempotent: `IF NOT EXISTS` / `IF EXISTS`
- [ ] Naming: snake_case, plural table names
- [ ] Indexes cho foreign keys
- [ ] `NOT NULL` by default
- [ ] UUIDs: `gen_random_uuid()` default
- [ ] Timestamps: `created_at` + `updated_at`

---

## Bước 3: Kiểm Tra Security

- [ ] Tất cả endpoints có auth middleware (trừ `/healthz`, `/api/v1/auth/login`)
- [ ] Rate limiting trên auth endpoints (5/min)
- [ ] Rate limiting trên API endpoints (100/min)
- [ ] Body size limit (1MB)
- [ ] SQL parameterized queries (KHÔNG string concatenation)
- [ ] Input validation trước mọi database operation
- [ ] Secrets trong env vars (KHÔNG hardcode trong code)
- [ ] Không có TODO comments mà không có tracking issue
- [ ] Không có `console.log` trong production code
- [ ] CORS configured đúng

---

## Bước 4: Kiểm Tra Performance

### Backend
- [ ] CachedStore cho read-heavy entities
- [ ] Connection pooling configured (min 5, max 25)
- [ ] List endpoints có pagination (limit/offset)
- [ ] Indexes cho frequently filtered columns
- [ ] Không có N+1 query problems

### Frontend
- [ ] Skeleton loading cho data fetch
- [ ] Không có unnecessary re-renders
- [ ] Images optimized
- [ ] Bundle size hợp lý
- [ ] Lazy loading cho non-critical pages

---

## Bước 5: Output Quality Report

Tạo report theo format:

```markdown
## 📊 Code Quality Report

### ✅ Passed
- [list of checks that passed]

### ❌ Failed
- [list of checks that failed with details]

### ⚠️ Warnings
- [list of potential issues]

### 🔧 Action Items (prioritized)
1. 🔴 [Critical fixes needed]
2. 🟠 [High priority improvements]
3. 🟡 [Medium priority suggestions]
4. 🟢 [Low priority nice-to-haves]

### ✅ Approval Status
[ ] APPROVED — Code meets all standards
[ ] NEEDS_CHANGES — Fix items above before merge
[ ] REJECTED — Fundamental issues, rework needed
```
