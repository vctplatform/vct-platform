package httpapi

import (
	"net/http"
	"strconv"

	"vct-platform/backend/internal/domain/federation"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — FEDERATION ERROR RESPONSE HELPERS
// Standardized error codes and structured error responses.
// ═══════════════════════════════════════════════════════════════

// ErrorResponse is the standard API error envelope.
type ErrorResponse struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
}

// ── Error Code Constants ─────────────────────────────────────

const (
	ErrCodeValidation   = "VALIDATION_ERROR"
	ErrCodeNotFound     = "NOT_FOUND"
	ErrCodeDuplicate    = "DUPLICATE"
	ErrCodeUnauthorized = "UNAUTHORIZED"
	ErrCodeForbidden    = "FORBIDDEN"
	ErrCodeInternal     = "INTERNAL_ERROR"
	ErrCodeBadRequest   = "BAD_REQUEST"
)

// ── Structured Error Helpers ─────────────────────────────────

func federationValidationError(w http.ResponseWriter, err error) {
	if valErrs, ok := err.(federation.ValidationErrors); ok {
		success(w, http.StatusBadRequest, ErrorResponse{
			Code:    ErrCodeValidation,
			Message: "Dữ liệu không hợp lệ",
			Details: valErrs,
		})
		return
	}
	badRequest(w, err.Error())
}

func federationNotFound(w http.ResponseWriter, entity, id string) {
	success(w, http.StatusNotFound, ErrorResponse{
		Code:    ErrCodeNotFound,
		Message: entity + " không tìm thấy: " + id,
	})
}

func federationDuplicate(w http.ResponseWriter, message string) {
	success(w, http.StatusConflict, ErrorResponse{
		Code:    ErrCodeDuplicate,
		Message: message,
	})
}

// ── Pagination Helpers ───────────────────────────────────────

func parsePagination(r *http.Request) federation.ListParams {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	params := federation.NewListParams(page, limit)
	params.Search = r.URL.Query().Get("search")
	params.SortBy = r.URL.Query().Get("sort_by")
	return params
}
