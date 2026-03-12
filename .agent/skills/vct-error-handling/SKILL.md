---
name: vct-error-handling
description: Standardized error handling patterns for VCT Platform — APIError envelope, error codes, domain-to-HTTP mapping, Vietnamese error messages, frontend error display, and i18n error keys.
---

# VCT Platform Error Handling

> **When to activate**: Creating API handlers, defining business errors, mapping domain errors to HTTP responses, or implementing frontend error display.

---

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
