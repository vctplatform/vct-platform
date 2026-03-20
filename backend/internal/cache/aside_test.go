package cache

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

// ── Cache-Aside Tests ────────────────────

func TestAside_ReadThrough(t *testing.T) {
	c := NewTTLCache(time.Minute, 100)
	defer c.Close()
	calls := 0

	aside := NewAside(c, "athlete", func(ctx context.Context, key string) (string, error) {
		calls++
		return "Nguyễn Văn A", nil
	}, testLogger())

	// First call — cache miss, fetches from source
	val, err := aside.Get(context.Background(), "a1")
	if err != nil || val != "Nguyễn Văn A" {
		t.Fatalf("expected 'Nguyễn Văn A', got %q, err: %v", val, err)
	}
	if calls != 1 {
		t.Errorf("expected 1 fetch call, got %d", calls)
	}

	// Second call — cache hit, no fetch
	val, _ = aside.Get(context.Background(), "a1")
	if val != "Nguyễn Văn A" {
		t.Errorf("expected cached value")
	}
	if calls != 1 {
		t.Errorf("expected no additional fetch, got %d", calls)
	}
}

func TestAside_WriteInvalidate(t *testing.T) {
	c := NewTTLCache(time.Minute, 100)
	defer c.Close()
	calls := 0

	aside := NewAside(c, "club", func(ctx context.Context, key string) (string, error) {
		calls++
		return "CLB Bình Định", nil
	}, testLogger())

	aside.Get(context.Background(), "c1")
	aside.Invalidate("c1")
	aside.Get(context.Background(), "c1")

	if calls != 2 {
		t.Errorf("expected 2 fetches after invalidation, got %d", calls)
	}
}

func TestAside_InvalidateAll(t *testing.T) {
	c := NewTTLCache(time.Minute, 100)
	defer c.Close()

	aside := NewAside(c, "athlete", func(ctx context.Context, key string) (string, error) {
		return "val", nil
	}, testLogger())

	aside.Get(context.Background(), "a1")
	aside.Get(context.Background(), "a2")
	aside.InvalidateAll()

	// Both should be gone
	if _, ok := c.Get("athlete:a1"); ok {
		t.Error("a1 should be invalidated")
	}
	if _, ok := c.Get("athlete:a2"); ok {
		t.Error("a2 should be invalidated")
	}
}

func TestAside_FetchError(t *testing.T) {
	c := NewTTLCache(time.Minute, 100)
	defer c.Close()

	aside := NewAside(c, "athlete", func(ctx context.Context, key string) (string, error) {
		return "", errors.New("db connection refused")
	}, testLogger())

	_, err := aside.Get(context.Background(), "a1")
	if err == nil {
		t.Fatal("expected error")
	}
}

// ── Tag-Based Invalidation Tests ─────────

func TestTagIndex_TagAndQuery(t *testing.T) {
	idx := NewTagIndex()
	idx.Tag("athlete:a1", "tournament:t1", "club:c1")
	idx.Tag("athlete:a2", "tournament:t1")

	keys := idx.KeysByTag("tournament:t1")
	if len(keys) != 2 {
		t.Errorf("expected 2 keys for tournament:t1, got %d", len(keys))
	}

	keys = idx.KeysByTag("club:c1")
	if len(keys) != 1 {
		t.Errorf("expected 1 key for club:c1, got %d", len(keys))
	}
}

func TestTagIndex_RemoveTag(t *testing.T) {
	idx := NewTagIndex()
	idx.Tag("k1", "tag1", "tag2")
	idx.Tag("k2", "tag1")

	idx.RemoveTag("tag1")

	keys := idx.KeysByTag("tag1")
	if len(keys) != 0 {
		t.Error("tag1 should be empty after removal")
	}

	// tag2 should still have k1
	keys = idx.KeysByTag("tag2")
	if len(keys) != 1 {
		t.Errorf("tag2 should still have 1 key, got %d", len(keys))
	}
}

func TestAside_InvalidateByTag(t *testing.T) {
	c := NewTTLCache(time.Minute, 100)
	defer c.Close()

	aside := NewAside(c, "athlete", func(ctx context.Context, key string) (string, error) {
		return "val_" + key, nil
	}, testLogger())

	aside.Get(context.Background(), "a1")
	aside.SetWithTags("a1", "val_a1", "tournament:t1")
	aside.Get(context.Background(), "a2")
	aside.SetWithTags("a2", "val_a2", "tournament:t1")
	aside.Get(context.Background(), "a3")
	aside.SetWithTags("a3", "val_a3", "tournament:t2")

	// Invalidate all athletes in tournament:t1
	aside.InvalidateByTag("tournament:t1")

	if _, ok := c.Get("athlete:a1"); ok {
		t.Error("a1 should be invalidated")
	}
	if _, ok := c.Get("athlete:a2"); ok {
		t.Error("a2 should be invalidated")
	}
	// a3 is in tournament:t2 — should still be cached
	if _, ok := c.Get("athlete:a3"); !ok {
		t.Error("a3 should still be cached")
	}
}

func TestConfigureVCTDefaults(t *testing.T) {
	c := NewTTLCache(30*time.Second, 100)
	defer c.Close()
	ConfigureVCTDefaults(c)

	if c.GetEntityTTL("belt") != 1*time.Hour {
		t.Errorf("expected belt TTL 1h, got %v", c.GetEntityTTL("belt"))
	}
	if c.GetEntityTTL("scoring") != 0 {
		t.Errorf("expected scoring TTL 0 (disabled), got %v", c.GetEntityTTL("scoring"))
	}
	if c.GetEntityTTL("match") != 30*time.Second {
		t.Errorf("expected match TTL 30s, got %v", c.GetEntityTTL("match"))
	}
}
