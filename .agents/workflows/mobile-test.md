---
description: Workflow chạy mobile test suite cho VCT Platform — unit, snapshot, E2E Maestro
---

# /mobile-test — Chạy Mobile Test Suite

> Sử dụng khi cần chạy test cho Expo mobile app — unit tests, snapshot tests, E2E flows.

// turbo-all

---

## Bước 1: Unit Tests

```bash
# Chạy tất cả mobile unit tests
npx jest --testPathPattern="mobile.*test" --verbose

# Chạy với coverage report
npx jest --testPathPattern="mobile.*test" --coverage

# Chạy specific test file
npx jest packages/app/features/mobile/__tests__/{file}.test.tsx
```

Kỳ vọng:
- [ ] Tất cả tests pass
- [ ] Không có skipped tests (trừ có lý do documented)
- [ ] Coverage ≥ 70% cho mobile components

---

## Bước 2: TypeScript Check

```bash
# Full TypeScript check cho Expo app
cd apps/expo && npx tsc --noEmit
```

- [ ] Không TypeScript errors
- [ ] Không implicit `any` warnings

---

## Bước 3: Snapshot Tests

```bash
# Chạy snapshot tests
npx jest --testPathPattern="mobile.*snapshot" --verbose
```

Nếu snapshot thay đổi (do UI update có chủ ý):
```bash
# Review changes trước, rồi update
npx jest --testPathPattern="mobile.*snapshot" --updateSnapshot
```

> ⚠️ **KHÔNG** blindly update snapshots. Review TỪNG diff để xác nhận thay đổi đúng ý.

---

## Bước 4: E2E Tests (Maestro)

### Prerequisites
```bash
# Verify Maestro installed
maestro --version

# App đang chạy trên simulator/emulator
cd apps/expo && npx expo start
```

### Chạy E2E
```bash
# Chạy tất cả flows
maestro test tests/mobile/maestro/

# Chạy specific flow
maestro test tests/mobile/maestro/login-flow.yaml

# Record video (for review)
maestro record tests/mobile/maestro/login-flow.yaml
```

- [ ] Login flow pass
- [ ] Navigation flow pass
- [ ] Offline mode flow pass (nếu có)

> Đọc skill **vct-mobile-testing** (`.agents/skills/vct-mobile-testing/SKILL.md`) để viết Maestro flows mới.

---

## Bước 5: Review Coverage

```bash
# Mở coverage report
npx jest --testPathPattern="mobile.*test" --coverage --coverageReporters=html
# Mở file: coverage/index.html
```

### Coverage Targets
| Module | Target |
|--------|--------|
| `mobile-ui.tsx` | ≥ 80% |
| `mobile-theme.tsx` | ≥ 90% |
| `mobile-routes.ts` | ≥ 95% |
| Screen components | ≥ 60% |
| Data hooks | ≥ 70% |

---

## Bước 6: Device Matrix Checklist

### Manual Testing (khi có thay đổi UI lớn)
```
iOS:
  □ iPhone 15 (iOS 17+) — primary
  □ iPhone SE 3rd (iOS 16+) — small screen

Android:
  □ Pixel 7 (Android 14) — primary
  □ Galaxy A14 (Android 13) — budget device

Per device:
  □ App launches OK
  □ Text readable (no truncation)
  □ Touch targets adequate
  □ Dark + Light theme OK
  □ Safe areas respected
  □ Keyboard doesn't overlap input
```

---

## Bước 7: Summary

Tổng hợp kết quả:
- [ ] Unit tests: ✅ all pass / ❌ X failures
- [ ] TypeScript: ✅ clean / ❌ X errors
- [ ] Snapshots: ✅ match / ⚠️ updated (reviewed)
- [ ] E2E: ✅ all flows pass / ❌ X failures
- [ ] Coverage: ✅ meets targets / ⚠️ below targets

---

## Liên Quan

- **Chi tiết test strategy**: Skill `vct-mobile-testing`
- **Performance testing**: Skill `vct-mobile-performance`
- **CI test automation**: Skill `vct-mobile-cicd`
- **Build trước khi test**: Workflow `/build-mobile`
