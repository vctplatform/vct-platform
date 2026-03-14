---
description: Run Playwright E2E test suite for VCT Platform
---

// turbo-all

## Steps

1. Ensure dev servers are running (check or start)
```bash
npm run dev:web &
```

2. Install Playwright browsers (if needed)
```bash
npx playwright install --with-deps chromium
```

3. Run all E2E tests
```bash
npx playwright test
```

4. Show test report
```bash
npx playwright show-report
```
