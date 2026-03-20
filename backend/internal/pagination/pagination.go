// Package pagination provides standardized offset/cursor pagination,
// filtering, sorting, and paginated response envelopes.
package pagination

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
)

// ═══════════════════════════════════════════════════════════════
// Page Request — Parsed from query params
// ═══════════════════════════════════════════════════════════════

// PageRequest holds pagination parameters.
type PageRequest struct {
	Page    int    `json:"page"`
	PerPage int    `json:"per_page"`
	Cursor  string `json:"cursor,omitempty"`
	Sort    string `json:"sort,omitempty"`    // e.g. "name,-created_at"
	Filter  string `json:"filter,omitempty"`  // raw filter string
}

const (
	DefaultPage    = 1
	DefaultPerPage = 20
	MaxPerPage     = 100
)

// FromRequest parses pagination from HTTP query params.
func FromRequest(r *http.Request) PageRequest {
	q := r.URL.Query()

	page, _ := strconv.Atoi(q.Get("page"))
	if page < 1 {
		page = DefaultPage
	}

	perPage, _ := strconv.Atoi(q.Get("per_page"))
	if perPage < 1 {
		perPage = DefaultPerPage
	}
	if perPage > MaxPerPage {
		perPage = MaxPerPage
	}

	return PageRequest{
		Page:    page,
		PerPage: perPage,
		Cursor:  q.Get("cursor"),
		Sort:    q.Get("sort"),
		Filter:  q.Get("filter"),
	}
}

// Offset returns the SQL OFFSET value.
func (p PageRequest) Offset() int {
	return (p.Page - 1) * p.PerPage
}

// Limit returns the SQL LIMIT value.
func (p PageRequest) Limit() int {
	return p.PerPage
}

// ═══════════════════════════════════════════════════════════════
// Page Response — Envelope with metadata
// ═══════════════════════════════════════════════════════════════

// PageResponse wraps paginated data with metadata.
type PageResponse[T any] struct {
	Data       []T        `json:"data"`
	Pagination PaginationMeta `json:"pagination"`
}

// PaginationMeta contains pagination info for clients.
type PaginationMeta struct {
	Page       int    `json:"page"`
	PerPage    int    `json:"per_page"`
	Total      int    `json:"total"`
	TotalPages int    `json:"total_pages"`
	HasNext    bool   `json:"has_next"`
	HasPrev    bool   `json:"has_prev"`
	NextCursor string `json:"next_cursor,omitempty"`
}

// NewPageResponse creates a paginated response.
func NewPageResponse[T any](data []T, req PageRequest, total int) PageResponse[T] {
	totalPages := total / req.PerPage
	if total%req.PerPage > 0 {
		totalPages++
	}

	return PageResponse[T]{
		Data: data,
		Pagination: PaginationMeta{
			Page:       req.Page,
			PerPage:    req.PerPage,
			Total:      total,
			TotalPages: totalPages,
			HasNext:    req.Page < totalPages,
			HasPrev:    req.Page > 1,
		},
	}
}

// ═══════════════════════════════════════════════════════════════
// Cursor — Opaque cursor for keyset pagination
// ═══════════════════════════════════════════════════════════════

// CursorData holds the cursor state.
type CursorData struct {
	ID        string `json:"id"`
	SortValue string `json:"sv,omitempty"`
}

// EncodeCursor creates an opaque base64 cursor.
func EncodeCursor(data CursorData) string {
	b, _ := json.Marshal(data)
	return base64.URLEncoding.EncodeToString(b)
}

// DecodeCursor parses an opaque cursor.
func DecodeCursor(cursor string) (CursorData, error) {
	b, err := base64.URLEncoding.DecodeString(cursor)
	if err != nil {
		return CursorData{}, fmt.Errorf("invalid cursor: %w", err)
	}
	var data CursorData
	if err := json.Unmarshal(b, &data); err != nil {
		return CursorData{}, fmt.Errorf("corrupt cursor: %w", err)
	}
	return data, nil
}

