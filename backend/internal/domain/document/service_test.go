package document

import (
	"context"
	"testing"
)

// ═══════════════════════════════════════════════════════════════
// DOCUMENT DOMAIN — UNIT TESTS
// Tests for document lifecycle: draft → pending → approved →
// published → revoked, and search/filter operations.
// ═══════════════════════════════════════════════════════════════

// ── Test Doubles ─────────────────────────────────────────────

var docSeq int

func docID() string {
	docSeq++
	return "doc-" + string(rune('a'+docSeq))
}

type memRepo struct{ data map[string]*OfficialDocument }

func (r *memRepo) Create(_ context.Context, d OfficialDocument) (*OfficialDocument, error) {
	cp := d
	r.data[d.ID] = &cp
	return &cp, nil
}
func (r *memRepo) GetByID(_ context.Context, id string) (*OfficialDocument, error) {
	d, ok := r.data[id]
	if !ok {
		return nil, errDocNF
	}
	cp := *d
	return &cp, nil
}
func (r *memRepo) GetByNumber(_ context.Context, n string) (*OfficialDocument, error) {
	for _, d := range r.data {
		if d.Number == n {
			cp := *d
			return &cp, nil
		}
	}
	return nil, errDocNF
}
func (r *memRepo) Update(_ context.Context, id string, patch map[string]interface{}) error {
	d, ok := r.data[id]
	if !ok {
		return errDocNF
	}
	if v, ok := patch["status"]; ok {
		d.Status = DocStatus(v.(string))
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
func (r *memRepo) List(_ context.Context) ([]OfficialDocument, error) {
	out := make([]OfficialDocument, 0)
	for _, d := range r.data {
		out = append(out, *d)
	}
	return out, nil
}
func (r *memRepo) ListByStatus(_ context.Context, s DocStatus) ([]OfficialDocument, error) {
	var out []OfficialDocument
	for _, d := range r.data {
		if d.Status == s {
			out = append(out, *d)
		}
	}
	return out, nil
}
func (r *memRepo) ListByType(_ context.Context, t DocType) ([]OfficialDocument, error) {
	var out []OfficialDocument
	for _, d := range r.data {
		if d.Type == t {
			out = append(out, *d)
		}
	}
	return out, nil
}
func (r *memRepo) ListByEntity(_ context.Context, _ EntityLinkType, _ string) ([]OfficialDocument, error) {
	return nil, nil
}
func (r *memRepo) Search(_ context.Context, _ DocumentSearchInput) ([]OfficialDocument, error) {
	return nil, nil
}

type docNFErr struct{}

func (e *docNFErr) Error() string { return "not found" }

var errDocNF = &docNFErr{}

func newDocSvc() *Service {
	return NewService(&memRepo{data: make(map[string]*OfficialDocument)}, docID)
}

// ── Tests ────────────────────────────────────────────────────

func TestCreateDraft(t *testing.T) {
	svc := newDocSvc()
	doc, err := svc.CreateDraft(context.Background(), OfficialDocument{
		Number: "QĐ-001/2026", Title: "Quyết định thành lập CLB", Type: DocTypeDecision,
	})
	if err != nil {
		t.Fatalf("CreateDraft: %v", err)
	}
	if doc.Status != DocStatusDraft {
		t.Errorf("expected draft, got %s", doc.Status)
	}
	if doc.Version != 1 {
		t.Errorf("expected version 1, got %d", doc.Version)
	}
}

func TestCreateDraft_Validation(t *testing.T) {
	svc := newDocSvc()
	_, err := svc.CreateDraft(context.Background(), OfficialDocument{})
	if err == nil {
		t.Error("expected validation error")
	}
}

func TestDocumentLifecycle(t *testing.T) {
	svc := newDocSvc()
	ctx := context.Background()

	// 1. Create draft
	doc, _ := svc.CreateDraft(ctx, OfficialDocument{
		Number: "QĐ-002/2026", Title: "Test lifecycle", Type: DocTypeCircular,
	})

	// 2. Submit for approval
	if err := svc.SubmitForApproval(ctx, doc.ID); err != nil {
		t.Fatalf("SubmitForApproval: %v", err)
	}
	d1, _ := svc.GetDocument(ctx, doc.ID)
	if d1.Status != DocStatusPending {
		t.Errorf("expected pending, got %s", d1.Status)
	}

	// 3. Approve
	if err := svc.Approve(ctx, doc.ID, "admin-1", "Chủ tịch LĐ"); err != nil {
		t.Fatalf("Approve: %v", err)
	}
	d2, _ := svc.GetDocument(ctx, doc.ID)
	if d2.Status != DocStatusApproved {
		t.Errorf("expected approved, got %s", d2.Status)
	}

	// 4. Publish
	if err := svc.Publish(ctx, doc.ID); err != nil {
		t.Fatalf("Publish: %v", err)
	}
	d3, _ := svc.GetDocument(ctx, doc.ID)
	if d3.Status != DocStatusPublished {
		t.Errorf("expected published, got %s", d3.Status)
	}
}

func TestRevoke(t *testing.T) {
	svc := newDocSvc()
	ctx := context.Background()

	doc, _ := svc.CreateDraft(ctx, OfficialDocument{
		Number: "QĐ-003", Title: "To revoke", Type: DocTypeDecision,
	})
	_ = svc.SubmitForApproval(ctx, doc.ID)
	_ = svc.Approve(ctx, doc.ID, "a", "Admin")
	_ = svc.Publish(ctx, doc.ID)

	if err := svc.Revoke(ctx, doc.ID, "Đã hết hiệu lực"); err != nil {
		t.Fatalf("Revoke: %v", err)
	}
	d, _ := svc.GetDocument(ctx, doc.ID)
	if d.Status != DocStatusRevoked {
		t.Errorf("expected revoked, got %s", d.Status)
	}
}

func TestRevoke_RequiresReason(t *testing.T) {
	svc := newDocSvc()
	ctx := context.Background()

	doc, _ := svc.CreateDraft(ctx, OfficialDocument{
		Number: "QĐ-004", Title: "No reason", Type: DocTypeDecision,
	})
	_ = svc.SubmitForApproval(ctx, doc.ID)
	_ = svc.Approve(ctx, doc.ID, "a", "Admin")
	_ = svc.Publish(ctx, doc.ID)

	err := svc.Revoke(ctx, doc.ID, "")
	if err == nil {
		t.Error("expected error for empty reason")
	}
}

func TestCannotSubmitNonDraft(t *testing.T) {
	svc := newDocSvc()
	ctx := context.Background()

	doc, _ := svc.CreateDraft(ctx, OfficialDocument{
		Number: "QĐ-005", Title: "Already submitted", Type: DocTypeNotice,
	})
	_ = svc.SubmitForApproval(ctx, doc.ID)

	err := svc.SubmitForApproval(ctx, doc.ID)
	if err == nil {
		t.Error("expected error for non-draft document")
	}
}
