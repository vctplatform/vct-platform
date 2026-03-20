package observability

import (
	"context"
	"encoding/json"
	"net/http"
	"runtime"
	"time"
)

// ════════════════════════════════════════
// Enhanced Health Check Endpoint
// Reports component-level health status
// ════════════════════════════════════════

// HealthStatus represents the overall and per-component health.
type HealthStatus struct {
	Status     string                    `json:"status"`
	Timestamp  string                    `json:"timestamp"`
	Uptime     string                    `json:"uptime"`
	Version    string                    `json:"version"`
	Components map[string]ComponentCheck `json:"components"`
	Runtime    RuntimeInfo               `json:"runtime"`
}

// ComponentCheck represents the health of a single component.
type ComponentCheck struct {
	Status  string `json:"status"`
	Latency string `json:"latency,omitempty"`
	Message string `json:"message,omitempty"`
}

// RuntimeInfo holds Go runtime information.
type RuntimeInfo struct {
	Goroutines int    `json:"goroutines"`
	GoVersion  string `json:"go_version"`
	NumCPU     int    `json:"num_cpu"`
	MemAllocMB int    `json:"mem_alloc_mb"`
}

// Checker is a function that checks a component's health.
type Checker func(ctx context.Context) ComponentCheck

// HealthHandler creates a comprehensive health check handler.
// It runs all registered component checks and returns 200 if all pass, 503 if any fail.
func HealthHandler(version string, startTime time.Time, checkers map[string]Checker) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		components := make(map[string]ComponentCheck, len(checkers))
		allHealthy := true

		for name, checker := range checkers {
			check := checker(ctx)
			components[name] = check
			if check.Status != "healthy" {
				allHealthy = false
			}
		}

		// Runtime metrics
		var memStats runtime.MemStats
		runtime.ReadMemStats(&memStats)
		GoGoroutines.Set(float64(runtime.NumGoroutine()))

		status := "healthy"
		httpStatus := http.StatusOK
		if !allHealthy {
			status = "degraded"
			httpStatus = http.StatusServiceUnavailable
		}

		health := HealthStatus{
			Status:     status,
			Timestamp:  time.Now().UTC().Format(time.RFC3339),
			Uptime:     time.Since(startTime).Truncate(time.Second).String(),
			Version:    version,
			Components: components,
			Runtime: RuntimeInfo{
				Goroutines: runtime.NumGoroutine(),
				GoVersion:  runtime.Version(),
				NumCPU:     runtime.NumCPU(),
				MemAllocMB: int(memStats.Alloc / 1024 / 1024),
			},
		}

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Cache-Control", "no-cache, no-store")
		w.WriteHeader(httpStatus)
		json.NewEncoder(w).Encode(health)
	}
}

// DBChecker creates a health checker for the database.
func DBChecker(pingFn func(ctx context.Context) error) Checker {
	return func(ctx context.Context) ComponentCheck {
		start := time.Now()
		if err := pingFn(ctx); err != nil {
			return ComponentCheck{
				Status:  "unhealthy",
				Latency: time.Since(start).String(),
				Message: err.Error(),
			}
		}
		return ComponentCheck{
			Status:  "healthy",
			Latency: time.Since(start).String(),
		}
	}
}

// RedisChecker creates a health checker for Redis.
func RedisChecker(pingFn func(ctx context.Context) error) Checker {
	return func(ctx context.Context) ComponentCheck {
		start := time.Now()
		if err := pingFn(ctx); err != nil {
			return ComponentCheck{
				Status:  "unhealthy",
				Latency: time.Since(start).String(),
				Message: err.Error(),
			}
		}
		return ComponentCheck{
			Status:  "healthy",
			Latency: time.Since(start).String(),
		}
	}
}

// NATSChecker creates a health checker for NATS.
func NATSChecker(isConnected func() bool) Checker {
	return func(_ context.Context) ComponentCheck {
		if isConnected() {
			return ComponentCheck{Status: "healthy"}
		}
		return ComponentCheck{
			Status:  "unhealthy",
			Message: "NATS disconnected",
		}
	}
}
