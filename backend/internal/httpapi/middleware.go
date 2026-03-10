package httpapi

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"runtime/debug"
	"strings"
	"sync"
	"time"

	"vct-platform/backend/internal/auth"
	"vct-platform/backend/internal/authz"
)

// ── Request ID ───────────────────────────────────────────────

type contextKey string

const requestIDKey contextKey = "requestID"

func generateRequestID() string {
	b := make([]byte, 8)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

// withRequestID injects a unique request ID into the context and response header.
func withRequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := r.Header.Get("X-Request-ID")
		if id == "" {
			id = generateRequestID()
		}
		w.Header().Set("X-Request-ID", id)
		ctx := context.WithValue(r.Context(), requestIDKey, id)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func getRequestID(r *http.Request) string {
	if id, ok := r.Context().Value(requestIDKey).(string); ok {
		return id
	}
	return ""
}

// ── Authentication Middleware ─────────────────────────────────

func (s *Server) withAuth(next func(http.ResponseWriter, *http.Request, auth.Principal)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		principal, err := s.principalFromRequest(r)
		if err != nil {
			writeAuthError(w, err)
			return
		}
		next(w, r, principal)
	}
}

func (s *Server) principalFromRequest(r *http.Request) (auth.Principal, error) {
	authorization := strings.TrimSpace(r.Header.Get("Authorization"))
	if !strings.HasPrefix(strings.ToLower(authorization), "bearer ") {
		return auth.Principal{}, fmt.Errorf("%w: thiếu bearer token", auth.ErrUnauthorized)
	}
	token := strings.TrimSpace(authorization[7:])
	if token == "" {
		return auth.Principal{}, fmt.Errorf("%w: token trống", auth.ErrUnauthorized)
	}
	return s.authService.AuthenticateAccessToken(token, requestContextFromRequest(r))
}

func (s *Server) authorizeEntityAction(
	principal *auth.Principal,
	entity string,
	action authz.EntityAction,
) error {
	if s.cfg.DisableAuthForData {
		return nil
	}
	if principal == nil {
		return fmt.Errorf("%w: thiếu thông tin phiên làm việc", auth.ErrUnauthorized)
	}
	if authz.CanEntityAction(principal.User.Role, entity, action) {
		return nil
	}
	return fmt.Errorf(
		"%w: vai trò %s không có quyền %s trên %s",
		auth.ErrForbidden,
		principal.User.Role,
		action,
		entity,
	)
}

// ── CORS Middleware ───────────────────────────────────────────

func (s *Server) withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := strings.TrimSpace(r.Header.Get("Origin"))
		if origin != "" {
			if s.isAllowedOrigin(origin) {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Vary", "Origin")
				w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			}
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) isAllowedOrigin(origin string) bool {
	if _, ok := s.allowedOrigins["*"]; ok {
		return true
	}
	_, ok := s.allowedOrigins[origin]
	return ok
}

// ── Structured Logging Middleware ─────────────────────────────

type accessLogEntry struct {
	Timestamp string `json:"ts"`
	RequestID string `json:"rid,omitempty"`
	Method    string `json:"method"`
	Path      string `json:"path"`
	Status    int    `json:"status"`
	LatencyMs int64  `json:"latency_ms"`
	IP        string `json:"ip"`
	UserAgent string `json:"ua,omitempty"`
}

func (s *Server) withLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		started := time.Now()
		rw := &responseRecorder{ResponseWriter: w, statusCode: http.StatusOK}
		next.ServeHTTP(rw, r)
		latency := time.Since(started)

		entry := accessLogEntry{
			Timestamp: started.UTC().Format(time.RFC3339),
			RequestID: getRequestID(r),
			Method:    r.Method,
			Path:      r.URL.Path,
			Status:    rw.statusCode,
			LatencyMs: latency.Milliseconds(),
			IP:        extractClientIP(r),
			UserAgent: r.UserAgent(),
		}

		logJSON, err := json.Marshal(entry)
		if err != nil {
			log.Printf("%s %s %d %s", r.Method, r.URL.Path, rw.statusCode, latency)
			return
		}
		log.Println(string(logJSON))
	})
}

// ── Panic Recovery Middleware ─────────────────────────────────

