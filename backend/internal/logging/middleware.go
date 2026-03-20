package logging

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log/slog"
	"net/http"
	"runtime/debug"
	"strings"
	"time"

	"go.opentelemetry.io/otel/trace"
)

// RequestMiddleware adds structured logging to every HTTP request
// with OTel trace correlation, request ID, timing, and contextual fields.
func RequestMiddleware(logger *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()

			// Generate or extract request ID
			requestID := r.Header.Get("X-Request-ID")
			if requestID == "" {
				requestID = generateRequestID()
				r.Header.Set("X-Request-ID", requestID)
			}
			// Expose request ID in response
			w.Header().Set("X-Request-ID", requestID)

			// Build request-scoped logger
			reqLogger := logger.With(
				slog.String("method", r.Method),
				slog.String("path", r.URL.Path),
				slog.String("remote_addr", clientIP(r)),
				slog.String("user_agent", r.UserAgent()),
				slog.String("request_id", requestID),
			)

			// Inject OTel trace/span IDs if present
			spanCtx := trace.SpanContextFromContext(r.Context())
			if spanCtx.HasTraceID() {
				reqLogger = reqLogger.With(
					slog.String("trace_id", spanCtx.TraceID().String()),
					slog.String("span_id", spanCtx.SpanID().String()),
				)
			}

			// Add user context if available (set by auth middleware)
			if userID := r.Header.Get("X-User-ID"); userID != "" {
				reqLogger = reqLogger.With(
					slog.String("user_id", userID),
					slog.String("user_role", r.Header.Get("X-User-Role")),
				)
			}

			// Store logger in context
			ctx := WithContext(r.Context(), reqLogger)
			r = r.WithContext(ctx)

			// Wrap response writer to capture status
			sw := &statusWriter{ResponseWriter: w, status: 200}

			next.ServeHTTP(sw, r)

			duration := time.Since(start)
			level := slog.LevelInfo
			if sw.status >= 500 {
				level = slog.LevelError
			} else if sw.status >= 400 {
				level = slog.LevelWarn
			}

			reqLogger.Log(r.Context(), level, "request completed",
				slog.Int("status", sw.status),
				slog.Int("bytes", sw.written),
				slog.String("duration", duration.String()),
				slog.Float64("duration_ms", float64(duration.Microseconds())/1000.0),
			)
		})
	}
}

// RecoveryMiddleware catches panics, logs the stack trace, and returns 500.
// Must be placed BEFORE other middleware in the chain.
func RecoveryMiddleware(logger *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if rec := recover(); rec != nil {
					stack := string(debug.Stack())
					reqLogger := FromContext(r.Context())

					reqLogger.Error("panic recovered",
						slog.Any("panic", rec),
						slog.String("stack", stack),
						slog.String("method", r.Method),
						slog.String("path", r.URL.Path),
					)

					// Return 500 JSON error
					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusInternalServerError)
					fmt.Fprintf(w, `{"error":"internal server error","status":500,"request_id":"%s"}`,
						r.Header.Get("X-Request-ID"))
				}
			}()
			next.ServeHTTP(w, r)
		})
	}
}

type statusWriter struct {
	http.ResponseWriter
	status  int
	written int
}

func (w *statusWriter) WriteHeader(status int) {
	w.status = status
	w.ResponseWriter.WriteHeader(status)
}

func (w *statusWriter) Write(b []byte) (int, error) {
	n, err := w.ResponseWriter.Write(b)
	w.written += n
	return n, err
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

// SanitizePath replaces sensitive path segments for logging.
func SanitizePath(path string) string {
	parts := strings.Split(path, "/")
	for i, part := range parts {
		if len(part) == 36 && strings.Count(part, "-") == 4 {
			parts[i] = ":id"
		}
		if looksLikeToken(part) {
			parts[i] = ":token"
		}
	}
	return strings.Join(parts, "/")
}

func looksLikeToken(s string) bool {
	if len(s) < 32 {
		return false
	}
	alphaNum := 0
	for _, c := range s {
		if (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') {
			alphaNum++
		}
	}
	return float64(alphaNum)/float64(len(s)) > 0.9
}

// HTTPError logs an error and writes a JSON error response.
func HTTPError(w http.ResponseWriter, r *http.Request, status int, msg string, err error) {
	logger := FromContext(r.Context())
	requestID := r.Header.Get("X-Request-ID")

	if err != nil {
		logger.Error(msg, slog.String("error", err.Error()), slog.Int("status", status))
	} else {
		logger.Warn(msg, slog.Int("status", status))
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	fmt.Fprintf(w, `{"error":"%s","status":%d,"request_id":"%s"}`, msg, status, requestID)
}

// generateRequestID creates a cryptographically random 16-byte hex request ID.
func generateRequestID() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return fmt.Sprintf("err-%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(b)
}

