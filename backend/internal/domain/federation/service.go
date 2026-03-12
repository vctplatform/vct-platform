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

// ── Provincial Repository Interfaces ──────────────────────────

type ProvincialClubRepository interface {
	List(ctx context.Context, provinceID string) ([]ProvincialClub, error)
	GetByID(ctx context.Context, id string) (*ProvincialClub, error)
	Create(ctx context.Context, c ProvincialClub) (*ProvincialClub, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) error
	Delete(ctx context.Context, id string) error
}

type ProvincialAthleteRepository interface {
	List(ctx context.Context, provinceID string) ([]ProvincialAthlete, error)
	GetByID(ctx context.Context, id string) (*ProvincialAthlete, error)
	Create(ctx context.Context, a ProvincialAthlete) (*ProvincialAthlete, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) error
	Delete(ctx context.Context, id string) error
	ListByClub(ctx context.Context, clubID string) ([]ProvincialAthlete, error)
}

type ProvincialCoachRepository interface {
	List(ctx context.Context, provinceID string) ([]ProvincialCoach, error)
	GetByID(ctx context.Context, id string) (*ProvincialCoach, error)
	Create(ctx context.Context, c ProvincialCoach) (*ProvincialCoach, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) error
	Delete(ctx context.Context, id string) error
}

type ProvincialReportRepository interface {
	List(ctx context.Context, provinceID string) ([]ProvincialReport, error)
	GetByID(ctx context.Context, id string) (*ProvincialReport, error)
	Create(ctx context.Context, r ProvincialReport) (*ProvincialReport, error)
}

// ── Service ──────────────────────────────────────────────────

type Service struct {
	provinces ProvinceRepository
	units     FederationUnitRepository
	personnel PersonnelRepository
	master    MasterDataStore
	clubs     ProvincialClubRepository
	athletes  ProvincialAthleteRepository
	coaches   ProvincialCoachRepository
	reports   ProvincialReportRepository
	idGen     func() string
}

func NewService(
	prov ProvinceRepository,
	units FederationUnitRepository,
	pers PersonnelRepository,
	master MasterDataStore,
	idGen func() string,
) *Service {
	return &Service{
		provinces: prov,
		units:     units,
		personnel: pers,
		master:    master,
		idGen:     idGen,
	}
}

// SetProvincialRepos injects provincial repositories after construction.
// This allows backward-compatible construction while adding new capabilities.
func (s *Service) SetProvincialRepos(
	clubs ProvincialClubRepository,
	athletes ProvincialAthleteRepository,
	coaches ProvincialCoachRepository,
	reports ProvincialReportRepository,
) {
	s.clubs = clubs
	s.athletes = athletes
	s.coaches = coaches
	s.reports = reports
}

// ── Province Operations ──────────────────────────────────────

func (s *Service) ListProvinces(ctx context.Context) ([]Province, error) {
	return s.provinces.List(ctx)
}

func (s *Service) GetProvince(ctx context.Context, id string) (*Province, error) {
	return s.provinces.GetByID(ctx, id)
}

