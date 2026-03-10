package adapter

import (
	"context"
	"fmt"
	"sync"
	"time"

	intl "vct-platform/backend/internal/domain/international"
)

// ════════════════════════════════════════════════════════════════
// IN-MEMORY INTERNATIONAL REPOSITORIES
// ════════════════════════════════════════════════════════════════

// ── Partner Repository ───────────────────────────────────────

type MemPartnerRepo struct {
	mu   sync.RWMutex
	data map[string]intl.PartnerOrganization
	seq  int
}

func NewMemPartnerRepo() *MemPartnerRepo {
	return &MemPartnerRepo{data: SeedPartners()}
}

func (r *MemPartnerRepo) Create(_ context.Context, p intl.PartnerOrganization) (*intl.PartnerOrganization, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.seq++
	if p.ID == "" {
		p.ID = fmt.Sprintf("partner-%d", r.seq)
	}
	r.data[p.ID] = p
	return &p, nil
}

func (r *MemPartnerRepo) GetByID(_ context.Context, id string) (*intl.PartnerOrganization, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	p, ok := r.data[id]
	if !ok {
		return nil, fmt.Errorf("partner %q not found", id)
	}
	return &p, nil
}

func (r *MemPartnerRepo) List(_ context.Context) ([]intl.PartnerOrganization, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]intl.PartnerOrganization, 0, len(r.data))
	for _, p := range r.data {
		out = append(out, p)
	}
	return out, nil
}

func (r *MemPartnerRepo) ListByCountry(_ context.Context, country string) ([]intl.PartnerOrganization, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []intl.PartnerOrganization
	for _, p := range r.data {
		if p.Country == country {
			out = append(out, p)
		}
	}
	return out, nil
}

func (r *MemPartnerRepo) Update(_ context.Context, id string, p intl.PartnerOrganization) (*intl.PartnerOrganization, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, ok := r.data[id]; !ok {
		return nil, fmt.Errorf("partner %q not found", id)
	}
	p.ID = id
	r.data[id] = p
	return &p, nil
}

// ── Event Repository ─────────────────────────────────────────

type MemIntlEventRepo struct {
	mu   sync.RWMutex
	data map[string]intl.InternationalEvent
	seq  int
}

func NewMemIntlEventRepo() *MemIntlEventRepo {
	return &MemIntlEventRepo{data: SeedInternationalEvents()}
}

func (r *MemIntlEventRepo) Create(_ context.Context, e intl.InternationalEvent) (*intl.InternationalEvent, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.seq++
	if e.ID == "" {
		e.ID = fmt.Sprintf("intl-event-%d", r.seq)
	}
	r.data[e.ID] = e
	return &e, nil
}

func (r *MemIntlEventRepo) GetByID(_ context.Context, id string) (*intl.InternationalEvent, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	e, ok := r.data[id]
	if !ok {
		return nil, fmt.Errorf("event %q not found", id)
	}
	return &e, nil
}

func (r *MemIntlEventRepo) List(_ context.Context) ([]intl.InternationalEvent, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]intl.InternationalEvent, 0, len(r.data))
	for _, e := range r.data {
		out = append(out, e)
	}
	return out, nil
}

func (r *MemIntlEventRepo) ListUpcoming(_ context.Context) ([]intl.InternationalEvent, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	now := time.Now()
	var out []intl.InternationalEvent
	for _, e := range r.data {
		if e.StartDate.After(now) {
			out = append(out, e)
		}
	}
	return out, nil
}

// ── Delegation Repository ────────────────────────────────────

type MemDelegationRepo struct {
	mu   sync.RWMutex
	data map[string]intl.Delegation
	seq  int
}

func NewMemDelegationRepo() *MemDelegationRepo {
	return &MemDelegationRepo{data: SeedDelegations()}
}

func (r *MemDelegationRepo) Create(_ context.Context, d intl.Delegation) (*intl.Delegation, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.seq++
	if d.ID == "" {
		d.ID = fmt.Sprintf("deleg-%d", r.seq)
	}
	r.data[d.ID] = d
	return &d, nil
}

func (r *MemDelegationRepo) GetByID(_ context.Context, id string) (*intl.Delegation, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	d, ok := r.data[id]
	if !ok {
		return nil, fmt.Errorf("delegation %q not found", id)
	}
	return &d, nil
}

func (r *MemDelegationRepo) ListByEvent(_ context.Context, eventID string) ([]intl.Delegation, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []intl.Delegation
	for _, d := range r.data {
		if d.EventID == eventID {
			out = append(out, d)
		}
	}
	return out, nil
}

func (r *MemDelegationRepo) Update(_ context.Context, id string, d intl.Delegation) (*intl.Delegation, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, ok := r.data[id]; !ok {
		return nil, fmt.Errorf("delegation %q not found", id)
	}
	d.ID = id
	r.data[id] = d
	return &d, nil
}
