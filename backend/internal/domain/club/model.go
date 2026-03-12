package club

import "time"

// ── Club / Võ Đường Type ─────────────────────────────────────

type OrgType string

const (
	OrgTypeClub     OrgType = "club"      // Câu lạc bộ
	OrgTypeVoDuong  OrgType = "vo_duong"  // Võ đường
)

type ClubStatus string

const (
	ClubStatusActive   ClubStatus = "active"
	ClubStatusPaused   ClubStatus = "paused"
	ClubStatusInactive ClubStatus = "inactive"
)

// Club represents a CLB or Võ Đường entity.
type Club struct {
	ID           string     `json:"id"`
	Name         string     `json:"name"`
	ShortName    string     `json:"short_name"`
	Code         string     `json:"code"`          // Internal code e.g. CLB-TL-001
	Type         OrgType    `json:"type"`           // club or vo_duong
	Lineage      string     `json:"lineage"`        // Hệ phái e.g. Bình Định gia
	ProvinceID   string     `json:"province_id"`    // Tỉnh/TP trực thuộc
	District     string     `json:"district"`       // Quận/Huyện
	Address      string     `json:"address"`
	LeaderName   string     `json:"leader_name"`    // Chủ nhiệm / Trưởng Võ Đường
	LeaderPhone  string     `json:"leader_phone"`
	Email        string     `json:"email"`
	Website      string     `json:"website"`
	FoundedDate  string     `json:"founded_date"`   // YYYY-MM-DD
	FacilitySize float64    `json:"facility_size"`  // m²
	MaxCapacity  int        `json:"max_capacity"`
	Status       ClubStatus `json:"status"`
	TrainingDays []int      `json:"training_days"`  // 1=Mon … 7=Sun
	OpenTime     string     `json:"open_time"`      // HH:MM
	CloseTime    string     `json:"close_time"`     // HH:MM
	SocialLinks  []string   `json:"social_links"`   // Facebook, Zalo, etc.
	Description  string     `json:"description"`
	LogoURL      string     `json:"logo_url"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

// ── Attendance (Điểm danh) ───────────────────────────────────

type AttendanceStatus string

const (
	AttendancePresent  AttendanceStatus = "present"  // Có mặt
	AttendanceAbsent   AttendanceStatus = "absent"   // Vắng
	AttendanceLate     AttendanceStatus = "late"      // Trễ
	AttendanceExcused  AttendanceStatus = "excused"   // Có phép
)

// Attendance records a single member's attendance for a class session.
type Attendance struct {
	ID        string           `json:"id"`
	ClubID    string           `json:"club_id"`
	ClassID   string           `json:"class_id"`
	ClassName string           `json:"class_name"`
	MemberID  string           `json:"member_id"`
	MemberName string          `json:"member_name"`
	Date      string           `json:"date"` // YYYY-MM-DD
	Status    AttendanceStatus `json:"status"`
	Notes     string           `json:"notes,omitempty"`
	RecordedBy string          `json:"recorded_by"`
	CreatedAt time.Time        `json:"created_at"`
}

// AttendanceSummary provides aggregated statistics.
type AttendanceSummary struct {
	ClubID       string  `json:"club_id"`
	TotalRecords int     `json:"total_records"`
	PresentCount int     `json:"present_count"`
	AbsentCount  int     `json:"absent_count"`
	LateCount    int     `json:"late_count"`
	ExcusedCount int     `json:"excused_count"`
	Rate         float64 `json:"rate"` // present+late / total * 100
}

// ── Equipment (Trang thiết bị) ───────────────────────────────

type EquipmentCategory string

const (
	EquipCatProtective EquipmentCategory = "protective"  // Bảo hộ (giáp, mũ, xạ)
	EquipCatTraining   EquipmentCategory = "training"    // Tập luyện (đích, bia, bao cát)
	EquipCatWeapon     EquipmentCategory = "weapon"      // Binh khí (kiếm, đao, côn)
	EquipCatUniform    EquipmentCategory = "uniform"     // Võ phục
	EquipCatMedical    EquipmentCategory = "medical"     // Y tế (băng, thuốc)
	EquipCatOther      EquipmentCategory = "other"       // Khác
)

type EquipmentCondition string

const (
	ConditionNew       EquipmentCondition = "new"
	ConditionGood      EquipmentCondition = "good"
	ConditionWorn      EquipmentCondition = "worn"       // Cũ / hao mòn
	ConditionDamaged   EquipmentCondition = "damaged"    // Hư hỏng
	ConditionRetired   EquipmentCondition = "retired"    // Thanh lý
)

// Equipment tracks a single inventory item or category of items.
type Equipment struct {
	ID           string             `json:"id"`
	ClubID       string             `json:"club_id"`
	Name         string             `json:"name"`          // e.g. "Giáp thân"
	Category     EquipmentCategory  `json:"category"`
	Quantity     int                `json:"quantity"`
	Condition    EquipmentCondition `json:"condition"`
	PurchaseDate string             `json:"purchase_date"` // YYYY-MM-DD
	UnitValue    float64            `json:"unit_value"`    // VND per unit
	TotalValue   float64            `json:"total_value"`   // quantity * unit_value
	Supplier     string             `json:"supplier"`
	Notes        string             `json:"notes,omitempty"`
	CreatedAt    time.Time          `json:"created_at"`
	UpdatedAt    time.Time          `json:"updated_at"`
}

// EquipmentSummary provides an overview of inventory.
type EquipmentSummary struct {
	ClubID          string             `json:"club_id"`
	TotalItems      int                `json:"total_items"`
	TotalValue      float64            `json:"total_value"`
	ByCategory      map[string]int     `json:"by_category"`
	ByCondition     map[string]int     `json:"by_condition"`
	NeedReplacement int                `json:"need_replacement"` // damaged + retired
}

// ── Facility (Cơ sở vật chất) ────────────────────────────────

type FacilityType string

const (
	FacilityTrainingHall FacilityType = "training_hall" // Phòng tập
	FacilityArena        FacilityType = "arena"         // Sân thi đấu
	FacilityGym          FacilityType = "gym"           // Phòng gym / thể lực
	FacilityStorage      FacilityType = "storage"       // Kho thiết bị
	FacilityOffice       FacilityType = "office"        // Văn phòng
	FacilityChanging     FacilityType = "changing_room" // Phòng thay đồ
	FacilityOther        FacilityType = "other"
)

type FacilityStatus string

const (
	FacilityStatusActive      FacilityStatus = "active"
	FacilityStatusMaintenance FacilityStatus = "maintenance" // Đang bảo trì
	FacilityStatusClosed      FacilityStatus = "closed"
)

// Facility represents a physical space managed by the club.
type Facility struct {
	ID               string         `json:"id"`
	ClubID           string         `json:"club_id"`
	Name             string         `json:"name"`             // e.g. "Phòng tập A"
	Type             FacilityType   `json:"type"`
	AreaSqm          float64        `json:"area_sqm"`         // Diện tích m²
	Capacity         int            `json:"capacity"`          // Sức chứa
	Status           FacilityStatus `json:"status"`
	Address          string         `json:"address,omitempty"` // Nếu khác trụ sở chính
	LastMaintenanceDate string      `json:"last_maintenance_date,omitempty"`
	NextMaintenanceDate string      `json:"next_maintenance_date,omitempty"`
	MonthlyRent      float64        `json:"monthly_rent"`      // VND
	Notes            string         `json:"notes,omitempty"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
}

