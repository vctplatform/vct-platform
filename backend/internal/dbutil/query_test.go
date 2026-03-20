package dbutil

import (
	"context"
	"errors"
	"log/slog"
	"os"
	"testing"
	"time"
)

func testLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelError}))
}

func TestQueryMiddleware_Success(t *testing.T) {
	m := NewQueryMiddleware(testLogger(), 100*time.Millisecond)

	err := m.Wrap(context.Background(), "SELECT 1", func() error {
		return nil
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	stats := m.Stats()
	if stats.TotalQueries != 1 {
		t.Errorf("expected 1 total query, got %d", stats.TotalQueries)
	}
	if stats.ErrorQueries != 0 {
		t.Errorf("expected 0 errors, got %d", stats.ErrorQueries)
	}
}

func TestQueryMiddleware_Error(t *testing.T) {
	m := NewQueryMiddleware(testLogger(), 100*time.Millisecond)

	err := m.Wrap(context.Background(), "bad query", func() error {
		return errors.New("syntax error")
	})
	if err == nil {
		t.Fatal("expected error")
	}

	stats := m.Stats()
	if stats.ErrorQueries != 1 {
		t.Errorf("expected 1 error, got %d", stats.ErrorQueries)
	}
}

func TestQueryMiddleware_SlowQuery(t *testing.T) {
	m := NewQueryMiddleware(testLogger(), 10*time.Millisecond)

	m.Wrap(context.Background(), "slow SELECT", func() error {
		time.Sleep(20 * time.Millisecond)
		return nil
	})

	stats := m.Stats()
	if stats.SlowQueries != 1 {
		t.Errorf("expected 1 slow query, got %d", stats.SlowQueries)
	}
}

func TestQueryMiddleware_AvgDuration(t *testing.T) {
	m := NewQueryMiddleware(testLogger(), time.Second)

	for i := 0; i < 5; i++ {
		m.Wrap(context.Background(), "test", func() error {
			time.Sleep(1 * time.Millisecond)
			return nil
		})
	}

	avg := m.AvgDuration()
	if avg < 1*time.Millisecond {
		t.Errorf("average too low: %v", avg)
	}
}

// mockPool implements PoolStatsProvider for testing.
type mockPool struct {
	max, open, inUse, idle int
}

func (p *mockPool) MaxConns() int  { return p.max }
func (p *mockPool) OpenConns() int { return p.open }
func (p *mockPool) InUse() int     { return p.inUse }
func (p *mockPool) Idle() int      { return p.idle }

func TestPoolMonitor_Snapshot(t *testing.T) {
	pool := &mockPool{max: 20, open: 15, inUse: 10, idle: 5}
	pm := NewPoolMonitor(testLogger(), time.Minute, pool)

	stats := pm.Snapshot()
	if stats.MaxConns != 20 {
		t.Errorf("expected max 20, got %d", stats.MaxConns)
	}
	if stats.Utilization != 0.5 {
		t.Errorf("expected utilization 0.5, got %f", stats.Utilization)
	}
}

func TestPoolMonitor_HighUtilization(t *testing.T) {
	pool := &mockPool{max: 10, open: 10, inUse: 9, idle: 1}
	pm := NewPoolMonitor(testLogger(), time.Minute, pool)

	stats := pm.Snapshot()
	if stats.Utilization < 0.8 {
		t.Errorf("expected high utilization, got %f", stats.Utilization)
	}
}

func BenchmarkQueryMiddleware(b *testing.B) {
	m := NewQueryMiddleware(testLogger(), time.Second)
	ctx := context.Background()

	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		m.Wrap(ctx, "bench", func() error { return nil })
	}
}
