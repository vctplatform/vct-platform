package circuitbreaker

import (
	"errors"
	"testing"
	"time"
)

var errTest = errors.New("test error")

func TestBreaker_ClosedState(t *testing.T) {
	cb := New(DefaultConfig("test"))
	if cb.State() != StateClosed {
		t.Error("initial state should be closed")
	}

	err := cb.Execute(func() error { return nil })
	if err != nil {
		t.Error("should succeed in closed state")
	}
}

func TestBreaker_OpensAfterThreshold(t *testing.T) {
	cb := New(Config{FailureThreshold: 3, SuccessThreshold: 1, Timeout: time.Second, WindowSize: 60 * time.Second})

	for i := 0; i < 3; i++ {
		cb.Execute(func() error { return errTest })
	}

	if cb.State() != StateOpen {
		t.Errorf("expected open, got %s", cb.State())
	}

	err := cb.Execute(func() error { return nil })
	if !errors.Is(err, ErrCircuitOpen) {
		t.Error("should return ErrCircuitOpen")
	}
}

func TestBreaker_HalfOpenAfterTimeout(t *testing.T) {
	cb := New(Config{FailureThreshold: 2, SuccessThreshold: 1, Timeout: 100 * time.Millisecond, WindowSize: 60 * time.Second})

	cb.Execute(func() error { return errTest })
	cb.Execute(func() error { return errTest })

	if cb.State() != StateOpen {
		t.Fatal("should be open")
	}

	time.Sleep(150 * time.Millisecond)

	if cb.State() != StateHalfOpen {
		t.Errorf("expected half-open after timeout, got %s", cb.State())
	}
}

func TestBreaker_ClosesOnSuccessInHalfOpen(t *testing.T) {
	cb := New(Config{FailureThreshold: 2, SuccessThreshold: 1, Timeout: 100 * time.Millisecond, WindowSize: 60 * time.Second})

	cb.Execute(func() error { return errTest })
	cb.Execute(func() error { return errTest })

	time.Sleep(150 * time.Millisecond)

	// Should succeed in half-open and close circuit
	cb.Execute(func() error { return nil })

	if cb.State() != StateClosed {
		t.Errorf("expected closed after success, got %s", cb.State())
	}
}

func TestBreaker_Reset(t *testing.T) {
	cb := New(Config{FailureThreshold: 1, SuccessThreshold: 1, Timeout: time.Hour, WindowSize: 60 * time.Second})

	cb.Execute(func() error { return errTest })
	if cb.State() != StateOpen {
		t.Fatal("should be open")
	}

	cb.Reset()
	if cb.State() != StateClosed {
		t.Error("should be closed after reset")
	}
}

func TestBreaker_StateChange_Callback(t *testing.T) {
	changes := make(chan [2]State, 5)
	cb := New(Config{
		FailureThreshold: 1,
		SuccessThreshold: 1,
		Timeout:          time.Hour,
		WindowSize:       60 * time.Second,
		OnStateChange: func(name string, from, to State) {
			changes <- [2]State{from, to}
		},
	})

	cb.Execute(func() error { return errTest })

	select {
	case change := <-changes:
		if change[0] != StateClosed || change[1] != StateOpen {
			t.Errorf("expected closed→open, got %s→%s", change[0], change[1])
		}
	case <-time.After(time.Second):
		t.Fatal("timeout waiting for state change callback")
	}
}

func BenchmarkBreaker(b *testing.B) {
	cb := New(DefaultConfig("bench"))
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		cb.Execute(func() error { return nil })
	}
}
