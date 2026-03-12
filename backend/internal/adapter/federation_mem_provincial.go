package adapter

import (
	"context"
	"fmt"
	"sync"
	"time"

	"vct-platform/backend/internal/domain/federation"
)

// ════════════════════════════════════════════════════════════════
// IN-MEMORY PROVINCIAL REPOSITORIES (for testing & development)
// ════════════════════════════════════════════════════════════════

// ── Provincial Club Repository ──

type MemProvincialClubRepo struct {
	mu   sync.RWMutex
	data map[string]federation.ProvincialClub
	seq  int
}

func NewMemProvincialClubRepo() *MemProvincialClubRepo {
	r := &MemProvincialClubRepo{data: make(map[string]federation.ProvincialClub)}
	r.seed()
	return r
}

func (r *MemProvincialClubRepo) seed() {
	now := time.Now()
	clubs := []federation.ProvincialClub{
		{ID: "clb-001", ProvinceID: "BD", Name: "CLB Tấn Long", Code: "BD-001", Address: "123 Đại lộ Bình Dương, Thủ Dầu Một", District: "Thủ Dầu Một", LeaderName: "Nguyễn Văn Hùng", LeaderPhone: "0901234567", MemberCount: 85, AthleteCount: 45, CoachCount: 5, Status: federation.ClubStatusActive, FoundedDate: "2018-03-15", CreatedAt: now, UpdatedAt: now},
		{ID: "clb-002", ProvinceID: "BD", Name: "CLB Phong Vũ", Code: "BD-002", Address: "45 Lê Hồng Phong, Dĩ An", District: "Dĩ An", LeaderName: "Trần Thị Mai", LeaderPhone: "0912345678", MemberCount: 60, AthleteCount: 30, CoachCount: 3, Status: federation.ClubStatusActive, FoundedDate: "2019-06-20", CreatedAt: now, UpdatedAt: now},
		{ID: "clb-003", ProvinceID: "BD", Name: "CLB Rồng Vàng", Code: "BD-003", Address: "78 Nguyễn Tri Phương, Thuận An", District: "Thuận An", LeaderName: "Lê Minh Tú", LeaderPhone: "0923456789", MemberCount: 100, AthleteCount: 55, CoachCount: 6, Status: federation.ClubStatusActive, FoundedDate: "2015-09-01", CreatedAt: now, UpdatedAt: now},
		{ID: "clb-004", ProvinceID: "BD", Name: "CLB Bạch Hổ", Code: "BD-004", Address: "12 Trần Hưng Đạo, Bến Cát", District: "Bến Cát", LeaderName: "Phạm Quốc Huy", LeaderPhone: "0934567890", MemberCount: 40, AthleteCount: 20, CoachCount: 2, Status: federation.ClubStatusActive, FoundedDate: "2020-01-10", CreatedAt: now, UpdatedAt: now},
		{ID: "clb-005", ProvinceID: "BD", Name: "CLB Thanh Long", Code: "BD-005", Address: "5 Cách Mạng Tháng 8, Tân Uyên", District: "Tân Uyên", LeaderName: "Võ Thanh Bình", LeaderPhone: "0945678901", MemberCount: 55, AthleteCount: 28, CoachCount: 3, Status: federation.ClubStatusActive, FoundedDate: "2017-11-25", CreatedAt: now, UpdatedAt: now},
		{ID: "clb-006", ProvinceID: "BD", Name: "CLB Kim Quy", Code: "BD-006", Address: "90 Hùng Vương, Thủ Dầu Một", District: "Thủ Dầu Một", LeaderName: "Đặng Văn Lâm", LeaderPhone: "0956789012", MemberCount: 35, AthleteCount: 18, CoachCount: 2, Status: federation.ClubStatusPending, FoundedDate: "2025-12-01", CreatedAt: now, UpdatedAt: now},
		{ID: "clb-007", ProvinceID: "BD", Name: "CLB Phượng Hoàng", Code: "BD-007", Address: "33 Lý Thường Kiệt, Dĩ An", District: "Dĩ An", LeaderName: "Hoàng Thị Ngọc", LeaderPhone: "0967890123", MemberCount: 70, AthleteCount: 38, CoachCount: 4, Status: federation.ClubStatusActive, FoundedDate: "2016-07-14", CreatedAt: now, UpdatedAt: now},
		{ID: "clb-008", ProvinceID: "BD", Name: "CLB Lôi Phong", Code: "BD-008", Address: "200 Yersin, Thuận An", District: "Thuận An", LeaderName: "Ngô Đình Khoa", LeaderPhone: "0978901234", MemberCount: 25, AthleteCount: 12, CoachCount: 1, Status: federation.ClubStatusInactive, FoundedDate: "2022-04-10", CreatedAt: now, UpdatedAt: now},
		{ID: "clb-009", ProvinceID: "HCM", Name: "CLB Thăng Long HCM", Code: "HCM-001", Address: "150 Nguyễn Thị Minh Khai, Q3", District: "Quận 3", LeaderName: "Bùi Văn Đức", LeaderPhone: "0989012345", MemberCount: 120, AthleteCount: 65, CoachCount: 8, Status: federation.ClubStatusActive, FoundedDate: "2012-01-01", CreatedAt: now, UpdatedAt: now},
		{ID: "clb-010", ProvinceID: "HCM", Name: "CLB Mai Hoa Quyền", Code: "HCM-002", Address: "88 Lê Văn Sỹ, Tân Bình", District: "Tân Bình", LeaderName: "Lý Thị Hoa", LeaderPhone: "0990123456", MemberCount: 95, AthleteCount: 50, CoachCount: 6, Status: federation.ClubStatusActive, FoundedDate: "2014-05-20", CreatedAt: now, UpdatedAt: now},
	}
	for _, c := range clubs {
		r.data[c.ID] = c
	}
}

