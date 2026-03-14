---
description: Workflow build và deployment verification cho VCT Platform
---

# /deploy — Build & Deployment Verification

> Sử dụng khi cần kiểm tra build, chuẩn bị deploy, hoặc verify production readiness.

// turbo-all

---

## Bước 1: TypeScript Typecheck

```bash
npm run typecheck
```

- Fix tất cả TypeScript errors
- Kiểm tra `packages/shared-types/` sync với Go structs
- Đảm bảo không có `any` type không cần thiết

---

## Bước 2: Go Backend Build & Quality

```bash
# Build
cd backend && go build ./...

# Vet (static analysis)
cd backend && go vet ./...

# Test
cd backend && go test ./...
```

Checklist:
- [ ] Build thành công không errors
- [ ] Vet không warnings
- [ ] Tests pass
- [ ] Không có hardcoded secrets trong code
- [ ] Environment variables documented trong `.env.example`

---

## Bước 3: Frontend Build

```bash
npm run build
```

Checklist:
- [ ] Build thành công
- [ ] Không có unused imports warnings
- [ ] Bundle size hợp lý (< 200KB gzipped cho initial)
- [ ] Tất cả pages render được
- [ ] Không có missing i18n keys

---

## Bước 4: Docker Build (nếu cần)

```bash
# Build backend container
docker build -t vct-backend ./backend

# Full stack
docker compose build
```

Checklist:
- [ ] Docker images build thành công
- [ ] Multi-stage build tối ưu size
- [ ] Health check endpoint `/healthz` hoạt động
- [ ] Environment variables mapped đúng

---

## Bước 5: Pre-Deploy Checklist

### Code Quality
- [ ] TypeScript compilation: PASS
- [ ] Go build + vet: PASS
- [ ] Go tests: PASS
- [ ] No `console.log` in production code
- [ ] No `TODO` without tracking issue
- [ ] No hardcoded secrets

### Database
- [ ] Migrations tested (up + down)
- [ ] Seeds run correctly
- [ ] No breaking schema changes without migration

### Configuration
- [ ] `.env.example` updated cho variables mới
- [ ] `docker-compose.yml` updated nếu thêm services
- [ ] CORS origins configured cho target environment

### Security
- [ ] Auth middleware on all protected routes
- [ ] Rate limiting enabled
- [ ] JWT secret configured (not default)
- [ ] HTTPS enforced (production)

### Documentation
- [ ] README updated nếu có thay đổi setup
- [ ] API changes documented
- [ ] Changelog updated

### Final Sign-off
```
□ Backend build: PASS/FAIL
□ Frontend build: PASS/FAIL
□ Docker build: PASS/FAIL
□ Migrations: PASS/FAIL
□ Security review: PASS/FAIL
□ Ready to deploy: YES/NO
```

---

## Bước 6: Platform-Specific Checks

### Vercel (Frontend)
- [ ] `NEXT_PUBLIC_API_BASE_URL` set đúng (không có `/api/v1`)
- [ ] Không có secrets trong NEXT_PUBLIC_* vars
- [ ] Preview deployment test OK

### Render / Fly.io (Backend)
- [ ] VCT_CORS_ORIGINS chứa production frontend URL
- [ ] VCT_POSTGRES_URL kết nối được
- [ ] VCT_JWT_SECRET khác default
- [ ] Health check: `/healthz` trả về 200
- [ ] Anti-cold-start cron configured (Render free tier)

### Neon (Database)
- [ ] Migrations backward-compatible
- [ ] Snapshot/branch ready cho rollback

> 💡 Xem chi tiết: sử dụng workflow `/deploy-production`
