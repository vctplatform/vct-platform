// Package confwatch provides a typed configuration holder with atomic swap,
// file-based polling watcher, and change notification callbacks.
package confwatch

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"os"
	"sync"
	"sync/atomic"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// Holder — Atomic config value
// ═══════════════════════════════════════════════════════════════

// Holder provides thread-safe access to a typed config value.
type Holder[T any] struct {
	value     atomic.Pointer[T]
	listeners []func(old, new T)
	mu        sync.Mutex
	version   atomic.Int64
}

// NewHolder creates a config holder with an initial value.
func NewHolder[T any](initial T) *Holder[T] {
	h := &Holder[T]{}
	h.value.Store(&initial)
	return h
}

// Get returns the current config value.
func (h *Holder[T]) Get() T {
	return *h.value.Load()
}

// Set atomically swaps the config and notifies listeners.
func (h *Holder[T]) Set(newVal T) {
	old := h.Get()
	h.value.Store(&newVal)
	h.version.Add(1)

	h.mu.Lock()
	listeners := make([]func(old, new T), len(h.listeners))
	copy(listeners, h.listeners)
	h.mu.Unlock()

	for _, fn := range listeners {
		fn(old, newVal)
	}
}

// OnChange registers a callback for config changes.
func (h *Holder[T]) OnChange(fn func(old, new T)) {
	h.mu.Lock()
	h.listeners = append(h.listeners, fn)
	h.mu.Unlock()
}

// Version returns the number of times the config has been updated.
func (h *Holder[T]) Version() int64 {
	return h.version.Load()
}

// ═══════════════════════════════════════════════════════════════
// FileWatcher — Poll-based config file watcher
// ═══════════════════════════════════════════════════════════════

// FileWatcher watches a JSON config file and reloads on change.
type FileWatcher[T any] struct {
	path     string
	holder   *Holder[T]
	interval time.Duration
	lastHash string
	cancel   context.CancelFunc
	reloads  atomic.Int64
	errors   atomic.Int64
}

// WatchFile creates a watcher that polls a JSON config file.
func WatchFile[T any](path string, interval time.Duration, holder *Holder[T]) *FileWatcher[T] {
	return &FileWatcher[T]{
		path:     path,
		holder:   holder,
		interval: interval,
	}
}

// Start begins polling. Loads the file immediately on start.
func (w *FileWatcher[T]) Start(ctx context.Context) error {
	// Initial load
	if err := w.reload(); err != nil {
		return fmt.Errorf("initial load: %w", err)
	}

	ctx, w.cancel = context.WithCancel(ctx)
	go w.poll(ctx)
	return nil
}

// Stop halts the watcher.
func (w *FileWatcher[T]) Stop() {
	if w.cancel != nil {
		w.cancel()
	}
}

// Reloads returns number of successful reloads.
func (w *FileWatcher[T]) Reloads() int64 {
	return w.reloads.Load()
}

// Errors returns number of reload errors.
func (w *FileWatcher[T]) Errors() int64 {
	return w.errors.Load()
}

func (w *FileWatcher[T]) poll(ctx context.Context) {
	ticker := time.NewTicker(w.interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			w.checkAndReload()
		}
	}
}

func (w *FileWatcher[T]) checkAndReload() {
	data, err := os.ReadFile(w.path)
	if err != nil {
		w.errors.Add(1)
		return
	}

	hash := fmt.Sprintf("%x", sha256.Sum256(data))
	if hash == w.lastHash {
		return // No change
	}

	var cfg T
	if err := json.Unmarshal(data, &cfg); err != nil {
		w.errors.Add(1)
		return
	}

	w.lastHash = hash
	w.holder.Set(cfg)
	w.reloads.Add(1)
}

func (w *FileWatcher[T]) reload() error {
	data, err := os.ReadFile(w.path)
	if err != nil {
		return err
	}

	var cfg T
	if err := json.Unmarshal(data, &cfg); err != nil {
		return err
	}

	w.lastHash = fmt.Sprintf("%x", sha256.Sum256(data))
	w.holder.Set(cfg)
	w.reloads.Add(1)
	return nil
}

// ═══════════════════════════════════════════════════════════════
// Snapshot — Point-in-time config capture
// ═══════════════════════════════════════════════════════════════

// Snapshot captures the current config with its version.
type Snapshot[T any] struct {
	Value   T     `json:"value"`
	Version int64 `json:"version"`
}

// Snapshot returns the current value and version atomically.
func (h *Holder[T]) Snapshot() Snapshot[T] {
	return Snapshot[T]{
		Value:   h.Get(),
		Version: h.Version(),
	}
}