func (r *MemProvincialClubRepo) List(_ context.Context, provinceID string) ([]federation.ProvincialClub, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []federation.ProvincialClub
	for _, v := range r.data {
		if provinceID == "" || v.ProvinceID == provinceID {
			out = append(out, v)
		}
	}
	return out, nil
}

func (r *MemProvincialClubRepo) GetByID(_ context.Context, id string) (*federation.ProvincialClub, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	c, ok := r.data[id]
	if !ok {
		return nil, fmt.Errorf("club %q not found", id)
	}
	return &c, nil
}

func (r *MemProvincialClubRepo) Create(_ context.Context, c federation.ProvincialClub) (*federation.ProvincialClub, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if c.ID == "" {
		r.seq++
		c.ID = fmt.Sprintf("clb-%03d", r.seq+100)
	}
	r.data[c.ID] = c
	return &c, nil
}

func (r *MemProvincialClubRepo) Update(_ context.Context, id string, patch map[string]interface{}) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, ok := r.data[id]; !ok {
		return fmt.Errorf("club %q not found", id)
	}
	return nil
}

func (r *MemProvincialClubRepo) Delete(_ context.Context, id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.data, id)
	return nil
}

// ── Provincial Athlete Repository ──

type MemProvincialAthleteRepo struct {
	mu   sync.RWMutex
	data map[string]federation.ProvincialAthlete
	seq  int
}

func NewMemProvincialAthleteRepo() *MemProvincialAthleteRepo {
	r := &MemProvincialAthleteRepo{data: make(map[string]federation.ProvincialAthlete)}
	r.seed()
	return r
}