// ═══════════════════════════════════════════════════════════════
// Sort Parser — Safe sort clause builder
// ═══════════════════════════════════════════════════════════════

// SortField represents a parsed sort directive.
type SortField struct {
	Column string
	Desc   bool
}

// ParseSort parses "name,-created_at" into sort fields.
// Only allows columns in the allowedColumns set.
func ParseSort(sort string, allowedColumns map[string]string) []SortField {
	if sort == "" {
		return nil
	}

	var fields []SortField
	for _, part := range strings.Split(sort, ",") {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}

		desc := false
		col := part
		if strings.HasPrefix(part, "-") {
			desc = true
			col = part[1:]
		}

		// Map to actual DB column name (prevents SQL injection)
		dbCol, ok := allowedColumns[col]
		if !ok {
			continue // skip unknown columns
		}

		fields = append(fields, SortField{Column: dbCol, Desc: desc})
	}
	return fields
}

// ToSQL converts sort fields to an ORDER BY clause.
func ToSQL(fields []SortField) string {
	if len(fields) == 0 {
		return ""
	}
	parts := make([]string, len(fields))
	for i, f := range fields {
		if f.Desc {
			parts[i] = f.Column + " DESC"
		} else {
			parts[i] = f.Column + " ASC"
		}
	}
	return "ORDER BY " + strings.Join(parts, ", ")
}

// ═══════════════════════════════════════════════════════════════
// Filter Builder — Safe WHERE clause construction
// ═══════════════════════════════════════════════════════════════

// Filter represents a query filter.
type Filter struct {
	Field    string
	Operator string // eq, neq, gt, gte, lt, lte, like, in
	Value    string
}

// ParseFilters parses "status:eq:active,weight:gte:60" into filters.
// Only allows fields in the allowedFields set.
func ParseFilters(raw string, allowedFields map[string]string) []Filter {
	if raw == "" {
		return nil
	}

	var filters []Filter
	for _, part := range strings.Split(raw, ",") {
		segments := strings.SplitN(part, ":", 3)
		if len(segments) != 3 {
			continue
		}

		field, op, value := segments[0], segments[1], segments[2]

		// Map to DB column
		dbCol, ok := allowedFields[field]
		if !ok {
			continue
		}

		// Validate operator
		switch op {
		case "eq", "neq", "gt", "gte", "lt", "lte", "like", "in":
		default:
			continue
		}

		filters = append(filters, Filter{Field: dbCol, Operator: op, Value: value})
	}
	return filters
}

// ToWhereSQL converts filters to WHERE clauses with numbered params ($1, $2...).
func ToWhereSQL(filters []Filter, startParam int) (string, []interface{}) {
	if len(filters) == 0 {
		return "", nil
	}

	clauses := make([]string, 0, len(filters))
	params := make([]interface{}, 0, len(filters))

	for _, f := range filters {
		paramIdx := startParam + len(params)
		var clause string

		switch f.Operator {
		case "eq":
			clause = fmt.Sprintf("%s = $%d", f.Field, paramIdx)
		case "neq":
			clause = fmt.Sprintf("%s != $%d", f.Field, paramIdx)
		case "gt":
			clause = fmt.Sprintf("%s > $%d", f.Field, paramIdx)
		case "gte":
			clause = fmt.Sprintf("%s >= $%d", f.Field, paramIdx)
		case "lt":
			clause = fmt.Sprintf("%s < $%d", f.Field, paramIdx)
		case "lte":
			clause = fmt.Sprintf("%s <= $%d", f.Field, paramIdx)
		case "like":
			clause = fmt.Sprintf("%s ILIKE $%d", f.Field, paramIdx)
			f.Value = "%" + f.Value + "%"
		case "in":
			clause = fmt.Sprintf("%s = ANY($%d)", f.Field, paramIdx)
		default:
			continue
		}

		clauses = append(clauses, clause)
		params = append(params, f.Value)
	}

	return strings.Join(clauses, " AND "), params
}
