package provincial

import (
	"context"
	"fmt"
	"sync"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — PROVINCIAL IN-MEMORY STORE
// In-memory implementations of provincial repository interfaces
// with seed data for TP.HCM and Hà Nội.
// ═══════════════════════════════════════════════════════════════

// ── Association Store ────────────────────────────────────────

type InMemAssociationStore struct {
	mu           sync.RWMutex
	associations map[string]Association
}

func NewInMemAssociationStore() *InMemAssociationStore {
	s := &InMemAssociationStore{associations: make(map[string]Association)}
	s.seed()
	return s
}

func (s *InMemAssociationStore) seed() {
	now := time.Now().UTC()
	for _, a := range []Association{
		{ID: "HOI-HCM-Q1", ProvinceID: "PROV-HCM", Name: "Hội VCT Quận 1", ShortName: "Hội Q1", Code: "HOI-HCM-Q1", District: "Quận 1", PresidentName: "Trần Thanh Hùng", PresidentPhone: "0901234567", FoundedDate: "2018-05-15", DecisionNo: "QĐ-HOI-001/2018", Status: AssociationStatusActive, TotalSubAssoc: 3, TotalClubs: 5, TotalAthletes: 85, TotalCoaches: 6, Term: "2024-2029", CreatedAt: now, UpdatedAt: now},
		{ID: "HOI-HCM-TD", ProvinceID: "PROV-HCM", Name: "Hội VCT TP Thủ Đức", ShortName: "Hội TĐ", Code: "HOI-HCM-TD", District: "TP Thủ Đức", PresidentName: "Nguyễn Minh Phát", PresidentPhone: "0912345678", FoundedDate: "2020-01-10", DecisionNo: "QĐ-HOI-002/2020", Status: AssociationStatusActive, TotalSubAssoc: 2, TotalClubs: 4, TotalAthletes: 62, TotalCoaches: 4, Term: "2024-2029", CreatedAt: now, UpdatedAt: now},
		{ID: "HOI-HCM-BT", ProvinceID: "PROV-HCM", Name: "Hội VCT Bình Thạnh", ShortName: "Hội BT", Code: "HOI-HCM-BT", District: "Bình Thạnh", PresidentName: "Lê Thị Thanh Mai", PresidentPhone: "0923456789", FoundedDate: "2019-08-20", DecisionNo: "QĐ-HOI-003/2019", Status: AssociationStatusActive, TotalSubAssoc: 2, TotalClubs: 3, TotalAthletes: 48, TotalCoaches: 3, Term: "2024-2029", CreatedAt: now, UpdatedAt: now},
		{ID: "HOI-HCM-GV", ProvinceID: "PROV-HCM", Name: "Hội VCT Gò Vấp", ShortName: "Hội GV", Code: "HOI-HCM-GV", District: "Gò Vấp", PresidentName: "Phạm Quốc Bảo", Status: AssociationStatusPending, Term: "2024-2029", CreatedAt: now, UpdatedAt: now},
		{ID: "HOI-HN-HK", ProvinceID: "PROV-HN", Name: "Hội VCT Hoàn Kiếm", ShortName: "Hội HK", Code: "HOI-HN-HK", District: "Hoàn Kiếm", PresidentName: "Đặng Văn Trí", PresidentPhone: "0934567890", FoundedDate: "2016-03-01", DecisionNo: "QĐ-HOI-HN-001/2016", Status: AssociationStatusActive, TotalSubAssoc: 3, TotalClubs: 6, TotalAthletes: 92, TotalCoaches: 5, Term: "2024-2029", CreatedAt: now, UpdatedAt: now},
		{ID: "HOI-HN-CG", ProvinceID: "PROV-HN", Name: "Hội VCT Cầu Giấy", ShortName: "Hội CG", Code: "HOI-HN-CG", District: "Cầu Giấy", PresidentName: "Hoàng Minh Tuấn", PresidentPhone: "0945678901", FoundedDate: "2017-07-15", DecisionNo: "QĐ-HOI-HN-002/2017", Status: AssociationStatusActive, TotalSubAssoc: 2, TotalClubs: 4, TotalAthletes: 70, TotalCoaches: 4, Term: "2024-2029", CreatedAt: now, UpdatedAt: now},
	} {
		s.associations[a.ID] = a
	}
}

func (s *InMemAssociationStore) List(_ context.Context, provinceID string) ([]Association, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []Association
	for _, a := range s.associations {
		if provinceID == "" || a.ProvinceID == provinceID {
			result = append(result, a)
		}
	}
	return result, nil
}

func (s *InMemAssociationStore) GetByID(_ context.Context, id string) (*Association, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	a, ok := s.associations[id]
	if !ok {
		return nil, fmt.Errorf("association not found: %s", id)
	}
	return &a, nil
}

func (s *InMemAssociationStore) Create(_ context.Context, a Association) (*Association, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.associations[a.ID] = a
	return &a, nil
}

func (s *InMemAssociationStore) Update(_ context.Context, id string, patch map[string]interface{}) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	a, ok := s.associations[id]
	if !ok {
		return fmt.Errorf("association not found: %s", id)
	}
	if v, ok := patch["status"].(string); ok {
		a.Status = AssociationStatus(v)
	}
	if v, ok := patch["updated_at"].(time.Time); ok {
		a.UpdatedAt = v
	}
	s.associations[id] = a
	return nil
}

func (s *InMemAssociationStore) Delete(_ context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.associations, id)
	return nil
}

// ── SubAssociation Store ─────────────────────────────────────

type InMemSubAssociationStore struct {
	mu    sync.RWMutex
	items map[string]SubAssociation
}

