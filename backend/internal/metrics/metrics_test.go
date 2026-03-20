package metrics

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
)

func TestCounter(t *testing.T) {
	c := &Counter{}
	c.Inc()
	c.Inc()
	c.Add(8)

	if c.Value() != 10 {
		t.Errorf("expected 10, got %d", c.Value())
	}
}

func TestGauge(t *testing.T) {
	g := &Gauge{}
	g.Set(42.5)
	if g.Value() != 42.5 {
		t.Errorf("expected 42.5, got %f", g.Value())
	}

	g.Inc()
	if g.Value() != 43.5 {
		t.Errorf("expected 43.5, got %f", g.Value())
	}

	g.Dec()
	g.Dec()
	if g.Value() != 41.5 {
		t.Errorf("expected 41.5, got %f", g.Value())
	}

	g.Add(-1.5)
	if g.Value() != 40.0 {
		t.Errorf("expected 40.0, got %f", g.Value())
	}
}

func TestHistogram(t *testing.T) {
	h := NewHistogram([]float64{0.1, 0.5, 1.0})

	h.Observe(0.05)
	h.Observe(0.3)
	h.Observe(0.8)
	h.Observe(5.0) // +Inf bucket

	if h.Count() != 4 {
		t.Errorf("expected 4 observations, got %d", h.Count())
	}

	sum := h.Sum()
	if sum < 6.0 || sum > 6.2 {
		t.Errorf("expected sum ~6.15, got %f", sum)
	}
}

func TestRegistry_LazyCreation(t *testing.T) {
	reg := NewRegistry()

	c1 := reg.Counter("reqs")
	c2 := reg.Counter("reqs")
	if c1 != c2 {
		t.Error("same name should return same counter")
	}

	g1 := reg.Gauge("temp")
	g2 := reg.Gauge("temp")
	if g1 != g2 {
		t.Error("same name should return same gauge")
	}

	h1 := reg.Histogram("latency", DefaultLatencyBuckets())
	h2 := reg.Histogram("latency", DefaultLatencyBuckets())
	if h1 != h2 {
		t.Error("same name should return same histogram")
	}
}

func TestRegistry_Concurrent(t *testing.T) {
	reg := NewRegistry()
	var wg sync.WaitGroup

	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			reg.Counter("concurrent_counter").Inc()
			reg.Gauge("concurrent_gauge").Inc()
		}()
	}
	wg.Wait()

	if reg.Counter("concurrent_counter").Value() != 100 {
		t.Errorf("expected 100, got %d", reg.Counter("concurrent_counter").Value())
	}
	if reg.Gauge("concurrent_gauge").Value() != 100 {
		t.Errorf("expected 100, got %f", reg.Gauge("concurrent_gauge").Value())
	}
}

func TestExposeHandler(t *testing.T) {
	reg := NewRegistry()
	reg.Counter("http_requests_total").Add(42)
	reg.Gauge("cpu_usage").Set(0.75)
	h := reg.Histogram("request_duration", []float64{0.1, 0.5, 1.0})
	h.Observe(0.05)
	h.Observe(0.3)

	handler := reg.ExposeHandler()
	req := httptest.NewRequest("GET", "/metrics", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	body := rec.Body.String()

	if !strings.Contains(body, "http_requests_total 42") {
		t.Error("missing counter in output")
	}
	if !strings.Contains(body, "cpu_usage 0.75") {
		t.Error("missing gauge in output")
	}
	if !strings.Contains(body, "request_duration_bucket") {
		t.Error("missing histogram buckets in output")
	}
	if !strings.Contains(body, `le="+Inf"`) {
		t.Error("missing +Inf bucket")
	}
	if !strings.Contains(body, "request_duration_count 2") {
		t.Error("missing histogram count")
	}
}

func TestHTTPMiddleware(t *testing.T) {
	reg := NewRegistry()

	handler := HTTPMiddleware(reg)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	}))

	for i := 0; i < 5; i++ {
		req := httptest.NewRequest("GET", "/api/test", nil)
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)
	}

	if reg.Counter("http_requests_total").Value() != 5 {
		t.Errorf("expected 5 requests, got %d", reg.Counter("http_requests_total").Value())
	}

	// In-flight should be back to 0
	if reg.Gauge("http_requests_in_flight").Value() != 0 {
		t.Errorf("expected 0 in-flight, got %f", reg.Gauge("http_requests_in_flight").Value())
	}

	h := reg.Histogram("http_request_duration_seconds", DefaultLatencyBuckets())
	if h.Count() != 5 {
		t.Errorf("expected 5 latency observations, got %d", h.Count())
	}
}
