package federation_test

import (
	"context"
	"fmt"
	"testing"

	"vct-platform/backend/internal/adapter"
	"vct-platform/backend/internal/domain/federation"
)

var seq int

func idGen() string {
	seq++
	return fmt.Sprintf("fed-%04d", seq)
}

func setup() *federation.Service {
	return federation.NewService(
		adapter.NewMemProvinceRepo(),
		adapter.NewMemUnitRepo(),
		adapter.NewMemPersonnelRepo(),
		federation.NewMemoryMasterDataStore(),
		idGen,
	)
}

// ── Province Tests ──────────────────────────────────────────

func TestCreateProvince(t *testing.T) {
	svc := setup()
	ctx := context.Background()

	p, err := svc.CreateProvince(ctx, federation.Province{
		Code: "TEST", Name: "Tỉnh Test", Region: "north",
	})
	if err != nil {
		t.Fatalf("CreateProvince() error = %v", err)
	}
	if p.ID == "" {
		t.Error("CreateProvince() ID should not be empty")
	}
}

func TestCreateProvinceValidation(t *testing.T) {
	svc := setup()
	ctx := context.Background()

	_, err := svc.CreateProvince(ctx, federation.Province{})
	if err == nil {
		t.Error("CreateProvince() should fail with empty code and name")
	}
}

func TestListProvinces(t *testing.T) {
	svc := setup()
	ctx := context.Background()

	baseline, _ := svc.ListProvinces(ctx)
	baseCount := len(baseline)

	svc.CreateProvince(ctx, federation.Province{Code: "TST1", Name: "Tỉnh Test 1", Region: "south"})
	svc.CreateProvince(ctx, federation.Province{Code: "TST2", Name: "Tỉnh Test 2", Region: "north"})

	provinces, err := svc.ListProvinces(ctx)
	if err != nil {
		t.Fatalf("ListProvinces() error = %v", err)
	}
	if len(provinces) != baseCount+2 {
		t.Errorf("ListProvinces() got %d, want %d (baseline %d + 2 new)", len(provinces), baseCount+2, baseCount)
	}
}

func TestListProvincesByRegion(t *testing.T) {
	svc := setup()
	ctx := context.Background()

	svc.CreateProvince(ctx, federation.Province{Code: "R1", Name: "T1", Region: "north"})
	svc.CreateProvince(ctx, federation.Province{Code: "R2", Name: "T2", Region: "south"})
	svc.CreateProvince(ctx, federation.Province{Code: "R3", Name: "T3", Region: "north"})

	north, err := svc.ListProvincesByRegion(ctx, "north")
	if err != nil {
		t.Fatalf("ListProvincesByRegion() error = %v", err)
	}
	if len(north) < 2 {
		t.Errorf("ListProvincesByRegion(north) got %d, want >= 2", len(north))
	}
}

// ── Unit Tests ──────────────────────────────────────────────

func TestCreateUnit(t *testing.T) {
	svc := setup()
	ctx := context.Background()

	u, err := svc.CreateUnit(ctx, federation.FederationUnit{
		Name: "Ban Kỹ thuật", Type: "committee",
	})
	if err != nil {
		t.Fatalf("CreateUnit() error = %v", err)
	}
	if u.ID == "" {
		t.Error("CreateUnit() ID should not be empty")
	}
	if u.Status != federation.UnitStatusActive {
		t.Errorf("CreateUnit() Status = %s, want active", u.Status)
	}
}

func TestCreateUnitValidation(t *testing.T) {
	svc := setup()
	ctx := context.Background()

	_, err := svc.CreateUnit(ctx, federation.FederationUnit{})
	if err == nil {
		t.Error("CreateUnit() should fail with empty name and type")
	}
}

// ── Personnel Tests ─────────────────────────────────────────

func TestAssignPersonnel(t *testing.T) {
	svc := setup()
	ctx := context.Background()

	err := svc.AssignPersonnel(ctx, federation.PersonnelAssignment{
		UnitID: "bch", UserID: "user-001", Position: "Trưởng ban",
	})
	if err != nil {
		t.Fatalf("AssignPersonnel() error = %v", err)
	}
}

func TestAssignPersonnelValidation(t *testing.T) {
	svc := setup()
	ctx := context.Background()

	err := svc.AssignPersonnel(ctx, federation.PersonnelAssignment{})
	if err == nil {
		t.Error("AssignPersonnel() should fail with empty fields")
	}
}

func TestListPersonnel(t *testing.T) {
	svc := setup()
	ctx := context.Background()

	svc.AssignPersonnel(ctx, federation.PersonnelAssignment{
		UnitID: "bch", UserID: "user-001", Position: "Trưởng ban",
	})
	svc.AssignPersonnel(ctx, federation.PersonnelAssignment{
		UnitID: "bch", UserID: "user-002", Position: "Phó ban",
	})

	list, err := svc.ListPersonnel(ctx, "bch")
	if err != nil {
		t.Fatalf("ListPersonnel() error = %v", err)
	}
	if len(list) != 2 {
		t.Errorf("ListPersonnel() got %d, want 2", len(list))
	}
}

