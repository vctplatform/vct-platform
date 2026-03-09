package store

import (
	"fmt"
	"time"

	"vct-platform/backend/internal/cache"
)

type CachedStore struct {
	source DataStore
	cache  *cache.TTLCache
}

func NewCachedStore(source DataStore, ttl time.Duration, maxEntries int) *CachedStore {
	return &CachedStore{
		source: source,
		cache:  cache.NewTTLCache(ttl, maxEntries),
	}
}

func (s *CachedStore) EnsureEntity(entity string) {
	s.source.EnsureEntity(entity)
}

func (s *CachedStore) List(entity string) []map[string]any {
	cacheKey := fmt.Sprintf("list:%s", entity)
	if value, ok := s.cache.Get(cacheKey); ok {
		if rows, castOk := value.([]map[string]any); castOk {
			return cloneMapSlice(rows)
		}
	}

	rows := s.source.List(entity)
	s.cache.Set(cacheKey, cloneMapSlice(rows))
	return rows
}

func (s *CachedStore) GetByID(entity, id string) (map[string]any, bool) {
	cacheKey := fmt.Sprintf("item:%s:%s", entity, id)
	if value, ok := s.cache.Get(cacheKey); ok {
		if row, castOk := value.(map[string]any); castOk {
			return cloneMap(row), true
		}
	}

	row, found := s.source.GetByID(entity, id)
	if found {
		s.cache.Set(cacheKey, cloneMap(row))
	}
	return row, found
}

func (s *CachedStore) Create(entity string, item map[string]any) (map[string]any, error) {
	created, err := s.source.Create(entity, item)
	if err != nil {
		return nil, err
	}
	s.invalidateEntity(entity, created["id"])
	return created, nil
}

func (s *CachedStore) Update(entity, id string, patch map[string]any) (map[string]any, error) {
	updated, err := s.source.Update(entity, id, patch)
	if err != nil {
		return nil, err
	}
	s.invalidateEntity(entity, id)
	return updated, nil
}

func (s *CachedStore) Delete(entity, id string) {
	s.source.Delete(entity, id)
	s.invalidateEntity(entity, id)
}

func (s *CachedStore) ReplaceAll(entity string, items []map[string]any) ([]map[string]any, error) {
	replaced, err := s.source.ReplaceAll(entity, items)
	if err != nil {
		return nil, err
	}
	s.invalidateEntity(entity, nil)
	return replaced, nil
}

func (s *CachedStore) Import(entity string, payload []any) ImportReport {
	report := s.source.Import(entity, payload)
	s.invalidateEntity(entity, nil)
	return report
}

func (s *CachedStore) ExportJSON(entity string) (string, error) {
	cacheKey := fmt.Sprintf("export:%s:json", entity)
	if value, ok := s.cache.Get(cacheKey); ok {
		if body, castOk := value.(string); castOk {
			return body, nil
		}
	}
	body, err := s.source.ExportJSON(entity)
	if err != nil {
		return "", err
	}
	s.cache.Set(cacheKey, body)
	return body, nil
}

func (s *CachedStore) ExportCSV(entity string) (string, error) {
	cacheKey := fmt.Sprintf("export:%s:csv", entity)
	if value, ok := s.cache.Get(cacheKey); ok {
		if body, castOk := value.(string); castOk {
			return body, nil
		}
	}
	body, err := s.source.ExportCSV(entity)
	if err != nil {
		return "", err
	}
	s.cache.Set(cacheKey, body)
	return body, nil
}

func (s *CachedStore) Close() error {
	return s.source.Close()
}

func (s *CachedStore) CacheStats() map[string]any {
	return map[string]any{
		"items":      s.cache.Len(),
		"defaultTtl": s.cache.DefaultTTL().String(),
		"maxEntries": s.cache.MaxEntries(),
	}
}

func (s *CachedStore) invalidateEntity(entity string, id any) {
	s.cache.InvalidatePrefix(fmt.Sprintf("list:%s", entity))
	s.cache.InvalidatePrefix(fmt.Sprintf("export:%s", entity))
	if id != nil {
		s.cache.Delete(fmt.Sprintf("item:%s:%v", entity, id))
	} else {
		s.cache.InvalidatePrefix(fmt.Sprintf("item:%s:", entity))
	}
}

func cloneMapSlice(source []map[string]any) []map[string]any {
	result := make([]map[string]any, 0, len(source))
	for _, item := range source {
		result = append(result, cloneMap(item))
	}
	return result
}
