// Package apiversioning provides API version management with
// deprecation warnings, sunset dates, version routing,
// usage metrics, and content negotiation.
package apiversioning

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"sync/atomic"
	"time"
)

// Status represents the lifecycle state of an API version.
type Status string

const (
	StatusActive     Status = "active"
	StatusDeprecated Status = "deprecated"
	StatusSunset     Status = "sunset" // No longer available
)

// ChangeEntry describes a change in a version's changelog.
type ChangeEntry struct {
	Date        time.Time `json:"date"`
	Type        string    `json:"type"` // added, changed, deprecated, removed, fixed
	Description string    `json:"description"`
}

// Version describes an API version and its lifecycle.
type Version struct {
	Name         string        `json:"name"` // e.g. "v1", "v2"
	Status       Status        `json:"status"`
	ReleasedAt   time.Time     `json:"released_at"`
	DeprecatedAt *time.Time    `json:"deprecated_at,omitempty"`
	SunsetAt     *time.Time    `json:"sunset_at,omitempty"`
	Successor    string        `json:"successor,omitempty"` // e.g. "v2"
	Changelog    []ChangeEntry `json:"changelog,omitempty"`
}

// versionEntry wraps a version with usage counter.
type versionEntry struct {
	version  *Version
	hitCount atomic.Int64
}

// VersionStats reports usage for a single API version.
type VersionStats struct {
	Name     string `json:"name"`
	Status   Status `json:"status"`
	HitCount int64  `json:"hit_count"`
}

// Registry manages API versions and their lifecycle.
type Registry struct {
	entries map[string]*versionEntry
	current string // latest active version
	mu      sync.RWMutex
}

// NewRegistry creates a version registry.
func NewRegistry() *Registry {
	return &Registry{
		entries: make(map[string]*versionEntry),
	}
}

// Register adds a new API version.
func (r *Registry) Register(v Version) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.entries[v.Name] = &versionEntry{version: &v}
	if v.Status == StatusActive {
		r.current = v.Name
	}
}

// Get returns a version by name.
func (r *Registry) Get(name string) (*Version, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	e, ok := r.entries[name]
	if !ok {
		return nil, false
	}
	return e.version, true
}

// Current returns the latest active version name.
func (r *Registry) Current() string {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.current
}

// Deprecate marks a version as deprecated with a sunset date.
func (r *Registry) Deprecate(name string, sunsetAt time.Time, successor string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	e, ok := r.entries[name]
	if !ok {
		return fmt.Errorf("version %q not found", name)
	}
	now := time.Now().UTC()
	e.version.Status = StatusDeprecated
	e.version.DeprecatedAt = &now
	e.version.SunsetAt = &sunsetAt
	e.version.Successor = successor
	return nil
}

// Sunset marks a version as no longer available.
func (r *Registry) Sunset(name string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	e, ok := r.entries[name]
	if !ok {
		return fmt.Errorf("version %q not found", name)
	}
	e.version.Status = StatusSunset
	return nil
}

// AddChangelog appends a changelog entry to a version.
func (r *Registry) AddChangelog(name string, entry ChangeEntry) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	e, ok := r.entries[name]
	if !ok {
		return fmt.Errorf("version %q not found", name)
	}
	e.version.Changelog = append(e.version.Changelog, entry)
	return nil
}

// List returns all registered versions.
func (r *Registry) List() []Version {
	r.mu.RLock()
	defer r.mu.RUnlock()
	result := make([]Version, 0, len(r.entries))
	for _, e := range r.entries {
		result = append(result, *e.version)
	}
	return result
}

// Stats returns usage statistics for all versions.
func (r *Registry) Stats() []VersionStats {
	r.mu.RLock()
	defer r.mu.RUnlock()
	stats := make([]VersionStats, 0, len(r.entries))
	for _, e := range r.entries {
		stats = append(stats, VersionStats{
			Name:     e.version.Name,
			Status:   e.version.Status,
			HitCount: e.hitCount.Load(),
		})
	}
	return stats
}

// recordHit increments the usage counter for a version.
func (r *Registry) recordHit(name string) {
	r.mu.RLock()
	if e, ok := r.entries[name]; ok {
		e.hitCount.Add(1)
	}
	r.mu.RUnlock()
}

// ── HTTP Middleware ───────────────────────

// Middleware adds version headers and handles deprecation warnings.
func Middleware(registry *Registry) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			version := extractVersion(r)
			if version == "" {
				version = registry.Current()
			}

			v, ok := registry.Get(version)
			if !ok {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusBadRequest)
				json.NewEncoder(w).Encode(map[string]string{
					"error":   "unknown_api_version",
					"message": fmt.Sprintf("API version %q is not recognized", version),
				})
				return
			}

			// Record usage metrics
			registry.recordHit(version)

			// Sunset — reject
			if v.Status == StatusSunset {
				w.Header().Set("Sunset", v.SunsetAt.Format(http.TimeFormat))
				if v.Successor != "" {
					w.Header().Set("Link", fmt.Sprintf(`</api/%s>; rel="successor-version"`, v.Successor))
				}
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusGone)
				json.NewEncoder(w).Encode(map[string]string{
					"error":     "api_version_sunset",
					"message":   fmt.Sprintf("API version %q has been sunset", version),
					"successor": v.Successor,
				})
				return
			}

			// Deprecated — warn but allow
			if v.Status == StatusDeprecated {
				w.Header().Set("Deprecation", v.DeprecatedAt.Format(http.TimeFormat))
				if v.SunsetAt != nil {
					w.Header().Set("Sunset", v.SunsetAt.Format(http.TimeFormat))
				}
				if v.Successor != "" {
					w.Header().Set("Link", fmt.Sprintf(`</api/%s>; rel="successor-version"`, v.Successor))
				}
				w.Header().Set("X-API-Warn", fmt.Sprintf("API version %s is deprecated, migrate to %s", version, v.Successor))
			}

			// Set version headers
			w.Header().Set("X-API-Version", version)
			w.Header().Set("X-API-Status", string(v.Status))

			next.ServeHTTP(w, r)
		})
	}
}

// extractVersion gets the API version from the request.
// Priority: URL path (/api/v1/...) > Accept header > X-API-Version header > Query param
func extractVersion(r *http.Request) string {
	// URL path: /api/v1/athletes → "v1"
	parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/"), "/")
	if len(parts) >= 2 && parts[0] == "api" && strings.HasPrefix(parts[1], "v") {
		return parts[1]
	}

	// Accept header content negotiation: application/vnd.vct.v2+json
	if accept := r.Header.Get("Accept"); strings.Contains(accept, "vnd.vct.") {
		// Extract version from "application/vnd.vct.v2+json"
		idx := strings.Index(accept, "vnd.vct.")
		if idx >= 0 {
			rest := accept[idx+len("vnd.vct."):]
			if end := strings.IndexAny(rest, "+;, "); end > 0 {
				return rest[:end]
			}
			return rest
		}
	}

	// X-API-Version header
	if v := r.Header.Get("X-API-Version"); v != "" {
		return v
	}

	// Query parameter
	if v := r.URL.Query().Get("version"); v != "" {
		return v
	}

	return ""
}
