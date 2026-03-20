// Package featureflag provides a lightweight feature flag service
// with percentage-based rollouts, user targeting, environment overrides,
// batch evaluation, forced overrides, and evaluation statistics.
package featureflag

import (
	"context"
	"hash/fnv"
	"sync"
	"sync/atomic"
	"time"
)

// Flag represents a feature flag configuration.
type Flag struct {
	Key         string            `json:"key"`
	Enabled     bool              `json:"enabled"`
	Percentage  int               `json:"percentage"`   // 0-100 rollout %
	Variants    map[string]string `json:"variants"`     // A/B variants
	AllowList   []string          `json:"allow_list"`   // Always-on user IDs
	DenyList    []string          `json:"deny_list"`    // Always-off user IDs
	Metadata    map[string]string `json:"metadata"`
	Environment string            `json:"environment"`  // staging/production/*
	UpdatedAt   time.Time         `json:"updated_at"`
}

// EvalResult is the result of evaluating a flag for a user.
type EvalResult struct {
	Enabled bool   `json:"enabled"`
	Variant string `json:"variant,omitempty"`
	Reason  string `json:"reason"`
}

// EvalStats holds evaluation statistics.
type EvalStats struct {
	TotalEvaluations int64 `json:"total_evaluations"`
	Enabled          int64 `json:"enabled"`
	Disabled         int64 `json:"disabled"`
	CacheHits        int64 `json:"cache_hits"`
	CacheMisses      int64 `json:"cache_misses"`
	Overrides        int   `json:"overrides"`
	CachedFlags      int   `json:"cached_flags"`
}

// Store is the interface for persisting feature flags.
type Store interface {
	Get(ctx context.Context, key string) (*Flag, error)
	List(ctx context.Context) ([]*Flag, error)
	Set(ctx context.Context, flag *Flag) error
	Delete(ctx context.Context, key string) error
}

// Service manages feature flag evaluation with caching.
type Service struct {
	store       Store
	environment string
	cache       map[string]*Flag
	overrides   map[string]bool // forced overrides for testing
	mu          sync.RWMutex
	ttl         time.Duration
	lastRefresh time.Time

	// Atomic stats
	totalEvals  atomic.Int64
	enabled     atomic.Int64
	disabled    atomic.Int64
	cacheHits   atomic.Int64
	cacheMisses atomic.Int64
}

// NewService creates a feature flag service.
func NewService(store Store, environment string) *Service {
	s := &Service{
		store:       store,
		environment: environment,
		cache:       make(map[string]*Flag),
		overrides:   make(map[string]bool),
		ttl:         30 * time.Second,
	}
	return s
}

// Evaluate checks if a flag is enabled for a given user.
func (s *Service) Evaluate(ctx context.Context, key string, userID string) EvalResult {
	s.totalEvals.Add(1)

	// Check forced overrides first
	s.mu.RLock()
	if val, ok := s.overrides[key]; ok {
		s.mu.RUnlock()
		if val {
			s.enabled.Add(1)
			return EvalResult{Enabled: true, Reason: "forced_override"}
		}
		s.disabled.Add(1)
		return EvalResult{Enabled: false, Reason: "forced_override"}
	}
	s.mu.RUnlock()

	flag := s.getFlag(ctx, key)
	if flag == nil {
		s.disabled.Add(1)
		return EvalResult{Enabled: false, Reason: "flag_not_found"}
	}

	// Environment check
	if flag.Environment != "" && flag.Environment != "*" && flag.Environment != s.environment {
		s.disabled.Add(1)
		return EvalResult{Enabled: false, Reason: "environment_mismatch"}
	}

	// Master kill switch
	if !flag.Enabled {
		s.disabled.Add(1)
		return EvalResult{Enabled: false, Reason: "flag_disabled"}
	}

	// Deny list (always off)
	for _, id := range flag.DenyList {
		if id == userID {
			s.disabled.Add(1)
			return EvalResult{Enabled: false, Reason: "deny_list"}
		}
	}

	// Allow list (always on)
	for _, id := range flag.AllowList {
		if id == userID {
			s.enabled.Add(1)
			return EvalResult{Enabled: true, Variant: s.variant(flag, userID), Reason: "allow_list"}
		}
	}

	// Percentage rollout (deterministic hash)
	if flag.Percentage >= 100 {
		s.enabled.Add(1)
		return EvalResult{Enabled: true, Variant: s.variant(flag, userID), Reason: "full_rollout"}
	}
	if flag.Percentage <= 0 {
		s.disabled.Add(1)
		return EvalResult{Enabled: false, Reason: "zero_rollout"}
	}

	bucket := hashBucket(key, userID)
	if bucket < flag.Percentage {
		s.enabled.Add(1)
		return EvalResult{Enabled: true, Variant: s.variant(flag, userID), Reason: "percentage_rollout"}
	}

	s.disabled.Add(1)
	return EvalResult{Enabled: false, Reason: "percentage_excluded"}
}

