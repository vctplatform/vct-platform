package adapter

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — TOURNAMENT MANAGEMENT IN-MEMORY STORE
// Implements tournament.MgmtRepository for dev/test
// ═══════════════════════════════════════════════════════════════

import (
	"context"
	"fmt"
	"sync"

	"vct-platform/backend/internal/domain/tournament"
)

// InMemTournamentMgmtStore is an in-memory implementation of tournament.MgmtRepository.
type InMemTournamentMgmtStore struct {
	mu           sync.RWMutex
	categories   map[string]*tournament.Category
	registrations map[string]*tournament.Registration
	regAthletes  map[string]*tournament.RegistrationAthlete
	scheduleSlots map[string]*tournament.ScheduleSlot
	arenaAssigns map[string]*tournament.ArenaAssignment
	results      map[string]*tournament.TournamentResult
	standings    map[string]*tournament.TeamStanding
}

// NewInMemTournamentMgmtStore creates a new in-memory store.
func NewInMemTournamentMgmtStore() *InMemTournamentMgmtStore {
	return &InMemTournamentMgmtStore{
		categories:    make(map[string]*tournament.Category),
		registrations: make(map[string]*tournament.Registration),
		regAthletes:   make(map[string]*tournament.RegistrationAthlete),
		scheduleSlots: make(map[string]*tournament.ScheduleSlot),
		arenaAssigns:  make(map[string]*tournament.ArenaAssignment),
		results:       make(map[string]*tournament.TournamentResult),
		standings:     make(map[string]*tournament.TeamStanding),
	}
}

// ── Categories ──────────────────────────────────────────────

func (s *InMemTournamentMgmtStore) CreateCategory(_ context.Context, c *tournament.Category) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.categories[c.ID] = c
	return nil
}

func (s *InMemTournamentMgmtStore) GetCategory(_ context.Context, id string) (*tournament.Category, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	c, ok := s.categories[id]
	if !ok {
		return nil, fmt.Errorf("category %s not found", id)
	}
	return c, nil
}

func (s *InMemTournamentMgmtStore) UpdateCategory(_ context.Context, c *tournament.Category) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.categories[c.ID]; !ok {
		return fmt.Errorf("category %s not found", c.ID)
	}
	s.categories[c.ID] = c
	return nil
}

func (s *InMemTournamentMgmtStore) DeleteCategory(_ context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.categories, id)
	return nil
}

func (s *InMemTournamentMgmtStore) ListCategories(_ context.Context, tournamentID string) ([]*tournament.Category, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []*tournament.Category
	for _, c := range s.categories {
		if c.TournamentID == tournamentID {
			result = append(result, c)
		}
	}
	return result, nil
}

// ── Registrations ───────────────────────────────────────────

func (s *InMemTournamentMgmtStore) CreateRegistration(_ context.Context, r *tournament.Registration) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.registrations[r.ID] = r
	return nil
}

func (s *InMemTournamentMgmtStore) GetRegistration(_ context.Context, id string) (*tournament.Registration, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	r, ok := s.registrations[id]
	if !ok {
		return nil, fmt.Errorf("registration %s not found", id)
	}
	return r, nil
}

func (s *InMemTournamentMgmtStore) UpdateRegistration(_ context.Context, r *tournament.Registration) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.registrations[r.ID]; !ok {
		return fmt.Errorf("registration %s not found", r.ID)
	}
	s.registrations[r.ID] = r
	return nil
}

func (s *InMemTournamentMgmtStore) ListRegistrations(_ context.Context, tournamentID string) ([]*tournament.Registration, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []*tournament.Registration
	for _, r := range s.registrations {
		if r.TournamentID == tournamentID {
			result = append(result, r)
		}
	}
	return result, nil
}

// ── Registration Athletes ───────────────────────────────────

func (s *InMemTournamentMgmtStore) AddRegistrationAthlete(_ context.Context, a *tournament.RegistrationAthlete) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.regAthletes[a.ID] = a
	return nil
}

