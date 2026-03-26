// Package registry provides a service registry (dependency injection container)
// with lazy singleton initialization, ordered lifecycle management, and health aggregation.
package registry

import (
	"context"
	"fmt"
	"sort"
	"sync"
)

// ═══════════════════════════════════════════════════════════════
// Service Interfaces
// ═══════════════════════════════════════════════════════════════

// Service is the base interface all services implement.
type Service interface {
	Name() string
}

// Starter is a service that needs initialization.
type Starter interface {
	Start(ctx context.Context) error
}

// Stopper is a service that needs cleanup.
type Stopper interface {
	Stop(ctx context.Context) error
}

// HealthChecker is a service that can report its health.
type HealthChecker interface {
	HealthCheck(ctx context.Context) error
}

// ═══════════════════════════════════════════════════════════════
// Registration Entry
// ═══════════════════════════════════════════════════════════════

type entry struct {
	name     string
	priority int // Lower = starts earlier, stops later
	factory  func(r *Registry) (Service, error)
	instance Service
	once     sync.Once
	err      error
}

// ═══════════════════════════════════════════════════════════════
// Registry
// ═══════════════════════════════════════════════════════════════

// Registry is a dependency injection container.
type Registry struct {
	entries map[string]*entry
	order   []string // insertion order
	mu      sync.RWMutex
}

// New creates an empty service registry.
func New() *Registry {
	return &Registry{
		entries: make(map[string]*entry),
	}
}

// Register adds a service factory with a priority.
// Lower priority services start first and stop last.
func (r *Registry) Register(name string, priority int, factory func(r *Registry) (Service, error)) {
	r.mu.Lock()
	r.entries[name] = &entry{
		name:     name,
		priority: priority,
		factory:  factory,
	}
	r.order = append(r.order, name)
	r.mu.Unlock()
}

// Get resolves a service by name (lazy singleton).
func (r *Registry) Get(name string) (Service, error) {
	r.mu.RLock()
	e, ok := r.entries[name]
	r.mu.RUnlock()

	if !ok {
		return nil, fmt.Errorf("service %q not registered", name)
	}

	e.once.Do(func() {
		e.instance, e.err = e.factory(r)
	})

	return e.instance, e.err
}

// MustGet resolves a service or panics.
func (r *Registry) MustGet(name string) Service {
	svc, err := r.Get(name)
	if err != nil {
		panic(fmt.Sprintf("registry: %v", err))
	}
	return svc
}

// Has checks if a service is registered.
func (r *Registry) Has(name string) bool {
	r.mu.RLock()
	_, ok := r.entries[name]
	r.mu.RUnlock()
	return ok
}

// ═══════════════════════════════════════════════════════════════
// Lifecycle
// ═══════════════════════════════════════════════════════════════

// StartAll initializes and starts all services in priority order.
func (r *Registry) StartAll(ctx context.Context) error {
	sorted := r.sortedEntries(true)

	for _, e := range sorted {
		svc, err := r.Get(e.name)
		if err != nil {
			return fmt.Errorf("init %s: %w", e.name, err)
		}
		if starter, ok := svc.(Starter); ok {
			if err := starter.Start(ctx); err != nil {
				return fmt.Errorf("start %s: %w", e.name, err)
			}
		}
	}
	return nil
}

// StopAll stops all initialized services in reverse priority order.
func (r *Registry) StopAll(ctx context.Context) error {
	sorted := r.sortedEntries(false) // reverse

	var firstErr error
	for _, e := range sorted {
		if e.instance == nil {
			continue
		}
		if stopper, ok := e.instance.(Stopper); ok {
			if err := stopper.Stop(ctx); err != nil && firstErr == nil {
				firstErr = fmt.Errorf("stop %s: %w", e.name, err)
			}
		}
	}
	return firstErr
}

// ═══════════════════════════════════════════════════════════════
// Health
// ═══════════════════════════════════════════════════════════════

// HealthStatus represents the health report of all services.
type HealthStatus struct {
	Healthy  bool              `json:"healthy"`
	Services map[string]string `json:"services"`
}

// HealthCheckAll runs health checks on all initialized services.
func (r *Registry) HealthCheckAll(ctx context.Context) HealthStatus {
	status := HealthStatus{
		Healthy:  true,
		Services: make(map[string]string),
	}

	r.mu.RLock()
	entries := make([]*entry, 0, len(r.entries))
	for _, e := range r.entries {
		entries = append(entries, e)
	}
	r.mu.RUnlock()

	for _, e := range entries {
		if e.instance == nil {
			continue
		}
		if hc, ok := e.instance.(HealthChecker); ok {
			if err := hc.HealthCheck(ctx); err != nil {
				status.Healthy = false
				status.Services[e.name] = "unhealthy: " + err.Error()
			} else {
				status.Services[e.name] = "healthy"
			}
		}
	}
	return status
}

// List returns all registered service names.
func (r *Registry) List() []string {
	r.mu.RLock()
	defer r.mu.RUnlock()
	names := make([]string, len(r.order))
	copy(names, r.order)
	return names
}

func (r *Registry) sortedEntries(ascending bool) []*entry {
	r.mu.RLock()
	defer r.mu.RUnlock()

	sorted := make([]*entry, 0, len(r.entries))
	for _, e := range r.entries {
		sorted = append(sorted, e)
	}

	sort.SliceStable(sorted, func(i, j int) bool {
		if ascending {
			return sorted[i].priority < sorted[j].priority
		}
		return sorted[i].priority > sorted[j].priority
	})

	return sorted
}
