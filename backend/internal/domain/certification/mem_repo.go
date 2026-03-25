package certification

import (
	"context"
	"fmt"
	"sync"
)

// ═══════════════════════════════════════════════════════════════
// IN-MEMORY CERTIFICATION REPOSITORY (for domain-level testing)
// Lives in the domain package so domain tests do not need to
// import the adapter package (Clean Architecture).
// ═══════════════════════════════════════════════════════════════

type MemCertRepo struct {
	mu   sync.RWMutex
	data map[string]Certificate
	seq  int
}

func NewMemCertRepo() *MemCertRepo {
	return &MemCertRepo{data: make(map[string]Certificate)}
}

func (r *MemCertRepo) Create(_ context.Context, c Certificate) (*Certificate, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.data[c.ID] = c
	return &c, nil
}

func (r *MemCertRepo) GetByID(_ context.Context, id string) (*Certificate, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	c, ok := r.data[id]
	if !ok {
		return nil, fmt.Errorf("cert %q not found", id)
	}
	return &c, nil
}

func (r *MemCertRepo) GetByVerifyCode(_ context.Context, code string) (*Certificate, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, c := range r.data {
		if c.VerifyCode == code {
			return &c, nil
		}
	}
	return nil, fmt.Errorf("cert code %q not found", code)
}

func (r *MemCertRepo) Update(_ context.Context, id string, patch map[string]interface{}) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	c, ok := r.data[id]
	if !ok {
		return fmt.Errorf("cert %q not found", id)
	}
	if s, ok := patch["status"]; ok {
		c.Status = CertStatus(s.(string))
	}
	r.data[id] = c
	return nil
}

func (r *MemCertRepo) List(_ context.Context) ([]Certificate, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]Certificate, 0, len(r.data))
	for _, v := range r.data {
		out = append(out, v)
	}
	return out, nil
}

func (r *MemCertRepo) ListByHolder(_ context.Context, holderType, holderID string) ([]Certificate, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []Certificate
	for _, c := range r.data {
		if c.HolderType == holderType && c.HolderID == holderID {
			out = append(out, c)
		}
	}
	return out, nil
}

func (r *MemCertRepo) ListByType(_ context.Context, certType CertType) ([]Certificate, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []Certificate
	for _, c := range r.data {
		if c.Type == certType {
			out = append(out, c)
		}
	}
	return out, nil
}

func (r *MemCertRepo) ListByStatus(_ context.Context, status CertStatus) ([]Certificate, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []Certificate
	for _, c := range r.data {
		if c.Status == status {
			out = append(out, c)
		}
	}
	return out, nil
}

func (r *MemCertRepo) ListExpiring(_ context.Context, daysThreshold int) ([]Certificate, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []Certificate
	for _, c := range r.data {
		if c.Status == CertStatusExpiring {
			out = append(out, c)
		}
	}
	return out, nil
}
