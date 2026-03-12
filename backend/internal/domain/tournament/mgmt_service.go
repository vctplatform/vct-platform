package tournament

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — TOURNAMENT MANAGEMENT SERVICE
// Business logic for categories, registrations, schedule, results
// ═══════════════════════════════════════════════════════════════

import (
	"context"
	"fmt"
	"sort"
	"time"
)

// MgmtService contains the business logic for tournament management operations.
type MgmtService struct {
	repo    MgmtRepository
	newUUID func() string
}

// NewMgmtService creates a new tournament management service.
func NewMgmtService(repo MgmtRepository, newUUID func() string) *MgmtService {
	return &MgmtService{repo: repo, newUUID: newUUID}
}

// ── Categories ──────────────────────────────────────────────

// CreateCategory validates and creates a new competition category.
func (s *MgmtService) CreateCategory(ctx context.Context, c *Category) (*Category, error) {
	if c.TournamentID == "" {
		return nil, fmt.Errorf("tournament_id is required")
	}
	if c.ContentType == "" {
		return nil, fmt.Errorf("content_type is required")
	}
	if c.Gender == "" {
		return nil, fmt.Errorf("gender is required")
	}
	c.ID = s.newUUID()
	c.Status = "active"
	now := time.Now()
	c.CreatedAt = now
	c.UpdatedAt = now
	if c.Name == "" {
		c.Name = fmt.Sprintf("%s - %s - %s", c.ContentType, c.AgeGroup, c.Gender)
	}
	if err := s.repo.CreateCategory(ctx, c); err != nil {
		return nil, err
	}
	return c, nil
}

// ListCategories returns all categories for a tournament.
func (s *MgmtService) ListCategories(ctx context.Context, tournamentID string) ([]*Category, error) {
	return s.repo.ListCategories(ctx, tournamentID)
}

// GetCategory retrieves a single category by ID.
func (s *MgmtService) GetCategory(ctx context.Context, id string) (*Category, error) {
	return s.repo.GetCategory(ctx, id)
}

// UpdateCategory updates an existing category.
func (s *MgmtService) UpdateCategory(ctx context.Context, c *Category) (*Category, error) {
	existing, err := s.repo.GetCategory(ctx, c.ID)
	if err != nil {
		return nil, fmt.Errorf("category not found")
	}
	if c.ContentType != "" {
		existing.ContentType = c.ContentType
	}
	if c.AgeGroup != "" {
		existing.AgeGroup = c.AgeGroup
	}
	if c.WeightClass != "" {
		existing.WeightClass = c.WeightClass
	}
	if c.Gender != "" {
		existing.Gender = c.Gender
	}
	if c.Name != "" {
		existing.Name = c.Name
	}
	if c.MaxAthletes > 0 {
		existing.MaxAthletes = c.MaxAthletes
	}
	if c.Status != "" {
		existing.Status = c.Status
	}
	existing.UpdatedAt = time.Now()
	if err := s.repo.UpdateCategory(ctx, existing); err != nil {
		return nil, err
	}
	return existing, nil
}

// DeleteCategory removes a category by ID.
func (s *MgmtService) DeleteCategory(ctx context.Context, id string) error {
	return s.repo.DeleteCategory(ctx, id)
}

// ── Registrations ───────────────────────────────────────────

// RegisterTeam creates a new team registration for a tournament.
func (s *MgmtService) RegisterTeam(ctx context.Context, r *Registration) (*Registration, error) {
	if r.TournamentID == "" {
		return nil, fmt.Errorf("tournament_id is required")
	}
	if r.TeamName == "" {
		return nil, fmt.Errorf("team_name is required")
	}
	r.ID = s.newUUID()
	r.Status = "nhap"
	now := time.Now()
	r.CreatedAt = now
	r.UpdatedAt = now
	if err := s.repo.CreateRegistration(ctx, r); err != nil {
		return nil, err
	}
	return r, nil
}

