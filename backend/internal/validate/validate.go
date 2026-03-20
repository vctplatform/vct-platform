package validate

import (
	"encoding/json"
	"fmt"
	"net/http"
	"reflect"
	"regexp"
	"strings"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — INPUT VALIDATION MIDDLEWARE
// Struct tag validation with standardized error responses.
// Tags: required, min, max, len, email, uuid, phone, url,
//       oneof, pattern
// ═══════════════════════════════════════════════════════════════

// MaxBodySize is the maximum allowed request body (1 MB).
const MaxBodySize = 1 << 20

// FieldError represents a single field validation error.
type FieldError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
	Tag     string `json:"tag"`
}

// ValidationError is returned when input validation fails.
type ValidationError struct {
	Code    string       `json:"code"`
	Message string       `json:"message"`
	Errors  []FieldError `json:"errors"`
}

func (e *ValidationError) Error() string {
	return e.Message
}

var (
	emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	uuidRegex  = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`)
	phoneRegex = regexp.MustCompile(`^(\+84|0)(3|5|7|8|9)[0-9]{8}$`)
	urlRegex   = regexp.MustCompile(`^https?://[^\s/$.?#].[^\s]*$`)
)

// Struct validates a struct based on `validate` tags.
// Supported tags: required, min=N, max=N, len=N, email, uuid, phone, url, oneof=a|b|c, pattern=REGEX
func Struct(s interface{}) *ValidationError {
	return structValidate(s, "")
}

func structValidate(s interface{}, prefix string) *ValidationError {
	v := reflect.ValueOf(s)
	if v.Kind() == reflect.Ptr {
		v = v.Elem()
	}
	if v.Kind() != reflect.Struct {
		return nil
	}

	t := v.Type()
	var errors []FieldError

	for i := 0; i < t.NumField(); i++ {
		field := t.Field(i)
		value := v.Field(i)

		// Recurse into nested structs
		if value.Kind() == reflect.Struct && field.Tag.Get("validate") == "" {
			if nested := structValidate(value.Interface(), prefix+fieldName(field)+"."); nested != nil {
				errors = append(errors, nested.Errors...)
			}
			continue
		}

		tag := field.Tag.Get("validate")
		if tag == "" || tag == "-" {
			continue
		}

		jsonName := prefix + fieldName(field)

		rules := strings.Split(tag, ",")
		for _, rule := range rules {
			rule = strings.TrimSpace(rule)
			if err := validateRule(jsonName, value, rule); err != nil {
				errors = append(errors, *err)
			}
		}
	}

	if len(errors) > 0 {
		return &ValidationError{
			Code:    "VALIDATION_ERROR",
			Message: fmt.Sprintf("Dữ liệu không hợp lệ: %d lỗi", len(errors)),
			Errors:  errors,
		}
	}
	return nil
}

func fieldName(field reflect.StructField) string {
	jsonName := field.Tag.Get("json")
	if jsonName == "" || jsonName == "-" {
		return strings.ToLower(field.Name)
	}
	return strings.Split(jsonName, ",")[0]
}

