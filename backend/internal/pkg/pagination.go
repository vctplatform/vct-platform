package pkg

import (
	"net/http"
	"strconv"
)

// ── Pagination types ─────────────────────────────────────────

const (
	DefaultPageLimit = 50
	MaxPageLimit     = 200
)

// PageRequest captures pagination parameters from an API request.
type PageRequest struct {
	Limit  int    `json:"limit"`
	Offset int    `json:"offset"`
	Cursor string `json:"cursor,omitempty"`
}

// PageResponse wraps a paginated list of items.
type PageResponse[T any] struct {
	Items      []T    `json:"items"`
	Total      int    `json:"total"`
	Limit      int    `json:"limit"`
	Offset     int    `json:"offset"`
	NextCursor string `json:"nextCursor,omitempty"`
}

// ParsePagination extracts pagination parameters from an HTTP request.
func ParsePagination(r *http.Request) PageRequest {
	q := r.URL.Query()
	limit := parseIntParam(q.Get("limit"), DefaultPageLimit)
	offset := parseIntParam(q.Get("offset"), 0)
	cursor := q.Get("cursor")

	if limit <= 0 {
		limit = DefaultPageLimit
	}
	if limit > MaxPageLimit {
		limit = MaxPageLimit
	}
	if offset < 0 {
		offset = 0
	}

	return PageRequest{
		Limit:  limit,
		Offset: offset,
		Cursor: cursor,
	}
}

// Paginate applies offset/limit to a slice and returns a PageResponse.
func Paginate[T any](items []T, req PageRequest) PageResponse[T] {
	total := len(items)

	start := req.Offset
	if start > total {
		start = total
	}

	end := start + req.Limit
	if end > total {
		end = total
	}

	page := items[start:end]
	if page == nil {
		page = []T{}
	}

	resp := PageResponse[T]{
		Items:  page,
		Total:  total,
		Limit:  req.Limit,
		Offset: req.Offset,
	}

	if end < total {
		resp.NextCursor = strconv.Itoa(end)
	}

	return resp
}

func parseIntParam(s string, fallback int) int {
	if s == "" {
		return fallback
	}
	v, err := strconv.Atoi(s)
	if err != nil {
		return fallback
	}
	return v
}