func (r *MemProvincialAthleteRepo) seed() {
	now := time.Now()
	athletes := []federation.ProvincialAthlete{
		{ID: "vdv-001", ProvinceID: "BD", ClubID: "clb-001", ClubName: "CLB Tấn Long", FullName: "Nguyễn Minh Tuấn", Gender: "MALE", DateOfBirth: "2005-03-12", BeltLevel: 5, BeltName: "Đai xanh đậm", WeightKg: 62, HeightCm: 170, Status: federation.AthleteActive, JoinDate: "2020-09-01", CreatedAt: now, UpdatedAt: now},
		{ID: "vdv-002", ProvinceID: "BD", ClubID: "clb-001", ClubName: "CLB Tấn Long", FullName: "Trần Thị Hương", Gender: "FEMALE", DateOfBirth: "2006-07-25", BeltLevel: 4, BeltName: "Đai xanh lá", WeightKg: 50, HeightCm: 160, Status: federation.AthleteActive, JoinDate: "2021-01-15", CreatedAt: now, UpdatedAt: now},
		{ID: "vdv-003", ProvinceID: "BD", ClubID: "clb-002", ClubName: "CLB Phong Vũ", FullName: "Lê Quốc Anh", Gender: "MALE", DateOfBirth: "2004-11-30", BeltLevel: 7, BeltName: "Đai nâu", WeightKg: 70, HeightCm: 175, Status: federation.AthleteActive, JoinDate: "2019-03-10", Achievements: "HCV Giải tỉnh 2025", CreatedAt: now, UpdatedAt: now},
		{ID: "vdv-004", ProvinceID: "BD", ClubID: "clb-002", ClubName: "CLB Phong Vũ", FullName: "Phạm Thị Lan", Gender: "FEMALE", DateOfBirth: "2007-01-14", BeltLevel: 3, BeltName: "Đai xanh lá", WeightKg: 45, HeightCm: 155, Status: federation.AthleteActive, JoinDate: "2022-06-01", CreatedAt: now, UpdatedAt: now},
		{ID: "vdv-005", ProvinceID: "BD", ClubID: "clb-003", ClubName: "CLB Rồng Vàng", FullName: "Võ Đình Khôi", Gender: "MALE", DateOfBirth: "2003-05-20", BeltLevel: 8, BeltName: "Đai đen nhất đẳng", WeightKg: 75, HeightCm: 178, Status: federation.AthleteActive, JoinDate: "2017-09-01", Achievements: "HCB Giải quốc gia 2025", CreatedAt: now, UpdatedAt: now},
		{ID: "vdv-006", ProvinceID: "BD", ClubID: "clb-003", ClubName: "CLB Rồng Vàng", FullName: "Đặng Huyền Trang", Gender: "FEMALE", DateOfBirth: "2005-08-08", BeltLevel: 6, BeltName: "Đai nâu nhạt", WeightKg: 55, HeightCm: 163, Status: federation.AthleteActive, JoinDate: "2020-02-14", CreatedAt: now, UpdatedAt: now},
		{ID: "vdv-007", ProvinceID: "BD", ClubID: "clb-004", ClubName: "CLB Bạch Hổ", FullName: "Hoàng Việt Anh", Gender: "MALE", DateOfBirth: "2008-12-03", BeltLevel: 2, BeltName: "Đai vàng", WeightKg: 42, HeightCm: 150, Status: federation.AthleteActive, JoinDate: "2023-09-01", CreatedAt: now, UpdatedAt: now},
		{ID: "vdv-008", ProvinceID: "BD", ClubID: "clb-005", ClubName: "CLB Thanh Long", FullName: "Bùi Thành Nam", Gender: "MALE", DateOfBirth: "2002-04-18", BeltLevel: 9, BeltName: "Đai đen nhị đẳng", WeightKg: 80, HeightCm: 182, Status: federation.AthleteActive, JoinDate: "2016-01-10", Achievements: "HCV Giải quốc gia 2024", CreatedAt: now, UpdatedAt: now},
		{ID: "vdv-009", ProvinceID: "BD", ClubID: "clb-005", ClubName: "CLB Thanh Long", FullName: "Lý Ngọc Diệp", Gender: "FEMALE", DateOfBirth: "2006-10-22", BeltLevel: 5, BeltName: "Đai xanh đậm", WeightKg: 48, HeightCm: 158, Status: federation.AthleteActive, JoinDate: "2021-08-20", CreatedAt: now, UpdatedAt: now},
		{ID: "vdv-010", ProvinceID: "BD", ClubID: "clb-007", ClubName: "CLB Phượng Hoàng", FullName: "Trịnh Văn Đạt", Gender: "MALE", DateOfBirth: "2001-06-15", BeltLevel: 10, BeltName: "Đai đen tam đẳng", WeightKg: 68, HeightCm: 172, Status: federation.AthleteActive, JoinDate: "2015-03-01", Achievements: "HCĐ SEA Games 2025", CreatedAt: now, UpdatedAt: now},
	}
	for _, a := range athletes {
		r.data[a.ID] = a
	}
}

