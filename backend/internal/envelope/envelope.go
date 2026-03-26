// Package envelope provides a standardized API response format with
// success/error envelopes, pagination metadata, and HTTP writer helpers.
package envelope

import (
	"encoding/json"
	"net/http"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// Response Envelope
// ═══════════════════════════════════════════════════════════════

// Response is the standard API response envelope.
type Response struct {
	Success   bool       `json:"success"`
	Data      any        `json:"data,omitempty"`
	Error     *ErrorInfo `json:"error,omitempty"`
	Meta      *Meta      `json:"meta,omitempty"`
	Timestamp string     `json:"timestamp"`
}

// ErrorInfo holds error details.
type ErrorInfo struct {
	Code    string            `json:"code"`
	Message string            `json:"message"`
	Details map[string]string `json:"details,omitempty"`
}

// Meta holds pagination and request metadata.
type Meta struct {
	Page       int    `json:"page,omitempty"`
	PerPage    int    `json:"per_page,omitempty"`
	Total      int    `json:"total,omitempty"`
	TotalPages int    `json:"total_pages,omitempty"`
	RequestID  string `json:"request_id,omitempty"`
}

// ═══════════════════════════════════════════════════════════════
// Builders
// ═══════════════════════════════════════════════════════════════

// OK creates a success envelope.
func OK(data any) *Response {
	return &Response{
		Success:   true,
		Data:      data,
		Timestamp: now(),
	}
}

// Created creates a 201 success envelope.
func Created(data any) *Response {
	return OK(data)
}

// Paginated creates a success envelope with pagination.
func Paginated(data any, page, perPage, total int) *Response {
	totalPages := total / perPage
	if total%perPage > 0 {
		totalPages++
	}
	return &Response{
		Success: true,
		Data:    data,
		Meta: &Meta{
			Page:       page,
			PerPage:    perPage,
			Total:      total,
			TotalPages: totalPages,
		},
		Timestamp: now(),
	}
}

// Err creates an error envelope.
func Err(code, message string) *Response {
	return &Response{
		Success: false,
		Error: &ErrorInfo{
			Code:    code,
			Message: message,
		},
		Timestamp: now(),
	}
}

// ErrWithDetails creates an error envelope with field details.
func ErrWithDetails(code, message string, details map[string]string) *Response {
	resp := Err(code, message)
	resp.Error.Details = details
	return resp
}

// WithMeta attaches metadata to the response.
func (r *Response) WithMeta(meta *Meta) *Response {
	r.Meta = meta
	return r
}

// WithRequestID attaches a request ID.
func (r *Response) WithRequestID(id string) *Response {
	if r.Meta == nil {
		r.Meta = &Meta{}
	}
	r.Meta.RequestID = id
	return r
}

// ═══════════════════════════════════════════════════════════════
// Common Errors
// ═══════════════════════════════════════════════════════════════

func NotFound(resource, id string) *Response {
	return Err("NOT_FOUND", resource+" "+id+" not found")
}

func BadRequest(message string) *Response {
	return Err("BAD_REQUEST", message)
}

func Unauthorized(message string) *Response {
	return Err("UNAUTHORIZED", message)
}

func Forbidden(message string) *Response {
	return Err("FORBIDDEN", message)
}

func InternalError(message string) *Response {
	return Err("INTERNAL_ERROR", message)
}

func Conflict(message string) *Response {
	return Err("CONFLICT", message)
}

func ValidationError(fields map[string]string) *Response {
	return ErrWithDetails("VALIDATION_ERROR", "Validation failed", fields)
}

// ═══════════════════════════════════════════════════════════════
// HTTP Writer
// ═══════════════════════════════════════════════════════════════

// Write sends the response as JSON with the given status code.
func Write(w http.ResponseWriter, status int, resp *Response) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(resp)
}

// WriteOK sends a 200 success response.
func WriteOK(w http.ResponseWriter, data any) {
	Write(w, http.StatusOK, OK(data))
}

// WriteCreated sends a 201 created response.
func WriteCreated(w http.ResponseWriter, data any) {
	Write(w, http.StatusCreated, Created(data))
}

// WriteErr maps error codes to HTTP status codes.
func WriteErr(w http.ResponseWriter, resp *Response) {
	status := http.StatusInternalServerError
	if resp.Error != nil {
		switch resp.Error.Code {
		case "NOT_FOUND":
			status = http.StatusNotFound
		case "BAD_REQUEST", "VALIDATION_ERROR":
			status = http.StatusBadRequest
		case "UNAUTHORIZED":
			status = http.StatusUnauthorized
		case "FORBIDDEN":
			status = http.StatusForbidden
		case "CONFLICT":
			status = http.StatusConflict
		}
	}
	Write(w, status, resp)
}

func now() string {
	return time.Now().UTC().Format(time.RFC3339)
}
