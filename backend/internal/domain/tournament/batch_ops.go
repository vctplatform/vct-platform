package tournament

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Batch Operations for Tournament Management
// Bulk approve/reject registrations, bulk result import, etc.
// ═══════════════════════════════════════════════════════════════

import (
	"context"
	"fmt"
	"time"
)

// BatchResult captures the outcome of a batch operation.
type BatchResult struct {
	Total    int            `json:"total"`
	Success  int            `json:"success"`
	Failed   int            `json:"failed"`
	Errors   []BatchError   `json:"errors,omitempty"`
}

// BatchError details a single failure in a batch operation.
type BatchError struct {
	ItemID  string `json:"item_id"`
	Message string `json:"message"`
}

// BatchApproveRegistrations approves multiple registrations at once.
func (s *MgmtService) BatchApproveRegistrations(ctx context.Context, tournamentID string, ids []string, approvedBy string) (*BatchResult, error) {
	result := &BatchResult{Total: len(ids)}
	now := time.Now()

	for _, id := range ids {
		reg, err := s.repo.GetRegistration(ctx, id)
		if err != nil {
			result.Failed++
			result.Errors = append(result.Errors, BatchError{ItemID: id, Message: fmt.Sprintf("không tìm thấy: %v", err)})
			continue
		}
		if reg.Status != "cho_duyet" {
			result.Failed++
			result.Errors = append(result.Errors, BatchError{ItemID: id, Message: fmt.Sprintf("trạng thái không hợp lệ: %s", reg.Status)})
			continue
		}
		reg.Status = "da_duyet"
		reg.ApprovedBy = approvedBy
		reg.ApprovedAt = &now
		if err := s.repo.UpdateRegistration(ctx, reg); err != nil {
			result.Failed++
			result.Errors = append(result.Errors, BatchError{ItemID: id, Message: err.Error()})
			continue
		}
		result.Success++
	}

	return result, nil
}

// BatchRejectRegistrations rejects multiple registrations at once.
func (s *MgmtService) BatchRejectRegistrations(ctx context.Context, tournamentID string, ids []string, rejectedBy, reason string) (*BatchResult, error) {
	result := &BatchResult{Total: len(ids)}

	for _, id := range ids {
		reg, err := s.repo.GetRegistration(ctx, id)
		if err != nil {
			result.Failed++
			result.Errors = append(result.Errors, BatchError{ItemID: id, Message: fmt.Sprintf("không tìm thấy: %v", err)})
			continue
		}
		if reg.Status != "cho_duyet" {
			result.Failed++
			result.Errors = append(result.Errors, BatchError{ItemID: id, Message: fmt.Sprintf("trạng thái không hợp lệ: %s", reg.Status)})
			continue
		}
		reg.Status = "tu_choi"
		reg.RejectedBy = rejectedBy
		reg.RejectReason = reason
		if err := s.repo.UpdateRegistration(ctx, reg); err != nil {
			result.Failed++
			result.Errors = append(result.Errors, BatchError{ItemID: id, Message: err.Error()})
			continue
		}
		result.Success++
	}

	return result, nil
}

// BatchRecordResults records multiple tournament results at once.
func (s *MgmtService) BatchRecordResults(ctx context.Context, results []*TournamentResult) (*BatchResult, error) {
	br := &BatchResult{Total: len(results)}

	for _, r := range results {
		if errs := ValidateResult(r); errs.HasErrors() {
			br.Failed++
			br.Errors = append(br.Errors, BatchError{ItemID: r.CategoryID, Message: errs.Error()})
			continue
		}
		if r.ID == "" {
			r.ID = s.newUUID()
		}
		if err := s.repo.RecordResult(ctx, r); err != nil {
			br.Failed++
			br.Errors = append(br.Errors, BatchError{ItemID: r.CategoryID, Message: err.Error()})
			continue
		}
		br.Success++
	}

	return br, nil
}

