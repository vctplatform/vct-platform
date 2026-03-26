package registry

import (
	"context"
	"errors"
	"testing"
)

// ── Test services ───────────────────

type dbService struct{ started, stopped bool }

func (d *dbService) Name() string                        { return "database" }
func (d *dbService) Start(_ context.Context) error       { d.started = true; return nil }
func (d *dbService) Stop(_ context.Context) error        { d.stopped = true; return nil }
func (d *dbService) HealthCheck(_ context.Context) error { return nil }

type cacheService struct{ started bool }

func (c *cacheService) Name() string                  { return "cache" }
func (c *cacheService) Start(_ context.Context) error { c.started = true; return nil }

type apiService struct{ db *dbService }

func (a *apiService) Name() string { return "api" }
func (a *apiService) HealthCheck(_ context.Context) error {
	if a.db == nil {
		return errors.New("no database")
	}
	return nil
}

func TestGet_LazySingleton(t *testing.T) {
	reg := New()
	callCount := 0

	reg.Register("db", 10, func(r *Registry) (Service, error) {
		callCount++
		return &dbService{}, nil
	})

	s1, _ := reg.Get("db")
	s2, _ := reg.Get("db")

	if s1 != s2 {
		t.Error("should return same instance")
	}
	if callCount != 1 {
		t.Errorf("factory should be called once, got %d", callCount)
	}
}

func TestGet_NotFound(t *testing.T) {
	reg := New()
	_, err := reg.Get("nonexistent")
	if err == nil {
		t.Error("expected error")
	}
}

func TestMustGet_Panics(t *testing.T) {
	reg := New()
	defer func() {
		if r := recover(); r == nil {
			t.Error("expected panic")
		}
	}()
	reg.MustGet("missing")
}

func TestDependencyInjection(t *testing.T) {
	reg := New()

	reg.Register("db", 10, func(r *Registry) (Service, error) {
		return &dbService{}, nil
	})

	reg.Register("api", 30, func(r *Registry) (Service, error) {
		db := r.MustGet("db").(*dbService)
		return &apiService{db: db}, nil
	})

	api, err := reg.Get("api")
	if err != nil {
		t.Fatal(err)
	}
	a := api.(*apiService)
	if a.db == nil {
		t.Error("api should have db injected")
	}
}

func TestStartAll_PriorityOrder(t *testing.T) {
	reg := New()
	var order []string

	reg.Register("cache", 20, func(r *Registry) (Service, error) {
		return &startTracker{name: "cache", order: &order}, nil
	})
	reg.Register("db", 10, func(r *Registry) (Service, error) {
		return &startTracker{name: "db", order: &order}, nil
	})

	err := reg.StartAll(context.Background())
	if err != nil {
		t.Fatal(err)
	}

	if len(order) != 2 || order[0] != "db" || order[1] != "cache" {
		t.Errorf("expected [db, cache], got %v", order)
	}
}

type startTracker struct {
	name  string
	order *[]string
}

func (s *startTracker) Name() string { return s.name }
func (s *startTracker) Start(_ context.Context) error {
	*s.order = append(*s.order, s.name)
	return nil
}

func TestStopAll_ReverseOrder(t *testing.T) {
	reg := New()
	var order []string

	reg.Register("db", 10, func(r *Registry) (Service, error) {
		return &stopTracker{name: "db", order: &order}, nil
	})
	reg.Register("cache", 20, func(r *Registry) (Service, error) {
		return &stopTracker{name: "cache", order: &order}, nil
	})

	// Initialize all
	reg.StartAll(context.Background())

	reg.StopAll(context.Background())

	if len(order) != 2 || order[0] != "cache" || order[1] != "db" {
		t.Errorf("expected [cache, db] (reverse), got %v", order)
	}
}

type stopTracker struct {
	name  string
	order *[]string
}

func (s *stopTracker) Name() string                  { return s.name }
func (s *stopTracker) Start(_ context.Context) error { return nil }
func (s *stopTracker) Stop(_ context.Context) error  { *s.order = append(*s.order, s.name); return nil }

func TestHealthCheckAll(t *testing.T) {
	reg := New()

	reg.Register("db", 10, func(r *Registry) (Service, error) {
		return &dbService{}, nil
	})
	reg.Register("api", 30, func(r *Registry) (Service, error) {
		db := r.MustGet("db").(*dbService)
		return &apiService{db: db}, nil
	})

	reg.StartAll(context.Background())

	status := reg.HealthCheckAll(context.Background())
	if !status.Healthy {
		t.Error("all services should be healthy")
	}
	if status.Services["db"] != "healthy" {
		t.Error("db should be healthy")
	}
}

func TestHealthCheckAll_Unhealthy(t *testing.T) {
	reg := New()

	reg.Register("api", 10, func(r *Registry) (Service, error) {
		return &apiService{db: nil}, nil // no db = unhealthy
	})

	reg.Get("api") // initialize

	status := reg.HealthCheckAll(context.Background())
	if status.Healthy {
		t.Error("should be unhealthy")
	}
}

func TestHasAndList(t *testing.T) {
	reg := New()
	reg.Register("db", 10, func(r *Registry) (Service, error) { return &dbService{}, nil })

	if !reg.Has("db") {
		t.Error("should have db")
	}
	if reg.Has("cache") {
		t.Error("should not have cache")
	}
	if len(reg.List()) != 1 {
		t.Errorf("expected 1 service, got %d", len(reg.List()))
	}
}
