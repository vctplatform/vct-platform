package discipline

import (
	"context"
	"testing"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// DISCIPLINE DOMAIN — UNIT TESTS
// Tests for violation reporting, investigation, hearing,
// and case lifecycle management.
// ═══════════════════════════════════════════════════════════════

// ── Test Doubles ─────────────────────────────────────────────

var testSeq int

func testID() string {
	testSeq++
	return "test-" + string(rune('a'+testSeq))
}

type memCaseRepo struct{ data map[string]*DisciplineCase }
type memHearingRepo struct{ data map[string]*Hearing }

func (r *memCaseRepo) Create(_ context.Context, c DisciplineCase) (*DisciplineCase, error) {
	cp := c
	r.data[c.ID] = &cp
	return &cp, nil
}
func (r *memCaseRepo) GetByID(_ context.Context, id string) (*DisciplineCase, error) {
	c, ok := r.data[id]
	if !ok {
		return nil, errNF
	}
	cp := *c
	return &cp, nil
}
func (r *memCaseRepo) Update(_ context.Context, id string, patch map[string]interface{}) error {
	c, ok := r.data[id]
	if !ok {
		return errNF
	}
	if v, ok := patch["status"]; ok {
		c.Status = CaseStatus(v.(string))
	}
	if v, ok := patch["investigator_id"]; ok {
		c.InvestigatorID = v.(string)
	}
	return nil
}
func (r *memCaseRepo) List(_ context.Context) ([]DisciplineCase, error) {
	out := make([]DisciplineCase, 0)
	for _, c := range r.data {
		out = append(out, *c)
	}
	return out, nil
}
func (r *memCaseRepo) ListByStatus(_ context.Context, s CaseStatus) ([]DisciplineCase, error) {
	var out []DisciplineCase
	for _, c := range r.data {
		if c.Status == s {
			out = append(out, *c)
		}
	}
	return out, nil
}
func (r *memCaseRepo) ListBySubject(_ context.Context, st, sid string) ([]DisciplineCase, error) {
	var out []DisciplineCase
	for _, c := range r.data {
		if c.SubjectType == st && c.SubjectID == sid {
			out = append(out, *c)
		}
	}
	return out, nil
}

func (r *memHearingRepo) Create(_ context.Context, h Hearing) (*Hearing, error) {
	cp := h
	r.data[h.ID] = &cp
	return &cp, nil
}
func (r *memHearingRepo) GetByID(_ context.Context, id string) (*Hearing, error) {
	h, ok := r.data[id]
	if !ok {
		return nil, errNF
	}
	cp := *h
	return &cp, nil
}
func (r *memHearingRepo) Update(_ context.Context, id string, patch map[string]interface{}) error {
	h, ok := r.data[id]
	if !ok {
		return errNF
	}
	if v, ok := patch["status"]; ok {
		h.Status = v.(string)
	}
	return nil
}
func (r *memHearingRepo) ListByCase(_ context.Context, cid string) ([]Hearing, error) {
	var out []Hearing
	for _, h := range r.data {
		if h.CaseID == cid {
			out = append(out, *h)
		}
	}
	return out, nil
}

type nfErr struct{}

func (e *nfErr) Error() string { return "not found" }

var errNF = &nfErr{}

func newSvc() *Service {
	return NewService(
		&memCaseRepo{data: make(map[string]*DisciplineCase)},
		&memHearingRepo{data: make(map[string]*Hearing)},
		testID,
	)
}

// ── Tests ────────────────────────────────────────────────────

func TestReportViolation(t *testing.T) {
	svc := newSvc()
	c, err := svc.ReportViolation(context.Background(), DisciplineCase{
		Title:         "Doping test positive",
		SubjectType:   "athlete",
		SubjectID:     "ATH-001",
		SubjectName:   "Nguyễn Văn A",
		ViolationType: ViolDoping,
		ReportedBy:    "REF-01",
	})
	if err != nil {
		t.Fatalf("ReportViolation: %v", err)
	}
	if c.Status != CaseStatusReported {
		t.Errorf("expected reported, got %s", c.Status)
	}
	if c.CaseNumber == "" {
		t.Error("expected case number to be generated")
	}
	if len(c.Timeline) != 1 {
		t.Errorf("expected 1 timeline event, got %d", len(c.Timeline))
	}
}

func TestReportViolation_Validation(t *testing.T) {
	svc := newSvc()
	_, err := svc.ReportViolation(context.Background(), DisciplineCase{})
	if err == nil {
		t.Error("expected validation error")
	}
}

func TestAssignInvestigator(t *testing.T) {
	svc := newSvc()
	c, _ := svc.ReportViolation(context.Background(), DisciplineCase{
		Title: "Test", SubjectID: "S1", SubjectType: "athlete", ViolationType: ViolViolence,
	})
	err := svc.AssignInvestigator(context.Background(), c.ID, "INV-01")
	if err != nil {
		t.Fatalf("AssignInvestigator: %v", err)
	}
	updated, _ := svc.GetCase(context.Background(), c.ID)
	if updated.Status != CaseStatusInvestigating {
		t.Errorf("expected investigating, got %s", updated.Status)
	}
}

func TestScheduleHearing(t *testing.T) {
	svc := newSvc()
	c, _ := svc.ReportViolation(context.Background(), DisciplineCase{
		Title: "Test", SubjectID: "S1", SubjectType: "athlete", ViolationType: ViolOther,
	})
	_ = svc.AssignInvestigator(context.Background(), c.ID, "INV-01")

	h, err := svc.ScheduleHearing(context.Background(), Hearing{
		CaseID:       c.ID,
		ScheduleAt:   time.Now().Add(48 * time.Hour),
		Location:     "HCM Office",
		BoardMembers: []string{"BM-1", "BM-2", "BM-3"},
	})
	if err != nil {
		t.Fatalf("ScheduleHearing: %v", err)
	}
	if h.Status != "scheduled" {
		t.Errorf("expected scheduled, got %s", h.Status)
	}
}

func TestDismissCase(t *testing.T) {
	svc := newSvc()
	c, _ := svc.ReportViolation(context.Background(), DisciplineCase{
		Title: "Dismiss test", SubjectID: "S1", SubjectType: "club", ViolationType: ViolAdminBreach,
	})
	err := svc.DismissCase(context.Background(), c.ID, "Insufficient evidence")
	if err != nil {
		t.Fatalf("DismissCase: %v", err)
	}
	updated, _ := svc.GetCase(context.Background(), c.ID)
	if updated.Status != CaseStatusDismissed {
		t.Errorf("expected dismissed, got %s", updated.Status)
	}
}

func TestListByStatus(t *testing.T) {
	svc := newSvc()
	svc.ReportViolation(context.Background(), DisciplineCase{
		Title: "C1", SubjectID: "S1", SubjectType: "athlete", ViolationType: ViolDoping,
	})
	svc.ReportViolation(context.Background(), DisciplineCase{
		Title: "C2", SubjectID: "S2", SubjectType: "athlete", ViolationType: ViolViolence,
	})
	list, err := svc.ListByStatus(context.Background(), CaseStatusReported)
	if err != nil {
		t.Fatal(err)
	}
	if len(list) != 2 {
		t.Errorf("expected 2, got %d", len(list))
	}
}
