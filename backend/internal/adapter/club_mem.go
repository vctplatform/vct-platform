package adapter

import (
	"context"
	"fmt"
	"sync"
	"time"

	"vct-platform/backend/internal/domain/club"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — IN-MEMORY CLUB STORES
// Lightweight implementations for testing and development.
// Moved from domain/club to adapter layer (Clean Architecture).
// ═══════════════════════════════════════════════════════════════

// ── In-Memory Attendance Store ───────────────────────────────

type InMemAttendanceStore struct {
	mu    sync.RWMutex
	items map[string]club.Attendance
}

func NewInMemAttendanceStore() *InMemAttendanceStore {
	s := &InMemAttendanceStore{items: make(map[string]club.Attendance)}
	s.seed()
	return s
}

func (s *InMemAttendanceStore) seed() {
	now := time.Now()
	records := []club.Attendance{
		{ID: "ATT-001", ClubID: "CLB-001", ClassID: "CLS-001", ClassName: "Co ban thieu nhi", MemberID: "MBR-001", MemberName: "Nguyen Van Minh", Date: "2026-03-10", Status: club.AttendancePresent, RecordedBy: "Le Quang Huy", CreatedAt: now},
		{ID: "ATT-002", ClubID: "CLB-001", ClassID: "CLS-001", ClassName: "Co ban thieu nhi", MemberID: "MBR-002", MemberName: "Tran Thi Ha", Date: "2026-03-10", Status: club.AttendanceAbsent, RecordedBy: "Le Quang Huy", CreatedAt: now},
		{ID: "ATT-003", ClubID: "CLB-001", ClassID: "CLS-002", ClassName: "Nang cao doi khang", MemberID: "MBR-004", MemberName: "Pham Nhat Linh", Date: "2026-03-10", Status: club.AttendancePresent, RecordedBy: "Le Quang Huy", CreatedAt: now},
		{ID: "ATT-004", ClubID: "CLB-001", ClassID: "CLS-001", ClassName: "Co ban thieu nhi", MemberID: "MBR-005", MemberName: "Bui Thanh Nam", Date: "2026-03-10", Status: club.AttendanceLate, Notes: "Tre 10 phut", RecordedBy: "Le Quang Huy", CreatedAt: now},
		{ID: "ATT-005", ClubID: "CLB-001", ClassID: "CLS-003", ClassName: "Boi duong quyen", MemberID: "MBR-006", MemberName: "Do Thi Thao", Date: "2026-03-10", Status: club.AttendancePresent, RecordedBy: "Do Thi Thao", CreatedAt: now},
		{ID: "ATT-006", ClubID: "CLB-001", ClassID: "CLS-001", ClassName: "Co ban thieu nhi", MemberID: "MBR-001", MemberName: "Nguyen Van Minh", Date: "2026-03-08", Status: club.AttendancePresent, RecordedBy: "Le Quang Huy", CreatedAt: now},
		{ID: "ATT-007", ClubID: "CLB-001", ClassID: "CLS-001", ClassName: "Co ban thieu nhi", MemberID: "MBR-002", MemberName: "Tran Thi Ha", Date: "2026-03-08", Status: club.AttendanceExcused, Notes: "Xin phep nghi benh", RecordedBy: "Le Quang Huy", CreatedAt: now},
		{ID: "ATT-008", ClubID: "CLB-001", ClassID: "CLS-002", ClassName: "Nang cao doi khang", MemberID: "MBR-003", MemberName: "Le Quang Huy", Date: "2026-03-08", Status: club.AttendancePresent, RecordedBy: "Do Thi Thao", CreatedAt: now},
		{ID: "ATT-009", ClubID: "CLB-001", ClassID: "CLS-003", ClassName: "Boi duong quyen", MemberID: "MBR-004", MemberName: "Pham Nhat Linh", Date: "2026-03-08", Status: club.AttendancePresent, RecordedBy: "Do Thi Thao", CreatedAt: now},
		{ID: "ATT-010", ClubID: "CLB-001", ClassID: "CLS-001", ClassName: "Co ban thieu nhi", MemberID: "MBR-005", MemberName: "Bui Thanh Nam", Date: "2026-03-08", Status: club.AttendanceAbsent, RecordedBy: "Le Quang Huy", CreatedAt: now},
	}
	for _, r := range records {
		s.items[r.ID] = r
	}
}

func (s *InMemAttendanceStore) List(_ context.Context, clubID string) ([]club.Attendance, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make([]club.Attendance, 0)
	for _, r := range s.items {
		if r.ClubID == clubID {
			result = append(result, r)
		}
	}
	return result, nil
}

func (s *InMemAttendanceStore) ListByClass(_ context.Context, clubID, classID string) ([]club.Attendance, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make([]club.Attendance, 0)
	for _, r := range s.items {
		if r.ClubID == clubID && r.ClassID == classID {
			result = append(result, r)
		}
	}
	return result, nil
}

func (s *InMemAttendanceStore) ListByDate(_ context.Context, clubID, date string) ([]club.Attendance, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make([]club.Attendance, 0)
	for _, r := range s.items {
		if r.ClubID == clubID && r.Date == date {
			result = append(result, r)
		}
	}
	return result, nil
}

func (s *InMemAttendanceStore) GetByID(_ context.Context, id string) (*club.Attendance, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	r, ok := s.items[id]
	if !ok {
		return nil, fmt.Errorf("attendance %s not found", id)
	}
	return &r, nil
}

func (s *InMemAttendanceStore) Create(_ context.Context, a club.Attendance) (*club.Attendance, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.items[a.ID] = a
	return &a, nil
}

func (s *InMemAttendanceStore) Delete(_ context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.items, id)
	return nil
}

