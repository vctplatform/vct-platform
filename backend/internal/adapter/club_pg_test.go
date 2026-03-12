package adapter

import (
	"database/sql"
	"os"
	"testing"

	clubdomain "vct-platform/backend/internal/domain/club"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Club PG Adapter Conformance Tests
//
// These tests verify that PG adapters satisfy domain interfaces
// and exercise SQL statement correctness against a real database.
//
// Set VCT_TEST_POSTGRES_URL to run. Skipped without it.
// ═══════════════════════════════════════════════════════════════

func pgTestDB(t *testing.T) *sql.DB {
	t.Helper()
	url := os.Getenv("VCT_TEST_POSTGRES_URL")
	if url == "" {
		t.Skip("VCT_TEST_POSTGRES_URL not set — skipping PG integration test")
	}
	db, err := sql.Open("pgx", url)
	if err != nil {
		t.Fatalf("sql.Open: %v", err)
	}
	if err := db.Ping(); err != nil {
		t.Fatalf("db.Ping: %v", err)
	}
	t.Cleanup(func() { _ = db.Close() })
	return db
}

// ── Interface Conformance (compile-time checks) ──────────────

var _ clubdomain.AttendanceStore = (*PgAttendanceStore)(nil)
var _ clubdomain.EquipmentStore = (*PgEquipmentStore)(nil)
var _ clubdomain.FacilityStore = (*PgFacilityStore)(nil)

// ── Attendance Integration Tests ─────────────────────────────

func TestPgAttendanceStore_ListAndCreate(t *testing.T) {
	db := pgTestDB(t)
	store := NewPgAttendanceStore(db)

	ctx := t.Context()
	a := clubdomain.Attendance{
		ID:         "ATT-PG-001",
		ClubID:     "CLB-PG-001",
		ClassID:    "CLS-001",
		ClassName:  "Lớp Test",
		MemberID:   "MBR-001",
		MemberName: "PG Tester",
		Date:       "2026-03-12",
		Status:     clubdomain.AttendancePresent,
		RecordedBy: "tester",
	}
	if _, err := store.Create(ctx, a); err != nil {
		t.Fatalf("Create: %v", err)
	}

	list, err := store.List(ctx, "CLB-PG-001")
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if len(list) == 0 {
		t.Error("expected at least 1 attendance record")
	}

	// Cleanup
	_ = store.Delete(ctx, "ATT-PG-001")
}

// ── Equipment Integration Tests ──────────────────────────────

func TestPgEquipmentStore_CRUD(t *testing.T) {
	db := pgTestDB(t)
	store := NewPgEquipmentStore(db)

	ctx := t.Context()
	e := clubdomain.Equipment{
		ID:       "EQ-PG-001",
		ClubID:   "CLB-PG-001",
		Name:     "Giáp Test",
		Category: clubdomain.EquipCatProtective,
		Quantity: 5,
	}
	if _, err := store.Create(ctx, e); err != nil {
		t.Fatalf("Create: %v", err)
	}

	got, err := store.GetByID(ctx, "EQ-PG-001")
	if err != nil {
		t.Fatalf("GetByID: %v", err)
	}
	if got.Name != "Giáp Test" {
		t.Errorf("expected 'Giáp Test', got %s", got.Name)
	}

	if err := store.Update(ctx, "EQ-PG-001", map[string]interface{}{"quantity": float64(10)}); err != nil {
		t.Fatalf("Update: %v", err)
	}

	if err := store.Delete(ctx, "EQ-PG-001"); err != nil {
		t.Fatalf("Delete: %v", err)
	}
}

// ── Facility Integration Tests ───────────────────────────────

func TestPgFacilityStore_CRUD(t *testing.T) {
	db := pgTestDB(t)
	store := NewPgFacilityStore(db)

	ctx := t.Context()
	f := clubdomain.Facility{
		ID:       "FAC-PG-001",
		ClubID:   "CLB-PG-001",
		Name:     "Phòng tập Test",
		Type:     clubdomain.FacilityTrainingHall,
		AreaSqm:  100,
		Capacity: 30,
		Status:   clubdomain.FacilityStatusActive,
	}
	if _, err := store.Create(ctx, f); err != nil {
		t.Fatalf("Create: %v", err)
	}

	got, err := store.GetByID(ctx, "FAC-PG-001")
	if err != nil {
		t.Fatalf("GetByID: %v", err)
	}
	if got.Name != "Phòng tập Test" {
		t.Errorf("expected 'Phòng tập Test', got %s", got.Name)
	}

	if err := store.Update(ctx, "FAC-PG-001", map[string]interface{}{"capacity": float64(50)}); err != nil {
		t.Fatalf("Update: %v", err)
	}

	if err := store.Delete(ctx, "FAC-PG-001"); err != nil {
		t.Fatalf("Delete: %v", err)
	}
}
