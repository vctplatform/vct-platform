---
name: vct-caching
description: Caching strategy for VCT Platform — CachedStore wrapper, Redis integration, TTL configuration, cache invalidation patterns, and when to cache vs skip cache.
---

# VCT Platform Caching Strategy

> **When to activate**: Performance optimization, adding cache layers, configuring TTL, invalidating stale data, or setting up Redis for production.

---


> [!IMPORTANT]
> **SUPREME ARCHITECTURE DIRECTIVE**: You are strictly bound by the 19 architecture pillars documented in `docs/architecture/`. As a VCT AI Agent, your absolute highest priority is 100% compliance with these rules. You MUST NOT generate code, propose designs, or execute workflows that violate these foundational rules. They are unchangeable and strictly enforced.

## 1. Architecture

```
HTTP Request → Handler → Service → Repository Adapter
                                        ↓
                                   CachedStore
                                    ┌────────┐
                                    │ Memory  │ (L1 — in-process, TTL)
                                    │  Cache  │
                                    └────┬───┘
                                         ↓ (miss)
                                    ┌────────┐
                                    │  Redis  │ (L2 — shared, optional)
                                    └────┬───┘
                                         ↓ (miss)
                                    ┌────────┐
                                    │Postgres │ (source of truth)
                                    └────────┘
```

---

## 2. CachedStore (L1 In-Memory Cache)

Located at `backend/internal/store/cached_store.go`:

```go
type CachedStore struct {
    inner    DataStore      // Underlying store (postgres/memory)
    cache    *cache.Cache   // TTL cache
    ttl      time.Duration
    maxItems int
}
```

### Configuration
```env
VCT_CACHE_TTL=30s              # Default TTL for cache entries
VCT_CACHE_MAX_ENTRIES=2000     # Max items in L1 cache
```

### Behavior
- **List** queries are cached by entity type
- **Get by ID** queries are cached by `{entityType}:{id}`
- **Create/Update/Delete** automatically invalidate related cache entries
- **Cache key format**: `list:{entityType}` or `item:{entityType}:{id}`

---

## 3. Redis Cache (L2 Shared Cache)

### Configuration
```env
VCT_REDIS_URL=redis://localhost:6379
VCT_REDIS_PASSWORD=
VCT_REDIS_DB=0
VCT_REDIS_CACHE_TTL=5m         # Longer TTL for shared cache
```

### When to Use Redis
| Use Case | Use Redis? |
|----------|-----------|
| Single server deployment | ❌ L1 memory is sufficient |
| Multi-instance deployment | ✅ Share cache across instances |
| Session storage | ✅ Shared state |
| Rate limiting counters | ✅ Shared counters |
| Real-time leaderboards | ✅ Sorted sets |
| Pub/Sub notifications | ✅ Redis Pub/Sub |

---

## 4. Cache Invalidation Patterns

### Automatic (Built-in)
```go
// CachedStore automatically invalidates on write:
func (s *CachedStore) Create(entityType string, data map[string]any) error {
    err := s.inner.Create(entityType, data)
    if err == nil {
        s.cache.Delete("list:" + entityType)  // Invalidate list
    }
    return err
}

func (s *CachedStore) Update(entityType, id string, data map[string]any) error {
    err := s.inner.Update(entityType, id, data)
    if err == nil {
        s.cache.Delete("list:" + entityType)          // List
        s.cache.Delete("item:" + entityType + ":" + id) // Item
    }
    return err
}
```

### Manual (When Needed)
```go
// Event-driven invalidation for cross-entity dependencies
s.eventBus.Subscribe(events.EventStatusChanged, func(e events.DomainEvent) {
    if e.EntityType == "tournament" {
        s.cache.Delete("list:registrations")  // Tournament change affects registrations
    }
})
```

---

## 5. What to Cache vs. What to Skip

| Data Type | Cache? | TTL | Reason |
|-----------|--------|-----|--------|
| Entity lists (athletes, clubs) | ✅ | 30s | Frequently queried, rarely changes |
| Entity by ID | ✅ | 30s | Hot path for detail views |
| Auth tokens | ❌ | — | Security-sensitive, validate each time |
| Real-time scores | ❌ | — | Must be current, event-sourced |
| Static config (belts, age groups) | ✅ | 5m | Rarely changes |
| Dashboard aggregations | ✅ | 60s | Expensive to compute |
| User sessions | ✅ (Redis) | Session TTL | Shared across instances |

---

## 6. Cache Warming

For startup performance:
```go
func (s *Server) warmCache() {
    entities := []string{"athletes", "clubs", "tournaments", "federations"}
    for _, e := range entities {
        s.store.List(e)  // Populates cache
    }
}
```

---

## 7. Monitoring Cache Health

```go
// Cache hit/miss metrics (implement in CachedStore)
type CacheMetrics struct {
    Hits       int64
    Misses     int64
    Evictions  int64
    Size       int
}

// Log periodically
log.Printf("cache: hits=%d misses=%d ratio=%.2f%% size=%d",
    m.Hits, m.Misses, float64(m.Hits)/float64(m.Hits+m.Misses)*100, m.Size)
```

---

## 8. Anti-Patterns

1. ❌ **NEVER** cache auth tokens or security credentials
2. ❌ **NEVER** cache mutable data with infinite TTL — always set expiry
3. ❌ **NEVER** return stale data for real-time scoring — skip cache
4. ❌ **NEVER** cache error responses — only cache successful results
5. ❌ **NEVER** skip invalidation on writes — stale data causes bugs
6. ❌ **NEVER** cache user-specific data in shared cache without key isolation