// ── Master Belt Tests ───────────────────────────────────────

func TestListMasterBelts(t *testing.T) {
	svc := setup()
	ctx := context.Background()

	belts, err := svc.ListMasterBelts(ctx)
	if err != nil {
		t.Fatalf("ListMasterBelts() error = %v", err)
	}
	if len(belts) == 0 {
		t.Error("ListMasterBelts() should return seeded data")
	}
}

func TestCreateAndGetMasterBelt(t *testing.T) {
	svc := setup()
	ctx := context.Background()

	err := svc.CreateMasterBelt(ctx, federation.MasterBelt{
		Level: 99, Name: "Test Belt", ColorHex: "#FF0000",
	})
	if err != nil {
		t.Fatalf("CreateMasterBelt() error = %v", err)
	}

	belt, err := svc.GetMasterBelt(ctx, "99")
	if err != nil {
		t.Fatalf("GetMasterBelt() error = %v", err)
	}
	if belt.Name != "Test Belt" {
		t.Errorf("GetMasterBelt() Name = %s, want Test Belt", belt.Name)
	}
}

func TestUpdateMasterBelt(t *testing.T) {
	svc := setup()
	ctx := context.Background()

	svc.CreateMasterBelt(ctx, federation.MasterBelt{Level: 98, Name: "Old"})
	err := svc.UpdateMasterBelt(ctx, federation.MasterBelt{Level: 98, Name: "Updated"})
	if err != nil {
		t.Fatalf("UpdateMasterBelt() error = %v", err)
	}

	belt, _ := svc.GetMasterBelt(ctx, "98")
	if belt.Name != "Updated" {
		t.Errorf("UpdateMasterBelt() Name = %s, want Updated", belt.Name)
	}
}

func TestDeleteMasterBelt(t *testing.T) {
	svc := setup()
	ctx := context.Background()

	svc.CreateMasterBelt(ctx, federation.MasterBelt{Level: 97, Name: "ToDelete"})
	err := svc.DeleteMasterBelt(ctx, "97")
	if err != nil {
		t.Fatalf("DeleteMasterBelt() error = %v", err)
	}

	_, err = svc.GetMasterBelt(ctx, "97")
	if err == nil {
		t.Error("GetMasterBelt() should fail after delete")
	}
}

// ── Master Weight Tests ─────────────────────────────────────

func TestListMasterWeights(t *testing.T) {
	svc := setup()
	ctx := context.Background()

	weights, err := svc.ListMasterWeights(ctx)
	if err != nil {
		t.Fatalf("ListMasterWeights() error = %v", err)
	}
	if len(weights) == 0 {
		t.Error("ListMasterWeights() should return seeded data")
	}
}

func TestCRUDMasterWeight(t *testing.T) {
	svc := setup()
	ctx := context.Background()

	err := svc.CreateMasterWeight(ctx, federation.MasterWeightClass{
		ID: "test-wt", Gender: "MALE", MinWeight: 50, MaxWeight: 55,
	})
	if err != nil {
		t.Fatalf("CreateMasterWeight() error = %v", err)
	}

	wc, err := svc.GetMasterWeight(ctx, "test-wt")
	if err != nil {
		t.Fatalf("GetMasterWeight() error = %v", err)
	}
	if wc.Gender != "MALE" {
		t.Errorf("GetMasterWeight() Gender = %s, want MALE", wc.Gender)
	}

	err = svc.UpdateMasterWeight(ctx, federation.MasterWeightClass{ID: "test-wt", Gender: "FEMALE", MaxWeight: 60})
	if err != nil {
		t.Fatalf("UpdateMasterWeight() error = %v", err)
	}

	err = svc.DeleteMasterWeight(ctx, "test-wt")
	if err != nil {
		t.Fatalf("DeleteMasterWeight() error = %v", err)
	}
}

// ── Master Age Group Tests ──────────────────────────────────

func TestListMasterAges(t *testing.T) {
	svc := setup()
	ctx := context.Background()

	ages, err := svc.ListMasterAges(ctx)
	if err != nil {
		t.Fatalf("ListMasterAges() error = %v", err)
	}
	if len(ages) == 0 {
		t.Error("ListMasterAges() should return seeded data")
	}
}

func TestCRUDMasterAge(t *testing.T) {
	svc := setup()
	ctx := context.Background()

	err := svc.CreateMasterAge(ctx, federation.MasterAgeGroup{
		ID: "test-age", Name: "U7", MinAge: 5, MaxAge: 7,
	})
	if err != nil {
		t.Fatalf("CreateMasterAge() error = %v", err)
	}

	ag, err := svc.GetMasterAge(ctx, "test-age")
	if err != nil {
		t.Fatalf("GetMasterAge() error = %v", err)
	}
	if ag.Name != "U7" {
		t.Errorf("GetMasterAge() Name = %s, want U7", ag.Name)
	}

	err = svc.UpdateMasterAge(ctx, federation.MasterAgeGroup{ID: "test-age", Name: "U8", MinAge: 6, MaxAge: 8})
	if err != nil {
		t.Fatalf("UpdateMasterAge() error = %v", err)
	}

	err = svc.DeleteMasterAge(ctx, "test-age")
	if err != nil {
		t.Fatalf("DeleteMasterAge() error = %v", err)
	}
}

