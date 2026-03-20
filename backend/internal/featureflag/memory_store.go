package featureflag

import (
	"context"
	"fmt"
	"sync"
)

// MemoryStore is an in-memory Store implementation for development and testing.
type MemoryStore struct {
	flags map[string]*Flag
	mu    sync.RWMutex
}

// NewMemoryStore creates a new in-memory flag store.
func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		flags: make(map[string]*Flag),
	}
}

func (m *MemoryStore) Get(_ context.Context, key string) (*Flag, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	flag, ok := m.flags[key]
	if !ok {
		return nil, fmt.Errorf("flag %q not found", key)
	}
	return flag, nil
}

func (m *MemoryStore) List(_ context.Context) ([]*Flag, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	result := make([]*Flag, 0, len(m.flags))
	for _, f := range m.flags {
		result = append(result, f)
	}
	return result, nil
}

func (m *MemoryStore) Set(_ context.Context, flag *Flag) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.flags[flag.Key] = flag
	return nil
}

func (m *MemoryStore) Delete(_ context.Context, key string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.flags, key)
	return nil
}