// ListRegistrations returns all registrations for a tournament.
func (s *MgmtService) ListRegistrations(ctx context.Context, tournamentID string) ([]*Registration, error) {
	return s.repo.ListRegistrations(ctx, tournamentID)
}

// GetRegistration retrieves a single registration by ID.
func (s *MgmtService) GetRegistration(ctx context.Context, id string) (*Registration, error) {
	return s.repo.GetRegistration(ctx, id)
}

// SubmitRegistration moves a registration from draft to pending approval.
func (s *MgmtService) SubmitRegistration(ctx context.Context, id string) error {
	reg, err := s.repo.GetRegistration(ctx, id)
	if err != nil {
		return fmt.Errorf("registration not found")
	}
	if reg.Status != "nhap" {
		return fmt.Errorf("registration must be in draft status to submit")
	}
	reg.Status = "cho_duyet"
	now := time.Now()
	reg.SubmittedAt = &now
	reg.UpdatedAt = now
	return s.repo.UpdateRegistration(ctx, reg)
}

// ApproveRegistration approves a pending registration.
func (s *MgmtService) ApproveRegistration(ctx context.Context, id, approverID string) error {
	reg, err := s.repo.GetRegistration(ctx, id)
	if err != nil {
		return fmt.Errorf("registration not found")
	}
	if reg.Status != "cho_duyet" {
		return fmt.Errorf("only pending registrations can be approved")
	}
	reg.Status = "da_duyet"
	reg.ApprovedBy = approverID
	now := time.Now()
	reg.ApprovedAt = &now
	reg.UpdatedAt = now
	return s.repo.UpdateRegistration(ctx, reg)
}

// RejectRegistration rejects a pending registration with a reason.
func (s *MgmtService) RejectRegistration(ctx context.Context, id, rejectorID, reason string) error {
	reg, err := s.repo.GetRegistration(ctx, id)
	if err != nil {
		return fmt.Errorf("registration not found")
	}
	if reg.Status != "cho_duyet" {
		return fmt.Errorf("only pending registrations can be rejected")
	}
	reg.Status = "tu_choi"
	reg.RejectedBy = rejectorID
	reg.RejectReason = reason
	reg.UpdatedAt = time.Now()
	return s.repo.UpdateRegistration(ctx, reg)
}

// AddAthleteToRegistration adds an athlete to a registration.
func (s *MgmtService) AddAthleteToRegistration(ctx context.Context, a *RegistrationAthlete) (*RegistrationAthlete, error) {
	if a.RegistrationID == "" {
		return nil, fmt.Errorf("registration_id is required")
	}
	if a.AthleteName == "" {
		return nil, fmt.Errorf("athlete_name is required")
	}
	a.ID = s.newUUID()
	if a.Status == "" {
		a.Status = "cho_xac_nhan"
	}
	a.CreatedAt = time.Now()
	if err := s.repo.AddRegistrationAthlete(ctx, a); err != nil {
		return nil, err
	}
	return a, nil
}

// ListRegistrationAthletes returns all athletes in a registration.
func (s *MgmtService) ListRegistrationAthletes(ctx context.Context, registrationID string) ([]*RegistrationAthlete, error) {
	return s.repo.ListRegistrationAthletes(ctx, registrationID)
}

// ── Schedule ────────────────────────────────────────────────

// CreateScheduleSlot creates a new schedule slot.
func (s *MgmtService) CreateScheduleSlot(ctx context.Context, slot *ScheduleSlot) (*ScheduleSlot, error) {
	if slot.TournamentID == "" {
		return nil, fmt.Errorf("tournament_id is required")
	}
	if slot.Date == "" {
		return nil, fmt.Errorf("date is required")
	}
	if slot.ArenaID == "" {
		return nil, fmt.Errorf("arena_id is required")
	}
	slot.ID = s.newUUID()
	if slot.Status == "" {
		slot.Status = "du_kien"
	}
	now := time.Now()
	slot.CreatedAt = now
	slot.UpdatedAt = now
	if err := s.repo.CreateScheduleSlot(ctx, slot); err != nil {
		return nil, err
	}
	return slot, nil
}

