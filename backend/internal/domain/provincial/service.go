package provincial

import (
	"context"
	"fmt"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — PROVINCIAL DOMAIN SERVICE
// Provincial-level federation management: clubs, athletes,
// coaches, referees, committees, dashboard statistics.
// All data is scoped by province_id for multi-tenant isolation.
// ═══════════════════════════════════════════════════════════════

// ── Constants ────────────────────────────────────────────────

type ClubStatus string

const (
	ClubStatusActive    ClubStatus = "active"
	ClubStatusPending   ClubStatus = "pending"
	ClubStatusSuspended ClubStatus = "suspended"
	ClubStatusInactive  ClubStatus = "inactive"
)

type MemberStatus string

const (
	MemberStatusActive   MemberStatus = "active"
	MemberStatusPending  MemberStatus = "pending"
	MemberStatusInactive MemberStatus = "inactive"
)

type TransferStatus string

const (
	TransferStatusPending  TransferStatus = "pending"
	TransferStatusApproved TransferStatus = "approved"
	TransferStatusRejected TransferStatus = "rejected"
)

type PersonnelRole string

const (
	PersonnelRolePresident       PersonnelRole = "president"
	PersonnelRoleVicePresident   PersonnelRole = "vice_president"
	PersonnelRoleSecretary       PersonnelRole = "secretary"
	PersonnelRoleTechnicalHead   PersonnelRole = "technical_head"
	PersonnelRoleRefereeHead     PersonnelRole = "referee_head"
	PersonnelRoleCommitteeMember PersonnelRole = "committee_member"
	PersonnelRoleAccountant      PersonnelRole = "accountant"
	// District-level (Hội) roles
	PersonnelRoleDistrictPresident     PersonnelRole = "district_president"
	PersonnelRoleDistrictVicePresident PersonnelRole = "district_vice_president"
	PersonnelRoleDistrictSecretary     PersonnelRole = "district_secretary"
	// Ward-level (Chi hội) roles
	PersonnelRoleWardLeader    PersonnelRole = "ward_leader"
	PersonnelRoleWardDeputy    PersonnelRole = "ward_deputy"
	PersonnelRoleWardSecretary PersonnelRole = "ward_secretary"
)

type AssociationStatus string

const (
	AssociationStatusPending   AssociationStatus = "pending"
	AssociationStatusActive    AssociationStatus = "active"
	AssociationStatusSuspended AssociationStatus = "suspended"
	AssociationStatusInactive  AssociationStatus = "inactive"
	AssociationStatusRejected  AssociationStatus = "rejected"
)

// ── Domain Models ────────────────────────────────────────────

// Association represents a district-level martial arts association (Hội VCT Quận/Huyện).
type Association struct {
	ID             string            `json:"id"`
	ProvinceID     string            `json:"province_id"`
	Name           string            `json:"name"`
	ShortName      string            `json:"short_name,omitempty"`
	Code           string            `json:"code"`
	District       string            `json:"district"`
	Address        string            `json:"address,omitempty"`
	Phone          string            `json:"phone,omitempty"`
	Email          string            `json:"email,omitempty"`
	PresidentName  string            `json:"president_name"`
	PresidentPhone string            `json:"president_phone,omitempty"`
	FoundedDate    string            `json:"founded_date,omitempty"`
	DecisionNo     string            `json:"decision_no,omitempty"`
	Status         AssociationStatus `json:"status"`
	TotalSubAssoc  int               `json:"total_sub_associations"`
	TotalClubs     int               `json:"total_clubs"`
	TotalAthletes  int               `json:"total_athletes"`
	TotalCoaches   int               `json:"total_coaches"`
	Term           string            `json:"term,omitempty"`
	CreatedAt      time.Time         `json:"created_at"`
	UpdatedAt      time.Time         `json:"updated_at"`
}

// SubAssociation represents a ward-level sub-association (Chi hội VCT Phường/Xã).
type SubAssociation struct {
	ID              string            `json:"id"`
	ProvinceID      string            `json:"province_id"`
	AssociationID   string            `json:"association_id"`
	AssociationName string            `json:"association_name,omitempty"`
	Name            string            `json:"name"`
	ShortName       string            `json:"short_name,omitempty"`
	Code            string            `json:"code"`
	Ward            string            `json:"ward"`
	Address         string            `json:"address,omitempty"`
	Phone           string            `json:"phone,omitempty"`
	Email           string            `json:"email,omitempty"`
	LeaderName      string            `json:"leader_name"`
	LeaderPhone     string            `json:"leader_phone,omitempty"`
	FoundedDate     string            `json:"founded_date,omitempty"`
	DecisionNo      string            `json:"decision_no,omitempty"`
	Status          AssociationStatus `json:"status"`
	TotalClubs      int               `json:"total_clubs"`
	TotalAthletes   int               `json:"total_athletes"`
	CreatedAt       time.Time         `json:"created_at"`
	UpdatedAt       time.Time         `json:"updated_at"`
}

// ProvincialClub represents a martial arts club under a provincial federation.
type ProvincialClub struct {
	ID               string     `json:"id"`
	ProvinceID       string     `json:"province_id"`
	AssociationID    string     `json:"association_id,omitempty"`
	SubAssociationID string     `json:"sub_association_id,omitempty"`
	Name             string     `json:"name"`
	ShortName        string     `json:"short_name,omitempty"`
	Code             string     `json:"code"`
	Type             string     `json:"type"` // "club" | "vo_duong" | "center"
	Address          string     `json:"address,omitempty"`
	District         string     `json:"district,omitempty"`
	Phone            string     `json:"phone,omitempty"`
	Email            string     `json:"email,omitempty"`
	FoundedDate      string     `json:"founded_date,omitempty"`
	LeaderName       string     `json:"leader_name"`
	LeaderPhone      string     `json:"leader_phone,omitempty"`
	Status           ClubStatus `json:"status"`
	AthleteCount     int        `json:"athlete_count"`
	CoachCount       int        `json:"coach_count"`
	LicenseNo        string     `json:"license_no,omitempty"`
	LicenseDate      string     `json:"license_date,omitempty"`
	Lineage          string     `json:"lineage,omitempty"` // Dòng phái (cho võ đường)
	LogoURL          string     `json:"logo_url,omitempty"`
	Website          string     `json:"website,omitempty"`
	FacilitySize     string     `json:"facility_size,omitempty"` // Diện tích phòng tập
	MaxCapacity      int        `json:"max_capacity,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

// ProvincialAthlete represents an athlete registered under a provincial club.
type ProvincialAthlete struct {
	ID          string       `json:"id"`
	ProvinceID  string       `json:"province_id"`
	ClubID      string       `json:"club_id"`
	ClubName    string       `json:"club_name"`
	FullName    string       `json:"full_name"`
	Gender      string       `json:"gender"` // "nam" | "nu"
	DateOfBirth string       `json:"date_of_birth"`
	Weight      float64      `json:"weight,omitempty"`
	Height      float64      `json:"height,omitempty"`
	BeltRank    string       `json:"belt_rank"` // Đẳng cấp đai
	IDNumber    string       `json:"id_number,omitempty"`
	Phone       string       `json:"phone,omitempty"`
	Address     string       `json:"address,omitempty"`
	PhotoURL    string       `json:"photo_url,omitempty"`
	Status      MemberStatus `json:"status"`
	JoinDate    string       `json:"join_date"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
}

// ProvincialCoach represents a coach registered under a provincial club.
type ProvincialCoach struct {
	ID          string       `json:"id"`
	ProvinceID  string       `json:"province_id"`
	ClubID      string       `json:"club_id"`
	ClubName    string       `json:"club_name"`
	FullName    string       `json:"full_name"`
	Gender      string       `json:"gender"`
	DateOfBirth string       `json:"date_of_birth"`
	BeltRank    string       `json:"belt_rank"`
	CertLevel   string       `json:"cert_level"` // Cấp HLV
	CertNumber  string       `json:"cert_number,omitempty"`
	Phone       string       `json:"phone,omitempty"`
	Email       string       `json:"email,omitempty"`
	Experience  int          `json:"experience_years"`
	Specialties []string     `json:"specialties,omitempty"`
	Status      MemberStatus `json:"status"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
}

// ProvincialReferee represents a referee registered under a provincial federation.
type ProvincialReferee struct {
	ID          string       `json:"id"`
	ProvinceID  string       `json:"province_id"`
	FullName    string       `json:"full_name"`
	Gender      string       `json:"gender"`
	DateOfBirth string       `json:"date_of_birth"`
	RefereeRank string       `json:"referee_rank"` // Cấp bậc trọng tài
	CertNumber  string       `json:"cert_number,omitempty"`
	Expertise   string       `json:"expertise"` // Chuyên môn: đối kháng / biểu diễn / cả hai
	Phone       string       `json:"phone,omitempty"`
	Email       string       `json:"email,omitempty"`
	Status      MemberStatus `json:"status"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
}

// CommitteeMember represents a member of the provincial executive committee (BCH).
type CommitteeMember struct {
	ID         string        `json:"id"`
	ProvinceID string        `json:"province_id"`
	FullName   string        `json:"full_name"`
	Role       PersonnelRole `json:"role"`
	Title      string        `json:"title"` // Chức danh
	Phone      string        `json:"phone,omitempty"`
	Email      string        `json:"email,omitempty"`
	Term       string        `json:"term"`        // Nhiệm kỳ, e.g. "2024-2029"
	DecisionNo string        `json:"decision_no"` // Số QĐ bổ nhiệm
	StartDate  string        `json:"start_date"`
	EndDate    string        `json:"end_date,omitempty"`
	IsActive   bool          `json:"is_active"`
	CreatedAt  time.Time     `json:"created_at"`
}

// ClubTransfer tracks athlete transfers between clubs.
type ClubTransfer struct {
	ID           string         `json:"id"`
	ProvinceID   string         `json:"province_id"`
	AthleteID    string         `json:"athlete_id"`
	AthleteName  string         `json:"athlete_name"`
	FromClubID   string         `json:"from_club_id"`
	FromClubName string         `json:"from_club_name"`
	ToClubID     string         `json:"to_club_id"`
	ToClubName   string         `json:"to_club_name"`
	Reason       string         `json:"reason,omitempty"`
	Status       TransferStatus `json:"status"`
	RequestedAt  time.Time      `json:"requested_at"`
	ApprovedAt   *time.Time     `json:"approved_at,omitempty"`
	ApprovedBy   string         `json:"approved_by,omitempty"`
}

// DashboardStats provides a high-level view of a provincial federation.
type DashboardStats struct {
	ProvinceID           string `json:"province_id"`
	ProvinceName         string `json:"province_name"`
	TotalAssociations    int    `json:"total_associations"`
	ActiveAssociations   int    `json:"active_associations"`
	TotalSubAssociations int    `json:"total_sub_associations"`
	TotalClubs           int    `json:"total_clubs"`
	ActiveClubs          int    `json:"active_clubs"`
	TotalAthletes        int    `json:"total_athletes"`
	TotalCoaches         int    `json:"total_coaches"`
	TotalReferees        int    `json:"total_referees"`
	TotalCommittee       int    `json:"total_committee"`
	PendingClubs         int    `json:"pending_clubs"`
	PendingAssociations  int    `json:"pending_associations"`
	PendingTransfers     int    `json:"pending_transfers"`
}

// AssociationDashboardStats provides stats for a single district association.
type AssociationDashboardStats struct {
	AssociationID   string `json:"association_id"`
	AssociationName string `json:"association_name"`
	TotalSubAssoc   int    `json:"total_sub_associations"`
	ActiveSubAssoc  int    `json:"active_sub_associations"`
	TotalClubs      int    `json:"total_clubs"`
	ActiveClubs     int    `json:"active_clubs"`
	TotalAthletes   int    `json:"total_athletes"`
	TotalCoaches    int    `json:"total_coaches"`
}

// ── Club Internal Models ─────────────────────────────────────

// ClubClass represents a training class within a club.
type ClubClass struct {
	ID           string         `json:"id"`
	ClubID       string         `json:"club_id"`
	Name         string         `json:"name"`
	Level        string         `json:"level"` // beginner, intermediate, advanced, competition
	CoachID      string         `json:"coach_id"`
	CoachName    string         `json:"coach_name"`
	Schedule     []ScheduleSlot `json:"schedule"`
	MaxStudents  int            `json:"max_students"`
	CurrentCount int            `json:"current_count"`
	MonthlyFee   float64        `json:"monthly_fee"`
	Status       string         `json:"status"` // active, paused, closed
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
}

// ScheduleSlot defines a recurring weekly training time slot.
type ScheduleSlot struct {
	DayOfWeek int    `json:"day_of_week"` // 0=Sun, 1=Mon...
	StartTime string `json:"start_time"`  // HH:mm
	EndTime   string `json:"end_time"`    // HH:mm
	Location  string `json:"location,omitempty"`
}

// ClubMember represents a member registered within a club.
type ClubMember struct {
	ID            string       `json:"id"`
	ClubID        string       `json:"club_id"`
	FullName      string       `json:"full_name"`
	Gender        string       `json:"gender"` // "nam" | "nu"
	DateOfBirth   string       `json:"date_of_birth"`
	Phone         string       `json:"phone,omitempty"`
	Email         string       `json:"email,omitempty"`
	Address       string       `json:"address,omitempty"`
	BeltRank      string       `json:"belt_rank"`
	ClassID       string       `json:"class_id,omitempty"`
	ClassName     string       `json:"class_name,omitempty"`
	MemberType    string       `json:"member_type"` // "student", "coach", "assistant"
	GuardianName  string       `json:"guardian_name,omitempty"`
	GuardianPhone string       `json:"guardian_phone,omitempty"`
	Status        MemberStatus `json:"status"`
	JoinDate      string       `json:"join_date"`
	PhotoURL      string       `json:"photo_url,omitempty"`
	CreatedAt     time.Time    `json:"created_at"`
	UpdatedAt     time.Time    `json:"updated_at"`
}

// ClubFinanceEntry records a financial transaction for a club.
type ClubFinanceEntry struct {
	ID          string    `json:"id"`
	ClubID      string    `json:"club_id"`
	Type        string    `json:"type"`     // "income" | "expense"
	Category    string    `json:"category"` // "hoi_phi", "thue_san", "giai_dau", "thiet_bi"
	Amount      float64   `json:"amount"`
	Description string    `json:"description"`
	MemberID    string    `json:"member_id,omitempty"`
	MemberName  string    `json:"member_name,omitempty"`
	ReceiptNo   string    `json:"receipt_no,omitempty"`
	Date        string    `json:"date"`
	RecordedBy  string    `json:"recorded_by"`
	CreatedAt   time.Time `json:"created_at"`
}

// ClubDashboardStats provides KPIs for a single club.
type ClubDashboardStats struct {
	ClubID         string  `json:"club_id"`
	ClubName       string  `json:"club_name"`
	ClubType       string  `json:"club_type"`
	TotalMembers   int     `json:"total_members"`
	ActiveMembers  int     `json:"active_members"`
	PendingMembers int     `json:"pending_members"`
	TotalClasses   int     `json:"total_classes"`
	ActiveClasses  int     `json:"active_classes"`
	TotalIncome    float64 `json:"total_income"`
	TotalExpense   float64 `json:"total_expense"`
	Balance        float64 `json:"balance"`
	RecentEntries  int     `json:"recent_entries"`
}

// ClubFinanceSummary provides aggregated financial data.
type ClubFinanceSummary struct {
	ClubID            string             `json:"club_id"`
	TotalIncome       float64            `json:"total_income"`
	TotalExpense      float64            `json:"total_expense"`
	Balance           float64            `json:"balance"`
	IncomeByCategory  map[string]float64 `json:"income_by_category"`
	ExpenseByCategory map[string]float64 `json:"expense_by_category"`
}

// ── Võ Sinh (Martial Arts Student) ────────────────────────────

type BeltLevel string

const (
	BeltNone   BeltLevel = "khong_dai" // Không đai (mới)
	BeltYellow BeltLevel = "dai_vang"  // Đai vàng
	BeltGreen  BeltLevel = "dai_xanh"  // Đai xanh
	BeltBlue   BeltLevel = "dai_lam"   // Đai lam
	BeltRed    BeltLevel = "dai_do"    // Đai đỏ
	BeltBlack0 BeltLevel = "so_dang"   // Sơ đẳng
	BeltBlack1 BeltLevel = "nhat_dang" // Nhất đẳng
	BeltBlack2 BeltLevel = "nhi_dang"  // Nhị đẳng
	BeltBlack3 BeltLevel = "tam_dang"  // Tam đẳng
	BeltBlack4 BeltLevel = "tu_dang"   // Tứ đẳng
	BeltBlack5 BeltLevel = "ngu_dang"  // Ngũ đẳng
	BeltBlack6 BeltLevel = "luc_dang"  // Lục đẳng
	BeltBlack7 BeltLevel = "that_dang" // Thất đẳng
)

var BeltLabelMap = map[BeltLevel]string{
	BeltNone: "Không đai", BeltYellow: "Đai vàng", BeltGreen: "Đai xanh",
	BeltBlue: "Đai lam", BeltRed: "Đai đỏ", BeltBlack0: "Sơ đẳng",
	BeltBlack1: "Nhất đẳng", BeltBlack2: "Nhị đẳng", BeltBlack3: "Tam đẳng",
	BeltBlack4: "Tứ đẳng", BeltBlack5: "Ngũ đẳng", BeltBlack6: "Lục đẳng",
	BeltBlack7: "Thất đẳng",
}

type AgeGroup string

const (
	AgeGroupChild  AgeGroup = "thieu_nhi"  // 5-12
	AgeGroupTeen   AgeGroup = "thieu_nien" // 13-17
	AgeGroupYouth  AgeGroup = "thanh_nien" // 18-35
	AgeGroupSenior AgeGroup = "trung_nien" // 36+
)

var AgeGroupLabelMap = map[AgeGroup]string{
	AgeGroupChild: "Thiếu nhi (5-12)", AgeGroupTeen: "Thiếu niên (13-17)",
	AgeGroupYouth: "Thanh niên (18-35)", AgeGroupSenior: "Trung niên (36+)",
}

// VoSinh represents a martial arts student/practitioner.
type VoSinh struct {
	ID            string       `json:"id"`
	ProvinceID    string       `json:"province_id"`
	ClubID        string       `json:"club_id"`
	ClubName      string       `json:"club_name"`
	FullName      string       `json:"full_name"`
	Gender        string       `json:"gender"` // "nam" | "nu"
	DateOfBirth   string       `json:"date_of_birth"`
	Weight        float64      `json:"weight,omitempty"`
	Height        float64      `json:"height,omitempty"`
	BeltRank      BeltLevel    `json:"belt_rank"`
	BeltLabel     string       `json:"belt_label"` // Human-readable belt name
	AgeGroup      AgeGroup     `json:"age_group"`
	AgeGroupLabel string       `json:"age_group_label"` // Human-readable age group
	IDNumber      string       `json:"id_number,omitempty"`
	Phone         string       `json:"phone,omitempty"`
	Email         string       `json:"email,omitempty"`
	Address       string       `json:"address,omitempty"`
	PhotoURL      string       `json:"photo_url,omitempty"`
	ParentName    string       `json:"parent_name,omitempty"` // Phụ huynh (< 18)
	ParentPhone   string       `json:"parent_phone,omitempty"`
	CoachID       string       `json:"coach_id,omitempty"`
	CoachName     string       `json:"coach_name,omitempty"`
	StartDate     string       `json:"start_date"`
	Notes         string       `json:"notes,omitempty"`
	Status        MemberStatus `json:"status"`
	CreatedAt     time.Time    `json:"created_at"`
	UpdatedAt     time.Time    `json:"updated_at"`
}

// VoSinhStats provides aggregate stats for võ sinh management.
type VoSinhStats struct {
	Total        int            `json:"total"`
	ByGender     map[string]int `json:"by_gender"`
	ByAgeGroup   map[string]int `json:"by_age_group"`
	ByBelt       map[string]int `json:"by_belt"`
	ByStatus     map[string]int `json:"by_status"`
	ActiveCount  int            `json:"active_count"`
	PendingCount int            `json:"pending_count"`
}

// ── Repository Interfaces ────────────────────────────────────

type AssociationRepository interface {
	List(ctx context.Context, provinceID string) ([]Association, error)
	GetByID(ctx context.Context, id string) (*Association, error)
	Create(ctx context.Context, a Association) (*Association, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) error
	Delete(ctx context.Context, id string) error
}

type SubAssociationRepository interface {
	List(ctx context.Context, provinceID string) ([]SubAssociation, error)
	ListByAssociation(ctx context.Context, assocID string) ([]SubAssociation, error)
	GetByID(ctx context.Context, id string) (*SubAssociation, error)
	Create(ctx context.Context, s SubAssociation) (*SubAssociation, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) error
	Delete(ctx context.Context, id string) error
}

type ClubRepository interface {
	List(ctx context.Context, provinceID string) ([]ProvincialClub, error)
	GetByID(ctx context.Context, id string) (*ProvincialClub, error)
	Create(ctx context.Context, c ProvincialClub) (*ProvincialClub, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) error
	Delete(ctx context.Context, id string) error
}

type AthleteRepository interface {
	List(ctx context.Context, provinceID string) ([]ProvincialAthlete, error)
	ListByClub(ctx context.Context, clubID string) ([]ProvincialAthlete, error)
	GetByID(ctx context.Context, id string) (*ProvincialAthlete, error)
	Create(ctx context.Context, a ProvincialAthlete) (*ProvincialAthlete, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) error
	Delete(ctx context.Context, id string) error
}

type CoachRepository interface {
	List(ctx context.Context, provinceID string) ([]ProvincialCoach, error)
	GetByID(ctx context.Context, id string) (*ProvincialCoach, error)
	Create(ctx context.Context, c ProvincialCoach) (*ProvincialCoach, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) error
}

type RefereeRepository interface {
	List(ctx context.Context, provinceID string) ([]ProvincialReferee, error)
	GetByID(ctx context.Context, id string) (*ProvincialReferee, error)
	Create(ctx context.Context, r ProvincialReferee) (*ProvincialReferee, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) error
}

type CommitteeRepository interface {
	List(ctx context.Context, provinceID string) ([]CommitteeMember, error)
	GetByID(ctx context.Context, id string) (*CommitteeMember, error)
	Create(ctx context.Context, m CommitteeMember) (*CommitteeMember, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) error
}

type TransferRepository interface {
	List(ctx context.Context, provinceID string) ([]ClubTransfer, error)
	GetByID(ctx context.Context, id string) (*ClubTransfer, error)
	Create(ctx context.Context, t ClubTransfer) (*ClubTransfer, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) error
}

// ── Club Internal Repositories ───────────────────────────────

type ClubClassRepository interface {
	List(ctx context.Context, clubID string) ([]ClubClass, error)
	GetByID(ctx context.Context, id string) (*ClubClass, error)
	Create(ctx context.Context, c ClubClass) (*ClubClass, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) error
	Delete(ctx context.Context, id string) error
}

type ClubMemberRepository interface {
	List(ctx context.Context, clubID string) ([]ClubMember, error)
	GetByID(ctx context.Context, id string) (*ClubMember, error)
	Create(ctx context.Context, m ClubMember) (*ClubMember, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) error
	Delete(ctx context.Context, id string) error
}

type ClubFinanceRepository interface {
	List(ctx context.Context, clubID string) ([]ClubFinanceEntry, error)
	GetByID(ctx context.Context, id string) (*ClubFinanceEntry, error)
	Create(ctx context.Context, f ClubFinanceEntry) (*ClubFinanceEntry, error)
}

type VoSinhRepository interface {
	List(ctx context.Context, provinceID string) ([]VoSinh, error)
	ListByClub(ctx context.Context, clubID string) ([]VoSinh, error)
	GetByID(ctx context.Context, id string) (*VoSinh, error)
	Create(ctx context.Context, v VoSinh) (*VoSinh, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) error
	Delete(ctx context.Context, id string) error
}

// ── Service ──────────────────────────────────────────────────

type Service struct {
	associations    AssociationRepository
	subAssociations SubAssociationRepository
	clubs           ClubRepository
	athletes        AthleteRepository
	coaches         CoachRepository
	referees        RefereeRepository
	committee       CommitteeRepository
	transfers       TransferRepository
	clubClasses     ClubClassRepository
	clubMembers     ClubMemberRepository
	clubFinance     ClubFinanceRepository
	voSinh          VoSinhRepository
	idGen           func() string
}

func NewService(
	associations AssociationRepository,
	subAssociations SubAssociationRepository,
	clubs ClubRepository,
	athletes AthleteRepository,
	coaches CoachRepository,
	referees RefereeRepository,
	committee CommitteeRepository,
	transfers TransferRepository,
	clubClasses ClubClassRepository,
	clubMembers ClubMemberRepository,
	clubFinance ClubFinanceRepository,
	voSinh VoSinhRepository,
	idGen func() string,
) *Service {
	return &Service{
		associations:    associations,
		subAssociations: subAssociations,
		clubs:           clubs,
		athletes:        athletes,
		coaches:         coaches,
		referees:        referees,
		committee:       committee,
		transfers:       transfers,
		clubClasses:     clubClasses,
		clubMembers:     clubMembers,
		clubFinance:     clubFinance,
		voSinh:          voSinh,
		idGen:           idGen,
	}
}

// ── Dashboard ────────────────────────────────────────────────

func (s *Service) GetDashboard(ctx context.Context, provinceID string) (*DashboardStats, error) {
	associations, err := s.associations.List(ctx, provinceID)
	if err != nil {
		return nil, err
	}
	subAssocs, err := s.subAssociations.List(ctx, provinceID)
	if err != nil {
		return nil, err
	}
	clubs, err := s.clubs.List(ctx, provinceID)
	if err != nil {
		return nil, err
	}
	athletes, err := s.athletes.List(ctx, provinceID)
	if err != nil {
		return nil, err
	}
	coaches, err := s.coaches.List(ctx, provinceID)
	if err != nil {
		return nil, err
	}
	referees, err := s.referees.List(ctx, provinceID)
	if err != nil {
		return nil, err
	}
	committee, err := s.committee.List(ctx, provinceID)
	if err != nil {
		return nil, err
	}
	transfers, err := s.transfers.List(ctx, provinceID)
	if err != nil {
		return nil, err
	}

	stats := &DashboardStats{
		ProvinceID:           provinceID,
		TotalAssociations:    len(associations),
		TotalSubAssociations: len(subAssocs),
		TotalClubs:           len(clubs),
		TotalAthletes:        len(athletes),
		TotalCoaches:         len(coaches),
		TotalReferees:        len(referees),
		TotalCommittee:       len(committee),
	}

	for _, a := range associations {
		if a.Status == AssociationStatusActive {
			stats.ActiveAssociations++
		}
		if a.Status == AssociationStatusPending {
			stats.PendingAssociations++
		}
	}

	for _, c := range clubs {
		if c.Status == ClubStatusActive {
			stats.ActiveClubs++
		}
		if c.Status == ClubStatusPending {
			stats.PendingClubs++
		}
	}

	for _, t := range transfers {
		if t.Status == TransferStatusPending {
			stats.PendingTransfers++
		}
	}

	return stats, nil
}

// ── Club Operations ──────────────────────────────────────────

func (s *Service) ListClubs(ctx context.Context, provinceID string) ([]ProvincialClub, error) {
	return s.clubs.List(ctx, provinceID)
}

func (s *Service) GetClub(ctx context.Context, id string) (*ProvincialClub, error) {
	return s.clubs.GetByID(ctx, id)
}

func (s *Service) CreateClub(ctx context.Context, c ProvincialClub) (*ProvincialClub, error) {
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

func (s *Service) ApproveClub(ctx context.Context, id string) error {
	return s.clubs.Update(ctx, id, map[string]interface{}{
		"status":     string(ClubStatusActive),
		"updated_at": time.Now().UTC(),
	})
}

func (s *Service) SuspendClub(ctx context.Context, id string) error {
	return s.clubs.Update(ctx, id, map[string]interface{}{
		"status":     string(ClubStatusSuspended),
		"updated_at": time.Now().UTC(),
	})
}

// ── Athlete Operations ───────────────────────────────────────

func (s *Service) ListAthletes(ctx context.Context, provinceID string) ([]ProvincialAthlete, error) {
	return s.athletes.List(ctx, provinceID)
}

func (s *Service) ListAthletesByClub(ctx context.Context, clubID string) ([]ProvincialAthlete, error) {
	return s.athletes.ListByClub(ctx, clubID)
}

func (s *Service) GetAthlete(ctx context.Context, id string) (*ProvincialAthlete, error) {
	return s.athletes.GetByID(ctx, id)
}

func (s *Service) CreateAthlete(ctx context.Context, a ProvincialAthlete) (*ProvincialAthlete, error) {
	if a.FullName == "" || a.ClubID == "" || a.ProvinceID == "" {
		return nil, fmt.Errorf("full_name, club_id và province_id là bắt buộc")
	}
	a.ID = s.idGen()
	a.Status = MemberStatusPending
	now := time.Now().UTC()
	a.CreatedAt = now
	a.UpdatedAt = now
	return s.athletes.Create(ctx, a)
}

func (s *Service) ApproveAthlete(ctx context.Context, id string) error {
	return s.athletes.Update(ctx, id, map[string]interface{}{
		"status":     string(MemberStatusActive),
		"updated_at": time.Now().UTC(),
	})
}

// ── Coach Operations ─────────────────────────────────────────

func (s *Service) ListCoaches(ctx context.Context, provinceID string) ([]ProvincialCoach, error) {
	return s.coaches.List(ctx, provinceID)
}

func (s *Service) GetCoach(ctx context.Context, id string) (*ProvincialCoach, error) {
	return s.coaches.GetByID(ctx, id)
}

func (s *Service) CreateCoach(ctx context.Context, c ProvincialCoach) (*ProvincialCoach, error) {
	if c.FullName == "" || c.ClubID == "" || c.ProvinceID == "" {
		return nil, fmt.Errorf("full_name, club_id và province_id là bắt buộc")
	}
	c.ID = s.idGen()
	c.Status = MemberStatusPending
	now := time.Now().UTC()
	c.CreatedAt = now
	c.UpdatedAt = now
	return s.coaches.Create(ctx, c)
}

// ── Referee Operations ───────────────────────────────────────

func (s *Service) ListReferees(ctx context.Context, provinceID string) ([]ProvincialReferee, error) {
	return s.referees.List(ctx, provinceID)
}

func (s *Service) GetReferee(ctx context.Context, id string) (*ProvincialReferee, error) {
	return s.referees.GetByID(ctx, id)
}

func (s *Service) CreateReferee(ctx context.Context, r ProvincialReferee) (*ProvincialReferee, error) {
	if r.FullName == "" || r.ProvinceID == "" {
		return nil, fmt.Errorf("full_name và province_id là bắt buộc")
	}
	r.ID = s.idGen()
	r.Status = MemberStatusPending
	now := time.Now().UTC()
	r.CreatedAt = now
	r.UpdatedAt = now
	return s.referees.Create(ctx, r)
}

// ── Committee Operations ─────────────────────────────────────

func (s *Service) ListCommittee(ctx context.Context, provinceID string) ([]CommitteeMember, error) {
	return s.committee.List(ctx, provinceID)
}

func (s *Service) GetCommitteeMember(ctx context.Context, id string) (*CommitteeMember, error) {
	return s.committee.GetByID(ctx, id)
}

func (s *Service) AddCommitteeMember(ctx context.Context, m CommitteeMember) (*CommitteeMember, error) {
	if m.FullName == "" || m.Role == "" || m.ProvinceID == "" {
		return nil, fmt.Errorf("full_name, role và province_id là bắt buộc")
	}
	m.ID = s.idGen()
	m.IsActive = true
	m.CreatedAt = time.Now().UTC()
	return s.committee.Create(ctx, m)
}

// ── Transfer Operations ──────────────────────────────────────

func (s *Service) ListTransfers(ctx context.Context, provinceID string) ([]ClubTransfer, error) {
	return s.transfers.List(ctx, provinceID)
}

func (s *Service) RequestTransfer(ctx context.Context, t ClubTransfer) (*ClubTransfer, error) {
	if t.AthleteID == "" || t.FromClubID == "" || t.ToClubID == "" {
		return nil, fmt.Errorf("athlete_id, from_club_id và to_club_id là bắt buộc")
	}
	t.ID = s.idGen()
	t.Status = TransferStatusPending
	t.RequestedAt = time.Now().UTC()
	return s.transfers.Create(ctx, t)
}

func (s *Service) ApproveTransfer(ctx context.Context, id string, approverID string) error {
	now := time.Now().UTC()
	return s.transfers.Update(ctx, id, map[string]interface{}{
		"status":      string(TransferStatusApproved),
		"approved_at": now,
		"approved_by": approverID,
	})
}

func (s *Service) RejectTransfer(ctx context.Context, id string) error {
	return s.transfers.Update(ctx, id, map[string]interface{}{
		"status": string(TransferStatusRejected),
	})
}

// ── Association Operations ───────────────────────────────────

func (s *Service) ListAssociations(ctx context.Context, provinceID string) ([]Association, error) {
	return s.associations.List(ctx, provinceID)
}

func (s *Service) GetAssociation(ctx context.Context, id string) (*Association, error) {
	return s.associations.GetByID(ctx, id)
}

func (s *Service) CreateAssociation(ctx context.Context, a Association) (*Association, error) {
	if a.Name == "" || a.ProvinceID == "" || a.District == "" {
		return nil, fmt.Errorf("name, province_id và district là bắt buộc")
	}
	a.ID = s.idGen()
	a.Status = AssociationStatusPending
	now := time.Now().UTC()
	a.CreatedAt = now
	a.UpdatedAt = now
	return s.associations.Create(ctx, a)
}

func (s *Service) ApproveAssociation(ctx context.Context, id string) error {
	return s.associations.Update(ctx, id, map[string]interface{}{
		"status":     string(AssociationStatusActive),
		"updated_at": time.Now().UTC(),
	})
}

func (s *Service) SuspendAssociation(ctx context.Context, id string) error {
	return s.associations.Update(ctx, id, map[string]interface{}{
		"status":     string(AssociationStatusSuspended),
		"updated_at": time.Now().UTC(),
	})
}

// ── SubAssociation Operations ────────────────────────────────

func (s *Service) ListSubAssociations(ctx context.Context, provinceID string) ([]SubAssociation, error) {
	return s.subAssociations.List(ctx, provinceID)
}

func (s *Service) ListSubAssociationsByAssociation(ctx context.Context, assocID string) ([]SubAssociation, error) {
	return s.subAssociations.ListByAssociation(ctx, assocID)
}

func (s *Service) GetSubAssociation(ctx context.Context, id string) (*SubAssociation, error) {
	return s.subAssociations.GetByID(ctx, id)
}

func (s *Service) CreateSubAssociation(ctx context.Context, sa SubAssociation) (*SubAssociation, error) {
	if sa.Name == "" || sa.ProvinceID == "" || sa.AssociationID == "" || sa.Ward == "" {
		return nil, fmt.Errorf("name, province_id, association_id và ward là bắt buộc")
	}
	sa.ID = s.idGen()
	sa.Status = AssociationStatusPending
	now := time.Now().UTC()
	sa.CreatedAt = now
	sa.UpdatedAt = now
	return s.subAssociations.Create(ctx, sa)
}

func (s *Service) ApproveSubAssociation(ctx context.Context, id string) error {
	return s.subAssociations.Update(ctx, id, map[string]interface{}{
		"status":     string(AssociationStatusActive),
		"updated_at": time.Now().UTC(),
	})
}

func (s *Service) SuspendSubAssociation(ctx context.Context, id string) error {
	return s.subAssociations.Update(ctx, id, map[string]interface{}{
		"status":     string(AssociationStatusSuspended),
		"updated_at": time.Now().UTC(),
	})
}

// GetAssociationDashboard returns stats for a specific district association.
func (s *Service) GetAssociationDashboard(ctx context.Context, assocID string) (*AssociationDashboardStats, error) {
	assoc, err := s.associations.GetByID(ctx, assocID)
	if err != nil {
		return nil, err
	}
	subAssocs, err := s.subAssociations.ListByAssociation(ctx, assocID)
	if err != nil {
		return nil, err
	}
	clubs, err := s.clubs.List(ctx, assoc.ProvinceID)
	if err != nil {
		return nil, err
	}

	stats := &AssociationDashboardStats{
		AssociationID:   assocID,
		AssociationName: assoc.Name,
		TotalSubAssoc:   len(subAssocs),
	}
	for _, sa := range subAssocs {
		if sa.Status == AssociationStatusActive {
			stats.ActiveSubAssoc++
		}
	}
	for _, c := range clubs {
		if c.AssociationID == assocID {
			stats.TotalClubs++
			if c.Status == ClubStatusActive {
				stats.ActiveClubs++
			}
			stats.TotalAthletes += c.AthleteCount
			stats.TotalCoaches += c.CoachCount
		}
	}

	return stats, nil
}

// ── Võ Sinh Operations ───────────────────────────────────────

func (s *Service) ListVoSinh(ctx context.Context, provinceID string) ([]VoSinh, error) {
	return s.voSinh.List(ctx, provinceID)
}

func (s *Service) ListVoSinhByClub(ctx context.Context, clubID string) ([]VoSinh, error) {
	return s.voSinh.ListByClub(ctx, clubID)
}

func (s *Service) GetVoSinh(ctx context.Context, id string) (*VoSinh, error) {
	return s.voSinh.GetByID(ctx, id)
}

func (s *Service) CreateVoSinh(ctx context.Context, v VoSinh) (*VoSinh, error) {
	if v.FullName == "" || v.ClubID == "" || v.ProvinceID == "" {
		return nil, fmt.Errorf("full_name, club_id và province_id là bắt buộc")
	}
	v.ID = s.idGen()
	v.Status = MemberStatusPending
	if v.BeltRank == "" {
		v.BeltRank = BeltNone
	}
	v.BeltLabel = BeltLabelMap[v.BeltRank]
	if v.AgeGroup != "" {
		v.AgeGroupLabel = AgeGroupLabelMap[v.AgeGroup]
	}
	now := time.Now().UTC()
	v.CreatedAt = now
	v.UpdatedAt = now
	return s.voSinh.Create(ctx, v)
}

func (s *Service) ApproveVoSinh(ctx context.Context, id string) error {
	return s.voSinh.Update(ctx, id, map[string]interface{}{
		"status":     string(MemberStatusActive),
		"updated_at": time.Now().UTC(),
	})
}

func (s *Service) GetVoSinhStats(ctx context.Context, provinceID string) (*VoSinhStats, error) {
	list, err := s.voSinh.List(ctx, provinceID)
	if err != nil {
		return nil, err
	}
	stats := &VoSinhStats{
		Total:      len(list),
		ByGender:   make(map[string]int),
		ByAgeGroup: make(map[string]int),
		ByBelt:     make(map[string]int),
		ByStatus:   make(map[string]int),
	}
	for _, v := range list {
		stats.ByGender[v.Gender]++
		stats.ByAgeGroup[string(v.AgeGroup)]++
		stats.ByBelt[string(v.BeltRank)]++
		stats.ByStatus[string(v.Status)]++
		if v.Status == MemberStatusActive {
			stats.ActiveCount++
		}
		if v.Status == MemberStatusPending {
			stats.PendingCount++
		}
	}
	return stats, nil
}
