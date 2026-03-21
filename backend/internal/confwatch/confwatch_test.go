package confwatch

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"sync/atomic"
	"testing"
	"time"
)

type testConfig struct {
	AppName  string `json:"app_name"`
	MaxConns int    `json:"max_conns"`
	Debug    bool   `json:"debug"`
}

func TestHolder_GetSet(t *testing.T) {
	h := NewHolder(testConfig{AppName: "vct", MaxConns: 10})

	cfg := h.Get()
	if cfg.AppName != "vct" {
		t.Errorf("expected vct, got %s", cfg.AppName)
	}

	h.Set(testConfig{AppName: "vct-v2", MaxConns: 20})
	cfg = h.Get()
	if cfg.AppName != "vct-v2" || cfg.MaxConns != 20 {
		t.Error("set did not update")
	}
}

func TestHolder_Version(t *testing.T) {
	h := NewHolder(testConfig{})
	if h.Version() != 0 {
		t.Error("initial version should be 0")
	}

	h.Set(testConfig{AppName: "v1"})
	h.Set(testConfig{AppName: "v2"})
	if h.Version() != 2 {
		t.Errorf("expected version 2, got %d", h.Version())
	}
}

func TestHolder_OnChange(t *testing.T) {
	h := NewHolder(testConfig{AppName: "old"})
	var captured atomic.Value

	h.OnChange(func(old, new testConfig) {
		captured.Store(old.AppName + "->" + new.AppName)
	})

	h.Set(testConfig{AppName: "new"})

	got, ok := captured.Load().(string)
	if !ok || got != "old->new" {
		t.Errorf("expected old->new, got %v", got)
	}
}

func TestHolder_MultipleListeners(t *testing.T) {
	h := NewHolder(testConfig{})
	var count atomic.Int32

	h.OnChange(func(_, _ testConfig) { count.Add(1) })
	h.OnChange(func(_, _ testConfig) { count.Add(1) })

	h.Set(testConfig{AppName: "new"})

	if count.Load() != 2 {
		t.Errorf("expected 2 callbacks, got %d", count.Load())
	}
}

func TestHolder_Snapshot(t *testing.T) {
	h := NewHolder(testConfig{AppName: "snap"})
	h.Set(testConfig{AppName: "snap-v2"})

	snap := h.Snapshot()
	if snap.Value.AppName != "snap-v2" {
		t.Error("snapshot value mismatch")
	}
	if snap.Version != 1 {
		t.Errorf("expected version 1, got %d", snap.Version)
	}
}

func TestFileWatcher_LoadAndReload(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "config.json")

	// Write initial config
	writeJSON(t, path, testConfig{AppName: "vct", MaxConns: 5})

	h := NewHolder(testConfig{})
	w := WatchFile(path, 100*time.Millisecond, h)

	err := w.Start(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	defer w.Stop()

	cfg := h.Get()
	if cfg.AppName != "vct" {
		t.Errorf("expected vct, got %s", cfg.AppName)
	}

	// Modify config
	writeJSON(t, path, testConfig{AppName: "vct-reloaded", MaxConns: 20})

	time.Sleep(500 * time.Millisecond)

	cfg = h.Get()
	if cfg.AppName != "vct-reloaded" {
		t.Errorf("expected vct-reloaded, got %s", cfg.AppName)
	}
	if w.Reloads() < 2 {
		t.Errorf("expected at least 2 reloads, got %d", w.Reloads())
	}
}

func TestFileWatcher_NoReloadOnSameContent(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "config.json")

	writeJSON(t, path, testConfig{AppName: "stable"})

	h := NewHolder(testConfig{})
	w := WatchFile(path, 100*time.Millisecond, h)
	w.Start(context.Background())
	defer w.Stop()

	initialReloads := w.Reloads()
	time.Sleep(500 * time.Millisecond)

	// Should not have reloaded since content unchanged
	if w.Reloads() != initialReloads {
		t.Errorf("should not reload on same content: initial=%d, now=%d", initialReloads, w.Reloads())
	}
}

func TestFileWatcher_InvalidJSON(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "config.json")

	writeJSON(t, path, testConfig{AppName: "valid"})

	h := NewHolder(testConfig{})
	w := WatchFile(path, 100*time.Millisecond, h)
	w.Start(context.Background())
	defer w.Stop()

	// Write invalid JSON
	os.WriteFile(path, []byte("{invalid json}"), 0644)

	time.Sleep(500 * time.Millisecond)

	// Should keep old value
	if h.Get().AppName != "valid" {
		t.Error("should keep old config on parse error")
	}
	if w.Errors() == 0 {
		t.Error("should have recorded errors")
	}
}

func TestFileWatcher_MissingFile(t *testing.T) {
	h := NewHolder(testConfig{})
	w := WatchFile("/nonexistent/config.json", time.Second, h)

	err := w.Start(context.Background())
	if err == nil {
		t.Error("expected error for missing file")
	}
}

func TestFileWatcher_ChangeCallback(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "config.json")

	writeJSON(t, path, testConfig{AppName: "v1"})

	h := NewHolder(testConfig{})
	var changed atomic.Int32
	h.OnChange(func(old, new testConfig) {
		changed.Add(1)
	})

	w := WatchFile(path, 100*time.Millisecond, h)
	w.Start(context.Background())
	defer w.Stop()

	writeJSON(t, path, testConfig{AppName: "v2"})
	time.Sleep(500 * time.Millisecond)

	if changed.Load() < 2 { // initial load + file change
		t.Errorf("expected at least 2 change callbacks, got %d", changed.Load())
	}
}

func writeJSON(t *testing.T, path string, v any) {
	t.Helper()
	data, _ := json.MarshalIndent(v, "", "  ")
	if err := os.WriteFile(path, data, 0644); err != nil {
		t.Fatal(err)
	}
}