// ListScheduleSlots returns all schedule slots for a tournament.
func (s *MgmtService) ListScheduleSlots(ctx context.Context, tournamentID string) ([]*ScheduleSlot, error) {
	return s.repo.ListScheduleSlots(ctx, tournamentID)
}

// GetScheduleSlot retrieves a single schedule slot.
func (s *MgmtService) GetScheduleSlot(ctx context.Context, id string) (*ScheduleSlot, error) {
	return s.repo.GetScheduleSlot(ctx, id)
}

// UpdateScheduleSlot updates an existing schedule slot.
func (s *MgmtService) UpdateScheduleSlot(ctx context.Context, slot *ScheduleSlot) (*ScheduleSlot, error) {
	existing, err := s.repo.GetScheduleSlot(ctx, slot.ID)
	if err != nil {
		return nil, fmt.Errorf("schedule slot not found")
	}
	if slot.Date != "" {
		existing.Date = slot.Date
	}
	if slot.Session != "" {
		existing.Session = slot.Session
	}
	if slot.StartTime != "" {
		existing.StartTime = slot.StartTime
	}
	if slot.EndTime != "" {
		existing.EndTime = slot.EndTime
	}
	if slot.CategoryID != "" {
		existing.CategoryID = slot.CategoryID
		existing.CategoryName = slot.CategoryName
	}
	if slot.Status != "" {
		existing.Status = slot.Status
	}
	if slot.Notes != "" {
		existing.Notes = slot.Notes
	}
	existing.UpdatedAt = time.Now()
	if err := s.repo.UpdateScheduleSlot(ctx, existing); err != nil {
		return nil, err
	}
	return existing, nil
}

// DeleteScheduleSlot removes a schedule slot.
func (s *MgmtService) DeleteScheduleSlot(ctx context.Context, id string) error {
	return s.repo.DeleteScheduleSlot(ctx, id)
}

// ── Arena Assignments ───────────────────────────────────────

// AssignArena creates an arena assignment for a tournament.
func (s *MgmtService) AssignArena(ctx context.Context, a *ArenaAssignment) (*ArenaAssignment, error) {
	if a.TournamentID == "" {
		return nil, fmt.Errorf("tournament_id is required")
	}
	if a.ArenaID == "" {
		return nil, fmt.Errorf("arena_id is required")
	}
	a.ID = s.newUUID()
	a.IsActive = true
	a.CreatedAt = time.Now()
	if err := s.repo.CreateArenaAssignment(ctx, a); err != nil {
		return nil, err
	}
	return a, nil
}

// ListArenaAssignments returns all arena assignments for a tournament.
func (s *MgmtService) ListArenaAssignments(ctx context.Context, tournamentID string) ([]*ArenaAssignment, error) {
	return s.repo.ListArenaAssignments(ctx, tournamentID)
}

// RemoveArenaAssignment removes an arena assignment.
func (s *MgmtService) RemoveArenaAssignment(ctx context.Context, id string) error {
	return s.repo.DeleteArenaAssignment(ctx, id)
}

// ── Results ─────────────────────────────────────────────────

// RecordResult records a result for a content category.
func (s *MgmtService) RecordResult(ctx context.Context, r *TournamentResult) (*TournamentResult, error) {
	if r.TournamentID == "" {
		return nil, fmt.Errorf("tournament_id is required")
	}
	if r.CategoryID == "" {
		return nil, fmt.Errorf("category_id is required")
	}
	r.ID = s.newUUID()
	now := time.Now()
	r.CreatedAt = now
	r.UpdatedAt = now
	if err := s.repo.RecordResult(ctx, r); err != nil {
		return nil, err
	}
	return r, nil
}

