package cache

import (
	"sync"
	"time"
)

type entry struct {
	value     any
	expiresAt time.Time
	createdAt time.Time
}

type TTLCache struct {
	mu         sync.RWMutex
	entries    map[string]entry
	defaultTTL time.Duration
	maxEntries int
}

func NewTTLCache(defaultTTL time.Duration, maxEntries int) *TTLCache {
	if defaultTTL <= 0 {
		defaultTTL = 30 * time.Second
	}
	if maxEntries <= 0 {
		maxEntries = 2000
	}
	return &TTLCache{
		entries:    make(map[string]entry, maxEntries),
		defaultTTL: defaultTTL,
		maxEntries: maxEntries,
	}
}

func (c *TTLCache) Get(key string) (any, bool) {
	now := time.Now().UTC()

	c.mu.RLock()
	record, ok := c.entries[key]
	c.mu.RUnlock()
	if !ok {
		return nil, false
	}

	if now.After(record.expiresAt) {
		c.mu.Lock()
		delete(c.entries, key)
		c.mu.Unlock()
		return nil, false
	}

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

func (c *TTLCache) evictIfNeededLocked() {
	if len(c.entries) < c.maxEntries {
		return
	}

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
	}
}