func (r *MemProvincialAthleteRepo) List(_ context.Context, provinceID string) ([]federation.ProvincialAthlete, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []federation.ProvincialAthlete
	for _, v := range r.data {
		if provinceID == "" || v.ProvinceID == provinceID {
			out = append(out, v)
		}
	}
	return out, nil
}

func (r *MemProvincialAthleteRepo) GetByID(_ context.Context, id string) (*federation.ProvincialAthlete, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	a, ok := r.data[id]
	if !ok {
		return nil, fmt.Errorf("athlete %q not found", id)
	}
	return &a, nil
}

func (r *MemProvincialAthleteRepo) Create(_ context.Context, a federation.ProvincialAthlete) (*federation.ProvincialAthlete, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if a.ID == "" {
		r.seq++
		a.ID = fmt.Sprintf("vdv-%03d", r.seq+100)
	}
	r.data[a.ID] = a
	return &a, nil
}

func (r *MemProvincialAthleteRepo) Update(_ context.Context, id string, patch map[string]interface{}) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, ok := r.data[id]; !ok {
		return fmt.Errorf("athlete %q not found", id)
	}
	return nil
}

func (r *MemProvincialAthleteRepo) Delete(_ context.Context, id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.data, id)
	return nil
}

func (r *MemProvincialAthleteRepo) ListByClub(_ context.Context, clubID string) ([]federation.ProvincialAthlete, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []federation.ProvincialAthlete
	for _, a := range r.data {
		if a.ClubID == clubID {
			out = append(out, a)
		}
	}
	return out, nil
}

// ── Provincial Coach Repository ──

type MemProvincialCoachRepo struct {
	mu   sync.RWMutex
	data map[string]federation.ProvincialCoach
	seq  int
}

func NewMemProvincialCoachRepo() *MemProvincialCoachRepo {
	r := &MemProvincialCoachRepo{data: make(map[string]federation.ProvincialCoach)}
	r.seed()
	return r
}

