package international

import (
	"context"
	"testing"
)

// ═══════════════════════════════════════════════════════════════
// INTERNATIONAL DOMAIN — UNIT TESTS
// Tests for PartnerOrganization, InternationalEvent, and
// Delegation service operations using in-memory repos.
// ═══════════════════════════════════════════════════════════════

// ── In-memory repos (test doubles) ───────────────────────────

type testPartnerRepo struct {
	data map[string]PartnerOrganization
	seq  int
}

func newTestPartnerRepo() *testPartnerRepo {
	return &testPartnerRepo{data: make(map[string]PartnerOrganization)}
}
func (r *testPartnerRepo) Create(_ context.Context, p PartnerOrganization) (*PartnerOrganization, error) {
	r.seq++
	if p.ID == "" {
		p.ID = "p-" + string(rune('0'+r.seq))
	}
	r.data[p.ID] = p
	return &p, nil
}
func (r *testPartnerRepo) GetByID(_ context.Context, id string) (*PartnerOrganization, error) {
	p, ok := r.data[id]
	if !ok {
		return nil, errNotFound
	}
	return &p, nil
}
func (r *testPartnerRepo) List(_ context.Context) ([]PartnerOrganization, error) {
	out := make([]PartnerOrganization, 0, len(r.data))
	for _, p := range r.data {
		out = append(out, p)
	}
	return out, nil
}
func (r *testPartnerRepo) ListByCountry(_ context.Context, c string) ([]PartnerOrganization, error) {
	var out []PartnerOrganization
	for _, p := range r.data {
		if p.Country == c {
			out = append(out, p)
		}
	}
	return out, nil
}
func (r *testPartnerRepo) Update(_ context.Context, id string, p PartnerOrganization) (*PartnerOrganization, error) {
	if _, ok := r.data[id]; !ok {
		return nil, errNotFound
	}
	p.ID = id
	r.data[id] = p
	return &p, nil
}

type testEventRepo struct {
	data map[string]InternationalEvent
	seq  int
}

func newTestEventRepo() *testEventRepo {
	return &testEventRepo{data: make(map[string]InternationalEvent)}
}
func (r *testEventRepo) Create(_ context.Context, e InternationalEvent) (*InternationalEvent, error) {
	r.seq++
	if e.ID == "" {
		e.ID = "e-" + string(rune('0'+r.seq))
	}
	r.data[e.ID] = e
	return &e, nil
}
func (r *testEventRepo) GetByID(_ context.Context, id string) (*InternationalEvent, error) {
	e, ok := r.data[id]
	if !ok {
		return nil, errNotFound
	}
	return &e, nil
}
func (r *testEventRepo) List(_ context.Context) ([]InternationalEvent, error) {
	out := make([]InternationalEvent, 0, len(r.data))
	for _, e := range r.data {
		out = append(out, e)
	}
	return out, nil
}
func (r *testEventRepo) ListUpcoming(_ context.Context) ([]InternationalEvent, error) {
	return r.List(context.Background())
}

type testDelegRepo struct {
	data map[string]Delegation
	seq  int
}

func newTestDelegRepo() *testDelegRepo { return &testDelegRepo{data: make(map[string]Delegation)} }
func (r *testDelegRepo) Create(_ context.Context, d Delegation) (*Delegation, error) {
	r.seq++
	if d.ID == "" {
		d.ID = "d-" + string(rune('0'+r.seq))
	}
	r.data[d.ID] = d
	return &d, nil
}
func (r *testDelegRepo) GetByID(_ context.Context, id string) (*Delegation, error) {
	d, ok := r.data[id]
	if !ok {
		return nil, errNotFound
	}
	return &d, nil
}
func (r *testDelegRepo) ListByEvent(_ context.Context, eid string) ([]Delegation, error) {
	var out []Delegation
	for _, d := range r.data {
		if d.EventID == eid {
			out = append(out, d)
		}
	}
	return out, nil
}
func (r *testDelegRepo) Update(_ context.Context, id string, d Delegation) (*Delegation, error) {
	if _, ok := r.data[id]; !ok {
		return nil, errNotFound
	}
	d.ID = id
	r.data[id] = d
	return &d, nil
}

