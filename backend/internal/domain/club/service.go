package club

import (
	"context"
	"fmt"
	"strings"
	"time"
)

// Service provides business logic for the club module's new sub-modules:
// Attendance, Equipment, and Facilities.
type Service struct {
	attendance AttendanceStore
	equipment  EquipmentStore
	facilities FacilityStore
	idGen      func() string
}

// NewService creates a new club service.
func NewService(
	attendance AttendanceStore,
	equipment EquipmentStore,
	facilities FacilityStore,
	idGen func() string,
) *Service {
	return &Service{
		attendance: attendance,
		equipment:  equipment,
		facilities: facilities,
		idGen:      idGen,
	}
}

// ── Validation helpers ───────────────────────────────────────

func validAttendanceStatus(s AttendanceStatus) bool {
	switch s {
	case AttendancePresent, AttendanceAbsent, AttendanceLate, AttendanceExcused:
		return true
	}
	return false
}

func validateAttendance(a Attendance) error {
	if strings.TrimSpace(a.MemberID) == "" {
		return fmt.Errorf("member_id is required")
	}
	if strings.TrimSpace(a.Date) == "" {
		return fmt.Errorf("date is required")
	}
	if !validAttendanceStatus(a.Status) {
		return fmt.Errorf("invalid attendance status: %s", a.Status)
	}
	return nil
}

func validateEquipment(e Equipment) error {
	if strings.TrimSpace(e.Name) == "" {
		return fmt.Errorf("name is required")
	}
	if e.Quantity <= 0 {
		return fmt.Errorf("quantity must be positive, got %d", e.Quantity)
	}
	return nil
}

func validateFacility(f Facility) error {
	if strings.TrimSpace(f.Name) == "" {
		return fmt.Errorf("name is required")
	}
	if f.AreaSqm <= 0 {
		return fmt.Errorf("area_sqm must be positive, got %f", f.AreaSqm)
	}
	return nil
}

// ── Attendance ───────────────────────────────────────────────

func (s *Service) ListAttendance(ctx context.Context, clubID string) ([]Attendance, error) {
	return s.attendance.List(ctx, clubID)
}

func (s *Service) ListAttendanceByClass(ctx context.Context, clubID, classID string) ([]Attendance, error) {
	return s.attendance.ListByClass(ctx, clubID, classID)
}

func (s *Service) ListAttendanceByDate(ctx context.Context, clubID, date string) ([]Attendance, error) {
	return s.attendance.ListByDate(ctx, clubID, date)
}

func (s *Service) RecordAttendance(ctx context.Context, a Attendance) (*Attendance, error) {
	if err := validateAttendance(a); err != nil {
		return nil, err
	}
	a.ID = s.idGen()
	a.CreatedAt = time.Now()
	return s.attendance.Create(ctx, a)
}

func (s *Service) DeleteAttendance(ctx context.Context, id string) error {
	return s.attendance.Delete(ctx, id)
}

func (s *Service) BulkRecordAttendance(ctx context.Context, records []Attendance) ([]Attendance, error) {
	var created []Attendance
	for _, a := range records {
		if err := validateAttendance(a); err != nil {
			return nil, fmt.Errorf("record for %s: %w", a.MemberID, err)
		}
		a.ID = s.idGen()
		a.CreatedAt = time.Now()
		c, err := s.attendance.Create(ctx, a)
		if err != nil {
			return nil, err
		}
		created = append(created, *c)
	}
	return created, nil
}

func (s *Service) GetAttendanceSummary(ctx context.Context, clubID string) (*AttendanceSummary, error) {
	records, err := s.attendance.List(ctx, clubID)
	if err != nil {
		return nil, err
	}
	summary := &AttendanceSummary{ClubID: clubID, TotalRecords: len(records)}
	for _, r := range records {
		switch r.Status {
		case AttendancePresent:
			summary.PresentCount++
		case AttendanceAbsent:
			summary.AbsentCount++
		case AttendanceLate:
			summary.LateCount++
		case AttendanceExcused:
			summary.ExcusedCount++
		}
	}
	if summary.TotalRecords > 0 {
		summary.Rate = float64(summary.PresentCount+summary.LateCount) / float64(summary.TotalRecords) * 100
	}
	return summary, nil
}

// ── Equipment ────────────────────────────────────────────────

func (s *Service) ListEquipment(ctx context.Context, clubID string) ([]Equipment, error) {
	return s.equipment.List(ctx, clubID)
}

func (s *Service) GetEquipment(ctx context.Context, id string) (*Equipment, error) {
	return s.equipment.GetByID(ctx, id)
}

func (s *Service) CreateEquipment(ctx context.Context, e Equipment) (*Equipment, error) {
	if err := validateEquipment(e); err != nil {
		return nil, err
	}
	e.ID = s.idGen()
	e.TotalValue = float64(e.Quantity) * e.UnitValue
	e.CreatedAt = time.Now()
	e.UpdatedAt = time.Now()
	return s.equipment.Create(ctx, e)
}

func (s *Service) UpdateEquipment(ctx context.Context, id string, patch map[string]interface{}) error {
	return s.equipment.Update(ctx, id, patch)
}

func (s *Service) DeleteEquipment(ctx context.Context, id string) error {
	return s.equipment.Delete(ctx, id)
}

func (s *Service) GetEquipmentSummary(ctx context.Context, clubID string) (*EquipmentSummary, error) {
	items, err := s.equipment.List(ctx, clubID)
	if err != nil {
		return nil, err
	}
	summary := &EquipmentSummary{
		ClubID:      clubID,
		ByCategory:  make(map[string]int),
		ByCondition: make(map[string]int),
	}
	for _, item := range items {
		summary.TotalItems += item.Quantity
		summary.TotalValue += item.TotalValue
		summary.ByCategory[string(item.Category)] += item.Quantity
		summary.ByCondition[string(item.Condition)] += item.Quantity
		if item.Condition == ConditionDamaged || item.Condition == ConditionRetired {
			summary.NeedReplacement += item.Quantity
		}
	}
	return summary, nil
}