// BatchEvaluate evaluates multiple flags at once for a user.
func (s *Service) BatchEvaluate(ctx context.Context, keys []string, userID string) map[string]EvalResult {
	results := make(map[string]EvalResult, len(keys))
	for _, key := range keys {
		results[key] = s.Evaluate(ctx, key, userID)
	}
	return results
}

// IsEnabled is a convenience check returning only the boolean.
func (s *Service) IsEnabled(ctx context.Context, key string, userID string) bool {
	return s.Evaluate(ctx, key, userID).Enabled
}

// ForceOverride sets a forced override for testing.
// Overrides bypass all rules (percentage, allow/deny lists, environment).
func (s *Service) ForceOverride(key string, enabled bool) {
	s.mu.Lock()
	s.overrides[key] = enabled
	s.mu.Unlock()
}

// ClearOverride removes a forced override.
func (s *Service) ClearOverride(key string) {
	s.mu.Lock()
	delete(s.overrides, key)
	s.mu.Unlock()
}

// ClearAllOverrides removes all forced overrides.
func (s *Service) ClearAllOverrides() {
	s.mu.Lock()
	s.overrides = make(map[string]bool)
	s.mu.Unlock()
}

// SetFlag creates or updates a flag.
func (s *Service) SetFlag(ctx context.Context, flag *Flag) error {
	flag.UpdatedAt = time.Now().UTC()
	if err := s.store.Set(ctx, flag); err != nil {
		return err
	}
	s.mu.Lock()
	s.cache[flag.Key] = flag
	s.mu.Unlock()
	return nil
}

// ListFlags returns all flags.
func (s *Service) ListFlags(ctx context.Context) ([]*Flag, error) {
	return s.store.List(ctx)
}

// DeleteFlag removes a flag.
func (s *Service) DeleteFlag(ctx context.Context, key string) error {
	if err := s.store.Delete(ctx, key); err != nil {
		return err
	}
	s.mu.Lock()
	delete(s.cache, key)
	delete(s.overrides, key)
	s.mu.Unlock()
	return nil
}

// RefreshAll forces a cache refresh from the store.
func (s *Service) RefreshAll(ctx context.Context) error {
	flags, err := s.store.List(ctx)
	if err != nil {
		return err
	}
	s.mu.Lock()
	s.cache = make(map[string]*Flag, len(flags))
	for _, f := range flags {
		s.cache[f.Key] = f
	}
	s.lastRefresh = time.Now()
	s.mu.Unlock()
	return nil
}

// SetTTL changes the cache TTL.
func (s *Service) SetTTL(ttl time.Duration) {
	s.mu.Lock()
	s.ttl = ttl
	s.mu.Unlock()
}

// Stats returns evaluation statistics.
func (s *Service) Stats() EvalStats {
	s.mu.RLock()
	overrideCount := len(s.overrides)
	cachedCount := len(s.cache)
	s.mu.RUnlock()

	return EvalStats{
		TotalEvaluations: s.totalEvals.Load(),
		Enabled:          s.enabled.Load(),
		Disabled:         s.disabled.Load(),
		CacheHits:        s.cacheHits.Load(),
		CacheMisses:      s.cacheMisses.Load(),
		Overrides:        overrideCount,
		CachedFlags:      cachedCount,
	}
}

// ── Internal helpers ─────────────────────

func (s *Service) getFlag(ctx context.Context, key string) *Flag {
	s.mu.RLock()
	cached, ok := s.cache[key]
	needsRefresh := time.Since(s.lastRefresh) > s.ttl
	s.mu.RUnlock()

	if ok && !needsRefresh {
		s.cacheHits.Add(1)
		return cached
	}

	s.cacheMisses.Add(1)

	flag, err := s.store.Get(ctx, key)
	if err != nil {
		return cached // return stale on error
	}

	s.mu.Lock()
	s.cache[key] = flag
	s.lastRefresh = time.Now()
	s.mu.Unlock()

	return flag
}

func (s *Service) variant(flag *Flag, userID string) string {
	if len(flag.Variants) == 0 {
		return ""
	}
	keys := make([]string, 0, len(flag.Variants))
	for k := range flag.Variants {
		keys = append(keys, k)
	}
	idx := hashBucket(flag.Key+":variant", userID) % len(keys)
	return keys[idx]
}

// hashBucket returns a deterministic 0-99 bucket for consistent rollout.
func hashBucket(key, userID string) int {
	h := fnv.New32a()
	h.Write([]byte(key + ":" + userID))
	return int(h.Sum32() % 100)
}

