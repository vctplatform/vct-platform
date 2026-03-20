package securityheaders

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

// ── CORS Tests ───────────────────────────

func TestCORS_AllowedOrigin(t *testing.T) {
	cfg := DefaultCORSConfig()
	cfg.AllowedOrigins = []string{"https://vct-platform.com"}
	handler := CORS(cfg)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	}))

	req := httptest.NewRequest("GET", "/api/v1/athletes", nil)
	req.Header.Set("Origin", "https://vct-platform.com")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Header().Get("Access-Control-Allow-Origin") != "https://vct-platform.com" {
		t.Error("expected allowed origin header")
	}
}

func TestCORS_DisallowedOrigin(t *testing.T) {
	cfg := DefaultCORSConfig()
	cfg.AllowedOrigins = []string{"https://vct-platform.com"}
	handler := CORS(cfg)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	}))

	req := httptest.NewRequest("GET", "/api/v1/athletes", nil)
	req.Header.Set("Origin", "https://evil.com")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Header().Get("Access-Control-Allow-Origin") != "" {
		t.Error("should not set ACAO for disallowed origin")
	}
}

func TestCORS_Preflight(t *testing.T) {
	cfg := DefaultCORSConfig()
	cfg.AllowedOrigins = []string{"https://vct-platform.com"}
	handler := CORS(cfg)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("handler should not be called for preflight")
	}))

	req := httptest.NewRequest("OPTIONS", "/api/v1/athletes", nil)
	req.Header.Set("Origin", "https://vct-platform.com")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Errorf("expected 204 for preflight, got %d", rec.Code)
	}
	if rec.Header().Get("Access-Control-Allow-Methods") == "" {
		t.Error("expected Allow-Methods header")
	}
}

func TestCORS_WildcardSubdomain(t *testing.T) {
	cfg := DefaultCORSConfig()
	cfg.AllowedOrigins = []string{"*.vct-platform.com"}
	handler := CORS(cfg)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	}))

	req := httptest.NewRequest("GET", "/api", nil)
	req.Header.Set("Origin", "https://staging.vct-platform.com")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Header().Get("Access-Control-Allow-Origin") != "https://staging.vct-platform.com" {
		t.Error("wildcard subdomain should match")
	}
}

// ── Security Headers Tests ───────────────

func TestSecurityHeaders_AllPresent(t *testing.T) {
	cfg := DefaultSecurityConfig()
	handler := SecurityHeaders(cfg)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	}))

	req := httptest.NewRequest("GET", "/", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	checks := map[string]string{
		"Content-Security-Policy":   "default-src",
		"Strict-Transport-Security": "max-age=",
		"X-Frame-Options":           "DENY",
		"X-Content-Type-Options":    "nosniff",
		"X-XSS-Protection":          "1; mode=block",
		"Referrer-Policy":           "strict-origin",
		"Permissions-Policy":        "camera=()",
	}
	for header, contains := range checks {
		val := rec.Header().Get(header)
		if val == "" {
			t.Errorf("missing header: %s", header)
		}
		if len(contains) > 0 && !containsStr(val, contains) {
			t.Errorf("%s: expected to contain %q, got %q", header, contains, val)
		}
	}
}

func TestSecurityHeaders_HSTS_Preload(t *testing.T) {
	cfg := DefaultSecurityConfig()
	handler := SecurityHeaders(cfg)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	}))

	req := httptest.NewRequest("GET", "/", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	hsts := rec.Header().Get("Strict-Transport-Security")
	if !containsStr(hsts, "preload") {
		t.Error("expected HSTS preload directive")
	}
	if !containsStr(hsts, "includeSubDomains") {
		t.Error("expected includeSubDomains")
	}
}

// ── Request ID Tests ─────────────────────

func TestRequestID_Generated(t *testing.T) {
	handler := RequestID(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	}))

	req := httptest.NewRequest("GET", "/", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	id := rec.Header().Get("X-Request-ID")
	if id == "" {
		t.Fatal("expected X-Request-ID header")
	}
	if len(id) != 32 { // 16 bytes hex = 32 chars
		t.Errorf("expected 32 char ID, got %d: %s", len(id), id)
	}
}

func TestRequestID_Propagated(t *testing.T) {
	handler := RequestID(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Should see the same ID in the request
		if r.Header.Get("X-Request-ID") != "my-trace-123" {
			t.Error("request ID not propagated to downstream")
		}
		w.WriteHeader(200)
	}))

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("X-Request-ID", "my-trace-123")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Header().Get("X-Request-ID") != "my-trace-123" {
		t.Error("expected existing request ID to be preserved")
	}
}

func containsStr(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > 0 && findStr(s, substr))
}

func findStr(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
