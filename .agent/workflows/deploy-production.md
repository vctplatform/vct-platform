---
description: Workflow triển khai production thực tế — Vercel (frontend) + Render/Fly.io (backend) + Neon (database)
---

# /deploy-production — Deploy Lên Production

> Sử dụng khi cần deploy ứng dụng lên môi trường production/staging thực tế.

// turbo-all

---

## Bước 1: Pre-Deploy Verification

```bash
# Backend build & quality
cd backend && go build ./...
cd backend && go vet ./...

# Frontend typecheck
npm run typecheck
```

> ⚠️ **KHÔNG deploy nếu build fail.** Fix trước, deploy sau.

---

## Bước 2: Environment Variables Check

### Vercel (Frontend)
```
□ NEXT_PUBLIC_API_BASE_URL = https://vct-platform-api.fly.dev  (KHÔNG có /api/v1)
□ Không có secrets lộ ra frontend (chỉ NEXT_PUBLIC_* vars)
```

### Render / Fly.io (Backend)
```
□ VCT_POSTGRES_URL = postgres://...@neon.tech/neondb?sslmode=require
□ VCT_CORS_ORIGINS = https://vct-platform.vercel.app,http://localhost:3000
□ VCT_JWT_SECRET = <strong-random-secret>
□ VCT_STORAGE_DRIVER = postgres
□ VCT_DB_AUTO_MIGRATE = true
□ VCT_REDIS_URL = rediss://...@upstash-redis.com:6379
□ VCT_ADMIN_USERNAME = admin
□ VCT_ADMIN_PASSWORD = <secure-password>
□ PORT = 18080  (hoặc theo platform yêu cầu)
```

> ⚠️ **Common pitfall**: `NEXT_PUBLIC_API_BASE_URL` KHÔNG được chứa `/api/v1` — apiClient frontend tự thêm prefix.

---

## Bước 3: Database Migration Check

```bash
# Kiểm tra migrations mới
ls -la backend/migrations/ | tail -5

# Verify migration backward-compatible
# DOWN migration phải tồn tại cho mỗi UP migration
```

Checklist:
- [ ] Migration có backward-compatible?
- [ ] DOWN migration tồn tại?
- [ ] Đã test trên staging trước?
- [ ] Neon snapshot ready (nếu migration rủi ro)?

---

## Bước 4: Deploy

### 4.1 Frontend (Vercel)
```
Vercel tự động deploy khi push lên main:
1. Push code: git push origin main
2. Vercel build + deploy tự động (~2-3 phút)
3. Preview URL có sẵn cho PR
```

### 4.2 Backend Staging (Render)
```
Render auto-deploy khi push lên main:
1. Push code → Render detect → Docker build
2. Health check: GET /healthz
3. Nếu health check fail → auto-rollback
```

### 4.3 Backend Production (Fly.io)
```bash
# Manual deploy
cd backend
flyctl deploy --remote-only

# Verify
flyctl status
flyctl logs --no-tail -n 20
```

---

## Bước 5: Post-Deploy Smoke Test

```bash
# Health check
curl -s https://vct-platform-api.fly.dev/healthz

# Auth test (login)
curl -s -X POST https://vct-platform-api.fly.dev/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"<password>"}'
```

Checklist:
- [ ] `/healthz` trả về 200
- [ ] Login thành công (200 + token)
- [ ] Frontend load OK (no blank page)
- [ ] CORS OK (no browser console errors)
- [ ] API calls từ frontend thành công

---

## Bước 6: Rollback (Nếu Cần)

### Vercel
```
Vercel Dashboard → Deployments → chọn deploy trước → "Promote to Production"
```

### Render
```
Render Dashboard → Manual Deploy → chọn commit trước
```

### Fly.io
```bash
flyctl releases
flyctl deploy --image registry.fly.io/vct-platform-api:<previous-version>
```

### Database
```
Neon Dashboard → Branch from point-in-time → Restore
```

---

## Anti-Cold-Start (Render Free Tier)

Render free tier sleep sau 15 phút không có traffic.  
Cần cron job ping `/healthz` mỗi 14 phút:

```yaml
# render.yaml
services:
  - type: cron
    name: anti-sleep
    schedule: "*/14 * * * *"
    buildCommand: echo "Ping"
    startCommand: curl -s https://vct-platform-api.onrender.com/healthz
```
