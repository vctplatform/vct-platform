---
name: vct-api-testing
description: API integration testing patterns for VCT Platform — httptest-based handler tests, test fixtures, authentication mocking, response contract validation, and test data factories.
---

# VCT Platform API Testing

> **When to activate**: Writing handler tests, testing API contracts, creating test fixtures, mocking authentication, or verifying endpoint behavior.

---


> [!IMPORTANT]
> **SUPREME ARCHITECTURE DIRECTIVE**: You are strictly bound by the 19 architecture pillars documented in `docs/architecture/`. As a VCT AI Agent, your absolute highest priority is 100% compliance with these rules. You MUST NOT generate code, propose designs, or execute workflows that violate these foundational rules. They are unchangeable and strictly enforced.

## 1. Test Architecture

> **CRITICAL RULE**: API Integration testing MUST strictly comply with the authoritative rules defined in `docs/architecture/qa-testing-architecture.md`. You MUST use `httptest` with isolated Database containers (Testcontainers), test entirely via Interfaces, and NEVER accept flaky network setups in CI.

```
internal/httpapi/
├── server.go                    # Server with New() and Handler()
├── athlete_handler.go           # Handler code
├── athlete_handler_test.go      # Tests for handler
├── testutil_test.go             # Shared test helpers (optional)
└── apierror.go                  # Error envelope
```

### Test Pattern
```go
func TestHandler_Endpoint(t *testing.T) {
    // 1. Create server with in-memory store
    srv := setupTestServer(t)

    // 2. Create request
    req := httptest.NewRequest("GET", "/api/v1/athletes/", nil)
    req.Header.Set("Authorization", "Bearer "+testToken)

    // 3. Record response
    rec := httptest.NewRecorder()
    srv.Handler().ServeHTTP(rec, req)

    // 4. Assert
    if rec.Code != http.StatusOK {
        t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
    }
}
```

---

## 2. Test Server Setup

```go
func setupTestServer(t *testing.T) *httpapi.Server {
    t.Helper()
    store := store.NewMemoryStore()
    cfg := &config.Config{
        JWTSecret: "test-secret-32-chars-minimum-ok!",
        Port:      0,
    }
    srv := httpapi.New(cfg, store)
    return srv
}
```

---

## 3. Authentication Mocking

```go
// Generate test JWT for authenticated endpoints
func testJWT(role, userID string) string {
    claims := jwt.MapClaims{
        "sub":  userID,
        "role": role,
        "exp":  time.Now().Add(time.Hour).Unix(),
    }
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    signed, _ := token.SignedString([]byte("test-secret-32-chars-minimum-ok!"))
    return signed
}

// Usage in tests
req.Header.Set("Authorization", "Bearer "+testJWT("admin", "user-123"))
```

---

## 4. Test Data Factories

```go
// Factory for creating test entities
func makeAthlete(overrides ...func(*domain.Athlete)) domain.Athlete {
    a := domain.Athlete{
        ID:     uuid.NewString(),
        Name:   "Nguyễn Văn Test",
        DOB:    time.Date(2000, 1, 1, 0, 0, 0, 0, time.UTC),
        Gender: "nam",
        ClubID: "club-001",
        Status: "nhap",
    }
    for _, fn := range overrides {
        fn(&a)
    }
    return a
}

// Usage
a := makeAthlete(func(a *domain.Athlete) {
    a.Name = "Custom Name"
    a.Status = "du_dieu_kien"
})
```

---

## 5. Response Contract Validation

```go
// Standard success response
type SuccessResponse struct {
    Success bool        `json:"success"`
    Data    interface{} `json:"data"`
    Meta    *MetaInfo   `json:"meta,omitempty"`
}

type MetaInfo struct {
    Page     int `json:"page"`
    PageSize int `json:"page_size"`
    Total    int `json:"total"`
}

// Standard error response
type ErrorResponse struct {
    Success bool `json:"success"`
    Error   struct {
        Code    string `json:"code"`
        Message string `json:"message"`
    } `json:"error"`
}

// Assert helpers
func assertSuccess(t *testing.T, rec *httptest.ResponseRecorder) {
    t.Helper()
    if rec.Code < 200 || rec.Code >= 300 {
        t.Fatalf("expected success, got %d: %s", rec.Code, rec.Body.String())
    }
    var resp SuccessResponse
    if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
        t.Fatalf("invalid JSON: %v", err)
    }
    if !resp.Success {
        t.Fatal("expected success=true")
    }
}

func assertError(t *testing.T, rec *httptest.ResponseRecorder, expectedCode int, expectedErrorCode string) {
    t.Helper()
    if rec.Code != expectedCode {
        t.Fatalf("expected %d, got %d", expectedCode, rec.Code)
    }
    var resp ErrorResponse
    json.Unmarshal(rec.Body.Bytes(), &resp)
    if resp.Error.Code != expectedErrorCode {
        t.Fatalf("expected error code %s, got %s", expectedErrorCode, resp.Error.Code)
    }
}
```

---

## 6. Test Categories

### Unit Tests (per endpoint)
```go
func TestAthleteHandler_List(t *testing.T)        // GET /athletes/
func TestAthleteHandler_Get(t *testing.T)         // GET /athletes/{id}
func TestAthleteHandler_Create(t *testing.T)      // POST /athletes/
func TestAthleteHandler_Update(t *testing.T)      // PUT /athletes/{id}
func TestAthleteHandler_Delete(t *testing.T)      // DELETE /athletes/{id}
func TestAthleteHandler_NotFound(t *testing.T)    // 404 cases
func TestAthleteHandler_BadRequest(t *testing.T)  // 400 cases
func TestAthleteHandler_Unauthorized(t *testing.T)// 401 cases
```

### Table-Driven Tests
```go
func TestAthleteHandler_Validation(t *testing.T) {
    tests := []struct {
        name     string
        body     string
        wantCode int
        wantErr  string
    }{
        {"empty name", `{"name":""}`, 400, "VALIDATION_ERROR"},
        {"missing club", `{"name":"Test"}`, 400, "VALIDATION_ERROR"},
        {"valid", `{"name":"Test","club_id":"c1"}`, 201, ""},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // ...assert
        })
    }
}
```

---

## 7. Anti-Patterns

1. ❌ **NEVER** test against real database — use `MemoryStore`
2. ❌ **NEVER** hardcode JWT secrets differently between test and server setup
3. ❌ **NEVER** skip error response validation — always check code + message
4. ❌ **NEVER** test implementation details — test HTTP input/output only
5. ❌ **NEVER** leave test data in shared state — each test should be independent