func NewInMemSubAssociationStore() *InMemSubAssociationStore {
	s := &InMemSubAssociationStore{items: make(map[string]SubAssociation)}
	s.seed()
	return s
}

func (s *InMemSubAssociationStore) seed() {
	now := time.Now().UTC()
	for _, sa := range []SubAssociation{
		{ID: "CH-HCM-Q1-BN", ProvinceID: "PROV-HCM", AssociationID: "HOI-HCM-Q1", AssociationName: "Hội VCT Quận 1", Name: "Chi hội VCT Phường Bến Nghé", ShortName: "CH Bến Nghé", Code: "CH-HCM-Q1-BN", Ward: "Phường Bến Nghé", LeaderName: "Võ Thị Hương", FoundedDate: "2019-06-10", Status: AssociationStatusActive, TotalClubs: 2, TotalAthletes: 30, CreatedAt: now, UpdatedAt: now},
		{ID: "CH-HCM-Q1-BT", ProvinceID: "PROV-HCM", AssociationID: "HOI-HCM-Q1", AssociationName: "Hội VCT Quận 1", Name: "Chi hội VCT Phường Bến Thành", ShortName: "CH Bến Thành", Code: "CH-HCM-Q1-BT", Ward: "Phường Bến Thành", LeaderName: "Trần Quang Vinh", FoundedDate: "2019-08-15", Status: AssociationStatusActive, TotalClubs: 2, TotalAthletes: 28, CreatedAt: now, UpdatedAt: now},
		{ID: "CH-HCM-Q1-PNL", ProvinceID: "PROV-HCM", AssociationID: "HOI-HCM-Q1", AssociationName: "Hội VCT Quận 1", Name: "Chi hội VCT Phường Phạm Ngũ Lão", ShortName: "CH Phạm Ngũ Lão", Code: "CH-HCM-Q1-PNL", Ward: "Phường Phạm Ngũ Lão", LeaderName: "Nguyễn Thế Anh", FoundedDate: "2020-01-20", Status: AssociationStatusActive, TotalClubs: 1, TotalAthletes: 18, CreatedAt: now, UpdatedAt: now},
		{ID: "CH-HCM-TD-LT", ProvinceID: "PROV-HCM", AssociationID: "HOI-HCM-TD", AssociationName: "Hội VCT TP Thủ Đức", Name: "Chi hội VCT Phường Linh Trung", ShortName: "CH Linh Trung", Code: "CH-HCM-TD-LT", Ward: "Phường Linh Trung", LeaderName: "Bùi Minh Đức", FoundedDate: "2021-03-15", Status: AssociationStatusActive, TotalClubs: 2, TotalAthletes: 25, CreatedAt: now, UpdatedAt: now},
		{ID: "CH-HCM-TD-HBC", ProvinceID: "PROV-HCM", AssociationID: "HOI-HCM-TD", AssociationName: "Hội VCT TP Thủ Đức", Name: "Chi hội VCT Phường Hiệp Bình Chánh", ShortName: "CH Hiệp Bình Chánh", Code: "CH-HCM-TD-HBC", Ward: "Phường Hiệp Bình Chánh", LeaderName: "Lê Hồng Phúc", FoundedDate: "2021-06-01", Status: AssociationStatusActive, TotalClubs: 2, TotalAthletes: 22, CreatedAt: now, UpdatedAt: now},
		{ID: "CH-HCM-BT-P1", ProvinceID: "PROV-HCM", AssociationID: "HOI-HCM-BT", AssociationName: "Hội VCT Bình Thạnh", Name: "Chi hội VCT Phường 1 Bình Thạnh", ShortName: "CH P1 BT", Code: "CH-HCM-BT-P1", Ward: "Phường 1", LeaderName: "Mai Xuân Long", FoundedDate: "2020-11-10", Status: AssociationStatusActive, TotalClubs: 2, TotalAthletes: 20, CreatedAt: now, UpdatedAt: now},
		{ID: "CH-HCM-BT-P2", ProvinceID: "PROV-HCM", AssociationID: "HOI-HCM-BT", AssociationName: "Hội VCT Bình Thạnh", Name: "Chi hội VCT Phường 2 Bình Thạnh", ShortName: "CH P2 BT", Code: "CH-HCM-BT-P2", Ward: "Phường 2", LeaderName: "Đỗ Thị Yến", FoundedDate: "2021-02-15", Status: AssociationStatusPending, TotalClubs: 1, TotalAthletes: 12, CreatedAt: now, UpdatedAt: now},
		{ID: "CH-HN-HK-HT", ProvinceID: "PROV-HN", AssociationID: "HOI-HN-HK", AssociationName: "Hội VCT Hoàn Kiếm", Name: "Chi hội VCT Phường Hàng Trống", ShortName: "CH Hàng Trống", Code: "CH-HN-HK-HT", Ward: "Phường Hàng Trống", LeaderName: "Phạm Hải Đăng", FoundedDate: "2017-09-10", Status: AssociationStatusActive, TotalClubs: 3, TotalAthletes: 35, CreatedAt: now, UpdatedAt: now},
		{ID: "CH-HN-CG-DH", ProvinceID: "PROV-HN", AssociationID: "HOI-HN-CG", AssociationName: "Hội VCT Cầu Giấy", Name: "Chi hội VCT Phường Dịch Vọng Hậu", ShortName: "CH Dịch Vọng Hậu", Code: "CH-HN-CG-DH", Ward: "Phường Dịch Vọng Hậu", LeaderName: "Ngô Quốc Thịnh", FoundedDate: "2018-04-20", Status: AssociationStatusActive, TotalClubs: 2, TotalAthletes: 28, CreatedAt: now, UpdatedAt: now},
	} {
		s.items[sa.ID] = sa
	}
}

