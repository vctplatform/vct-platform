package tournament

import (
	"context"
	"fmt"
)

// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — TOURNAMENT SERVICE (Business Logic)
// ════════════════════════════════════════════════════════════════

// Service contains the business logic for tournament operations.
type Service struct {
	repo Repository
}

// NewService creates a new tournament service with the given repository.
func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

// CreateTournament validates and creates a new tournament.
func (s *Service) CreateTournament(ctx context.Context, t *Tournament) error {
	if t.Name == "" {
		return fmt.Errorf("tournament name is required")
	}
	if t.StartDate.After(t.EndDate) {
		return fmt.Errorf("start date must be before end date")
	}
	t.Status = "nhap"
	return s.repo.Create(ctx, t)
}

// GetTournament retrieves a tournament by ID.
func (s *Service) GetTournament(ctx context.Context, id string) (*Tournament, error) {
	return s.repo.GetByID(ctx, id)
}

// ListTournaments retrieves a paginated list of tournaments.
func (s *Service) ListTournaments(ctx context.Context, filter ListFilter) ([]*Tournament, int, error) {
	if filter.PageSize <= 0 {
		filter.PageSize = 20
	}
	if filter.Page <= 0 {
		filter.Page = 1
	}
	return s.repo.List(ctx, filter)
}

// RecordMatchEvent appends an event to the match event log (Event Sourcing).
func (s *Service) RecordMatchEvent(ctx context.Context, event *MatchEvent) error {
	if event.MatchID == "" {
		return fmt.Errorf("match_id is required")
	}
	if event.EventType == "" {
		return fmt.Errorf("event_type is required")
	}
	return s.repo.AppendEvent(ctx, event)
}