func (s *Service) CreateProvince(ctx context.Context, p Province) (*Province, error) {
	if err := ValidateProvince(p); err != nil {
		return nil, err
	}
	// Duplicate code check
	existing, _ := s.provinces.GetByCode(ctx, p.Code)
	if existing != nil {
		return nil, fmt.Errorf("mã tỉnh '%s' đã tồn tại", p.Code)
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
	if err := ValidateUnit(u); err != nil {
		return nil, err
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
	if err := ValidatePersonnel(a); err != nil {
		return err
	}
	// Duplicate assignment check
	existing, _ := s.personnel.GetByUserAndUnit(ctx, a.UserID, a.UnitID)
	if existing != nil && existing.IsActive {
		return fmt.Errorf("nhân sự '%s' đã được phân công tại đơn vị '%s'", a.UserID, a.UnitID)
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

// ── Master Data Operations ───────────────────────────────────

func (s *Service) ListMasterBelts(ctx context.Context) ([]MasterBelt, error) {
	return s.master.ListMasterBelts(ctx)
}

func (s *Service) CreateMasterBelt(ctx context.Context, req MasterBelt) error {
	return s.master.CreateMasterBelt(ctx, req)
}

func (s *Service) ListMasterWeights(ctx context.Context) ([]MasterWeightClass, error) {
	return s.master.ListMasterWeights(ctx)
}

func (s *Service) CreateMasterWeight(ctx context.Context, req MasterWeightClass) error {
	return s.master.CreateMasterWeight(ctx, req)
}

func (s *Service) ListMasterAges(ctx context.Context) ([]MasterAgeGroup, error) {
	return s.master.ListMasterAges(ctx)
}

func (s *Service) CreateMasterAge(ctx context.Context, req MasterAgeGroup) error {
	return s.master.CreateMasterAge(ctx, req)
}

func (s *Service) GetMasterBelt(ctx context.Context, level string) (*MasterBelt, error) {
	return s.master.GetMasterBelt(ctx, level)
}

func (s *Service) UpdateMasterBelt(ctx context.Context, belt MasterBelt) error {
	return s.master.UpdateMasterBelt(ctx, belt)
}

func (s *Service) DeleteMasterBelt(ctx context.Context, level string) error {
	return s.master.DeleteMasterBelt(ctx, level)
}

func (s *Service) GetMasterWeight(ctx context.Context, id string) (*MasterWeightClass, error) {
	return s.master.GetMasterWeight(ctx, id)
}

func (s *Service) UpdateMasterWeight(ctx context.Context, wc MasterWeightClass) error {
	return s.master.UpdateMasterWeight(ctx, wc)
}

func (s *Service) DeleteMasterWeight(ctx context.Context, id string) error {
	return s.master.DeleteMasterWeight(ctx, id)
}

func (s *Service) GetMasterAge(ctx context.Context, id string) (*MasterAgeGroup, error) {
	return s.master.GetMasterAge(ctx, id)
}

func (s *Service) UpdateMasterAge(ctx context.Context, ag MasterAgeGroup) error {
	return s.master.UpdateMasterAge(ctx, ag)
}

func (s *Service) DeleteMasterAge(ctx context.Context, id string) error {
	return s.master.DeleteMasterAge(ctx, id)
}

// ── Master Competition Contents ──────────────────────────────

func (s *Service) ListMasterContents(ctx context.Context) ([]MasterCompetitionContent, error) {
	return s.master.ListMasterContents(ctx)
}

func (s *Service) GetMasterContent(ctx context.Context, id string) (*MasterCompetitionContent, error) {
	return s.master.GetMasterContent(ctx, id)
}

func (s *Service) CreateMasterContent(ctx context.Context, req MasterCompetitionContent) error {
	return s.master.CreateMasterContent(ctx, req)
}

func (s *Service) UpdateMasterContent(ctx context.Context, req MasterCompetitionContent) error {
	return s.master.UpdateMasterContent(ctx, req)
}

func (s *Service) DeleteMasterContent(ctx context.Context, id string) error {
	return s.master.DeleteMasterContent(ctx, id)
}

// ── Approval Workflow Engine ─────────────────────────────────

func (s *Service) ListPendingApprovals(ctx context.Context) ([]ApprovalRequest, error) {
	return s.master.ListApprovals(ctx, string(RequestPending))
}

func (s *Service) GetAllApprovals(ctx context.Context, status string) ([]ApprovalRequest, error) {
	return s.master.ListApprovals(ctx, status)
}

func (s *Service) ProcessApproval(ctx context.Context, reqID string, action string, notes string) error {
	// action could be "APPROVE" or "REJECT"
	req, err := s.master.GetApproval(ctx, reqID)
	if err != nil {
		return err
	}

	if action == "APPROVE" {
		req.Status = RequestApproved
	} else if action == "REJECT" {
		req.Status = RequestRejected
	}
	req.Notes = notes

	return s.master.UpdateApproval(ctx, req)
}

// ═══════════════════════════════════════════════════════════════
// PROVINCIAL CLUB OPERATIONS
// ═══════════════════════════════════════════════════════════════

func (s *Service) ListProvincialClubs(ctx context.Context, provinceID string) ([]ProvincialClub, error) {
	if s.clubs == nil {
		return nil, fmt.Errorf("provincial club repository not configured")
	}
	return s.clubs.List(ctx, provinceID)
}

func (s *Service) GetProvincialClub(ctx context.Context, id string) (*ProvincialClub, error) {
	if s.clubs == nil {
		return nil, fmt.Errorf("provincial club repository not configured")
	}
	return s.clubs.GetByID(ctx, id)
}

func (s *Service) CreateProvincialClub(ctx context.Context, c ProvincialClub) (*ProvincialClub, error) {
	if s.clubs == nil {
		return nil, fmt.Errorf("provincial club repository not configured")
	}
	if c.Name == "" || c.ProvinceID == "" {
		return nil, fmt.Errorf("name và province_id là bắt buộc")
	}
	c.ID = s.idGen()
	c.Status = ClubStatusPending
	now := time.Now().UTC()
	c.CreatedAt = now
	c.UpdatedAt = now
	return s.clubs.Create(ctx, c)
}

func (s *Service) DeleteProvincialClub(ctx context.Context, id string) error {
	if s.clubs == nil {
		return fmt.Errorf("provincial club repository not configured")
	}
	return s.clubs.Delete(ctx, id)
}

// ═══════════════════════════════════════════════════════════════
// PROVINCIAL ATHLETE OPERATIONS
// ═══════════════════════════════════════════════════════════════

func (s *Service) ListProvincialAthletes(ctx context.Context, provinceID string) ([]ProvincialAthlete, error) {
	if s.athletes == nil {
		return nil, fmt.Errorf("provincial athlete repository not configured")
	}
	return s.athletes.List(ctx, provinceID)
}

func (s *Service) GetProvincialAthlete(ctx context.Context, id string) (*ProvincialAthlete, error) {
	if s.athletes == nil {
		return nil, fmt.Errorf("provincial athlete repository not configured")
	}
	return s.athletes.GetByID(ctx, id)
}

func (s *Service) CreateProvincialAthlete(ctx context.Context, a ProvincialAthlete) (*ProvincialAthlete, error) {
	if s.athletes == nil {
		return nil, fmt.Errorf("provincial athlete repository not configured")
	}
	if a.FullName == "" || a.ProvinceID == "" || a.ClubID == "" {
		return nil, fmt.Errorf("full_name, province_id và club_id là bắt buộc")
	}
	a.ID = s.idGen()
	a.Status = AthleteActive
	now := time.Now().UTC()
	a.CreatedAt = now
	a.UpdatedAt = now
	return s.athletes.Create(ctx, a)
}

func (s *Service) ListAthletesByClub(ctx context.Context, clubID string) ([]ProvincialAthlete, error) {
	if s.athletes == nil {
		return nil, fmt.Errorf("provincial athlete repository not configured")
	}
	return s.athletes.ListByClub(ctx, clubID)
}

// ═══════════════════════════════════════════════════════════════
// PROVINCIAL COACH OPERATIONS
// ═══════════════════════════════════════════════════════════════

func (s *Service) ListProvincialCoaches(ctx context.Context, provinceID string) ([]ProvincialCoach, error) {
	if s.coaches == nil {
		return nil, fmt.Errorf("provincial coach repository not configured")
	}
	return s.coaches.List(ctx, provinceID)
}

func (s *Service) GetProvincialCoach(ctx context.Context, id string) (*ProvincialCoach, error) {
	if s.coaches == nil {
		return nil, fmt.Errorf("provincial coach repository not configured")
	}
	return s.coaches.GetByID(ctx, id)
}

func (s *Service) CreateProvincialCoach(ctx context.Context, c ProvincialCoach) (*ProvincialCoach, error) {
	if s.coaches == nil {
		return nil, fmt.Errorf("provincial coach repository not configured")
	}
	if c.FullName == "" || c.ProvinceID == "" {
		return nil, fmt.Errorf("full_name và province_id là bắt buộc")
	}
	c.ID = s.idGen()
	if c.Status == "" {
		c.Status = "ACTIVE"
	}
	now := time.Now().UTC()
	c.CreatedAt = now
	c.UpdatedAt = now
	return s.coaches.Create(ctx, c)
}

// ═══════════════════════════════════════════════════════════════
// PROVINCIAL REPORT OPERATIONS
// ═══════════════════════════════════════════════════════════════

func (s *Service) ListProvincialReports(ctx context.Context, provinceID string) ([]ProvincialReport, error) {
	if s.reports == nil {
		return nil, fmt.Errorf("provincial report repository not configured")
	}
	return s.reports.List(ctx, provinceID)
}

func (s *Service) CreateProvincialReport(ctx context.Context, r ProvincialReport) (*ProvincialReport, error) {
	if s.reports == nil {
		return nil, fmt.Errorf("provincial report repository not configured")
	}
	if r.Title == "" || r.ProvinceID == "" {
		return nil, fmt.Errorf("title và province_id là bắt buộc")
	}
	r.ID = s.idGen()
	r.Status = ReportDraft
	now := time.Now().UTC()
	r.CreatedAt = now
	r.UpdatedAt = now
	return s.reports.Create(ctx, r)
}

// ═══════════════════════════════════════════════════════════════
// PROVINCIAL STATISTICS
// ═══════════════════════════════════════════════════════════════

func (s *Service) GetProvincialStatistics(ctx context.Context, provinceID string) (*ProvincialStatistics, error) {
	prov, err := s.provinces.GetByID(ctx, provinceID)
	if err != nil {
		return nil, err
	}

	stats := &ProvincialStatistics{
		ProvinceID:   prov.ID,
		ProvinceName: prov.Name,
		TotalClubs:   prov.ClubCount,
		TotalCoaches: prov.CoachCount,
		TotalAthletes: prov.VDVCount,
	}

	// Enrich with live counts if repos available
	if s.clubs != nil {
		clubs, _ := s.clubs.List(ctx, provinceID)
		stats.TotalClubs = len(clubs)
		activeCount := 0
		for _, c := range clubs {
			if c.Status == ClubStatusActive {
				activeCount++
			}
		}
		stats.ActiveClubs = activeCount
	}
	if s.athletes != nil {
		athletes, _ := s.athletes.List(ctx, provinceID)
		stats.TotalAthletes = len(athletes)
	}
	if s.coaches != nil {
		coaches, _ := s.coaches.List(ctx, provinceID)
		stats.TotalCoaches = len(coaches)
	}

	return stats, nil
}