func (s *InMemSubAssociationStore) List(_ context.Context, provinceID string) ([]SubAssociation, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []SubAssociation
	for _, sa := range s.items {
		if provinceID == "" || sa.ProvinceID == provinceID {
			result = append(result, sa)
		}
	}
	return result, nil
}

func (s *InMemSubAssociationStore) ListByAssociation(_ context.Context, assocID string) ([]SubAssociation, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []SubAssociation
	for _, sa := range s.items {
		if sa.AssociationID == assocID {
			result = append(result, sa)
		}
	}
	return result, nil
}

func (s *InMemSubAssociationStore) GetByID(_ context.Context, id string) (*SubAssociation, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	sa, ok := s.items[id]
	if !ok {
		return nil, fmt.Errorf("sub-association not found: %s", id)
	}
	return &sa, nil
}

func (s *InMemSubAssociationStore) Create(_ context.Context, sa SubAssociation) (*SubAssociation, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.items[sa.ID] = sa
	return &sa, nil
}

func (s *InMemSubAssociationStore) Update(_ context.Context, id string, patch map[string]interface{}) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	sa, ok := s.items[id]
	if !ok {
		return fmt.Errorf("sub-association not found: %s", id)
	}
	if v, ok := patch["status"].(string); ok {
		sa.Status = AssociationStatus(v)
	}
	if v, ok := patch["updated_at"].(time.Time); ok {
		sa.UpdatedAt = v
	}
	s.items[id] = sa
	return nil
}

func (s *InMemSubAssociationStore) Delete(_ context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.items, id)
	return nil
}

// ── Club Store ───────────────────────────────────────────────

type InMemClubStore struct {
	mu    sync.RWMutex
	clubs map[string]ProvincialClub
}

func NewInMemClubStore() *InMemClubStore {
	s := &InMemClubStore{clubs: make(map[string]ProvincialClub)}
	s.seed()
	return s
}

func (s *InMemClubStore) seed() {
	now := time.Now().UTC()
	for _, c := range []ProvincialClub{
		{ID: "CLB-HCM-001", ProvinceID: "PROV-HCM", Name: "CLB Võ cổ truyền Quận 1", ShortName: "VCT Q1", Code: "HCM-Q1", District: "Quận 1", LeaderName: "Nguyễn Văn An", Status: ClubStatusActive, AthleteCount: 45, CoachCount: 3, FoundedDate: "2015-03-15", CreatedAt: now, UpdatedAt: now},
		{ID: "CLB-HCM-002", ProvinceID: "PROV-HCM", Name: "CLB Võ cổ truyền Thủ Đức", ShortName: "VCT TĐ", Code: "HCM-TD", District: "TP Thủ Đức", LeaderName: "Trần Thị Bình", Status: ClubStatusActive, AthleteCount: 38, CoachCount: 2, FoundedDate: "2017-06-01", CreatedAt: now, UpdatedAt: now},
		{ID: "CLB-HCM-003", ProvinceID: "PROV-HCM", Name: "CLB Võ cổ truyền Bình Thạnh", ShortName: "VCT BT", Code: "HCM-BT", District: "Bình Thạnh", LeaderName: "Lê Minh Cường", Status: ClubStatusActive, AthleteCount: 30, CoachCount: 2, FoundedDate: "2018-09-10", CreatedAt: now, UpdatedAt: now},
		{ID: "CLB-HCM-004", ProvinceID: "PROV-HCM", Name: "CLB Võ cổ truyền Gò Vấp", ShortName: "VCT GV", Code: "HCM-GV", District: "Gò Vấp", LeaderName: "Phạm Thị Dung", Status: ClubStatusPending, AthleteCount: 15, CoachCount: 1, FoundedDate: "2025-01-20", CreatedAt: now, UpdatedAt: now},
		{ID: "CLB-HN-001", ProvinceID: "PROV-HN", Name: "CLB Võ cổ truyền Hoàn Kiếm", ShortName: "VCT HK", Code: "HN-HK", District: "Hoàn Kiếm", LeaderName: "Đặng Văn Em", Status: ClubStatusActive, AthleteCount: 52, CoachCount: 4, FoundedDate: "2012-05-20", CreatedAt: now, UpdatedAt: now},
		{ID: "CLB-HN-002", ProvinceID: "PROV-HN", Name: "CLB Võ cổ truyền Cầu Giấy", ShortName: "VCT CG", Code: "HN-CG", District: "Cầu Giấy", LeaderName: "Hoàng Thị Phương", Status: ClubStatusActive, AthleteCount: 40, CoachCount: 3, FoundedDate: "2014-08-01", CreatedAt: now, UpdatedAt: now},
		{ID: "CLB-HN-003", ProvinceID: "PROV-HN", Name: "CLB Võ cổ truyền Đống Đa", ShortName: "VCT ĐĐ", Code: "HN-DD", District: "Đống Đa", LeaderName: "Vũ Quốc Giang", Status: ClubStatusActive, AthleteCount: 35, CoachCount: 2, FoundedDate: "2016-01-10", CreatedAt: now, UpdatedAt: now},
	} {
		s.clubs[c.ID] = c
	}
}

func (s *InMemClubStore) List(_ context.Context, provinceID string) ([]ProvincialClub, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []ProvincialClub
	for _, c := range s.clubs {
		if provinceID == "" || c.ProvinceID == provinceID {
			result = append(result, c)
		}
	}
	return result, nil
}