func withRecover(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				stack := string(debug.Stack())
				log.Printf(`{"level":"error","msg":"panic recovered","error":"%v","stack":"%s","path":"%s","method":"%s"}`,
					rec, strings.ReplaceAll(stack, "\n", "\\n"), r.URL.Path, r.Method)

				w.Header().Set("Content-Type", "application/json; charset=utf-8")
				w.WriteHeader(http.StatusInternalServerError)
				_, _ = w.Write([]byte(`{"error":"internal server error"}`))
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// ── Rate Limiting Middleware ──────────────────────────────────

type rateLimiter struct {
	mu       sync.Mutex
	visitors map[string]*visitorBucket
	rate     int           // tokens per interval
	interval time.Duration // refill interval
	burst    int           // max tokens
}

type visitorBucket struct {
	tokens   int
	lastSeen time.Time
}

func newRateLimiter(rate int, interval time.Duration, burst int) *rateLimiter {
	rl := &rateLimiter{
		visitors: make(map[string]*visitorBucket),
		rate:     rate,
		interval: interval,
		burst:    burst,
	}
	// Periodic cleanup of stale visitors
	go func() {
		for {
			time.Sleep(5 * time.Minute)
			rl.cleanup()
		}
	}()
	return rl
}

func (rl *rateLimiter) allow(ip string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	v, exists := rl.visitors[ip]
	now := time.Now()

	if !exists {
		rl.visitors[ip] = &visitorBucket{
			tokens:   rl.burst - 1,
			lastSeen: now,
		}
		return true
	}

	// Refill tokens based on elapsed time
	elapsed := now.Sub(v.lastSeen)
	refill := int(elapsed/rl.interval) * rl.rate
	v.tokens += refill
	if v.tokens > rl.burst {
		v.tokens = rl.burst
	}
	v.lastSeen = now

	if v.tokens <= 0 {
		return false
	}
	v.tokens--
	return true
}

func (rl *rateLimiter) cleanup() {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	cutoff := time.Now().Add(-10 * time.Minute)
	for ip, v := range rl.visitors {
		if v.lastSeen.Before(cutoff) {
			delete(rl.visitors, ip)
		}
	}
}

func withRateLimit(limiter *rateLimiter) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := extractClientIP(r)
			if !limiter.allow(ip) {
				w.Header().Set("Content-Type", "application/json; charset=utf-8")
				w.Header().Set("Retry-After", "1")
				w.WriteHeader(http.StatusTooManyRequests)
				_, _ = w.Write([]byte(`{"error":"rate limit exceeded"}`))
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// ── Request Body Size Limiter ────────────────────────────────

const maxRequestBodySize = 10 * 1024 * 1024 // 10MB

func withBodyLimit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Body != nil {
			r.Body = http.MaxBytesReader(w, r.Body, maxRequestBodySize)
		}
		next.ServeHTTP(w, r)
	})
}

// ── Request Context ──────────────────────────────────────────

func requestContextFromRequest(r *http.Request) auth.RequestContext {
	return auth.RequestContext{
		IP:        extractClientIP(r),
		UserAgent: strings.TrimSpace(r.UserAgent()),
	}
}

func extractClientIP(r *http.Request) string {
	ip := strings.TrimSpace(r.Header.Get("X-Forwarded-For"))
	if ip == "" {
		host, _, err := net.SplitHostPort(strings.TrimSpace(r.RemoteAddr))
		if err == nil {
			return host
		}
		return strings.TrimSpace(r.RemoteAddr)
	}
	if strings.Contains(ip, ",") {
		return strings.TrimSpace(strings.Split(ip, ",")[0])
	}
	return ip
}

// tokenFromRequest extracts the bearer token from the Authorization header.
// Tokens in query strings are no longer accepted for security reasons.
func tokenFromRequest(r *http.Request) string {
	authorization := strings.TrimSpace(r.Header.Get("Authorization"))
	if strings.HasPrefix(strings.ToLower(authorization), "bearer ") {
		return strings.TrimSpace(authorization[7:])
	}
	return ""
}

// ── Response Recorder ────────────────────────────────────────

type responseRecorder struct {
	http.ResponseWriter
	statusCode int
}

func (r *responseRecorder) WriteHeader(statusCode int) {
	r.statusCode = statusCode
	r.ResponseWriter.WriteHeader(statusCode)
}
