package shutdown

import (
	"context"
	"errors"
	"log/slog"
	"os"
	"sync/atomic"
	"testing"
	"time"
)

func testLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelError}))
}

func TestHooksExecuteInPriorityOrder(t *testing.T) {
	mgr := NewManager(5*time.Second, testLogger())

	var order []string

	mgr.RegisterFunc("database", PriorityDatabase, func(ctx context.Context) error {
		order = append(order, "database")
		return nil
	})
	mgr.RegisterFunc("http", PriorityHTTP, func(ctx context.Context) error {
		order = append(order, "http")
		return nil
	})
	mgr.RegisterFunc("cache", PriorityCache, func(ctx context.Context) error {
		order = append(order, "cache")
		return nil
	})
	mgr.RegisterFunc("workers", PriorityWorkers, func(ctx context.Context) error {
		order = append(order, "workers")
		return nil
	})

	mgr.Execute()

	expected := []string{"http", "workers", "cache", "database"}
	if len(order) != len(expected) {
		t.Fatalf("expected %d hooks, got %d", len(expected), len(order))
	}
	for i, name := range expected {
		if order[i] != name {
			t.Errorf("position %d: expected %q, got %q", i, name, order[i])
		}
	}
}

func TestHookErrors(t *testing.T) {
	mgr := NewManager(5*time.Second, testLogger())

	var ran atomic.Int32

	mgr.RegisterFunc("failing", PriorityHTTP, func(ctx context.Context) error {
		ran.Add(1)
		return errors.New("http shutdown failed")
	})
	mgr.RegisterFunc("succeeding", PriorityDatabase, func(ctx context.Context) error {
		ran.Add(1)
		return nil
	})

	mgr.Execute()

	if ran.Load() != 2 {
		t.Error("both hooks should run even when one fails")
	}
}

func TestTimeoutEnforcement(t *testing.T) {
	mgr := NewManager(100*time.Millisecond, testLogger())

	var ran atomic.Int32

	mgr.RegisterFunc("slow", PriorityHTTP, func(ctx context.Context) error {
		ran.Add(1)
		select {
		case <-time.After(5 * time.Second):
			return nil
		case <-ctx.Done():
			return ctx.Err()
		}
	})
	mgr.RegisterFunc("never-runs", PriorityDatabase, func(ctx context.Context) error {
		ran.Add(1)
		return nil
	})

	start := time.Now()
	mgr.Execute()
	elapsed := time.Since(start)

	if elapsed > 500*time.Millisecond {
		t.Errorf("timeout should cut execution short, took %v", elapsed)
	}
}

func TestProgrammaticTrigger(t *testing.T) {
	mgr := NewManager(5*time.Second, testLogger())

	// Trigger should close Done channel
	select {
	case <-mgr.Done():
		t.Fatal("done should not be closed yet")
	default:
	}

	mgr.Trigger()

	select {
	case <-mgr.Done():
		// OK
	case <-time.After(100 * time.Millisecond):
		t.Fatal("done channel should be closed after Trigger")
	}

	// Double trigger should not panic
	mgr.Trigger()
}

func TestEmptyManager(t *testing.T) {
	mgr := NewManager(1*time.Second, testLogger())
	mgr.Execute() // Should not panic with zero hooks
}
