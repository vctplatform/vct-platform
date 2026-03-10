package training

import (
	"context"
	"fmt"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — TRAINING MODULE
// Training plans, attendance tracking, belt exams, e-learning.
// ═══════════════════════════════════════════════════════════════

// ── Domain Models ────────────────────────────────────────────

// TrainingPlan represents a structured training program.
type TrainingPlan struct {
	ID            string            `json:"id"`
	ClubID        string            `json:"club_id"`
	CoachID       string            `json:"coach_id"`
	Title         string            `json:"title"`
	Description   string            `json:"description,omitempty"`
	Level         string            `json:"level"`                 // "beginner","intermediate","advanced","all"
	BeltTarget    string            `json:"belt_target,omitempty"` // target belt rank
	DurationWeeks int               `json:"duration_weeks"`
	Schedule      []ScheduleSlot    `json:"schedule,omitempty"` // weekly recurring slots
	Curriculum    []CurriculumEntry `json:"curriculum,omitempty"`
	Status        string            `json:"status"` // "draft","active","completed","archived"
	StartDate     string            `json:"start_date,omitempty"`
	EndDate       string            `json:"end_date,omitempty"`
	CreatedAt     time.Time         `json:"created_at"`
	UpdatedAt     time.Time         `json:"updated_at"`
}

// ScheduleSlot defines a recurring weekly training time.
type ScheduleSlot struct {
	DayOfWeek int    `json:"day_of_week"` // 0=Sunday, 1=Monday ...
	StartTime string `json:"start_time"`  // "18:00"
	EndTime   string `json:"end_time"`    // "20:00"
	Location  string `json:"location,omitempty"`
}

// CurriculumEntry maps a technique/topic to a specific week.
type CurriculumEntry struct {
	Week        int    `json:"week"`
	Topic       string `json:"topic"`
	TechniqueID string `json:"technique_id,omitempty"`
	Notes       string `json:"notes,omitempty"`
}

// AttendanceRecord tracks a student's attendance at a session.
type AttendanceRecord struct {
	ID          string    `json:"id"`
	ClubID      string    `json:"club_id"`
	MemberID    string    `json:"member_id"`
	MemberName  string    `json:"member_name"`
	PlanID      string    `json:"plan_id,omitempty"`
	SessionDate string    `json:"session_date"` // "2026-03-10"
	Status      string    `json:"status"`       // "present","absent","late","excused"
	CheckInAt   string    `json:"check_in_at,omitempty"`
	Notes       string    `json:"notes,omitempty"`
	RecordedBy  string    `json:"recorded_by"` // coach user ID
	CreatedAt   time.Time `json:"created_at"`
}

// BeltExam represents a belt promotion examination event.
type BeltExam struct {
	ID            string        `json:"id"`
	ClubID        string        `json:"club_id,omitempty"`
	OrganizerType string        `json:"organizer_type"` // "club","provincial","national"
	OrganizerID   string        `json:"organizer_id"`
	ExamDate      string        `json:"exam_date"`
	Location      string        `json:"location"`
	TargetBelt    string        `json:"target_belt"` // belt rank being tested for
	Panel         []PanelMember `json:"panel"`       // examiners
	Status        string        `json:"status"`      // uses BeltExamTransitions
	MaxCandidates int           `json:"max_candidates"`
	CreatedBy     string        `json:"created_by"`
	ApprovedBy    string        `json:"approved_by,omitempty"`
	CreatedAt     time.Time     `json:"created_at"`
}

// PanelMember represents an examiner on the belt exam panel.
type PanelMember struct {
	UserID    string `json:"user_id"`
	Name      string `json:"name"`
	BeltLevel string `json:"belt_level"`
	Role      string `json:"role"` // "chief_examiner","examiner"
}

// BeltExamEntry is a candidate's registration + result for a belt exam.
type BeltExamEntry struct {
	ID             string     `json:"id"`
	ExamID         string     `json:"exam_id"`
	AthleteID      string     `json:"athlete_id"`
	AthleteName    string     `json:"athlete_name"`
	CurrentBelt    string     `json:"current_belt"`
	TargetBelt     string     `json:"target_belt"`
	CoachID        string     `json:"coach_id"`
	CoachName      string     `json:"coach_name"`
	ClubID         string     `json:"club_id"`
	Status         string     `json:"status"` // "registered","eligible","ineligible","passed","failed"
	PracticalScore float64    `json:"practical_score,omitempty"`
	TheoryScore    float64    `json:"theory_score,omitempty"`
	FinalResult    string     `json:"final_result,omitempty"` // "pass","fail"
	ExaminerNotes  string     `json:"examiner_notes,omitempty"`
	GradedBy       string     `json:"graded_by,omitempty"`
	GradedAt       *time.Time `json:"graded_at,omitempty"`
	CertificateID  string     `json:"certificate_id,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
}

// ElearningCourse represents an online learning resource.
type ElearningCourse struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Category    string    `json:"category"` // "technique","theory","rules","history"
	Level       string    `json:"level"`
	ContentURL  string    `json:"content_url,omitempty"` // video/document URL
	Duration    int       `json:"duration_minutes,omitempty"`
	IsPublished bool      `json:"is_published"`
	CreatedBy   string    `json:"created_by"`
	CreatedAt   time.Time `json:"created_at"`
}

// ── Repositories ─────────────────────────────────────────────

type TrainingPlanRepository interface {
	Create(ctx context.Context, p TrainingPlan) (*TrainingPlan, error)
	GetByID(ctx context.Context, id string) (*TrainingPlan, error)
	ListByClub(ctx context.Context, clubID string) ([]TrainingPlan, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) (*TrainingPlan, error)
}

type AttendanceRepository interface {
	Record(ctx context.Context, a AttendanceRecord) error
	ListBySession(ctx context.Context, clubID, date string) ([]AttendanceRecord, error)
	ListByMember(ctx context.Context, memberID string) ([]AttendanceRecord, error)
	GetStats(ctx context.Context, clubID, memberID string) (*AttendanceStats, error)
}

// AttendanceStats summarizes attendance for a member.
type AttendanceStats struct {
	TotalSessions  int     `json:"total_sessions"`
	Present        int     `json:"present"`
	Absent         int     `json:"absent"`
	Late           int     `json:"late"`
	Excused        int     `json:"excused"`
	AttendanceRate float64 `json:"attendance_rate"` // (present+late) / total * 100
}

type BeltExamRepository interface {
	Create(ctx context.Context, e BeltExam) (*BeltExam, error)
	GetByID(ctx context.Context, id string) (*BeltExam, error)
	ListUpcoming(ctx context.Context) ([]BeltExam, error)
	UpdateStatus(ctx context.Context, id, status string) error
}

type BeltExamEntryRepository interface {
	Register(ctx context.Context, entry BeltExamEntry) (*BeltExamEntry, error)
	ListByExam(ctx context.Context, examID string) ([]BeltExamEntry, error)
	UpdateResult(ctx context.Context, entryID string, patch map[string]interface{}) error
}

// ── Service ──────────────────────────────────────────────────

// Service provides business logic for training operations.
type Service struct {
	planRepo       TrainingPlanRepository
	attendanceRepo AttendanceRepository
	examRepo       BeltExamRepository
	entryRepo      BeltExamEntryRepository
}

// NewService creates a Training service.
func NewService(
	plan TrainingPlanRepository,
	attendance AttendanceRepository,
	exam BeltExamRepository,
	entry BeltExamEntryRepository,
) *Service {
	return &Service{
		planRepo:       plan,
		attendanceRepo: attendance,
		examRepo:       exam,
		entryRepo:      entry,
	}
}

// ── Training Plan ────────────────────────────────────────────

func (s *Service) CreatePlan(ctx context.Context, p TrainingPlan) (*TrainingPlan, error) {
	if p.Title == "" {
		return nil, fmt.Errorf("tiêu đề kế hoạch không được để trống")
	}
	if p.ClubID == "" {
		return nil, fmt.Errorf("CLB là bắt buộc")
	}
	if p.Status == "" {
		p.Status = "draft"
	}
	return s.planRepo.Create(ctx, p)
}

func (s *Service) GetPlan(ctx context.Context, id string) (*TrainingPlan, error) {
	return s.planRepo.GetByID(ctx, id)
}

func (s *Service) ListPlansByClub(ctx context.Context, clubID string) ([]TrainingPlan, error) {
	return s.planRepo.ListByClub(ctx, clubID)
}

// ── Attendance ───────────────────────────────────────────────

func (s *Service) RecordAttendance(ctx context.Context, a AttendanceRecord) error {
	if a.MemberID == "" || a.SessionDate == "" || a.Status == "" {
		return fmt.Errorf("member_id, session_date, và status là bắt buộc")
	}
	validStatuses := map[string]bool{
		"present": true, "absent": true, "late": true, "excused": true,
	}
	if !validStatuses[a.Status] {
		return fmt.Errorf("trạng thái điểm danh không hợp lệ: %s", a.Status)
	}
	return s.attendanceRepo.Record(ctx, a)
}

func (s *Service) GetAttendanceBySession(ctx context.Context, clubID, date string) ([]AttendanceRecord, error) {
	return s.attendanceRepo.ListBySession(ctx, clubID, date)
}

func (s *Service) GetMemberAttendanceStats(ctx context.Context, clubID, memberID string) (*AttendanceStats, error) {
	return s.attendanceRepo.GetStats(ctx, clubID, memberID)
}

// ── Belt Exam ────────────────────────────────────────────────

func (s *Service) CreateBeltExam(ctx context.Context, e BeltExam) (*BeltExam, error) {
	if e.ExamDate == "" || e.Location == "" || e.TargetBelt == "" {
		return nil, fmt.Errorf("ngày thi, địa điểm, và đai mục tiêu là bắt buộc")
	}
	if len(e.Panel) == 0 {
		return nil, fmt.Errorf("hội đồng thi phải có ít nhất 1 thành viên")
	}
	if e.Status == "" {
		e.Status = "dang_ky_thi"
	}
	return s.examRepo.Create(ctx, e)
}

func (s *Service) RegisterForExam(ctx context.Context, entry BeltExamEntry) (*BeltExamEntry, error) {
	if entry.ExamID == "" || entry.AthleteID == "" {
		return nil, fmt.Errorf("exam_id và athlete_id là bắt buộc")
	}
	if entry.Status == "" {
		entry.Status = "registered"
	}
	return s.entryRepo.Register(ctx, entry)
}

func (s *Service) GradeExamEntry(ctx context.Context, entryID string, practical, theory float64, result, notes, gradedBy string) error {
	if result != "pass" && result != "fail" {
		return fmt.Errorf("kết quả phải là 'pass' hoặc 'fail'")
	}
	now := time.Now().UTC()
	return s.entryRepo.UpdateResult(ctx, entryID, map[string]interface{}{
		"practical_score": practical,
		"theory_score":    theory,
		"final_result":    result,
		"examiner_notes":  notes,
		"graded_by":       gradedBy,
		"graded_at":       now,
		"status":          map[string]string{"pass": "passed", "fail": "failed"}[result],
	})
}

func (s *Service) GetExamCandidates(ctx context.Context, examID string) ([]BeltExamEntry, error) {
	return s.entryRepo.ListByExam(ctx, examID)
}
