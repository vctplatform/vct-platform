package cache

import (
	"sync"
	"sync/atomic"
	"time"
)

type entry struct {
	value     any
	expiresAt time.Time
	createdAt time.Time
}

// CacheStats holds cache performance metrics.
type CacheStats struct {
	Hits       int64
	Misses     int64
	Entries    int
	MaxEntries int
	HitRatio   float64
	Evictions  int64
}

type TTLCache struct {
	mu         sync.RWMutex
	entries    map[string]entry
	defaultTTL time.Duration
	maxEntries int
	entityTTL  map[string]time.Duration // per-entity TTL overrides

	// Atomic counters for lock-free stats
	hits      atomic.Int64
	misses    atomic.Int64
	evictions atomic.Int64

	// GC control
	stopGC chan struct{}
}

func NewTTLCache(defaultTTL time.Duration, maxEntries int) *TTLCache {
	if defaultTTL <= 0 {
		defaultTTL = 30 * time.Second
	}
	if maxEntries <= 0 {
		maxEntries = 2000
	}
	c := &TTLCache{
		entries:    make(map[string]entry, maxEntries),
		defaultTTL: defaultTTL,
		maxEntries: maxEntries,
		entityTTL:  make(map[string]time.Duration),
		stopGC:     make(chan struct{}),
	}
	go c.gcLoop()
	return c
}

// Stats returns current cache performance metrics.
func (c *TTLCache) Stats() CacheStats {
	c.mu.RLock()
	entryCount := len(c.entries)
	c.mu.RUnlock()

	hits := c.hits.Load()
	misses := c.misses.Load()
	total := hits + misses
	var ratio float64
	if total > 0 {
		ratio = float64(hits) / float64(total)
	}

	return CacheStats{
		Hits:       hits,
		Misses:     misses,
		Entries:    entryCount,
		MaxEntries: c.maxEntries,
		HitRatio:   ratio,
		Evictions:  c.evictions.Load(),
	}
}

// SetEntityTTL configures a custom TTL for a specific entity type.
// Use TTL=0 to disable caching for that entity (e.g., scoring data).
func (c *TTLCache) SetEntityTTL(entity string, ttl time.Duration) {
	c.mu.Lock()
	c.entityTTL[entity] = ttl
	c.mu.Unlock()
}

// GetEntityTTL returns the configured TTL for an entity, or the default.
func (c *TTLCache) GetEntityTTL(entity string) time.Duration {
	c.mu.RLock()
	ttl, ok := c.entityTTL[entity]
	c.mu.RUnlock()
	if ok {
		return ttl
	}
	return c.defaultTTL
}

// SetForEntity stores a value with the entity-specific TTL.
// If entity TTL is 0 (disabled), the value is not cached.
func (c *TTLCache) SetForEntity(entity, key string, value any) {
	ttl := c.GetEntityTTL(entity)
	if ttl <= 0 {
		return // caching disabled for this entity
	}
	c.SetWithTTL(key, value, ttl)
}

func (c *TTLCache) Get(key string) (any, bool) {
	now := time.Now().UTC()

	c.mu.RLock()
	record, ok := c.entries[key]
	c.mu.RUnlock()
	if !ok {
		c.misses.Add(1)
		return nil, false
	}

	if now.After(record.expiresAt) {
		c.mu.Lock()
		delete(c.entries, key)
		c.mu.Unlock()
		c.misses.Add(1)
		return nil, false
	}

	c.hits.Add(1)
	return record.value, true
}

func (c *TTLCache) Set(key string, value any) {
	c.SetWithTTL(key, value, c.defaultTTL)
}

func (c *TTLCache) SetWithTTL(key string, value any, ttl time.Duration) {
	if ttl <= 0 {
		ttl = c.defaultTTL
	}
	now := time.Now().UTC()
	item := entry{
		value:     value,
		expiresAt: now.Add(ttl),
		createdAt: now,
	}

	c.mu.Lock()
	defer c.mu.Unlock()

	c.evictIfNeededLocked()
	c.entries[key] = item
}

func (c *TTLCache) Delete(key string) {
	c.mu.Lock()
	delete(c.entries, key)
	c.mu.Unlock()
}

func (c *TTLCache) InvalidatePrefix(prefix string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	for key := range c.entries {
		if len(key) >= len(prefix) && key[:len(prefix)] == prefix {
			delete(c.entries, key)
		}
	}
}

// Flush removes all entries.
func (c *TTLCache) Flush() {
	c.mu.Lock()
	c.entries = make(map[string]entry, c.maxEntries)
	c.mu.Unlock()
}

func (c *TTLCache) Len() int {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return len(c.entries)
}

func (c *TTLCache) DefaultTTL() time.Duration {
	return c.defaultTTL
}

func (c *TTLCache) MaxEntries() int {
	return c.maxEntries
}

// Close stops the GC goroutine.
func (c *TTLCache) Close() {
	close(c.stopGC)
}

// gcLoop runs periodic garbage collection of expired entries.
func (c *TTLCache) gcLoop() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			c.purgeExpired()
		case <-c.stopGC:
			return
		}
	}
}

// purgeExpired removes all expired entries.
func (c *TTLCache) purgeExpired() {
	now := time.Now().UTC()
	c.mu.Lock()
	defer c.mu.Unlock()

	for key, item := range c.entries {
		if now.After(item.expiresAt) {
			delete(c.entries, key)
			c.evictions.Add(1)
		}
	}
}

func (c *TTLCache) evictIfNeededLocked() {
	if len(c.entries) < c.maxEntries {
		return
	}

	// First, try purging expired entries
	now := time.Now().UTC()
	for key, item := range c.entries {
		if now.After(item.expiresAt) {
			delete(c.entries, key)
			c.evictions.Add(1)
		}
	}
	if len(c.entries) < c.maxEntries {
		return
	}

	// If still full, evict oldest entry (LRU)
	var oldestKey string
	var oldestAt time.Time
	first := true
	for key, item := range c.entries {
		if first || item.createdAt.Before(oldestAt) {
			first = false
			oldestKey = key
			oldestAt = item.createdAt
		}
	}
	if oldestKey != "" {
		delete(c.entries, oldestKey)
		c.evictions.Add(1)
	}
}
