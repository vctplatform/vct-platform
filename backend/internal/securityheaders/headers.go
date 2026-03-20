// Package securityheaders provides CORS, security headers,
// and request ID propagation middleware for the VCT Platform API.
package securityheaders

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// CORS Middleware — Configurable Cross-Origin Resource Sharing
// ═══════════════════════════════════════════════════════════════

// CORSConfig holds CORS settings.
type CORSConfig struct {
	AllowedOrigins   []string
	AllowedMethods   []string
	AllowedHeaders   []string
	ExposedHeaders   []string
	AllowCredentials bool
	MaxAge           time.Duration
}

// DefaultCORSConfig returns production-safe CORS defaults.
func DefaultCORSConfig() CORSConfig {
	return CORSConfig{
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization", "X-Request-ID", "X-API-Version", "Accept"},
		ExposedHeaders:   []string{"X-Request-ID", "X-API-Version", "X-RateLimit-Remaining", "Retry-After", "Deprecation", "Sunset"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}
}

// CORS returns CORS middleware.
func CORS(cfg CORSConfig) func(http.Handler) http.Handler {
	allowedSet := make(map[string]bool, len(cfg.AllowedOrigins))
	for _, o := range cfg.AllowedOrigins {
		allowedSet[o] = true
	}

	methods := strings.Join(cfg.AllowedMethods, ", ")
	headers := strings.Join(cfg.AllowedHeaders, ", ")
	exposed := strings.Join(cfg.ExposedHeaders, ", ")
	maxAge := strconv.Itoa(int(cfg.MaxAge.Seconds()))

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")

			if origin != "" && isAllowed(origin, allowedSet, cfg.AllowedOrigins) {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Vary", "Origin")

				if cfg.AllowCredentials {
					w.Header().Set("Access-Control-Allow-Credentials", "true")
				}
				if exposed != "" {
					w.Header().Set("Access-Control-Expose-Headers", exposed)
				}
			}

			// Preflight
			if r.Method == "OPTIONS" {
				w.Header().Set("Access-Control-Allow-Methods", methods)
				w.Header().Set("Access-Control-Allow-Headers", headers)
				w.Header().Set("Access-Control-Max-Age", maxAge)
				w.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func isAllowed(origin string, set map[string]bool, patterns []string) bool {
	if set[origin] {
		return true
	}
	for _, p := range patterns {
		if p == "*" {
			return true
		}
		// Wildcard subdomain: *.vct-platform.com
		if strings.HasPrefix(p, "*.") {
			suffix := p[1:] // .vct-platform.com
			if strings.HasSuffix(origin, suffix) {
				return true
			}
		}
	}
	return false
}

// ═══════════════════════════════════════════════════════════════
// Security Headers — OWASP recommended headers
// ═══════════════════════════════════════════════════════════════

// SecurityConfig holds security header settings.
type SecurityConfig struct {
	ContentSecurityPolicy string
	HSTSMaxAge            time.Duration
	HSTSIncludeSubdomains bool
	HSTSPreload           bool
	FrameOptions          string // DENY, SAMEORIGIN
	ContentTypeNoSniff    bool
	XSSProtection         bool
	ReferrerPolicy        string
	PermissionsPolicy     string
}

// DefaultSecurityConfig returns hardened security header defaults.
func DefaultSecurityConfig() SecurityConfig {
	return SecurityConfig{
		ContentSecurityPolicy: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self'",
		HSTSMaxAge:            365 * 24 * time.Hour,
		HSTSIncludeSubdomains: true,
		HSTSPreload:           true,
		FrameOptions:          "DENY",
		ContentTypeNoSniff:    true,
		XSSProtection:         true,
		ReferrerPolicy:        "strict-origin-when-cross-origin",
		PermissionsPolicy:     "camera=(), microphone=(), geolocation=(self), payment=()",
	}
}

// SecurityHeaders returns middleware that adds security headers.
func SecurityHeaders(cfg SecurityConfig) func(http.Handler) http.Handler {
	hstsValue := buildHSTS(cfg)

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if cfg.ContentSecurityPolicy != "" {
				w.Header().Set("Content-Security-Policy", cfg.ContentSecurityPolicy)
			}
			if hstsValue != "" {
				w.Header().Set("Strict-Transport-Security", hstsValue)
			}
			if cfg.FrameOptions != "" {
				w.Header().Set("X-Frame-Options", cfg.FrameOptions)
			}
			if cfg.ContentTypeNoSniff {
				w.Header().Set("X-Content-Type-Options", "nosniff")
			}
			if cfg.XSSProtection {
				w.Header().Set("X-XSS-Protection", "1; mode=block")
			}
			if cfg.ReferrerPolicy != "" {
				w.Header().Set("Referrer-Policy", cfg.ReferrerPolicy)
			}
			if cfg.PermissionsPolicy != "" {
				w.Header().Set("Permissions-Policy", cfg.PermissionsPolicy)
			}

			next.ServeHTTP(w, r)
		})
	}
}

func buildHSTS(cfg SecurityConfig) string {
	if cfg.HSTSMaxAge <= 0 {
		return ""
	}
	val := "max-age=" + strconv.Itoa(int(cfg.HSTSMaxAge.Seconds()))
	if cfg.HSTSIncludeSubdomains {
		val += "; includeSubDomains"
	}
	if cfg.HSTSPreload {
		val += "; preload"
	}
	return val
}

// ═══════════════════════════════════════════════════════════════
// Request ID — Unique ID per request for tracing
// ═══════════════════════════════════════════════════════════════

const requestIDHeader = "X-Request-ID"

// RequestID adds a unique request ID to each request/response.
func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := r.Header.Get(requestIDHeader)
		if id == "" {
			id = generateID()
		}
		w.Header().Set(requestIDHeader, id)
		r.Header.Set(requestIDHeader, id) // propagate downstream
		next.ServeHTTP(w, r)
	})
}

func generateID() string {
	b := make([]byte, 16)
	rand.Read(b)
	return hex.EncodeToString(b)
}