func (s *InMemClubStore) GetByID(_ context.Context, id string) (*ProvincialClub, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	c, ok := s.clubs[id]
	if !ok {
		return nil, fmt.Errorf("club not found: %s", id)
	}
	return &c, nil
}

func (s *InMemClubStore) Create(_ context.Context, c ProvincialClub) (*ProvincialClub, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.clubs[c.ID] = c
	return &c, nil
}

func (s *InMemClubStore) Update(_ context.Context, id string, patch map[string]interface{}) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	c, ok := s.clubs[id]
	if !ok {
		return fmt.Errorf("club not found: %s", id)
	}
	if v, ok := patch["status"].(string); ok {
		c.Status = ClubStatus(v)
	}
	if v, ok := patch["updated_at"].(time.Time); ok {
		c.UpdatedAt = v
	}
	s.clubs[id] = c
	return nil
}

func (s *InMemClubStore) Delete(_ context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.clubs, id)
	return nil
}

// ── Athlete Store ────────────────────────────────────────────

type InMemAthleteStore struct {
	mu       sync.RWMutex
	athletes map[string]ProvincialAthlete
}

func NewInMemAthleteStore() *InMemAthleteStore {
	s := &InMemAthleteStore{athletes: make(map[string]ProvincialAthlete)}
	s.seed()
	return s
}

func (s *InMemAthleteStore) seed() {
	now := time.Now().UTC()
	for _, a := range []ProvincialAthlete{
		{ID: "VDV-HCM-001", ProvinceID: "PROV-HCM", ClubID: "CLB-HCM-001", ClubName: "VCT Q1", FullName: "Nguyễn Hoàng Anh", Gender: "nam", DateOfBirth: "2005-03-15", Weight: 60, Height: 170, BeltRank: "Nhị đẳng", Status: MemberStatusActive, JoinDate: "2020-01-15", CreatedAt: now, UpdatedAt: now},
		{ID: "VDV-HCM-002", ProvinceID: "PROV-HCM", ClubID: "CLB-HCM-001", ClubName: "VCT Q1", FullName: "Trần Minh Tú", Gender: "nu", DateOfBirth: "2006-07-22", Weight: 52, Height: 162, BeltRank: "Nhất đẳng", Status: MemberStatusActive, JoinDate: "2021-03-10", CreatedAt: now, UpdatedAt: now},
		{ID: "VDV-HCM-003", ProvinceID: "PROV-HCM", ClubID: "CLB-HCM-002", ClubName: "VCT TĐ", FullName: "Lê Văn Hùng", Gender: "nam", DateOfBirth: "2004-11-08", Weight: 68, Height: 175, BeltRank: "Tam đẳng", Status: MemberStatusActive, JoinDate: "2019-06-20", CreatedAt: now, UpdatedAt: now},
		{ID: "VDV-HCM-004", ProvinceID: "PROV-HCM", ClubID: "CLB-HCM-003", ClubName: "VCT BT", FullName: "Phạm Thị Lan", Gender: "nu", DateOfBirth: "2007-01-30", Weight: 48, Height: 158, BeltRank: "Sơ đẳng", Status: MemberStatusPending, JoinDate: "2025-12-01", CreatedAt: now, UpdatedAt: now},
		{ID: "VDV-HN-001", ProvinceID: "PROV-HN", ClubID: "CLB-HN-001", ClubName: "VCT HK", FullName: "Đặng Quốc Việt", Gender: "nam", DateOfBirth: "2003-05-12", Weight: 72, Height: 178, BeltRank: "Tam đẳng", Status: MemberStatusActive, JoinDate: "2018-02-10", CreatedAt: now, UpdatedAt: now},
		{ID: "VDV-HN-002", ProvinceID: "PROV-HN", ClubID: "CLB-HN-002", ClubName: "VCT CG", FullName: "Hoàng Thị Mai", Gender: "nu", DateOfBirth: "2005-09-18", Weight: 55, Height: 165, BeltRank: "Nhị đẳng", Status: MemberStatusActive, JoinDate: "2020-08-15", CreatedAt: now, UpdatedAt: now},
	} {
		s.athletes[a.ID] = a
	}
}

func (s *InMemAthleteStore) List(_ context.Context, provinceID string) ([]ProvincialAthlete, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []ProvincialAthlete
	for _, a := range s.athletes {
		if provinceID == "" || a.ProvinceID == provinceID {
			result = append(result, a)
		}
	}
	return result, nil
}

func (s *InMemAthleteStore) ListByClub(_ context.Context, clubID string) ([]ProvincialAthlete, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []ProvincialAthlete
	for _, a := range s.athletes {
		if a.ClubID == clubID {
			result = append(result, a)
		}
	}
	return result, nil
}

func (s *InMemAthleteStore) GetByID(_ context.Context, id string) (*ProvincialAthlete, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	a, ok := s.athletes[id]
	if !ok {
		return nil, fmt.Errorf("athlete not found: %s", id)
	}
	return &a, nil
}

func (s *InMemAthleteStore) Create(_ context.Context, a ProvincialAthlete) (*ProvincialAthlete, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.athletes[a.ID] = a
	return &a, nil
}

func (s *InMemAthleteStore) Update(_ context.Context, id string, patch map[string]interface{}) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	a, ok := s.athletes[id]
	if !ok {
		return fmt.Errorf("athlete not found: %s", id)
	}
	if v, ok := patch["status"].(string); ok {
		a.Status = MemberStatus(v)
	}
	if v, ok := patch["updated_at"].(time.Time); ok {
		a.UpdatedAt = v
	}
	s.athletes[id] = a
	return nil
}