// ListResults returns all results for a tournament.
func (s *MgmtService) ListResults(ctx context.Context, tournamentID string) ([]*TournamentResult, error) {
	return s.repo.ListResults(ctx, tournamentID)
}

// FinalizeResult marks a result as finalized.
func (s *MgmtService) FinalizeResult(ctx context.Context, id, userID string) error {
	result, err := s.repo.GetResult(ctx, id)
	if err != nil {
		return fmt.Errorf("result not found")
	}
	result.IsFinalized = true
	result.FinalizedBy = userID
	now := time.Now()
	result.FinalizedAt = &now
	result.UpdatedAt = now
	return s.repo.UpdateResult(ctx, result)
}

// ── Team Standings ──────────────────────────────────────────

// GetTeamStandings returns all team standings for a tournament, sorted by rank.
func (s *MgmtService) GetTeamStandings(ctx context.Context, tournamentID string) ([]*TeamStanding, error) {
	standings, err := s.repo.ListTeamStandings(ctx, tournamentID)
	if err != nil {
		return nil, err
	}
	sort.Slice(standings, func(i, j int) bool {
		return standings[i].Rank < standings[j].Rank
	})
	return standings, nil
}

// UpdateTeamStanding updates or creates a team standing entry.
func (s *MgmtService) UpdateTeamStanding(ctx context.Context, ts *TeamStanding) (*TeamStanding, error) {
	if ts.TournamentID == "" {
		return nil, fmt.Errorf("tournament_id is required")
	}
	if ts.TeamID == "" {
		return nil, fmt.Errorf("team_id is required")
	}
	if ts.ID == "" {
		ts.ID = s.newUUID()
	}
	ts.TotalMedals = ts.Gold + ts.Silver + ts.Bronze
	ts.UpdatedAt = time.Now()
	if err := s.repo.UpsertTeamStanding(ctx, ts); err != nil {
		return nil, err
	}
	return ts, nil
}

// ── Statistics ──────────────────────────────────────────────

// GetStats computes aggregated statistics for a tournament.
func (s *MgmtService) GetStats(ctx context.Context, tournamentID string) (*MgmtStats, error) {
	stats := &MgmtStats{}

	cats, err := s.repo.ListCategories(ctx, tournamentID)
	if err == nil {
		stats.TotalCategories = len(cats)
	}

	regs, err := s.repo.ListRegistrations(ctx, tournamentID)
	if err == nil {
		stats.TotalRegistrations = len(regs)
		for _, r := range regs {
			switch r.Status {
			case "cho_duyet":
				stats.PendingRegistrations++
			case "da_duyet":
				stats.ApprovedRegistrations++
			}
			stats.TotalAthletes += r.TotalAthletes
		}
		stats.TotalTeams = len(regs)
	}

	slots, err := s.repo.ListScheduleSlots(ctx, tournamentID)
	if err == nil {
		stats.TotalScheduleSlots = len(slots)
		for _, sl := range slots {
			if sl.Status == "hoan_thanh" {
				stats.CompletedSlots++
			}
		}
	}

	results, err := s.repo.ListResults(ctx, tournamentID)
	if err == nil {
		stats.TotalResults = len(results)
		for _, r := range results {
			if r.IsFinalized {
				stats.FinalizedResults++
			}
		}
	}

	standings, err := s.repo.ListTeamStandings(ctx, tournamentID)
	if err == nil {
		for _, ts := range standings {
			stats.TotalGold += ts.Gold
			stats.TotalSilver += ts.Silver
			stats.TotalBronze += ts.Bronze
		}
	}

	if stats.TotalCategories > 0 && stats.TotalResults > 0 {
		stats.CompletionRate = float64(stats.FinalizedResults) / float64(stats.TotalCategories) * 100
	}
	if stats.TotalRegistrations > 0 {
		stats.RegistrationRate = float64(stats.ApprovedRegistrations) / float64(stats.TotalRegistrations) * 100
	}

	return stats, nil
}
