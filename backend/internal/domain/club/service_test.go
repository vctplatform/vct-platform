package club

import (
	"context"
	"testing"
)

func testIDGen() string { return "test-id-001" }

var testCtx = context.Background()

// ═══════════════════════════════════════════════════════════════
// ATTENDANCE TESTS
// ═══════════════════════════════════════════════════════════════

func TestRecordAttendance(t *testing.T) {
	svc := NewService(
		NewInMemAttendanceStore(),
		NewInMemEquipmentStore(),
		NewInMemFacilityStore(),
		testIDGen,
	)

	a := Attendance{
		ClubID:     "CLB-001",
		ClassID:    "CLS-001",
		ClassName:  "Lớp Thiếu Nhi",
		MemberID:   "MBR-001",
		MemberName: "Nguyễn Văn Minh",
		Date:       "2026-03-12",
		Status:     AttendancePresent,
		RecordedBy: "HLV Huy",
	}

	created, err := svc.RecordAttendance(testCtx, a)
	if err != nil {
		t.Fatalf("RecordAttendance: unexpected error: %v", err)
	}
	if created.ID == "" {
		t.Error("expected generated ID, got empty")
	}
	if created.CreatedAt.IsZero() {
		t.Error("expected CreatedAt to be set")
	}
}

func TestAttendanceSummary(t *testing.T) {
	svc := NewService(
		NewInMemAttendanceStore(),
		NewInMemEquipmentStore(),
		NewInMemFacilityStore(),
		testIDGen,
	)

	summary, err := svc.GetAttendanceSummary(testCtx, "CLB-001")
	if err != nil {
		t.Fatalf("GetAttendanceSummary: unexpected error: %v", err)
	}
	if summary.TotalRecords == 0 {
		t.Error("expected seed data, got 0 records")
	}
	if summary.Rate < 0 || summary.Rate > 100 {
		t.Errorf("attendance rate out of range: %f", summary.Rate)
	}
}

func TestListAttendanceByDate(t *testing.T) {
	svc := NewService(
		NewInMemAttendanceStore(),
		NewInMemEquipmentStore(),
		NewInMemFacilityStore(),
		testIDGen,
	)

	records, err := svc.ListAttendanceByDate(testCtx, "CLB-001", "2026-03-10")
	if err != nil {
		t.Fatalf("ListAttendanceByDate: unexpected error: %v", err)
	}
	for _, r := range records {
		if r.Date != "2026-03-10" {
			t.Errorf("expected date 2026-03-10, got %s", r.Date)
		}
	}
}

// ═══════════════════════════════════════════════════════════════
// EQUIPMENT TESTS
// ═══════════════════════════════════════════════════════════════

func TestCreateEquipment(t *testing.T) {
	svc := NewService(
		NewInMemAttendanceStore(),
		NewInMemEquipmentStore(),
		NewInMemFacilityStore(),
		testIDGen,
	)

	e := Equipment{
		ClubID:       "CLB-001",
		Name:         "Giáp đầu mới",
		Category:     EquipCatProtective,
		Quantity:     10,
		Condition:    ConditionNew,
		PurchaseDate: "2026-03-01",
		UnitValue:    350000,
		Supplier:     "VN Sport",
	}

	created, err := svc.CreateEquipment(testCtx, e)
	if err != nil {
		t.Fatalf("CreateEquipment: %v", err)
	}
	if created.TotalValue != 3500000 {
		t.Errorf("expected total 3500000, got %f", created.TotalValue)
	}
}

func TestEquipmentSummary(t *testing.T) {
	svc := NewService(
		NewInMemAttendanceStore(),
		NewInMemEquipmentStore(),
		NewInMemFacilityStore(),
		testIDGen,
	)

	summary, err := svc.GetEquipmentSummary(testCtx, "CLB-001")
	if err != nil {
		t.Fatalf("GetEquipmentSummary: %v", err)
	}
	if summary.TotalItems == 0 {
		t.Error("expected seed items, got 0")
	}
	if summary.TotalValue <= 0 {
		t.Error("expected positive total value")
	}
}

