package jobqueue

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"sync/atomic"
	"testing"
	"time"
)

var idCounter int64

func testIDFunc() string {
	n := atomic.AddInt64(&idCounter, 1)
	return fmt.Sprintf("job_%d", n)
}

func testLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelError}))
}

func TestSubmit_Success(t *testing.T) {
	q := New(DefaultConfig(), testLogger(), testIDFunc)
	done := make(chan struct{})

	q.Register("test", func(ctx context.Context, job *Job) error {
		close(done)
		return nil
	})

	q.Start(context.Background())
	defer q.Stop()

	id, err := q.Submit("test", map[string]interface{}{"key": "value"})
	if err != nil {
		t.Fatalf("submit error: %v", err)
	}
	if id == "" {
		t.Fatal("expected job ID")
	}

	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Fatal("timeout waiting for job")
	}

	job, _ := q.Status(id)
	if job.Status != StatusCompleted {
		t.Errorf("expected completed, got %s", job.Status)
	}
}

func TestSubmit_UnregisteredType(t *testing.T) {
	q := New(DefaultConfig(), testLogger(), testIDFunc)
	_, err := q.Submit("unknown", nil)
	if err == nil {
		t.Fatal("expected error for unregistered type")
	}
}

func TestSubmit_QueueFull(t *testing.T) {
	cfg := DefaultConfig()
	cfg.QueueSize = 1
	cfg.Workers = 0 // no workers = never drain
	q := New(cfg, testLogger(), testIDFunc)
	q.Register("test", func(ctx context.Context, job *Job) error { return nil })

	// Fill queue
	q.Submit("test", nil)

	// Should fail
	_, err := q.Submit("test", nil)
	if err == nil {
		t.Fatal("expected queue full error")
	}
}

func TestRetry_ExponentialBackoff(t *testing.T) {
	cfg := DefaultConfig()
	cfg.MaxRetry = 2
	cfg.RetryBaseWait = 50 * time.Millisecond
	cfg.Workers = 1

	q := New(cfg, testLogger(), testIDFunc)
	attempts := int64(0)

	q.Register("flaky", func(ctx context.Context, job *Job) error {
		n := atomic.AddInt64(&attempts, 1)
		if n < 2 {
			return errors.New("temporary failure")
		}
		return nil
	})

	q.Start(context.Background())
	defer q.Stop()

	id, _ := q.Submit("flaky", nil)

	// Wait for retries
	time.Sleep(500 * time.Millisecond)

	job, _ := q.Status(id)
	if job.Status != StatusCompleted {
		t.Errorf("expected completed after retry, got %s", job.Status)
	}
	if atomic.LoadInt64(&attempts) < 2 {
		t.Error("expected at least 2 attempts")
	}
}

func TestDeadLetterQueue(t *testing.T) {
	cfg := DefaultConfig()
	cfg.MaxRetry = 1
	cfg.RetryBaseWait = 10 * time.Millisecond
	cfg.Workers = 1

	q := New(cfg, testLogger(), testIDFunc)
	q.Register("always_fail", func(ctx context.Context, job *Job) error {
		return errors.New("permanent failure")
	})

	q.Start(context.Background())
	defer q.Stop()

	q.Submit("always_fail", nil)
	time.Sleep(200 * time.Millisecond)

	dead := q.DeadLetterQueue()
	if len(dead) != 1 {
		t.Errorf("expected 1 dead job, got %d", len(dead))
	}
	if dead[0].Status != StatusDead {
		t.Errorf("expected dead status, got %s", dead[0].Status)
	}
}

func TestPending(t *testing.T) {
	cfg := DefaultConfig()
	cfg.Workers = 0
	cfg.QueueSize = 10
	q := New(cfg, testLogger(), testIDFunc)
	q.Register("test", func(ctx context.Context, job *Job) error { return nil })

	q.Submit("test", nil)
	q.Submit("test", nil)

	if q.Pending() != 2 {
		t.Errorf("expected 2 pending, got %d", q.Pending())
	}
}

func BenchmarkSubmit(b *testing.B) {
	q := New(DefaultConfig(), testLogger(), testIDFunc)
	q.Register("bench", func(ctx context.Context, job *Job) error { return nil })
	q.Start(context.Background())
	defer q.Stop()

	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		q.Submit("bench", nil)
	}
}