// FacilitySummary provides overview statistics.
type FacilitySummary struct {
	ClubID          string         `json:"club_id"`
	TotalFacilities int            `json:"total_facilities"`
	TotalAreaSqm    float64        `json:"total_area_sqm"`
	TotalCapacity   int            `json:"total_capacity"`
	ActiveCount     int            `json:"active_count"`
	MaintenanceCount int           `json:"maintenance_count"`
	TotalMonthlyRent float64       `json:"total_monthly_rent"`
}

// ── Dashboard (KPI tổng hợp) ────────────────────────────────

type ClubDashboardV2 struct {
	ClubID          string  `json:"club_id"`
	ClubName        string  `json:"club_name"`
	ClubType        OrgType `json:"club_type"`

	// Attendance
	AttendanceRate  float64 `json:"attendance_rate"`   // % (last 30 days)
	TotalSessions   int     `json:"total_sessions"`

	// Equipment
	TotalEquipment  int     `json:"total_equipment"`
	EquipmentValue  float64 `json:"equipment_value"`
	NeedReplacement int     `json:"need_replacement"`

	// Facilities
	TotalFacilities int     `json:"total_facilities"`
	ActiveFacilities int    `json:"active_facilities"`
	TotalAreaSqm    float64 `json:"total_area_sqm"`
}