// ── In-Memory Equipment Store ────────────────────────────────

type InMemEquipmentStore struct {
	mu    sync.RWMutex
	items map[string]club.Equipment
}

func NewInMemEquipmentStore() *InMemEquipmentStore {
	s := &InMemEquipmentStore{items: make(map[string]club.Equipment)}
	s.seed()
	return s
}

func (s *InMemEquipmentStore) seed() {
	now := time.Now()
	equipment := []club.Equipment{
		{ID: "EQP-001", ClubID: "CLB-001", Name: "Giap than", Category: club.EquipCatProtective, Quantity: 15, Condition: club.ConditionGood, PurchaseDate: "2024-06-15", UnitValue: 350000, TotalValue: 5250000, Supplier: "VN Sport", CreatedAt: now, UpdatedAt: now},
		{ID: "EQP-002", ClubID: "CLB-001", Name: "Giap dau", Category: club.EquipCatProtective, Quantity: 15, Condition: club.ConditionGood, PurchaseDate: "2024-06-15", UnitValue: 280000, TotalValue: 4200000, Supplier: "VN Sport", CreatedAt: now, UpdatedAt: now},
		{ID: "EQP-003", ClubID: "CLB-001", Name: "Gang tay", Category: club.EquipCatProtective, Quantity: 20, Condition: club.ConditionWorn, PurchaseDate: "2023-09-01", UnitValue: 180000, TotalValue: 3600000, Supplier: "Thai Boxing", CreatedAt: now, UpdatedAt: now},
		{ID: "EQP-004", ClubID: "CLB-001", Name: "Xa (Phu goi)", Category: club.EquipCatProtective, Quantity: 15, Condition: club.ConditionGood, PurchaseDate: "2024-06-15", UnitValue: 120000, TotalValue: 1800000, Supplier: "VN Sport", CreatedAt: now, UpdatedAt: now},
		{ID: "EQP-005", ClubID: "CLB-001", Name: "Bia do vuong", Category: club.EquipCatTraining, Quantity: 8, Condition: club.ConditionGood, PurchaseDate: "2025-01-10", UnitValue: 250000, TotalValue: 2000000, Supplier: "Saigon Martial", CreatedAt: now, UpdatedAt: now},
		{ID: "EQP-006", ClubID: "CLB-001", Name: "Bao cat treo", Category: club.EquipCatTraining, Quantity: 4, Condition: club.ConditionWorn, PurchaseDate: "2022-03-20", UnitValue: 1200000, TotalValue: 4800000, Supplier: "Thai Boxing", CreatedAt: now, UpdatedAt: now},
		{ID: "EQP-007", ClubID: "CLB-001", Name: "Kiem go tap luyen", Category: club.EquipCatWeapon, Quantity: 12, Condition: club.ConditionGood, PurchaseDate: "2025-02-01", UnitValue: 150000, TotalValue: 1800000, Supplier: "Binh Dinh Craft", CreatedAt: now, UpdatedAt: now},
		{ID: "EQP-008", ClubID: "CLB-001", Name: "Dao tam tap luyen", Category: club.EquipCatWeapon, Quantity: 8, Condition: club.ConditionNew, PurchaseDate: "2026-01-15", UnitValue: 200000, TotalValue: 1600000, Supplier: "Binh Dinh Craft", CreatedAt: now, UpdatedAt: now},
		{ID: "EQP-009", ClubID: "CLB-001", Name: "Vo phuc trang", Category: club.EquipCatUniform, Quantity: 30, Condition: club.ConditionGood, PurchaseDate: "2025-08-01", UnitValue: 320000, TotalValue: 9600000, Supplier: "May Thanh Cong", CreatedAt: now, UpdatedAt: now},
		{ID: "EQP-010", ClubID: "CLB-001", Name: "Hop cuu thuong", Category: club.EquipCatMedical, Quantity: 3, Condition: club.ConditionGood, PurchaseDate: "2025-06-01", UnitValue: 500000, TotalValue: 1500000, Supplier: "Y te VN", CreatedAt: now, UpdatedAt: now},
		{ID: "EQP-011", ClubID: "CLB-001", Name: "Thiet bi cu hong", Category: club.EquipCatTraining, Quantity: 2, Condition: club.ConditionDamaged, PurchaseDate: "2021-01-01", UnitValue: 800000, TotalValue: 1600000, Notes: "Can thay the", CreatedAt: now, UpdatedAt: now},
	}
	for _, e := range equipment {
		s.items[e.ID] = e
	}
}

