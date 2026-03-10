package adapter

import (
	"context"
	"fmt"
	"strings"
	"sync"

	"vct-platform/backend/internal/domain/document"
)

// ═══════════════════════════════════════════════════════════════
// IN-MEMORY ADAPTER — DOCUMENT DOMAIN
// ═══════════════════════════════════════════════════════════════

type MemDocumentRepo struct {
	mu   sync.RWMutex
	data map[string]*document.OfficialDocument
}

func NewMemDocumentRepo() *MemDocumentRepo {
	return &MemDocumentRepo{data: SeedDocuments()}
}

func (r *MemDocumentRepo) Create(_ context.Context, doc document.OfficialDocument) (*document.OfficialDocument, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	cp := doc
	r.data[doc.ID] = &cp
	return &cp, nil
}

func (r *MemDocumentRepo) GetByID(_ context.Context, id string) (*document.OfficialDocument, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	d, ok := r.data[id]
	if !ok {
		return nil, fmt.Errorf("document %s not found", id)
	}
	cp := *d
	return &cp, nil
}

func (r *MemDocumentRepo) GetByNumber(_ context.Context, number string) (*document.OfficialDocument, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, d := range r.data {
		if d.Number == number {
			cp := *d
			return &cp, nil
		}
	}
	return nil, fmt.Errorf("document number %s not found", number)
}

func (r *MemDocumentRepo) Update(_ context.Context, id string, patch map[string]interface{}) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	d, ok := r.data[id]
	if !ok {
		return fmt.Errorf("document %s not found", id)
	}
	if v, ok := patch["status"]; ok {
		d.Status = document.DocStatus(v.(string))
	}
	if v, ok := patch["signed_by"]; ok {
		d.SignedBy = v.(string)
	}
	if v, ok := patch["signed_by_name"]; ok {
		d.SignedByName = v.(string)
	}
	if v, ok := patch["revoked_reason"]; ok {
		d.RevokedReason = v.(string)
	}
	return nil
}

func (r *MemDocumentRepo) List(_ context.Context) ([]document.OfficialDocument, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]document.OfficialDocument, 0, len(r.data))
	for _, d := range r.data {
		out = append(out, *d)
	}
	return out, nil
}

func (r *MemDocumentRepo) ListByStatus(_ context.Context, status document.DocStatus) ([]document.OfficialDocument, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []document.OfficialDocument
	for _, d := range r.data {
		if d.Status == status {
			out = append(out, *d)
		}
	}
	return out, nil
}

func (r *MemDocumentRepo) ListByType(_ context.Context, docType document.DocType) ([]document.OfficialDocument, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []document.OfficialDocument
	for _, d := range r.data {
		if d.Type == docType {
			out = append(out, *d)
		}
	}
	return out, nil
}

func (r *MemDocumentRepo) ListByEntity(_ context.Context, entityType document.EntityLinkType, entityID string) ([]document.OfficialDocument, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []document.OfficialDocument
	for _, d := range r.data {
		for _, link := range d.EntityLinks {
			if link.EntityType == entityType && link.EntityID == entityID {
				out = append(out, *d)
				break
			}
		}
	}
	return out, nil
}

func (r *MemDocumentRepo) Search(_ context.Context, input document.DocumentSearchInput) ([]document.OfficialDocument, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []document.OfficialDocument
	for _, d := range r.data {
		if input.Type != "" && d.Type != input.Type {
			continue
		}
		if input.Status != "" && d.Status != input.Status {
			continue
		}
		if input.IssuedBy != "" && d.IssuedBy != input.IssuedBy {
			continue
		}
		if input.Query != "" && !strings.Contains(strings.ToLower(d.Title), strings.ToLower(input.Query)) {
			continue
		}
		out = append(out, *d)
	}
	return out, nil
}
