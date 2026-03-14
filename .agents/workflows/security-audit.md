---
description: Workflow kiểm tra bảo mật toàn diện cho VCT Platform
---

# /security-audit — Kiểm Tra Bảo Mật

> Sử dụng khi cần review bảo mật cho module, feature, hoặc toàn bộ hệ thống.
> Đọc skill **vct-cto** (`/.agent/skills/vct-cto/SKILL.md`) phần Security Policy.

// turbo-all

---

## Bước 1: Authentication Audit

### JWT Configuration
- [ ] JWT secret đủ mạnh (≥256-bit)
- [ ] JWT secret lấy từ env var, KHÔNG hardcode
- [ ] Access token TTL hợp lý (15 phút)
- [ ] Refresh token TTL hợp lý (7 ngày)
- [ ] Token rotation khi refresh
- [ ] Expired tokens bị reject

### Auth Middleware
- [ ] Tất cả protected endpoints có auth middleware
- [ ] Chỉ whitelist: `/healthz`, `/api/v1/auth/login`, `/api/v1/auth/register`
- [ ] Middleware extract claims đúng (userId, roles, activeRole)

### Kiểm tra:
```bash
# Tìm endpoints KHÔNG có auth middleware
# Grep trong httpapi/ cho routes không wrapped bởi authMiddleware
```

---

## Bước 2: Authorization Audit (RBAC)

### Role-Based Access
- [ ] Mỗi endpoint kiểm tra role phù hợp
- [ ] Admin KHÔNG thể bị impersonate
- [ ] User KHÔNG thể truy cập data của user khác
- [ ] Cross-tenant isolation (province A không thấy data province B)

### Quy tắc RBAC
| Role | Phạm vi | Kiểm tra |
|------|---------|----------|
| `admin` | Toàn hệ thống | Chỉ được assign bởi super admin |
| `federation_manager` | Liên đoàn quốc gia | Không truy cập admin functions |
| `provincial_manager` | Tỉnh/thành phố | Chỉ thấy data tỉnh mình |
| `club_manager` | CLB/Võ đường | Chỉ thấy data CLB mình |
| `coach` | HLV | Chỉ truy cập athlete của mình |
| `athlete` | Cá nhân | Chỉ profile + competitions của mình |
| `spectator` | Xem public | Không có write access |

---

## Bước 3: Input Validation Audit

### SQL Injection
- [ ] TẤT CẢ queries dùng parameterized (`$1`, `$2`)
- [ ] KHÔNG có string concatenation trong SQL
- [ ] Kiểm tra:
  ```bash
  # Tìm string concatenation trong SQL queries
  # Pattern: "SELECT" + variable hoặc fmt.Sprintf với SQL
  ```

### Request Validation
- [ ] Body size limit (1MB default)
- [ ] JSON decode errors handled gracefully  
- [ ] Required fields validated
- [ ] String lengths validated (no 1MB names)
- [ ] Numeric ranges validated
- [ ] Email/URL format validated
- [ ] UUID format validated for path params

### XSS Prevention
- [ ] User input sanitized trước khi render
- [ ] HTML entities escaped
- [ ] Content-Type headers set correctly

---

## Bước 4: Rate Limiting & DoS Protection

### Rate Limits
| Endpoint Type | Limit | Kiểm tra |
|--------------|-------|----------|
| Auth (login/register) | 5 req/min | Brute-force protection |
| API general | 100 req/min | Normal usage |
| File upload | 10 req/min | Storage abuse |
| Search | 30 req/min | Query abuse |

### Protection
- [ ] CORS configured đúng per environment
  ```
  Development: localhost:3000
  Staging: staging.vct.vn
  Production: vtt.vn
  ```
- [ ] Rate limiter active trên tất cả routes
- [ ] Request body size limit (1MB)
- [ ] HTTPS enforced (production)

---

## Bước 5: Secrets & Configuration Audit

### Secrets Check
- [ ] KHÔNG có secrets trong source code
- [ ] KHÔNG có secrets trong git history
- [ ] `.env` trong `.gitignore`
- [ ] `.env.example` KHÔNG chứa real values
- [ ] API keys/tokens dùng env vars

### Kiểm tra:
```bash
# Tìm potential secrets trong code
# Tìm patterns: password, secret, key, token, api_key
# Kiểm tra .gitignore có .env
```

### Environment Variables Required
```
VCT_JWT_SECRET          — MUST be unique per environment
VCT_POSTGRES_URL        — Database connection (with password)
VCT_REDIS_URL           — Redis connection
VCT_MEILISEARCH_KEY     — Search API key
VCT_MINIO_SECRET_KEY    — Object storage secret
```

---

## Bước 6: Output Security Report

```markdown
## 🔒 Security Audit Report

### Scan Date: [date]
### Scope: [module / full system]

### ✅ Passed
- [checks that passed]

### 🔴 Critical Issues
- [issues that need immediate fix]

### 🟠 High Risk
- [issues that should be fixed before next release]

### 🟡 Medium Risk
- [issues that should be addressed]

### 📋 Recommendations
1. [recommendation 1]
2. [recommendation 2]

### 🔧 Action Items
| # | Issue | Severity | Fix | Owner |
|---|-------|----------|-----|-------|
| 1 | [issue] | Critical/High/Medium | [fix] | [role] |
```