func TestEquipmentCRUD(t *testing.T) {
	svc := NewService(
		NewInMemAttendanceStore(),
		NewInMemEquipmentStore(),
		NewInMemFacilityStore(),
		testIDGen,
	)

	// List seed data
	items, _ := svc.ListEquipment(testCtx, "CLB-001")
	if len(items) == 0 {
		t.Fatal("expected seed equipment")
	}

	// Get by ID
	first := items[0]
	got, err := svc.GetEquipment(testCtx, first.ID)
	if err != nil {
		t.Fatalf("GetEquipment: %v", err)
	}
	if got.Name != first.Name {
		t.Errorf("expected %s, got %s", first.Name, got.Name)
	}

	// Update
	err = svc.UpdateEquipment(testCtx, first.ID, map[string]interface{}{"quantity": float64(20)})
	if err != nil {
		t.Fatalf("UpdateEquipment: %v", err)
	}

	// Delete
	err = svc.DeleteEquipment(testCtx, first.ID)
	if err != nil {
		t.Fatalf("DeleteEquipment: %v", err)
	}
}

// ═══════════════════════════════════════════════════════════════
// FACILITY TESTS
// ═══════════════════════════════════════════════════════════════

func TestCreateFacility(t *testing.T) {
	svc := NewService(
		NewInMemAttendanceStore(),
		NewInMemEquipmentStore(),
		NewInMemFacilityStore(),
		testIDGen,
	)

	f := Facility{
		ClubID:      "CLB-001",
		Name:        "Phòng tập mới",
		Type:        FacilityTrainingHall,
		AreaSqm:     120,
		Capacity:    40,
		Status:      FacilityStatusActive,
		MonthlyRent: 8000000,
	}

	created, err := svc.CreateFacility(testCtx, f)
	if err != nil {
		t.Fatalf("CreateFacility: %v", err)
	}
	if created.ID == "" {
		t.Error("expected generated ID")
	}
}

func TestFacilitySummary(t *testing.T) {
	svc := NewService(
		NewInMemAttendanceStore(),
		NewInMemEquipmentStore(),
		NewInMemFacilityStore(),
		testIDGen,
	)

	summary, err := svc.GetFacilitySummary(testCtx, "CLB-001")
	if err != nil {
		t.Fatalf("GetFacilitySummary: %v", err)
	}
	if summary.TotalFacilities == 0 {
		t.Error("expected seed facilities")
	}
	if summary.TotalAreaSqm <= 0 {
		t.Error("expected positive area")
	}
	if summary.ActiveCount == 0 {
		t.Error("expected active facilities")
	}
}

func TestFacilityCRUD(t *testing.T) {
	svc := NewService(
		NewInMemAttendanceStore(),
		NewInMemEquipmentStore(),
		NewInMemFacilityStore(),
		testIDGen,
	)

	items, _ := svc.ListFacilities(testCtx, "CLB-001")
	if len(items) == 0 {
		t.Fatal("expected seed facilities")
	}

	first := items[0]
	got, err := svc.GetFacility(testCtx, first.ID)
	if err != nil {
		t.Fatalf("GetFacility: %v", err)
	}
	if got.Name != first.Name {
		t.Errorf("expected %s, got %s", first.Name, got.Name)
	}

	err = svc.UpdateFacility(testCtx, first.ID, map[string]interface{}{"status": string(FacilityStatusMaintenance)})
	if err != nil {
		t.Fatalf("UpdateFacility: %v", err)
	}

	err = svc.DeleteFacility(testCtx, first.ID)
	if err != nil {
		t.Fatalf("DeleteFacility: %v", err)
	}
}

// ═══════════════════════════════════════════════════════════════
// EDGE CASE TESTS
// ═══════════════════════════════════════════════════════════════

func TestGetEquipmentNotFound(t *testing.T) {
	svc := NewService(
		NewInMemAttendanceStore(),
		NewInMemEquipmentStore(),
		NewInMemFacilityStore(),
		testIDGen,
	)
	_, err := svc.GetEquipment(testCtx, "non-existent-id")
	if err == nil {
		t.Error("expected error for non-existent equipment")
	}
}

func TestGetFacilityNotFound(t *testing.T) {
	svc := NewService(
		NewInMemAttendanceStore(),
		NewInMemEquipmentStore(),
		NewInMemFacilityStore(),
		testIDGen,
	)
	_, err := svc.GetFacility(testCtx, "non-existent-id")
	if err == nil {
		t.Error("expected error for non-existent facility")
	}
}