func validateRule(field string, value reflect.Value, rule string) *FieldError {
	switch {
	case rule == "required":
		if isZero(value) {
			return &FieldError{Field: field, Message: fmt.Sprintf("%s là bắt buộc", field), Tag: "required"}
		}

	case strings.HasPrefix(rule, "min="):
		minStr := strings.TrimPrefix(rule, "min=")
		var minVal int
		fmt.Sscanf(minStr, "%d", &minVal)
		switch value.Kind() {
		case reflect.String:
			if len(value.String()) < minVal {
				return &FieldError{Field: field, Message: fmt.Sprintf("%s phải có ít nhất %d ký tự", field, minVal), Tag: "min"}
			}
		case reflect.Int, reflect.Int64:
			if value.Int() < int64(minVal) {
				return &FieldError{Field: field, Message: fmt.Sprintf("%s phải lớn hơn hoặc bằng %d", field, minVal), Tag: "min"}
			}
		case reflect.Float64, reflect.Float32:
			if value.Float() < float64(minVal) {
				return &FieldError{Field: field, Message: fmt.Sprintf("%s phải lớn hơn hoặc bằng %d", field, minVal), Tag: "min"}
			}
		case reflect.Slice, reflect.Array:
			if value.Len() < minVal {
				return &FieldError{Field: field, Message: fmt.Sprintf("%s cần ít nhất %d phần tử", field, minVal), Tag: "min"}
			}
		}

	case strings.HasPrefix(rule, "max="):
		maxStr := strings.TrimPrefix(rule, "max=")
		var maxVal int
		fmt.Sscanf(maxStr, "%d", &maxVal)
		switch value.Kind() {
		case reflect.String:
			if len(value.String()) > maxVal {
				return &FieldError{Field: field, Message: fmt.Sprintf("%s không được quá %d ký tự", field, maxVal), Tag: "max"}
			}
		case reflect.Int, reflect.Int64:
			if value.Int() > int64(maxVal) {
				return &FieldError{Field: field, Message: fmt.Sprintf("%s phải nhỏ hơn hoặc bằng %d", field, maxVal), Tag: "max"}
			}
		case reflect.Float64, reflect.Float32:
			if value.Float() > float64(maxVal) {
				return &FieldError{Field: field, Message: fmt.Sprintf("%s phải nhỏ hơn hoặc bằng %d", field, maxVal), Tag: "max"}
			}
		case reflect.Slice, reflect.Array:
			if value.Len() > maxVal {
				return &FieldError{Field: field, Message: fmt.Sprintf("%s không được quá %d phần tử", field, maxVal), Tag: "max"}
			}
		}

	case strings.HasPrefix(rule, "len="):
		lenStr := strings.TrimPrefix(rule, "len=")
		var lenVal int
		fmt.Sscanf(lenStr, "%d", &lenVal)
		switch value.Kind() {
		case reflect.String:
			if len(value.String()) != lenVal {
				return &FieldError{Field: field, Message: fmt.Sprintf("%s phải có đúng %d ký tự", field, lenVal), Tag: "len"}
			}
		case reflect.Slice, reflect.Array:
			if value.Len() != lenVal {
				return &FieldError{Field: field, Message: fmt.Sprintf("%s phải có đúng %d phần tử", field, lenVal), Tag: "len"}
			}
		}

	case rule == "email":
		if value.Kind() == reflect.String && value.String() != "" && !emailRegex.MatchString(value.String()) {
			return &FieldError{Field: field, Message: fmt.Sprintf("%s phải là email hợp lệ", field), Tag: "email"}
		}

	case rule == "uuid":
		if value.Kind() == reflect.String && value.String() != "" && !uuidRegex.MatchString(value.String()) {
			return &FieldError{Field: field, Message: fmt.Sprintf("%s phải là UUID hợp lệ", field), Tag: "uuid"}
		}

	case rule == "phone":
		if value.Kind() == reflect.String && value.String() != "" && !phoneRegex.MatchString(value.String()) {
			return &FieldError{Field: field, Message: fmt.Sprintf("%s phải là số điện thoại Việt Nam hợp lệ", field), Tag: "phone"}
		}

	case rule == "url":
		if value.Kind() == reflect.String && value.String() != "" && !urlRegex.MatchString(value.String()) {
			return &FieldError{Field: field, Message: fmt.Sprintf("%s phải là URL hợp lệ (http/https)", field), Tag: "url"}
		}

	case strings.HasPrefix(rule, "oneof="):
		allowed := strings.Split(strings.TrimPrefix(rule, "oneof="), "|")
		if value.Kind() == reflect.String {
			val := value.String()
			found := false
			for _, a := range allowed {
				if val == a {
					found = true
					break
				}
			}
			if !found && val != "" {
				return &FieldError{Field: field, Message: fmt.Sprintf("%s phải là một trong: %s", field, strings.Join(allowed, ", ")), Tag: "oneof"}
			}
		}

	case strings.HasPrefix(rule, "pattern="):
		pattern := strings.TrimPrefix(rule, "pattern=")
		if value.Kind() == reflect.String && value.String() != "" {
			re, err := regexp.Compile(pattern)
			if err == nil && !re.MatchString(value.String()) {
				return &FieldError{Field: field, Message: fmt.Sprintf("%s không khớp định dạng yêu cầu", field), Tag: "pattern"}
			}
		}
	}
	return nil
}

func isZero(v reflect.Value) bool {
	switch v.Kind() {
	case reflect.String:
		return strings.TrimSpace(v.String()) == ""
	case reflect.Int, reflect.Int64:
		return v.Int() == 0
	case reflect.Float64, reflect.Float32:
		return v.Float() == 0
	case reflect.Bool:
		return !v.Bool()
	case reflect.Ptr, reflect.Interface:
		return v.IsNil()
	case reflect.Slice, reflect.Array:
		return v.Len() == 0
	default:
		return false
	}
}

// ── HTTP Helpers ─────────────────────────────────────────────

// RequestBody decodes JSON body and validates it.
// Limits body to MaxBodySize (1 MB). Returns 422 on validation failure.
func RequestBody(w http.ResponseWriter, r *http.Request, dest interface{}) bool {
	// Limit body size to prevent abuse
	r.Body = http.MaxBytesReader(w, r.Body, MaxBodySize)

	if err := json.NewDecoder(r.Body).Decode(dest); err != nil {
		w.Header().Set("Content-Type", "application/json")
		code := http.StatusBadRequest
		msg := "Request body không phải JSON hợp lệ"

		// Check for body too large
		if err.Error() == "http: request body too large" {
			code = http.StatusRequestEntityTooLarge
			msg = fmt.Sprintf("Request body vượt quá giới hạn %d bytes", MaxBodySize)
		}

		w.WriteHeader(code)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"code":    "INVALID_JSON",
			"message": msg,
			"detail":  err.Error(),
		})
		return false
	}

	if vErr := Struct(dest); vErr != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnprocessableEntity)
		json.NewEncoder(w).Encode(vErr)
		return false
	}

	return true
}

// QueryParam validates a single query parameter value.
func QueryParam(r *http.Request, name string, rules ...string) *FieldError {
	val := r.URL.Query().Get(name)
	v := reflect.ValueOf(val)
	for _, rule := range rules {
		if err := validateRule(name, v, rule); err != nil {
			return err
		}
	}
	return nil
}

// PathParam validates a path parameter value against given rules.
func PathParam(name, value string, rules ...string) *FieldError {
	v := reflect.ValueOf(value)
	for _, rule := range rules {
		if err := validateRule(name, v, rule); err != nil {
			return err
		}
	}
	return nil
}

