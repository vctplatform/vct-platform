package retry

import (
	"context"
	"errors"
	"sync/atomic"
	"testing"
	"time"
)

func TestDo_SuccessFirstAttempt(t *testing.T) {
	result := Do(context.Background(), DefaultPolicy(), func(ctx context.Context) error {
		return nil
	})

	if result.Err != nil {
		t.Errorf("expected no error, got %v", result.Err)
	}
	if result.Attempts != 1 {
		t.Errorf("expected 1 attempt, got %d", result.Attempts)
	}
}

func TestDo_SuccessAfterRetries(t *testing.T) {
	var calls atomic.Int32

	result := Do(context.Background(), Policy{
		MaxAttempts:  5,
		InitialDelay: time.Millisecond,
		MaxDelay:     10 * time.Millisecond,
		Multiplier:   1.0,
	}, func(ctx context.Context) error {
		n := calls.Add(1)
		if n < 3 {
			return errors.New("transient error")
		}
		return nil
	})

	if result.Err != nil {
		t.Errorf("expected success, got %v", result.Err)
	}
	if result.Attempts != 3 {
		t.Errorf("expected 3 attempts, got %d", result.Attempts)
	}
}

func TestDo_MaxRetriesExceeded(t *testing.T) {
	result := Do(context.Background(), Policy{
		MaxAttempts:  3,
		InitialDelay: time.Millisecond,
		MaxDelay:     10 * time.Millisecond,
		Multiplier:   1.0,
	}, func(ctx context.Context) error {
		return errors.New("always fails")
	})

	if result.Err == nil {
		t.Fatal("expected error")
	}
	if result.Attempts != 3 {
		t.Errorf("expected 3 attempts, got %d", result.Attempts)
	}
}

func TestDo_PermanentError(t *testing.T) {
	var calls atomic.Int32

	result := Do(context.Background(), Policy{
		MaxAttempts:  5,
		InitialDelay: time.Millisecond,
		MaxDelay:     10 * time.Millisecond,
		Multiplier:   1.0,
	}, func(ctx context.Context) error {
		calls.Add(1)
		return Permanent(errors.New("auth failure"))
	})

	if calls.Load() != 1 {
		t.Errorf("permanent error should stop after 1 attempt, got %d", calls.Load())
	}
	if result.Err == nil || result.Err.Error() != "auth failure" {
		t.Errorf("expected 'auth failure', got %v", result.Err)
	}
}

func TestDo_RetryIf(t *testing.T) {
	var calls atomic.Int32

	result := Do(context.Background(), Policy{
		MaxAttempts:  5,
		InitialDelay: time.Millisecond,
		MaxDelay:     10 * time.Millisecond,
		Multiplier:   1.0,
		RetryIf: func(err error) bool {
			return err.Error() == "timeout"
		},
	}, func(ctx context.Context) error {
		n := calls.Add(1)
		if n == 1 {
			return errors.New("timeout")
		}
		return errors.New("auth error") // not retryable
	})

	if calls.Load() != 2 {
		t.Errorf("expected 2 attempts (retry timeout, stop on auth), got %d", calls.Load())
	}
	if result.Err == nil {
		t.Error("expected error")
	}
}

func TestDo_ContextCancellation(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())

	var calls atomic.Int32
	go func() {
		time.Sleep(20 * time.Millisecond)
		cancel()
	}()

	result := Do(ctx, Policy{
		MaxAttempts:  100,
		InitialDelay: 10 * time.Millisecond,
		MaxDelay:     50 * time.Millisecond,
		Multiplier:   1.0,
	}, func(ctx context.Context) error {
		calls.Add(1)
		return errors.New("keep failing")
	})

	if result.Err == nil {
		t.Error("expected cancellation error")
	}
	if calls.Load() >= 100 {
		t.Error("should have been cancelled before all attempts")
	}
}

func TestLinearPolicy(t *testing.T) {
	p := LinearPolicy(3, 50*time.Millisecond)
	if p.Multiplier != 1.0 {
		t.Error("linear policy should have multiplier 1.0")
	}
	if p.MaxAttempts != 3 {
		t.Errorf("expected 3 attempts, got %d", p.MaxAttempts)
	}
}

func TestBackoffDelay(t *testing.T) {
	d1 := backoffDelay(1, 100*time.Millisecond, 2.0, 5*time.Second)
	if d1 != 100*time.Millisecond {
		t.Errorf("attempt 1: expected 100ms, got %v", d1)
	}

	d2 := backoffDelay(2, 100*time.Millisecond, 2.0, 5*time.Second)
	if d2 != 200*time.Millisecond {
		t.Errorf("attempt 2: expected 200ms, got %v", d2)
	}

	d4 := backoffDelay(4, 100*time.Millisecond, 2.0, 500*time.Millisecond)
	if d4 != 500*time.Millisecond {
		t.Errorf("attempt 4: should be capped at 500ms, got %v", d4)
	}
}

func TestDoSimple(t *testing.T) {
	err := DoSimple(context.Background(), func(ctx context.Context) error {
		return nil
	})
	if err != nil {
		t.Errorf("expected nil, got %v", err)
	}
}