func (s *InMemAthleteStore) Delete(_ context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.athletes, id)
	return nil
}

// ── Coach Store ──────────────────────────────────────────────

type InMemCoachStore struct {
	mu      sync.RWMutex
	coaches map[string]ProvincialCoach
}

func NewInMemCoachStore() *InMemCoachStore {
	s := &InMemCoachStore{coaches: make(map[string]ProvincialCoach)}
	s.seed()
	return s
}

func (s *InMemCoachStore) seed() {
	now := time.Now().UTC()
	for _, c := range []ProvincialCoach{
		{ID: "HLV-HCM-001", ProvinceID: "PROV-HCM", ClubID: "CLB-HCM-001", ClubName: "VCT Q1", FullName: "Võ Minh Đức", Gender: "nam", DateOfBirth: "1980-04-10", BeltRank: "Lục đẳng", CertLevel: "HLV cấp II", Experience: 20, Specialties: []string{"Đối kháng", "Quyền"}, Status: MemberStatusActive, CreatedAt: now, UpdatedAt: now},
		{ID: "HLV-HCM-002", ProvinceID: "PROV-HCM", ClubID: "CLB-HCM-002", ClubName: "VCT TĐ", FullName: "Bùi Thị Hoa", Gender: "nu", DateOfBirth: "1985-08-22", BeltRank: "Ngũ đẳng", CertLevel: "HLV cấp I", Experience: 15, Specialties: []string{"Quyền", "Biểu diễn"}, Status: MemberStatusActive, CreatedAt: now, UpdatedAt: now},
		{ID: "HLV-HN-001", ProvinceID: "PROV-HN", ClubID: "CLB-HN-001", ClubName: "VCT HK", FullName: "Ngô Thanh Tùng", Gender: "nam", DateOfBirth: "1978-12-05", BeltRank: "Thất đẳng", CertLevel: "HLV cấp III", Experience: 25, Specialties: []string{"Đối kháng", "Quyền", "Binh khí"}, Status: MemberStatusActive, CreatedAt: now, UpdatedAt: now},
		{ID: "HLV-HN-002", ProvinceID: "PROV-HN", ClubID: "CLB-HN-002", ClubName: "VCT CG", FullName: "Đinh Thị Ngọc", Gender: "nu", DateOfBirth: "1988-06-15", BeltRank: "Tứ đẳng", CertLevel: "HLV cấp I", Experience: 12, Specialties: []string{"Quyền"}, Status: MemberStatusActive, CreatedAt: now, UpdatedAt: now},
	} {
		s.coaches[c.ID] = c
	}
}

func (s *InMemCoachStore) List(_ context.Context, provinceID string) ([]ProvincialCoach, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []ProvincialCoach
	for _, c := range s.coaches {
		if provinceID == "" || c.ProvinceID == provinceID {
			result = append(result, c)
		}
	}
	return result, nil
}

func (s *InMemCoachStore) GetByID(_ context.Context, id string) (*ProvincialCoach, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	c, ok := s.coaches[id]
	if !ok {
		return nil, fmt.Errorf("coach not found: %s", id)
	}
	return &c, nil
}

func (s *InMemCoachStore) Create(_ context.Context, c ProvincialCoach) (*ProvincialCoach, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.coaches[c.ID] = c
	return &c, nil
}

func (s *InMemCoachStore) Update(_ context.Context, id string, patch map[string]interface{}) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	c, ok := s.coaches[id]
	if !ok {
		return fmt.Errorf("coach not found: %s", id)
	}
	if v, ok := patch["status"].(string); ok {
		c.Status = MemberStatus(v)
	}
	s.coaches[id] = c
	return nil
}

// ── Referee Store ────────────────────────────────────────────

type InMemRefereeStore struct {
	mu       sync.RWMutex
	referees map[string]ProvincialReferee
}

func NewInMemRefereeStore() *InMemRefereeStore {
	s := &InMemRefereeStore{referees: make(map[string]ProvincialReferee)}
	s.seed()
	return s
}

func (s *InMemRefereeStore) seed() {
	now := time.Now().UTC()
	for _, r := range []ProvincialReferee{
		{ID: "TT-HCM-001", ProvinceID: "PROV-HCM", FullName: "Huỳnh Văn Khánh", Gender: "nam", DateOfBirth: "1982-02-14", RefereeRank: "Trọng tài cấp II", Expertise: "Đối kháng + Biểu diễn", Status: MemberStatusActive, CreatedAt: now, UpdatedAt: now},
		{ID: "TT-HCM-002", ProvinceID: "PROV-HCM", FullName: "Cao Thị Linh", Gender: "nu", DateOfBirth: "1990-10-20", RefereeRank: "Trọng tài cấp I", Expertise: "Biểu diễn", Status: MemberStatusActive, CreatedAt: now, UpdatedAt: now},
		{ID: "TT-HN-001", ProvinceID: "PROV-HN", FullName: "Dương Quang Minh", Gender: "nam", DateOfBirth: "1979-07-08", RefereeRank: "Trọng tài cấp III", Expertise: "Đối kháng", Status: MemberStatusActive, CreatedAt: now, UpdatedAt: now},
	} {
		s.referees[r.ID] = r
	}
}

func (s *InMemRefereeStore) List(_ context.Context, provinceID string) ([]ProvincialReferee, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []ProvincialReferee
	for _, r := range s.referees {
		if provinceID == "" || r.ProvinceID == provinceID {
			result = append(result, r)
		}
	}
	return result, nil
}

