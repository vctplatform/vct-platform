---
name: vct-qa
description: "VCT Platform quality assurance — test automation, E2E testing (Playwright), test strategies, coverage tracking, and skill self-improvement/evolution."
---

# VCT QA — Quality & Self-Improvement

> Consolidated: qa

## 1. Test Strategy

### Test Pyramid
```
         ┌──────┐
         │ E2E  │ ← Few, critical paths only
         ├──────┤
       │ Integration │ ← API handlers + store
       ├────────────┤
     │   Unit Tests    │ ← Business logic, utils
     └─────────────────┘
```

## 2. Testing by Layer

### Backend (Go)
| Layer | Tool | Coverage Target |
|-------|------|----------------|
| Domain logic | `go test` | 90%+ |
| Handlers | `httptest` | 80%+ |
| Store | testcontainers-go + real PG | 70%+ |
| Integration | `go test -tags=integration` | Critical paths |

### Frontend (Next.js)
| Layer | Tool | Coverage Target |
|-------|------|----------------|
| Utils/hooks | Jest + RTL | 80%+ |
| Components | Jest + RTL | 70%+ |
| Pages | Playwright | Critical flows |
| Visual | Playwright screenshots | Key pages |

### E2E (Playwright)
```typescript
test('athlete registration flow', async ({ page }) => {
  await page.goto('/register');
  await page.fill('[name="fullName"]', 'Nguyễn Văn A');
  await page.selectOption('[name="federation"]', 'hanoi');
  await page.click('button[type="submit"]');
  await expect(page.locator('.success-message')).toBeVisible();
});
```

## 3. Quality Metrics

| Metric | Target | Tool |
|--------|--------|------|
| Unit test coverage | > 80% | Jest/go test |
| E2E pass rate | > 95% | Playwright |
| Bug escape rate | < 5% | Jira |
| Build success rate | > 90% | GitHub Actions |
| Mean time to fix | < 24h | Tracking |

## 4. Test Data

- **Factories**: Create test entities with sensible defaults
- **Fixtures**: Predefined datasets for specific scenarios
- **Cleanup**: Each test cleans up after itself (transaction rollback)
- **NO** production data in tests

## 5. TDD Iron Law (Adapted from superpowers)

> `NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST`

### RED-GREEN-REFACTOR Cycle
1. **RED**: Viết 1 test → Chạy → Confirm FAIL (vì feature chưa có, KHÔNG phải typo)
2. **GREEN**: Viết code TỐI THIỂU để pass → Chạy → Confirm PASS + tests khác vẫn GREEN
3. **REFACTOR**: Clean up, giữ test GREEN → Commit
4. **Repeat**: Next failing test cho feature tiếp

### Enforcement Rules
| Tình huống | Hành động |
|------------|-----------|
| Code trước test | **XÓA CODE**. Viết test trước. Không "giữ tham khảo" |
| Test pass ngay | Test sai — sửa test cho đúng behavior |
| Mock quá nhiều | Design quá coupled — simplify interface |
| "Quá đơn giản để test" | Test mất 30 giây. KHÔNG exception |
| "Test sau cũng được" | Tests-after ≠ TDD. Tests-after biased theo implementation |

### Good Test Qualities
- **Minimal**: 1 behavior. Có "and" trong tên? Split nó
- **Clear**: Tên mô tả behavior, không `test('test1')`
- **Real code**: Không mock trừ khi bất khả kháng (external API, timer)

## 6. Verification Before Completion (Adapted from superpowers)

> `NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE`

### Gate Function (Bắt buộc TRƯỚC mọi claim)
1. **IDENTIFY**: Lệnh nào chứng minh claim?
2. **RUN**: Chạy FULL command (fresh, complete)
3. **READ**: Đọc TOÀN BỘ output, check exit code, đếm failures
4. **VERIFY**: Output confirm claim? → CÓ: Claim kèm evidence | KHÔNG: Báo thực trạng
5. **CHỈ KHI ĐÓ**: Tuyên bố kết quả

### Verification Requirements
| Claim | Yêu cầu | KHÔNG đủ |
|-------|----------|----------|
| Tests pass | Command output: 0 failures | "Should pass" |
| Build clean | Build: exit 0 | Linter pass |
| Bug fixed | Test original symptom: PASS | "Code changed" |
| Requirements met | Line-by-line checklist verified | "Tests pass" |

### Từ ngữ cấm (khi chưa verify)
❌ "should work" / "probably" / "seems to" / "looks correct"
❌ "Great!" / "Done!" / "Perfect!" (trước khi chạy verify)
❌ "I'm confident" (confidence ≠ evidence)

