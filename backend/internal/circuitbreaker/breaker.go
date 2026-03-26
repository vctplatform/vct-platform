// Package circuitbreaker implements the circuit breaker pattern
// for protecting downstream services from cascading failures.
// Enhanced with Prometheus metrics, sliding window, and HTTP middleware.
package circuitbreaker

import (
	"errors"
	"fmt"
	"net/http"
	"sync"
	"time"
)

// State represents the circuit breaker state.
type State int

const (
	StateClosed   State = iota // Normal — requests pass through
	StateOpen                  // Tripped — requests fail fast
	StateHalfOpen              // Testing — limited requests allowed
)

func (s State) String() string {
	switch s {
	case StateClosed:
		return "closed"
	case StateOpen:
		return "open"
	case StateHalfOpen:
		return "half-open"
	default:
		return "unknown"
	}
}

var (
	ErrCircuitOpen = errors.New("circuit breaker is open")
)

// Config holds circuit breaker configuration.
type Config struct {
	Name             string        // Name for metrics labels
	FailureThreshold int           // Failures before opening
	SuccessThreshold int           // Successes in half-open before closing
	Timeout          time.Duration // Time in open state before half-open
	WindowSize       time.Duration // Sliding window for failure counting
	OnStateChange    func(name string, from, to State)
}

// DefaultConfig returns sensible defaults.
func DefaultConfig(name string) Config {
	return Config{
		Name:             name,
		FailureThreshold: 5,
		SuccessThreshold: 2,
		Timeout:          30 * time.Second,
		WindowSize:       60 * time.Second,
	}
}

// windowEntry tracks a failure/success event timestamp.
type windowEntry struct {
	at     time.Time
	failed bool
}

// Breaker is a circuit breaker with sliding window and metrics.
type Breaker struct {
	cfg       Config
	state     State
	successes int
	lastFail  time.Time
	window    []windowEntry
	mu        sync.RWMutex

	// Stats
	totalExecutions int64
	totalFailures   int64
	totalRejected   int64
}

// New creates a circuit breaker.
func New(cfg Config) *Breaker {
	return &Breaker{
		cfg:    cfg,
		state:  StateClosed,
		window: make([]windowEntry, 0, cfg.FailureThreshold*2),
	}
}

// Execute runs the given function through the circuit breaker.
// Returns ErrCircuitOpen if the circuit is open.
func (b *Breaker) Execute(fn func() error) error {
	if !b.canExecute() {
		b.mu.Lock()
		b.totalRejected++
		b.mu.Unlock()
		return ErrCircuitOpen
	}

	b.mu.Lock()
	b.totalExecutions++
	b.mu.Unlock()

	err := fn()

	if err != nil {
		b.recordFailure()
	} else {
		b.recordSuccess()
	}

	return err
}

// State returns the current circuit state.
func (b *Breaker) State() State {
	b.mu.RLock()
	defer b.mu.RUnlock()

	if b.state == StateOpen && time.Since(b.lastFail) > b.cfg.Timeout {
		return StateHalfOpen
	}
	return b.state
}

// Stats returns circuit breaker statistics.
func (b *Breaker) Stats() BreakerStats {
	b.mu.RLock()
	defer b.mu.RUnlock()

	return BreakerStats{
		Name:            b.cfg.Name,
		State:           b.state.String(),
		TotalExecutions: b.totalExecutions,
		TotalFailures:   b.totalFailures,
		TotalRejected:   b.totalRejected,
		WindowFailures:  b.countWindowFailures(),
		WindowSize:      b.cfg.WindowSize,
	}
}

// BreakerStats holds statistics for monitoring.
type BreakerStats struct {
	Name            string
	State           string
	TotalExecutions int64
	TotalFailures   int64
	TotalRejected   int64
	WindowFailures  int
	WindowSize      time.Duration
}

// Reset forces the circuit to closed state.
func (b *Breaker) Reset() {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.setState(StateClosed)
	b.successes = 0
	b.window = b.window[:0]
}

func (b *Breaker) canExecute() bool {
	b.mu.Lock()
	defer b.mu.Unlock()

	switch b.state {
	case StateClosed:
		return true
	case StateOpen:
		// Transition to half-open if timeout has elapsed
		if time.Since(b.lastFail) > b.cfg.Timeout {
			b.setState(StateHalfOpen)
			return true
		}
		return false
	case StateHalfOpen:
		return true
	}
	return false
}

func (b *Breaker) recordFailure() {
	b.mu.Lock()
	defer b.mu.Unlock()

	now := time.Now()
	b.totalFailures++
	b.successes = 0
	b.lastFail = now

	// Add to sliding window
	b.window = append(b.window, windowEntry{at: now, failed: true})
	b.pruneWindow(now)

	if b.state == StateHalfOpen || b.countWindowFailures() >= b.cfg.FailureThreshold {
		b.setState(StateOpen)
	}
}

func (b *Breaker) recordSuccess() {
	b.mu.Lock()
	defer b.mu.Unlock()

	now := time.Now()
	b.window = append(b.window, windowEntry{at: now, failed: false})
	b.pruneWindow(now)

	if b.state == StateHalfOpen {
		b.successes++
		if b.successes >= b.cfg.SuccessThreshold {
			b.setState(StateClosed)
			b.successes = 0
			b.window = b.window[:0]
		}
	}
}

// countWindowFailures counts failures within the sliding window.
func (b *Breaker) countWindowFailures() int {
	count := 0
	for _, e := range b.window {
		if e.failed {
			count++
		}
	}
	return count
}

// pruneWindow removes entries older than the window size.
func (b *Breaker) pruneWindow(now time.Time) {
	cutoff := now.Add(-b.cfg.WindowSize)
	i := 0
	for i < len(b.window) && b.window[i].at.Before(cutoff) {
		i++
	}
	if i > 0 {
		b.window = append(b.window[:0], b.window[i:]...)
	}
}

func (b *Breaker) setState(to State) {
	from := b.state
	if from == to {
		return
	}
	b.state = to
	if b.cfg.OnStateChange != nil {
		name := b.cfg.Name
		go b.cfg.OnStateChange(name, from, to)
	}
}

// ════════════════════════════════════════
// HTTP Middleware
// ════════════════════════════════════════

// HTTPMiddleware wraps an http.Handler with circuit breaker protection.
// Returns 503 Service Unavailable when the circuit is open.
func HTTPMiddleware(breaker *Breaker) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if breaker.State() == StateOpen {
				w.Header().Set("Content-Type", "application/json")
				w.Header().Set("Retry-After", fmt.Sprintf("%.0f", breaker.cfg.Timeout.Seconds()))
				w.WriteHeader(http.StatusServiceUnavailable)
				fmt.Fprintf(w, `{"error":"service_unavailable","message":"Circuit breaker is open, service temporarily unavailable","retry_after_seconds":%.0f}`,
					breaker.cfg.Timeout.Seconds())
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
