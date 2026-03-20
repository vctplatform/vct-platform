package middleware

import (
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"
)

func testLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelError}))
}

func TestChain_Order(t *testing.T) {
	order := []string{}

	a := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			order = append(order, "A")
			next.ServeHTTP(w, r)
		})
	}
	b := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			order = append(order, "B")
			next.ServeHTTP(w, r)
		})
	}

	handler := Chain(a, b)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		order = append(order, "handler")
	}))

	handler.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest("GET", "/", nil))

	if len(order) != 3 || order[0] != "A" || order[1] != "B" || order[2] != "handler" {
		t.Errorf("expected [A B handler], got %v", order)
	}
}

func TestRecovery_CatchesPanic(t *testing.T) {
	handler := Recovery(testLogger())(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		panic("something broke")
	}))

	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, httptest.NewRequest("GET", "/", nil))

	if rec.Code != http.StatusInternalServerError {
		t.Errorf("expected 500, got %d", rec.Code)
	}
}

func TestRecovery_NoPanic(t *testing.T) {
	handler := Recovery(testLogger())(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	}))

	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, httptest.NewRequest("GET", "/", nil))

	if rec.Code != 200 {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}

func TestTimeout(t *testing.T) {
	handler := Timeout(50 * time.Millisecond)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(200 * time.Millisecond)
		w.WriteHeader(200)
	}))

	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, httptest.NewRequest("GET", "/", nil))

	if rec.Code != http.StatusServiceUnavailable {
		t.Errorf("expected 503 timeout, got %d", rec.Code)
	}
}

func TestProfiles_Register_Apply(t *testing.T) {
	profiles := NewProfiles(testLogger())

	called := false
	marker := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			called = true
			next.ServeHTTP(w, r)
		})
	}

	profiles.Register("public", marker)
	handler := profiles.Wrap("public", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	}))

	handler.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest("GET", "/", nil))

	if !called {
		t.Error("profile middleware was not applied")
	}
}

func TestProfiles_UnknownFallsBackToRecovery(t *testing.T) {
	profiles := NewProfiles(testLogger())

	handler := profiles.Wrap("nonexistent", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		panic("test")
	}))

	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, httptest.NewRequest("GET", "/", nil))

	if rec.Code != 500 {
		t.Errorf("expected 500 from recovery fallback, got %d", rec.Code)
	}
}

func TestResponseCapture(t *testing.T) {
	rec := httptest.NewRecorder()
	rc := NewResponseCapture(rec)

	rc.WriteHeader(201)
	rc.Write([]byte("hello world"))

	if rc.StatusCode != 201 {
		t.Errorf("expected 201, got %d", rc.StatusCode)
	}
	if rc.BytesWritten != 11 {
		t.Errorf("expected 11 bytes, got %d", rc.BytesWritten)
	}
}

func TestResponseCapture_DoubleWriteHeader(t *testing.T) {
	rec := httptest.NewRecorder()
	rc := NewResponseCapture(rec)

	rc.WriteHeader(201)
	rc.WriteHeader(500) // should be ignored

	if rc.StatusCode != 201 {
		t.Errorf("expected first status 201, got %d", rc.StatusCode)
	}
}
