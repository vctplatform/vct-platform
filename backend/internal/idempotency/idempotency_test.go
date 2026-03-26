package idempotency

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
	"time"
)

func TestCheck_NewKey(t *testing.T) {
	s := NewStore(time.Minute)

	resp, exists := s.Check("key-1")
	if exists || resp != nil {
		t.Error("new key should return (nil, false)")
	}
}

func TestCheck_CachedResponse(t *testing.T) {
	s := NewStore(time.Minute)

	s.Check("key-1")
	s.Complete("key-1", &CachedResponse{StatusCode: 201, Body: []byte(`{"id":"123"}`)})

	resp, exists := s.Check("key-1")
	if !exists || resp == nil {
		t.Fatal("should return cached response")
	}
	if resp.StatusCode != 201 {
		t.Errorf("expected 201, got %d", resp.StatusCode)
	}
}

func TestCheck_InFlight(t *testing.T) {
	s := NewStore(time.Minute)

	s.Check("key-1") // Lock key

	resp, exists := s.Check("key-1")
	if !exists {
		t.Error("should detect in-flight")
	}
	if resp != nil {
		t.Error("in-flight should return nil response")
	}
}

func TestRelease(t *testing.T) {
	s := NewStore(time.Minute)

	s.Check("key-1") // Lock
	s.Release("key-1")

	// Should be available again
	_, exists := s.Check("key-1")
	if exists {
		t.Error("released key should be available")
	}
}

func TestTTLExpiration(t *testing.T) {
	s := NewStore(50 * time.Millisecond)

	s.Check("key-1")
	s.Complete("key-1", &CachedResponse{StatusCode: 200})

	time.Sleep(100 * time.Millisecond)

	_, exists := s.Check("key-1")
	if exists {
		t.Error("expired key should not exist")
	}
}

func TestStats(t *testing.T) {
	s := NewStore(time.Minute)

	s.Check("key-1") // miss
	s.Complete("key-1", &CachedResponse{StatusCode: 200})
	s.Check("key-1") // hit

	stats := s.Stats()
	if stats.Hits != 1 {
		t.Errorf("expected 1 hit, got %d", stats.Hits)
	}
	if stats.Misses != 1 {
		t.Errorf("expected 1 miss, got %d", stats.Misses)
	}
}

func TestMiddleware_NormalGET(t *testing.T) {
	s := NewStore(time.Minute)
	handler := Middleware(s)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	}))

	req := httptest.NewRequest("GET", "/api/athletes", nil)
	req.Header.Set(HeaderIdempotencyKey, "key-1")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != 200 {
		t.Errorf("GET should pass through, got %d", rec.Code)
	}
}

func TestMiddleware_FirstPOST(t *testing.T) {
	s := NewStore(time.Minute)
	var calls atomic.Int32

	handler := Middleware(s)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls.Add(1)
		w.WriteHeader(201)
		w.Write([]byte(`{"id":"new-athlete"}`))
	}))

	req := httptest.NewRequest("POST", "/api/athletes", nil)
	req.Header.Set(HeaderIdempotencyKey, "create-1")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != 201 {
		t.Errorf("expected 201, got %d", rec.Code)
	}
	if calls.Load() != 1 {
		t.Error("handler should be called once")
	}
}

func TestMiddleware_ReplayPOST(t *testing.T) {
	s := NewStore(time.Minute)
	var calls atomic.Int32

	handler := Middleware(s)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls.Add(1)
		w.WriteHeader(201)
		w.Write([]byte(`{"id":"athlete-1"}`))
	}))

	// First request
	req1 := httptest.NewRequest("POST", "/api/athletes", nil)
	req1.Header.Set(HeaderIdempotencyKey, "create-2")
	rec1 := httptest.NewRecorder()
	handler.ServeHTTP(rec1, req1)

	// Duplicate request
	req2 := httptest.NewRequest("POST", "/api/athletes", nil)
	req2.Header.Set(HeaderIdempotencyKey, "create-2")
	rec2 := httptest.NewRecorder()
	handler.ServeHTTP(rec2, req2)

	if calls.Load() != 1 {
		t.Errorf("handler should be called once, got %d", calls.Load())
	}
	if rec2.Code != 201 {
		t.Errorf("replayed response should be 201, got %d", rec2.Code)
	}
	if rec2.Header().Get("X-Idempotent-Replayed") != "true" {
		t.Error("should have replay header")
	}
	if !strings.Contains(rec2.Body.String(), "athlete-1") {
		t.Error("replayed body should match original")
	}
}

func TestMiddleware_NoKey(t *testing.T) {
	s := NewStore(time.Minute)
	var calls atomic.Int32

	handler := Middleware(s)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls.Add(1)
		w.WriteHeader(200)
	}))

	// POST without idempotency key → process normally
	req := httptest.NewRequest("POST", "/api/test", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	req2 := httptest.NewRequest("POST", "/api/test", nil)
	rec2 := httptest.NewRecorder()
	handler.ServeHTTP(rec2, req2)

	if calls.Load() != 2 {
		t.Errorf("without key, both requests should process, got %d", calls.Load())
	}
}
