// Package metrics provides lightweight application metrics collection
// with counters, gauges, histograms, a thread-safe registry,
// Prometheus text exposition, and HTTP request instrumentation middleware.
package metrics

import (
	"fmt"
	"math"
	"net/http"
	"sort"
	"strings"
	"sync"
	"sync/atomic"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// Counter — Monotonically increasing value
// ═══════════════════════════════════════════════════════════════

// Counter is a cumulative metric that only goes up.
type Counter struct {
	value atomic.Int64
}

func (c *Counter) Inc()         { c.value.Add(1) }
func (c *Counter) Add(n int64)  { c.value.Add(n) }
func (c *Counter) Value() int64 { return c.value.Load() }

// ═══════════════════════════════════════════════════════════════
// Gauge — Value that can go up and down
// ═══════════════════════════════════════════════════════════════

// Gauge is a metric that can increase or decrease.
type Gauge struct {
	bits atomic.Uint64
}

func (g *Gauge) Set(v float64) {
	g.bits.Store(math.Float64bits(v))
}

func (g *Gauge) Inc() {
	for {
		old := g.bits.Load()
		new := math.Float64bits(math.Float64frombits(old) + 1)
		if g.bits.CompareAndSwap(old, new) {
			return
		}
	}
}

func (g *Gauge) Dec() {
	for {
		old := g.bits.Load()
		new := math.Float64bits(math.Float64frombits(old) - 1)
		if g.bits.CompareAndSwap(old, new) {
			return
		}
	}
}

func (g *Gauge) Add(delta float64) {
	for {
		old := g.bits.Load()
		new := math.Float64bits(math.Float64frombits(old) + delta)
		if g.bits.CompareAndSwap(old, new) {
			return
		}
	}
}

func (g *Gauge) Value() float64 {
	return math.Float64frombits(g.bits.Load())
}

// ═══════════════════════════════════════════════════════════════
// Histogram — Distribution of observed values
// ═══════════════════════════════════════════════════════════════

// Histogram tracks the distribution of values in configurable buckets.
type Histogram struct {
	buckets []float64
	counts  []atomic.Int64
	sum     atomic.Int64 // stored as int64 (microseconds for latency)
	count   atomic.Int64
	mu      sync.Mutex
}

// NewHistogram creates a histogram with specified upper-bound buckets.
func NewHistogram(buckets []float64) *Histogram {
	sorted := make([]float64, len(buckets))
	copy(sorted, buckets)
	sort.Float64s(sorted)

	h := &Histogram{
		buckets: sorted,
		counts:  make([]atomic.Int64, len(sorted)+1), // +1 for +Inf
	}
	return h
}

// DefaultLatencyBuckets returns standard latency buckets in seconds.
func DefaultLatencyBuckets() []float64 {
	return []float64{0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10}
}

// Observe records a value.
func (h *Histogram) Observe(v float64) {
	h.count.Add(1)
	h.sum.Add(int64(v * 1e6)) // Store as microseconds

	for i, bound := range h.buckets {
		if v <= bound {
			h.counts[i].Add(1)
			return
		}
	}
	h.counts[len(h.buckets)].Add(1) // +Inf bucket
}

// Count returns total observations.
func (h *Histogram) Count() int64 { return h.count.Load() }

// Sum returns the sum (in original units).
func (h *Histogram) Sum() float64 { return float64(h.sum.Load()) / 1e6 }

// ═══════════════════════════════════════════════════════════════
// Registry — Central metric store
// ═══════════════════════════════════════════════════════════════

// Registry holds all registered metrics.
type Registry struct {
	counters   map[string]*Counter
	gauges     map[string]*Gauge
	histograms map[string]*Histogram
	mu         sync.RWMutex
}

// NewRegistry creates a new metric registry.
func NewRegistry() *Registry {
	return &Registry{
		counters:   make(map[string]*Counter),
		gauges:     make(map[string]*Gauge),
		histograms: make(map[string]*Histogram),
	}
}

// Counter returns or creates a counter.
func (r *Registry) Counter(name string) *Counter {
	r.mu.RLock()
	if c, ok := r.counters[name]; ok {
		r.mu.RUnlock()
		return c
	}
	r.mu.RUnlock()

	r.mu.Lock()
	defer r.mu.Unlock()
	if c, ok := r.counters[name]; ok {
		return c
	}
	c := &Counter{}
	r.counters[name] = c
	return c
}

// Gauge returns or creates a gauge.
func (r *Registry) Gauge(name string) *Gauge {
	r.mu.RLock()
	if g, ok := r.gauges[name]; ok {
		r.mu.RUnlock()
		return g
	}
	r.mu.RUnlock()

	r.mu.Lock()
	defer r.mu.Unlock()
	if g, ok := r.gauges[name]; ok {
		return g
	}
	g := &Gauge{}
	r.gauges[name] = g
	return g
}

// Histogram returns or creates a histogram.
func (r *Registry) Histogram(name string, buckets []float64) *Histogram {
	r.mu.RLock()
	if h, ok := r.histograms[name]; ok {
		r.mu.RUnlock()
		return h
	}
	r.mu.RUnlock()

	r.mu.Lock()
	defer r.mu.Unlock()
	if h, ok := r.histograms[name]; ok {
		return h
	}
	h := NewHistogram(buckets)
	r.histograms[name] = h
	return h
}

// ═══════════════════════════════════════════════════════════════
// Prometheus Text Exposition
// ═══════════════════════════════════════════════════════════════

// ExposeHandler returns an HTTP handler for the /metrics endpoint.
func (r *Registry) ExposeHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		w.Header().Set("Content-Type", "text/plain; version=0.0.4; charset=utf-8")

		var sb strings.Builder

		r.mu.RLock()
		defer r.mu.RUnlock()

		// Counters
		for name, c := range r.counters {
			fmt.Fprintf(&sb, "# TYPE %s counter\n", name)
			fmt.Fprintf(&sb, "%s %d\n", name, c.Value())
		}

		// Gauges
		for name, g := range r.gauges {
			fmt.Fprintf(&sb, "# TYPE %s gauge\n", name)
			fmt.Fprintf(&sb, "%s %g\n", name, g.Value())
		}

		// Histograms
		for name, h := range r.histograms {
			fmt.Fprintf(&sb, "# TYPE %s histogram\n", name)
			var cumulative int64
			for i, bound := range h.buckets {
				cumulative += h.counts[i].Load()
				fmt.Fprintf(&sb, "%s_bucket{le=\"%g\"} %d\n", name, bound, cumulative)
			}
			cumulative += h.counts[len(h.buckets)].Load()
			fmt.Fprintf(&sb, "%s_bucket{le=\"+Inf\"} %d\n", name, cumulative)
			fmt.Fprintf(&sb, "%s_sum %g\n", name, h.Sum())
			fmt.Fprintf(&sb, "%s_count %d\n", name, h.Count())
		}

		w.Write([]byte(sb.String()))
	})
}

// ═══════════════════════════════════════════════════════════════
// HTTP Middleware — Auto-instrument requests
// ═══════════════════════════════════════════════════════════════

type statusCapture struct {
	http.ResponseWriter
	code int
}

func (s *statusCapture) WriteHeader(code int) {
	s.code = code
	s.ResponseWriter.WriteHeader(code)
}

// HTTPMiddleware instruments HTTP handlers with request count, duration, and in-flight gauges.
func HTTPMiddleware(reg *Registry) func(http.Handler) http.Handler {
	reqCount := reg.Counter("http_requests_total")
	reqDuration := reg.Histogram("http_request_duration_seconds", DefaultLatencyBuckets())
	reqInFlight := reg.Gauge("http_requests_in_flight")

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			reqInFlight.Inc()
			defer reqInFlight.Dec()

			start := time.Now()
			sc := &statusCapture{ResponseWriter: w, code: 200}

			next.ServeHTTP(sc, r)

			duration := time.Since(start).Seconds()
			reqCount.Inc()
			reqDuration.Observe(duration)
		})
	}
}
