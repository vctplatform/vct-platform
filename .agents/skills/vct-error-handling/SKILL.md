---
name: vct-error-handling
description: Standardized error handling patterns for VCT Platform — APIError envelope, error codes, domain-to-HTTP mapping, Vietnamese error messages, frontend error display, and i18n error keys.
---

# VCT Platform Error Handling

> **When to activate**: Creating API handlers, defining business errors, mapping domain errors to HTTP responses, or implementing frontend error display.

---


> [!IMPORTANT]
> **SUPREME ARCHITECTURE DIRECTIVE**: You are strictly bound by the 19 architecture pillars documented in `docs/architecture/`. As a VCT AI Agent, your absolute highest priority is 100% compliance with these rules. You MUST NOT generate code, propose designs, or execute workflows that violate these foundational rules. They are unchangeable and strictly enforced.

## 1. Architecture

```
Domain Layer           → returns Go errors with context
    ↓
Service Layer          → wraps errors with fmt.Errorf("context: %w", err)
    ↓
HTTP Handler Layer     → maps to APIError via helper functions
    ↓
Frontend              → parses JSON error envelope, displays localized message
```

---

## 2. Backend Error Envelope (APIError)

Located at `backend/internal/httpapi/apierror.go`:

```go
type APIError struct {
    Code    string `json:"code"`
    Message string `json:"message"`
    Details any    `json:"details,omitempty"`
}
```

### JSON Response Format
```json
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Tên không được để trống",
        "details": { "field": "name" }
    }
}
```

---

## 3. Standard Error Codes

| Code | HTTP Status | Usage |
|------|-------------|-------|
| `NOT_FOUND` | 404 | Entity not found by ID |
| `VALIDATION_ERROR` | 400 | Input validation failure |
| `BAD_REQUEST` | 400 | Malformed request / JSON decode |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `UNAUTHORIZED` | 401 | Invalid/expired token |
| `CONFLICT` | 409 | Duplicate or state conflict |
| `RATE_LIMITED` | 429 | Too many requests |

---

## 4. Handler Helper Functions

```go
// Standard helpers in apierror.go — use these, never raw http.Error()
notFoundErr(w, "Không tìm thấy giải đấu")
validationErr(w, "Tên không được để trống")
validationErrWithDetail(w, "Validation failed", detail)
badRequestErr(w, err)
internalErr(w, err)
forbiddenErr(w)
unauthorizedErr(w, "Token không hợp lệ")
conflictErr(w, "Giải đấu đã tồn tại")
methodNotAllowedErr(w)
rateLimitErr(w)
```

---

## 5. Domain Error Patterns

### Service Layer
```go
func (s *Service) Create(input CreateInput) (Entity, error) {
    if input.Name == "" {
        return Entity{}, fmt.Errorf("tên không được để trống")
    }
    existing, _ := s.repo.GetByName(input.Name)
    if existing.ID != "" {
        return Entity{}, fmt.Errorf("entity đã tồn tại: %s", input.Name)
    }
    // ...
}
```

### Handler Layer (mapping domain errors → HTTP)
```go
func (s *Server) handleCreate(w http.ResponseWriter, r *http.Request) {
    var input CreateInput
    if !decodeJSON(w, r, &input) { return }

    entity, err := s.entitySvc.Create(input)
    if err != nil {
        // Map domain errors to appropriate HTTP responses
        switch {
        case strings.Contains(err.Error(), "không được để trống"):
            validationErr(w, err.Error())
        case strings.Contains(err.Error(), "đã tồn tại"):
            conflictErr(w, err.Error())
        case strings.Contains(err.Error(), "không thể chuyển"):
            badRequestErr(w, err)
        default:
            internalErr(w, err)
        }
        return
    }
    success(w, http.StatusCreated, entity)
}
```

---

## 6. Frontend Error Display

```tsx
// Standard API call with error handling
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options })
    if (!res.ok) {
        const body = await res.json().catch(() => null)
        const message = body?.error?.message || `Lỗi ${res.status}`
        throw new Error(message)
    }
    return res.json()
}

// In component
try {
    await apiCall('/api/v1/entity/', { method: 'POST', body: JSON.stringify(data) })
} catch (err) {
    setError(err.message)  // Displays Vietnamese error from backend
}
```

### Error UI Patterns
| Scenario | Component |
|----------|-----------|
| API failure | Error banner with retry button |
| Form validation | Field-level error messages |
| 404 Not Found | Full-page 404 with navigation |
| 401 Unauthorized | Redirect to login |
| Network offline | Toast notification |

---

## 7. Vietnamese Error Messages

All backend error messages MUST be in Vietnamese:
```
"Không tìm thấy giải đấu"           // not_found
"Tên không được để trống"            // validation
"Bạn không có quyền thực hiện"       // forbidden
"Token không hợp lệ hoặc hết hạn"   // unauthorized
"Quá nhiều yêu cầu, thử lại sau"    // rate_limited
"Method không được hỗ trợ"           // method_not_allowed
```

