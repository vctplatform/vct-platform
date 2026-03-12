package parent

import (
	"context"
	"testing"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Parent/Guardian Service Tests
// ═══════════════════════════════════════════════════════════════

func idGen() string { return "PARENT-TEST-ID" }

var ctx = context.Background()

func newTestService() *Service {
	return NewService(
		NewInMemParentLinkStore(),
		NewInMemConsentStore(),
		NewInMemAttendanceStore(),
		NewInMemResultStore(),
		idGen,
	)
}

// ── Link Management Tests ────────────────────────────────────

func TestRequestLink(t *testing.T) {
	svc := newTestService()
	link := ParentLink{
		ParentID:    "P-001",
		ParentName:  "Test Parent",
		AthleteID:   "ATH-NEW",
		AthleteName: "Test Athlete",
		Relation:    "cha",
	}
	created, err := svc.RequestLink(ctx, link)
	if err != nil {
		t.Fatalf("RequestLink: %v", err)
	}
	if created.Status != LinkStatusPending {
		t.Errorf("expected status pending, got %s", created.Status)
	}
	if created.ID == "" {
		t.Error("expected generated ID")
	}
}

func TestRequestLinkValidation(t *testing.T) {
	svc := newTestService()
	// Missing athlete_id
	_, err := svc.RequestLink(ctx, ParentLink{ParentID: "P", AthleteName: "A", Relation: "cha"})
	if err == nil {
		t.Error("expected error for missing athlete_id")
	}
	// Missing athlete_name
	_, err = svc.RequestLink(ctx, ParentLink{ParentID: "P", AthleteID: "A", Relation: "cha"})
	if err == nil {
		t.Error("expected error for missing athlete_name")
	}
	// Invalid relation
	_, err = svc.RequestLink(ctx, ParentLink{
		ParentID: "P", AthleteID: "A", AthleteName: "A", Relation: "invalid",
	})
	if err == nil {
		t.Error("expected error for invalid relation")
	}
}

func TestApproveLink(t *testing.T) {
	svc := newTestService()
	link, _ := svc.RequestLink(ctx, ParentLink{
		ParentID: "P-APP", AthleteID: "ATH-APP", AthleteName: "App Athlete", Relation: "mẹ",
	})
	if err := svc.ApproveLink(ctx, link.ID); err != nil {
		t.Fatalf("ApproveLink: %v", err)
	}
	got, _ := svc.GetLinkByID(ctx, link.ID)
	if got.Status != LinkStatusApproved {
		t.Errorf("expected approved, got %s", got.Status)
	}
	if got.ApprovedAt == nil {
		t.Error("expected ApprovedAt to be set")
	}
}

func TestListMyChildren(t *testing.T) {
	svc := newTestService()
	// Seed data has PARENT-001 with 2 approved + 0 pending children
	children, err := svc.ListMyChildren(ctx, "PARENT-001")
	if err != nil {
		t.Fatalf("ListMyChildren: %v", err)
	}
	if len(children) != 2 {
		t.Errorf("expected 2 approved children for PARENT-001, got %d", len(children))
	}
}

func TestIsChildOfParent(t *testing.T) {
	svc := newTestService()
	// ATH-001 is approved child of PARENT-001 (from seed)
	if !svc.IsChildOfParent(ctx, "PARENT-001", "ATH-001") {
		t.Error("expected ATH-001 to be child of PARENT-001")
	}
	// ATH-003 is pending for PARENT-002, so not approved yet
	if svc.IsChildOfParent(ctx, "PARENT-002", "ATH-003") {
		t.Error("expected ATH-003 NOT to be confirmed child of PARENT-002 (pending)")
	}
}

func TestDeleteLink(t *testing.T) {
	svc := newTestService()
	link, _ := svc.RequestLink(ctx, ParentLink{
		ParentID: "P-DEL", AthleteID: "ATH-DEL", AthleteName: "Del", Relation: "cha",
	})
	if err := svc.DeleteLink(ctx, link.ID); err != nil {
		t.Fatalf("DeleteLink: %v", err)
	}
	_, err := svc.GetLinkByID(ctx, link.ID)
	if err == nil {
		t.Error("expected error after deletion")
	}
}

// ── Consent Tests ────────────────────────────────────────────

func TestCreateConsent(t *testing.T) {
	svc := newTestService()
	c := ConsentRecord{
		ParentID:  "PARENT-001",
		AthleteID: "ATH-001",
		Type:      ConsentTournament,
		Title:     "Đồng ý thi đấu Giải X",
	}
	created, err := svc.CreateConsent(ctx, c)
	if err != nil {
		t.Fatalf("CreateConsent: %v", err)
	}
	if created.Status != ConsentActive {
		t.Errorf("expected status active, got %s", created.Status)
	}
}

func TestCreateConsentValidation(t *testing.T) {
	svc := newTestService()
	// Missing athlete_id
	_, err := svc.CreateConsent(ctx, ConsentRecord{Title: "Test", Type: ConsentMedical})
	if err == nil {
		t.Error("expected error for missing athlete_id")
	}
	// Missing title
	_, err = svc.CreateConsent(ctx, ConsentRecord{AthleteID: "A", Type: ConsentMedical})
	if err == nil {
		t.Error("expected error for missing title")
	}
	// Invalid type
	_, err = svc.CreateConsent(ctx, ConsentRecord{AthleteID: "A", Title: "T", Type: "invalid"})
	if err == nil {
		t.Error("expected error for invalid consent type")
	}
}

func TestRevokeConsent(t *testing.T) {
	svc := newTestService()
	// CS-001 belongs to PARENT-001 (seed data, active)
	err := svc.RevokeConsent(ctx, "CS-001", "PARENT-001")
	if err != nil {
		t.Fatalf("RevokeConsent: %v", err)
	}
}

func TestRevokeConsentWrongParent(t *testing.T) {
	svc := newTestService()
	err := svc.RevokeConsent(ctx, "CS-001", "WRONG-PARENT")
	if err == nil {
		t.Error("expected error for wrong parent")
	}
}

func TestRevokeAlreadyRevoked(t *testing.T) {
	svc := newTestService()
	// CS-004 is already revoked (seed data)
	err := svc.RevokeConsent(ctx, "CS-004", "PARENT-001")
	if err == nil {
		t.Error("expected error for already-revoked consent")
	}
}

// ── Attendance & Results Tests ───────────────────────────────

func TestGetChildAttendance(t *testing.T) {
	svc := newTestService()
	records, err := svc.GetChildAttendance(ctx, "ATH-001")
	if err != nil {
		t.Fatalf("GetChildAttendance: %v", err)
	}
	if len(records) == 0 {
		t.Error("expected seed attendance records")
	}
}

func TestGetChildResults(t *testing.T) {
	svc := newTestService()
	results, err := svc.GetChildResults(ctx, "ATH-001")
	if err != nil {
		t.Fatalf("GetChildResults: %v", err)
	}
	if len(results) == 0 {
		t.Error("expected seed results")
	}
}

// ── Dashboard Test ───────────────────────────────────────────

func TestGetDashboard(t *testing.T) {
	svc := newTestService()
	dash, err := svc.GetDashboard(ctx, "PARENT-001")
	if err != nil {
		t.Fatalf("GetDashboard: %v", err)
	}
	if dash.ChildrenCount != 2 {
		t.Errorf("expected 2 children, got %d", dash.ChildrenCount)
	}
	if dash.ActiveConsents == 0 {
		t.Error("expected active consents from seed data")
	}
	if len(dash.RecentResults) == 0 {
		t.Error("expected recent results from seed data")
	}
}
