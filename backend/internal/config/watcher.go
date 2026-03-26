package config

import (
	"log/slog"
	"os"
	"sync"
	"time"
)

// Watcher provides hot-reload by polling for config file changes
// and notifying subscribers when configuration is updated.
type Watcher struct {
	path     string
	interval time.Duration
	logger   *slog.Logger
	onChange []func(Config)
	lastMod  time.Time
	stopCh   chan struct{}
	mu       sync.RWMutex
	current  Config
}

// NewWatcher creates a config watcher that polls a file for changes.
func NewWatcher(path string, interval time.Duration, logger *slog.Logger) *Watcher {
	return &Watcher{
		path:     path,
		interval: interval,
		logger:   logger.With(slog.String("component", "config_watcher")),
		stopCh:   make(chan struct{}),
	}
}

// OnChange registers a callback for config changes.
func (w *Watcher) OnChange(fn func(Config)) {
	w.mu.Lock()
	defer w.mu.Unlock()
	w.onChange = append(w.onChange, fn)
}

// Current returns the latest loaded config.
func (w *Watcher) Current() Config {
	w.mu.RLock()
	defer w.mu.RUnlock()
	return w.current
}

// Start begins polling for config file changes.
func (w *Watcher) Start() {
	// Load initial config
	w.current = Load()
	w.lastMod = w.fileModTime()

	go func() {
		ticker := time.NewTicker(w.interval)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				w.poll()
			case <-w.stopCh:
				return
			}
		}
	}()

	w.logger.Info("config watcher started",
		slog.String("path", w.path),
		slog.String("interval", w.interval.String()),
	)
}

// Stop halts the watcher.
func (w *Watcher) Stop() {
	close(w.stopCh)
	w.logger.Info("config watcher stopped")
}

func (w *Watcher) poll() {
	modTime := w.fileModTime()
	if modTime.Equal(w.lastMod) {
		return
	}

	w.logger.Info("config file changed, reloading",
		slog.String("path", w.path),
	)

	newCfg := Load()
	if err := newCfg.Validate(); err != nil {
		w.logger.Error("new config invalid, keeping current",
			slog.String("error", err.Error()),
		)
		return
	}

	w.mu.Lock()
	w.current = newCfg
	w.lastMod = modTime
	callbacks := make([]func(Config), len(w.onChange))
	copy(callbacks, w.onChange)
	w.mu.Unlock()

	for _, fn := range callbacks {
		fn(newCfg)
	}

	w.logger.Info("config reloaded successfully")
}

func (w *Watcher) fileModTime() time.Time {
	info, err := os.Stat(w.path)
	if err != nil {
		return time.Time{}
	}
	return info.ModTime()
}
