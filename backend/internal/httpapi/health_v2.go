package httpapi

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"runtime"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — ENHANCED HEALTH CHECK
// Deep health check: DB, WebSocket hub, uptime, memory.
// Provides /healthz/live (liveness) and /healthz/ready (readiness)
// ═══════════════════════════════════════════════════════════════

// HealthResponse represents the response from health endpoints.
type HealthResponse struct {
	Status    string                  `json:"status"`
	Timestamp string                  `json:"timestamp"`
	Version   string                  `json:"version"`
	Uptime    string                  `json:"uptime"`
	GoVersion string                  `json:"go_version"`
	Checks    map[string]*CheckResult `json:"checks"`
	System    *SystemInfo             `json:"system,omitempty"`
}

// CheckResult is the outcome of a single dependency check.
type CheckResult struct {
	Status  string `json:"status"`            // up, down, degraded
	Latency string `json:"latency,omitempty"` // e.g. "2.3ms"
	Message string `json:"message,omitempty"`
}

// SystemInfo has runtime info.
type SystemInfo struct {
	NumGoroutine int `json:"num_goroutine"`
	MemAllocMB   int `json:"mem_alloc_mb"`
	MemSysMB     int `json:"mem_sys_mb"`
	NumCPU       int `json:"num_cpu"`
}

// HealthChecker collects health probes.
type HealthChecker struct {
	db        *sql.DB
	startTime time.Time
}

// NewHealthChecker creates a new HealthChecker.
func NewHealthChecker(db *sql.DB) *HealthChecker {
	return &HealthChecker{
		db:        db,
		startTime: time.Now(),
	}
}

// HandleLive is the liveness probe — returns 200 if the process is running.
func (hc *HealthChecker) HandleLive(w http.ResponseWriter, r *http.Request) {
	resp := HealthResponse{
		Status:    "ok",
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Version:   "1.0.0",
		Uptime:    time.Since(hc.startTime).Round(time.Second).String(),
		GoVersion: runtime.Version(),
		Checks:    map[string]*CheckResult{"api": {Status: "up"}},
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// HandleReady is the readiness probe — checks all dependencies.
func (hc *HealthChecker) HandleReady(w http.ResponseWriter, r *http.Request) {
	checks := make(map[string]*CheckResult)
	overall := "ok"

	// 1. Database check
	checks["database"] = hc.checkDB(r.Context())
	if checks["database"].Status != "up" {
		overall = "degraded"
	}

	// 2. API check
	checks["api"] = &CheckResult{Status: "up"}

	// 3. System info
	var mem runtime.MemStats
	runtime.ReadMemStats(&mem)
	sysInfo := &SystemInfo{
		NumGoroutine: runtime.NumGoroutine(),
		MemAllocMB:   int(mem.Alloc / 1024 / 1024),
		MemSysMB:     int(mem.Sys / 1024 / 1024),
		NumCPU:       runtime.NumCPU(),
	}

	// High goroutine warning
	if sysInfo.NumGoroutine > 10000 {
		overall = "degraded"
		checks["goroutines"] = &CheckResult{
			Status:  "degraded",
			Message: "goroutine count > 10000",
		}
	}

	resp := HealthResponse{
		Status:    overall,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Version:   "1.0.0",
		Uptime:    time.Since(hc.startTime).Round(time.Second).String(),
		GoVersion: runtime.Version(),
		Checks:    checks,
		System:    sysInfo,
	}

	statusCode := http.StatusOK
	if overall != "ok" {
		statusCode = http.StatusServiceUnavailable
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(resp)
}

func (hc *HealthChecker) checkDB(ctx context.Context) *CheckResult {
	if hc.db == nil {
		return &CheckResult{Status: "down", Message: "no database configured"}
	}

	start := time.Now()
	ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	err := hc.db.PingContext(ctx)
	latency := time.Since(start)

	if err != nil {
		return &CheckResult{
			Status:  "down",
			Latency: latency.String(),
			Message: err.Error(),
		}
	}

	result := &CheckResult{
		Status:  "up",
		Latency: latency.String(),
	}

	// Warn if DB latency is high
	if latency > 500*time.Millisecond {
		result.Status = "degraded"
		result.Message = "high latency"
	}

	return result
}
