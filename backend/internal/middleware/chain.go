// Package middleware provides a composable chain builder that wires
// all VCT Platform middleware layers into ordered, reusable stacks.
package middleware

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"runtime/debug"
	"time"
)

// Middleware is a standard http middleware function.
type Middleware func(http.Handler) http.Handler

// Chain composes multiple middleware into a single middleware.
// Middleware are applied in the order given (first wraps outermost).
func Chain(mws ...Middleware) Middleware {
	return func(final http.Handler) http.Handler {
		for i := len(mws) - 1; i >= 0; i-- {
			final = mws[i](final)
		}
		return final
	}
}

// ── Recovery Middleware ──────────────────

// Recovery catches panics and returns 500 with structured error.
func Recovery(logger *slog.Logger) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if err := recover(); err != nil {
					stack := string(debug.Stack())
					logger.Error("panic recovered",
						slog.Any("error", err),
						slog.String("method", r.Method),
						slog.String("path", r.URL.Path),
						slog.String("stack", stack),
					)

					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusInternalServerError)
					json.NewEncoder(w).Encode(map[string]string{
						"error":   "internal_server_error",
						"message": "An unexpected error occurred",
					})
				}
			}()
			next.ServeHTTP(w, r)
		})
	}
}

// ── Timeout Middleware ───────────────────

// Timeout wraps a handler with a request deadline.
func Timeout(d time.Duration) Middleware {
	return func(next http.Handler) http.Handler {
		return http.TimeoutHandler(next, d, fmt.Sprintf(`{"error":"request_timeout","message":"request exceeded %s deadline"}`, d))
	}
}

// ── Profile Presets ──────────────────────

// Profile represents a named middleware configuration.
type Profile struct {
	Name        string
	Middlewares []Middleware
}

// Profiles provides preset middleware stacks for different route types.
type Profiles struct {
	recovery Middleware
	profiles map[string]Profile
}

// NewProfiles creates profiles with a base recovery middleware.
func NewProfiles(logger *slog.Logger) *Profiles {
	return &Profiles{
		recovery: Recovery(logger),
		profiles: make(map[string]Profile),
	}
}

// Register adds a named profile.
func (p *Profiles) Register(name string, mws ...Middleware) {
	// Always prepend recovery
	all := append([]Middleware{p.recovery}, mws...)
	p.profiles[name] = Profile{Name: name, Middlewares: all}
}

// Apply returns a middleware chain for the named profile.
func (p *Profiles) Apply(name string) Middleware {
	prof, ok := p.profiles[name]
	if !ok {
		return p.recovery
	}
	return Chain(prof.Middlewares...)
}

// Wrap applies a profile's middleware to a handler.
func (p *Profiles) Wrap(name string, handler http.Handler) http.Handler {
	return p.Apply(name)(handler)
}

// ── Response Writer Wrapper ──────────────

// ResponseCapture wraps http.ResponseWriter to capture status code and bytes.
type ResponseCapture struct {
	http.ResponseWriter
	StatusCode   int
	BytesWritten int64
	wroteHeader  bool
}

// NewResponseCapture wraps a ResponseWriter.
func NewResponseCapture(w http.ResponseWriter) *ResponseCapture {
	return &ResponseCapture{ResponseWriter: w, StatusCode: http.StatusOK}
}

// WriteHeader captures the status code.
func (rc *ResponseCapture) WriteHeader(code int) {
	if !rc.wroteHeader {
		rc.StatusCode = code
		rc.wroteHeader = true
		rc.ResponseWriter.WriteHeader(code)
	}
}

// Write captures bytes written.
func (rc *ResponseCapture) Write(b []byte) (int, error) {
	if !rc.wroteHeader {
		rc.WriteHeader(http.StatusOK)
	}
	n, err := rc.ResponseWriter.Write(b)
	rc.BytesWritten += int64(n)
	return n, err
}

// ── Example Wiring ──────────────────────
//
//   profiles := middleware.NewProfiles(logger)
//
//   profiles.Register("public",
//       securityheaders.RequestID,
//       securityheaders.CORS(corsCfg),
//       securityheaders.SecurityHeaders(secCfg),
//       validation.BodyLimiter(1<<20),
//       logging.RequestLogger(logger),
//       ratelimiter.Middleware(limiter),
//   )
//
//   profiles.Register("authenticated",
//       securityheaders.RequestID,
//       securityheaders.CORS(corsCfg),
//       securityheaders.SecurityHeaders(secCfg),
//       validation.BodyLimiter(1<<20),
//       logging.RequestLogger(logger),
//       ratelimiter.Middleware(limiter),
//       authMiddleware,
//   )
//
//   profiles.Register("admin",
//       securityheaders.RequestID,
//       securityheaders.CORS(corsCfg),
//       securityheaders.SecurityHeaders(secCfg),
//       validation.BodyLimiter(1<<20),
//       logging.RequestLogger(logger),
//       ratelimiter.Middleware(limiter),
//       authMiddleware,
//       adminGuard,
//   )
//
//   mux.Handle("/api/v1/tournaments", profiles.Wrap("public", tournamentsHandler))
//   mux.Handle("/api/v1/athletes", profiles.Wrap("authenticated", athletesHandler))
//   mux.Handle("/api/v1/admin/users", profiles.Wrap("admin", usersHandler))
