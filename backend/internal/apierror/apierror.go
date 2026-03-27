// Package apierror provides typed, structured errors for the VCT Platform.
// All errors follow GR-12, containing a machine-readable Code and a
// human-readable Vietnamese Message.
package apierror

import (
	"errors"
	"fmt"
)

// Error represents a structured, machine-readable error.
type Error struct {
	Code    string // Unique identifier (e.g., AUTH_001)
	Message string // Human-readable Vietnamese message
	Err     error  // Wrapped internal error (not exposed to client)
}

func (e *Error) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %s (%v)", e.Code, e.Message, e.Err)
	}
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

func (e *Error) Unwrap() error {
	return e.Err
}

// Is implements error comparison based on the Code.
// This allows errors.Is(err, apierror.ErrNotFound) to work even if wrapped.
func (e *Error) Is(target error) bool {
	t, ok := target.(*Error)
	if !ok {
		return false
	}
	return e.Code == t.Code
}

// ── Helpers ──────────────────────────────────────────────────

// New creates a new structured error.
func New(code, message string) *Error {
	return &Error{Code: code, Message: message}
}

// Newf creates a formatted structured error.
func Newf(code, format string, args ...any) *Error {
	return &Error{Code: code, Message: fmt.Sprintf(format, args...)}
}

// Wrap wraps an existing error with a code and context.
func Wrap(err error, code, message string) *Error {
	return &Error{Code: code, Message: message, Err: err}
}

// ═══════════════════════════════════════════════════════════════
// Sentinel Errors — Data Store (Codes prefix: STORE_)
// ═══════════════════════════════════════════════════════════════

var ErrNotFound = New("STORE_404", "không tìm thấy dữ liệu")
var ErrEntityNotFound = New("STORE_404_ENTITY", "không tìm thấy loại thực thể")
var ErrMissingID = New("STORE_400_MISSING_ID", "thiếu mã định danh (id)")
var ErrInvalidID = New("STORE_400_INVALID_ID", "mã định danh không hợp lệ")
var ErrDuplicateID = New("STORE_409_DUPLICATE", "mã định danh đã tồn tại")

// ═══════════════════════════════════════════════════════════════
// Sentinel Errors — Auth (Codes prefix: AUTH_)
// ═══════════════════════════════════════════════════════════════

var ErrUnauthorized = New("AUTH_401", "yêu cầu xác thực")
var ErrForbidden = New("AUTH_403", "không có quyền truy cập")
var ErrTokenExpired = New("AUTH_401_EXPIRED", "phiên đăng nhập đã hết hạn")
var ErrTokenInvalid = New("AUTH_401_INVALID", "phiên đăng nhập không hợp lệ")

// ═══════════════════════════════════════════════════════════════
// Sentinel Errors — Validation (Codes prefix: VAL_)
// ═══════════════════════════════════════════════════════════════

var ErrValidation = New("VAL_400", "dữ liệu không hợp lệ")
var ErrInvalidInput = New("VAL_400_INPUT", "dữ liệu đầu vào không đúng định dạng")

// ═══════════════════════════════════════════════════════════════
// Sentinel Errors — Business Logic (Codes prefix: BIZ_)
// ═══════════════════════════════════════════════════════════════

var ErrConflict = New("BIZ_409", "xung đột dữ liệu")
var ErrStateTransition = New("BIZ_400_STATE", "trạng thái chuyển đổi không hợp lệ")
var ErrQuotaExceeded = New("BIZ_429_QUOTA", "vượt quá hạn mức cho phép")

// Is checks whether err matches target using errors.Is.
func Is(err, target error) bool {
	return errors.Is(err, target)
}