var errNotFound = func() error { return &notFoundErr{} }()

type notFoundErr struct{}

func (e *notFoundErr) Error() string { return "not found" }

func newTestService() *Service {
	return NewService(newTestPartnerRepo(), newTestEventRepo(), newTestDelegRepo())
}

// ── Partner Tests ────────────────────────────────────────────

func TestCreatePartner(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()

	p, err := svc.CreatePartner(ctx, PartnerOrganization{Name: "WVVF", Country: "International"})
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if p.ID == "" {
		t.Error("expected ID to be assigned")
	}
	if p.Status != PartnerPending {
		t.Errorf("expected status pending, got %s", p.Status)
	}
	if p.CreatedAt.IsZero() {
		t.Error("expected CreatedAt to be set")
	}
}

func TestCreatePartner_Validation(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()

	_, err := svc.CreatePartner(ctx, PartnerOrganization{})
	if err == nil {
		t.Error("expected error for empty name and country")
	}

	_, err = svc.CreatePartner(ctx, PartnerOrganization{Name: "Test"})
	if err == nil {
		t.Error("expected error for empty country")
	}
}

func TestListPartnersByCountry(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()

	svc.CreatePartner(ctx, PartnerOrganization{Name: "French VVF", Country: "France"})
	svc.CreatePartner(ctx, PartnerOrganization{Name: "Japan VCT", Country: "Japan"})
	svc.CreatePartner(ctx, PartnerOrganization{Name: "French MA", Country: "France"})

	list, err := svc.ListPartnersByCountry(ctx, "France")
	if err != nil {
		t.Fatal(err)
	}
	if len(list) != 2 {
		t.Errorf("expected 2 French partners, got %d", len(list))
	}
}

// ── Event Tests ──────────────────────────────────────────────

func TestCreateEvent(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()

	e, err := svc.CreateEvent(ctx, InternationalEvent{Name: "World Championship", HostCountry: "France", EventType: EventCompetition})
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if e.Status != "planned" {
		t.Errorf("expected status planned, got %s", e.Status)
	}
}

func TestCreateEvent_Validation(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()

	_, err := svc.CreateEvent(ctx, InternationalEvent{})
	if err == nil {
		t.Error("expected error for empty name")
	}
}

func TestListEvents(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()

	svc.CreateEvent(ctx, InternationalEvent{Name: "Event 1", HostCountry: "VN"})
	svc.CreateEvent(ctx, InternationalEvent{Name: "Event 2", HostCountry: "JP"})

	list, err := svc.ListEvents(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if len(list) != 2 {
		t.Errorf("expected 2 events, got %d", len(list))
	}
}

// ── Delegation Tests ─────────────────────────────────────────

func TestCreateDelegation(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()

	d, err := svc.CreateDelegation(ctx, Delegation{EventID: "e1", TeamName: "Vietnam A"})
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if d.Status != DelegationPlanning {
		t.Errorf("expected status planning, got %s", d.Status)
	}
}

func TestCreateDelegation_Validation(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()

	_, err := svc.CreateDelegation(ctx, Delegation{})
	if err == nil {
		t.Error("expected error for empty event_id and team_name")
	}
}

func TestListDelegationsByEvent(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()

	svc.CreateDelegation(ctx, Delegation{EventID: "e1", TeamName: "VN-A"})
	svc.CreateDelegation(ctx, Delegation{EventID: "e1", TeamName: "VN-B"})
	svc.CreateDelegation(ctx, Delegation{EventID: "e2", TeamName: "VN-C"})

	list, err := svc.ListDelegationsByEvent(ctx, "e1")
	if err != nil {
		t.Fatal(err)
	}
	if len(list) != 2 {
		t.Errorf("expected 2 delegations for e1, got %d", len(list))
	}
}
