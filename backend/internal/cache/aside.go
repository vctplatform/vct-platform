package cache

import (
	"context"
	"log/slog"
	"sync"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// Cache-Aside Pattern — Read-through with write-invalidate
// Wraps any data source with TTLCache for transparent caching
// ═══════════════════════════════════════════════════════════════

// Fetcher loads data from the source when cache misses.
type Fetcher[T any] func(ctx context.Context, key string) (T, error)

// Aside wraps a TTLCache with read-through and write-invalidate logic.
type Aside[T any] struct {
	cache  *TTLCache
	entity string
	fetch  Fetcher[T]
	logger *slog.Logger
	tags   *TagIndex
}

// NewAside creates a cache-aside wrapper for a specific entity type.
func NewAside[T any](cache *TTLCache, entity string, fetch Fetcher[T], logger *slog.Logger) *Aside[T] {
	return &Aside[T]{
		cache:  cache,
		entity: entity,
		fetch:  fetch,
		logger: logger.With(slog.String("cache_entity", entity)),
		tags:   NewTagIndex(),
	}
}

// Get reads from cache, falls through to source on miss.
func (a *Aside[T]) Get(ctx context.Context, key string) (T, error) {
	cacheKey := a.entity + ":" + key

	// Try cache first
	if val, ok := a.cache.Get(cacheKey); ok {
		if typed, ok := val.(T); ok {
			return typed, nil
		}
	}

	// Cache miss — fetch from source
	val, err := a.fetch(ctx, key)
	if err != nil {
		var zero T
		return zero, err
	}

	// Store in cache with entity-specific TTL
	a.cache.SetForEntity(a.entity, cacheKey, val)
	return val, nil
}

// Invalidate removes a specific key.
func (a *Aside[T]) Invalidate(key string) {
	cacheKey := a.entity + ":" + key
	a.cache.Delete(cacheKey)
}

// InvalidateAll removes all entries for this entity.
func (a *Aside[T]) InvalidateAll() {
	a.cache.InvalidatePrefix(a.entity + ":")
}

// Set explicitly writes to cache (e.g., after a write operation).
func (a *Aside[T]) Set(key string, value T) {
	cacheKey := a.entity + ":" + key
	a.cache.SetForEntity(a.entity, cacheKey, value)
}

// SetWithTags stores a value and associates it with tags for group invalidation.
func (a *Aside[T]) SetWithTags(key string, value T, tags ...string) {
	cacheKey := a.entity + ":" + key
	a.cache.SetForEntity(a.entity, cacheKey, value)
	a.tags.Tag(cacheKey, tags...)
}

// InvalidateByTag removes all keys associated with a tag.
func (a *Aside[T]) InvalidateByTag(tag string) {
	keys := a.tags.KeysByTag(tag)
	for _, key := range keys {
		a.cache.Delete(key)
	}
	a.tags.RemoveTag(tag)
}

// ═══════════════════════════════════════════════════════════════
// Tag Index — Maps tags to cache keys for group invalidation
// ═══════════════════════════════════════════════════════════════

// TagIndex maintains a tag → keys mapping for batch invalidation.
type TagIndex struct {
	tagToKeys map[string]map[string]struct{}
	keyToTags map[string]map[string]struct{}
	mu        sync.RWMutex
}

// NewTagIndex creates a tag index.
func NewTagIndex() *TagIndex {
	return &TagIndex{
		tagToKeys: make(map[string]map[string]struct{}),
		keyToTags: make(map[string]map[string]struct{}),
	}
}

// Tag associates a key with one or more tags.
func (t *TagIndex) Tag(key string, tags ...string) {
	t.mu.Lock()
	defer t.mu.Unlock()

	if _, ok := t.keyToTags[key]; !ok {
		t.keyToTags[key] = make(map[string]struct{})
	}

	for _, tag := range tags {
		t.keyToTags[key][tag] = struct{}{}

		if _, ok := t.tagToKeys[tag]; !ok {
			t.tagToKeys[tag] = make(map[string]struct{})
		}
		t.tagToKeys[tag][key] = struct{}{}
	}
}

// KeysByTag returns all keys associated with a tag.
func (t *TagIndex) KeysByTag(tag string) []string {
	t.mu.RLock()
	defer t.mu.RUnlock()

	keys, ok := t.tagToKeys[tag]
	if !ok {
		return nil
	}
	result := make([]string, 0, len(keys))
	for k := range keys {
		result = append(result, k)
	}
	return result
}

// RemoveTag removes a tag and all its key associations.
func (t *TagIndex) RemoveTag(tag string) {
	t.mu.Lock()
	defer t.mu.Unlock()

	keys, ok := t.tagToKeys[tag]
	if !ok {
		return
	}

	for key := range keys {
		if tags, ok := t.keyToTags[key]; ok {
			delete(tags, tag)
			if len(tags) == 0 {
				delete(t.keyToTags, key)
			}
		}
	}
	delete(t.tagToKeys, tag)
}

// RemoveKey removes a key from all its tags.
func (t *TagIndex) RemoveKey(key string) {
	t.mu.Lock()
	defer t.mu.Unlock()

	tags, ok := t.keyToTags[key]
	if !ok {
		return
	}

	for tag := range tags {
		if keys, ok := t.tagToKeys[tag]; ok {
			delete(keys, key)
			if len(keys) == 0 {
				delete(t.tagToKeys, tag)
			}
		}
	}
	delete(t.keyToTags, key)
}

// Stats returns tag index stats for debugging.
func (t *TagIndex) Stats() (tags int, keys int) {
	t.mu.RLock()
	defer t.mu.RUnlock()
	return len(t.tagToKeys), len(t.keyToTags)
}

// ═══════════════════════════════════════════════════════════════
// Preset entity TTL configurations for VCT Platform
// ═══════════════════════════════════════════════════════════════

// ConfigureVCTDefaults sets optimal TTL per entity type.
func ConfigureVCTDefaults(c *TTLCache) {
	c.SetEntityTTL("tournament", 5*time.Minute)
	c.SetEntityTTL("athlete", 10*time.Minute)
	c.SetEntityTTL("club", 15*time.Minute)
	c.SetEntityTTL("weight_class", 1*time.Hour)
	c.SetEntityTTL("belt", 1*time.Hour)
	c.SetEntityTTL("regulation", 1*time.Hour)
	c.SetEntityTTL("match", 30*time.Second) // Live scoring — short TTL
	c.SetEntityTTL("bracket", 1*time.Minute)
	c.SetEntityTTL("user", 5*time.Minute)
	c.SetEntityTTL("scoring", 0) // Disabled — real-time data never cached
}
