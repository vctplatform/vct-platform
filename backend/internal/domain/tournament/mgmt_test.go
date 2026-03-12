package tournament

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Tournament Management Tests
// Tests for validation, export, audit, and service logic
// ═══════════════════════════════════════════════════════════════

import (
	"testing"
	"time"
)

// ── Validation Tests ─────────────────────────────────────────

func TestValidateCategory_Valid(t *testing.T) {
	c := &Category{
		TournamentID: "tid",
		ContentType:  "doi_khang",
		AgeGroup:     "thanh_nien",
		WeightClass:  "60kg",
		Gender:       "nam",
		MaxAthletes:  32,
		MinAthletes:  4,
		Status:       "active",
	}
	errs := ValidateCategory(c)
	if errs.HasErrors() {
		t.Errorf("expected no errors, got %v", errs)
	}
}

func TestValidateCategory_MissingFields(t *testing.T) {
	c := &Category{} // All empty
	errs := ValidateCategory(c)
	if !errs.HasErrors() {
		t.Error("expected validation errors for empty category")
	}
	if len(errs) < 3 {
		t.Errorf("expected at least 3 errors, got %d", len(errs))
	}
}

func TestValidateCategory_InvalidContentType(t *testing.T) {
	c := &Category{
		TournamentID: "tid",
		ContentType:  "invalid_type",
		AgeGroup:     "thanh_nien",
		Gender:       "nam",
	}
	errs := ValidateCategory(c)
	if !errs.HasErrors() {
		t.Error("expected validation error for invalid content type")
	}
	found := false
	for _, e := range errs {
		if e.Field == "content_type" {
			found = true
		}
	}
	if !found {
		t.Error("expected error on content_type field")
	}
}

func TestValidateCategory_DoiKhangRequiresWeight(t *testing.T) {
	c := &Category{
		TournamentID: "tid",
		ContentType:  "doi_khang",
		AgeGroup:     "thanh_nien",
		Gender:       "nam",
		WeightClass:  "", // missing
	}
	errs := ValidateCategory(c)
	found := false
	for _, e := range errs {
		if e.Field == "weight_class" {
			found = true
		}
	}
	if !found {
		t.Error("doi_khang should require weight_class")
	}
}

func TestValidateCategory_MinMaxConstraint(t *testing.T) {
	c := &Category{
		TournamentID: "tid",
		ContentType:  "quyen",
		AgeGroup:     "thieu_nien",
		Gender:       "nu",
		MinAthletes:  10,
		MaxAthletes:  5,
	}
	errs := ValidateCategory(c)
	found := false
	for _, e := range errs {
		if e.Field == "min_athletes" {
			found = true
		}
	}
	if !found {
		t.Error("min_athletes > max_athletes should be rejected")
	}
}

func TestValidateRegistration_Valid(t *testing.T) {
	r := &Registration{
		TournamentID: "tid",
		TeamName:     "Đoàn Hà Nội",
		TeamType:     "doan_tinh",
		HeadCoach:    "Nguyễn Văn A",
		Status:       "nhap",
	}
	errs := ValidateRegistration(r)
	if errs.HasErrors() {
		t.Errorf("expected no errors, got %v", errs)
	}
}

func TestValidateRegistration_MissingFields(t *testing.T) {
	r := &Registration{}
	errs := ValidateRegistration(r)
	if !errs.HasErrors() {
		t.Error("expected validation errors for empty registration")
	}
	if len(errs) < 3 {
		t.Errorf("expected at least 3 errors, got %d", len(errs))
	}
}

func TestValidateRegistration_InvalidTeamType(t *testing.T) {
	r := &Registration{
		TournamentID: "tid",
		TeamName:     "T1",
		TeamType:     "invalid",
		HeadCoach:    "Coach",
	}
	errs := ValidateRegistration(r)
	found := false
	for _, e := range errs {
		if e.Field == "team_type" {
			found = true
		}
	}
	if !found {
		t.Error("expected error on team_type field")
	}
}

