package benchmark

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// ════════════════════════════════════════
// VCT Platform — Handler Benchmarks
// Usage: go test -bench=. -benchmem ./tests/benchmark/...
// ════════════════════════════════════════

// BenchmarkHealthEndpoint measures raw /healthz throughput.
func BenchmarkHealthEndpoint(b *testing.B) {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	req := httptest.NewRequest("GET", "/healthz", nil)

	b.ResetTimer()
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)
	}
}

// BenchmarkJSONEncoding measures JSON marshaling performance for typical responses.
func BenchmarkJSONEncoding(b *testing.B) {
	type Athlete struct {
		ID        string  `json:"id"`
		Name      string  `json:"name"`
		Club      string  `json:"club"`
		Belt      string  `json:"belt"`
		Weight    float64 `json:"weight"`
		BirthYear int     `json:"birth_year"`
	}

	athletes := make([]Athlete, 100)
	for i := range athletes {
		athletes[i] = Athlete{
			ID:        "uuid-" + strings.Repeat("a", 32),
			Name:      "Nguyễn Văn A",
			Club:      "CLB Võ Cổ Truyền TP.HCM",
			Belt:      "Huyền đai Nhị đẳng",
			Weight:    65.5,
			BirthYear: 1998,
		}
	}

	b.Run("Marshal_100_Athletes", func(b *testing.B) {
		b.ReportAllocs()
		for i := 0; i < b.N; i++ {
			json.Marshal(athletes)
		}
	})

	data, _ := json.Marshal(athletes)
	b.Run("Unmarshal_100_Athletes", func(b *testing.B) {
		b.ReportAllocs()
		var result []Athlete
		for i := 0; i < b.N; i++ {
			json.Unmarshal(data, &result)
		}
	})
}

// BenchmarkMiddlewareChain measures middleware overhead.
func BenchmarkMiddlewareChain(b *testing.B) {
	// Simulate a 3-middleware chain (logging, auth, CORS)
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	})

	// Middleware 1: CORS headers
	corsMiddleware := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			next.ServeHTTP(w, r)
		})
	}

	// Middleware 2: Request ID
	reqIDMiddleware := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("X-Request-ID", "test-id")
			next.ServeHTTP(w, r)
		})
	}

	// Middleware 3: Content-Type
	ctMiddleware := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			next.ServeHTTP(w, r)
		})
	}

	chain := corsMiddleware(reqIDMiddleware(ctMiddleware(handler)))
	req := httptest.NewRequest("GET", "/api/v1/test", nil)

	b.ResetTimer()
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		rec := httptest.NewRecorder()
		chain.ServeHTTP(rec, req)
	}
}

// BenchmarkRouteMatching measures path normalization performance.
func BenchmarkRouteMatching(b *testing.B) {
	paths := []string{
		"/api/v1/tournaments",
		"/api/v1/athletes/550e8400-e29b-41d4-a716-446655440000",
		"/api/v1/clubs/123/members",
		"/healthz",
		"/api/v1/search?q=test",
	}

	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		path := paths[i%len(paths)]
		normalizePath(path)
	}
}

func normalizePath(path string) string {
	parts := strings.Split(path, "/")
	for i, part := range parts {
		if len(part) == 36 && part[8] == '-' {
			parts[i] = ":id"
		} else if isNumeric(part) {
			parts[i] = ":id"
		}
	}
	return strings.Join(parts, "/")
}

func isNumeric(s string) bool {
	for _, c := range s {
		if c < '0' || c > '9' {
			return false
		}
	}
	return len(s) > 0
}
