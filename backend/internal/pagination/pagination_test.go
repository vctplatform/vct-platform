package pagination

import (
	"net/http/httptest"
	"strings"
	"testing"
)

// ── PageRequest Tests ────────────────────

func TestFromRequest_Defaults(t *testing.T) {
	req := httptest.NewRequest("GET", "/api/v1/athletes", nil)
	pr := FromRequest(req)

	if pr.Page != 1 {
		t.Errorf("expected page 1, got %d", pr.Page)
	}
	if pr.PerPage != 20 {
		t.Errorf("expected per_page 20, got %d", pr.PerPage)
	}
}

func TestFromRequest_Custom(t *testing.T) {
	req := httptest.NewRequest("GET", "/api?page=3&per_page=50&sort=-name&filter=status:eq:active", nil)
	pr := FromRequest(req)

	if pr.Page != 3 || pr.PerPage != 50 {
		t.Errorf("expected page=3, per_page=50, got %d, %d", pr.Page, pr.PerPage)
	}
	if pr.Sort != "-name" {
		t.Errorf("expected sort '-name', got %q", pr.Sort)
	}
}

func TestFromRequest_MaxPerPage(t *testing.T) {
	req := httptest.NewRequest("GET", "/api?per_page=500", nil)
	pr := FromRequest(req)

	if pr.PerPage != MaxPerPage {
		t.Errorf("expected max %d, got %d", MaxPerPage, pr.PerPage)
	}
}

func TestOffset(t *testing.T) {
	pr := PageRequest{Page: 3, PerPage: 20}
	if pr.Offset() != 40 {
		t.Errorf("expected offset 40, got %d", pr.Offset())
	}
}

// ── PageResponse Tests ───────────────────

func TestNewPageResponse(t *testing.T) {
	data := []string{"a", "b", "c"}
	req := PageRequest{Page: 1, PerPage: 10}
	resp := NewPageResponse(data, req, 25)

	if resp.Pagination.TotalPages != 3 {
		t.Errorf("expected 3 pages, got %d", resp.Pagination.TotalPages)
	}
	if !resp.Pagination.HasNext {
		t.Error("expected HasNext=true")
	}
	if resp.Pagination.HasPrev {
		t.Error("expected HasPrev=false for page 1")
	}
}

func TestNewPageResponse_LastPage(t *testing.T) {
	req := PageRequest{Page: 3, PerPage: 10}
	resp := NewPageResponse([]string{}, req, 25)

	if resp.Pagination.HasNext {
		t.Error("expected HasNext=false on last page")
	}
	if !resp.Pagination.HasPrev {
		t.Error("expected HasPrev=true")
	}
}

// ── Cursor Tests ─────────────────────────

func TestCursor_EncodeDecode(t *testing.T) {
	data := CursorData{ID: "abc-123", SortValue: "2026-01-01"}
	encoded := EncodeCursor(data)

	decoded, err := DecodeCursor(encoded)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if decoded.ID != "abc-123" || decoded.SortValue != "2026-01-01" {
		t.Errorf("decoded mismatch: %+v", decoded)
	}
}

func TestCursor_Invalid(t *testing.T) {
	_, err := DecodeCursor("not-valid-base64!!!")
	if err == nil {
		t.Error("expected error for invalid cursor")
	}
}

// ── Sort Tests ───────────────────────────

func TestParseSort(t *testing.T) {
	allowed := map[string]string{
		"name":       "full_name",
		"created_at": "created_at",
		"weight":     "weight_kg",
	}

	fields := ParseSort("name,-created_at", allowed)
	if len(fields) != 2 {
		t.Fatalf("expected 2 fields, got %d", len(fields))
	}
	if fields[0].Column != "full_name" || fields[0].Desc {
		t.Error("first field should be full_name ASC")
	}
	if fields[1].Column != "created_at" || !fields[1].Desc {
		t.Error("second field should be created_at DESC")
	}
}

func TestParseSort_IgnoresUnknown(t *testing.T) {
	allowed := map[string]string{"name": "full_name"}
	fields := ParseSort("name,-hacked_column", allowed)
	if len(fields) != 1 {
		t.Errorf("should skip unknown columns, got %d fields", len(fields))
	}
}

func TestToSQL(t *testing.T) {
	fields := []SortField{
		{Column: "full_name", Desc: false},
		{Column: "created_at", Desc: true},
	}
	sql := ToSQL(fields)
	if sql != "ORDER BY full_name ASC, created_at DESC" {
		t.Errorf("unexpected SQL: %s", sql)
	}
}

// ── Filter Tests ─────────────────────────

func TestParseFilters(t *testing.T) {
	allowed := map[string]string{
		"status": "status",
		"weight": "weight_kg",
		"name":   "full_name",
	}

	filters := ParseFilters("status:eq:active,weight:gte:60", allowed)
	if len(filters) != 2 {
		t.Fatalf("expected 2 filters, got %d", len(filters))
	}
	if filters[0].Field != "status" || filters[0].Operator != "eq" {
		t.Error("first filter should be status eq")
	}
}

func TestParseFilters_IgnoresInvalid(t *testing.T) {
	allowed := map[string]string{"status": "status"}
	filters := ParseFilters("status:eq:active,hacked:drop:table", allowed)
	if len(filters) != 1 {
		t.Errorf("should skip invalid, got %d", len(filters))
	}
}

func TestToWhereSQL(t *testing.T) {
	filters := []Filter{
		{Field: "status", Operator: "eq", Value: "active"},
		{Field: "weight_kg", Operator: "gte", Value: "60"},
	}

	where, params := ToWhereSQL(filters, 1)
	if !strings.Contains(where, "status = $1") {
		t.Errorf("unexpected where: %s", where)
	}
	if len(params) != 2 {
		t.Errorf("expected 2 params, got %d", len(params))
	}
}

func TestToWhereSQL_Like(t *testing.T) {
	filters := []Filter{
		{Field: "full_name", Operator: "like", Value: "Nguyễn"},
	}
	where, params := ToWhereSQL(filters, 1)
	if !strings.Contains(where, "ILIKE") {
		t.Error("like should use ILIKE")
	}
	if params[0] != "%Nguyễn%" {
		t.Errorf("expected %% wrapped value, got %v", params[0])
	}
}
