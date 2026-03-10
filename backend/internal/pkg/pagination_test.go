package pkg

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestParsePagination_Defaults(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/v1/athletes", nil)
	page := ParsePagination(req)

	if page.Limit != DefaultPageLimit {
		t.Errorf("expected default limit %d, got %d", DefaultPageLimit, page.Limit)
	}
	if page.Offset != 0 {
		t.Errorf("expected default offset 0, got %d", page.Offset)
	}
}

func TestParsePagination_CustomValues(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/v1/athletes?limit=25&offset=10", nil)
	page := ParsePagination(req)

	if page.Limit != 25 {
		t.Errorf("expected limit 25, got %d", page.Limit)
	}
	if page.Offset != 10 {
		t.Errorf("expected offset 10, got %d", page.Offset)
	}
}

func TestParsePagination_MaxLimit(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/v1/athletes?limit=999", nil)
	page := ParsePagination(req)

	if page.Limit != MaxPageLimit {
		t.Errorf("expected max limit %d, got %d", MaxPageLimit, page.Limit)
	}
}

func TestParsePagination_NegativeOffset(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/v1/athletes?offset=-5", nil)
	page := ParsePagination(req)

	if page.Offset != 0 {
		t.Errorf("expected offset 0 for negative input, got %d", page.Offset)
	}
}

func TestParsePagination_InvalidValues(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/v1/athletes?limit=abc&offset=xyz", nil)
	page := ParsePagination(req)

	if page.Limit != DefaultPageLimit {
		t.Errorf("expected default limit for invalid input, got %d", page.Limit)
	}
	if page.Offset != 0 {
		t.Errorf("expected default offset for invalid input, got %d", page.Offset)
	}
}

func TestPaginate_BasicSlice(t *testing.T) {
	items := []string{"a", "b", "c", "d", "e", "f", "g", "h", "i", "j"}
	req := PageRequest{Limit: 3, Offset: 0}
	resp := Paginate(items, req)

	if len(resp.Items) != 3 {
		t.Fatalf("expected 3 items, got %d", len(resp.Items))
	}
	if resp.Total != 10 {
		t.Errorf("expected total 10, got %d", resp.Total)
	}
	if resp.NextCursor != "3" {
		t.Errorf("expected next cursor '3', got '%s'", resp.NextCursor)
	}
}

func TestPaginate_LastPage(t *testing.T) {
	items := []string{"a", "b", "c", "d", "e"}
	req := PageRequest{Limit: 3, Offset: 3}
	resp := Paginate(items, req)

	if len(resp.Items) != 2 {
		t.Fatalf("expected 2 items on last page, got %d", len(resp.Items))
	}
	if resp.NextCursor != "" {
		t.Errorf("expected empty next cursor on last page, got '%s'", resp.NextCursor)
	}
}

func TestPaginate_OffsetBeyondTotal(t *testing.T) {
	items := []string{"a", "b"}
	req := PageRequest{Limit: 10, Offset: 100}
	resp := Paginate(items, req)

	if len(resp.Items) != 0 {
		t.Errorf("expected 0 items when offset > total, got %d", len(resp.Items))
	}
}

func TestPaginate_EmptySlice(t *testing.T) {
	var items []string
	req := PageRequest{Limit: 10, Offset: 0}
	resp := Paginate(items, req)

	if resp.Items == nil {
		t.Error("expected non-nil empty slice, got nil")
	}
	if len(resp.Items) != 0 {
		t.Errorf("expected 0 items, got %d", len(resp.Items))
	}
	if resp.Total != 0 {
		t.Errorf("expected total 0, got %d", resp.Total)
	}
}
