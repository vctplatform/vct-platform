// Package graceful provides ordered, timeout-bounded shutdown
// for HTTP servers, database pools, message queues, and background workers.
package graceful

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"
)

// ShutdownFunc is called during shutdown with a deadline context.
type ShutdownFunc func(ctx context.Context) error

// Hook represents a named shutdown action with a priority.
type Hook struct {
	Name     string
	Priority int // Lower = runs first (0=HTTP, 10=workers, 20=queues, 30=DB)
	Fn       ShutdownFunc
}

// Manager orchestrates graceful shutdown.
type Manager struct {
	hooks   []Hook
	timeout time.Duration
	logger  *slog.Logger
	mu      sync.Mutex
}

// NewManager creates a shutdown manager.
func NewManager(timeout time.Duration, logger *slog.Logger) *Manager {
	return &Manager{
		timeout: timeout,
		logger:  logger.With(slog.String("component", "shutdown")),
	}
}

// Register adds a shutdown hook.
func (m *Manager) Register(hook Hook) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.hooks = append(m.hooks, hook)
}

// RegisterFunc is a convenience for registering without a Hook struct.
func (m *Manager) RegisterFunc(name string, priority int, fn ShutdownFunc) {
	m.Register(Hook{Name: name, Priority: priority, Fn: fn})
}

// WaitForShutdown blocks until SIGINT/SIGTERM and runs hooks in priority order.
func (m *Manager) WaitForShutdown() {
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	sig := <-quit

	m.logger.Info("shutdown signal received",
		slog.String("signal", sig.String()),
	)

	m.Execute()
}

// Execute runs all shutdown hooks in priority order with timeout.
func (m *Manager) Execute() {
	m.mu.Lock()
	hooks := make([]Hook, len(m.hooks))
	copy(hooks, m.hooks)
	m.mu.Unlock()

	// Sort by priority (stable sort preserves registration order within same priority)
	sortHooks(hooks)

	ctx, cancel := context.WithTimeout(context.Background(), m.timeout)
	defer cancel()

	m.logger.Info("starting graceful shutdown",
		slog.Int("hooks", len(hooks)),
		slog.String("timeout", m.timeout.String()),
	)

	start := time.Now()

	// Group hooks by priority and run each group
	groups := groupByPriority(hooks)
	for _, group := range groups {
		var wg sync.WaitGroup
		for _, hook := range group {
			wg.Add(1)
			go func(h Hook) {
				defer wg.Done()
				hookStart := time.Now()
				m.logger.Info("shutting down",
					slog.String("hook", h.Name),
					slog.Int("priority", h.Priority),
				)

				if err := h.Fn(ctx); err != nil {
					m.logger.Error("shutdown hook failed",
						slog.String("hook", h.Name),
						slog.String("error", err.Error()),
						slog.String("duration", time.Since(hookStart).String()),
					)
				} else {
					m.logger.Info("shutdown complete",
						slog.String("hook", h.Name),
						slog.String("duration", time.Since(hookStart).String()),
					)
				}
			}(hook)
		}
		wg.Wait()
	}

	m.logger.Info("graceful shutdown finished",
		slog.String("total_duration", time.Since(start).String()),
	)
}

func sortHooks(hooks []Hook) {
	for i := 1; i < len(hooks); i++ {
		for j := i; j > 0 && hooks[j].Priority < hooks[j-1].Priority; j-- {
			hooks[j], hooks[j-1] = hooks[j-1], hooks[j]
		}
	}
}

func groupByPriority(hooks []Hook) [][]Hook {
	if len(hooks) == 0 {
		return nil
	}
	var groups [][]Hook
	currentPriority := hooks[0].Priority
	var current []Hook

	for _, h := range hooks {
		if h.Priority != currentPriority {
			groups = append(groups, current)
			current = nil
			currentPriority = h.Priority
		}
		current = append(current, h)
	}
	groups = append(groups, current)
	return groups
}

// Predefined priorities.
const (
	PriorityHTTP    = 0  // Stop accepting new requests first
	PriorityWorkers = 10 // Stop background workers
	PriorityQueues  = 20 // Drain message queues
	PriorityCache   = 25 // Flush cache
	PriorityDB      = 30 // Close database connections last
)

// Example usage:
//
//   mgr := graceful.NewManager(30*time.Second, logger)
//   mgr.RegisterFunc("http-server", graceful.PriorityHTTP, server.Shutdown)
//   mgr.RegisterFunc("postgres", graceful.PriorityDB, func(ctx context.Context) error {
//       pool.Close()
//       return nil
//   })
//   mgr.RegisterFunc("redis", graceful.PriorityCache, func(ctx context.Context) error {
//       return redisClient.Close()
//   })
//
//   go mgr.WaitForShutdown()
//   server.ListenAndServe()
//

// String returns a human-readable description for logging.
func (h Hook) String() string {
	return fmt.Sprintf("Hook{%s, priority=%d}", h.Name, h.Priority)
}
