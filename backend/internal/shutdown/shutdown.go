// Package shutdown provides a graceful shutdown orchestrator that coordinates
// clean service termination with ordered hooks, timeouts, and signal handling.
package shutdown

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"sort"
	"sync"
	"syscall"
	"time"
)

// Priority defines shutdown execution order (lower = earlier).
type Priority int

const (
	PriorityHTTP     Priority = 10  // Stop accepting new HTTP requests
	PriorityWebSocket Priority = 20 // Disconnect WS clients
	PriorityWorkers  Priority = 30  // Drain background workers / job queues
	PriorityCache    Priority = 40  // Flush caches
	PriorityDatabase Priority = 50  // Close DB connection pools
	PriorityCleanup  Priority = 100 // Final cleanup (temp files, locks)
)

// Hook is a named shutdown callback.
type Hook struct {
	Name     string
	Priority Priority
	Fn       func(ctx context.Context) error
}

// Manager orchestrates graceful shutdown.
type Manager struct {
	hooks   []Hook
	timeout time.Duration
	logger  *slog.Logger
	mu      sync.Mutex
	done    chan struct{}
	once    sync.Once
}

// NewManager creates a shutdown manager with timeout.
func NewManager(timeout time.Duration, logger *slog.Logger) *Manager {
	return &Manager{
		timeout: timeout,
		logger:  logger.With(slog.String("component", "shutdown")),
		done:    make(chan struct{}),
	}
}

// Register adds a shutdown hook.
func (m *Manager) Register(hook Hook) {
	m.mu.Lock()
	m.hooks = append(m.hooks, hook)
	m.mu.Unlock()
}

// RegisterFunc is a convenience method for simple hooks.
func (m *Manager) RegisterFunc(name string, priority Priority, fn func(ctx context.Context) error) {
	m.Register(Hook{Name: name, Priority: priority, Fn: fn})
}

// ListenAndShutdown blocks until a termination signal is received,
// then runs all hooks in priority order with the configured timeout.
func (m *Manager) ListenAndShutdown() {
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	select {
	case sig := <-sigCh:
		m.logger.Info("received shutdown signal", "signal", sig.String())
	case <-m.done:
		m.logger.Info("shutdown triggered programmatically")
	}

	m.Execute()
}

// Trigger initiates shutdown programmatically (without OS signal).
func (m *Manager) Trigger() {
	m.once.Do(func() {
		close(m.done)
	})
}

// Execute runs all hooks in priority order with the configured timeout.
// This is also called internally by ListenAndShutdown.
func (m *Manager) Execute() {
	m.mu.Lock()
	hooks := make([]Hook, len(m.hooks))
	copy(hooks, m.hooks)
	m.mu.Unlock()

	// Sort by priority (lowest first)
	sort.SliceStable(hooks, func(i, j int) bool {
		return hooks[i].Priority < hooks[j].Priority
	})

	ctx, cancel := context.WithTimeout(context.Background(), m.timeout)
	defer cancel()

	m.logger.Info("starting graceful shutdown", "hooks", len(hooks), "timeout", m.timeout)
	start := time.Now()

	for _, hook := range hooks {
		select {
		case <-ctx.Done():
			m.logger.Error("shutdown timeout exceeded, aborting remaining hooks",
				"remaining_hook", hook.Name)
			return
		default:
		}

		hookStart := time.Now()
		m.logger.Info("executing shutdown hook", "name", hook.Name, "priority", int(hook.Priority))

		if err := hook.Fn(ctx); err != nil {
			m.logger.Error("shutdown hook failed",
				"name", hook.Name,
				"error", err,
				"duration", time.Since(hookStart))
		} else {
			m.logger.Info("shutdown hook completed",
				"name", hook.Name,
				"duration", time.Since(hookStart))
		}
	}

	m.logger.Info("graceful shutdown complete", "total_duration", time.Since(start))
}

// Done returns a channel that is closed when shutdown is triggered.
func (m *Manager) Done() <-chan struct{} {
	return m.done
}
