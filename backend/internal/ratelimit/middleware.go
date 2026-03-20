package ratelimit

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

// ════════════════════════════════════════
// HTTP Rate Limit Middleware
// Enhanced with JSON responses and computed Retry-After.
// ════════════════════════════════════════

// Tier defines rate limit tiers for different access levels.
type Tier struct {
	Name  string
	Rate  float64
	Burst int
}

// Predefined tiers.
var (
	TierAnonymous = Tier{Name: "anonymous", Rate: 5, Burst: 10}
	TierUser      = Tier{Name: "user", Rate: 20, Burst: 40}
	TierAdmin     = Tier{Name: "admin", Rate: 100, Burst: 200}
	TierAPI       = Tier{Name: "api_key", Rate: 50, Burst: 100}
)

// MiddlewareConfig configures the rate limit middleware.
type MiddlewareConfig struct {
	AnonymousLimiter *Limiter
	UserLimiter      *Limiter
	AdminLimiter     *Limiter
	APIKeyLimiter    *Limiter
	KeyExtractor     func(r *http.Request) (key string, tier string)
}

// DefaultMiddlewareConfig creates middleware with default tiers.
func DefaultMiddlewareConfig() MiddlewareConfig {
	return MiddlewareConfig{
		AnonymousLimiter: NewLimiter(Config{Rate: TierAnonymous.Rate, Burst: TierAnonymous.Burst, CleanupTTL: DefaultConfig().CleanupTTL}),
		UserLimiter:      NewLimiter(Config{Rate: TierUser.Rate, Burst: TierUser.Burst, CleanupTTL: DefaultConfig().CleanupTTL}),
		AdminLimiter:     NewLimiter(Config{Rate: TierAdmin.Rate, Burst: TierAdmin.Burst, CleanupTTL: DefaultConfig().CleanupTTL}),
		APIKeyLimiter:    NewLimiter(Config{Rate: TierAPI.Rate, Burst: TierAPI.Burst, CleanupTTL: DefaultConfig().CleanupTTL}),
		KeyExtractor:     DefaultKeyExtractor,
	}
}

// Middleware returns an HTTP middleware that enforces rate limits.
func Middleware(cfg MiddlewareConfig) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Skip rate limiting for health checks
			if r.URL.Path == "/healthz" || r.URL.Path == "/metrics" {
				next.ServeHTTP(w, r)
				return
			}

			key, tier := cfg.KeyExtractor(r)

			var limiter *Limiter
			switch tier {
			case "admin":
				limiter = cfg.AdminLimiter
			case "api_key":
				limiter = cfg.APIKeyLimiter
			case "user":
				limiter = cfg.UserLimiter
			default:
				limiter = cfg.AnonymousLimiter
			}

			if !limiter.Allow(key) {
				remaining := limiter.Remaining(key)
				retryAfter := limiter.RetryAfter(key)
				resetAt := time.Now().Add(time.Duration(retryAfter) * time.Second)

				w.Header().Set("Content-Type", "application/json")
				w.Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", limiter.burst))
				w.Header().Set("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))
				w.Header().Set("X-RateLimit-Tier", tier)
				w.Header().Set("X-RateLimit-Reset", fmt.Sprintf("%d", resetAt.Unix()))
				w.Header().Set("Retry-After", fmt.Sprintf("%.0f", retryAfter))
				w.WriteHeader(http.StatusTooManyRequests)
				json.NewEncoder(w).Encode(map[string]interface{}{
					"error":        "rate_limit_exceeded",
					"message":      "Too many requests, please slow down",
					"retry_after":  retryAfter,
					"tier":         tier,
				})
				return
			}

			// Set rate limit headers
			remaining := limiter.Remaining(key)
			w.Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", limiter.burst))
			w.Header().Set("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))
			w.Header().Set("X-RateLimit-Tier", tier)

			next.ServeHTTP(w, r)
		})
	}
}

// DefaultKeyExtractor extracts the rate limit key and tier from a request.
func DefaultKeyExtractor(r *http.Request) (string, string) {
	// API key takes priority
	if apiKey := r.Header.Get("X-API-Key"); apiKey != "" {
		return "apikey:" + apiKey, "api_key"
	}

	// Check for authenticated user (from JWT middleware)
	if userID := r.Header.Get("X-User-ID"); userID != "" {
		if role := r.Header.Get("X-User-Role"); role == "admin" || role == "super_admin" {
			return "admin:" + userID, "admin"
		}
		return "user:" + userID, "user"
	}

	// Fall back to IP
	return "ip:" + clientIP(r), "anonymous"
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
