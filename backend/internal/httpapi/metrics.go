package httpapi

import (
	"fmt"
	"net/http"
	"strconv"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — PROMETHEUS METRICS MIDDLEWARE
// Exports request count, latency, error rate at /metrics
// ═══════════════════════════════════════════════════════════════

// Metrics collects simple metrics in-memory.
type Metrics struct {
	totalRequests int64
	totalErrors   int64
	latencySum    float64
	latencyCount  int64
	statusCounts  map[int]int64
	pathCounts    map[string]int64
}

// NewMetrics creates a new metrics collector.
func NewMetrics() *Metrics {
	return &Metrics{
		statusCounts: make(map[int]int64),
		pathCounts:   make(map[string]int64),
	}
}

// Middleware records metrics for each request.
func (m *Metrics) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		rec := &statusRecorder{ResponseWriter: w, status: 200}
		next.ServeHTTP(rec, r)

		duration := time.Since(start).Seconds()

		m.totalRequests++
		m.latencySum += duration
		m.latencyCount++
		m.statusCounts[rec.status]++
		m.pathCounts[r.URL.Path]++

		if rec.status >= 500 {
			m.totalErrors++
		}
	})
}

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (sr *statusRecorder) WriteHeader(code int) {
	sr.status = code
	sr.ResponseWriter.WriteHeader(code)
}

// HandleMetrics returns Prometheus-compatible text metrics.
func (m *Metrics) HandleMetrics(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain; version=0.0.4")

	avgLatency := float64(0)
	if m.latencyCount > 0 {
		avgLatency = m.latencySum / float64(m.latencyCount)
	}

	fmt.Fprintf(w, "# HELP vct_http_requests_total Total number of HTTP requests\n")
	fmt.Fprintf(w, "# TYPE vct_http_requests_total counter\n")
	fmt.Fprintf(w, "vct_http_requests_total %d\n\n", m.totalRequests)

	fmt.Fprintf(w, "# HELP vct_http_errors_total Total number of HTTP 5xx errors\n")
	fmt.Fprintf(w, "# TYPE vct_http_errors_total counter\n")
	fmt.Fprintf(w, "vct_http_errors_total %d\n\n", m.totalErrors)

	fmt.Fprintf(w, "# HELP vct_http_request_duration_avg Average request duration in seconds\n")
	fmt.Fprintf(w, "# TYPE vct_http_request_duration_avg gauge\n")
	fmt.Fprintf(w, "vct_http_request_duration_avg %s\n\n", strconv.FormatFloat(avgLatency, 'f', 6, 64))

	fmt.Fprintf(w, "# HELP vct_http_responses_by_status HTTP responses by status code\n")
	fmt.Fprintf(w, "# TYPE vct_http_responses_by_status counter\n")
	for status, count := range m.statusCounts {
		fmt.Fprintf(w, "vct_http_responses_by_status{code=\"%d\"} %d\n", status, count)
	}
	fmt.Fprintf(w, "\n")

	fmt.Fprintf(w, "# HELP vct_http_requests_by_path HTTP requests by path\n")
	fmt.Fprintf(w, "# TYPE vct_http_requests_by_path counter\n")
	for path, count := range m.pathCounts {
		fmt.Fprintf(w, "vct_http_requests_by_path{path=%q} %d\n", path, count)
	}
}