func (s *InMemTournamentMgmtStore) ListRegistrationAthletes(_ context.Context, registrationID string) ([]*tournament.RegistrationAthlete, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []*tournament.RegistrationAthlete
	for _, a := range s.regAthletes {
		if a.RegistrationID == registrationID {
			result = append(result, a)
		}
	}
	return result, nil
}

// ── Schedule Slots ──────────────────────────────────────────

func (s *InMemTournamentMgmtStore) CreateScheduleSlot(_ context.Context, slot *tournament.ScheduleSlot) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.scheduleSlots[slot.ID] = slot
	return nil
}

func (s *InMemTournamentMgmtStore) GetScheduleSlot(_ context.Context, id string) (*tournament.ScheduleSlot, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	slot, ok := s.scheduleSlots[id]
	if !ok {
		return nil, fmt.Errorf("schedule slot %s not found", id)
	}
	return slot, nil
}

func (s *InMemTournamentMgmtStore) UpdateScheduleSlot(_ context.Context, slot *tournament.ScheduleSlot) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.scheduleSlots[slot.ID]; !ok {
		return fmt.Errorf("schedule slot %s not found", slot.ID)
	}
	s.scheduleSlots[slot.ID] = slot
	return nil
}

func (s *InMemTournamentMgmtStore) DeleteScheduleSlot(_ context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.scheduleSlots, id)
	return nil
}

func (s *InMemTournamentMgmtStore) ListScheduleSlots(_ context.Context, tournamentID string) ([]*tournament.ScheduleSlot, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []*tournament.ScheduleSlot
	for _, slot := range s.scheduleSlots {
		if slot.TournamentID == tournamentID {
			result = append(result, slot)
		}
	}
	return result, nil
}

// ── Arena Assignments ───────────────────────────────────────

func (s *InMemTournamentMgmtStore) CreateArenaAssignment(_ context.Context, a *tournament.ArenaAssignment) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.arenaAssigns[a.ID] = a
	return nil
}

func (s *InMemTournamentMgmtStore) ListArenaAssignments(_ context.Context, tournamentID string) ([]*tournament.ArenaAssignment, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []*tournament.ArenaAssignment
	for _, a := range s.arenaAssigns {
		if a.TournamentID == tournamentID {
			result = append(result, a)
		}
	}
	return result, nil
}

func (s *InMemTournamentMgmtStore) DeleteArenaAssignment(_ context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.arenaAssigns, id)
	return nil
}

// ── Results ─────────────────────────────────────────────────

func (s *InMemTournamentMgmtStore) RecordResult(_ context.Context, r *tournament.TournamentResult) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.results[r.ID] = r
	return nil
}

func (s *InMemTournamentMgmtStore) GetResult(_ context.Context, id string) (*tournament.TournamentResult, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	r, ok := s.results[id]
	if !ok {
		return nil, fmt.Errorf("result %s not found", id)
	}
	return r, nil
}

func (s *InMemTournamentMgmtStore) UpdateResult(_ context.Context, r *tournament.TournamentResult) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.results[r.ID]; !ok {
		return fmt.Errorf("result %s not found", r.ID)
	}
	s.results[r.ID] = r
	return nil
}

func (s *InMemTournamentMgmtStore) ListResults(_ context.Context, tournamentID string) ([]*tournament.TournamentResult, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []*tournament.TournamentResult
	for _, r := range s.results {
		if r.TournamentID == tournamentID {
			result = append(result, r)
		}
	}
	return result, nil
}

// ── Team Standings ──────────────────────────────────────────

func (s *InMemTournamentMgmtStore) UpsertTeamStanding(_ context.Context, ts *tournament.TeamStanding) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.standings[ts.ID] = ts
	return nil
}

func (s *InMemTournamentMgmtStore) ListTeamStandings(_ context.Context, tournamentID string) ([]*tournament.TeamStanding, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []*tournament.TeamStanding
	for _, ts := range s.standings {
		if ts.TournamentID == tournamentID {
			result = append(result, ts)
		}
	}
	return result, nil
}