func (s *InMemEquipmentStore) List(_ context.Context, clubID string) ([]club.Equipment, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make([]club.Equipment, 0)
	for _, e := range s.items {
		if e.ClubID == clubID {
			result = append(result, e)
		}
	}
	return result, nil
}

func (s *InMemEquipmentStore) GetByID(_ context.Context, id string) (*club.Equipment, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	e, ok := s.items[id]
	if !ok {
		return nil, fmt.Errorf("equipment %s not found", id)
	}
	return &e, nil
}

func (s *InMemEquipmentStore) Create(_ context.Context, e club.Equipment) (*club.Equipment, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.items[e.ID] = e
	return &e, nil
}

func (s *InMemEquipmentStore) Update(_ context.Context, id string, patch map[string]interface{}) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	e, ok := s.items[id]
	if !ok {
		return fmt.Errorf("equipment %s not found", id)
	}
	if v, ok := patch["name"].(string); ok {
		e.Name = v
	}
	if v, ok := patch["category"].(string); ok {
		e.Category = club.EquipmentCategory(v)
	}
	if v, ok := patch["quantity"].(float64); ok {
		e.Quantity = int(v)
		e.TotalValue = float64(e.Quantity) * e.UnitValue
	}
	if v, ok := patch["condition"].(string); ok {
		e.Condition = club.EquipmentCondition(v)
	}
	if v, ok := patch["unit_value"].(float64); ok {
		e.UnitValue = v
		e.TotalValue = float64(e.Quantity) * e.UnitValue
	}
	if v, ok := patch["notes"].(string); ok {
		e.Notes = v
	}
	e.UpdatedAt = time.Now()
	s.items[id] = e
	return nil
}

func (s *InMemEquipmentStore) Delete(_ context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.items, id)
	return nil
}

// ── In-Memory Facility Store ─────────────────────────────────

type InMemFacilityStore struct {
	mu    sync.RWMutex
	items map[string]club.Facility
}

func NewInMemFacilityStore() *InMemFacilityStore {
	s := &InMemFacilityStore{items: make(map[string]club.Facility)}
	s.seed()
	return s
}

