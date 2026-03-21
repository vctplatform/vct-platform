package distlock

import (
	"context"
	"sync/atomic"
	"testing"
	"time"
)

func TestTryLock_Success(t *testing.T) {
	m := NewManager()
	owner, ok := m.TryLock("resource-1", time.Minute)
	if !ok {
		t.Fatal("should acquire lock")
	}
	if owner == "" {
		t.Error("owner token should not be empty")
	}
	if !m.IsLocked("resource-1") {
		t.Error("should be locked")
	}
}

func TestTryLock_AlreadyLocked(t *testing.T) {
	m := NewManager()
	m.TryLock("resource-1", time.Minute)

	_, ok := m.TryLock("resource-1", time.Minute)
	if ok {
		t.Error("should not acquire already-locked resource")
	}
}

func TestTryLock_ExpiredLock(t *testing.T) {
	m := NewManager()
	m.TryLock("resource-1", 10*time.Millisecond)

	time.Sleep(20 * time.Millisecond)

	_, ok := m.TryLock("resource-1", time.Minute)
	if !ok {
		t.Error("should acquire expired lock")
	}
}

func TestUnlock(t *testing.T) {
	m := NewManager()
	owner, _ := m.TryLock("resource-1", time.Minute)

	err := m.Unlock("resource-1", owner)
	if err != nil {
		t.Fatal(err)
	}
	if m.IsLocked("resource-1") {
		t.Error("should be unlocked")
	}
}

func TestUnlock_WrongOwner(t *testing.T) {
	m := NewManager()
	m.TryLock("resource-1", time.Minute)

	err := m.Unlock("resource-1", "wrong-owner")
	if err == nil {
		t.Error("should reject wrong owner")
	}
}

func TestExtend(t *testing.T) {
	m := NewManager()
	owner, _ := m.TryLock("resource-1", 50*time.Millisecond)

	err := m.Extend("resource-1", owner, time.Minute)
	if err != nil {
		t.Fatal(err)
	}

	time.Sleep(60 * time.Millisecond)
	if !m.IsLocked("resource-1") {
		t.Error("extended lock should still be held")
	}
}

func TestExtend_WrongOwner(t *testing.T) {
	m := NewManager()
	m.TryLock("resource-1", time.Minute)

	err := m.Extend("resource-1", "wrong", time.Minute)
	if err == nil {
		t.Error("should reject wrong owner")
	}
}

func TestGuard(t *testing.T) {
	m := NewManager()
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()

	guard, err := m.Acquire(ctx, "resource-1", time.Minute)
	if err != nil {
		t.Fatal(err)
	}

	if !m.IsLocked("resource-1") {
		t.Error("should be locked")
	}

	guard.Release()
	if m.IsLocked("resource-1") {
		t.Error("should be released")
	}
}

func TestAcquire_Timeout(t *testing.T) {
	m := NewManager()
	m.TryLock("resource-1", time.Minute) // Hold lock

	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()

	_, err := m.Acquire(ctx, "resource-1", time.Minute)
	if err == nil {
		t.Error("should timeout")
	}
}

func TestWithLock(t *testing.T) {
	m := NewManager()
	var ran atomic.Int32

	err := m.WithLock(context.Background(), "resource-1", time.Second, func() error {
		ran.Add(1)
		if !m.IsLocked("resource-1") {
			t.Error("should be locked inside WithLock")
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
	if ran.Load() != 1 {
		t.Error("function should have run")
	}
	if m.IsLocked("resource-1") {
		t.Error("should auto-release after WithLock")
	}
}

func TestStats(t *testing.T) {
	m := NewManager()
	o1, _ := m.TryLock("a", time.Minute)
	m.TryLock("b", time.Minute)
	m.TryLock("a", time.Minute) // denied
	m.Unlock("a", o1)

	stats := m.Stats()
	if stats.Acquired != 2 {
		t.Errorf("expected 2 acquired, got %d", stats.Acquired)
	}
	if stats.Denied != 1 {
		t.Errorf("expected 1 denied, got %d", stats.Denied)
	}
	if stats.Released != 1 {
		t.Errorf("expected 1 released, got %d", stats.Released)
	}
	if stats.Active != 1 {
		t.Errorf("expected 1 active, got %d", stats.Active)
	}
}