func (r *MemProvincialCoachRepo) seed() {
	now := time.Now()
	coaches := []federation.ProvincialCoach{
		{ID: "hlv-001", ProvinceID: "BD", ClubID: "clb-001", ClubName: "CLB Tấn Long", FullName: "Nguyễn Văn Hùng", Gender: "MALE", DateOfBirth: "1980-05-10", Phone: "0901234567", Email: "hung.nv@email.com", Level: federation.CoachLevelNational, CertNumber: "HLV-QG-0125", CertExpiry: "2027-12-31", BeltLevel: 12, BeltName: "Đai đen ngũ đẳng", YearsExperience: 25, Specialization: "Đối kháng", Status: "ACTIVE", CreatedAt: now, UpdatedAt: now},
		{ID: "hlv-002", ProvinceID: "BD", ClubID: "clb-001", ClubName: "CLB Tấn Long", FullName: "Trần Minh Đức", Gender: "MALE", DateOfBirth: "1985-08-22", Phone: "0912345678", Email: "duc.tm@email.com", Level: federation.CoachLevelProvincial, CertNumber: "HLV-T-BD-042", CertExpiry: "2026-06-30", BeltLevel: 10, BeltName: "Đai đen tam đẳng", YearsExperience: 15, Specialization: "Quyền thuật", Status: "ACTIVE", CreatedAt: now, UpdatedAt: now},
		{ID: "hlv-003", ProvinceID: "BD", ClubID: "clb-002", ClubName: "CLB Phong Vũ", FullName: "Lê Thị Hạnh", Gender: "FEMALE", DateOfBirth: "1988-03-15", Phone: "0923456789", Email: "hanh.lt@email.com", Level: federation.CoachLevelProvincial, CertNumber: "HLV-T-BD-056", CertExpiry: "2027-03-31", BeltLevel: 9, BeltName: "Đai đen nhị đẳng", YearsExperience: 12, Specialization: "Quyền & Song luyện", Status: "ACTIVE", CreatedAt: now, UpdatedAt: now},
		{ID: "hlv-004", ProvinceID: "BD", ClubID: "clb-003", ClubName: "CLB Rồng Vàng", FullName: "Võ Hoàng Sơn", Gender: "MALE", DateOfBirth: "1975-11-05", Phone: "0934567890", Email: "son.vh@email.com", Level: federation.CoachLevelMaster, CertNumber: "HLV-QG-0068", CertExpiry: "2028-12-31", BeltLevel: 14, BeltName: "Đai đen thất đẳng", YearsExperience: 35, Specialization: "Binh khí & Quyền cổ truyền", Status: "ACTIVE", CreatedAt: now, UpdatedAt: now},
		{ID: "hlv-005", ProvinceID: "BD", ClubID: "clb-003", ClubName: "CLB Rồng Vàng", FullName: "Đặng Thị Thanh", Gender: "FEMALE", DateOfBirth: "1990-07-20", Phone: "0945678901", Email: "thanh.dt@email.com", Level: federation.CoachLevelProvincial, CertNumber: "HLV-T-BD-078", CertExpiry: "2026-09-30", BeltLevel: 8, BeltName: "Đai đen nhất đẳng", YearsExperience: 10, Specialization: "Đối kháng nữ", Status: "ACTIVE", CreatedAt: now, UpdatedAt: now},
		{ID: "hlv-006", ProvinceID: "BD", ClubID: "clb-005", ClubName: "CLB Thanh Long", FullName: "Bùi Quốc Trung", Gender: "MALE", DateOfBirth: "1982-01-30", Phone: "0956789012", Email: "trung.bq@email.com", Level: federation.CoachLevelNational, CertNumber: "HLV-QG-0156", CertExpiry: "2027-06-30", BeltLevel: 11, BeltName: "Đai đen tứ đẳng", YearsExperience: 20, Specialization: "Đối kháng & Tự vệ", Status: "ACTIVE", CreatedAt: now, UpdatedAt: now},
		{ID: "hlv-007", ProvinceID: "BD", ClubID: "clb-007", ClubName: "CLB Phượng Hoàng", FullName: "Hoàng Minh Tâm", Gender: "MALE", DateOfBirth: "1987-09-14", Phone: "0967890123", Email: "tam.hm@email.com", Level: federation.CoachLevelProvincial, CertNumber: "HLV-T-BD-090", CertExpiry: "2026-12-31", BeltLevel: 9, BeltName: "Đai đen nhị đẳng", YearsExperience: 14, Specialization: "Quyền thuật", Status: "ACTIVE", CreatedAt: now, UpdatedAt: now},
	}
	for _, c := range coaches {
		r.data[c.ID] = c
	}
}

func (r *MemProvincialCoachRepo) List(_ context.Context, provinceID string) ([]federation.ProvincialCoach, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []federation.ProvincialCoach
	for _, v := range r.data {
		if provinceID == "" || v.ProvinceID == provinceID {
			out = append(out, v)
		}
	}
	return out, nil
}