func TestValidateRegistrationAthlete_Valid(t *testing.T) {
	a := &RegistrationAthlete{
		RegistrationID: "rid",
		AthleteName:    "Trần Văn B",
		Gender:         "nam",
		Weight:         55.0,
		CategoryIDs:    []string{"cat1"},
	}
	errs := ValidateRegistrationAthlete(a)
	if errs.HasErrors() {
		t.Errorf("expected no errors, got %v", errs)
	}
}

func TestValidateRegistrationAthlete_NoCategories(t *testing.T) {
	a := &RegistrationAthlete{
		RegistrationID: "rid",
		AthleteName:    "Test",
		Gender:         "nam",
		CategoryIDs:    []string{},
	}
	errs := ValidateRegistrationAthlete(a)
	found := false
	for _, e := range errs {
		if e.Field == "category_ids" {
			found = true
		}
	}
	if !found {
		t.Error("expected error for empty category_ids")
	}
}

func TestValidateScheduleSlot_Valid(t *testing.T) {
	s := &ScheduleSlot{
		TournamentID: "tid",
		Date:         "2024-06-01",
		Session:      "sang",
		StartTime:    "08:00",
		EndTime:      "12:00",
		Status:       "du_kien",
	}
	errs := ValidateScheduleSlot(s)
	if errs.HasErrors() {
		t.Errorf("expected no errors, got %v", errs)
	}
}

func TestValidateScheduleSlot_InvalidTimeRange(t *testing.T) {
	s := &ScheduleSlot{
		TournamentID: "tid",
		Date:         "2024-06-01",
		Session:      "sang",
		StartTime:    "14:00",
		EndTime:      "08:00", // end before start
	}
	errs := ValidateScheduleSlot(s)
	found := false
	for _, e := range errs {
		if e.Field == "end_time" {
			found = true
		}
	}
	if !found {
		t.Error("expected error for end_time before start_time")
	}
}

func TestValidateResult_Valid(t *testing.T) {
	r := &TournamentResult{
		TournamentID: "tid",
		CategoryID:   "cid",
		GoldName:     "Nguyễn Văn A",
		SilverName:   "Trần Văn B",
	}
	errs := ValidateResult(r)
	if errs.HasErrors() {
		t.Errorf("expected no errors, got %v", errs)
	}
}

func TestValidateResult_MissingMedalists(t *testing.T) {
	r := &TournamentResult{
		TournamentID: "tid",
		CategoryID:   "cid",
	}
	errs := ValidateResult(r)
	if len(errs) < 2 {
		t.Errorf("expected at least 2 errors for missing medalists, got %d", len(errs))
	}
}

// ── Export Tests ─────────────────────────────────────────────

func TestExportRegistrationsToCSV(t *testing.T) {
	now := time.Now()
	regs := []*Registration{
		{TeamName: "Đoàn HN", Province: "Hà Nội", TeamType: "doan_tinh", HeadCoach: "HLV A", TotalAthletes: 10, TotalContents: 5, Status: "da_duyet", SubmittedAt: &now},
		{TeamName: "CLB SG", Province: "TP.HCM", TeamType: "clb", HeadCoach: "HLV B", TotalAthletes: 8, TotalContents: 3, Status: "cho_duyet"},
	}
	csv := ExportRegistrationsToCSV(regs)
	if csv == "" {
		t.Error("expected non-empty CSV")
	}
	if !contains(csv, "Đoàn HN") {
		t.Error("CSV should contain team name")
	}
	if !contains(csv, "Đã duyệt") {
		t.Error("CSV should contain translated status")
	}
}

func TestExportResultsToCSV(t *testing.T) {
	results := []*TournamentResult{
		{CategoryName: "Đối kháng Nam 60kg", ContentType: "doi_khang", GoldName: "A", GoldTeam: "HN", SilverName: "B", SilverTeam: "SG", IsFinalized: true},
	}
	csv := ExportResultsToCSV(results)
	if csv == "" {
		t.Error("expected non-empty CSV")
	}
	if !contains(csv, "Đã xác nhận") {
		t.Error("CSV should contain finalized status")
	}
}