func (s *InMemRefereeStore) GetByID(_ context.Context, id string) (*ProvincialReferee, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	r, ok := s.referees[id]
	if !ok {
		return nil, fmt.Errorf("referee not found: %s", id)
	}
	return &r, nil
}

func (s *InMemRefereeStore) Create(_ context.Context, r ProvincialReferee) (*ProvincialReferee, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.referees[r.ID] = r
	return &r, nil
}

func (s *InMemRefereeStore) Update(_ context.Context, id string, patch map[string]interface{}) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	r, ok := s.referees[id]
	if !ok {
		return fmt.Errorf("referee not found: %s", id)
	}
	if v, ok := patch["status"].(string); ok {
		r.Status = MemberStatus(v)
	}
	s.referees[id] = r
	return nil
}

// ── Committee Store ──────────────────────────────────────────

type InMemCommitteeStore struct {
	mu      sync.RWMutex
	members map[string]CommitteeMember
}

func NewInMemCommitteeStore() *InMemCommitteeStore {
	s := &InMemCommitteeStore{members: make(map[string]CommitteeMember)}
	s.seed()
	return s
}

func (s *InMemCommitteeStore) seed() {
	now := time.Now().UTC()
	for _, m := range []CommitteeMember{
		{ID: "BCH-HCM-001", ProvinceID: "PROV-HCM", FullName: "Trương Quốc Bảo", Role: PersonnelRolePresident, Title: "Chủ tịch LĐ VCT TP.HCM", Term: "2024-2029", DecisionNo: "QĐ-001/2024", StartDate: "2024-01-15", IsActive: true, CreatedAt: now},
		{ID: "BCH-HCM-002", ProvinceID: "PROV-HCM", FullName: "Lê Thị Hồng Nhung", Role: PersonnelRoleVicePresident, Title: "Phó Chủ tịch phụ trách chuyên môn", Term: "2024-2029", DecisionNo: "QĐ-002/2024", StartDate: "2024-01-15", IsActive: true, CreatedAt: now},
		{ID: "BCH-HCM-003", ProvinceID: "PROV-HCM", FullName: "Phan Văn Sơn", Role: PersonnelRoleSecretary, Title: "Tổng Thư ký LĐ VCT TP.HCM", Term: "2024-2029", DecisionNo: "QĐ-003/2024", StartDate: "2024-01-15", IsActive: true, CreatedAt: now},
		{ID: "BCH-HCM-004", ProvinceID: "PROV-HCM", FullName: "Mai Thanh Tâm", Role: PersonnelRoleTechnicalHead, Title: "Trưởng ban Chuyên môn", Term: "2024-2029", DecisionNo: "QĐ-004/2024", StartDate: "2024-02-01", IsActive: true, CreatedAt: now},
		{ID: "BCH-HN-001", ProvinceID: "PROV-HN", FullName: "Nguyễn Đình Hải", Role: PersonnelRolePresident, Title: "Chủ tịch LĐ VCT Hà Nội", Term: "2024-2029", DecisionNo: "QĐ-HN-001/2024", StartDate: "2024-03-01", IsActive: true, CreatedAt: now},
		{ID: "BCH-HN-002", ProvinceID: "PROV-HN", FullName: "Vũ Thị Lan Anh", Role: PersonnelRoleSecretary, Title: "Tổng Thư ký LĐ VCT Hà Nội", Term: "2024-2029", DecisionNo: "QĐ-HN-002/2024", StartDate: "2024-03-01", IsActive: true, CreatedAt: now},
	} {
		s.members[m.ID] = m
	}
}

func (s *InMemCommitteeStore) List(_ context.Context, provinceID string) ([]CommitteeMember, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []CommitteeMember
	for _, m := range s.members {
		if provinceID == "" || m.ProvinceID == provinceID {
			result = append(result, m)
		}
	}
	return result, nil
}

func (s *InMemCommitteeStore) GetByID(_ context.Context, id string) (*CommitteeMember, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	m, ok := s.members[id]
	if !ok {
		return nil, fmt.Errorf("committee member not found: %s", id)
	}
	return &m, nil
}

func (s *InMemCommitteeStore) Create(_ context.Context, m CommitteeMember) (*CommitteeMember, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.members[m.ID] = m
	return &m, nil
}

func (s *InMemCommitteeStore) Update(_ context.Context, id string, patch map[string]interface{}) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	m, ok := s.members[id]
	if !ok {
		return fmt.Errorf("committee member not found: %s", id)
	}
	if v, ok := patch["is_active"].(bool); ok {
		m.IsActive = v
	}
	s.members[id] = m
	return nil
}

// ── Transfer Store ───────────────────────────────────────────

type InMemTransferStore struct {
	mu        sync.RWMutex
	transfers map[string]ClubTransfer
}

func NewInMemTransferStore() *InMemTransferStore {
	return &InMemTransferStore{transfers: make(map[string]ClubTransfer)}
}

func (s *InMemTransferStore) List(_ context.Context, provinceID string) ([]ClubTransfer, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []ClubTransfer
	for _, t := range s.transfers {
		if provinceID == "" || t.ProvinceID == provinceID {
			result = append(result, t)
		}
	}
	return result, nil
}

func (s *InMemTransferStore) GetByID(_ context.Context, id string) (*ClubTransfer, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	t, ok := s.transfers[id]
	if !ok {
		return nil, fmt.Errorf("transfer not found: %s", id)
	}
	return &t, nil
}

func (s *InMemTransferStore) Create(_ context.Context, t ClubTransfer) (*ClubTransfer, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.transfers[t.ID] = t
	return &t, nil
}

