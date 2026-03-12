package adapter

import (
	"context"
	"testing"
	"time"

	"vct-platform/backend/internal/domain/athlete"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Athlete Profile PG Adapter Conformance Tests
// ═══════════════════════════════════════════════════════════════

// ── Interface Conformance (compile-time checks) ──────────────

var _ athlete.AthleteProfileRepository = (*PgAthleteProfileRepo)(nil)
var _ athlete.ClubMembershipRepository = (*PgClubMembershipRepo)(nil)
var _ athlete.TournamentEntryRepository = (*PgTournamentEntryRepo)(nil)

// ── Profile Integration Tests ────────────────────────────────

func TestPgAthleteProfile_CRUD(t *testing.T) {
	db := pgTestDB(t)
	repo := NewPgAthleteProfileRepo(db)
	ctx := context.Background()

	p := athlete.AthleteProfile{
		ID:        "APR-PG-001",
		UserID:    "USR-PG-001",
		FullName:  "PG Test Athlete",
		Gender:    "nam",
		BeltRank:  athlete.BeltYellow,
		BeltLabel: "Hoàng đai",
		Status:    athlete.ProfileStatusDraft,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	created, err := repo.Create(ctx, p)
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
	if created.FullName != "PG Test Athlete" {
		t.Errorf("expected 'PG Test Athlete', got %s", created.FullName)
	}

	got, err := repo.GetByID(ctx, "APR-PG-001")
	if err != nil {
		t.Fatalf("GetByID: %v", err)
	}
	if got.FullName != "PG Test Athlete" {
		t.Errorf("expected 'PG Test Athlete', got %s", got.FullName)
	}

	// GetByUserID
	got2, err := repo.GetByUserID(ctx, "USR-PG-001")
	if err != nil {
		t.Fatalf("GetByUserID: %v", err)
	}
	if got2.ID != "APR-PG-001" {
		t.Errorf("expected ID APR-PG-001, got %s", got2.ID)
	}

	// Update
	if err := repo.Update(ctx, "APR-PG-001", map[string]interface{}{"full_name": "Updated Name"}); err != nil {
		t.Fatalf("Update: %v", err)
	}
	got3, _ := repo.GetByID(ctx, "APR-PG-001")
	if got3.FullName != "Updated Name" {
		t.Errorf("expected 'Updated Name', got %s", got3.FullName)
	}

	// List
	list, err := repo.List(ctx)
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if len(list) == 0 {
		t.Error("expected at least 1 profile")
	}

	// ListByClub
	_, err = repo.ListByClub(ctx, "CLB-PG-001")
	if err != nil {
		t.Fatalf("ListByClub: %v", err)
	}

	// Delete
	if err := repo.Delete(ctx, "APR-PG-001"); err != nil {
		t.Fatalf("Delete: %v", err)
	}
}

// ── Membership Integration Tests ─────────────────────────────

func TestPgClubMembership_CRUD(t *testing.T) {
	db := pgTestDB(t)
	repo := NewPgClubMembershipRepo(db)
	ctx := context.Background()

	m := athlete.ClubMembership{
		ID:        "CM-PG-001",
		AthleteID: "ATH-PG-001",
		ClubID:    "CLB-PG-001",
		ClubName:  "CLB PG Test",
		Role:      athlete.MembershipRoleMember,
		Status:    athlete.MembershipStatusPending,
	}
	created, err := repo.Create(ctx, m)
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
	if created.ClubName != "CLB PG Test" {
		t.Errorf("expected 'CLB PG Test', got %s", created.ClubName)
	}

	list, err := repo.ListByAthlete(ctx, "ATH-PG-001")
	if err != nil {
		t.Fatalf("ListByAthlete: %v", err)
	}
	if len(list) == 0 {
		t.Error("expected at least 1 membership")
	}

	if err := repo.Delete(ctx, "CM-PG-001"); err != nil {
		t.Fatalf("Delete: %v", err)
	}
}

// ── Tournament Entry Integration Tests ───────────────────────

func TestPgTournamentEntry_CRUD(t *testing.T) {
	db := pgTestDB(t)
	repo := NewPgTournamentEntryRepo(db)
	ctx := context.Background()

	e := athlete.TournamentEntry{
		ID:           "TE-PG-001",
		AthleteID:    "ATH-PG-001",
		TournamentID: "TRN-PG-001",
		Status:       athlete.EntryStatusNhap,
	}
	created, err := repo.Create(ctx, e)
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
	if created.TournamentID != "TRN-PG-001" {
		t.Errorf("expected TournamentID TRN-PG-001, got %s", created.TournamentID)
	}

	got, err := repo.GetByID(ctx, "TE-PG-001")
	if err != nil {
		t.Fatalf("GetByID: %v", err)
	}
	if got.Status != athlete.EntryStatusNhap {
		t.Errorf("expected status nhap, got %s", got.Status)
	}

	entries, err := repo.ListByAthlete(ctx, "ATH-PG-001")
	if err != nil {
		t.Fatalf("ListByAthlete: %v", err)
	}
	if len(entries) == 0 {
		t.Error("expected at least 1 entry")
	}

	// Update status via patch
	if err := repo.Update(ctx, "TE-PG-001", map[string]interface{}{"status": string(athlete.EntryStatusDuDieuKien)}); err != nil {
		t.Fatalf("Update status: %v", err)
	}

	if err := repo.Delete(ctx, "TE-PG-001"); err != nil {
		t.Fatalf("Delete: %v", err)
	}
}