func TestExportStandingsToCSV(t *testing.T) {
	standings := []*TeamStanding{
		{Rank: 1, TeamName: "Đoàn HN", Province: "Hà Nội", Gold: 5, Silver: 3, Bronze: 2, TotalMedals: 10, Points: 23},
	}
	csv := ExportStandingsToCSV(standings)
	if !contains(csv, "Đoàn HN") || !contains(csv, "23") {
		t.Error("CSV should contain team name and points")
	}
}

func TestExportScheduleToCSV(t *testing.T) {
	slots := []*ScheduleSlot{
		{Date: "2024-06-01", Session: "sang", ArenaName: "Sân 1", StartTime: "08:00", EndTime: "12:00", CategoryName: "Đối kháng", ContentType: "doi_khang", MatchCount: 8, Status: "xac_nhan"},
	}
	csv := ExportScheduleToCSV(slots)
	if !contains(csv, "Sáng") {
		t.Error("CSV should translate session")
	}
}

func TestExportCategoriesToCSV(t *testing.T) {
	cats := []*Category{
		{Name: "NK Nam 60kg", ContentType: "doi_khang", AgeGroup: "thanh_nien", WeightClass: "60kg", Gender: "nam", IsTeamEvent: false, Status: "active"},
	}
	csv := ExportCategoriesToCSV(cats)
	if !contains(csv, "NK Nam 60kg") {
		t.Error("CSV should contain category name")
	}
}

// ── Audit Trail Tests ───────────────────────────────────────

func TestAuditTrail_RecordAndList(t *testing.T) {
	at := NewAuditTrail()
	at.Record(AuditEntry{
		TournamentID: "t1",
		EntityType:   "category",
		EntityID:     "c1",
		Action:       AuditActionCreate,
		ActorID:      "u1",
		ActorName:    "Admin",
	})
	at.Record(AuditEntry{
		TournamentID: "t1",
		EntityType:   "registration",
		EntityID:     "r1",
		Action:       AuditActionApprove,
		ActorID:      "u2",
		ActorName:    "Reviewer",
	})
	at.Record(AuditEntry{
		TournamentID: "t2",
		EntityType:   "category",
		EntityID:     "c2",
		Action:       AuditActionCreate,
		ActorID:      "u1",
	})

	if at.Count() != 3 {
		t.Errorf("expected 3 entries, got %d", at.Count())
	}

	t1Entries := at.ListByTournament("t1")
	if len(t1Entries) != 2 {
		t.Errorf("expected 2 entries for t1, got %d", len(t1Entries))
	}

	entityEntries := at.ListByEntity("category", "c1")
	if len(entityEntries) != 1 {
		t.Errorf("expected 1 entry for c1, got %d", len(entityEntries))
	}

	actorEntries := at.ListByActor("u1")
	if len(actorEntries) != 2 {
		t.Errorf("expected 2 entries for u1, got %d", len(actorEntries))
	}
}

func TestAuditTrail_TimestampAutoSet(t *testing.T) {
	at := NewAuditTrail()
	at.Record(AuditEntry{
		TournamentID: "t1",
		Action:       AuditActionCreate,
	})
	entries := at.ListByTournament("t1")
	if entries[0].Timestamp.IsZero() {
		t.Error("expected auto-set timestamp")
	}
}

// ── Helper ───────────────────────────────────────────────────

func contains(s, substr string) bool {
	return len(s) > 0 && len(substr) > 0 && containsStr(s, substr)
}

func containsStr(s, sub string) bool {
	for i := 0; i <= len(s)-len(sub); i++ {
		if s[i:i+len(sub)] == sub {
			return true
		}
	}
	return false
}
