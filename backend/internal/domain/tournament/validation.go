package tournament

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Tournament Management Validation
// Business rule validation for categories, registrations, and results
// ═══════════════════════════════════════════════════════════════

import (
	"fmt"
	"strings"
)

// ValidationError represents a list of field-level validation errors.
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

func (e ValidationError) Error() string {
	return fmt.Sprintf("%s: %s", e.Field, e.Message)
}

// ValidationErrors collects multiple validation errors.
type ValidationErrors []ValidationError

func (ve ValidationErrors) Error() string {
	msgs := make([]string, len(ve))
	for i, e := range ve {
		msgs[i] = e.Error()
	}
	return strings.Join(msgs, "; ")
}

func (ve ValidationErrors) HasErrors() bool { return len(ve) > 0 }

// ── Category Validation ─────────────────────────────────────

var validContentTypes = map[string]bool{
	"doi_khang": true, "quyen": true, "quyen_dong_doi": true,
	"song_luyen": true, "nhieu_luyen": true, "binh_khi": true,
	"vu_khi_doi_luyen": true, "tu_ve": true,
}

var validGenders = map[string]bool{"nam": true, "nu": true}

var validCategoryStatuses = map[string]bool{"active": true, "closed": true, "cancelled": true}

// ValidateCategory checks business rules for a tournament category.
func ValidateCategory(c *Category) ValidationErrors {
	var errs ValidationErrors

	if c.TournamentID == "" {
		errs = append(errs, ValidationError{"tournament_id", "không được để trống"})
	}
	if c.ContentType == "" {
		errs = append(errs, ValidationError{"content_type", "không được để trống"})
	} else if !validContentTypes[c.ContentType] {
		errs = append(errs, ValidationError{"content_type", "loại nội dung không hợp lệ"})
	}
	if c.AgeGroup == "" {
		errs = append(errs, ValidationError{"age_group", "không được để trống"})
	}
	if c.Gender == "" {
		errs = append(errs, ValidationError{"gender", "không được để trống"})
	} else if !validGenders[c.Gender] {
		errs = append(errs, ValidationError{"gender", "giới tính không hợp lệ (nam/nu)"})
	}
	// Weight class required for doi_khang
	if c.ContentType == "doi_khang" && c.WeightClass == "" {
		errs = append(errs, ValidationError{"weight_class", "bắt buộc cho nội dung đối kháng"})
	}
	if c.MaxAthletes < 0 {
		errs = append(errs, ValidationError{"max_athletes", "không được âm"})
	}
	if c.MinAthletes < 0 {
		errs = append(errs, ValidationError{"min_athletes", "không được âm"})
	}
	if c.MaxAthletes > 0 && c.MinAthletes > c.MaxAthletes {
		errs = append(errs, ValidationError{"min_athletes", "không được lớn hơn max_athletes"})
	}
	if c.Status != "" && !validCategoryStatuses[c.Status] {
		errs = append(errs, ValidationError{"status", "trạng thái không hợp lệ"})
	}

	return errs
}

// ── Registration Validation ─────────────────────────────────

var validTeamTypes = map[string]bool{"doan_tinh": true, "clb": true, "ca_nhan": true}

var validRegistrationStatuses = map[string]bool{
	"nhap": true, "cho_duyet": true, "da_duyet": true,
	"tu_choi": true, "yeu_cau_bo_sung": true,
}

// ValidateRegistration checks business rules for a tournament registration.
func ValidateRegistration(r *Registration) ValidationErrors {
	var errs ValidationErrors

	if r.TournamentID == "" {
		errs = append(errs, ValidationError{"tournament_id", "không được để trống"})
	}
	if r.TeamName == "" {
		errs = append(errs, ValidationError{"team_name", "không được để trống"})
	}
	if r.TeamType == "" {
		errs = append(errs, ValidationError{"team_type", "không được để trống"})
	} else if !validTeamTypes[r.TeamType] {
		errs = append(errs, ValidationError{"team_type", "loại đoàn không hợp lệ"})
	}
	if r.HeadCoach == "" {
		errs = append(errs, ValidationError{"head_coach", "bắt buộc nhập HLV trưởng"})
	}
	if r.Status != "" && !validRegistrationStatuses[r.Status] {
		errs = append(errs, ValidationError{"status", "trạng thái không hợp lệ"})
	}

	return errs
}

// ValidateRegistrationAthlete checks an individual athlete entry.
func ValidateRegistrationAthlete(a *RegistrationAthlete) ValidationErrors {
	var errs ValidationErrors

	if a.RegistrationID == "" {
		errs = append(errs, ValidationError{"registration_id", "không được để trống"})
	}
	if a.AthleteName == "" {
		errs = append(errs, ValidationError{"athlete_name", "không được để trống"})
	}
	if a.Gender == "" {
		errs = append(errs, ValidationError{"gender", "không được để trống"})
	} else if !validGenders[a.Gender] {
		errs = append(errs, ValidationError{"gender", "giới tính không hợp lệ"})
	}
	if a.Weight < 0 {
		errs = append(errs, ValidationError{"weight", "cân nặng không được âm"})
	}
	if len(a.CategoryIDs) == 0 {
		errs = append(errs, ValidationError{"category_ids", "VĐV phải đăng ký ít nhất 1 nội dung"})
	}

	return errs
}

// ── Schedule Validation ─────────────────────────────────────

var validSessions = map[string]bool{"sang": true, "chieu": true, "toi": true, "ca_ngay": true}

var validSlotStatuses = map[string]bool{
	"du_kien": true, "xac_nhan": true, "dang_dien_ra": true,
	"hoan_thanh": true, "hoan": true,
}

// ValidateScheduleSlot checks a schedule slot entry.
func ValidateScheduleSlot(s *ScheduleSlot) ValidationErrors {
	var errs ValidationErrors

	if s.TournamentID == "" {
		errs = append(errs, ValidationError{"tournament_id", "không được để trống"})
	}
	if s.Date == "" {
		errs = append(errs, ValidationError{"date", "không được để trống"})
	}
	if s.Session == "" {
		errs = append(errs, ValidationError{"session", "không được để trống"})
	} else if !validSessions[s.Session] {
		errs = append(errs, ValidationError{"session", "phiên không hợp lệ (sang/chieu/toi)"})
	}
	if s.StartTime == "" {
		errs = append(errs, ValidationError{"start_time", "không được để trống"})
	}
	if s.EndTime == "" {
		errs = append(errs, ValidationError{"end_time", "không được để trống"})
	}
	if s.StartTime != "" && s.EndTime != "" && s.StartTime >= s.EndTime {
		errs = append(errs, ValidationError{"end_time", "giờ kết thúc phải sau giờ bắt đầu"})
	}
	if s.Status != "" && !validSlotStatuses[s.Status] {
		errs = append(errs, ValidationError{"status", "trạng thái không hợp lệ"})
	}

	return errs
}

// ── Result Validation ───────────────────────────────────────

// ValidateResult checks a tournament result entry.
func ValidateResult(r *TournamentResult) ValidationErrors {
	var errs ValidationErrors

	if r.TournamentID == "" {
		errs = append(errs, ValidationError{"tournament_id", "không được để trống"})
	}
	if r.CategoryID == "" {
		errs = append(errs, ValidationError{"category_id", "không được để trống"})
	}
	if r.GoldName == "" {
		errs = append(errs, ValidationError{"gold_name", "bắt buộc nhập HCV"})
	}
	if r.SilverName == "" {
		errs = append(errs, ValidationError{"silver_name", "bắt buộc nhập HCB"})
	}
	// Bronze can be empty for some content types

	return errs
}
