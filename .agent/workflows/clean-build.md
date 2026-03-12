---
description: Clean all caches and rebuild the entire project from scratch
---

// turbo-all

## Steps

1. Clean frontend caches
```bash
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue .next, .turbo, node_modules\.cache, apps\next\.next, test-results
```

2. Clean Go build cache
```bash
cd backend && go clean -cache
```

3. Reinstall Node dependencies
```bash
npm install
```

4. Download Go dependencies
```bash
cd backend && go mod download
```

5. Build backend
```bash
cd backend && go build ./...
```

6. Build frontend
```bash
npm run build
```

7. Verify with tests
```bash
cd backend && go test ./... -count=1 -short
```
