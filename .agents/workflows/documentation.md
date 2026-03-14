---
description: Workflow viết và cập nhật documentation cho VCT Platform
---

# /documentation — Viết & Cập Nhật Documentation

> Sử dụng khi cần viết docs, API docs, README, hoặc cập nhật tài liệu sau thay đổi.

// turbo-all

---

## Bước 1: Xác Định Loại Documentation

| Loại | Vị trí | Khi nào cần |
|------|--------|------------|
| **README** | `readme.md` (root) | Setup, overview, getting started |
| **API Docs** | `docs/api/` | Endpoint mới, thay đổi API contract |
| **Architecture** | `docs/architecture/` | Quyết định kiến trúc, ADR |
| **Regulation** | `docs/regulations/` | Quy chế, luật thi đấu |
| **Backend README** | `backend/README.md` | Hướng dẫn backend-specific |
| **Changelog** | `CHANGELOG.md` | Mỗi release/sprint |
| **Inline Comments** | Source code | Complex logic, workarounds |

---

## Bước 2: Viết Documentation

### API Documentation Format
```markdown
## {Method} /api/v1/{module}/{resource}

**Description**: [Mô tả endpoint]

**Auth**: Required (Bearer token)
**Roles**: admin, federation_manager

### Request
**Headers**:
- `Authorization: Bearer {token}`
- `Content-Type: application/json`

**Body** (POST/PUT):
```json
{
  "name": "string (required)",
  "description": "string (optional)"
}
```

### Response
**200 OK**:
```json
{
  "id": "uuid",
  "name": "string",
  "created_at": "2026-03-11T00:00:00Z"
}
```

**400 Bad Request**: `{ "error": "validation message" }`
**401 Unauthorized**: `{ "error": "unauthorized" }`
**404 Not Found**: `{ "error": "not found" }`
```

### Architecture Decision Record (ADR) Format
```markdown
# ADR-{NNN}: {Title}

## Status: [Proposed | Accepted | Deprecated | Superseded]

## Context
[Tại sao cần quyết định này?]

## Decision
[Quyết định gì?]

## Consequences
### Positive
- [Lợi ích 1]
### Negative
- [Hạn chế 1]

## Alternatives Considered
1. [Alternative 1] — Rejected because [reason]
```

### Changelog Format
```markdown
## [v0.X.0] — YYYY-MM-DD

### Added
- [Feature mới]

### Changed
- [Thay đổi behavior]

### Fixed
- [Bug đã sửa]

### Removed
- [Feature bị xóa]
```

---

## Bước 3: Inline Code Documentation

### Go Comments
```go
// Service xử lý business logic cho module Athletes.
// Nó validate input, enforce business rules, và gọi repository.
type Service struct {
    repo Repository
}

// Create tạo athlete mới với validation.
// Returns error nếu name trống hoặc belt_level không hợp lệ.
func (s *Service) Create(ctx context.Context, input *CreateInput) (*Athlete, error) {
    // ...
}
```

### TypeScript Comments
```typescript
/**
 * Page hiển thị danh sách quy chế của Liên đoàn.
 * 
 * Data được fetch từ `/api/v1/federation/regulations`
 * và hiển thị dạng table với sorting + filtering.
 */
export function Page_Federation_Regulations() { ... }
```

### Quy tắc:
- ✅ Exported Go functions PHẢI có doc comments
- ✅ Complex logic cần comments giải thích WHY (không phải WHAT)
- ✅ Workarounds cần TODO comment với context
- ❌ KHÔNG comment obvious code (`// increment i` → xoá)
- ❌ KHÔNG để stale comments (update khi code thay đổi)

---

## Bước 4: Verify

Checklist:
- [ ] README chính xác và up-to-date
- [ ] API docs khớp với implementation thực tế
- [ ] Không có stale/outdated sections
- [ ] Links hoạt động (không broken links)
- [ ] Code examples chạy được
- [ ] Bilingual nếu cần (vi + en)
- [ ] `.env.example` documented đầy đủ
- [ ] Architecture decisions recorded (ADR)