func TestDeleteAttendanceAndVerifyList(t *testing.T) {
	svc := NewService(
		NewInMemAttendanceStore(),
		NewInMemEquipmentStore(),
		NewInMemFacilityStore(),
		testIDGen,
	)

	before, _ := svc.ListAttendance(testCtx, "CLB-001")
	countBefore := len(before)
	if countBefore == 0 {
		t.Fatal("expected seed attendance records")
	}

	err := svc.DeleteAttendance(testCtx, before[0].ID)
	if err != nil {
		t.Fatalf("DeleteAttendance: %v", err)
	}

	after, _ := svc.ListAttendance(testCtx, "CLB-001")
	if len(after) != countBefore-1 {
		t.Errorf("expected %d records after delete, got %d", countBefore-1, len(after))
	}
}

func TestListEquipmentEmptyClub(t *testing.T) {
	svc := NewService(
		NewInMemAttendanceStore(),
		NewInMemEquipmentStore(),
		NewInMemFacilityStore(),
		testIDGen,
	)
	items, err := svc.ListEquipment(testCtx, "CLB-999-DOES-NOT-EXIST")
	if err != nil {
		t.Fatalf("ListEquipment: unexpected error: %v", err)
	}
	if len(items) != 0 {
		t.Errorf("expected 0 items for non-existent club, got %d", len(items))
	}
}

func TestFacilitySummaryEmptyClub(t *testing.T) {
	svc := NewService(
		NewInMemAttendanceStore(),
		NewInMemEquipmentStore(),
		NewInMemFacilityStore(),
		testIDGen,
	)
	summary, err := svc.GetFacilitySummary(testCtx, "EMPTY-CLUB")
	if err != nil {
		t.Fatalf("GetFacilitySummary: %v", err)
	}
	if summary.TotalFacilities != 0 {
		t.Errorf("expected 0 facilities, got %d", summary.TotalFacilities)
	}
}

func TestEquipmentDeleteThenGetNotFound(t *testing.T) {
	svc := NewService(
		NewInMemAttendanceStore(),
		NewInMemEquipmentStore(),
		NewInMemFacilityStore(),
		testIDGen,
	)
	items, _ := svc.ListEquipment(testCtx, "CLB-001")
	if len(items) == 0 {
		t.Fatal("need seed data")
	}
	id := items[0].ID
	_ = svc.DeleteEquipment(testCtx, id)
	_, err := svc.GetEquipment(testCtx, id)
	if err == nil {
		t.Error("expected error after deleting")
	}
}

// ═══════════════════════════════════════════════════════════════
// VALIDATION TESTS
// ═══════════════════════════════════════════════════════════════

func TestRecordAttendanceValidation(t *testing.T) {
	svc := NewService(
		NewInMemAttendanceStore(),
		NewInMemEquipmentStore(),
		NewInMemFacilityStore(),
		testIDGen,
	)

	tests := []struct {
		name string
		a    Attendance
	}{
		{"empty member", Attendance{ClubID: "CLB-001", MemberID: "", Date: "2026-03-12", Status: AttendancePresent}},
		{"empty date", Attendance{ClubID: "CLB-001", MemberID: "MBR-001", Date: "", Status: AttendancePresent}},
		{"invalid status", Attendance{ClubID: "CLB-001", MemberID: "MBR-001", Date: "2026-03-12", Status: "invalid"}},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			_, err := svc.RecordAttendance(testCtx, tc.a)
			if err == nil {
				t.Error("expected validation error")
			}
		})
	}
}

func TestCreateEquipmentValidation(t *testing.T) {
	svc := NewService(
		NewInMemAttendanceStore(),
		NewInMemEquipmentStore(),
		NewInMemFacilityStore(),
		testIDGen,
	)

	tests := []struct {
		name string
		e    Equipment
	}{
		{"empty name", Equipment{ClubID: "CLB-001", Name: "", Quantity: 5, Category: EquipCatTraining}},
		{"zero quantity", Equipment{ClubID: "CLB-001", Name: "Item", Quantity: 0, Category: EquipCatTraining}},
		{"negative quantity", Equipment{ClubID: "CLB-001", Name: "Item", Quantity: -1, Category: EquipCatTraining}},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			_, err := svc.CreateEquipment(testCtx, tc.e)
			if err == nil {
				t.Error("expected validation error")
			}
		})
	}
}

