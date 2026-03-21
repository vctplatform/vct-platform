// Package geoip provides IP geolocation with in-memory CIDR lookup,
// country/region resolution, geo-based access rules, and HTTP middleware.
package geoip

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"strings"
	"sync"
)

// ═══════════════════════════════════════════════════════════════
// GeoInfo
// ═══════════════════════════════════════════════════════════════

// GeoInfo holds geographic information for an IP address.
type GeoInfo struct {
	IP          string `json:"ip"`
	CountryCode string `json:"country_code"` // ISO 3166-1 alpha-2
	Country     string `json:"country"`
	Region      string `json:"region,omitempty"`
	City        string `json:"city,omitempty"`
	Timezone    string `json:"timezone,omitempty"`
}

// ═══════════════════════════════════════════════════════════════
// Database
// ═══════════════════════════════════════════════════════════════

type entry struct {
	network *net.IPNet
	info    GeoInfo
}

// Database stores IP-to-geo mappings.
type Database struct {
	entries []entry
	mu      sync.RWMutex
}

// NewDatabase creates an empty geo database.
func NewDatabase() *Database {
	return &Database{}
}

// AddCIDR registers a CIDR range with geo info.
func (db *Database) AddCIDR(cidr, countryCode, country, region, city, tz string) error {
	_, network, err := net.ParseCIDR(cidr)
	if err != nil {
		return fmt.Errorf("invalid CIDR %q: %w", cidr, err)
	}

	db.mu.Lock()
	db.entries = append(db.entries, entry{
		network: network,
		info: GeoInfo{
			CountryCode: countryCode,
			Country:     country,
			Region:      region,
			City:        city,
			Timezone:    tz,
		},
	})
	db.mu.Unlock()
	return nil
}

// Lookup finds geo info for an IP address.
func (db *Database) Lookup(ipStr string) *GeoInfo {
	ip := net.ParseIP(ipStr)
	if ip == nil {
		return nil
	}

	db.mu.RLock()
	defer db.mu.RUnlock()

	for _, e := range db.entries {
		if e.network.Contains(ip) {
			info := e.info
			info.IP = ipStr
			return &info
		}
	}
	return nil
}

// Size returns number of CIDR entries.
func (db *Database) Size() int {
	db.mu.RLock()
	defer db.mu.RUnlock()
	return len(db.entries)
}

// ═══════════════════════════════════════════════════════════════
// Access Rules
// ═══════════════════════════════════════════════════════════════

// RuleMode determines allow-list or block-list behavior.
type RuleMode int

const (
	ModeAllowAll  RuleMode = iota // Default: allow, block listed
	ModeBlockAll                  // Default: block, allow listed
)

// AccessRules defines geo-based access control.
type AccessRules struct {
	Mode      RuleMode
	Countries map[string]bool // Country code → allowed/blocked
}

// NewAccessRules creates access rules.
func NewAccessRules(mode RuleMode) *AccessRules {
	return &AccessRules{
		Mode:      mode,
		Countries: make(map[string]bool),
	}
}

// Allow adds a country to the allow list (ModeBlockAll) or removes from block list.
func (r *AccessRules) Allow(countryCode string) {
	r.Countries[strings.ToUpper(countryCode)] = true
}

// Block adds a country to the block list (ModeAllowAll) or removes from allow list.
func (r *AccessRules) Block(countryCode string) {
	r.Countries[strings.ToUpper(countryCode)] = false
}

// IsAllowed checks if a country code is permitted.
func (r *AccessRules) IsAllowed(countryCode string) bool {
	code := strings.ToUpper(countryCode)
	if allowed, exists := r.Countries[code]; exists {
		return allowed
	}
	// Default by mode
	return r.Mode == ModeAllowAll
}

// ═══════════════════════════════════════════════════════════════
// Context
// ═══════════════════════════════════════════════════════════════

type geoCtxKey struct{}

// WithGeoInfo stores geo info in context.
func WithGeoInfo(ctx context.Context, info *GeoInfo) context.Context {
	return context.WithValue(ctx, geoCtxKey{}, info)
}

// FromContext extracts geo info from context.
func FromContext(ctx context.Context) *GeoInfo {
	if info, ok := ctx.Value(geoCtxKey{}).(*GeoInfo); ok {
		return info
	}
	return nil
}

// ═══════════════════════════════════════════════════════════════
// HTTP Middleware
// ═══════════════════════════════════════════════════════════════

// EnrichMiddleware looks up the client IP and stores GeoInfo in context.
func EnrichMiddleware(db *Database) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := extractIP(r)
			if info := db.Lookup(ip); info != nil {
				r = r.WithContext(WithGeoInfo(r.Context(), info))
			}
			next.ServeHTTP(w, r)
		})
	}
}

// GeoFenceMiddleware blocks requests from disallowed countries.
func GeoFenceMiddleware(db *Database, rules *AccessRules) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := extractIP(r)
			info := db.Lookup(ip)

			if info != nil && !rules.IsAllowed(info.CountryCode) {
				http.Error(w,
					fmt.Sprintf(`{"error":"geo_blocked","message":"access denied from %s"}`, info.Country),
					http.StatusForbidden)
				return
			}

			if info != nil {
				r = r.WithContext(WithGeoInfo(r.Context(), info))
			}
			next.ServeHTTP(w, r)
		})
	}
}

func extractIP(r *http.Request) string {
	// Check X-Forwarded-For first
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.SplitN(xff, ",", 2)
		return strings.TrimSpace(parts[0])
	}
	// Check X-Real-IP
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return xri
	}
	// Fall back to RemoteAddr
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}
