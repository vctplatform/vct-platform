package adapter

import (
	"context"
	"fmt"
	"sync"

	"vct-platform/backend/internal/domain/certification"
)

// ════════════════════════════════════════════════════════════════
// IN-MEMORY CERTIFICATION REPOSITORY
// ════════════════════════════════════════════════════════════════

type MemCertRepo struct {
	mu   sync.RWMutex
	data map[string]certification.Certificate
	seq  int
}

func NewMemCertRepo() *MemCertRepo {
	return &MemCertRepo{data: SeedCertifications()}
}

func (r *MemCertRepo) Create(_ context.Context, c certification.Certificate) (*certification.Certificate, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.data[c.ID] = c
	return &c, nil
}

func (r *MemCertRepo) GetByID(_ context.Context, id string) (*certification.Certificate, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	c, ok := r.data[id]
	if !ok {
		return nil, fmt.Errorf("cert %q not found", id)
	}
	return &c, nil
}

func (r *MemCertRepo) GetByVerifyCode(_ context.Context, code string) (*certification.Certificate, error) {
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
		c.Status = certification.CertStatus(s.(string))
	}
	r.data[id] = c
	return nil
}

func (r *MemCertRepo) List(_ context.Context) ([]certification.Certificate, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]certification.Certificate, 0, len(r.data))
	for _, v := range r.data {
		out = append(out, v)
	}
	return out, nil
}

func (r *MemCertRepo) ListByHolder(_ context.Context, holderType, holderID string) ([]certification.Certificate, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []certification.Certificate
	for _, c := range r.data {
		if c.HolderType == holderType && c.HolderID == holderID {
			out = append(out, c)
		}
	}
	return out, nil
}

func (r *MemCertRepo) ListByType(_ context.Context, certType certification.CertType) ([]certification.Certificate, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []certification.Certificate
	for _, c := range r.data {
		if c.Type == certType {
			out = append(out, c)
		}
	}
	return out, nil
}

func (r *MemCertRepo) ListByStatus(_ context.Context, status certification.CertStatus) ([]certification.Certificate, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []certification.Certificate
	for _, c := range r.data {
		if c.Status == status {
			out = append(out, c)
		}
	}
	return out, nil
}

func (r *MemCertRepo) ListExpiring(_ context.Context, daysThreshold int) ([]certification.Certificate, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []certification.Certificate
	for _, c := range r.data {
		if c.Status == certification.CertStatusExpiring {
			out = append(out, c)
		}
	}
	return out, nil
}
