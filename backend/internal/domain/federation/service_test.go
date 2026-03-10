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
		idGen,
	)
}

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

func TestListProvinces(t *testing.T) {
	svc := setup()
	ctx := context.Background()

	// Get baseline count (repos now start pre-seeded)
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
}

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
