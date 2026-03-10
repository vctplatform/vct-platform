package adapter

import (
	"context"
	"fmt"
	"strings"
	"sync"

	"vct-platform/backend/internal/domain/discipline"
)

// ═══════════════════════════════════════════════════════════════
// IN-MEMORY ADAPTERS — DISCIPLINE DOMAIN
// ═══════════════════════════════════════════════════════════════

// ── MemCaseRepo ──────────────────────────────────────────────

type MemCaseRepo struct {
	mu   sync.RWMutex
	data map[string]*discipline.DisciplineCase
}

func NewMemCaseRepo() *MemCaseRepo {
	return &MemCaseRepo{data: SeedDisciplineCases()}
}

func (r *MemCaseRepo) Create(_ context.Context, c discipline.DisciplineCase) (*discipline.DisciplineCase, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	cp := c
	r.data[c.ID] = &cp
	return &cp, nil
}

func (r *MemCaseRepo) GetByID(_ context.Context, id string) (*discipline.DisciplineCase, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	c, ok := r.data[id]
	if !ok {
		return nil, fmt.Errorf("discipline case %s not found", id)
	}
	cp := *c
	return &cp, nil
}

func (r *MemCaseRepo) Update(_ context.Context, id string, patch map[string]interface{}) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	c, ok := r.data[id]
	if !ok {
		return fmt.Errorf("discipline case %s not found", id)
	}
	if v, ok := patch["status"]; ok {
		c.Status = discipline.CaseStatus(v.(string))
	}
	if v, ok := patch["investigator_id"]; ok {
		c.InvestigatorID = v.(string)
	}
	return nil
}

func (r *MemCaseRepo) List(_ context.Context) ([]discipline.DisciplineCase, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]discipline.DisciplineCase, 0, len(r.data))
	for _, c := range r.data {
		out = append(out, *c)
	}
	return out, nil
}

func (r *MemCaseRepo) ListByStatus(_ context.Context, status discipline.CaseStatus) ([]discipline.DisciplineCase, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []discipline.DisciplineCase
	for _, c := range r.data {
		if c.Status == status {
			out = append(out, *c)
		}
	}
	return out, nil
}

func (r *MemCaseRepo) ListBySubject(_ context.Context, subjectType, subjectID string) ([]discipline.DisciplineCase, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []discipline.DisciplineCase
	for _, c := range r.data {
		if strings.EqualFold(c.SubjectType, subjectType) && c.SubjectID == subjectID {
			out = append(out, *c)
		}
	}
	return out, nil
}

// ── MemHearingRepo ───────────────────────────────────────────

type MemHearingRepo struct {
	mu   sync.RWMutex
	data map[string]*discipline.Hearing
}

func NewMemHearingRepo() *MemHearingRepo {
	return &MemHearingRepo{data: make(map[string]*discipline.Hearing)}
}

func (r *MemHearingRepo) Create(_ context.Context, h discipline.Hearing) (*discipline.Hearing, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	cp := h
	r.data[h.ID] = &cp
	return &cp, nil
}

func (r *MemHearingRepo) GetByID(_ context.Context, id string) (*discipline.Hearing, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	h, ok := r.data[id]
	if !ok {
		return nil, fmt.Errorf("hearing %s not found", id)
	}
	cp := *h
	return &cp, nil
}

func (r *MemHearingRepo) Update(_ context.Context, id string, patch map[string]interface{}) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	h, ok := r.data[id]
	if !ok {
		return fmt.Errorf("hearing %s not found", id)
	}
	if v, ok := patch["status"]; ok {
		h.Status = v.(string)
	}
	if v, ok := patch["decision"]; ok {
		h.Decision = v.(string)
	}
	if v, ok := patch["minutes"]; ok {
		h.Minutes = v.(string)
	}
	return nil
}

func (r *MemHearingRepo) ListByCase(_ context.Context, caseID string) ([]discipline.Hearing, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []discipline.Hearing
	for _, h := range r.data {
		if h.CaseID == caseID {
			out = append(out, *h)
		}
	}
	return out, nil
}
