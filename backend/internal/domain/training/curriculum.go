package training

import (
	"context"
	"fmt"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — TRAINING MODULE EXPANSION
// Curriculum management, video library, progress tracking.
// ═══════════════════════════════════════════════════════════════

// ── Curriculum (Giáo án) ────────────────────────────────────

// CurriculumLevel maps to belt levels.
type CurriculumLevel string

const (
	LevelBachDai   CurriculumLevel = "bach_dai"    // White belt
	LevelLamDai1   CurriculumLevel = "lam_dai_1"   // Blue 1
	LevelLamDai2   CurriculumLevel = "lam_dai_2"   // Blue 2
	LevelHoangDai1 CurriculumLevel = "hoang_dai_1" // Yellow 1
	LevelHoangDai2 CurriculumLevel = "hoang_dai_2" // Yellow 2
	LevelHoangDai3 CurriculumLevel = "hoang_dai_3" // Yellow 3
	LevelHuyenDai  CurriculumLevel = "huyen_dai"   // Black belt
)

// Curriculum is a training program for a specific belt level.
type Curriculum struct {
	ID            string          `json:"id"`
	Level         CurriculumLevel `json:"level"`
	Title         string          `json:"title"`
	Description   string          `json:"description"`
	DurationWeeks int             `json:"duration_weeks"`
	Modules       []CurrModule    `json:"modules"`
	CreatedAt     time.Time       `json:"created_at"`
}

// CurrModule is a section within a curriculum.
type CurrModule struct {
	ID          string      `json:"id"`
	Title       string      `json:"title"`
	Order       int         `json:"order"`
	Description string      `json:"description"`
	Techniques  []Technique `json:"techniques"`
	Videos      []VideoRef  `json:"videos,omitempty"`
}

// Technique is a single martial arts technique to learn.
type Technique struct {
	ID          string `json:"id"`
	Name        string `json:"name"`     // e.g. "Đá tống trước"
	Category    string `json:"category"` // quyen, don_chan, don_tay, tu_ve
	Description string `json:"description"`
	Difficulty  int    `json:"difficulty"` // 1-5
}

// VideoRef links to a training video.
type VideoRef struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	URL         string `json:"url"`
	DurationSec int    `json:"duration_sec"`
	Thumbnail   string `json:"thumbnail,omitempty"`
}

// ── Progress Tracking ───────────────────────────────────────

// Progress tracks an athlete's advancement through a curriculum.
type Progress struct {
	ID             string          `json:"id"`
	AthleteID      string          `json:"athlete_id"`
	CurriculumID   string          `json:"curriculum_id"`
	Level          CurriculumLevel `json:"level"`
	CompletedItems []string        `json:"completed_items"` // technique IDs
	TotalItems     int             `json:"total_items"`
	Percentage     float64         `json:"percentage"`
	StartedAt      time.Time       `json:"started_at"`
	LastActivity   time.Time       `json:"last_activity"`
}

// ── Coach Assignment ────────────────────────────────────────

// Assignment links a coach to a training task.
type Assignment struct {
	ID          string    `json:"id"`
	CoachID     string    `json:"coach_id"`
	AthleteID   string    `json:"athlete_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	DueDate     string    `json:"due_date"`
	Status      string    `json:"status"` // assigned, in_progress, completed, overdue
	CreatedAt   time.Time `json:"created_at"`
}

// ── Store Interface ─────────────────────────────────────────

// CurriculumStore persists curriculum data.
type CurriculumStore interface {
	ListCurricula(ctx context.Context) ([]Curriculum, error)
	GetCurriculum(ctx context.Context, id string) (*Curriculum, error)
	CreateCurriculum(ctx context.Context, c *Curriculum) error
	ListProgress(ctx context.Context, athleteID string) ([]Progress, error)
	GetProgress(ctx context.Context, athleteID, curriculumID string) (*Progress, error)
	SaveProgress(ctx context.Context, p *Progress) error
	ListAssignments(ctx context.Context, athleteID string) ([]Assignment, error)
	CreateAssignment(ctx context.Context, a *Assignment) error
}

// ── Service ─────────────────────────────────────────────────

// CurriculumService manages training curricula and progress.
type CurriculumService struct {
	store CurriculumStore
	idGen func() string
}

// NewCurriculumService creates a new CurriculumService.
func NewCurriculumService(store CurriculumStore, idGen func() string) *CurriculumService {
	return &CurriculumService{store: store, idGen: idGen}
}

// ListCurricula returns all available curricula.
func (s *CurriculumService) ListCurricula(ctx context.Context) ([]Curriculum, error) {
	return s.store.ListCurricula(ctx)
}

// GetProgress returns an athlete's progress in a curriculum.
func (s *CurriculumService) GetProgress(ctx context.Context, athleteID, curriculumID string) (*Progress, error) {
	return s.store.GetProgress(ctx, athleteID, curriculumID)
}

// CompleteTechnique marks a technique as completed and updates progress.
func (s *CurriculumService) CompleteTechnique(ctx context.Context, athleteID, curriculumID, techniqueID string) (*Progress, error) {
	prog, err := s.store.GetProgress(ctx, athleteID, curriculumID)
	if err != nil {
		// Create new progress
		curr, err := s.store.GetCurriculum(ctx, curriculumID)
		if err != nil {
			return nil, fmt.Errorf("curriculum not found: %w", err)
		}
		totalItems := 0
		for _, mod := range curr.Modules {
			totalItems += len(mod.Techniques)
		}
		prog = &Progress{
			ID:             s.idGen(),
			AthleteID:      athleteID,
			CurriculumID:   curriculumID,
			Level:          curr.Level,
			CompletedItems: []string{},
			TotalItems:     totalItems,
			StartedAt:      time.Now().UTC(),
		}
	}

	// Check if already completed
	for _, id := range prog.CompletedItems {
		if id == techniqueID {
			return prog, nil // Already done
		}
	}

	prog.CompletedItems = append(prog.CompletedItems, techniqueID)
	prog.LastActivity = time.Now().UTC()
	if prog.TotalItems > 0 {
		prog.Percentage = float64(len(prog.CompletedItems)) / float64(prog.TotalItems) * 100
	}

	if err := s.store.SaveProgress(ctx, prog); err != nil {
		return nil, err
	}
	return prog, nil
}

// AssignTask creates a training assignment from coach to athlete.
func (s *CurriculumService) AssignTask(ctx context.Context, a *Assignment) error {
	if a.CoachID == "" || a.AthleteID == "" || a.Title == "" {
		return fmt.Errorf("coach_id, athlete_id, và title là bắt buộc")
	}
	a.ID = s.idGen()
	a.Status = "assigned"
	a.CreatedAt = time.Now().UTC()
	return s.store.CreateAssignment(ctx, a)
}

// GetAthleteOverview returns a summary of an athlete's training.
func (s *CurriculumService) GetAthleteOverview(ctx context.Context, athleteID string) (map[string]interface{}, error) {
	progressList, err := s.store.ListProgress(ctx, athleteID)
	if err != nil {
		return nil, err
	}
	assignments, err := s.store.ListAssignments(ctx, athleteID)
	if err != nil {
		return nil, err
	}

	pendingTasks := 0
	completedTasks := 0
	for _, a := range assignments {
		if a.Status == "completed" {
			completedTasks++
		} else {
			pendingTasks++
		}
	}

	return map[string]interface{}{
		"athlete_id":      athleteID,
		"curricula_count": len(progressList),
		"progress":        progressList,
		"pending_tasks":   pendingTasks,
		"completed_tasks": completedTasks,
		"assignments":     assignments,
	}, nil
}
