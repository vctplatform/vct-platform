// Package validation provides request validation, input sanitization,
// and payload enforcement middleware for the VCT Platform API.
package validation

import (
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strings"
	"unicode/utf8"
)

// ═══════════════════════════════════════════════════════════════
// Struct Validator — Field-level validation with i18n messages
// ═══════════════════════════════════════════════════════════════

// FieldError describes a validation failure.
type FieldError struct {
	Field   string `json:"field"`
	Code    string `json:"code"`
	Message string `json:"message"`
}

// ValidationError holds all validation failures.
type ValidationError struct {
	Errors []FieldError `json:"errors"`
}

func (e *ValidationError) Error() string {
	msgs := make([]string, len(e.Errors))
	for i, fe := range e.Errors {
		msgs[i] = fmt.Sprintf("%s: %s", fe.Field, fe.Message)
	}
	return strings.Join(msgs, "; ")
}

// HasErrors returns true if there are validation errors.
func (e *ValidationError) HasErrors() bool {
	return len(e.Errors) > 0
}

// Validator validates struct fields.
type Validator struct {
	errors []FieldError
}

// New creates a validator.
func New() *Validator {
	return &Validator{}
}

// Required checks that a string is non-empty.
func (v *Validator) Required(field, value, message string) *Validator {
	if strings.TrimSpace(value) == "" {
		v.errors = append(v.errors, FieldError{Field: field, Code: "required", Message: message})
	}
	return v
}

// MinLen checks minimum string length (in runes for UTF-8 Vietnamese).
func (v *Validator) MinLen(field, value string, min int, message string) *Validator {
	if utf8.RuneCountInString(value) < min {
		v.errors = append(v.errors, FieldError{Field: field, Code: "min_length", Message: message})
	}
	return v
}

// MaxLen checks maximum string length.
func (v *Validator) MaxLen(field, value string, max int, message string) *Validator {
	if utf8.RuneCountInString(value) > max {
		v.errors = append(v.errors, FieldError{Field: field, Code: "max_length", Message: message})
	}
	return v
}

// Range checks an integer is within bounds.
func (v *Validator) Range(field string, value, min, max int, message string) *Validator {
	if value < min || value > max {
		v.errors = append(v.errors, FieldError{Field: field, Code: "range", Message: message})
	}
	return v
}

// Email checks email format.
func (v *Validator) Email(field, value, message string) *Validator {
	if value != "" && !emailRegex.MatchString(value) {
		v.errors = append(v.errors, FieldError{Field: field, Code: "email", Message: message})
	}
	return v
}

// Phone checks Vietnamese phone format.
func (v *Validator) Phone(field, value, message string) *Validator {
	if value != "" && !phoneRegex.MatchString(value) {
		v.errors = append(v.errors, FieldError{Field: field, Code: "phone", Message: message})
	}
	return v
}

// Pattern checks against a custom regex.
func (v *Validator) Pattern(field, value, pattern, message string) *Validator {
	if value != "" {
		if matched, _ := regexp.MatchString(pattern, value); !matched {
			v.errors = append(v.errors, FieldError{Field: field, Code: "pattern", Message: message})
		}
	}
	return v
}

// OneOf checks value is in allowed set.
func (v *Validator) OneOf(field, value string, allowed []string, message string) *Validator {
	if value == "" {
		return v
	}
	for _, a := range allowed {
		if value == a {
			return v
		}
	}
	v.errors = append(v.errors, FieldError{Field: field, Code: "one_of", Message: message})
	return v
}

// Validate returns errors or nil.
func (v *Validator) Validate() *ValidationError {
	if len(v.errors) == 0 {
		return nil
	}
	return &ValidationError{Errors: v.errors}
}

var (
	emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	phoneRegex = regexp.MustCompile(`^(\+84|0)(3|5|7|8|9)\d{8}$`)
)

// ═══════════════════════════════════════════════════════════════
// Input Sanitizer — XSS and injection prevention
// ═══════════════════════════════════════════════════════════════

// Sanitize cleans user input by removing dangerous characters.
func Sanitize(input string) string {
	s := strings.TrimSpace(input)
	s = stripTags(s)
	s = escapeSQL(s)
	s = normalizeWhitespace(s)
	return s
}

// SanitizeMap sanitizes all string values in a map.
func SanitizeMap(m map[string]string) map[string]string {
	result := make(map[string]string, len(m))
	for k, v := range m {
		result[k] = Sanitize(v)
	}
	return result
}

func stripTags(s string) string {
	return tagRegex.ReplaceAllString(s, "")
}

func escapeSQL(s string) string {
	replacer := strings.NewReplacer(
		"'", "''",
		"\\", "\\\\",
		"\x00", "",
	)
	return replacer.Replace(s)
}

func normalizeWhitespace(s string) string {
	return wsRegex.ReplaceAllString(s, " ")
}

var (
	tagRegex = regexp.MustCompile(`<[^>]*>`)
	wsRegex  = regexp.MustCompile(`\s+`)
)

// ═══════════════════════════════════════════════════════════════
// HTTP Middleware — Body size limit + content type enforcement
// ═══════════════════════════════════════════════════════════════

// BodyLimiter returns middleware that limits request body size.
func BodyLimiter(maxBytes int64) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.ContentLength > maxBytes {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusRequestEntityTooLarge)
				json.NewEncoder(w).Encode(map[string]string{
					"error": fmt.Sprintf("request body too large (max %d bytes)", maxBytes),
				})
				return
			}
			r.Body = http.MaxBytesReader(w, r.Body, maxBytes)
			next.ServeHTTP(w, r)
		})
	}
}

// ContentTypeJSON enforces application/json Content-Type on write methods.
func ContentTypeJSON(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "POST" || r.Method == "PUT" || r.Method == "PATCH" {
			ct := r.Header.Get("Content-Type")
			if !strings.HasPrefix(ct, "application/json") {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnsupportedMediaType)
				json.NewEncoder(w).Encode(map[string]string{
					"error": "Content-Type must be application/json",
				})
				return
			}
		}
		next.ServeHTTP(w, r)
	})
}