// ── Master Content Tests ────────────────────────────────────

func TestListMasterContents(t *testing.T) {
	svc := setup()
	ctx := context.Background()

	contents, err := svc.ListMasterContents(ctx)
	if err != nil {
		t.Fatalf("ListMasterContents() error = %v", err)
	}
	if len(contents) == 0 {
		t.Error("ListMasterContents() should return seeded data")
	}
}

func TestCRUDMasterContent(t *testing.T) {
	svc := setup()
	ctx := context.Background()

	err := svc.CreateMasterContent(ctx, federation.MasterCompetitionContent{
		ID: "test-nd", Code: "test_content", Name: "Test Content",
		RequiresWeight: true, MinAthletes: 1, MaxAthletes: 1,
	})
	if err != nil {
		t.Fatalf("CreateMasterContent() error = %v", err)
	}

	c, err := svc.GetMasterContent(ctx, "test-nd")
	if err != nil {
		t.Fatalf("GetMasterContent() error = %v", err)
	}
	if c.Name != "Test Content" {
		t.Errorf("GetMasterContent() Name = %s, want Test Content", c.Name)
	}

	err = svc.UpdateMasterContent(ctx, federation.MasterCompetitionContent{
		ID: "test-nd", Code: "updated", Name: "Updated Content",
	})
	if err != nil {
		t.Fatalf("UpdateMasterContent() error = %v", err)
	}

	err = svc.DeleteMasterContent(ctx, "test-nd")
	if err != nil {
		t.Fatalf("DeleteMasterContent() error = %v", err)
	}

	_, err = svc.GetMasterContent(ctx, "test-nd")
	if err == nil {
		t.Error("GetMasterContent() should fail after delete")
	}
}

// ── Approval Workflow Tests ─────────────────────────────────

func TestListPendingApprovals(t *testing.T) {
	svc := setup()
	ctx := context.Background()

	approvals, err := svc.ListPendingApprovals(ctx)
	if err != nil {
		t.Fatalf("ListPendingApprovals() error = %v", err)
	}
	if len(approvals) == 0 {
		t.Error("ListPendingApprovals() should return seeded approval")
	}
}

func TestProcessApproval(t *testing.T) {
	svc := setup()
	ctx := context.Background()

	err := svc.ProcessApproval(ctx, "RQ-001", "APPROVE", "LGTM")
	if err != nil {
		t.Fatalf("ProcessApproval() error = %v", err)
	}

	approved, err := svc.GetAllApprovals(ctx, "APPROVED")
	if err != nil {
		t.Fatalf("GetAllApprovals() error = %v", err)
	}
	if len(approved) == 0 {
		t.Error("GetAllApprovals(APPROVED) should have 1 result")
	}
}

func TestProcessApprovalReject(t *testing.T) {
	svc := setup()
	ctx := context.Background()

	err := svc.ProcessApproval(ctx, "RQ-001", "REJECT", "Not ready")
	if err != nil {
		t.Fatalf("ProcessApproval() error = %v", err)
	}

	rejected, _ := svc.GetAllApprovals(ctx, "REJECTED")
	if len(rejected) == 0 {
		t.Error("GetAllApprovals(REJECTED) should have 1 result")
	}
}

// ── Org Chart Tests ─────────────────────────────────────────

func TestBuildOrgChart(t *testing.T) {
	svc := setup()
	ctx := context.Background()

	// Create a hierarchy
	central, _ := svc.CreateUnit(ctx, federation.FederationUnit{
		Name: "LĐ Trung ương", Type: federation.UnitTypeCentral,
	})
	svc.CreateUnit(ctx, federation.FederationUnit{
		Name: "LĐ HCM", Type: federation.UnitTypeProvince, ParentID: central.ID,
	})

	chart, err := svc.BuildOrgChart(ctx)
	if err != nil {
		t.Fatalf("BuildOrgChart() error = %v", err)
	}
	if len(chart) == 0 {
		t.Error("BuildOrgChart() should return org chart nodes")
	}
}

// ── Statistics Tests ────────────────────────────────────────

func TestGetNationalStatistics(t *testing.T) {
	svc := setup()
	ctx := context.Background()

	svc.CreateProvince(ctx, federation.Province{Code: "S1", Name: "T1", Region: "south", HasFed: true, ClubCount: 10})
	svc.CreateProvince(ctx, federation.Province{Code: "S2", Name: "T2", Region: "north", HasFed: false, ClubCount: 5})

	stats, err := svc.GetNationalStatistics(ctx)
	if err != nil {
		t.Fatalf("GetNationalStatistics() error = %v", err)
	}
	if stats.TotalProvinces < 2 {
		t.Errorf("TotalProvinces = %d, want >= 2", stats.TotalProvinces)
	}
	if stats.ActiveProvinces == 0 {
		t.Error("ActiveProvinces should be > 0")
	}
}
