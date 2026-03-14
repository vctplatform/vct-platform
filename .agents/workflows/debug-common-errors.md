---
description: Playbook debug các lỗi thường gặp trong VCT Platform — 401, 502, CORS, double API prefix, JSX errors, deployment 404
---

# /debug-common-errors — Playbook Debug Lỗi Thường Gặp

> Sử dụng khi gặp lỗi phổ biến. Tra cứu nhanh nguyên nhân và cách fix.

// turbo-all

---

## Decision Tree (Bắt Đầu Từ Đây)

```
Lỗi xảy ra ở đâu?
  │
  ├─ Browser (Frontend)
  │   ├─ Trang trắng / không render → Xem #1 JSX Errors
  │   ├─ "Failed to fetch" / Network error → Xem #2 CORS
  │   ├─ 401 Unauthorized → Xem #3 Auth 401
  │   ├─ 404 Not Found → Xem #4 Double API Prefix
  │   └─ 500/502 Bad Gateway → Xem #5 Backend Crash
  │
  ├─ Terminal (Backend)
  │   ├─ Compile error → go build ./... → fix imports/types
  │   ├─ Panic → Xem #6 Runtime Panic
  │   └─ DB connection error → Xem #7 Database
  │
  └─ Deployment
      ├─ Build fail → Xem #8 Docker Build
      ├─ 404 sau deploy → Xem #9 Deployment 404
      └─ Cold start slow → Xem #10 Cold Start
```

---

## #1: JSX IntrinsicElements IDE Errors

**Triệu chứng**: IDE báo "Property does not exist on type 'JSX.IntrinsicElements'" nhưng `tsc` build OK.

**Debug**:
```bash
# Kiểm tra duplicate @types/react
npm ls @types/react

# Kiểm tra tsconfig.json
cat packages/app/tsconfig.json | grep jsx

# Fix thường gặp
rm -rf node_modules/.cache
# Restart IDE TypeScript server: Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

**Root cause phổ biến**: Nhiều version `@types/react` từ các packages khác nhau.

---

## #2: CORS Errors

**Triệu chứng**: Browser console báo "Access-Control-Allow-Origin" error.

**Debug**:
```bash
# Kiểm tra CORS config
echo $VCT_CORS_ORIGINS
# Phải chứa frontend URL, ví dụ:
# VCT_CORS_ORIGINS=https://vct-platform.vercel.app,http://localhost:3000
```

**Fix**:
1. Thêm frontend URL vào `VCT_CORS_ORIGINS` (comma-separated)
2. Restart backend
3. Kiểm tra lại trên browser

**Root cause phổ biến**: Quên thêm production frontend URL vào CORS origins.

---

## #3: Auth 401 — ERR_INVALID_CREDENTIALS

**Triệu chứng**: Login trả về 401 dù nhập đúng credentials.

**Debug**:
```bash
# Kiểm tra env vars
echo $VCT_JWT_SECRET      # Phải có giá trị, không rỗng
echo $VCT_ADMIN_PASSWORD   # Phải match với password đang nhập

# Kiểm tra config đã load
curl -s http://localhost:18080/healthz

# Xem backend logs
# Tìm dòng chứa "auth" hoặc "login"
```

**Fix checklist**:
- [ ] `VCT_JWT_SECRET` đã set (không rỗng, không default)?
- [ ] `VCT_ADMIN_PASSWORD` match?
- [ ] `.env` file đã load (check backend startup logs)?
- [ ] Env var name đúng chính tả?

---

## #4: Double API Prefix (`/api/api/v1/...` → 404)

**Triệu chứng**: Mọi API calls trả về 404 trên production.

**Debug**:
```bash
# Kiểm tra NEXT_PUBLIC_API_BASE_URL
# SAI: https://api.example.com/api/v1  ← đã có /api/v1
# ĐÚNG: https://api.example.com        ← chỉ base domain
```

**Root cause**: Frontend apiClient tự thêm `/api/v1` prefix. Nếu `NEXT_PUBLIC_API_BASE_URL` đã chứa path, sẽ thành `/api/v1/api/v1/...`.

**Fix**: Đặt `NEXT_PUBLIC_API_BASE_URL` = base domain only (KHÔNG có path).

---

## #5: 502 Bad Gateway

**Triệu chứng**: Frontend nhận 502 từ API backend.

**Debug**:
```bash
# Kiểm tra backend đang chạy
curl -s http://localhost:18080/healthz

# Xem logs
# Tìm panic, crash, hoặc error message

# Kiểm tra DB connection
echo $VCT_POSTGRES_URL
```

**Nguyên nhân phổ biến**:
1. Backend crash do bad config / missing env var
2. Database connection fail (sai URL, password)
3. Migration fail on startup
4. Render/Fly.io container went to sleep (cold start)

---

## #6: Go Runtime Panic

**Triệu chứng**: Backend crash với panic stacktrace.

**Debug**:
```
Đọc stacktrace → tìm file:line → check code tại đó:
- nil pointer dereference → thiếu nil check
- index out of range → slice access sai
- map access → concurrent map access hoặc nil map
```

**Fix pattern**:
```go
// TRƯỚC (panic-prone)
user := users[0]

// SAU (safe)
if len(users) == 0 {
    return Entity{}, fmt.Errorf("không tìm thấy user")
}
user := users[0]
```

---

## #7: Database Connection Error

**Triệu chứng**: Backend không kết nối được database.

**Debug**:
```bash
# Kiểm tra URL format
echo $VCT_POSTGRES_URL
# Đúng format: postgres://user:pass@host:5432/dbname?sslmode=require

# Test connection trực tiếp
psql "$VCT_POSTGRES_URL"
```

**Nguyên nhân phổ biến**:
1. Sai URL format (thiếu `?sslmode=require` cho cloud DB)
2. Password chứa ký tự đặc biệt cần URL-encode
3. IP không trong whitelist (Neon: phải cho phép IP range)
4. Database bị suspend (Neon free tier)

---

## #8: Docker Build Fail

**Triệu chứng**: Docker build fail trên Render/Fly.io.

**Debug**:
```bash
# Build local để test
docker build -t vct-backend ./backend

# Common issues:
# - go.mod/go.sum out of sync → go mod tidy
# - Missing file in COPY → check Dockerfile paths
# - CGO_ENABLED conflict → ensure CGO_ENABLED=0
```

---

## #9: Deployment 404

**Triệu chứng**: Deploy thành công nhưng mọi routes trả về 404.

**Debug**:
1. Container started? → Check logs for "Listening on :18080"
2. Port match? → Check `PORT` env var vs application listen port
3. Health check: `GET /healthz` → should return 200
4. Migrations ran? → Check startup logs

**Fix**: Đảm bảo backend listen trên port mà platform cung cấp qua `PORT` env var.

---

## #10: Cold Start (Render Free Tier)

**Triệu chứng**: Request đầu tiên timeout (~30s) sau khi idle.

**Nguyên nhân**: Render free tier tự sleep sau 15 phút không traffic.

**Fix**: Thêm cron job ping `/healthz` mỗi 14 phút (xem `/deploy-production` workflow).
