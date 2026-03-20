// Package healthcheck provides deep health probes for all dependencies
// with liveness (is the process alive?) and readiness (can it serve traffic?).
package healthcheck

import (
	"context"
	"encoding/json"
	"net/http"
	"sync"
	"time"
)

// Status represents the health state of a component.
type Status string

const (
	StatusUp       Status = "up"
	StatusDown     Status = "down"
	StatusDegraded Status = "degraded"
)

// CheckResult holds the result of a single dependency check.
type CheckResult struct {
	Name     string        `json:"name"`
	Status   Status        `json:"status"`
	Duration time.Duration `json:"-"`
	DurationMs float64    `json:"duration_ms"`
	Message  string        `json:"message,omitempty"`
	Error    string        `json:"error,omitempty"`
}

// HealthResponse is the complete health check response.
type HealthResponse struct {
	Status     Status        `json:"status"`
	Version    string        `json:"version"`
	Uptime     string        `json:"uptime"`
	Checks     []CheckResult `json:"checks"`
	Timestamp  string        `json:"timestamp"`
}

// Checker is a function that checks a dependency's health.
type Checker func(ctx context.Context) CheckResult

// Service manages health checks for all dependencies.
type Service struct {
	checkers  map[string]Checker
	version   string
	startTime time.Time
	timeout   time.Duration
	mu        sync.RWMutex
}

// NewService creates a health check service.
func NewService(version string) *Service {
	return &Service{
		checkers:  make(map[string]Checker),
		version:   version,
		startTime: time.Now(),
		timeout:   5 * time.Second,
	}
}

// Register adds a health checker for a named dependency.
func (s *Service) Register(name string, checker Checker) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.checkers[name] = checker
}

// Check runs all registered health checks concurrently.
func (s *Service) Check(ctx context.Context) HealthResponse {
	s.mu.RLock()
	checkers := make(map[string]Checker, len(s.checkers))
	for k, v := range s.checkers {
		checkers[k] = v
	}
	s.mu.RUnlock()

	ctx, cancel := context.WithTimeout(ctx, s.timeout)
	defer cancel()

	results := make([]CheckResult, 0, len(checkers))
	ch := make(chan CheckResult, len(checkers))

	for name, checker := range checkers {
		go func(n string, c Checker) {
			start := time.Now()
			result := c(ctx)
			result.Name = n
			result.Duration = time.Since(start)
			result.DurationMs = float64(result.Duration.Microseconds()) / 1000.0
			ch <- result
		}(name, checker)
	}

	for range checkers {
		results = append(results, <-ch)
	}

	overall := StatusUp
	for _, r := range results {
		if r.Status == StatusDown {
			overall = StatusDown
			break
		}
		if r.Status == StatusDegraded {
			overall = StatusDegraded
		}
	}

	return HealthResponse{
		Status:    overall,
		Version:   s.version,
		Uptime:    time.Since(s.startTime).Round(time.Second).String(),
		Checks:    results,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	}
}

// ── HTTP Handlers ────────────────────────

// LivenessHandler returns 200 if the process is alive (no dependency checks).
func (s *Service) LivenessHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"status": "alive",
			"uptime": time.Since(s.startTime).Round(time.Second).String(),
		})
	}
}

// ReadinessHandler returns 200 only if ALL dependencies are healthy.
func (s *Service) ReadinessHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		resp := s.Check(r.Context())

		w.Header().Set("Content-Type", "application/json")
		if resp.Status == StatusDown {
			w.WriteHeader(http.StatusServiceUnavailable)
		} else {
			w.WriteHeader(http.StatusOK)
		}
		json.NewEncoder(w).Encode(resp)
	}
}

// ── Built-in Checkers ────────────────────

// PingChecker creates a checker that pings via a function (DB, Redis, etc.).
func PingChecker(name string, pingFn func(ctx context.Context) error) Checker {
	return func(ctx context.Context) CheckResult {
		if err := pingFn(ctx); err != nil {
			return CheckResult{Status: StatusDown, Error: err.Error()}
		}
		return CheckResult{Status: StatusUp, Message: "reachable"}
	}
}

// ThresholdChecker creates a checker that compares a value against a threshold.
func ThresholdChecker(valueFn func() float64, warnThreshold, critThreshold float64) Checker {
	return func(ctx context.Context) CheckResult {
		val := valueFn()
		switch {
		case val >= critThreshold:
			return CheckResult{Status: StatusDown, Message: "critical threshold exceeded"}
		case val >= warnThreshold:
			return CheckResult{Status: StatusDegraded, Message: "warning threshold exceeded"}
		default:
			return CheckResult{Status: StatusUp}
		}
	}
}