func (r *MemProvincialCoachRepo) GetByID(_ context.Context, id string) (*federation.ProvincialCoach, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	c, ok := r.data[id]
	if !ok {
		return nil, fmt.Errorf("coach %q not found", id)
	}
	return &c, nil
}

func (r *MemProvincialCoachRepo) Create(_ context.Context, c federation.ProvincialCoach) (*federation.ProvincialCoach, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if c.ID == "" {
		r.seq++
		c.ID = fmt.Sprintf("hlv-%03d", r.seq+100)
	}
	r.data[c.ID] = c
	return &c, nil
}

func (r *MemProvincialCoachRepo) Update(_ context.Context, id string, patch map[string]interface{}) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, ok := r.data[id]; !ok {
		return fmt.Errorf("coach %q not found", id)
	}
	return nil
}

func (r *MemProvincialCoachRepo) Delete(_ context.Context, id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.data, id)
	return nil
}

// ── Provincial Report Repository ──

type MemProvincialReportRepo struct {
	mu   sync.RWMutex
	data map[string]federation.ProvincialReport
	seq  int
}

func NewMemProvincialReportRepo() *MemProvincialReportRepo {
	r := &MemProvincialReportRepo{data: make(map[string]federation.ProvincialReport)}
	r.seed()
	return r
}

func (r *MemProvincialReportRepo) seed() {
	now := time.Now()
	reports := []federation.ProvincialReport{
		{ID: "rpt-001", ProvinceID: "BD", Title: "Báo cáo quý 4/2025", Type: federation.ReportTypeQuarterly, Period: "2025-Q4", TotalClubs: 8, TotalVDV: 246, TotalCoaches: 20, TotalEvents: 2, Highlights: "Tổ chức thành công giải trẻ toàn tỉnh", Issues: "Thiếu kinh phí tập huấn HLV", Status: federation.ReportApproved, SubmittedBy: "admin-bd", CreatedAt: now, UpdatedAt: now},
		{ID: "rpt-002", ProvinceID: "BD", Title: "Báo cáo tháng 01/2026", Type: federation.ReportTypeMonthly, Period: "2026-01", TotalClubs: 8, TotalVDV: 250, TotalCoaches: 21, TotalEvents: 0, Highlights: "Kế hoạch tuyển sinh đầu năm", Issues: "", Status: federation.ReportSubmitted, SubmittedBy: "admin-bd", CreatedAt: now, UpdatedAt: now},
		{ID: "rpt-003", ProvinceID: "BD", Title: "Báo cáo tổng kết năm 2025", Type: federation.ReportTypeAnnual, Period: "2025", TotalClubs: 7, TotalVDV: 235, TotalCoaches: 19, TotalEvents: 5, Highlights: "3 VĐV đạt HCV giải quốc gia. Thành lập thêm 1 CLB mới.", Issues: "Cần mở rộng cơ sở vật chất tập luyện", Status: federation.ReportApproved, SubmittedBy: "admin-bd", CreatedAt: now, UpdatedAt: now},
	}
	for _, rp := range reports {
		r.data[rp.ID] = rp
	}
}

func (r *MemProvincialReportRepo) List(_ context.Context, provinceID string) ([]federation.ProvincialReport, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []federation.ProvincialReport
	for _, v := range r.data {
		if provinceID == "" || v.ProvinceID == provinceID {
			out = append(out, v)
		}
	}
	return out, nil
}

func (r *MemProvincialReportRepo) GetByID(_ context.Context, id string) (*federation.ProvincialReport, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	rp, ok := r.data[id]
	if !ok {
		return nil, fmt.Errorf("report %q not found", id)
	}
	return &rp, nil
}

func (r *MemProvincialReportRepo) Create(_ context.Context, rp federation.ProvincialReport) (*federation.ProvincialReport, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if rp.ID == "" {
		r.seq++
		rp.ID = fmt.Sprintf("rpt-%03d", r.seq+100)
	}
	r.data[rp.ID] = rp
	return &rp, nil
}
