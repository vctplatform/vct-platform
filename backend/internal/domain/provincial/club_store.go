package provincial

import (
	"context"
	"fmt"
	"sync"
	"time"
)

// ── Club Class Store ─────────────────────────────────────────

type InMemClubClassStore struct {
	mu    sync.RWMutex
	items map[string]ClubClass
}

func NewInMemClubClassStore() *InMemClubClassStore {
	s := &InMemClubClassStore{items: make(map[string]ClubClass)}
	s.seed()
	return s
}

func (s *InMemClubClassStore) seed() {
	now := time.Now()
	classes := []ClubClass{
		{
			ID: "CLS-001", ClubID: "CLB-001", Name: "Lớp Thiếu Nhi", Level: "beginner",
			CoachID: "CO-001", CoachName: "Trần Văn Hùng",
			Schedule:    []ScheduleSlot{{DayOfWeek: 2, StartTime: "17:00", EndTime: "18:30"}, {DayOfWeek: 5, StartTime: "17:00", EndTime: "18:30"}},
			MaxStudents: 30, CurrentCount: 22, MonthlyFee: 500000, Status: "active", CreatedAt: now, UpdatedAt: now,
		},
		{
			ID: "CLS-002", ClubID: "CLB-001", Name: "Lớp Cơ Bản", Level: "intermediate",
			CoachID: "CO-001", CoachName: "Trần Văn Hùng",
			Schedule:    []ScheduleSlot{{DayOfWeek: 1, StartTime: "18:00", EndTime: "19:30"}, {DayOfWeek: 3, StartTime: "18:00", EndTime: "19:30"}, {DayOfWeek: 6, StartTime: "08:00", EndTime: "10:00"}},
			MaxStudents: 25, CurrentCount: 18, MonthlyFee: 600000, Status: "active", CreatedAt: now, UpdatedAt: now,
		},
		{
			ID: "CLS-003", ClubID: "CLB-001", Name: "Lớp Nâng Cao", Level: "advanced",
			CoachID: "CO-002", CoachName: "Nguyễn Thị Mai",
			Schedule:    []ScheduleSlot{{DayOfWeek: 2, StartTime: "19:00", EndTime: "20:30"}, {DayOfWeek: 4, StartTime: "19:00", EndTime: "20:30"}},
			MaxStudents: 20, CurrentCount: 12, MonthlyFee: 800000, Status: "active", CreatedAt: now, UpdatedAt: now,
		},
		{
			ID: "CLS-004", ClubID: "CLB-001", Name: "Lớp Thi Đấu", Level: "competition",
			CoachID: "CO-002", CoachName: "Nguyễn Thị Mai",
			Schedule:    []ScheduleSlot{{DayOfWeek: 1, StartTime: "05:30", EndTime: "07:00"}, {DayOfWeek: 3, StartTime: "05:30", EndTime: "07:00"}, {DayOfWeek: 5, StartTime: "05:30", EndTime: "07:00"}, {DayOfWeek: 0, StartTime: "07:00", EndTime: "09:00"}},
			MaxStudents: 15, CurrentCount: 8, MonthlyFee: 1000000, Status: "active", CreatedAt: now, UpdatedAt: now,
		},
	}
	for _, c := range classes {
		s.items[c.ID] = c
	}
}

func (s *InMemClubClassStore) List(_ context.Context, clubID string) ([]ClubClass, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make([]ClubClass, 0)
	for _, c := range s.items {
		if c.ClubID == clubID {
			result = append(result, c)
		}
	}
	return result, nil
}

func (s *InMemClubClassStore) GetByID(_ context.Context, id string) (*ClubClass, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	c, ok := s.items[id]
	if !ok {
		return nil, fmt.Errorf("club class %s not found", id)
	}
	return &c, nil
}

func (s *InMemClubClassStore) Create(_ context.Context, c ClubClass) (*ClubClass, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.items[c.ID] = c
	return &c, nil
}

func (s *InMemClubClassStore) Update(_ context.Context, id string, patch map[string]interface{}) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	c, ok := s.items[id]
	if !ok {
		return fmt.Errorf("club class %s not found", id)
	}
	if v, ok := patch["name"].(string); ok {
		c.Name = v
	}
	if v, ok := patch["level"].(string); ok {
		c.Level = v
	}
	if v, ok := patch["status"].(string); ok {
		c.Status = v
	}
	if v, ok := patch["coach_name"].(string); ok {
		c.CoachName = v
	}
	if v, ok := patch["monthly_fee"].(float64); ok {
		c.MonthlyFee = v
	}
	c.UpdatedAt = time.Now()
	s.items[id] = c
	return nil
}

func (s *InMemClubClassStore) Delete(_ context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.items, id)
	return nil
}

// ── Club Member Store ────────────────────────────────────────

type InMemClubMemberStore struct {
	mu    sync.RWMutex
	items map[string]ClubMember
}

func NewInMemClubMemberStore() *InMemClubMemberStore {
	s := &InMemClubMemberStore{items: make(map[string]ClubMember)}
	s.seed()
	return s
}

