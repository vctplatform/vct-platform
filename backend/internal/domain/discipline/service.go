package discipline

import (
	"context"
	"fmt"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — DISCIPLINE DOMAIN
// Handles violations, investigations, hearings, sanctions,
// and appeals for the national federation.
// ═══════════════════════════════════════════════════════════════

// ── Constants ────────────────────────────────────────────────

type CaseStatus string

const (
	CaseStatusReported      CaseStatus = "reported"
	CaseStatusInvestigating CaseStatus = "investigating"
	CaseStatusHearing       CaseStatus = "hearing_scheduled"
	CaseStatusDecided       CaseStatus = "decided"
	CaseStatusAppealed      CaseStatus = "appealed"
	CaseStatusFinal         CaseStatus = "final"
	CaseStatusDismissed     CaseStatus = "dismissed"
)

type ViolationType string

const (
	ViolDoping          ViolationType = "doping"
	ViolViolence        ViolationType = "violence"
	ViolAgeFraud        ViolationType = "age_fraud"
	ViolWeightFraud     ViolationType = "weight_fraud"
	ViolUnsportsmanlike ViolationType = "unsportsmanlike"
	ViolAdminBreach     ViolationType = "admin_breach"
	ViolFinancial       ViolationType = "financial"
	ViolOther           ViolationType = "other"
)

type SanctionType string

const (
	SanctionWarning    SanctionType = "warning"
	SanctionFine       SanctionType = "fine"
	SanctionSuspension SanctionType = "suspension"
	SanctionBan        SanctionType = "ban"
	SanctionRevocation SanctionType = "revocation" // Thu hồi chứng nhận
	SanctionDismissal  SanctionType = "dismissal"  // Khai trừ
)

// ── Domain Models ────────────────────────────────────────────

// DisciplineCase represents a disciplinary proceeding.
type DisciplineCase struct {
	ID             string         `json:"id"`
	CaseNumber     string         `json:"case_number"` // e.g. KL-2026-001
	ViolationType  ViolationType  `json:"violation_type"`
	Status         CaseStatus     `json:"status"`
	Title          string         `json:"title"`
	Description    string         `json:"description"`
	SubjectType    string         `json:"subject_type"` // "athlete", "coach", "referee", "club"
	SubjectID      string         `json:"subject_id"`
	SubjectName    string         `json:"subject_name"`
	ReportedBy     string         `json:"reported_by"`
	ReportedByName string         `json:"reported_by_name"`
	ReportedAt     time.Time      `json:"reported_at"`
	TournamentID   string         `json:"tournament_id,omitempty"`
	TournamentName string         `json:"tournament_name,omitempty"`
	InvestigatorID string         `json:"investigator_id,omitempty"`
	Evidence       []Evidence     `json:"evidence,omitempty"`
	Sanctions      []Sanction     `json:"sanctions,omitempty"`
	Timeline       []CaseEvent    `json:"timeline,omitempty"`
	Metadata       map[string]any `json:"metadata,omitempty"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	ClosedAt       *time.Time     `json:"closed_at,omitempty"`
}

type Evidence struct {
	ID          string `json:"id"`
	Type        string `json:"type"` // "document", "video", "photo", "testimony"
	Description string `json:"description"`
	URL         string `json:"url,omitempty"`
	AddedBy     string `json:"added_by"`
	AddedAt     string `json:"added_at"`
}

type Sanction struct {
	ID        string       `json:"id"`
	Type      SanctionType `json:"type"`
	Duration  string       `json:"duration,omitempty"` // e.g. "6 months", "permanent"
	Amount    float64      `json:"amount,omitempty"`   // For fines
	StartDate string       `json:"start_date"`
	EndDate   string       `json:"end_date,omitempty"`
	DecidedBy string       `json:"decided_by"`
	DecidedAt string       `json:"decided_at"`
	Reason    string       `json:"reason"`
}

type CaseEvent struct {
	Action    string `json:"action"`
	ActorID   string `json:"actor_id"`
	ActorName string `json:"actor_name"`
	Timestamp string `json:"timestamp"`
	Comment   string `json:"comment,omitempty"`
}

type Hearing struct {
	ID           string    `json:"id"`
	CaseID       string    `json:"case_id"`
	ScheduleAt   time.Time `json:"schedule_at"`
	Location     string    `json:"location"`
	BoardMembers []string  `json:"board_members"`
	Minutes      string    `json:"minutes,omitempty"`
	Decision     string    `json:"decision,omitempty"`
	Status       string    `json:"status"` // "scheduled", "completed", "cancelled"
	CreatedAt    time.Time `json:"created_at"`
}

// ── Repository ───────────────────────────────────────────────

type CaseRepository interface {
	Create(ctx context.Context, c DisciplineCase) (*DisciplineCase, error)
	GetByID(ctx context.Context, id string) (*DisciplineCase, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) error
	List(ctx context.Context) ([]DisciplineCase, error)
	ListByStatus(ctx context.Context, status CaseStatus) ([]DisciplineCase, error)
	ListBySubject(ctx context.Context, subjectType, subjectID string) ([]DisciplineCase, error)
}

type HearingRepository interface {
	Create(ctx context.Context, h Hearing) (*Hearing, error)
	GetByID(ctx context.Context, id string) (*Hearing, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) error
	ListByCase(ctx context.Context, caseID string) ([]Hearing, error)
}

// ── Service ──────────────────────────────────────────────────

type Service struct {
	cases    CaseRepository
	hearings HearingRepository
	idGen    func() string
}

func NewService(cases CaseRepository, hearings HearingRepository, idGen func() string) *Service {
	return &Service{cases: cases, hearings: hearings, idGen: idGen}
}

// ReportViolation creates a new discipline case.
func (s *Service) ReportViolation(ctx context.Context, c DisciplineCase) (*DisciplineCase, error) {
	if c.Title == "" || c.SubjectID == "" || c.ViolationType == "" {
		return nil, fmt.Errorf("title, subject_id và violation_type là bắt buộc")
	}
	c.ID = s.idGen()
	c.CaseNumber = fmt.Sprintf("KL-%d-%s", time.Now().Year(), c.ID[:6])
	c.Status = CaseStatusReported
	now := time.Now().UTC()
	c.ReportedAt = now
	c.CreatedAt = now
	c.UpdatedAt = now
	c.Timeline = []CaseEvent{{
		Action:    "reported",
		ActorID:   c.ReportedBy,
		ActorName: c.ReportedByName,
		Timestamp: now.Format(time.RFC3339),
		Comment:   "Báo cáo vi phạm được tạo",
	}}

	return s.cases.Create(ctx, c)
}

// AssignInvestigator assigns an inspector to investigate the case.
func (s *Service) AssignInvestigator(ctx context.Context, caseID, inspectorID string) error {
	c, err := s.cases.GetByID(ctx, caseID)
	if err != nil {
		return err
	}
	if c.Status != CaseStatusReported {
		return fmt.Errorf("chỉ vụ việc mới báo cáo mới gán điều tra")
	}
	return s.cases.Update(ctx, caseID, map[string]interface{}{
		"status":          string(CaseStatusInvestigating),
		"investigator_id": inspectorID,
		"updated_at":      time.Now().UTC(),
	})
}

// ScheduleHearing creates a hearing for the case.
func (s *Service) ScheduleHearing(ctx context.Context, h Hearing) (*Hearing, error) {
	if h.CaseID == "" || h.ScheduleAt.IsZero() {
		return nil, fmt.Errorf("case_id và schedule_at là bắt buộc")
	}
	h.ID = s.idGen()
	h.Status = "scheduled"
	h.CreatedAt = time.Now().UTC()

	// Update case status
	_ = s.cases.Update(ctx, h.CaseID, map[string]interface{}{
		"status":     string(CaseStatusHearing),
		"updated_at": time.Now().UTC(),
	})

	return s.hearings.Create(ctx, h)
}

// RecordDecision records the hearing decision and sanctions.
func (s *Service) RecordDecision(ctx context.Context, caseID string, sanctions []Sanction) error {
	c, err := s.cases.GetByID(ctx, caseID)
	if err != nil {
		return err
	}
	if c.Status != CaseStatusHearing && c.Status != CaseStatusInvestigating {
		return fmt.Errorf("vụ việc không trong giai đoạn xét xử")
	}

	return s.cases.Update(ctx, caseID, map[string]interface{}{
		"status":     string(CaseStatusDecided),
		"sanctions":  sanctions,
		"updated_at": time.Now().UTC(),
	})
}

// DismissCase dismisses without sanctions.
func (s *Service) DismissCase(ctx context.Context, caseID, reason string) error {
	now := time.Now().UTC()
	return s.cases.Update(ctx, caseID, map[string]interface{}{
		"status":     string(CaseStatusDismissed),
		"closed_at":  now,
		"updated_at": now,
	})
}

// ── Query ────────────────────────────────────────────────────

func (s *Service) GetCase(ctx context.Context, id string) (*DisciplineCase, error) {
	return s.cases.GetByID(ctx, id)
}

func (s *Service) ListCases(ctx context.Context) ([]DisciplineCase, error) {
	return s.cases.List(ctx)
}

func (s *Service) ListByStatus(ctx context.Context, status CaseStatus) ([]DisciplineCase, error) {
	return s.cases.ListByStatus(ctx, status)
}