func (s *InMemTransferStore) Update(_ context.Context, id string, patch map[string]interface{}) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	t, ok := s.transfers[id]
	if !ok {
		return fmt.Errorf("transfer not found: %s", id)
	}
	if v, ok := patch["status"].(string); ok {
		t.Status = TransferStatus(v)
	}
	if v, ok := patch["approved_by"].(string); ok {
		t.ApprovedBy = v
	}
	if v, ok := patch["approved_at"].(time.Time); ok {
		t.ApprovedAt = &v
	}
	s.transfers[id] = t
	return nil
}

// ── Võ Sinh Store ────────────────────────────────────────────

type InMemVoSinhStore struct {
	mu    sync.RWMutex
	items map[string]VoSinh
}

func NewInMemVoSinhStore() *InMemVoSinhStore {
	s := &InMemVoSinhStore{items: make(map[string]VoSinh)}
	s.seed()
	return s
}

func (s *InMemVoSinhStore) seed() {
	now := time.Now().UTC()
	for _, v := range []VoSinh{
		// ── TP.HCM ──────────────────────────────────
		{ID: "VS-HCM-001", ProvinceID: "PROV-HCM", ClubID: "CLB-HCM-001", ClubName: "CLB Tân Khánh Bà Trà Q1", FullName: "Nguyễn Minh Tuấn", Gender: "nam", DateOfBirth: "2008-03-15", Weight: 45, Height: 155, BeltRank: BeltGreen, BeltLabel: "Đai xanh", AgeGroup: AgeGroupTeen, AgeGroupLabel: "Thiếu niên (13-17)", ParentName: "Nguyễn Văn Hùng", ParentPhone: "0901111001", CoachName: "HLV Lê Minh", StartDate: "2022-06-01", Status: MemberStatusActive, CreatedAt: now, UpdatedAt: now},
		{ID: "VS-HCM-002", ProvinceID: "PROV-HCM", ClubID: "CLB-HCM-001", ClubName: "CLB Tân Khánh Bà Trà Q1", FullName: "Trần Thị Bích Ngọc", Gender: "nu", DateOfBirth: "2010-07-22", Weight: 38, Height: 142, BeltRank: BeltYellow, BeltLabel: "Đai vàng", AgeGroup: AgeGroupChild, AgeGroupLabel: "Thiếu nhi (5-12)", ParentName: "Trần Văn Thanh", ParentPhone: "0901111002", CoachName: "HLV Lê Minh", StartDate: "2023-09-01", Status: MemberStatusActive, CreatedAt: now, UpdatedAt: now},
		{ID: "VS-HCM-003", ProvinceID: "PROV-HCM", ClubID: "CLB-HCM-001", ClubName: "CLB Tân Khánh Bà Trà Q1", FullName: "Phạm Quốc Bảo", Gender: "nam", DateOfBirth: "1995-11-08", Weight: 68, Height: 172, BeltRank: BeltBlack1, BeltLabel: "Nhất đẳng", AgeGroup: AgeGroupYouth, AgeGroupLabel: "Thanh niên (18-35)", Phone: "0901111003", Email: "bao.pham@email.com", CoachName: "HLV Lê Minh", StartDate: "2015-01-15", Status: MemberStatusActive, CreatedAt: now, UpdatedAt: now},
		{ID: "VS-HCM-004", ProvinceID: "PROV-HCM", ClubID: "CLB-HCM-002", ClubName: "CLB Bình Định Sa Long Cương TD", FullName: "Lê Hoàng Anh", Gender: "nam", DateOfBirth: "2012-01-10", Weight: 32, Height: 138, BeltRank: BeltNone, BeltLabel: "Không đai", AgeGroup: AgeGroupChild, AgeGroupLabel: "Thiếu nhi (5-12)", ParentName: "Lê Văn Sơn", ParentPhone: "0901111004", StartDate: "2025-01-10", Status: MemberStatusPending, CreatedAt: now, UpdatedAt: now},
		{ID: "VS-HCM-005", ProvinceID: "PROV-HCM", ClubID: "CLB-HCM-002", ClubName: "CLB Bình Định Sa Long Cương TD", FullName: "Võ Thanh Thảo", Gender: "nu", DateOfBirth: "2000-05-18", Weight: 55, Height: 162, BeltRank: BeltRed, BeltLabel: "Đai đỏ", AgeGroup: AgeGroupYouth, AgeGroupLabel: "Thanh niên (18-35)", Phone: "0901111005", CoachName: "HLV Trần Hùng", StartDate: "2018-03-20", Status: MemberStatusActive, CreatedAt: now, UpdatedAt: now},
		{ID: "VS-HCM-006", ProvinceID: "PROV-HCM", ClubID: "CLB-HCM-003", ClubName: "Võ đường Thanh Long BT", FullName: "Đặng Minh Khoa", Gender: "nam", DateOfBirth: "1980-09-03", Weight: 75, Height: 170, BeltRank: BeltBlack3, BeltLabel: "Tam đẳng", AgeGroup: AgeGroupSenior, AgeGroupLabel: "Trung niên (36+)", Phone: "0901111006", Email: "khoa.dang@email.com", CoachName: "VS Nguyễn Tâm", StartDate: "2005-06-01", Status: MemberStatusActive, CreatedAt: now, UpdatedAt: now},
		{ID: "VS-HCM-007", ProvinceID: "PROV-HCM", ClubID: "CLB-HCM-003", ClubName: "Võ đường Thanh Long BT", FullName: "Nguyễn Thị Hồng Nhung", Gender: "nu", DateOfBirth: "2006-12-25", Weight: 48, Height: 158, BeltRank: BeltBlue, BeltLabel: "Đai lam", AgeGroup: AgeGroupTeen, AgeGroupLabel: "Thiếu niên (13-17)", ParentName: "Nguyễn Văn Phúc", ParentPhone: "0901111007", CoachName: "VS Nguyễn Tâm", StartDate: "2020-08-15", Status: MemberStatusActive, CreatedAt: now, UpdatedAt: now},
		// ── Hà Nội ───────────────────────────────────
		{ID: "VS-HN-001", ProvinceID: "PROV-HN", ClubID: "CLB-HN-001", ClubName: "CLB Nhất Nam HK", FullName: "Hoàng Đức Mạnh", Gender: "nam", DateOfBirth: "2009-04-12", Weight: 42, Height: 150, BeltRank: BeltGreen, BeltLabel: "Đai xanh", AgeGroup: AgeGroupTeen, AgeGroupLabel: "Thiếu niên (13-17)", ParentName: "Hoàng Văn Tùng", ParentPhone: "0901222001", CoachName: "HLV Đặng Trọng", StartDate: "2021-09-01", Status: MemberStatusActive, CreatedAt: now, UpdatedAt: now},
		{ID: "VS-HN-002", ProvinceID: "PROV-HN", ClubID: "CLB-HN-001", ClubName: "CLB Nhất Nam HK", FullName: "Bùi Phương Linh", Gender: "nu", DateOfBirth: "2011-08-30", Weight: 35, Height: 140, BeltRank: BeltYellow, BeltLabel: "Đai vàng", AgeGroup: AgeGroupChild, AgeGroupLabel: "Thiếu nhi (5-12)", ParentName: "Bùi Thị Lan", ParentPhone: "0901222002", CoachName: "HLV Đặng Trọng", StartDate: "2023-02-01", Status: MemberStatusActive, CreatedAt: now, UpdatedAt: now},
		{ID: "VS-HN-003", ProvinceID: "PROV-HN", ClubID: "CLB-HN-002", ClubName: "CLB Vovinam CG", FullName: "Trịnh Công Sơn", Gender: "nam", DateOfBirth: "1992-02-20", Weight: 72, Height: 175, BeltRank: BeltBlack2, BeltLabel: "Nhị đẳng", AgeGroup: AgeGroupYouth, AgeGroupLabel: "Thanh niên (18-35)", Phone: "0901222003", Email: "son.trinh@email.com", StartDate: "2012-05-01", Status: MemberStatusActive, CreatedAt: now, UpdatedAt: now},
		{ID: "VS-HN-004", ProvinceID: "PROV-HN", ClubID: "CLB-HN-002", ClubName: "CLB Vovinam CG", FullName: "Lý Thanh Hà", Gender: "nu", DateOfBirth: "2013-06-14", Weight: 30, Height: 135, BeltRank: BeltNone, BeltLabel: "Không đai", AgeGroup: AgeGroupChild, AgeGroupLabel: "Thiếu nhi (5-12)", ParentName: "Lý Văn Đạt", ParentPhone: "0901222004", StartDate: "2025-02-15", Status: MemberStatusPending, CreatedAt: now, UpdatedAt: now},
		{ID: "VS-HN-005", ProvinceID: "PROV-HN", ClubID: "CLB-HN-001", ClubName: "CLB Nhất Nam HK", FullName: "Vũ Đình Trọng", Gender: "nam", DateOfBirth: "1975-10-05", Weight: 80, Height: 168, BeltRank: BeltBlack0, BeltLabel: "Sơ đẳng", AgeGroup: AgeGroupSenior, AgeGroupLabel: "Trung niên (36+)", Phone: "0901222005", CoachName: "HLV Đặng Trọng", StartDate: "2010-01-01", Status: MemberStatusActive, CreatedAt: now, UpdatedAt: now},
	} {
		s.items[v.ID] = v
	}
}