func TestCreateFacilityValidation(t *testing.T) {
	svc := NewService(
		NewInMemAttendanceStore(),
		NewInMemEquipmentStore(),
		NewInMemFacilityStore(),
		testIDGen,
	)

	tests := []struct {
		name string
		f    Facility
	}{
		{"empty name", Facility{ClubID: "CLB-001", Name: "", AreaSqm: 100, Type: FacilityTrainingHall}},
		{"zero area", Facility{ClubID: "CLB-001", Name: "Room", AreaSqm: 0, Type: FacilityTrainingHall}},
		{"negative area", Facility{ClubID: "CLB-001", Name: "Room", AreaSqm: -50, Type: FacilityTrainingHall}},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			_, err := svc.CreateFacility(testCtx, tc.f)
			if err == nil {
				t.Error("expected validation error")
			}
		})
	}
}

// ═══════════════════════════════════════════════════════════════
// BULK + DASHBOARD TESTS (after Phase 2 methods exist)
// ═══════════════════════════════════════════════════════════════

func TestGetDashboard(t *testing.T) {
	svc := NewService(
		NewInMemAttendanceStore(),
		NewInMemEquipmentStore(),
		NewInMemFacilityStore(),
		testIDGen,
	)

	d, err := svc.GetDashboard(testCtx, "CLB-001")
	if err != nil {
		t.Fatalf("GetDashboard: %v", err)
	}
	if d.TotalEquipment == 0 {
		t.Error("expected equipment count")
	}
	if d.TotalFacilities == 0 {
		t.Error("expected facility count")
	}
	if d.AttendanceRate < 0 || d.AttendanceRate > 100 {
		t.Errorf("attendance rate out of range: %f", d.AttendanceRate)
	}
}

func TestBulkRecordAttendance(t *testing.T) {
	svc := NewService(
		NewInMemAttendanceStore(),
		NewInMemEquipmentStore(),
		NewInMemFacilityStore(),
		testIDGen,
	)

	records := []Attendance{
		{ClubID: "CLB-001", MemberID: "MBR-A", MemberName: "A", Date: "2026-03-12", Status: AttendancePresent},
		{ClubID: "CLB-001", MemberID: "MBR-B", MemberName: "B", Date: "2026-03-12", Status: AttendanceAbsent},
		{ClubID: "CLB-001", MemberID: "MBR-C", MemberName: "C", Date: "2026-03-12", Status: AttendanceLate},
	}

	created, err := svc.BulkRecordAttendance(testCtx, records)
	if err != nil {
		t.Fatalf("BulkRecordAttendance: %v", err)
	}
	if len(created) != 3 {
		t.Errorf("expected 3 created, got %d", len(created))
	}
}

func TestExportAttendanceCSV(t *testing.T) {
	svc := NewService(
		NewInMemAttendanceStore(),
		NewInMemEquipmentStore(),
		NewInMemFacilityStore(),
		testIDGen,
	)

	csv, err := svc.ExportAttendanceCSV(testCtx, "CLB-001")
	if err != nil {
		t.Fatalf("ExportAttendanceCSV: %v", err)
	}
	if csv == "" {
		t.Error("expected non-empty CSV")
	}
}

func TestExportEquipmentCSV(t *testing.T) {
	svc := NewService(
		NewInMemAttendanceStore(),
		NewInMemEquipmentStore(),
		NewInMemFacilityStore(),
		testIDGen,
	)

	csv, err := svc.ExportEquipmentCSV(testCtx, "CLB-001")
	if err != nil {
		t.Fatalf("ExportEquipmentCSV: %v", err)
	}
	if csv == "" {
		t.Error("expected non-empty CSV")
	}
}

func TestExportFacilitiesCSV(t *testing.T) {
	svc := NewService(
		NewInMemAttendanceStore(),
		NewInMemEquipmentStore(),
		NewInMemFacilityStore(),
		testIDGen,
	)

	csv, err := svc.ExportFacilitiesCSV(testCtx, "CLB-001")
	if err != nil {
		t.Fatalf("ExportFacilitiesCSV: %v", err)
	}
	if csv == "" {
		t.Error("expected non-empty CSV")
	}
}

