package provincial

import (
	"context"
	"fmt"
	"sync"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — PROVINCIAL AUXILIARY SERVICES
// Finance, Certification, Discipline, Documents for province.
// ═══════════════════════════════════════════════════════════════

// ── Finance Models ───────────────────────────────────────────

type FinanceEntryType string

const (
	FinanceEntryIncome  FinanceEntryType = "income"
	FinanceEntryExpense FinanceEntryType = "expense"
)

type FinanceEntry struct {
	ID          string           `json:"id"`
	ProvinceID  string           `json:"province_id"`
	Type        FinanceEntryType `json:"type"`
	Category    string           `json:"category"`
	Amount      float64          `json:"amount"`
	Description string           `json:"description"`
	Date        string           `json:"date"`
	Ref         string           `json:"ref,omitempty"` // Số phiếu thu/chi
	CreatedBy   string           `json:"created_by,omitempty"`
	CreatedAt   time.Time        `json:"created_at"`
}

type FinanceSummary struct {
	ProvinceID   string  `json:"province_id"`
	TotalIncome  float64 `json:"total_income"`
	TotalExpense float64 `json:"total_expense"`
	Balance      float64 `json:"balance"`
	EntryCount   int     `json:"entry_count"`
}

// ── Certification Models ─────────────────────────────────────

type ProvincialCert struct {
	ID         string    `json:"id"`
	ProvinceID string    `json:"province_id"`
	Type       string    `json:"type"` // belt | coach | referee
	HolderID   string    `json:"holder_id"`
	HolderName string    `json:"holder_name"`
	CertNumber string    `json:"cert_number"`
	Level      string    `json:"level"`
	IssueDate  string    `json:"issue_date"`
	ExpiryDate string    `json:"expiry_date,omitempty"`
	Status     string    `json:"status"` // valid | expired | revoked
	IssuedBy   string    `json:"issued_by"`
	CreatedAt  time.Time `json:"created_at"`
}

// ── Discipline Models ────────────────────────────────────────

type DisciplineCase struct {
	ID          string     `json:"id"`
	ProvinceID  string     `json:"province_id"`
	SubjectID   string     `json:"subject_id"`
	SubjectName string     `json:"subject_name"`
	SubjectType string     `json:"subject_type"` // athlete | coach | club
	Violation   string     `json:"violation"`
	Severity    string     `json:"severity"` // minor | moderate | severe
	Status      string     `json:"status"`   // open | investigating | resolved | closed
	Penalty     string     `json:"penalty,omitempty"`
	ReportedAt  time.Time  `json:"reported_at"`
	ResolvedAt  *time.Time `json:"resolved_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

// ── Document Models ──────────────────────────────────────────

type ProvincialDoc struct {
	ID         string    `json:"id"`
	ProvinceID string    `json:"province_id"`
	Type       string    `json:"type"` // dispatch | decision | notice | minutes
	Number     string    `json:"number"`
	Title      string    `json:"title"`
	Content    string    `json:"content,omitempty"`
	Status     string    `json:"status"` // draft | published | archived
	Author     string    `json:"author"`
	IssuedDate string    `json:"issued_date,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// ── In-Memory Finance Store ──────────────────────────────────

type InMemFinanceStore struct {
	mu      sync.RWMutex
	entries map[string]FinanceEntry
}

func NewInMemFinanceStore() *InMemFinanceStore {
	s := &InMemFinanceStore{entries: make(map[string]FinanceEntry)}
	s.seed()
	return s
}

func (s *InMemFinanceStore) seed() {
	now := time.Now().UTC()
	for _, e := range []FinanceEntry{
		{ID: "FIN-HCM-001", ProvinceID: "PROV-HCM", Type: FinanceEntryIncome, Category: "Hội phí CLB", Amount: 50000000, Description: "Thu hội phí Q1/2026 — 4 CLB", Date: "2026-01-15", Ref: "PT-001/2026", CreatedAt: now},
		{ID: "FIN-HCM-002", ProvinceID: "PROV-HCM", Type: FinanceEntryIncome, Category: "Phí thi đấu", Amount: 30000000, Description: "Lệ phí đăng ký giải 2025", Date: "2025-07-01", Ref: "PT-015/2025", CreatedAt: now},
		{ID: "FIN-HCM-003", ProvinceID: "PROV-HCM", Type: FinanceEntryExpense, Category: "Chi giải đấu", Amount: 25000000, Description: "Chi phí tổ chức giải VCT TP.HCM 2025", Date: "2025-07-25", Ref: "PC-008/2025", CreatedAt: now},
		{ID: "FIN-HCM-004", ProvinceID: "PROV-HCM", Type: FinanceEntryExpense, Category: "Nộp trung ương", Amount: 15000000, Description: "Nộp hội phí về LĐ trung ương Q1/2026", Date: "2026-02-01", Ref: "PC-001/2026", CreatedAt: now},
		{ID: "FIN-HCM-005", ProvinceID: "PROV-HCM", Type: FinanceEntryExpense, Category: "Hành chính", Amount: 5000000, Description: "Chi phí văn phòng phẩm, in ấn T1/2026", Date: "2026-01-31", Ref: "PC-002/2026", CreatedAt: now},
	} {
		s.entries[e.ID] = e
	}
}

func (s *InMemFinanceStore) List(_ context.Context, provinceID string) ([]FinanceEntry, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []FinanceEntry
	for _, e := range s.entries {
		if provinceID == "" || e.ProvinceID == provinceID {
			result = append(result, e)
		}
	}
	return result, nil
}

func (s *InMemFinanceStore) Create(_ context.Context, e FinanceEntry) (*FinanceEntry, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.entries[e.ID] = e
	return &e, nil
}

func (s *InMemFinanceStore) Summary(_ context.Context, provinceID string) (*FinanceSummary, error) {
	entries, err := s.List(nil, provinceID)
	if err != nil {
		return nil, err
	}
	sum := &FinanceSummary{ProvinceID: provinceID, EntryCount: len(entries)}
	for _, e := range entries {
		if e.Type == FinanceEntryIncome {
			sum.TotalIncome += e.Amount
		}
		if e.Type == FinanceEntryExpense {
			sum.TotalExpense += e.Amount
		}
	}
	sum.Balance = sum.TotalIncome - sum.TotalExpense
	return sum, nil
}

// ── In-Memory Cert Store ─────────────────────────────────────

type InMemCertStore struct {
	mu    sync.RWMutex
	certs map[string]ProvincialCert
}

func NewInMemCertStore() *InMemCertStore {
	s := &InMemCertStore{certs: make(map[string]ProvincialCert)}
	s.seed()
	return s
}

func (s *InMemCertStore) seed() {
	now := time.Now().UTC()
	for _, c := range []ProvincialCert{
		{ID: "CERT-HCM-001", ProvinceID: "PROV-HCM", Type: "belt", HolderID: "VDV-HCM-001", HolderName: "Nguyễn Hoàng Anh", CertNumber: "CN-DAI-HCM-2024-001", Level: "Nhị đẳng", IssueDate: "2024-03-15", Status: "valid", IssuedBy: "LĐ VCT TP.HCM", CreatedAt: now},
		{ID: "CERT-HCM-002", ProvinceID: "PROV-HCM", Type: "coach", HolderID: "HLV-HCM-001", HolderName: "Võ Minh Đức", CertNumber: "CN-HLV-HCM-2023-001", Level: "HLV cấp II", IssueDate: "2023-06-20", ExpiryDate: "2028-06-20", Status: "valid", IssuedBy: "LĐ VCT TP.HCM", CreatedAt: now},
		{ID: "CERT-HCM-003", ProvinceID: "PROV-HCM", Type: "referee", HolderID: "TT-HCM-001", HolderName: "Huỳnh Văn Khánh", CertNumber: "CN-TT-HCM-2024-001", Level: "Trọng tài cấp II", IssueDate: "2024-01-10", ExpiryDate: "2027-01-10", Status: "valid", IssuedBy: "LĐ VCT TP.HCM", CreatedAt: now},
	} {
		s.certs[c.ID] = c
	}
}

func (s *InMemCertStore) List(_ context.Context, provinceID string) ([]ProvincialCert, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []ProvincialCert
	for _, c := range s.certs {
		if provinceID == "" || c.ProvinceID == provinceID {
			result = append(result, c)
		}
	}
	return result, nil
}

func (s *InMemCertStore) Create(_ context.Context, c ProvincialCert) (*ProvincialCert, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.certs[c.ID] = c
	return &c, nil
}

// ── In-Memory Discipline Store ───────────────────────────────

type InMemDisciplineStore struct {
	mu    sync.RWMutex
	cases map[string]DisciplineCase
}

func NewInMemDisciplineStore() *InMemDisciplineStore {
	s := &InMemDisciplineStore{cases: make(map[string]DisciplineCase)}
	s.seed()
	return s
}

func (s *InMemDisciplineStore) seed() {
	now := time.Now().UTC()
	for _, c := range []DisciplineCase{
		{ID: "DISC-HCM-001", ProvinceID: "PROV-HCM", SubjectID: "VDV-HCM-004", SubjectName: "Phạm Thị Lan", SubjectType: "athlete", Violation: "Vi phạm quy chế thi đấu giải TP.HCM 2025", Severity: "minor", Status: "resolved", Penalty: "Cảnh cáo", ReportedAt: now.Add(-30 * 24 * time.Hour), CreatedAt: now},
	} {
		s.cases[c.ID] = c
	}
}

func (s *InMemDisciplineStore) List(_ context.Context, provinceID string) ([]DisciplineCase, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []DisciplineCase
	for _, c := range s.cases {
		if provinceID == "" || c.ProvinceID == provinceID {
			result = append(result, c)
		}
	}
	return result, nil
}

func (s *InMemDisciplineStore) Create(_ context.Context, c DisciplineCase) (*DisciplineCase, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.cases[c.ID] = c
	return &c, nil
}

func (s *InMemDisciplineStore) Update(_ context.Context, id string, patch map[string]interface{}) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	c, ok := s.cases[id]
	if !ok {
		return fmt.Errorf("case not found: %s", id)
	}
	if v, ok := patch["status"].(string); ok {
		c.Status = v
	}
	if v, ok := patch["penalty"].(string); ok {
		c.Penalty = v
	}
	s.cases[id] = c
	return nil
}

// ── In-Memory Document Store ─────────────────────────────────

type InMemDocStore struct {
	mu   sync.RWMutex
	docs map[string]ProvincialDoc
}

func NewInMemDocStore() *InMemDocStore {
	s := &InMemDocStore{docs: make(map[string]ProvincialDoc)}
	s.seed()
	return s
}

func (s *InMemDocStore) seed() {
	now := time.Now().UTC()
	for _, d := range []ProvincialDoc{
		{ID: "DOC-HCM-001", ProvinceID: "PROV-HCM", Type: "decision", Number: "QĐ-001/2026/LĐ-HCM", Title: "Quyết định thành lập Ban tổ chức giải VCT TP.HCM 2026", Status: "published", Author: "Trương Quốc Bảo", IssuedDate: "2026-01-10", CreatedAt: now, UpdatedAt: now},
		{ID: "DOC-HCM-002", ProvinceID: "PROV-HCM", Type: "dispatch", Number: "CV-005/2026/LĐ-HCM", Title: "Công văn triệu tập họp BCH quý I/2026", Status: "published", Author: "Phan Văn Sơn", IssuedDate: "2026-01-20", CreatedAt: now, UpdatedAt: now},
		{ID: "DOC-HCM-003", ProvinceID: "PROV-HCM", Type: "notice", Number: "TB-003/2026/LĐ-HCM", Title: "Thông báo lịch thi thăng đẳng Q2/2026", Status: "published", Author: "Mai Thanh Tâm", IssuedDate: "2026-02-15", CreatedAt: now, UpdatedAt: now},
		{ID: "DOC-HCM-004", ProvinceID: "PROV-HCM", Type: "minutes", Number: "BB-001/2026/LĐ-HCM", Title: "Biên bản họp BCH quý I/2026", Status: "draft", Author: "Phan Văn Sơn", CreatedAt: now, UpdatedAt: now},
	} {
		s.docs[d.ID] = d
	}
}

func (s *InMemDocStore) List(_ context.Context, provinceID string) ([]ProvincialDoc, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []ProvincialDoc
	for _, d := range s.docs {
		if provinceID == "" || d.ProvinceID == provinceID {
			result = append(result, d)
		}
	}
	return result, nil
}

func (s *InMemDocStore) Create(_ context.Context, d ProvincialDoc) (*ProvincialDoc, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.docs[d.ID] = d
	return &d, nil
}

func (s *InMemDocStore) Update(_ context.Context, id string, patch map[string]interface{}) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	d, ok := s.docs[id]
	if !ok {
		return fmt.Errorf("doc not found: %s", id)
	}
	if v, ok := patch["status"].(string); ok {
		d.Status = v
	}
	d.UpdatedAt = time.Now().UTC()
	s.docs[id] = d
	return nil
}