func (s *InMemVoSinhStore) List(_ context.Context, provinceID string) ([]VoSinh, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []VoSinh
	for _, v := range s.items {
		if provinceID == "" || v.ProvinceID == provinceID {
			result = append(result, v)
		}
	}
	return result, nil
}

func (s *InMemVoSinhStore) ListByClub(_ context.Context, clubID string) ([]VoSinh, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []VoSinh
	for _, v := range s.items {
		if v.ClubID == clubID {
			result = append(result, v)
		}
	}
	return result, nil
}

func (s *InMemVoSinhStore) GetByID(_ context.Context, id string) (*VoSinh, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	v, ok := s.items[id]
	if !ok {
		return nil, fmt.Errorf("vo_sinh not found: %s", id)
	}
	return &v, nil
}

func (s *InMemVoSinhStore) Create(_ context.Context, v VoSinh) (*VoSinh, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.items[v.ID] = v
	return &v, nil
}

func (s *InMemVoSinhStore) Update(_ context.Context, id string, patch map[string]interface{}) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	v, ok := s.items[id]
	if !ok {
		return fmt.Errorf("vo_sinh not found: %s", id)
	}
	if val, ok := patch["status"].(string); ok {
		v.Status = MemberStatus(val)
	}
	if val, ok := patch["belt_rank"].(string); ok {
		v.BeltRank = BeltLevel(val)
		v.BeltLabel = BeltLabelMap[v.BeltRank]
	}
	if val, ok := patch["updated_at"].(time.Time); ok {
		v.UpdatedAt = val
	}
	s.items[id] = v
	return nil
}

func (s *InMemVoSinhStore) Delete(_ context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.items, id)
	return nil
}
