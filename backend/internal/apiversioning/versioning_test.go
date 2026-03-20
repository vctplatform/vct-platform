package apiversioning

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func setupRegistry() *Registry {
	r := NewRegistry()
	r.Register(Version{
		Name:       "v1",
		Status:     StatusActive,
		ReleasedAt: time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC),
	})
	r.Register(Version{
		Name:       "v2",
		Status:     StatusActive,
		ReleasedAt: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC),
	})
	return r
}

func TestRegistry_Current(t *testing.T) {
	r := setupRegistry()
	if r.Current() != "v2" {
		t.Errorf("expected v2, got %s", r.Current())
	}
}

func TestRegistry_List(t *testing.T) {
	r := setupRegistry()
	versions := r.List()
	if len(versions) != 2 {
		t.Errorf("expected 2 versions, got %d", len(versions))
	}
}

func TestRegistry_Deprecate(t *testing.T) {
	r := setupRegistry()
	sunset := time.Date(2027, 1, 1, 0, 0, 0, 0, time.UTC)
	err := r.Deprecate("v1", sunset, "v2")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	v, _ := r.Get("v1")
	if v.Status != StatusDeprecated {
		t.Errorf("expected deprecated, got %s", v.Status)
	}
	if v.Successor != "v2" {
		t.Errorf("expected successor v2, got %s", v.Successor)
	}
}

func TestMiddleware_ActiveVersion(t *testing.T) {
	r := setupRegistry()
	handler := Middleware(r)(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		w.WriteHeader(200)
	}))

	req := httptest.NewRequest("GET", "/api/v2/athletes", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != 200 {
		t.Errorf("expected 200, got %d", rec.Code)
	}
	if rec.Header().Get("X-API-Version") != "v2" {
		t.Errorf("expected X-API-Version v2, got %s", rec.Header().Get("X-API-Version"))
	}
	if rec.Header().Get("X-API-Status") != "active" {
		t.Error("expected active status header")
	}
}

func TestMiddleware_DeprecatedVersion(t *testing.T) {
	r := setupRegistry()
	sunset := time.Date(2027, 6, 1, 0, 0, 0, 0, time.UTC)
	r.Deprecate("v1", sunset, "v2")

	handler := Middleware(r)(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		w.WriteHeader(200)
	}))

	req := httptest.NewRequest("GET", "/api/v1/athletes", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	// Should still serve but with warnings
	if rec.Code != 200 {
		t.Errorf("expected 200 for deprecated, got %d", rec.Code)
	}
	if rec.Header().Get("Deprecation") == "" {
		t.Error("expected Deprecation header")
	}
	if rec.Header().Get("Sunset") == "" {
		t.Error("expected Sunset header")
	}
	if rec.Header().Get("X-API-Warn") == "" {
		t.Error("expected X-API-Warn header")
	}
}

func TestMiddleware_SunsetVersion(t *testing.T) {
	r := setupRegistry()
	sunset := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	r.Deprecate("v1", sunset, "v2")
	r.Sunset("v1")

	handler := Middleware(r)(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		w.WriteHeader(200)
	}))

	req := httptest.NewRequest("GET", "/api/v1/athletes", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusGone {
		t.Errorf("expected 410 Gone, got %d", rec.Code)
	}
}

func TestMiddleware_UnknownVersion(t *testing.T) {
	r := setupRegistry()
	handler := Middleware(r)(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		w.WriteHeader(200)
	}))

	req := httptest.NewRequest("GET", "/api/v99/athletes", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}
}

func TestMiddleware_HeaderVersion(t *testing.T) {
	r := setupRegistry()
	handler := Middleware(r)(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		w.WriteHeader(200)
	}))

	req := httptest.NewRequest("GET", "/athletes", nil)
	req.Header.Set("X-API-Version", "v1")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Header().Get("X-API-Version") != "v1" {
		t.Errorf("expected version from header, got %s", rec.Header().Get("X-API-Version"))
	}
}

func TestMiddleware_DefaultVersion(t *testing.T) {
	r := setupRegistry()
	handler := Middleware(r)(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		w.WriteHeader(200)
	}))

	req := httptest.NewRequest("GET", "/athletes", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Header().Get("X-API-Version") != "v2" {
		t.Errorf("expected default version v2, got %s", rec.Header().Get("X-API-Version"))
	}
}
