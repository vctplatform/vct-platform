package validation

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// ── Validator Tests ──────────────────────

func TestRequired(t *testing.T) {
	err := New().Required("name", "", "Tên là bắt buộc").Validate()
	if err == nil {
		t.Fatal("expected error for empty required field")
	}
	if err.Errors[0].Code != "required" {
		t.Errorf("expected code 'required', got %s", err.Errors[0].Code)
	}
}

func TestRequired_Valid(t *testing.T) {
	err := New().Required("name", "Nguyễn Văn A", "Tên là bắt buộc").Validate()
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}
}

func TestMinLen_Vietnamese(t *testing.T) {
	// Vietnamese name with diacritics — should count runes, not bytes
	err := New().MinLen("name", "Bá", 3, "Tên phải có ít nhất 3 ký tự").Validate()
	if err == nil {
		t.Fatal("expected error for short Vietnamese name")
	}
}

func TestMaxLen(t *testing.T) {
	err := New().MaxLen("bio", strings.Repeat("a", 501), 500, "Tối đa 500 ký tự").Validate()
	if err == nil {
		t.Fatal("expected error for long bio")
	}
}

func TestEmail_Valid(t *testing.T) {
	err := New().Email("email", "test@vct.com", "Email không hợp lệ").Validate()
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}
}

func TestEmail_Invalid(t *testing.T) {
	err := New().Email("email", "not-an-email", "Email không hợp lệ").Validate()
	if err == nil {
		t.Fatal("expected error for invalid email")
	}
}

func TestPhone_Vietnamese(t *testing.T) {
	cases := []struct {
		phone string
		valid bool
	}{
		{"+84912345678", true},
		{"0912345678", true},
		{"0312345678", true},
		{"0123456789", false}, // old format
		{"12345", false},
	}
	for _, tc := range cases {
		err := New().Phone("phone", tc.phone, "SĐT không hợp lệ").Validate()
		if tc.valid && err != nil {
			t.Errorf("expected %s to be valid, got error", tc.phone)
		}
		if !tc.valid && err == nil {
			t.Errorf("expected %s to be invalid", tc.phone)
		}
	}
}

func TestRange(t *testing.T) {
	err := New().Range("weight", 150, 40, 130, "Cân nặng phải từ 40-130kg").Validate()
	if err == nil {
		t.Fatal("expected range error")
	}
}

func TestOneOf(t *testing.T) {
	err := New().OneOf("belt", "invalid", []string{"nhất_đẳng", "nhị_đẳng", "tam_đẳng"}, "Đai không hợp lệ").Validate()
	if err == nil {
		t.Fatal("expected one_of error")
	}
}

func TestMultipleErrors(t *testing.T) {
	err := New().
		Required("name", "", "Tên là bắt buộc").
		Required("email", "", "Email là bắt buộc").
		Range("age", 5, 10, 60, "Tuổi từ 10-60").
		Validate()
	if err == nil {
		t.Fatal("expected errors")
	}
	if len(err.Errors) != 3 {
		t.Errorf("expected 3 errors, got %d", len(err.Errors))
	}
}

// ── Sanitizer Tests ──────────────────────

func TestSanitize_HTMLStrip(t *testing.T) {
	result := Sanitize(`Hello <script>alert('xss')</script>World`)
	if strings.Contains(result, "<script>") {
		t.Error("HTML tags should be stripped")
	}
	if !strings.Contains(result, "Hello") || !strings.Contains(result, "World") {
		t.Error("text content should be preserved")
	}
}

func TestSanitize_SQLEscape(t *testing.T) {
	result := Sanitize("O'Brien")
	if !strings.Contains(result, "''") {
		t.Error("single quotes should be escaped")
	}
}

func TestSanitize_Whitespace(t *testing.T) {
	result := Sanitize("  hello   world  ")
	if result != "hello world" {
		t.Errorf("expected 'hello world', got %q", result)
	}
}

func TestSanitizeMap(t *testing.T) {
	m := SanitizeMap(map[string]string{
		"name": "<b>Bold</b>",
		"bio":  "Hello    World",
	})
	if strings.Contains(m["name"], "<b>") {
		t.Error("HTML should be stripped from map values")
	}
}

// ── Middleware Tests ──────────────────────

func TestBodyLimiter_TooLarge(t *testing.T) {
	handler := BodyLimiter(10)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	}))

	body := strings.NewReader(strings.Repeat("x", 100))
	req := httptest.NewRequest("POST", "/api/v1/athletes", body)
	req.ContentLength = 100
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusRequestEntityTooLarge {
		t.Errorf("expected 413, got %d", rec.Code)
	}
}

func TestBodyLimiter_OK(t *testing.T) {
	handler := BodyLimiter(1000)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	}))

	req := httptest.NewRequest("POST", "/api/v1/athletes", strings.NewReader(`{"name":"test"}`))
	req.ContentLength = 15
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != 200 {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}

func TestContentTypeJSON_Missing(t *testing.T) {
	handler := ContentTypeJSON(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	}))

	req := httptest.NewRequest("POST", "/api/v1/athletes", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnsupportedMediaType {
		t.Errorf("expected 415, got %d", rec.Code)
	}
}

func TestContentTypeJSON_GET_NoCheck(t *testing.T) {
	handler := ContentTypeJSON(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	}))

	req := httptest.NewRequest("GET", "/api/v1/athletes", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != 200 {
		t.Errorf("GET should pass without Content-Type check, got %d", rec.Code)
	}
}
