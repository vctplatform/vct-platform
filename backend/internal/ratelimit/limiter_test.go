package ratelimit

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestLimiter_Allow(t *testing.T) {
	l := NewLimiter(Config{Rate: 10, Burst: 3, CleanupTTL: DefaultConfig().CleanupTTL})

	// First 3 requests should be allowed (burst)
	for i := 0; i < 3; i++ {
		if !l.Allow("test") {
			t.Errorf("request %d should be allowed", i+1)
		}
	}

	// 4th should be denied
	if l.Allow("test") {
		t.Error("4th request should be rate-limited")
	}
}

func TestLimiter_DifferentKeys(t *testing.T) {
	l := NewLimiter(Config{Rate: 1, Burst: 1, CleanupTTL: DefaultConfig().CleanupTTL})

	if !l.Allow("user1") {
		t.Error("user1 first request should be allowed")
	}
	if !l.Allow("user2") {
		t.Error("user2 first request should be allowed (separate bucket)")
	}
}

func TestLimiter_Reset(t *testing.T) {
	l := NewLimiter(Config{Rate: 1, Burst: 1, CleanupTTL: DefaultConfig().CleanupTTL})

	l.Allow("test") // consume the one token
	if l.Allow("test") {
		t.Error("should be rate-limited")
	}

	l.Reset("test")
	if !l.Allow("test") {
		t.Error("should be allowed after reset")
	}
}

func TestMiddleware_AllowsNormalRequests(t *testing.T) {
	cfg := DefaultMiddlewareConfig()
	handler := Middleware(cfg)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	}))

	req := httptest.NewRequest("GET", "/api/v1/test", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != 200 {
		t.Errorf("expected 200, got %d", rec.Code)
	}
	if rec.Header().Get("X-RateLimit-Tier") == "" {
		t.Error("expected X-RateLimit-Tier header")
	}
}

func TestMiddleware_SkipsHealthCheck(t *testing.T) {
	cfg := DefaultMiddlewareConfig()
	handler := Middleware(cfg)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	}))

	req := httptest.NewRequest("GET", "/healthz", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Header().Get("X-RateLimit-Tier") != "" {
		t.Error("health check should not have rate limit headers")
	}
}

func TestMiddleware_RateLimits(t *testing.T) {
	cfg := MiddlewareConfig{
		AnonymousLimiter: NewLimiter(Config{Rate: 1, Burst: 2, CleanupTTL: DefaultConfig().CleanupTTL}),
		UserLimiter:      NewLimiter(Config{Rate: 1, Burst: 2, CleanupTTL: DefaultConfig().CleanupTTL}),
		AdminLimiter:     NewLimiter(Config{Rate: 1, Burst: 2, CleanupTTL: DefaultConfig().CleanupTTL}),
		APIKeyLimiter:    NewLimiter(Config{Rate: 1, Burst: 2, CleanupTTL: DefaultConfig().CleanupTTL}),
		KeyExtractor:     DefaultKeyExtractor,
	}
	handler := Middleware(cfg)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	}))

	for i := 0; i < 2; i++ {
		req := httptest.NewRequest("GET", "/api/v1/test", nil)
		req.RemoteAddr = "1.2.3.4:1234"
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)
	}

	// 3rd request should be rate-limited
	req := httptest.NewRequest("GET", "/api/v1/test", nil)
	req.RemoteAddr = "1.2.3.4:1234"
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusTooManyRequests {
		t.Errorf("expected 429, got %d", rec.Code)
	}
}

func BenchmarkLimiter(b *testing.B) {
	l := NewLimiter(Config{Rate: 1000, Burst: 2000, CleanupTTL: DefaultConfig().CleanupTTL})
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		l.Allow("bench_key")
	}
}
