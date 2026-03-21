// Package distlock provides in-memory distributed locks with TTL expiration,
// ownership tracking, lock extension, and a guard pattern for auto-release.
package distlock

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"sync"
	"sync/atomic"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// Lock Entry
// ═══════════════════════════════════════════════════════════════

type lockEntry struct {
	owner     string
	expiresAt time.Time
}

func (l *lockEntry) expired() bool {
	return time.Now().After(l.expiresAt)
}

// ═══════════════════════════════════════════════════════════════
// Manager
// ═══════════════════════════════════════════════════════════════

// Manager manages named locks with TTL and ownership.
type Manager struct {
	locks    map[string]*lockEntry
	mu       sync.Mutex
	acquired atomic.Int64
	released atomic.Int64
	denied   atomic.Int64
}

// NewManager creates a lock manager.
func NewManager() *Manager {
	return &Manager{
		locks: make(map[string]*lockEntry),
	}
}

// TryLock attempts to acquire a lock. Returns (ownerToken, true) on success.
func (m *Manager) TryLock(name string, ttl time.Duration) (string, bool) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if existing, ok := m.locks[name]; ok && !existing.expired() {
		m.denied.Add(1)
		return "", false
	}

	owner := generateOwner()
	m.locks[name] = &lockEntry{
		owner:     owner,
		expiresAt: time.Now().Add(ttl),
	}
	m.acquired.Add(1)
	return owner, true
}

// Unlock releases a lock. Only the owner can release it.
func (m *Manager) Unlock(name, owner string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	entry, ok := m.locks[name]
	if !ok {
		return fmt.Errorf("lock %q not found", name)
	}
	if entry.owner != owner {
		return fmt.Errorf("lock %q: ownership mismatch", name)
	}

	delete(m.locks, name)
	m.released.Add(1)
	return nil
}

// Extend prolongs a lock's TTL. Only the owner can extend.
func (m *Manager) Extend(name, owner string, ttl time.Duration) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	entry, ok := m.locks[name]
	if !ok || entry.expired() {
		return fmt.Errorf("lock %q not found or expired", name)
	}
	if entry.owner != owner {
		return fmt.Errorf("lock %q: ownership mismatch", name)
	}

	entry.expiresAt = time.Now().Add(ttl)
	return nil
}

// IsLocked checks if a lock is currently held.
func (m *Manager) IsLocked(name string) bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	entry, ok := m.locks[name]
	return ok && !entry.expired()
}

// ═══════════════════════════════════════════════════════════════
// Guard — Auto-release pattern
// ═══════════════════════════════════════════════════════════════

// Guard holds a lock and releases it when done.
type Guard struct {
	manager *Manager
	name    string
	owner   string
}

// Release unlocks the guard.
func (g *Guard) Release() error {
	return g.manager.Unlock(g.name, g.owner)
}

// Owner returns the ownership token.
func (g *Guard) Owner() string {
	return g.owner
}

// Acquire attempts to get a lock, retrying until ctx expires.
func (m *Manager) Acquire(ctx context.Context, name string, ttl time.Duration) (*Guard, error) {
	for {
		owner, ok := m.TryLock(name, ttl)
		if ok {
			return &Guard{manager: m, name: name, owner: owner}, nil
		}

		select {
		case <-ctx.Done():
			return nil, fmt.Errorf("lock %q: acquire timeout: %w", name, ctx.Err())
		case <-time.After(50 * time.Millisecond):
			// Retry
		}
	}
}

// WithLock acquires a lock, runs fn, then releases. Convenience wrapper.
func (m *Manager) WithLock(ctx context.Context, name string, ttl time.Duration, fn func() error) error {
	guard, err := m.Acquire(ctx, name, ttl)
	if err != nil {
		return err
	}
	defer guard.Release()
	return fn()
}

// ═══════════════════════════════════════════════════════════════
// Stats
// ═══════════════════════════════════════════════════════════════

// Stats returns lock manager statistics.
type Stats struct {
	Active   int   `json:"active"`
	Acquired int64 `json:"acquired"`
	Released int64 `json:"released"`
	Denied   int64 `json:"denied"`
}

func (m *Manager) Stats() Stats {
	m.mu.Lock()
	active := 0
	for _, e := range m.locks {
		if !e.expired() {
			active++
		}
	}
	m.mu.Unlock()

	return Stats{
		Active:   active,
		Acquired: m.acquired.Load(),
		Released: m.released.Load(),
		Denied:   m.denied.Load(),
	}
}

func generateOwner() string {
	b := make([]byte, 8)
	rand.Read(b)
	return hex.EncodeToString(b)
}
