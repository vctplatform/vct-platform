// Package dbutil provides database query middleware for slow query
// logging, metrics collection, and connection pool monitoring.
package dbutil

import (
	"context"
	"log/slog"
	"sync/atomic"
	"time"
)

// QueryStats tracks query performance metrics.
type QueryStats struct {
	TotalQueries   int64
	SlowQueries    int64
	ErrorQueries   int64
	TotalDurationNs int64
}

// QueryMiddleware wraps database calls with logging and metrics.
type QueryMiddleware struct {
	logger        *slog.Logger
	slowThreshold time.Duration
	stats         QueryStats
}

// NewQueryMiddleware creates a query middleware.
func NewQueryMiddleware(logger *slog.Logger, slowThreshold time.Duration) *QueryMiddleware {
	return &QueryMiddleware{
		logger:        logger.With(slog.String("component", "db")),
		slowThreshold: slowThreshold,
	}
}

// Wrap executes a database operation with timing, slow query detection, and error logging.
func (m *QueryMiddleware) Wrap(ctx context.Context, queryName string, fn func() error) error {
	start := time.Now()

	err := fn()

	duration := time.Since(start)
	atomic.AddInt64(&m.stats.TotalQueries, 1)
	atomic.AddInt64(&m.stats.TotalDurationNs, int64(duration))

	attrs := []any{
		slog.String("query", queryName),
		slog.String("duration", duration.String()),
		slog.Float64("duration_ms", float64(duration.Microseconds())/1000.0),
	}

	if err != nil {
		atomic.AddInt64(&m.stats.ErrorQueries, 1)
		m.logger.Error("query failed", append(attrs, slog.String("error", err.Error()))...)
		return err
	}

	if duration > m.slowThreshold {
		atomic.AddInt64(&m.stats.SlowQueries, 1)
		m.logger.Warn("slow query detected", append(attrs,
			slog.String("threshold", m.slowThreshold.String()),
		)...)
	}

	return nil
}

// Stats returns a snapshot of query statistics.
func (m *QueryMiddleware) Stats() QueryStats {
	return QueryStats{
		TotalQueries:    atomic.LoadInt64(&m.stats.TotalQueries),
		SlowQueries:     atomic.LoadInt64(&m.stats.SlowQueries),
		ErrorQueries:    atomic.LoadInt64(&m.stats.ErrorQueries),
		TotalDurationNs: atomic.LoadInt64(&m.stats.TotalDurationNs),
	}
}

// AvgDuration returns the average query duration.
func (m *QueryMiddleware) AvgDuration() time.Duration {
	total := atomic.LoadInt64(&m.stats.TotalQueries)
	if total == 0 {
		return 0
	}
	return time.Duration(atomic.LoadInt64(&m.stats.TotalDurationNs) / total)
}

// ── Connection Pool Monitor ──────────────

// PoolStats holds connection pool statistics.
type PoolStats struct {
	MaxConns      int   `json:"max_conns"`
	OpenConns     int   `json:"open_conns"`
	InUse         int   `json:"in_use"`
	Idle          int   `json:"idle"`
	WaitCount     int64 `json:"wait_count"`
	WaitDuration  time.Duration `json:"wait_duration"`
	Utilization   float64 `json:"utilization"` // 0.0-1.0
}

// PoolStatsProvider is any source of pool stats (e.g., sql.DB, pgxpool).
type PoolStatsProvider interface {
	MaxConns() int
	OpenConns() int
	InUse() int
	Idle() int
}

// PoolMonitor periodically logs connection pool stats.
type PoolMonitor struct {
	logger   *slog.Logger
	interval time.Duration
	provider PoolStatsProvider
	stopCh   chan struct{}
}

// NewPoolMonitor creates a pool monitor.
func NewPoolMonitor(logger *slog.Logger, interval time.Duration, provider PoolStatsProvider) *PoolMonitor {
	return &PoolMonitor{
		logger:   logger.With(slog.String("component", "pool_monitor")),
		interval: interval,
		provider: provider,
		stopCh:   make(chan struct{}),
	}
}

// Start begins the monitoring loop.
func (pm *PoolMonitor) Start() {
	go func() {
		ticker := time.NewTicker(pm.interval)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				pm.log()
			case <-pm.stopCh:
				return
			}
		}
	}()
	pm.logger.Info("pool monitor started", slog.String("interval", pm.interval.String()))
}

// Stop halts the monitor.
func (pm *PoolMonitor) Stop() {
	close(pm.stopCh)
}

// Snapshot returns current pool stats.
func (pm *PoolMonitor) Snapshot() PoolStats {
	max := pm.provider.MaxConns()
	open := pm.provider.OpenConns()
	inUse := pm.provider.InUse()
	idle := pm.provider.Idle()

	var util float64
	if max > 0 {
		util = float64(inUse) / float64(max)
	}

	return PoolStats{
		MaxConns:    max,
		OpenConns:   open,
		InUse:       inUse,
		Idle:        idle,
		Utilization: util,
	}
}

func (pm *PoolMonitor) log() {
	s := pm.Snapshot()
	level := slog.LevelInfo
	if s.Utilization > 0.8 {
		level = slog.LevelWarn
	}

	pm.logger.Log(context.Background(), level, "pool stats",
		slog.Int("max", s.MaxConns),
		slog.Int("open", s.OpenConns),
		slog.Int("in_use", s.InUse),
		slog.Int("idle", s.Idle),
		slog.Float64("utilization", s.Utilization),
	)
}
