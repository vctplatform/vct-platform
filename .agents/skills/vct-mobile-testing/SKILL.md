---
name: vct-mobile-testing
description: Mobile testing patterns for VCT Platform. Activate when writing React Native unit tests, setting up Maestro E2E flows, testing mobile UI components, defining device test matrices, mocking network for offline tests, testing accessibility (VoiceOver/TalkBack), or creating mobile test strategies.
---

# VCT Mobile Testing

> **When to activate**: Writing mobile unit/integration tests, E2E flows with Maestro, device matrix testing, mobile accessibility testing, snapshot testing, or defining mobile test strategy.

---


> [!IMPORTANT]
> **SUPREME ARCHITECTURE DIRECTIVE**: You are strictly bound by the 19 architecture pillars documented in `docs/architecture/`. As a VCT AI Agent, your absolute highest priority is 100% compliance with these rules. You MUST NOT generate code, propose designs, or execute workflows that violate these foundational rules. They are unchangeable and strictly enforced.

## 1. Role Definition

You are the **Mobile Test Engineer** for VCT Platform. You ensure the Expo/React Native mobile app works correctly across devices, OS versions, and network conditions.

### Core Principles
- **Test pyramid** — many unit tests, fewer integration, minimal E2E
- **Platform parity** — test on both iOS and Android
- **Real conditions** — test offline, slow network, low memory
- **Accessibility** — VoiceOver/TalkBack validation on every screen
- **Regression prevention** — snapshot tests for UI, contract tests for API

---

## 2. Test Stack

> **CRITICAL RULE**: ALL mobile testing strategies MUST strictly adhere to the authoritative rules defined in `docs/architecture/mobile-architecture.md` and `docs/architecture/qa-testing-architecture.md`. You must enforce unbreakable locators via `testID` and ban implementation detail testing.

> **CRITICAL RULE**: Mobile testing (Expo/React Native) MUST strictly comply with the authoritative rules defined in `docs/architecture/qa-testing-architecture.md`. This includes semantic locators (A11y Roles/"data-testid" vs XPath), automated state waiting (no sleep), and MSW offline-mocking strategies.

| Tool | Purpose | Location |
|------|---------|----------|
| Jest | Unit test runner | Monorepo root `vitest.config.ts` or Jest config |
| @testing-library/react-native | Component testing | `packages/app/features/mobile/__tests__/` |
| Maestro | E2E flows (no native deps) | `tests/mobile/maestro/` |
| Snapshot testing | UI regression | `__tests__/__snapshots__/` |

---

## 3. Unit Testing Patterns

### Component Test
```tsx
// packages/app/features/mobile/__tests__/mobile-ui.test.tsx
import { render, screen, fireEvent } from '@testing-library/react-native'
import { Badge, SearchBar, SkillBar } from '../mobile-ui'

describe('Badge', () => {
  it('renders label and color', () => {
    render(<Badge label="Huyền đai" bg="#10b981" fg="#fff" />)
    expect(screen.getByText('Huyền đai')).toBeTruthy()
  })

  it('renders with icon when provided', () => {
    render(<Badge label="Active" bg="#22d3ee" fg="#fff" icon="trophy" />)
    expect(screen.getByText('Active')).toBeTruthy()
  })
})

describe('SearchBar', () => {
  it('calls onChangeText when typing', () => {
    const onChangeText = jest.fn()
    render(<SearchBar value="" onChangeText={onChangeText} />)
    fireEvent.changeText(screen.getByLabelText('Tìm kiếm...'), 'Nguyễn')
    expect(onChangeText).toHaveBeenCalledWith('Nguyễn')
  })

  it('shows clear button when value is not empty', () => {
    render(<SearchBar value="test" onChangeText={() => {}} />)
    expect(screen.getByLabelText('Xóa tìm kiếm')).toBeTruthy()
  })
})
```

### Hook Test
```tsx
// Testing hooks with renderHook
import { renderHook, act } from '@testing-library/react-native'
import { useThemeColors } from '../mobile-theme'
import { MobileThemeProvider } from '../mobile-theme'

describe('useThemeColors', () => {
  it('defaults to dark mode', () => {
    const { result } = renderHook(() => useThemeColors(), {
      wrapper: MobileThemeProvider,
    })
    expect(result.current.isDark).toBe(true)
    expect(result.current.colors.bgBase).toBe('#0b1120')
  })

  it('toggles theme', () => {
    const { result } = renderHook(() => useThemeColors(), {
      wrapper: MobileThemeProvider,
    })
    act(() => result.current.toggleTheme())
    expect(result.current.isDark).toBe(false)
  })
})
```

