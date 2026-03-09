package response

// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — STANDARD API RESPONSE
// ════════════════════════════════════════════════════════════════

import (
	"encoding/json"
	"net/http"
)

// Response represents a standard API response
type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   *ErrorBody  `json:"error,omitempty"`
	Meta    *Meta       `json:"meta,omitempty"`
}

// ErrorBody represents an error response body
type ErrorBody struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
}

// Meta holds pagination metadata
type Meta struct {
	Page       int `json:"page"`
	PageSize   int `json:"page_size"`
	Total      int `json:"total"`
	TotalPages int `json:"total_pages"`
}

// JSON writes a JSON response with the given status code
func JSON(w http.ResponseWriter, status int, resp Response) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(resp)
}

// OK writes a successful response
func OK(w http.ResponseWriter, data interface{}) {
	JSON(w, http.StatusOK, Response{Success: true, Data: data})
}

// Created writes a 201 response
func Created(w http.ResponseWriter, data interface{}) {
	JSON(w, http.StatusCreated, Response{Success: true, Data: data})
}

// Error writes an error response
func Error(w http.ResponseWriter, status int, code, message string) {
	JSON(w, status, Response{
		Success: false,
		Error:   &ErrorBody{Code: code, Message: message},
	})
}

// Paginated writes a paginated response
func Paginated(w http.ResponseWriter, data interface{}, page, pageSize, total int) {
	totalPages := (total + pageSize - 1) / pageSize
	JSON(w, http.StatusOK, Response{
		Success: true,
		Data:    data,
		Meta:    &Meta{Page: page, PageSize: pageSize, Total: total, TotalPages: totalPages},
	})
}
