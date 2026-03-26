// Package bulkhead provides concurrency isolation using semaphore-based
// resource limiting, per-resource bulkheads, and HTTP middleware.
package bulkhead

import (
	"context"
	"fmt"
	"net/http"
	"sync"
	"sync/atomic"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// Bulkhead — Semaphore-based concurrency limiter
// ═══════════════════════════════════════════════════════════════

// Bulkhead limits concurrent access to a resource.
type Bulkhead struct {
	name    string
	sem     chan struct{}
	maxConc int
	timeout time.Duration

	// Stats
	active    atomic.Int64
	total     atomic.Int64
	rejected  atomic.Int64
	completed atomic.Int64
}

// New creates a bulkhead with max concurrent executions and acquire timeout.
func New(name string, maxConcurrent int, timeout time.Duration) *Bulkhead {
	return &Bulkhead{
		name:    name,
		sem:     make(chan struct{}, maxConcurrent),
		maxConc: maxConcurrent,
		timeout: timeout,
	}
}

// Execute runs fn within the bulkhead concurrency limit.
// Returns ErrBulkheadFull if the semaphore cannot be acquired within timeout.
func (b *Bulkhead) Execute(ctx context.Context, fn func() error) error {
	b.total.Add(1)

	timer := time.NewTimer(b.timeout)
	defer timer.Stop()

	select {
	case b.sem <- struct{}{}:
		// Acquired
	case <-timer.C:
		b.rejected.Add(1)
		return fmt.Errorf("bulkhead %q: %w", b.name, ErrBulkheadFull)
	case <-ctx.Done():
		b.rejected.Add(1)
		return ctx.Err()
	}

	b.active.Add(1)
	defer func() {
		<-b.sem
		b.active.Add(-1)
		b.completed.Add(1)
	}()

	return fn()
}

// ErrBulkheadFull is returned when the bulkhead is at capacity.
var ErrBulkheadFull = fmt.Errorf("concurrency limit exceeded")

// Stats returns current bulkhead statistics.
type Stats struct {
	Name      string `json:"name"`
	Max       int    `json:"max_concurrent"`
	Active    int64  `json:"active"`
	Total     int64  `json:"total"`
	Completed int64  `json:"completed"`
	Rejected  int64  `json:"rejected"`
}

func (b *Bulkhead) Stats() Stats {
	return Stats{
		Name:      b.name,
		Max:       b.maxConc,
		Active:    b.active.Load(),
		Total:     b.total.Load(),
		Completed: b.completed.Load(),
		Rejected:  b.rejected.Load(),
	}
}

// Active returns current in-flight count.
func (b *Bulkhead) Active() int64 { return b.active.Load() }

// ═══════════════════════════════════════════════════════════════
// Group — Per-resource bulkhead isolation
// ═══════════════════════════════════════════════════════════════

// Group manages multiple named bulkheads for resource isolation.
type Group struct {
	bulkheads map[string]*Bulkhead
	maxConc   int
	timeout   time.Duration
	mu        sync.RWMutex
}

// NewGroup creates a bulkhead group with defaults for auto-created bulkheads.
func NewGroup(defaultMaxConcurrent int, defaultTimeout time.Duration) *Group {
	return &Group{
		bulkheads: make(map[string]*Bulkhead),
		maxConc:   defaultMaxConcurrent,
		timeout:   defaultTimeout,
	}
}

// Get returns or creates a named bulkhead.
func (g *Group) Get(name string) *Bulkhead {
	g.mu.RLock()
	if b, ok := g.bulkheads[name]; ok {
		g.mu.RUnlock()
		return b
	}
	g.mu.RUnlock()

	g.mu.Lock()
	defer g.mu.Unlock()
	if b, ok := g.bulkheads[name]; ok {
		return b
	}
	b := New(name, g.maxConc, g.timeout)
	g.bulkheads[name] = b
	return b
}

// AllStats returns stats for all bulkheads.
func (g *Group) AllStats() []Stats {
	g.mu.RLock()
	defer g.mu.RUnlock()
	stats := make([]Stats, 0, len(g.bulkheads))
	for _, b := range g.bulkheads {
		stats = append(stats, b.Stats())
	}
	return stats
}

// ═══════════════════════════════════════════════════════════════
// HTTP Middleware
// ═══════════════════════════════════════════════════════════════

// HTTPMiddleware wraps an HTTP handler with bulkhead concurrency protection.
// Returns 429 Too Many Requests when the bulkhead is full.
func HTTPMiddleware(b *Bulkhead) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			err := b.Execute(r.Context(), func() error {
				next.ServeHTTP(w, r)
				return nil
			})

			if err != nil {
				w.Header().Set("Retry-After", "5")
				http.Error(w, fmt.Sprintf(`{"error":"too_many_requests","message":"%s"}`, err.Error()),
					http.StatusTooManyRequests)
			}
		})
	}
}
