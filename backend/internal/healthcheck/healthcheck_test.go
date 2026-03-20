package healthcheck

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestService_AllUp(t *testing.T) {
	svc := NewService("1.0.0")
	svc.Register("db", PingChecker("db", func(ctx context.Context) error { return nil }))
	svc.Register("redis", PingChecker("redis", func(ctx context.Context) error { return nil }))

	resp := svc.Check(context.Background())
	if resp.Status != StatusUp {
		t.Errorf("expected up, got %s", resp.Status)
	}
	if len(resp.Checks) != 2 {
		t.Errorf("expected 2 checks, got %d", len(resp.Checks))
	}
}

func TestService_OneDown(t *testing.T) {
	svc := NewService("1.0.0")
	svc.Register("db", PingChecker("db", func(ctx context.Context) error { return nil }))
	svc.Register("redis", PingChecker("redis", func(ctx context.Context) error {
		return errors.New("connection refused")
	}))

	resp := svc.Check(context.Background())
	if resp.Status != StatusDown {
		t.Errorf("expected down, got %s", resp.Status)
	}
}

func TestService_Degraded(t *testing.T) {
	svc := NewService("1.0.0")
	svc.Register("db", PingChecker("db", func(ctx context.Context) error { return nil }))
	svc.Register("cache", ThresholdChecker(func() float64 { return 0.85 }, 0.8, 0.95))

	resp := svc.Check(context.Background())
	if resp.Status != StatusDegraded {
		t.Errorf("expected degraded, got %s", resp.Status)
	}
}

func TestLivenessHandler(t *testing.T) {
	svc := NewService("1.0.0")
	rec := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/livez", nil)
	svc.LivenessHandler().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}

func TestReadinessHandler_Up(t *testing.T) {
	svc := NewService("1.0.0")
	svc.Register("db", PingChecker("db", func(ctx context.Context) error { return nil }))

	rec := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/readyz", nil)
	svc.ReadinessHandler().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}

func TestReadinessHandler_Down(t *testing.T) {
	svc := NewService("1.0.0")
	svc.Register("db", PingChecker("db", func(ctx context.Context) error {
		return errors.New("timeout")
	}))

	rec := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/readyz", nil)
	svc.ReadinessHandler().ServeHTTP(rec, req)

	if rec.Code != http.StatusServiceUnavailable {
		t.Errorf("expected 503, got %d", rec.Code)
	}
}

func BenchmarkCheck(b *testing.B) {
	svc := NewService("1.0.0")
	svc.Register("db", PingChecker("db", func(ctx context.Context) error { return nil }))
	svc.Register("redis", PingChecker("redis", func(ctx context.Context) error { return nil }))
	ctx := context.Background()

	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		svc.Check(ctx)
	}
}
