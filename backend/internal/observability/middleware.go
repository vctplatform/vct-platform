package observability

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/propagation"
	semconv "go.opentelemetry.io/otel/semconv/v1.24.0"
	"go.opentelemetry.io/otel/trace"
)

// ════════════════════════════════════════
// HTTP Middleware — Tracing + Metrics
// ════════════════════════════════════════

// responseWriter wraps http.ResponseWriter to capture status code and size.
type responseWriter struct {
	http.ResponseWriter
	statusCode   int
	bytesWritten int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func (rw *responseWriter) Write(b []byte) (int, error) {
	n, err := rw.ResponseWriter.Write(b)
	rw.bytesWritten += n
	return n, err
}

// HTTPMiddleware adds OpenTelemetry tracing and Prometheus metrics to HTTP handlers.
func HTTPMiddleware(next http.Handler) http.Handler {
	tracer := otel.Tracer("vct-platform/http")

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Skip metrics endpoint
		if r.URL.Path == "/metrics" || r.URL.Path == "/healthz" {
			next.ServeHTTP(w, r)
			return
		}

		// Extract context from incoming request (trace propagation)
		ctx := otel.GetTextMapPropagator().Extract(r.Context(), propagation.HeaderCarrier(r.Header))

		// Normalize path for cardinality control
		normalizedPath := normalizePath(r.URL.Path)

		// Start span
		ctx, span := tracer.Start(ctx, fmt.Sprintf("%s %s", r.Method, normalizedPath),
			trace.WithSpanKind(trace.SpanKindServer),
			trace.WithAttributes(
				semconv.HTTPMethodKey.String(r.Method),
				semconv.HTTPTargetKey.String(r.URL.Path),
				semconv.HTTPSchemeKey.String(scheme(r)),
				attribute.String("http.route", normalizedPath),
				attribute.String("http.user_agent", r.UserAgent()),
				attribute.String("net.peer.ip", clientIP(r)),
			),
		)
		defer span.End()

		// Wrap response writer
		rw := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}

		// Propagate context
		next.ServeHTTP(rw, r.WithContext(ctx))

		// Record span attributes
		duration := time.Since(start)
		statusStr := strconv.Itoa(rw.statusCode)

		span.SetAttributes(
			semconv.HTTPStatusCodeKey.Int(rw.statusCode),
			attribute.Int("http.response_content_length", rw.bytesWritten),
			attribute.Float64("http.duration_ms", float64(duration.Milliseconds())),
		)
		if rw.statusCode >= 400 {
			span.SetAttributes(attribute.Bool("error", true))
		}

		// Record Prometheus metrics
		HTTPRequestsTotal.WithLabelValues(r.Method, normalizedPath, statusStr).Inc()
		HTTPRequestDuration.WithLabelValues(r.Method, normalizedPath).Observe(duration.Seconds())
		HTTPResponseSize.WithLabelValues(r.Method, normalizedPath).Observe(float64(rw.bytesWritten))

		if r.ContentLength > 0 {
			HTTPRequestSize.WithLabelValues(r.Method, normalizedPath).Observe(float64(r.ContentLength))
		}
	})
}

// normalizePath reduces URL cardinality by replacing UUIDs and numeric IDs
// with placeholders. E.g., /api/v1/users/abc-123 → /api/v1/users/:id
func normalizePath(path string) string {
	parts := strings.Split(path, "/")
	for i, part := range parts {
		if isUUID(part) || isNumericID(part) {
			parts[i] = ":id"
		}
	}
	return strings.Join(parts, "/")
}

func isUUID(s string) bool {
	if len(s) != 36 {
		return false
	}
	for i, c := range s {
		if i == 8 || i == 13 || i == 18 || i == 23 {
			if c != '-' {
				return false
			}
		} else if !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')) {
			return false
		}
	}
	return true
}

func isNumericID(s string) bool {
	if len(s) == 0 || len(s) > 20 {
		return false
	}
	for _, c := range s {
		if c < '0' || c > '9' {
			return false
		}
	}
	return true
}

func scheme(r *http.Request) string {
	if r.TLS != nil {
		return "https"
	}
	if fwd := r.Header.Get("X-Forwarded-Proto"); fwd != "" {
		return fwd
	}
	return "http"
}

func clientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		if i := strings.IndexByte(xff, ','); i > 0 {
			return strings.TrimSpace(xff[:i])
		}
		return xff
	}
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return xri
	}
	if i := strings.LastIndexByte(r.RemoteAddr, ':'); i > 0 {
		return r.RemoteAddr[:i]
	}
	return r.RemoteAddr
}