### Route Test
```tsx
// Testing mobile routes
import { canAccessMobileRoute, getAccessibleMobileRoutes } from '../mobile-routes'

describe('mobile-routes', () => {
  it('admin can access admin routes', () => {
    expect(canAccessMobileRoute('admin', 'admin')).toBe(true)
  })

  it('athlete cannot access admin routes', () => {
    expect(canAccessMobileRoute('admin', 'athlete')).toBe(false)
  })

  it('returns filtered routes by role', () => {
    const routes = getAccessibleMobileRoutes('athlete')
    routes.forEach(route => {
      expect(route.groupId).not.toBe('admin')
    })
  })
})
```

---

## 4. Snapshot Testing

### Component Snapshots
```tsx
import { render } from '@testing-library/react-native'
import { StatCard, EmptyState, ScreenSkeleton } from '../mobile-ui'

describe('Mobile UI Snapshots', () => {
  it('StatCard matches snapshot', () => {
    const tree = render(
      <StatCard icon="trophy" label="Giải đấu" value={42} color="#22d3ee" />
    )
    expect(tree.toJSON()).toMatchSnapshot()
  })

  it('EmptyState matches snapshot', () => {
    const tree = render(
      <EmptyState icon="inbox" title="Chưa có dữ liệu" message="Thêm dữ liệu mới" />
    )
    expect(tree.toJSON()).toMatchSnapshot()
  })

  it('ScreenSkeleton matches snapshot', () => {
    const tree = render(<ScreenSkeleton />)
    expect(tree.toJSON()).toMatchSnapshot()
  })
})
```

### Updating Snapshots
```bash
# Update all snapshots after intentional UI changes
npx jest --updateSnapshot

# Update specific snapshot
npx jest mobile-ui.test --updateSnapshot
```

> ⚠️ **Rule**: Review ALL snapshot diffs before committing. Never blindly update.

---

## 5. Maestro E2E Flows

### Setup
```bash
# Install Maestro CLI
curl -Ls "https://get.maestro.mobile.dev" | bash

# Verify installation
maestro --version
```

### Example Flow: Login + Profile
```yaml
# tests/mobile/maestro/login-flow.yaml
appId: com.vctplatform.app
---
- launchApp
- assertVisible: "VCT Platform"

# Login
- tapOn: "Đăng nhập"
- tapOn:
    id: "username-input"
- inputText: "athlete01"
- tapOn:
    id: "password-input"
- inputText: "password123"
- tapOn: "Đăng nhập"

# Verify dashboard loaded
- assertVisible: "Trang chủ"
- assertVisible:
    id: "stats-section"
```

### Example Flow: Offline Mode
```yaml
# tests/mobile/maestro/offline-mode.yaml
appId: com.vctplatform.app
---
- launchApp
- assertVisible: "Trang chủ"

# View profile while online
- tapOn: "Hồ sơ"
- assertVisible: "Thông tin cá nhân"

# Toggle airplane mode (device-level)
- setAirplaneMode: true
- assertVisible: "Đang dùng dữ liệu offline"

# Verify cached data still visible
- assertVisible: "Thông tin cá nhân"

# Restore network
- setAirplaneMode: false
```

### Running Maestro Tests
```bash
# Run single flow
maestro test tests/mobile/maestro/login-flow.yaml

# Run all flows
maestro test tests/mobile/maestro/

# Run on specific device
maestro test --device "iPhone 15" tests/mobile/maestro/

# Record test run as video
maestro record tests/mobile/maestro/login-flow.yaml
```

---

## 6. Device Test Matrix

### Required Devices