func (s *InMemFacilityStore) seed() {
	now := time.Now()
	facilities := []club.Facility{
		{ID: "FAC-001", ClubID: "CLB-001", Name: "Phong tap A", Type: club.FacilityTrainingHall, AreaSqm: 180, Capacity: 40, Status: club.FacilityStatusActive, MonthlyRent: 5000000, LastMaintenanceDate: "2026-01-15", NextMaintenanceDate: "2026-07-15", CreatedAt: now, UpdatedAt: now},
		{ID: "FAC-002", ClubID: "CLB-001", Name: "Phong tap B", Type: club.FacilityTrainingHall, AreaSqm: 120, Capacity: 25, Status: club.FacilityStatusActive, MonthlyRent: 3500000, LastMaintenanceDate: "2025-12-01", NextMaintenanceDate: "2026-06-01", CreatedAt: now, UpdatedAt: now},
		{ID: "FAC-003", ClubID: "CLB-001", Name: "San doi khang", Type: club.FacilityArena, AreaSqm: 200, Capacity: 50, Status: club.FacilityStatusActive, MonthlyRent: 7000000, LastMaintenanceDate: "2026-02-20", NextMaintenanceDate: "2026-08-20", CreatedAt: now, UpdatedAt: now},
		{ID: "FAC-004", ClubID: "CLB-001", Name: "Phong tap gym", Type: club.FacilityGym, AreaSqm: 60, Capacity: 15, Status: club.FacilityStatusMaintenance, MonthlyRent: 2000000, Notes: "Dang nang cap thiet bi", LastMaintenanceDate: "2026-03-01", NextMaintenanceDate: "2026-04-01", CreatedAt: now, UpdatedAt: now},
		{ID: "FAC-005", ClubID: "CLB-001", Name: "Kho thiet bi", Type: club.FacilityStorage, AreaSqm: 30, Capacity: 0, Status: club.FacilityStatusActive, MonthlyRent: 0, CreatedAt: now, UpdatedAt: now},
		{ID: "FAC-006", ClubID: "CLB-001", Name: "Van phong CLB", Type: club.FacilityOffice, AreaSqm: 25, Capacity: 6, Status: club.FacilityStatusActive, MonthlyRent: 0, CreatedAt: now, UpdatedAt: now},
		{ID: "FAC-007", ClubID: "CLB-001", Name: "Phong thay do", Type: club.FacilityChanging, AreaSqm: 20, Capacity: 10, Status: club.FacilityStatusActive, MonthlyRent: 0, CreatedAt: now, UpdatedAt: now},
	}
	for _, f := range facilities {
		s.items[f.ID] = f
	}
}

func (s *InMemFacilityStore) List(_ context.Context, clubID string) ([]club.Facility, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make([]club.Facility, 0)
	for _, f := range s.items {
		if f.ClubID == clubID {
			result = append(result, f)
		}
	}
	return result, nil
}

func (s *InMemFacilityStore) GetByID(_ context.Context, id string) (*club.Facility, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	f, ok := s.items[id]
	if !ok {
		return nil, fmt.Errorf("facility %s not found", id)
	}
	return &f, nil
}

func (s *InMemFacilityStore) Create(_ context.Context, f club.Facility) (*club.Facility, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.items[f.ID] = f
	return &f, nil
}

func (s *InMemFacilityStore) Update(_ context.Context, id string, patch map[string]interface{}) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	f, ok := s.items[id]
	if !ok {
		return fmt.Errorf("facility %s not found", id)
	}
	if v, ok := patch["name"].(string); ok {
		f.Name = v
	}
	if v, ok := patch["type"].(string); ok {
		f.Type = club.FacilityType(v)
	}
	if v, ok := patch["area_sqm"].(float64); ok {
		f.AreaSqm = v
	}
	if v, ok := patch["capacity"].(float64); ok {
		f.Capacity = int(v)
	}
	if v, ok := patch["status"].(string); ok {
		f.Status = club.FacilityStatus(v)
	}
	if v, ok := patch["monthly_rent"].(float64); ok {
		f.MonthlyRent = v
	}
	if v, ok := patch["notes"].(string); ok {
		f.Notes = v
	}
	if v, ok := patch["next_maintenance_date"].(string); ok {
		f.NextMaintenanceDate = v
	}
	f.UpdatedAt = time.Now()
	s.items[id] = f
	return nil
}

func (s *InMemFacilityStore) Delete(_ context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.items, id)
	return nil
}
