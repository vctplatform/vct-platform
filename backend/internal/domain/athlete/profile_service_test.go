package athlete

import (
	"context"
	"fmt"
	"sync/atomic"
	"testing"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Athlete Profile Service Tests
// ═══════════════════════════════════════════════════════════════

var testIDCounter atomic.Int64

func idGen() string { return fmt.Sprintf("TEST-%d", testIDCounter.Add(1)) }

var ctx = context.Background()

func newTestService() *ProfileService {
	return NewProfileService(
		NewInMemProfileStore(),
		NewInMemMembershipStore(),
		NewInMemEntryStore(),
		idGen,
	)
}

// ── Profile Tests ────────────────────────────────────────────

func TestCreateProfile(t *testing.T) {
	svc := newTestService()
	p := AthleteProfile{
		UserID:   "USR-001",
		FullName: "Nguyễn Văn Test",
		Gender:   "nam",
		BeltRank: BeltYellow,
	}
	created, err := svc.CreateProfile(ctx, p)
	if err != nil {
		t.Fatalf("CreateProfile: %v", err)
	}
	if created.ID == "" {
		t.Error("expected generated ID")
	}
	if created.BeltLabel != BeltLabelMap[BeltYellow] {
		t.Errorf("expected belt label %s, got %s", BeltLabelMap[BeltYellow], created.BeltLabel)
	}
	if created.Status != ProfileStatusDraft {
		t.Errorf("expected status draft, got %s", created.Status)
	}
	if created.CreatedAt.IsZero() {
		t.Error("expected CreatedAt to be set")
	}
}

func TestCreateProfileValidation(t *testing.T) {
	svc := newTestService()
	// Missing full_name
	_, err := svc.CreateProfile(ctx, AthleteProfile{UserID: "USR-X"})
	if err == nil {
		t.Error("expected error for missing full_name")
	}
	// Missing user_id
	_, err = svc.CreateProfile(ctx, AthleteProfile{FullName: "Test"})
	if err == nil {
		t.Error("expected error for missing user_id")
	}
}

func TestGetProfile(t *testing.T) {
	svc := newTestService()
	p, _ := svc.CreateProfile(ctx, AthleteProfile{UserID: "USR-002", FullName: "Get Test"})
	got, err := svc.GetProfile(ctx, p.ID)
	if err != nil {
		t.Fatalf("GetProfile: %v", err)
	}
	if got.FullName != "Get Test" {
		t.Errorf("expected 'Get Test', got %s", got.FullName)
	}
}

func TestGetByUserID(t *testing.T) {
	svc := newTestService()
	svc.CreateProfile(ctx, AthleteProfile{UserID: "USR-UID-001", FullName: "UID Test"})
	got, err := svc.GetByUserID(ctx, "USR-UID-001")
	if err != nil {
		t.Fatalf("GetByUserID: %v", err)
	}
	if got.FullName != "UID Test" {
		t.Errorf("expected 'UID Test', got %s", got.FullName)
	}
}

func TestListProfiles(t *testing.T) {
	svc := newTestService()
	svc.CreateProfile(ctx, AthleteProfile{UserID: "USR-L1", FullName: "List 1"})
	svc.CreateProfile(ctx, AthleteProfile{UserID: "USR-L2", FullName: "List 2"})
	list, err := svc.ListProfiles(ctx)
	if err != nil {
		t.Fatalf("ListProfiles: %v", err)
	}
	if len(list) < 2 {
		t.Errorf("expected at least 2 profiles, got %d", len(list))
	}
}

func TestUpdateProfile(t *testing.T) {
	svc := newTestService()
	p, _ := svc.CreateProfile(ctx, AthleteProfile{UserID: "USR-UPD", FullName: "Before"})
	err := svc.UpdateProfile(ctx, p.ID, map[string]interface{}{"full_name": "After"})
	if err != nil {
		t.Fatalf("UpdateProfile: %v", err)
	}
	got, _ := svc.GetProfile(ctx, p.ID)
	if got.FullName != "After" {
		t.Errorf("expected 'After', got %s", got.FullName)
	}
}

func TestDeleteProfile(t *testing.T) {
	svc := newTestService()
	p, _ := svc.CreateProfile(ctx, AthleteProfile{UserID: "USR-DEL", FullName: "Delete Me"})
	if err := svc.DeleteProfile(ctx, p.ID); err != nil {
		t.Fatalf("DeleteProfile: %v", err)
	}
	_, err := svc.GetProfile(ctx, p.ID)
	if err == nil {
		t.Error("expected error after deletion")
	}
}

func TestSearchProfiles(t *testing.T) {
	svc := newTestService()
	svc.CreateProfile(ctx, AthleteProfile{UserID: "USR-S1", FullName: "Nguyễn Tìm Kiếm", Province: "Hà Nội"})
	svc.CreateProfile(ctx, AthleteProfile{UserID: "USR-S2", FullName: "Trần Văn Other", Province: "TP.HCM"})

	results, err := svc.SearchProfiles(ctx, "tìm kiếm")
	if err != nil {
		t.Fatalf("SearchProfiles: %v", err)
	}
	if len(results) != 1 {
		t.Errorf("expected 1 result for 'tìm kiếm', got %d", len(results))
	}

	// Empty query returns all
	all, _ := svc.SearchProfiles(ctx, "")
	if len(all) < 2 {
		t.Errorf("expected all profiles on empty query, got %d", len(all))
	}
}

func TestGetStats(t *testing.T) {
	svc := newTestService()
	svc.CreateProfile(ctx, AthleteProfile{UserID: "USR-ST1", FullName: "A", Gender: "nam", BeltRank: BeltYellow, EloRating: 1200})
	svc.CreateProfile(ctx, AthleteProfile{UserID: "USR-ST2", FullName: "B", Gender: "nu", BeltRank: BeltGreen, EloRating: 1400})

	stats, err := svc.GetStats(ctx)
	if err != nil {
		t.Fatalf("GetStats: %v", err)
	}
	if stats.Total < 2 {
		t.Errorf("expected at least 2 total, got %d", stats.Total)
	}
	if stats.ByGender["nam"] < 1 {
		t.Errorf("expected at least 1 nam, got %d", stats.ByGender["nam"])
	}
}

// ── Club Membership Tests ────────────────────────────────────

func TestJoinClub(t *testing.T) {
	svc := newTestService()
	m := ClubMembership{AthleteID: "ATH-001", ClubID: "CLB-001", ClubName: "CLB Test"}
	created, err := svc.JoinClub(ctx, m)
	if err != nil {
		t.Fatalf("JoinClub: %v", err)
	}
	if created.Role != MembershipRoleMember {
		t.Errorf("expected role member, got %s", created.Role)
	}
	if created.Status != MembershipStatusPending {
		t.Errorf("expected status pending, got %s", created.Status)
	}
}

func TestJoinClubValidation(t *testing.T) {
	svc := newTestService()
	_, err := svc.JoinClub(ctx, ClubMembership{ClubID: "CLB-001"})
	if err == nil {
		t.Error("expected error for missing athlete_id")
	}
	_, err = svc.JoinClub(ctx, ClubMembership{AthleteID: "ATH-001"})
	if err == nil {
		t.Error("expected error for missing club_id")
	}
}

func TestListMyClubs(t *testing.T) {
	svc := newTestService()
	svc.JoinClub(ctx, ClubMembership{AthleteID: "ATH-LC", ClubID: "CLB-1"})
	svc.JoinClub(ctx, ClubMembership{AthleteID: "ATH-LC", ClubID: "CLB-2"})
	clubs, err := svc.ListMyClubs(ctx, "ATH-LC")
	if err != nil {
		t.Fatalf("ListMyClubs: %v", err)
	}
	if len(clubs) != 2 {
		t.Errorf("expected 2 clubs, got %d", len(clubs))
	}
}

func TestLeaveClub(t *testing.T) {
	svc := newTestService()
	m, _ := svc.JoinClub(ctx, ClubMembership{AthleteID: "ATH-LV", ClubID: "CLB-LV"})
	if err := svc.LeaveClub(ctx, m.ID); err != nil {
		t.Fatalf("LeaveClub: %v", err)
	}
}

// ── Tournament Entry Tests ───────────────────────────────────

func TestEnterTournament(t *testing.T) {
	svc := newTestService()
	e := TournamentEntry{AthleteID: "ATH-001", TournamentID: "TRN-001"}
	created, err := svc.EnterTournament(ctx, e)
	if err != nil {
		t.Fatalf("EnterTournament: %v", err)
	}
	if created.Status != EntryStatusNhap {
		t.Errorf("expected status nhap, got %s", created.Status)
	}
}

func TestEnterTournamentValidation(t *testing.T) {
	svc := newTestService()
	_, err := svc.EnterTournament(ctx, TournamentEntry{TournamentID: "TRN-001"})
	if err == nil {
		t.Error("expected error for missing athlete_id")
	}
	_, err = svc.EnterTournament(ctx, TournamentEntry{AthleteID: "ATH-001"})
	if err == nil {
		t.Error("expected error for missing tournament_id")
	}
}

func TestApproveRejectEntry(t *testing.T) {
	svc := newTestService()
	e, _ := svc.EnterTournament(ctx, TournamentEntry{AthleteID: "ATH-AR", TournamentID: "TRN-AR"})

	if err := svc.ApproveEntry(ctx, e.ID); err != nil {
		t.Fatalf("ApproveEntry: %v", err)
	}
	got, _ := svc.GetEntry(ctx, e.ID)
	if got.Status != EntryStatusDuDieuKien {
		t.Errorf("expected status du_dieu_kien after approve, got %s", got.Status)
	}

	// Create another and reject
	e2, _ := svc.EnterTournament(ctx, TournamentEntry{AthleteID: "ATH-AR2", TournamentID: "TRN-AR"})
	if err := svc.RejectEntry(ctx, e2.ID); err != nil {
		t.Fatalf("RejectEntry: %v", err)
	}
	got2, _ := svc.GetEntry(ctx, e2.ID)
	if got2.Status != EntryStatusBiTuChoi {
		t.Errorf("expected status bi_tu_choi after reject, got %s", got2.Status)
	}
}

func TestListMyTournaments(t *testing.T) {
	svc := newTestService()
	svc.EnterTournament(ctx, TournamentEntry{AthleteID: "ATH-LT", TournamentID: "TRN-1"})
	svc.EnterTournament(ctx, TournamentEntry{AthleteID: "ATH-LT", TournamentID: "TRN-2"})
	entries, err := svc.ListMyTournaments(ctx, "ATH-LT")
	if err != nil {
		t.Fatalf("ListMyTournaments: %v", err)
	}
	if len(entries) != 2 {
		t.Errorf("expected 2 entries, got %d", len(entries))
	}
}
