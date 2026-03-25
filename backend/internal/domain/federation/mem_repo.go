package federation

import (
	"context"
	"fmt"
	"sync"
)

// ═══════════════════════════════════════════════════════════════
// IN-MEMORY FEDERATION REPOSITORIES (for domain-level testing)
// These implementations live in the domain package so domain tests
// do not need to import the adapter package (Clean Architecture).
// ═══════════════════════════════════════════════════════════════

// ── Province Repository (In-Memory) ──

type MemProvinceRepo struct {
	mu   sync.RWMutex
	data map[string]Province
	seq  int
}

func NewMemProvinceRepo() *MemProvinceRepo {
	return &MemProvinceRepo{data: make(map[string]Province)}
}

func (r *MemProvinceRepo) List(_ context.Context) ([]Province, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]Province, 0, len(r.data))
	for _, v := range r.data {
		out = append(out, v)
	}
	return out, nil
}

func (r *MemProvinceRepo) GetByID(_ context.Context, id string) (*Province, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	p, ok := r.data[id]
	if !ok {
		return nil, fmt.Errorf("province %q not found", id)
	}
	return &p, nil
}

func (r *MemProvinceRepo) GetByCode(_ context.Context, code string) (*Province, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, p := range r.data {
		if p.Code == code {
			return &p, nil
		}
	}
	return nil, fmt.Errorf("province code %q not found", code)
}

func (r *MemProvinceRepo) Create(_ context.Context, p Province) (*Province, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if p.ID == "" {
		r.seq++
		p.ID = fmt.Sprintf("prov-%d", r.seq)
	}
	r.data[p.ID] = p
	return &p, nil
}

func (r *MemProvinceRepo) Update(_ context.Context, id string, patch map[string]interface{}) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, ok := r.data[id]; !ok {
		return fmt.Errorf("province %q not found", id)
	}
	return nil // Simplified: no-op patch
}

func (r *MemProvinceRepo) ListByRegion(_ context.Context, region RegionCode) ([]Province, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []Province
	for _, p := range r.data {
		if p.Region == region {
			out = append(out, p)
		}
	}
	return out, nil
}

// ── FederationUnit Repository (In-Memory) ──

type MemUnitRepo struct {
	mu   sync.RWMutex
	data map[string]FederationUnit
	seq  int
}

func NewMemUnitRepo() *MemUnitRepo {
	return &MemUnitRepo{data: make(map[string]FederationUnit)}
}

func (r *MemUnitRepo) List(_ context.Context) ([]FederationUnit, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]FederationUnit, 0, len(r.data))
	for _, v := range r.data {
		out = append(out, v)
	}
	return out, nil
}

func (r *MemUnitRepo) GetByID(_ context.Context, id string) (*FederationUnit, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	u, ok := r.data[id]
	if !ok {
		return nil, fmt.Errorf("unit %q not found", id)
	}
	return &u, nil
}

func (r *MemUnitRepo) Create(_ context.Context, u FederationUnit) (*FederationUnit, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if u.ID == "" {
		r.seq++
		u.ID = fmt.Sprintf("unit-%d", r.seq)
	}
	r.data[u.ID] = u
	return &u, nil
}

func (r *MemUnitRepo) Update(_ context.Context, id string, patch map[string]interface{}) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, ok := r.data[id]; !ok {
		return fmt.Errorf("unit %q not found", id)
	}
	return nil
}

func (r *MemUnitRepo) Delete(_ context.Context, id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.data, id)
	return nil
}

func (r *MemUnitRepo) ListByType(_ context.Context, uType UnitType) ([]FederationUnit, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []FederationUnit
	for _, u := range r.data {
		if u.Type == uType {
			out = append(out, u)
		}
	}
	return out, nil
}

func (r *MemUnitRepo) ListByParent(_ context.Context, parentID string) ([]FederationUnit, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []FederationUnit
	for _, u := range r.data {
		if u.ParentID == parentID {
			out = append(out, u)
		}
	}
	return out, nil
}

// ── Personnel Repository (In-Memory) ──

type MemPersonnelRepo struct {
	mu   sync.RWMutex
	data map[string]PersonnelAssignment
	seq  int
}

func NewMemPersonnelRepo() *MemPersonnelRepo {
	return &MemPersonnelRepo{data: make(map[string]PersonnelAssignment)}
}

func (r *MemPersonnelRepo) List(_ context.Context, unitID string) ([]PersonnelAssignment, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []PersonnelAssignment
	for _, a := range r.data {
		if a.UnitID == unitID {
			out = append(out, a)
		}
	}
	return out, nil
}

func (r *MemPersonnelRepo) Create(_ context.Context, a PersonnelAssignment) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if a.ID == "" {
		r.seq++
		a.ID = fmt.Sprintf("pers-%d", r.seq)
	}
	r.data[a.ID] = a
	return nil
}

func (r *MemPersonnelRepo) Update(_ context.Context, id string, patch map[string]interface{}) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, ok := r.data[id]; !ok {
		return fmt.Errorf("personnel %q not found", id)
	}
	return nil
}

func (r *MemPersonnelRepo) Deactivate(_ context.Context, id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, ok := r.data[id]; !ok {
		return fmt.Errorf("personnel %q not found", id)
	}
	return nil
}

func (r *MemPersonnelRepo) GetByUserAndUnit(_ context.Context, userID, unitID string) (*PersonnelAssignment, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, a := range r.data {
		if a.UserID == userID && a.UnitID == unitID {
			return &a, nil
		}
	}
	return nil, fmt.Errorf("not found")
}
