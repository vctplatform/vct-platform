package httpapi

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — STANDARD API ERROR RESPONSES
// Unified error handling for ALL HTTP handlers. Extends the
// pattern started in federation_errors.go and supersedes the
// ad-hoc helpers in helpers.go.
//
// Usage:
//   apiNotFound(w, "vận động viên", id)
//   apiValidation(w, "tên không được trống")
//   apiBadRequest(w, err)
//   apiInternal(w, err)
//   apiForbidden(w)
//   apiConflict(w, "email đã tồn tại")
// ═══════════════════════════════════════════════════════════════

import (
	"errors"
	"log/slog"
	"net/http"
	"strings"

	"vct-platform/backend/internal/apierror"
)

// APIError is the standard error envelope returned by all endpoints.
// It is a superset of the ErrorResponse in federation_errors.go.
type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details any    `json:"details,omitempty"`
}

// ── Error Code Constants ─────────────────────────────────────
// All codes are UPPER_SNAKE_CASE strings. They are safe to use
// in switch/case on the frontend.

const (
	CodeValidation   = "VALIDATION_ERROR"
	CodeNotFound     = "NOT_FOUND"
	CodeDuplicate    = "DUPLICATE"
	CodeUnauthorized = "UNAUTHORIZED"
	CodeForbidden    = "FORBIDDEN"
	CodeInternal     = "INTERNAL_ERROR"
	CodeBadRequest   = "BAD_REQUEST"
	CodeConflict     = "CONFLICT"
	CodeRateLimited  = "RATE_LIMITED"
)

// ── Convenience Writers ──────────────────────────────────────

// apiError writes a structured JSON error to the response.
func apiError(w http.ResponseWriter, status int, code, message string, details ...any) {
	resp := APIError{Code: code, Message: message}
	if len(details) > 0 && details[0] != nil {
		resp.Details = details[0]
	}
	success(w, status, resp) // reuse existing JSON writer
}

// apiNotFound writes a 404 with a descriptive message.
//
//	apiNotFound(w, "vận động viên", "VDV-001")
func apiNotFound(w http.ResponseWriter, entity, id string) {
	msg := entity + " không tìm thấy"
	if id != "" {
		msg += ": " + id
	}
	apiError(w, http.StatusNotFound, CodeNotFound, msg)
}

// apiValidation writes a 400 for input validation failures.
func apiValidation(w http.ResponseWriter, messages ...string) {
	msg := "Dữ liệu không hợp lệ"
	if len(messages) > 0 {
		msg = strings.Join(messages, "; ")
	}
	apiError(w, http.StatusBadRequest, CodeValidation, msg)
}

// apiValidationDetail writes a 400 with structured detail (e.g. field-level errors).
func apiValidationDetail(w http.ResponseWriter, message string, detail any) {
	apiError(w, http.StatusBadRequest, CodeValidation, message, detail)
}

// apiBadRequest writes a 400 for malformed requests.
func apiBadRequest(w http.ResponseWriter, err error) {
	var apiErr *apierror.Error
	if errors.As(err, &apiErr) {
		writeError(w, err)
		return
	}
	apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
}

// apiInternal writes a 500 and logs the error securely without exposing internals.
func apiInternal(w http.ResponseWriter, err error) {
	slog.Error("internal server error", "error", err)

	var apiErr *apierror.Error
	if errors.As(err, &apiErr) {
		// If it has a code but was called as internal, we still use the structured info
		// but consider if we should overwrite status to 500 if not already handled.
		// For now, writeError handles mapping.
		writeError(w, err)
		return
	}

	apiError(w, http.StatusInternalServerError, CodeInternal, "Lỗi hệ thống nội bộ, vui lòng thử lại sau")
}

// apiForbidden writes a 403.
func apiForbidden(w http.ResponseWriter) {
	apiError(w, http.StatusForbidden, CodeForbidden, "Bạn không có quyền thực hiện thao tác này")
}

// apiUnauthorized writes a 401.
func apiUnauthorized(w http.ResponseWriter, message string) {
	if message == "" {
		message = "Yêu cầu xác thực"
	}
	apiError(w, http.StatusUnauthorized, CodeUnauthorized, message)
}

// apiConflict writes a 409 for duplicates or state conflicts.
func apiConflict(w http.ResponseWriter, message string) {
	apiError(w, http.StatusConflict, CodeConflict, message)
}

// apiMethodNotAllowed writes a 405.
func apiMethodNotAllowed(w http.ResponseWriter) {
	apiError(w, http.StatusMethodNotAllowed, CodeBadRequest, "Method không được hỗ trợ")
}

// apiRateLimited writes a 429.
func apiRateLimited(w http.ResponseWriter) {
	apiError(w, http.StatusTooManyRequests, CodeRateLimited, "Quá nhiều yêu cầu, vui lòng thử lại sau")
}
