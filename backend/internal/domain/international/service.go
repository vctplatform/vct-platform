package international

import (
	"context"
	"fmt"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — INTERNATIONAL RELATIONS DOMAIN
// Manages partner organizations, international events,
// delegations, and cultural exchange programs.
// ═══════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────

type PartnerStatus string

const (
	PartnerActive   PartnerStatus = "active"
	PartnerInactive PartnerStatus = "inactive"
	PartnerPending  PartnerStatus = "pending"
)

type EventType string

const (
	EventCompetition EventType = "competition"
	EventSeminar     EventType = "seminar"
	EventExhibition  EventType = "exhibition"
	EventExchange    EventType = "exchange"
	EventConference  EventType = "conference"
)

type DelegationType string

const (
	DelegationOutbound DelegationType = "outbound" // VN đi nước ngoài
	DelegationInbound  DelegationType = "inbound"  // Nước ngoài đến VN
)

type DelegationStatus string

const (
	DelegationPlanning  DelegationStatus = "planning"
	DelegationApproved  DelegationStatus = "approved"
	DelegationActive    DelegationStatus = "active"
	DelegationCompleted DelegationStatus = "completed"
	DelegationCancelled DelegationStatus = "cancelled"
)

// ── Models ───────────────────────────────────────────────────

// PartnerOrganization represents an international partner federation or org.
type PartnerOrganization struct {
	ID           string        `json:"id"`
	Name         string        `json:"name"`
	Country      string        `json:"country"`
	CountryCode  string        `json:"country_code"`
	OrgType      string        `json:"org_type"` // federation, university, cultural_center
	Website      string        `json:"website,omitempty"`
	ContactName  string        `json:"contact_name,omitempty"`
	ContactEmail string        `json:"contact_email,omitempty"`
	ContactPhone string        `json:"contact_phone,omitempty"`
	Description  string        `json:"description,omitempty"`
	Status       PartnerStatus `json:"status"`
	PartnerSince *time.Time    `json:"partner_since,omitempty"`
	MouSigned    bool          `json:"mou_signed"`
	MouExpiry    *time.Time    `json:"mou_expiry,omitempty"`
	LogoURL      string        `json:"logo_url,omitempty"`
	CreatedAt    time.Time     `json:"created_at"`
	UpdatedAt    time.Time     `json:"updated_at"`
}

// InternationalEvent represents a competition, seminar, or exchange event.
type InternationalEvent struct {
	ID                   string     `json:"id"`
	Name                 string     `json:"name"`
	EventType            EventType  `json:"event_type"`
	HostCountry          string     `json:"host_country"`
	HostCity             string     `json:"host_city,omitempty"`
	HostOrg              string     `json:"host_org,omitempty"`
	PartnerOrgID         string     `json:"partner_org_id,omitempty"`
	StartDate            time.Time  `json:"start_date"`
	EndDate              time.Time  `json:"end_date"`
	Description          string     `json:"description,omitempty"`
	MaxDelegates         int        `json:"max_delegates,omitempty"`
	RegistrationDeadline *time.Time `json:"registration_deadline,omitempty"`
	Status               string     `json:"status"` // planned, confirmed, ongoing, completed, cancelled
	Budget               float64    `json:"budget,omitempty"`
	CreatedAt            time.Time  `json:"created_at"`
}

// Delegation represents a group traveling for an international event.
type Delegation struct {
	ID               string             `json:"id"`
	EventID          string             `json:"event_id"`
	DelegationType   DelegationType     `json:"delegation_type"`
	TeamName         string             `json:"team_name"`
	HeadOfDelegation string             `json:"head_of_delegation"`
	Status           DelegationStatus   `json:"delegation_status"`
	Members          []DelegationMember `json:"members,omitempty"`
	DepartureDate    *time.Time         `json:"departure_date,omitempty"`
	ReturnDate       *time.Time         `json:"return_date,omitempty"`
	TotalBudget      float64            `json:"total_budget,omitempty"`
	Notes            string             `json:"notes,omitempty"`
	CreatedAt        time.Time          `json:"created_at"`
	UpdatedAt        time.Time          `json:"updated_at"`
}

// DelegationMember is a person in a delegation.
type DelegationMember struct {
	ID         string `json:"id"`
	PersonName string `json:"person_name"`
	Role       string `json:"role"` // athlete, coach, referee, official, observer
	AthleteID  string `json:"athlete_id,omitempty"`
	PassportNo string `json:"passport_no,omitempty"`
	VisaStatus string `json:"visa_status,omitempty"` // pending, approved, rejected
}

// CulturalExchange tracks ongoing exchange programs.
type CulturalExchange struct {
	ID           string    `json:"id"`
	PartnerID    string    `json:"partner_id"`
	ProgramName  string    `json:"program_name"`
	Description  string    `json:"description,omitempty"`
	StartDate    time.Time `json:"start_date"`
	EndDate      time.Time `json:"end_date"`
	Status       string    `json:"status"` // active, completed, suspended
	Participants int       `json:"participants"`
	CreatedAt    time.Time `json:"created_at"`
}

// ── Repository Interfaces ────────────────────────────────────

type PartnerRepository interface {
	Create(ctx context.Context, partner PartnerOrganization) (*PartnerOrganization, error)
	GetByID(ctx context.Context, id string) (*PartnerOrganization, error)
	List(ctx context.Context) ([]PartnerOrganization, error)
	ListByCountry(ctx context.Context, country string) ([]PartnerOrganization, error)
	Update(ctx context.Context, id string, partner PartnerOrganization) (*PartnerOrganization, error)
}

type EventRepository interface {
	Create(ctx context.Context, event InternationalEvent) (*InternationalEvent, error)
	GetByID(ctx context.Context, id string) (*InternationalEvent, error)
	List(ctx context.Context) ([]InternationalEvent, error)
	ListUpcoming(ctx context.Context) ([]InternationalEvent, error)
}

type DelegationRepository interface {
	Create(ctx context.Context, del Delegation) (*Delegation, error)
	GetByID(ctx context.Context, id string) (*Delegation, error)
	ListByEvent(ctx context.Context, eventID string) ([]Delegation, error)
	Update(ctx context.Context, id string, del Delegation) (*Delegation, error)
}

// ── Service ──────────────────────────────────────────────────

type Service struct {
	partners    PartnerRepository
	events      EventRepository
	delegations DelegationRepository
}

func NewService(partners PartnerRepository, events EventRepository, delegations DelegationRepository) *Service {
	return &Service{partners: partners, events: events, delegations: delegations}
}

// ── Partner Operations ───────────────────────────────────────

func (s *Service) CreatePartner(ctx context.Context, p PartnerOrganization) (*PartnerOrganization, error) {
	if p.Name == "" || p.Country == "" {
		return nil, fmt.Errorf("name and country are required")
	}
	p.CreatedAt = time.Now()
	p.UpdatedAt = p.CreatedAt
	if p.Status == "" {
		p.Status = PartnerPending
	}
	return s.partners.Create(ctx, p)
}

func (s *Service) GetPartner(ctx context.Context, id string) (*PartnerOrganization, error) {
	return s.partners.GetByID(ctx, id)
}

func (s *Service) ListPartners(ctx context.Context) ([]PartnerOrganization, error) {
	return s.partners.List(ctx)
}

func (s *Service) ListPartnersByCountry(ctx context.Context, country string) ([]PartnerOrganization, error) {
	return s.partners.ListByCountry(ctx, country)
}

func (s *Service) UpdatePartner(ctx context.Context, id string, p PartnerOrganization) (*PartnerOrganization, error) {
	p.UpdatedAt = time.Now()
	return s.partners.Update(ctx, id, p)
}

// ── Event Operations ─────────────────────────────────────────

func (s *Service) CreateEvent(ctx context.Context, e InternationalEvent) (*InternationalEvent, error) {
	if e.Name == "" || e.HostCountry == "" {
		return nil, fmt.Errorf("name and host_country are required")
	}
	e.CreatedAt = time.Now()
	if e.Status == "" {
		e.Status = "planned"
	}
	return s.events.Create(ctx, e)
}

func (s *Service) GetEvent(ctx context.Context, id string) (*InternationalEvent, error) {
	return s.events.GetByID(ctx, id)
}

func (s *Service) ListEvents(ctx context.Context) ([]InternationalEvent, error) {
	return s.events.List(ctx)
}

func (s *Service) ListUpcomingEvents(ctx context.Context) ([]InternationalEvent, error) {
	return s.events.ListUpcoming(ctx)
}

// ── Delegation Operations ────────────────────────────────────

func (s *Service) CreateDelegation(ctx context.Context, d Delegation) (*Delegation, error) {
	if d.EventID == "" || d.TeamName == "" {
		return nil, fmt.Errorf("event_id and team_name are required")
	}
	d.CreatedAt = time.Now()
	d.UpdatedAt = d.CreatedAt
	if d.Status == "" {
		d.Status = DelegationPlanning
	}
	return s.delegations.Create(ctx, d)
}

func (s *Service) GetDelegation(ctx context.Context, id string) (*Delegation, error) {
	return s.delegations.GetByID(ctx, id)
}

func (s *Service) ListDelegationsByEvent(ctx context.Context, eventID string) ([]Delegation, error) {
	return s.delegations.ListByEvent(ctx, eventID)
}

func (s *Service) UpdateDelegation(ctx context.Context, id string, d Delegation) (*Delegation, error) {
	d.UpdatedAt = time.Now()
	return s.delegations.Update(ctx, id, d)
}
