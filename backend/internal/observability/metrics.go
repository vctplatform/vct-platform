package observability

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

// ════════════════════════════════════════
// VCT Platform — Prometheus Metrics Registry
// ════════════════════════════════════════

var (
	// ── HTTP Metrics ──────────────────────────
	HTTPRequestsTotal = promauto.NewCounterVec(prometheus.CounterOpts{
		Namespace: "vct",
		Subsystem: "http",
		Name:      "requests_total",
		Help:      "Total number of HTTP requests.",
	}, []string{"method", "path", "status"})

	HTTPRequestDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Namespace: "vct",
		Subsystem: "http",
		Name:      "request_duration_seconds",
		Help:      "HTTP request duration in seconds.",
		Buckets:   []float64{0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10},
	}, []string{"method", "path"})

	HTTPRequestSize = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Namespace: "vct",
		Subsystem: "http",
		Name:      "request_size_bytes",
		Help:      "HTTP request body size in bytes.",
		Buckets:   prometheus.ExponentialBuckets(100, 10, 6), // 100B → 10MB
	}, []string{"method", "path"})

	HTTPResponseSize = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Namespace: "vct",
		Subsystem: "http",
		Name:      "response_size_bytes",
		Help:      "HTTP response body size in bytes.",
		Buckets:   prometheus.ExponentialBuckets(100, 10, 6),
	}, []string{"method", "path"})

	// ── WebSocket Metrics ─────────────────────
	WSActiveConnections = promauto.NewGauge(prometheus.GaugeOpts{
		Namespace: "vct",
		Subsystem: "ws",
		Name:      "active_connections",
		Help:      "Current number of active WebSocket connections.",
	})

	WSMessagesTotal = promauto.NewCounterVec(prometheus.CounterOpts{
		Namespace: "vct",
		Subsystem: "ws",
		Name:      "messages_total",
		Help:      "Total WebSocket messages sent/received.",
	}, []string{"direction", "type"})

	// ── Database Metrics ──────────────────────
	DBQueryDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Namespace: "vct",
		Subsystem: "db",
		Name:      "query_duration_seconds",
		Help:      "Database query duration in seconds.",
		Buckets:   []float64{0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 5},
	}, []string{"operation", "table"})

	DBConnectionsActive = promauto.NewGauge(prometheus.GaugeOpts{
		Namespace: "vct",
		Subsystem: "db",
		Name:      "connections_active",
		Help:      "Number of active database connections.",
	})

	// ── Scoring / Business Metrics ────────────
	ScoringDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Namespace: "vct",
		Subsystem: "scoring",
		Name:      "duration_seconds",
		Help:      "Duration of scoring operations in seconds.",
		Buckets:   []float64{0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5},
	}, []string{"type"}) // type: doi_khang, quyen_thuat

	TournamentActiveCount = promauto.NewGauge(prometheus.GaugeOpts{
		Namespace: "vct",
		Subsystem: "tournament",
		Name:      "active_count",
		Help:      "Number of currently active tournaments.",
	})

	// ── Cache Metrics ─────────────────────────
	CacheHitsTotal = promauto.NewCounterVec(prometheus.CounterOpts{
		Namespace: "vct",
		Subsystem: "cache",
		Name:      "hits_total",
		Help:      "Total cache hits.",
	}, []string{"store"})

	CacheMissesTotal = promauto.NewCounterVec(prometheus.CounterOpts{
		Namespace: "vct",
		Subsystem: "cache",
		Name:      "misses_total",
		Help:      "Total cache misses.",
	}, []string{"store"})

	// ── Auth Metrics ──────────────────────────
	AuthAttemptsTotal = promauto.NewCounterVec(prometheus.CounterOpts{
		Namespace: "vct",
		Subsystem: "auth",
		Name:      "attempts_total",
		Help:      "Total authentication attempts.",
	}, []string{"method", "result"}) // method: jwt/api_key, result: success/failure

	// ── Inflight & Error Metrics ──────────
	HTTPInflightRequests = promauto.NewGauge(prometheus.GaugeOpts{
		Namespace: "vct",
		Subsystem: "http",
		Name:      "inflight_requests",
		Help:      "Current number of in-flight HTTP requests.",
	})

	HTTPErrorsTotal = promauto.NewCounterVec(prometheus.CounterOpts{
		Namespace: "vct",
		Subsystem: "http",
		Name:      "errors_total",
		Help:      "Total HTTP errors by type.",
	}, []string{"type"}) // type: 4xx, 5xx, panic, timeout

	// ── Go Runtime Metrics ────────────────
	GoGoroutines = promauto.NewGauge(prometheus.GaugeOpts{
		Namespace: "vct",
		Subsystem: "go",
		Name:      "goroutines",
		Help:      "Current number of goroutines.",
	})

	// ── Event Bus Metrics ─────────────────
	EventsPublished = promauto.NewCounterVec(prometheus.CounterOpts{
		Namespace: "vct",
		Subsystem: "events",
		Name:      "published_total",
		Help:      "Total events published.",
	}, []string{"topic"})

	EventsProcessed = promauto.NewCounterVec(prometheus.CounterOpts{
		Namespace: "vct",
		Subsystem: "events",
		Name:      "processed_total",
		Help:      "Total events processed by subscribers.",
	}, []string{"topic", "status"}) // status: success, error

	// ── Rate Limiter Metrics ──────────────
	RateLimitHits = promauto.NewCounterVec(prometheus.CounterOpts{
		Namespace: "vct",
		Subsystem: "ratelimit",
		Name:      "hits_total",
		Help:      "Total rate limit hits (429 responses).",
	}, []string{"endpoint"})

	// ── Batch/Bulk Operation Metrics ──────
	BatchOperationDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Namespace: "vct",
		Subsystem: "batch",
		Name:      "duration_seconds",
		Help:      "Duration of batch operations (import, export, bulk update).",
		Buckets:   []float64{0.1, 0.5, 1, 5, 10, 30, 60},
	}, []string{"operation"})
)

// BuildInfo registers the build info metric (call once at startup).
func RegisterBuildInfo(version, commit, goVer string) {
	promauto.NewGaugeFunc(prometheus.GaugeOpts{
		Namespace:   "vct",
		Name:        "build_info",
		Help:        "Build information about the running binary.",
		ConstLabels: prometheus.Labels{"version": version, "commit": commit, "go_version": goVer},
	}, func() float64 { return 1 })
}