// BatchFinalizeResults finalizes multiple results at once.
func (s *MgmtService) BatchFinalizeResults(ctx context.Context, tournamentID string, ids []string, finalizedBy string) (*BatchResult, error) {
	br := &BatchResult{Total: len(ids)}
	now := time.Now()

	for _, id := range ids {
		r, err := s.repo.GetResult(ctx, id)
		if err != nil {
			br.Failed++
			br.Errors = append(br.Errors, BatchError{ItemID: id, Message: fmt.Sprintf("không tìm thấy: %v", err)})
			continue
		}
		if r.IsFinalized {
			br.Failed++
			br.Errors = append(br.Errors, BatchError{ItemID: id, Message: "đã xác nhận trước đó"})
			continue
		}
		r.IsFinalized = true
		r.FinalizedBy = finalizedBy
		r.FinalizedAt = &now
		if err := s.repo.UpdateResult(ctx, r); err != nil {
			br.Failed++
			br.Errors = append(br.Errors, BatchError{ItemID: id, Message: err.Error()})
			continue
		}
		br.Success++
	}

	return br, nil
}

// RecalculateTeamStandings recalculates all team standings from results.
func (s *MgmtService) RecalculateTeamStandings(ctx context.Context, tournamentID string) ([]*TeamStanding, error) {
	results, err := s.repo.ListResults(ctx, tournamentID)
	if err != nil {
		return nil, err
	}

	// Aggregate medals by team
	teamMap := make(map[string]*TeamStanding)
	for _, r := range results {
		if !r.IsFinalized {
			continue
		}
		// Gold
		if r.GoldTeam != "" {
			ts := getOrCreateStanding(teamMap, tournamentID, r.GoldTeam)
			ts.Gold++
			ts.TotalMedals++
			ts.Points += 7
		}
		// Silver
		if r.SilverTeam != "" {
			ts := getOrCreateStanding(teamMap, tournamentID, r.SilverTeam)
			ts.Silver++
			ts.TotalMedals++
			ts.Points += 5
		}
		// Bronze 1
		if r.Bronze1Team != "" {
			ts := getOrCreateStanding(teamMap, tournamentID, r.Bronze1Team)
			ts.Bronze++
			ts.TotalMedals++
			ts.Points += 3
		}
		// Bronze 2
		if r.Bronze2Team != "" {
			ts := getOrCreateStanding(teamMap, tournamentID, r.Bronze2Team)
			ts.Bronze++
			ts.TotalMedals++
			ts.Points += 3
		}
	}

	// Convert to slice and rank
	standings := make([]*TeamStanding, 0, len(teamMap))
	for _, ts := range teamMap {
		standings = append(standings, ts)
	}
	sortStandings(standings)
	for i := range standings {
		standings[i].Rank = i + 1
	}

	// Upsert all standings
	for _, st := range standings {
		if err := s.repo.UpsertTeamStanding(ctx, st); err != nil {
			return nil, err
		}
	}

	return standings, nil
}

func getOrCreateStanding(m map[string]*TeamStanding, tournamentID, teamName string) *TeamStanding {
	if ts, ok := m[teamName]; ok {
		return ts
	}
	ts := &TeamStanding{
		ID:           fmt.Sprintf("ts_%s_%s", tournamentID, teamName),
		TournamentID: tournamentID,
		TeamID:       teamName,
		TeamName:     teamName,
	}
	m[teamName] = ts
	return ts
}

func sortStandings(standings []*TeamStanding) {
	// Simple bubble sort for correctness (small N)
	for i := 0; i < len(standings); i++ {
		for j := i + 1; j < len(standings); j++ {
			if shouldRankHigher(standings[j], standings[i]) {
				standings[i], standings[j] = standings[j], standings[i]
			}
		}
	}
}

func shouldRankHigher(a, b *TeamStanding) bool {
	if a.Points != b.Points {
		return a.Points > b.Points
	}
	if a.Gold != b.Gold {
		return a.Gold > b.Gold
	}
	if a.Silver != b.Silver {
		return a.Silver > b.Silver
	}
	return a.Bronze > b.Bronze
}
