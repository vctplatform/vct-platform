// Package ratelimit provides a token-bucket rate limiter with
// per-IP, per-user, and per-API-key granularity.
// Enhanced with stats, Retry-After calculation, and lifecycle management.
package ratelimit

import (
	"math"
	"sync"
	"sync/atomic"
	"time"
)

// LimiterStats holds rate limiter statistics.
type LimiterStats struct {
	Allowed int64 `json:"allowed"`
	Denied  int64 `json:"denied"`
	Buckets int   `json:"buckets"`
}

// Limiter implements a token-bucket rate limiter with automatic cleanup.
type Limiter struct {
	rate       float64 // tokens per second
	burst      int     // max burst size
	buckets    map[string]*bucket
	mu         sync.Mutex
	cleanupTTL time.Duration
	stopCh     chan struct{}

	// Atomic stats
	allowed atomic.Int64
	denied  atomic.Int64
}

type bucket struct {
	tokens     float64
	lastRefill time.Time
}

// Config holds rate limiter configuration.
type Config struct {
	Rate       float64       // Requests per second
	Burst      int           // Max burst size
	CleanupTTL time.Duration // Time before idle buckets are cleaned up
}

// DefaultConfig returns sensible defaults.
func DefaultConfig() Config {
	return Config{
		Rate:       10,               // 10 req/s
		Burst:      20,               // burst of 20
		CleanupTTL: 10 * time.Minute, // cleanup after 10min idle
	}
}

// NewLimiter creates a rate limiter with the given config.
func NewLimiter(cfg Config) *Limiter {
	l := &Limiter{
		rate:       cfg.Rate,
		burst:      cfg.Burst,
		buckets:    make(map[string]*bucket),
		cleanupTTL: cfg.CleanupTTL,
		stopCh:     make(chan struct{}),
	}
	go l.cleanupLoop()
	return l
}

// Allow checks if a request from the given key is allowed.
// Returns true if allowed, false if rate-limited.
func (l *Limiter) Allow(key string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	b, ok := l.buckets[key]
	now := time.Now()

	if !ok {
		l.buckets[key] = &bucket{
			tokens:     float64(l.burst) - 1,
			lastRefill: now,
		}
		l.allowed.Add(1)
		return true
	}

	// Refill tokens based on elapsed time
	elapsed := now.Sub(b.lastRefill).Seconds()
	b.tokens += elapsed * l.rate
	if b.tokens > float64(l.burst) {
		b.tokens = float64(l.burst)
	}
	b.lastRefill = now

	if b.tokens >= 1 {
		b.tokens--
		l.allowed.Add(1)
		return true
	}

	l.denied.Add(1)
	return false
}

// Remaining returns the number of remaining tokens for a key.
func (l *Limiter) Remaining(key string) int {
	l.mu.Lock()
	defer l.mu.Unlock()

	b, ok := l.buckets[key]
	if !ok {
		return l.burst
	}

	elapsed := time.Since(b.lastRefill).Seconds()
	tokens := b.tokens + elapsed*l.rate
	if tokens > float64(l.burst) {
		tokens = float64(l.burst)
	}
	return int(tokens)
}

// RetryAfter returns the number of seconds until the next token
// is available for the given key. Returns 0 if tokens are available.
func (l *Limiter) RetryAfter(key string) float64 {
	l.mu.Lock()
	defer l.mu.Unlock()

	b, ok := l.buckets[key]
	if !ok {
		return 0
	}

	elapsed := time.Since(b.lastRefill).Seconds()
	tokens := b.tokens + elapsed*l.rate
	if tokens >= 1 {
		return 0
	}
	// Time until tokens reach 1.0
	needed := 1.0 - tokens
	return math.Ceil(needed / l.rate)
}

// Reset clears the bucket for a key.
func (l *Limiter) Reset(key string) {
	l.mu.Lock()
	delete(l.buckets, key)
	l.mu.Unlock()
}

// Stats returns limiter statistics.
func (l *Limiter) Stats() LimiterStats {
	l.mu.Lock()
	bucketCount := len(l.buckets)
	l.mu.Unlock()
	return LimiterStats{
		Allowed: l.allowed.Load(),
		Denied:  l.denied.Load(),
		Buckets: bucketCount,
	}
}

// BucketCount returns the number of active buckets.
func (l *Limiter) BucketCount() int {
	l.mu.Lock()
	defer l.mu.Unlock()
	return len(l.buckets)
}

// Close stops the cleanup goroutine.
func (l *Limiter) Close() {
	close(l.stopCh)
}

// cleanupLoop removes idle buckets periodically.
func (l *Limiter) cleanupLoop() {
	ticker := time.NewTicker(l.cleanupTTL)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			l.mu.Lock()
			cutoff := time.Now().Add(-l.cleanupTTL)
			for key, b := range l.buckets {
				if b.lastRefill.Before(cutoff) {
					delete(l.buckets, key)
				}
			}
			l.mu.Unlock()
		case <-l.stopCh:
			return
		}
	}
}

