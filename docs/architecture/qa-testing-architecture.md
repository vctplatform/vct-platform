# VCT Platform QA & Testing Architecture

This document defines the strictly enforced rules for Quality Assurance (QA) and Automated Testing testing strategies across the VCT Platform. Code merged without tests that adhere to these rules is considered broken.

## 1. The VCT Testing Pyramid Strategy
To maximize testing velocity and deployment confidence without creating a brittle test suite, we strictly enforce this distribution ratio:
- **70% Unit Tests**: Fast, totally isolated tests executing solely in memory. No network, no database. Covers Go functions, Next.js pure logic hooks, pure UI components, and state reducers.
- **20% Integration Tests**: Slower tests that cross module boundaries but stay within the application sandbox. Covers React component mounting with Mock HTTP (MSW) or Go HTTP Handlers hitting throw-away isolated databases (e.g., Testcontainers).
- **10% E2E (End-to-End) Tests**: Slow, expensive, but highest-confidence tests. Controls a full browser instance (Playwright) or mobile emulator (Maestro) against a full staging replica environment. Reserved strictly for critical user journeys (e.g., Login -> Register for Tournament).

## 2. Backend Validation Rules (Go 1.26)
- **Table-Driven Tests**: All Go logic must be tested using standard Go table-driven tests (`[]struct{ name string, input any, want any_or_error }`). Do not write linear, manually repeating setups.
- **Strict Mocking via Interfaces**: Business logic (Usecases) MUST NEVER depend on `sql.DB` or concrete repositories directly. They must use strictly defined Go `interface`s, so tests can easily swap in mock implementations.
- **Contract & HTTP Integration**: Using `httptest.NewServer` to test API handlers. Integration tests must spin up isolated databases inside actual Docker containers (via Testcontainers-go); mocking SQL drivers (e.g., `sqlmock`) is banned as it obfuscates real database behavior and leads to fake confidence.

## 3. Frontend Validation Rules (Next.js / React)
- **Logic Isolation**: Pure logic handlers, utility functions, and complex math formatting MUST be extracted outside component files and tested individually with Vitest/Jest.
- **Interaction over State**: Avoid testing React hooks' internal values or components' shallow markup. Tests MUST use `@testing-library/react` and `user-event` to simulate how humans use the interface: querying by visible text/Roles and clicking elements realistically.
- **Network Boundaries Mocking**: React components making `fetch` calls MUST be tested using **Mock Service Worker (MSW)**. The test environment must seamlessly intercept the component's HTTP requests to provide deterministic responses, preventing unstable network reliance.

## 4. End-to-End & Mobile Flow Rules (Playwright / Maestro)
- **Unbreakable Locators**: Absolute ban on using `.css-class-xyz` or XPath paths (`div > div > span`) for element targeting. These break whenever UI architecture changes. Playwright and Maestro MUST rely on semantic attributes: `data-testid="submit-btn"`, W3C ARIA Roles (e.g., `getByRole('button', { name: 'Save' })`), or exact localized text matches.
- **Anti-Flake Wait Assertions**: Never use forced manual timeouts (e.g., `await sleep(5000)`). Tests MUST use native automated wait states (e.g., `expect(locator).toBeVisible()` or Waiting for specific Network Response JSON payloads).
- **Graceful Degradation Tolerances**: Test flows must not fail exclusively because an external tracking/analytics API returned a 500 error. The core business scenario must pass independent of external integrations.

## 5. Continuous Quality Gates (The CI Blockers)
- **Strict Code Coverage Minimal Threshold**: Pull Requests will be systematically rejected by GitHub Actions if the automated Code Coverage calculation for newly added/modified code falls below **80%**. 
- **The Zero Flakes Policy**: If an integration or E2E test randomly fails 1 out of every 10 runs (a "flaky" test), the Developer or QA MUST either immediately fix the race condition, quarantine it (`.skip()`), or permanently delete it. Flaky tests destroy the team's trust in the CD pipeline.