func (s *InMemClubMemberStore) seed() {
	now := time.Now()
	members := []ClubMember{
		{ID: "MEM-001", ClubID: "CLB-001", FullName: "Lê Hoàng Minh", Gender: "nam", DateOfBirth: "2010-05-15", Phone: "0901234567", BeltRank: "Hoàng đai", ClassID: "CLS-001", ClassName: "Lớp Thiếu Nhi", MemberType: "student", GuardianName: "Lê Văn An", GuardianPhone: "0912345678", Status: MemberStatusActive, JoinDate: "2024-01-10", CreatedAt: now, UpdatedAt: now},
		{ID: "MEM-002", ClubID: "CLB-001", FullName: "Nguyễn Thị Hương", Gender: "nu", DateOfBirth: "2008-09-20", BeltRank: "Lam đai", ClassID: "CLS-002", ClassName: "Lớp Cơ Bản", MemberType: "student", Status: MemberStatusActive, JoinDate: "2023-06-15", CreatedAt: now, UpdatedAt: now},
		{ID: "MEM-003", ClubID: "CLB-001", FullName: "Trần Đức Anh", Gender: "nam", DateOfBirth: "2005-03-12", Phone: "0987654321", BeltRank: "Hồng đai I", ClassID: "CLS-003", ClassName: "Lớp Nâng Cao", MemberType: "student", Status: MemberStatusActive, JoinDate: "2022-09-01", CreatedAt: now, UpdatedAt: now},
		{ID: "MEM-004", ClubID: "CLB-001", FullName: "Phạm Tuấn Kiệt", Gender: "nam", DateOfBirth: "2003-11-08", Phone: "0976543210", BeltRank: "Hồng đai II", ClassID: "CLS-004", ClassName: "Lớp Thi Đấu", MemberType: "student", Status: MemberStatusActive, JoinDate: "2021-03-20", CreatedAt: now, UpdatedAt: now},
		{ID: "MEM-005", ClubID: "CLB-001", FullName: "Võ Thanh Tâm", Gender: "nam", DateOfBirth: "2011-07-03", BeltRank: "Trắng đai", ClassID: "CLS-001", ClassName: "Lớp Thiếu Nhi", MemberType: "student", GuardianName: "Võ Minh Hoàng", GuardianPhone: "0932156789", Status: MemberStatusActive, JoinDate: "2025-01-05", CreatedAt: now, UpdatedAt: now},
		{ID: "MEM-006", ClubID: "CLB-001", FullName: "Đặng Ngọc Bích", Gender: "nu", DateOfBirth: "2007-12-25", BeltRank: "Hoàng đai", ClassID: "CLS-002", ClassName: "Lớp Cơ Bản", MemberType: "student", Status: MemberStatusPending, JoinDate: "2025-02-28", CreatedAt: now, UpdatedAt: now},
		{ID: "MEM-007", ClubID: "CLB-001", FullName: "Huỳnh Quốc Bảo", Gender: "nam", DateOfBirth: "2002-04-18", Phone: "0965432109", BeltRank: "Hồng đai III", ClassID: "CLS-004", ClassName: "Lớp Thi Đấu", MemberType: "student", Status: MemberStatusActive, JoinDate: "2020-08-15", CreatedAt: now, UpdatedAt: now},
		{ID: "MEM-008", ClubID: "CLB-001", FullName: "Lý Thu Hà", Gender: "nu", DateOfBirth: "2009-06-30", BeltRank: "Lam đai", ClassID: "CLS-002", ClassName: "Lớp Cơ Bản", MemberType: "student", Status: MemberStatusActive, JoinDate: "2024-03-10", CreatedAt: now, UpdatedAt: now},
		{ID: "MEM-009", ClubID: "CLB-001", FullName: "Bùi Minh Trí", Gender: "nam", DateOfBirth: "2012-01-22", BeltRank: "Trắng đai", ClassID: "CLS-001", ClassName: "Lớp Thiếu Nhi", MemberType: "student", GuardianName: "Bùi Văn Đức", GuardianPhone: "0945678901", Status: MemberStatusPending, JoinDate: "2025-03-01", CreatedAt: now, UpdatedAt: now},
		{ID: "MEM-010", ClubID: "CLB-001", FullName: "Phan Gia Huy", Gender: "nam", DateOfBirth: "2006-08-14", Phone: "0923456789", BeltRank: "Hồng đai I", ClassID: "CLS-003", ClassName: "Lớp Nâng Cao", MemberType: "student", Status: MemberStatusInactive, JoinDate: "2023-01-20", CreatedAt: now, UpdatedAt: now},
	}
	for _, m := range members {
		s.items[m.ID] = m
	}
}

func (s *InMemClubMemberStore) List(_ context.Context, clubID string) ([]ClubMember, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make([]ClubMember, 0)
	for _, m := range s.items {
		if m.ClubID == clubID {
			result = append(result, m)
		}
	}
	return result, nil
}

