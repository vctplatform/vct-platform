package cache

import (
	"sync"
	"testing"
	"time"
)

func TestTTLCache_SetAndGet(t *testing.T) {
	c := NewTTLCache(1*time.Second, 100)

	c.Set("key1", "value1")
	val, ok := c.Get("key1")
	if !ok {
		t.Fatal("expected key1 to exist")
	}
	if val != "value1" {
		t.Errorf("expected 'value1', got '%v'", val)
	}
}

func TestTTLCache_Expiry(t *testing.T) {
	c := NewTTLCache(50*time.Millisecond, 100)

	c.Set("expiring", "data")
	time.Sleep(80 * time.Millisecond)

	_, ok := c.Get("expiring")
	if ok {
		t.Error("expected key to be expired")
	}
}

func TestTTLCache_SetWithCustomTTL(t *testing.T) {
	c := NewTTLCache(1*time.Hour, 100) // long default

	c.SetWithTTL("short", "data", 50*time.Millisecond)
	time.Sleep(80 * time.Millisecond)

	_, ok := c.Get("short")
	if ok {
		t.Error("expected key with short custom TTL to be expired")
	}
}

func TestTTLCache_Delete(t *testing.T) {
	c := NewTTLCache(1*time.Hour, 100)

	c.Set("to-delete", "data")
	c.Delete("to-delete")

	_, ok := c.Get("to-delete")
	if ok {
		t.Error("expected deleted key to not exist")
	}
}

func TestTTLCache_InvalidatePrefix(t *testing.T) {
	c := NewTTLCache(1*time.Hour, 100)

	c.Set("athletes:list", "data1")
	c.Set("athletes:id-1", "data2")
	c.Set("teams:list", "data3")

	c.InvalidatePrefix("athletes:")

	_, ok1 := c.Get("athletes:list")
	_, ok2 := c.Get("athletes:id-1")
	_, ok3 := c.Get("teams:list")

	if ok1 || ok2 {
		t.Error("expected athletes keys to be invalidated")
	}
	if !ok3 {
		t.Error("expected teams key to survive prefix invalidation")
	}
}

func TestTTLCache_Eviction(t *testing.T) {
	c := NewTTLCache(1*time.Hour, 3) // max 3 entries

	c.Set("a", 1)
	c.Set("b", 2)
	c.Set("c", 3)
	c.Set("d", 4) // should evict oldest

	if c.Len() > 3 {
		t.Errorf("expected max 3 entries, got %d", c.Len())
	}
}

func TestTTLCache_ConcurrentAccess(t *testing.T) {
	c := NewTTLCache(1*time.Second, 1000)
	var wg sync.WaitGroup

	// Concurrent writes
	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func(n int) {
			defer wg.Done()
			key := "key-" + time.Now().String()
			c.Set(key, n)
			c.Get(key)
		}(i)
	}
	wg.Wait()

	// Should not panic or deadlock
	if c.Len() > 1000 {
		t.Errorf("unexpected cache size: %d", c.Len())
	}
}

func TestTTLCache_DefaultTTLAccessor(t *testing.T) {
	c := NewTTLCache(30*time.Second, 2000)
	if c.DefaultTTL() != 30*time.Second {
		t.Errorf("expected 30s default TTL, got %v", c.DefaultTTL())
	}
	if c.MaxEntries() != 2000 {
		t.Errorf("expected 2000 max entries, got %d", c.MaxEntries())
	}
}

func TestTTLCache_NegativeDefaults(t *testing.T) {
	c := NewTTLCache(-1, -1)
	if c.DefaultTTL() != 30*time.Second {
		t.Errorf("expected fallback 30s, got %v", c.DefaultTTL())
	}
	if c.MaxEntries() != 2000 {
		t.Errorf("expected fallback 2000, got %d", c.MaxEntries())
	}
}
