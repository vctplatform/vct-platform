package federation

import (
	"context"
	"fmt"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — FEDERATION DOMAIN
// National-level federation structure: provinces, org units,
// organization chart, and scope-based access control.
// ═══════════════════════════════════════════════════════════════

// ── Constants ────────────────────────────────────────────────

type UnitType string

const (
	UnitTypeCentral   UnitType = "central"   // Liên đoàn trung ương
	UnitTypeProvince  UnitType = "province"  // Liên đoàn tỉnh/TP
	UnitTypeDistrict  UnitType = "district"  // Quận/Huyện (future)
	UnitTypeCommittee UnitType = "committee" // Ban/Hội đồng
)

type UnitStatus string

const (
	UnitStatusActive    UnitStatus = "active"
	UnitStatusInactive  UnitStatus = "inactive"
	UnitStatusSuspended UnitStatus = "suspended"
)

type RegionCode string

const (
	RegionNorth   RegionCode = "north"   // Miền Bắc
	RegionCentral RegionCode = "central" // Miền Trung
	RegionSouth   RegionCode = "south"   // Miền Nam
)

// ── Domain Models ────────────────────────────────────────────

// Province represents a Vietnamese province/city with federation presence.
type Province struct {
	ID         string     `json:"id"`
	Code       string     `json:"code"`    // e.g. "HCM", "HN", "BD"
	Name       string     `json:"name"`    // e.g. "TP Hồ Chí Minh"
	Region     RegionCode `json:"region"`  // north, central, south
	HasFed     bool       `json:"has_fed"` // Has provincial federation
	FedUnitID  string     `json:"fed_unit_id,omitempty"`
	ClubCount  int        `json:"club_count"`
	CoachCount int        `json:"coach_count"`
	VDVCount   int        `json:"vdv_count"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
}

// FederationUnit represents an organizational unit within the federation hierarchy.
type FederationUnit struct {
	ID          string         `json:"id"`
	Name        string         `json:"name"`       // e.g. "LĐ Võ cổ truyền TP.HCM"
	ShortName   string         `json:"short_name"` // e.g. "LĐ HCM"
	Type        UnitType       `json:"type"`       // central, province, committee
	ParentID    string         `json:"parent_id,omitempty"`
	ProvinceID  string         `json:"province_id,omitempty"`
	Status      UnitStatus     `json:"status"`
	Address     string         `json:"address,omitempty"`
	Phone       string         `json:"phone,omitempty"`
	Email       string         `json:"email,omitempty"`
	Website     string         `json:"website,omitempty"`
	FoundedDate string         `json:"founded_date,omitempty"`
	LeaderName  string         `json:"leader_name,omitempty"`
	LeaderTitle string         `json:"leader_title,omitempty"`
	ClubCount   int            `json:"club_count"`
	MemberCount int            `json:"member_count"`
	Metadata    map[string]any `json:"metadata,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
}

// OrgChartNode represents a node in the organizational chart.
type OrgChartNode struct {
	ID       string         `json:"id"`
	UnitID   string         `json:"unit_id"`
	UnitName string         `json:"unit_name"`
	UnitType UnitType       `json:"unit_type"`
	Level    int            `json:"level"` // 0 = root (central), 1 = province, 2 = district
	ParentID string         `json:"parent_id,omitempty"`
	Children []OrgChartNode `json:"children,omitempty"`
	Status   UnitStatus     `json:"status"`
	Stats    OrgNodeStats   `json:"stats"`
}

// OrgNodeStats holds aggregated statistics for an org chart node.
type OrgNodeStats struct {
	TotalClubs    int `json:"total_clubs"`
	TotalCoaches  int `json:"total_coaches"`
	TotalAthletes int `json:"total_athletes"`
	TotalReferees int `json:"total_referees"`
	ActiveEvents  int `json:"active_events"`
}

// PersonnelAssignment tracks who holds what position in which unit.
type PersonnelAssignment struct {
	ID         string    `json:"id"`
	UserID     string    `json:"user_id"`
	UserName   string    `json:"user_name"`
	UnitID     string    `json:"unit_id"`
	UnitName   string    `json:"unit_name"`
	Position   string    `json:"position"`  // e.g. "Chủ tịch", "Phó CT", "Ủy viên"
	RoleCode   string    `json:"role_code"` // maps to auth role
	StartDate  string    `json:"start_date"`
	EndDate    string    `json:"end_date,omitempty"`
	IsActive   bool      `json:"is_active"`
	DecisionNo string    `json:"decision_no,omitempty"` // QĐ bổ nhiệm
	CreatedAt  time.Time `json:"created_at"`
}

// NationalStatistics provides a high-level view of the entire federation.
type NationalStatistics struct {
	TotalProvinces      int            `json:"total_provinces"`
	ActiveProvinces     int            `json:"active_provinces"`
	TotalClubs          int            `json:"total_clubs"`
	TotalAthletes       int            `json:"total_athletes"`
	TotalCoaches        int            `json:"total_coaches"`
	TotalReferees       int            `json:"total_referees"`
	ActiveTournaments   int            `json:"active_tournaments"`
	TotalTournaments    int            `json:"total_tournaments_ytd"`
	ByRegion            map[string]int `json:"by_region"`
	TopProvincesByClubs []Province     `json:"top_provinces_by_clubs"`
}

// ── Repository Interfaces ────────────────────────────────────

type ProvinceRepository interface {
	List(ctx context.Context) ([]Province, error)
	GetByID(ctx context.Context, id string) (*Province, error)
	GetByCode(ctx context.Context, code string) (*Province, error)
	Create(ctx context.Context, p Province) (*Province, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) error
	ListByRegion(ctx context.Context, region RegionCode) ([]Province, error)
}

type FederationUnitRepository interface {
	List(ctx context.Context) ([]FederationUnit, error)
	GetByID(ctx context.Context, id string) (*FederationUnit, error)
	Create(ctx context.Context, u FederationUnit) (*FederationUnit, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) error
	Delete(ctx context.Context, id string) error
	ListByType(ctx context.Context, uType UnitType) ([]FederationUnit, error)
	ListByParent(ctx context.Context, parentID string) ([]FederationUnit, error)
}

type PersonnelRepository interface {
	List(ctx context.Context, unitID string) ([]PersonnelAssignment, error)
	Create(ctx context.Context, a PersonnelAssignment) error
	Update(ctx context.Context, id string, patch map[string]interface{}) error
	Deactivate(ctx context.Context, id string) error
	GetByUserAndUnit(ctx context.Context, userID, unitID string) (*PersonnelAssignment, error)
}

// ── Service ──────────────────────────────────────────────────

type Service struct {
	provinces ProvinceRepository
	units     FederationUnitRepository
	personnel PersonnelRepository
	idGen     func() string
}

func NewService(
	prov ProvinceRepository,
	units FederationUnitRepository,
	pers PersonnelRepository,
	idGen func() string,
) *Service {
	return &Service{
		provinces: prov,
		units:     units,
		personnel: pers,
		idGen:     idGen,
	}
}

// ── Province Operations ──────────────────────────────────────

func (s *Service) ListProvinces(ctx context.Context) ([]Province, error) {
	return s.provinces.List(ctx)
}

func (s *Service) GetProvince(ctx context.Context, id string) (*Province, error) {
	return s.provinces.GetByID(ctx, id)
}

func (s *Service) CreateProvince(ctx context.Context, p Province) (*Province, error) {
	if p.Code == "" || p.Name == "" {
		return nil, fmt.Errorf("code và name là bắt buộc")
	}
	p.ID = s.idGen()
	now := time.Now().UTC()
	p.CreatedAt = now
	p.UpdatedAt = now
	return s.provinces.Create(ctx, p)
}

func (s *Service) ListProvincesByRegion(ctx context.Context, region RegionCode) ([]Province, error) {
	return s.provinces.ListByRegion(ctx, region)
}

// ── Federation Unit Operations ───────────────────────────────

func (s *Service) ListUnits(ctx context.Context) ([]FederationUnit, error) {
	return s.units.List(ctx)
}

func (s *Service) GetUnit(ctx context.Context, id string) (*FederationUnit, error) {
	return s.units.GetByID(ctx, id)
}

func (s *Service) CreateUnit(ctx context.Context, u FederationUnit) (*FederationUnit, error) {
	if u.Name == "" || u.Type == "" {
		return nil, fmt.Errorf("name và type là bắt buộc")
	}
	u.ID = s.idGen()
	u.Status = UnitStatusActive
	now := time.Now().UTC()
	u.CreatedAt = now
	u.UpdatedAt = now
	return s.units.Create(ctx, u)
}

func (s *Service) ListChildUnits(ctx context.Context, parentID string) ([]FederationUnit, error) {
	return s.units.ListByParent(ctx, parentID)
}

// ── Org Chart ────────────────────────────────────────────────

// BuildOrgChart builds the organizational chart tree from flat units.
func (s *Service) BuildOrgChart(ctx context.Context) ([]OrgChartNode, error) {
	units, err := s.units.List(ctx)
	if err != nil {
		return nil, err
	}

	nodeMap := make(map[string]*OrgChartNode)
	var roots []*OrgChartNode

	// Build flat map
	for _, u := range units {
		node := &OrgChartNode{
			ID:       u.ID,
			UnitID:   u.ID,
			UnitName: u.Name,
			UnitType: u.Type,
			ParentID: u.ParentID,
			Status:   u.Status,
			Stats: OrgNodeStats{
				TotalClubs:    u.ClubCount,
				TotalAthletes: u.MemberCount,
			},
		}
		nodeMap[u.ID] = node
	}

	// Build tree
	for _, node := range nodeMap {
		if node.ParentID == "" {
			node.Level = 0
			roots = append(roots, node)
		} else if parent, ok := nodeMap[node.ParentID]; ok {
			node.Level = parent.Level + 1
			parent.Children = append(parent.Children, *node)
		} else {
			// Orphan — treat as root
			roots = append(roots, node)
		}
	}

	result := make([]OrgChartNode, len(roots))
	for i, r := range roots {
		result[i] = *r
	}
	return result, nil
}

// ── Personnel ────────────────────────────────────────────────

func (s *Service) AssignPersonnel(ctx context.Context, a PersonnelAssignment) error {
	if a.UserID == "" || a.UnitID == "" || a.Position == "" {
		return fmt.Errorf("user_id, unit_id và position là bắt buộc")
	}
	a.ID = s.idGen()
	a.IsActive = true
	a.CreatedAt = time.Now().UTC()
	return s.personnel.Create(ctx, a)
}

func (s *Service) ListPersonnel(ctx context.Context, unitID string) ([]PersonnelAssignment, error) {
	return s.personnel.List(ctx, unitID)
}

// ── Statistics ───────────────────────────────────────────────

func (s *Service) GetNationalStatistics(ctx context.Context) (*NationalStatistics, error) {
	provs, err := s.provinces.List(ctx)
	if err != nil {
		return nil, err
	}

	stats := &NationalStatistics{
		TotalProvinces: len(provs),
		ByRegion:       make(map[string]int),
	}

	for _, p := range provs {
		if p.HasFed {
			stats.ActiveProvinces++
		}
		stats.TotalClubs += p.ClubCount
		stats.TotalCoaches += p.CoachCount
		stats.TotalAthletes += p.VDVCount
		stats.ByRegion[string(p.Region)]++
	}

	return stats, nil
}
