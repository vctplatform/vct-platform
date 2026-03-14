---
description: Workflow viết tests cho VCT Platform (unit, integration, E2E Playwright)
---

# /testing — Viết Tests

> Sử dụng khi cần viết unit tests, integration tests, hoặc E2E tests cho project.

// turbo-all

---

## Bước 1: Xác Định Loại Test

| Loại | Scope | Tool | Khi nào dùng |
|------|-------|------|-------------|
| **Unit Test (Go)** | Function/Service | `go test` | Test business logic, validation |
| **Unit Test (TS)** | Component/Hook | vitest/jest | Test UI components, utilities |
| **Integration Test** | API endpoint | `go test` + HTTP | Test handler + service + adapter |
| **E2E Test** | Full user flow | Playwright | Test critical user journeys |

### Chọn test level phù hợp:
```
Business logic → Unit test (Go service)
API contract → Integration test (Go handler)
UI component → Unit test (React)
User flow → E2E test (Playwright)
Bug regression → Unit test at the level of the bug
```

---

## Bước 2: Go Unit Tests

### File Naming
```
backend/internal/domain/{module}/service_test.go
backend/internal/adapter/{module}_pg_repos_test.go
backend/internal/httpapi/{module}_handler_test.go
```

### Table-Driven Tests (preferred)
```go
func TestService_Create(t *testing.T) {
    tests := []struct {
        name    string
        input   CreateInput
        wantErr bool
        errMsg  string
    }{
        {
            name:    "valid input",
            input:   CreateInput{Name: "Test"},
            wantErr: false,
        },
        {
            name:    "empty name",
            input:   CreateInput{Name: ""},
            wantErr: true,
            errMsg:  "name is required",
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            svc := NewService(mockRepo)
            err := svc.Create(context.Background(), &tt.input)
            if (err != nil) != tt.wantErr {
                t.Errorf("Create() error = %v, wantErr %v", err, tt.wantErr)
            }
        })
    }
}
```

### Quy Tắc Go Tests
- ✅ Table-driven tests preferred
- ✅ Test file cùng thư mục với source
- ✅ Test happy path + error cases
- ✅ Mock external dependencies (database, HTTP)
- ✅ Context-aware: truyền `context.Background()` hoặc `context.TODO()`
- ❌ KHÔNG test private functions trực tiếp
- ❌ KHÔNG skip tests — fix hoặc remove

### Chạy Go tests
```bash
# Tất cả tests
cd backend && go test ./...

# Specific package
cd backend && go test ./internal/domain/{module}/...

# Với race detection
cd backend && go test ./... -race

# Với coverage
cd backend && go test ./... -coverprofile=coverage.out
```

---

## Bước 3: E2E Tests (Playwright)

### File Location
```
tests/e2e/{test-name}.spec.ts
```

### Template
```typescript
import { test, expect } from '@playwright/test'

test.describe('{Module} - {Feature}', () => {
  test.beforeEach(async ({ page }) => {
    // Login if needed
    await page.goto('/login')
    // ... setup
  })

  test('should {expected behavior}', async ({ page }) => {
    // Navigate
    await page.goto('/{module}/{page}')
    
    // Assert page loaded
    await expect(page.locator('h1')).toContainText('Expected Title')
    
    // Interact
    await page.click('[data-testid="action-button"]')
    
    // Assert result
    await expect(page.locator('.result')).toBeVisible()
  })
})
```

### Playwright Config
- Config file: `playwright.config.mjs`
- Base URL tham chiếu từ config

### Chạy E2E tests
```bash
# Tất cả E2E tests
npx playwright test --config=playwright.config.mjs

# Specific test file
npx playwright test tests/e2e/{test-name}.spec.ts

# Với UI mode
npx playwright test --ui

# Với headed browser
npx playwright test --headed
```

---

## Bước 4: Test Coverage Strategy

### Những gì PHẢI test
| Area | Coverage Level | Priority |
|------|---------------|----------|
| Business logic (Service) | High | 🔴 Must |
| Input validation | High | 🔴 Must |
| Error handling paths | Medium | 🟠 Should |
| HTTP handlers (happy path) | Medium | 🟠 Should |
| Critical user flows (E2E) | Login, CRUD | 🟠 Should |
| UI components | Low | 🟡 Could |

### Những gì KHÔNG cần test
- Generated code
- Simple getters/setters
- Third-party library internals
- Database schema (tested via migrations)

---

## Bước 5: Verify Tests

```bash
# Go tests
cd backend && go test ./... -race

# E2E tests
npx playwright test --config=playwright.config.mjs
```

Checklist:
- [ ] Tests pass trên clean state
- [ ] Mỗi test case có tên rõ ràng, mô tả behavior
- [ ] Happy path covered
- [ ] Error/edge cases covered
- [ ] Tests không depend vào nhau (independent)
- [ ] Tests không depend vào external services (mock chúng)
- [ ] Không có flaky tests (chạy 3 lần đều pass)
