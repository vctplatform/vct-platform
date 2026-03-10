package registration

import (
	"fmt"
	"strings"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — REGISTRATION VALIDATOR
// Centralized validation engine for athlete content registration.
// 8 business rules enforced at registration time.
// ═══════════════════════════════════════════════════════════════

// ── Input Models ─────────────────────────────────────────────

// RegistrationInput is the data needed to validate a registration.
type RegistrationInput struct {
	TournamentID string
	TeamID       string
	AthleteID    string
	ContentID    string // category/content being registered for
}

// AthleteProfile contains athlete info needed for validation.
type AthleteProfile struct {
	ID        string
	HoTen     string
	Gioi      string // "nam" or "nu"
	NgaySinh  string // "2005-03-10"
	CanNang   float64
	BeltLevel string // current belt rank code
	TeamID    string
}

// ContentCategory contains the rules for a competition category.
type ContentCategory struct {
	ID        string
	Name      string
	Gioi      string // "nam","nu","mixed"
	MinAge    int
	MaxAge    int
	WeightMin float64
	WeightMax float64
	MinBelt   string // minimum belt rank code
	MaxQuota  int    // max athletes per team per category
}

// TournamentContext contains tournament-level info for validation.
type TournamentContext struct {
	ID              string
	Status          string // current tournament status
	RegistrationEnd *time.Time
}

// ExistingRegistrations helps check for duplicates and quotas.
type ExistingRegistrations struct {
	AthleteContentPairs map[string]bool // "athleteID:contentID" → exists
	TeamCategoryCounts  map[string]int  // "teamID:contentID" → count
}

// ── Validation Result ────────────────────────────────────────

// ValidationError represents a single validation failure.
type ValidationError struct {
	Rule    string `json:"rule"`
	Message string `json:"message"`
	Field   string `json:"field,omitempty"`
}

// ValidationResult contains the outcome of validation.
type ValidationResult struct {
	Valid  bool              `json:"valid"`
	Errors []ValidationError `json:"errors,omitempty"`
}

// ── Belt Rank Ordering ───────────────────────────────────────

// beltOrder maps belt codes to their rank (higher = more senior).
var beltOrder = map[string]int{
	"trang":       1,
	"vang":        2,
	"xanh_la":     3,
	"xanh_duong":  4,
	"nau":         5,
	"do":          6,
	"hong":        7,
	"huyen_dai_1": 8,
	"huyen_dai_2": 9,
	"huyen_dai_3": 10,
	"huyen_dai_4": 11,
	"huyen_dai_5": 12,
}

func beltRank(code string) int {
	if r, ok := beltOrder[code]; ok {
		return r
	}
	return 0
}

// ── Validator ────────────────────────────────────────────────

// Validate performs all 8 business rules against a registration.
//
// Rules:
//  1. Tournament is in registration period
//  2. Registration deadline has not passed
//  3. Athlete belongs to the registering team
//  4. Athlete age is within category range
//  5. Athlete gender matches category
//  6. Athlete weight is within category range
//  7. Athlete belt level meets minimum requirement
//  8. No duplicate registration (same athlete + same content)
//  9. Team quota not exceeded for this category
func Validate(
	input RegistrationInput,
	athlete AthleteProfile,
	category ContentCategory,
	tournament TournamentContext,
	existing ExistingRegistrations,
) ValidationResult {
	var errors []ValidationError

	// Rule 1: Tournament status
	if tournament.Status != "dang_ky" {
		errors = append(errors, ValidationError{
			Rule:    "tournament_status",
			Message: fmt.Sprintf("Giải đấu đang ở trạng thái '%s', không thể đăng ký", tournament.Status),
			Field:   "tournament_id",
		})
	}

	// Rule 2: Registration deadline
	if tournament.RegistrationEnd != nil {
		if time.Now().After(*tournament.RegistrationEnd) {
			errors = append(errors, ValidationError{
				Rule:    "deadline",
				Message: fmt.Sprintf("Đã quá hạn đăng ký (%s)", tournament.RegistrationEnd.Format("02/01/2006 15:04")),
				Field:   "tournament_id",
			})
		}
	}

	// Rule 3: Athlete belongs to team
	if athlete.TeamID != input.TeamID {
		errors = append(errors, ValidationError{
			Rule:    "team_membership",
			Message: fmt.Sprintf("VĐV %s không thuộc đoàn này", athlete.HoTen),
			Field:   "athlete_id",
		})
	}

	// Rule 4: Age check
	age := calculateAge(athlete.NgaySinh)
	if age >= 0 {
		if category.MinAge > 0 && age < category.MinAge {
			errors = append(errors, ValidationError{
				Rule:    "age_min",
				Message: fmt.Sprintf("VĐV %d tuổi, yêu cầu tối thiểu %d tuổi cho nội dung %s", age, category.MinAge, category.Name),
				Field:   "ngay_sinh",
			})
		}
		if category.MaxAge > 0 && age > category.MaxAge {
			errors = append(errors, ValidationError{
				Rule:    "age_max",
				Message: fmt.Sprintf("VĐV %d tuổi, yêu cầu tối đa %d tuổi cho nội dung %s", age, category.MaxAge, category.Name),
				Field:   "ngay_sinh",
			})
		}
	}

	// Rule 5: Gender match
	if category.Gioi != "mixed" && category.Gioi != "" {
		if !strings.EqualFold(athlete.Gioi, category.Gioi) {
			errors = append(errors, ValidationError{
				Rule:    "gender",
				Message: fmt.Sprintf("VĐV giới tính '%s', nội dung yêu cầu '%s'", athlete.Gioi, category.Gioi),
				Field:   "gioi",
			})
		}
	}

	// Rule 6: Weight check
	if category.WeightMin > 0 && athlete.CanNang < category.WeightMin {
		errors = append(errors, ValidationError{
			Rule:    "weight_min",
			Message: fmt.Sprintf("VĐV %.1fkg, yêu cầu tối thiểu %.1fkg", athlete.CanNang, category.WeightMin),
			Field:   "can_nang",
		})
	}
	if category.WeightMax > 0 && athlete.CanNang > category.WeightMax {
		errors = append(errors, ValidationError{
			Rule:    "weight_max",
			Message: fmt.Sprintf("VĐV %.1fkg, yêu cầu tối đa %.1fkg", athlete.CanNang, category.WeightMax),
			Field:   "can_nang",
		})
	}

	// Rule 7: Belt level
	if category.MinBelt != "" {
		athleteRank := beltRank(athlete.BeltLevel)
		requiredRank := beltRank(category.MinBelt)
		if athleteRank < requiredRank {
			errors = append(errors, ValidationError{
				Rule:    "belt_level",
				Message: fmt.Sprintf("VĐV đai '%s', nội dung yêu cầu tối thiểu đai '%s'", athlete.BeltLevel, category.MinBelt),
				Field:   "belt_level",
			})
		}
	}

	// Rule 8: Duplicate check
	pairKey := fmt.Sprintf("%s:%s", input.AthleteID, input.ContentID)
	if existing.AthleteContentPairs[pairKey] {
		errors = append(errors, ValidationError{
			Rule:    "duplicate",
			Message: fmt.Sprintf("VĐV %s đã đăng ký nội dung này", athlete.HoTen),
			Field:   "content_id",
		})
	}

	// Rule 9: Team quota
	quotaKey := fmt.Sprintf("%s:%s", input.TeamID, input.ContentID)
	currentCount := existing.TeamCategoryCounts[quotaKey]
	if category.MaxQuota > 0 && currentCount >= category.MaxQuota {
		errors = append(errors, ValidationError{
			Rule:    "quota",
			Message: fmt.Sprintf("Đoàn đã đăng ký %d/%d VĐV cho nội dung này", currentCount, category.MaxQuota),
			Field:   "team_id",
		})
	}

	return ValidationResult{
		Valid:  len(errors) == 0,
		Errors: errors,
	}
}

// ── Helpers ──────────────────────────────────────────────────

// calculateAge computes age from birthdate string "YYYY-MM-DD".
func calculateAge(birthDate string) int {
	dob, err := time.Parse("2006-01-02", birthDate)
	if err != nil {
		return -1
	}
	now := time.Now()
	age := now.Year() - dob.Year()
	if now.YearDay() < dob.YearDay() {
		age--
	}
	return age
}
