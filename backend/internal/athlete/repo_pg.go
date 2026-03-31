package athlete

import (
	"context"
	"encoding/json"
	"fmt"

	"vct-platform/backend/internal/domain"
	"vct-platform/backend/internal/domain/athlete"
	"vct-platform/backend/internal/store"
)

type repoPg struct {
	dbStore *store.PostgresStore
}

func NewPgRepository(dbStore *store.PostgresStore) athlete.Repository {
	return &repoPg{dbStore: dbStore}
}

func (r *repoPg) List(ctx context.Context) ([]domain.Athlete, error) {
	// Search with no query fetches all (limit 1000 for safety)
	coreAthletes, err := r.dbStore.CoreSearchAthletes(ctx, "", "", 1000)
	if err != nil {
		return nil, err
	}

	athletes := make([]domain.Athlete, len(coreAthletes))
	for i, a := range coreAthletes {
		athletes[i] = r.mapCoreToDomain(&a)
	}
	return athletes, nil
}

func (r *repoPg) GetByID(ctx context.Context, id string) (*domain.Athlete, error) {
	coreAthlete, err := r.dbStore.CoreGetAthleteByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if coreAthlete == nil {
		return nil, nil // not found
	}

	domainAthlete := r.mapCoreToDomain(coreAthlete)
	return &domainAthlete, nil
}

func (r *repoPg) Create(ctx context.Context, a domain.Athlete) (*domain.Athlete, error) {
	// Triggers Event Sourcing logic inside store and audit trails.
	var dobStr string
	if a.NgaySinh != "" {
		dobStr = a.NgaySinh // Assuming domain already has YYYY-MM-DD
	} else {
		dobStr = "2000-01-01" // dummy fallback for NOT NULL
	}

	var genderPtr *string
	if a.Gioi != "" {
		genderStr := string(a.Gioi)
		genderPtr = &genderStr
	}

	coreAthlete := &store.CoreAthlete{
		FullName: a.HoTen,
		DOB:      dobStr,
		Gender:   genderPtr,
		Status:   "ACTIVE", // Default
	}

	if err := r.dbStore.CoreCreateAthlete(ctx, coreAthlete); err != nil {
		return nil, err
	}
	
	// EVENT SOURCING HOOK: Log athlete creation
	payloadBytes, _ := json.Marshal(map[string]any{
		"athlete_id":   coreAthlete.ID,
		"full_name":    coreAthlete.FullName,
		"dob":          coreAthlete.DOB,
		"status":       coreAthlete.Status,
	})
	
	schemaStr := "core"
	_ = r.dbStore.CoreLogEvent(ctx, &store.CoreEventLog{
		EventType:    "ATHLETE_CREATED",
		EntityType:   "athlete",
		EntityID:     coreAthlete.ID,
		Payload:      payloadBytes,
		SourceSchema: &schemaStr,
	})
	
	createdDomain := r.mapCoreToDomain(coreAthlete)
	return &createdDomain, nil
}

func (r *repoPg) mapCoreToDomain(c *store.CoreAthlete) domain.Athlete {
	var gioi domain.GioiTinh
	if c.Gender != nil {
		gioi = domain.GioiTinh(*c.Gender)
	}

	var dbNgaySinh string
	if c.DOB != "" {
		dbNgaySinh = c.DOB
	}

	return domain.Athlete{
		ID:        c.ID,
		HoTen:     c.FullName,
		NgaySinh:  dbNgaySinh,
		Gioi:      gioi,
		TrangThai: domain.TrangThaiVDV(c.Status),
		CreatedAt: c.CreatedAt,
		UpdatedAt: c.UpdatedAt,
	}
}

func (r *repoPg) Update(ctx context.Context, id string, patch map[string]interface{}) (*domain.Athlete, error) {
	return nil, fmt.Errorf("postgres Update not yet fully implemented via core_store")
}

func (r *repoPg) Delete(ctx context.Context, id string) error {
	return fmt.Errorf("postgres Delete not yet implemented")
}

func (r *repoPg) ListByTeam(ctx context.Context, teamID string) ([]domain.Athlete, error) {
	return []domain.Athlete{}, nil
}

func (r *repoPg) ListByTournament(ctx context.Context, tournamentID string) ([]domain.Athlete, error) {
	return []domain.Athlete{}, nil
}