| Platform | Devices | OS Version | Priority |
|----------|---------|------------|----------|
| **iOS** | iPhone 15 (6.1") | iOS 17+ | P0 |
| **iOS** | iPhone SE 3rd (4.7") | iOS 16+ | P1 |
| **iOS** | iPad Air (10.9") | iPadOS 17+ | P2 |
| **Android** | Pixel 7 (6.3") | Android 14 | P0 |
| **Android** | Samsung Galaxy A14 (6.6") | Android 13 | P1 |
| **Android** | Samsung Tab A8 (10.5") | Android 12 | P2 |

### Screen Size Matrix
```
P0 (must pass): 375×812, 393×873, 360×780
P1 (should pass): 320×568, 414×896
P2 (nice to have): 768×1024, 810×1080
```

### Test Checklist Per Device
```
□ App launches without crash
□ Navigation between all tabs works
□ Text is readable (no truncation, no overlap)
□ Touch targets ≥ 44×44 points
□ Gestures work (swipe, pull-to-refresh)
□ Keyboard doesn't overlap inputs
□ Dark/Light theme renders correctly
□ Status bar content visible
□ Safe area respected (notch, home indicator)
□ Orientation lock works (portrait)
```

---

## 7. Accessibility Testing

### VoiceOver (iOS)
```
Manual checklist:
□ Every interactive element has accessibilityLabel
□ accessibilityRole set correctly (button, tab, header, etc.)
□ accessibilityHint describes outcomes
□ accessibilityState reflects current state (selected, disabled)
□ Tab order follows visual layout
□ No inaccessible custom gestures (provide alternatives)
□ Dynamic content announces changes (accessibilityLiveRegion)
```

### TalkBack (Android)
```
Manual checklist:
□ Same as VoiceOver list above
□ importantForAccessibility set on decorative elements ("no")
□ Focus order logical for RTL readers
□ Content descriptions on all meaningful images
```

### Automated A11y Checks
```tsx
// Using jest-native matchers
import { render } from '@testing-library/react-native'

it('ScreenHeader has proper accessibility', () => {
  const { getByRole, getByLabelText } = render(
    <ScreenHeader title="Hồ sơ" subtitle="Thông tin" onBack={() => {}} />
  )
  expect(getByRole('header')).toBeTruthy()
  expect(getByLabelText('Quay lại')).toBeTruthy()
})
```

---

## 8. Network Mocking

### MSW for React Native
```tsx
// tests/mobile/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:18080'

export const handlers = [
  http.get(`${API_BASE}/api/v1/auth/me`, () => {
    return HttpResponse.json({
      id: 'test-user-id',
      username: 'athlete01',
      display_name: 'Nguyễn Văn A',
      role: 'athlete',
    })
  }),

  http.get(`${API_BASE}/api/v1/athletes/:id`, ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'Nguyễn Văn A',
      belt: 'Huyền đai nhị đẳng',
      club: 'CLB Bình Định',
    })
  }),
]
```

### Offline Simulation
```tsx
import NetInfo from '@react-native-community/netinfo'

// In test setup
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({
    isConnected: false,
    isInternetReachable: false,
  })),
}))
```

---

## 9. Test File Organization

```
packages/app/features/mobile/
├── __tests__/
│   ├── mobile-ui.test.tsx         # Component unit tests
│   ├── mobile-theme.test.tsx      # Theme tests
│   ├── mobile-routes.test.tsx     # Route config tests
│   └── __snapshots__/             # Snapshot files
│       └── mobile-ui.test.tsx.snap
│
tests/mobile/
├── maestro/                        # E2E flows
│   ├── login-flow.yaml
│   ├── profile-flow.yaml
│   ├── offline-mode.yaml
│   └── tournament-flow.yaml
└── mocks/
    └── handlers.ts                 # API mock handlers
```

---

## 10. Test Commands

```bash
# Run all mobile unit tests
npx jest --testPathPattern="mobile.*test"

# Run with coverage
npx jest --testPathPattern="mobile.*test" --coverage

# Watch mode during development
npx jest --testPathPattern="mobile.*test" --watch

# Run Maestro E2E
maestro test tests/mobile/maestro/

# Update snapshots
npx jest --testPathPattern="mobile.*test" --updateSnapshot

# TypeScript check
cd apps/expo && npx tsc --noEmit
```

---

## 11. Output Format

Every Mobile Testing output must include:

1. **🧪 Test Type** — Unit / Integration / E2E / Snapshot
2. **📱 Platform Coverage** — iOS, Android, or both
3. **📊 Coverage Metrics** — Lines, branches, functions
4. **🔴 Failures** — Failed tests with reproduction steps
5. **♿ A11y Status** — Accessibility compliance results

---

## 12. Cross-Reference to Other Roles

| Situation | Consult |
|---|---|
| Building test binaries | → **vct-mobile-build** |
| CI test pipeline | → **vct-mobile-cicd** |
| Testing offline features | → **vct-mobile-offline** |
| Performance test benchmarks | → **vct-mobile-performance** |
| Test strategy & planning | → **vct-qa** |
| API contract validation | → **vct-api-testing** |
