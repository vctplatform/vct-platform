package federation

import (
	"fmt"
	"strings"
	"unicode/utf8"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — FEDERATION VALIDATION
// Input validation helpers for service-level data integrity.
// ═══════════════════════════════════════════════════════════════

// ValidationError wraps one or more field-level validation failures.
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

type ValidationErrors []ValidationError

func (ve ValidationErrors) Error() string {
	var msgs []string
	for _, e := range ve {
		msgs = append(msgs, fmt.Sprintf("%s: %s", e.Field, e.Message))
	}
	return strings.Join(msgs, "; ")
}

// ── Pagination ───────────────────────────────────────────────

// ListParams holds pagination + filter parameters for list queries.
type ListParams struct {
	Page   int    `json:"page"`
	Limit  int    `json:"limit"`
	Search string `json:"search,omitempty"`
	SortBy string `json:"sort_by,omitempty"`
}

// ListResult wraps a paginated result set.
type ListResult[T any] struct {
	Items      []T `json:"items"`
	Total      int `json:"total"`
	Page       int `json:"page"`
	Limit      int `json:"limit"`
	TotalPages int `json:"total_pages"`
}

func NewListParams(page, limit int) ListParams {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	return ListParams{Page: page, Limit: limit}
}

func Paginate[T any](items []T, params ListParams) ListResult[T] {
	total := len(items)
	start := (params.Page - 1) * params.Limit
	if start >= total {
		return ListResult[T]{Items: []T{}, Total: total, Page: params.Page, Limit: params.Limit, TotalPages: (total + params.Limit - 1) / params.Limit}
	}
	end := start + params.Limit
	if end > total {
		end = total
	}
	totalPages := (total + params.Limit - 1) / params.Limit
	return ListResult[T]{Items: items[start:end], Total: total, Page: params.Page, Limit: params.Limit, TotalPages: totalPages}
}

// ── Validation Helpers ───────────────────────────────────────

func required(field, value string) *ValidationError {
	if strings.TrimSpace(value) == "" {
		return &ValidationError{Field: field, Message: "bắt buộc nhập"}
	}
	return nil
}

func maxLength(field, value string, max int) *ValidationError {
	if utf8.RuneCountInString(value) > max {
		return &ValidationError{Field: field, Message: fmt.Sprintf("tối đa %d ký tự", max)}
	}
	return nil
}

func oneOf(field, value string, allowed []string) *ValidationError {
	for _, a := range allowed {
		if value == a {
			return nil
		}
	}
	return &ValidationError{Field: field, Message: fmt.Sprintf("phải là một trong %v", allowed)}
}

func positive(field string, value int) *ValidationError {
	if value < 0 {
		return &ValidationError{Field: field, Message: "phải >= 0"}
	}
	return nil
}

func collect(errs ...*ValidationError) ValidationErrors {
	var result ValidationErrors
	for _, e := range errs {
		if e != nil {
			result = append(result, *e)
		}
	}
	return result
}

// ── Province Validation ─────────────────────────────────────

var validRegions = []string{"north", "central", "south"}

func ValidateProvince(p Province) error {
	errs := collect(
		required("code", p.Code),
		required("name", p.Name),
		maxLength("code", p.Code, 10),
		maxLength("name", p.Name, 200),
	)
	if p.Region != "" {
		if e := oneOf("region", string(p.Region), validRegions); e != nil {
			errs = append(errs, *e)
		}
	}
	if len(errs) > 0 {
		return errs
	}
	return nil
}

// ── Unit Validation ─────────────────────────────────────────

var validUnitTypes = []string{"central", "province", "district", "committee"}
var validUnitStatuses = []string{"active", "inactive", "suspended"}

func ValidateUnit(u FederationUnit) error {
	errs := collect(
		required("name", u.Name),
		required("type", string(u.Type)),
		maxLength("name", u.Name, 255),
	)
	if u.Type != "" {
		if e := oneOf("type", string(u.Type), validUnitTypes); e != nil {
			errs = append(errs, *e)
		}
	}
	if u.Email != "" {
		if !strings.Contains(u.Email, "@") {
			errs = append(errs, ValidationError{Field: "email", Message: "email không hợp lệ"})
		}
	}
	if len(errs) > 0 {
		return errs
	}
	return nil
}

// ── Personnel Validation ────────────────────────────────────

func ValidatePersonnel(a PersonnelAssignment) error {
	errs := collect(
		required("user_id", a.UserID),
		required("unit_id", a.UnitID),
		required("position", a.Position),
		maxLength("position", a.Position, 100),
	)
	if len(errs) > 0 {
		return errs
	}
	return nil
}

// ── Master Belt Validation ──────────────────────────────────

func ValidateMasterBelt(b MasterBelt) error {
	errs := collect(
		required("name", b.Name),
	)
	if b.Level < 0 || b.Level > 99 {
		errs = append(errs, ValidationError{Field: "level", Message: "phải từ 0-99"})
	}
	if b.RequiredTimeMin < 0 {
		errs = append(errs, ValidationError{Field: "required_time_min", Message: "phải >= 0"})
	}
	if len(errs) > 0 {
		return errs
	}
	return nil
}

// ── Master Weight Validation ────────────────────────────────

var validGenders = []string{"MALE", "FEMALE"}

func ValidateMasterWeight(w MasterWeightClass) error {
	errs := collect(
		required("gender", w.Gender),
	)
	if w.Gender != "" {
		if e := oneOf("gender", w.Gender, validGenders); e != nil {
			errs = append(errs, *e)
		}
	}
	if w.MinWeight < 0 {
		errs = append(errs, ValidationError{Field: "min_weight", Message: "phải >= 0"})
	}
	if w.MaxWeight < 0 {
		errs = append(errs, ValidationError{Field: "max_weight", Message: "phải >= 0"})
	}
	if len(errs) > 0 {
		return errs
	}
	return nil
}

// ── Master Content Validation ───────────────────────────────

func ValidateMasterContent(c MasterCompetitionContent) error {
	errs := collect(
		required("code", string(c.Code)),
		required("name", c.Name),
		maxLength("name", c.Name, 255),
	)
	if e := positive("min_athletes", c.MinAthletes); e != nil {
		errs = append(errs, *e)
	}
	if e := positive("max_athletes", c.MaxAthletes); e != nil {
		errs = append(errs, *e)
	}
	if c.MinAthletes > 0 && c.MaxAthletes > 0 && c.MinAthletes > c.MaxAthletes {
		errs = append(errs, ValidationError{Field: "max_athletes", Message: "phải >= min_athletes"})
	}
	if len(errs) > 0 {
		return errs
	}
	return nil
}