// ── Facilities ───────────────────────────────────────────────

func (s *Service) ListFacilities(ctx context.Context, clubID string) ([]Facility, error) {
	return s.facilities.List(ctx, clubID)
}

func (s *Service) GetFacility(ctx context.Context, id string) (*Facility, error) {
	return s.facilities.GetByID(ctx, id)
}

func (s *Service) CreateFacility(ctx context.Context, f Facility) (*Facility, error) {
	if err := validateFacility(f); err != nil {
		return nil, err
	}
	f.ID = s.idGen()
	f.CreatedAt = time.Now()
	f.UpdatedAt = time.Now()
	return s.facilities.Create(ctx, f)
}

func (s *Service) UpdateFacility(ctx context.Context, id string, patch map[string]interface{}) error {
	return s.facilities.Update(ctx, id, patch)
}

func (s *Service) DeleteFacility(ctx context.Context, id string) error {
	return s.facilities.Delete(ctx, id)
}

func (s *Service) GetFacilitySummary(ctx context.Context, clubID string) (*FacilitySummary, error) {
	items, err := s.facilities.List(ctx, clubID)
	if err != nil {
		return nil, err
	}
	summary := &FacilitySummary{ClubID: clubID, TotalFacilities: len(items)}
	for _, f := range items {
		summary.TotalAreaSqm += f.AreaSqm
		summary.TotalCapacity += f.Capacity
		summary.TotalMonthlyRent += f.MonthlyRent
		switch f.Status {
		case FacilityStatusActive:
			summary.ActiveCount++
		case FacilityStatusMaintenance:
			summary.MaintenanceCount++
		}
	}
	return summary, nil
}

// ── Dashboard (KPI Aggregation) ──────────────────────────────

func (s *Service) GetDashboard(ctx context.Context, clubID string) (*ClubDashboardV2, error) {
	attSummary, err := s.GetAttendanceSummary(ctx, clubID)
	if err != nil {
		return nil, err
	}
	eqSummary, err := s.GetEquipmentSummary(ctx, clubID)
	if err != nil {
		return nil, err
	}
	facSummary, err := s.GetFacilitySummary(ctx, clubID)
	if err != nil {
		return nil, err
	}

	return &ClubDashboardV2{
		ClubID:           clubID,
		AttendanceRate:   attSummary.Rate,
		TotalSessions:   attSummary.TotalRecords,
		TotalEquipment:  eqSummary.TotalItems,
		EquipmentValue:  eqSummary.TotalValue,
		NeedReplacement: eqSummary.NeedReplacement,
		TotalFacilities:  facSummary.TotalFacilities,
		ActiveFacilities: facSummary.ActiveCount,
		TotalAreaSqm:    facSummary.TotalAreaSqm,
	}, nil
}

// ── CSV Export ────────────────────────────────────────────────

func (s *Service) ExportAttendanceCSV(ctx context.Context, clubID string) (string, error) {
	records, err := s.attendance.List(ctx, clubID)
	if err != nil {
		return "", err
	}
	var b strings.Builder
	b.WriteString("ID,ClubID,ClassID,ClassName,MemberID,MemberName,Date,Status,Notes,RecordedBy\n")
	for _, r := range records {
		fmt.Fprintf(&b, "%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\n",
			r.ID, r.ClubID, r.ClassID, csvEscape(r.ClassName),
			r.MemberID, csvEscape(r.MemberName), r.Date,
			string(r.Status), csvEscape(r.Notes), csvEscape(r.RecordedBy))
	}
	return b.String(), nil
}

func (s *Service) ExportEquipmentCSV(ctx context.Context, clubID string) (string, error) {
	items, err := s.equipment.List(ctx, clubID)
	if err != nil {
		return "", err
	}
	var b strings.Builder
	b.WriteString("ID,ClubID,Name,Category,Quantity,Condition,PurchaseDate,UnitValue,TotalValue,Supplier\n")
	for _, e := range items {
		fmt.Fprintf(&b, "%s,%s,%s,%s,%d,%s,%s,%.0f,%.0f,%s\n",
			e.ID, e.ClubID, csvEscape(e.Name), string(e.Category),
			e.Quantity, string(e.Condition), e.PurchaseDate,
			e.UnitValue, e.TotalValue, csvEscape(e.Supplier))
	}
	return b.String(), nil
}

func (s *Service) ExportFacilitiesCSV(ctx context.Context, clubID string) (string, error) {
	items, err := s.facilities.List(ctx, clubID)
	if err != nil {
		return "", err
	}
	var b strings.Builder
	b.WriteString("ID,ClubID,Name,Type,AreaSqm,Capacity,Status,MonthlyRent,LastMaintenance,NextMaintenance\n")
	for _, f := range items {
		fmt.Fprintf(&b, "%s,%s,%s,%s,%.0f,%d,%s,%.0f,%s,%s\n",
			f.ID, f.ClubID, csvEscape(f.Name), string(f.Type),
			f.AreaSqm, f.Capacity, string(f.Status),
			f.MonthlyRent, f.LastMaintenanceDate, f.NextMaintenanceDate)
	}
	return b.String(), nil
}

func csvEscape(s string) string {
	if strings.ContainsAny(s, ",\"\n") {
		return `"` + strings.ReplaceAll(s, `"`, `""`) + `"`
	}
	return s
}
