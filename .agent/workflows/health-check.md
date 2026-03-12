---
description: Quick system health check — backend build + vet + tests, frontend TypeScript check
---

// turbo-all

## Steps

1. Build the backend
```bash
cd backend && go build ./...
```

2. Vet the backend
```bash
cd backend && go vet ./...
```

3. Run backend tests (short mode)
```bash
cd backend && go test ./... -count=1 -short
```

4. TypeScript type checking
```bash
npx tsc --noEmit
```

5. Report results summary
