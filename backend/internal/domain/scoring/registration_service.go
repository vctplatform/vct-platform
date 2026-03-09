package scoring

import (
	"context"
	"fmt"

	"vct-platform/backend/internal/domain"
)

// RegistrationService provides business logic for athlete event registrations.
type RegistrationService struct {
	repo RegistrationRepository
}

// NewRegistrationService creates a new registration service.
func NewRegistrationService(repo RegistrationRepository) *RegistrationService {
	return &RegistrationService{repo: repo}
}

// ListRegistrations returns all registrations.
func (s *RegistrationService) ListRegistrations(ctx context.Context) ([]domain.Registration, error) {
	return s.repo.List(ctx)
}

// GetRegistration returns a single registration by ID.
func (s *RegistrationService) GetRegistration(ctx context.Context, id string) (*domain.Registration, error) {
	return s.repo.GetByID(ctx, id)
}

// CreateRegistration validates and creates a new registration.
func (s *RegistrationService) CreateRegistration(ctx context.Context, reg domain.Registration) (*domain.Registration, error) {
	if reg.VdvID == "" {
		return nil, fmt.Errorf("vdv_id (mã VĐV) is required")
	}
	if reg.NdID == "" {
		return nil, fmt.Errorf("nd_id (mã nội dung) is required")
	}
	if reg.TrangThai == "" {
		reg.TrangThai = "cho_duyet"
	}
	return s.repo.Create(ctx, reg)
}

// UpdateRegistration applies a partial update to a registration.
func (s *RegistrationService) UpdateRegistration(ctx context.Context, id string, patch map[string]interface{}) (*domain.Registration, error) {
	return s.repo.Update(ctx, id, patch)
}

// DeleteRegistration removes a registration.
func (s *RegistrationService) DeleteRegistration(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

// ListByAthlete returns registrations for a specific athlete.
func (s *RegistrationService) ListByAthlete(ctx context.Context, athleteID string) ([]domain.Registration, error) {
	return s.repo.ListByAthlete(ctx, athleteID)
}

// ListByTournament returns registrations for a specific tournament.
func (s *RegistrationService) ListByTournament(ctx context.Context, tournamentID string) ([]domain.Registration, error) {
	return s.repo.ListByTournament(ctx, tournamentID)
}