---

## 8. Anti-Patterns

1. ❌ **NEVER** use `http.Error()` directly — use APIError helpers
2. ❌ **NEVER** expose internal Go error messages to clients (e.g., `pgx` errors)
3. ❌ **NEVER** return English error messages — use Vietnamese
4. ❌ **NEVER** panic for recoverable errors — return errors up the stack
5. ❌ **NEVER** swallow errors silently — always log and respond
6. ❌ **NEVER** send 200 OK with error body — use appropriate HTTP status code

---

## 9. Common Error Playbook (Lessons Learned)

These are real errors encountered during development. Use this playbook for quick diagnosis.

### 🔴 ERR_INVALID_CREDENTIALS (401)
**Symptom**: Login returns 401 even with correct credentials.  
**Debug steps**:
1. Check `VCT_JWT_SECRET` is set in backend env (not empty/default)
2. Check `VCT_ADMIN_PASSWORD` matches what you're entering
3. Check backend logs for specific auth error message
4. Verify config loads correctly: `GET /healthz` → check running config
5. Common cause: `.env` not loaded, or env var name mismatch

### 🔴 502 Bad Gateway
**Symptom**: Frontend gets 502 from API.  
**Debug steps**:
1. Check if backend container is running (Render/Fly.io dashboard)
2. Check backend logs for panic/crash → fix code error
3. Check database connection: `VCT_POSTGRES_URL` correct?
4. Check if Render/Fly.io went to sleep (cold start) → ping `/healthz`
5. Common cause: Backend crashed on startup due to bad config or migration

### 🟠 CORS Errors
**Symptom**: Browser shows "Access-Control-Allow-Origin" error.  
**Debug steps**:
1. Check `VCT_CORS_ORIGINS` includes frontend URL
2. Must include **both** `http://localhost:3000` AND production URL
3. Multiple origins: comma-separated `VCT_CORS_ORIGINS=url1,url2`
4. Restart backend after changing CORS config
5. Common cause: Missing production frontend URL in CORS origins

### 🟠 Double API Prefix (`/api/api/v1/...` → 404)
**Symptom**: All API calls return 404 in production.  
**Debug steps**:
1. Check `NEXT_PUBLIC_API_BASE_URL` — should be just the base domain
2. Frontend `apiClient` already adds `/api/v1` prefix
3. If base URL is `https://api.example.com/api/v1`, the call becomes `/api/v1/api/v1/...`
4. **Fix**: Set `NEXT_PUBLIC_API_BASE_URL=https://api.example.com` (no path)
5. Common cause: Copy-pasting full API URL including path prefix

### 🟡 JSX IntrinsicElements IDE Errors
**Symptom**: IDE shows "Property does not exist on JSX.IntrinsicElements" but `tsc` compiles fine.  
**Debug steps**:
1. Check for duplicate `@types/react` in `node_modules`
2. Run `npm ls @types/react` — should show only one version
3. Check `tsconfig.json` → `jsx` should be `"preserve"` for Next.js
4. Delete `node_modules/.cache` and restart IDE TS server
5. Common cause: Multiple versions of `@types/react` from different packages

### 🟡 404 on Deployment (Render/Fly.io)
**Symptom**: Deployed backend returns 404 for all routes.  
**Debug steps**:
1. Check container started successfully (logs for "Listening on :18080")
2. Check `PORT` env var matches what platform expects
3. Check health endpoint: `GET /healthz` → should return 200
4. Check migrations ran successfully on startup
5. Common cause: Container port mismatch or migration failure on first deploy

---

## 10. Debug Decision Tree

```
Error occurred?
  │
  ├─ Frontend error (browser)
  │   ├─ Network error → Check backend running? CORS config?
  │   ├─ 401 → Check auth token, JWT secret, login credentials
  │   ├─ 404 → Check API URL prefix (double /api/api?)
  │   ├─ 500/502 → Check backend logs for panic/crash
  │   └─ TypeScript/JSX error → Check tsconfig, @types/react versions
  │
  ├─ Backend error (Go)
  │   ├─ Compile error → go build ./... , check imports
  │   ├─ Runtime panic → Check nil pointer, map access, slice bounds
  │   ├─ DB error → Check VCT_POSTGRES_URL, migration status
  │   └─ Auth error → Check VCT_JWT_SECRET, token expiry
  │
  └─ Deployment error
      ├─ Build fails → Check Dockerfile, go.mod, package.json
      ├─ Health check fails → Check /healthz, port config
      ├─ Cold start → Render free tier sleeps after 15min → add cron ping
      └─ Env vars → Check all VCT_* vars set in platform dashboard
```