func (s *InMemClubMemberStore) GetByID(_ context.Context, id string) (*ClubMember, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	m, ok := s.items[id]
	if !ok {
		return nil, fmt.Errorf("club member %s not found", id)
	}
	return &m, nil
}

func (s *InMemClubMemberStore) Create(_ context.Context, m ClubMember) (*ClubMember, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.items[m.ID] = m
	return &m, nil
}

func (s *InMemClubMemberStore) Update(_ context.Context, id string, patch map[string]interface{}) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	m, ok := s.items[id]
	if !ok {
		return fmt.Errorf("club member %s not found", id)
	}
	if v, ok := patch["full_name"].(string); ok {
		m.FullName = v
	}
	if v, ok := patch["belt_rank"].(string); ok {
		m.BeltRank = v
	}
	if v, ok := patch["class_id"].(string); ok {
		m.ClassID = v
	}
	if v, ok := patch["class_name"].(string); ok {
		m.ClassName = v
	}
	if v, ok := patch["status"].(string); ok {
		m.Status = MemberStatus(v)
	}
	if v, ok := patch["phone"].(string); ok {
		m.Phone = v
	}
	if v, ok := patch["email"].(string); ok {
		m.Email = v
	}
	m.UpdatedAt = time.Now()
	s.items[id] = m
	return nil
}

func (s *InMemClubMemberStore) Delete(_ context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.items, id)
	return nil
}

// ── Club Finance Store ───────────────────────────────────────

type InMemClubFinanceEntryStore struct {
	mu    sync.RWMutex
	items map[string]ClubFinanceEntry
}

func NewInMemClubFinanceEntryStore() *InMemClubFinanceEntryStore {
	s := &InMemClubFinanceEntryStore{items: make(map[string]ClubFinanceEntry)}
	s.seed()
	return s
}

func (s *InMemClubFinanceEntryStore) seed() {
	now := time.Now()
	entries := []ClubFinanceEntry{
		{ID: "FIN-001", ClubID: "CLB-001", Type: "income", Category: "hoi_phi", Amount: 12000000, Description: "Thu hội phí tháng 3/2025 — 20 học viên", MemberName: "", Date: "2025-03-05", RecordedBy: "Thủ quỹ Lan", CreatedAt: now},
		{ID: "FIN-002", ClubID: "CLB-001", Type: "expense", Category: "thue_san", Amount: 5000000, Description: "Thuê sân tập tháng 3/2025", Date: "2025-03-01", RecordedBy: "Thủ quỹ Lan", CreatedAt: now},
		{ID: "FIN-003", ClubID: "CLB-001", Type: "income", Category: "hoi_phi", Amount: 4000000, Description: "Thu hội phí lớp thi đấu — 8 VĐV", Date: "2025-03-05", RecordedBy: "Thủ quỹ Lan", CreatedAt: now},
		{ID: "FIN-004", ClubID: "CLB-001", Type: "expense", Category: "thiet_bi", Amount: 3500000, Description: "Mua giáp, găng tay, bia đỡ", Date: "2025-02-20", RecordedBy: "Chủ nhiệm An", CreatedAt: now},
		{ID: "FIN-005", ClubID: "CLB-001", Type: "income", Category: "giai_dau", Amount: 2000000, Description: "Thưởng giải Trẻ TP.HCM 2025", Date: "2025-02-28", RecordedBy: "Chủ nhiệm An", CreatedAt: now},
		{ID: "FIN-006", ClubID: "CLB-001", Type: "expense", Category: "giai_dau", Amount: 1500000, Description: "Phí đăng ký giải + di chuyển", Date: "2025-02-25", RecordedBy: "Chủ nhiệm An", CreatedAt: now},
		{ID: "FIN-007", ClubID: "CLB-001", Type: "income", Category: "hoi_phi", Amount: 10800000, Description: "Thu hội phí tháng 2/2025 — 18 học viên", Date: "2025-02-05", RecordedBy: "Thủ quỹ Lan", CreatedAt: now},
		{ID: "FIN-008", ClubID: "CLB-001", Type: "expense", Category: "thue_san", Amount: 5000000, Description: "Thuê sân tập tháng 2/2025", Date: "2025-02-01", RecordedBy: "Thủ quỹ Lan", CreatedAt: now},
	}
	for _, e := range entries {
		s.items[e.ID] = e
	}
}

func (s *InMemClubFinanceEntryStore) List(_ context.Context, clubID string) ([]ClubFinanceEntry, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make([]ClubFinanceEntry, 0)
	for _, f := range s.items {
		if f.ClubID == clubID {
			result = append(result, f)
		}
	}
	return result, nil
}

func (s *InMemClubFinanceEntryStore) GetByID(_ context.Context, id string) (*ClubFinanceEntry, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	f, ok := s.items[id]
	if !ok {
		return nil, fmt.Errorf("finance entry %s not found", id)
	}
	return &f, nil
}

func (s *InMemClubFinanceEntryStore) Create(_ context.Context, f ClubFinanceEntry) (*ClubFinanceEntry, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.items[f.ID] = f
	return &f, nil
}
