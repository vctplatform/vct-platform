// Package masking provides PII data masking with configurable strategies,
// field-level rules, and JSON/map sanitizers for logs and API responses.
package masking

import (
	"encoding/json"
	"regexp"
	"strings"
	"sync"
)

// ═══════════════════════════════════════════════════════════════
// Strategy
// ═══════════════════════════════════════════════════════════════

// Strategy defines how a value is masked.
type Strategy func(value string) string

// Built-in strategies.
var (
	// Full replaces entire value with asterisks.
	Full Strategy = func(v string) string {
		if len(v) == 0 {
			return v
		}
		return strings.Repeat("*", len(v))
	}

	// Email masks email: u***@domain.com
	Email Strategy = func(v string) string {
		parts := strings.SplitN(v, "@", 2)
		if len(parts) != 2 {
			return Full(v)
		}
		user := parts[0]
		if len(user) <= 1 {
			return "*@" + parts[1]
		}
		return string(user[0]) + strings.Repeat("*", len(user)-1) + "@" + parts[1]
	}

	// Phone masks phone: ***-***-1234
	Phone Strategy = func(v string) string {
		digits := onlyDigits(v)
		if len(digits) < 4 {
			return Full(v)
		}
		return strings.Repeat("*", len(digits)-4) + digits[len(digits)-4:]
	}

	// IDCard masks ID: shows first 3 + last 2, rest asterisks.
	IDCard Strategy = func(v string) string {
		clean := strings.ReplaceAll(v, " ", "")
		if len(clean) < 6 {
			return Full(v)
		}
		return clean[:3] + strings.Repeat("*", len(clean)-5) + clean[len(clean)-2:]
	}

	// Partial shows first and last char: J***n
	Partial Strategy = func(v string) string {
		if len(v) <= 2 {
			return Full(v)
		}
		return string(v[0]) + strings.Repeat("*", len(v)-2) + string(v[len(v)-1])
	}

	// Redact replaces entire value with [REDACTED].
	Redact Strategy = func(v string) string {
		return "[REDACTED]"
	}
)

func onlyDigits(s string) string {
	var b strings.Builder
	for _, r := range s {
		if r >= '0' && r <= '9' {
			b.WriteRune(r)
		}
	}
	return b.String()
}

// ═══════════════════════════════════════════════════════════════
// Masker
// ═══════════════════════════════════════════════════════════════

// Rule maps a field name pattern to a masking strategy.
type Rule struct {
	Field    string // Exact field name or regex pattern
	Strategy Strategy
	IsRegex  bool
	compiled *regexp.Regexp
}

// Masker applies masking rules to data.
type Masker struct {
	rules []Rule
	mu    sync.RWMutex
}

// NewMasker creates a masker with default PII rules.
func NewMasker() *Masker {
	m := &Masker{}
	// Default PII rules
	m.AddRule("email", Email, false)
	m.AddRule("phone", Phone, false)
	m.AddRule("password", Redact, false)
	m.AddRule("secret", Redact, false)
	m.AddRule("token", Redact, false)
	m.AddRule("id_card", IDCard, false)
	m.AddRule("cmnd", IDCard, false)
	m.AddRule("cccd", IDCard, false)
	return m
}

// NewEmptyMasker creates a masker with no rules.
func NewEmptyMasker() *Masker {
	return &Masker{}
}

// AddRule adds a masking rule.
func (m *Masker) AddRule(field string, strategy Strategy, isRegex bool) {
	m.mu.Lock()
	defer m.mu.Unlock()

	r := Rule{Field: field, Strategy: strategy, IsRegex: isRegex}
	if isRegex {
		r.compiled = regexp.MustCompile(field)
	}
	m.rules = append(m.rules, r)
}

// MaskValue masks a single value based on its field name.
func (m *Masker) MaskValue(field, value string) string {
	m.mu.RLock()
	defer m.mu.RUnlock()

	lower := strings.ToLower(field)
	for _, rule := range m.rules {
		if rule.IsRegex && rule.compiled != nil {
			if rule.compiled.MatchString(lower) {
				return rule.Strategy(value)
			}
		} else if strings.ToLower(rule.Field) == lower {
			return rule.Strategy(value)
		}
	}
	return value // No matching rule
}

// MaskMap masks values in a string map.
func (m *Masker) MaskMap(data map[string]string) map[string]string {
	result := make(map[string]string, len(data))
	for k, v := range data {
		result[k] = m.MaskValue(k, v)
	}
	return result
}

// MaskJSON masks sensitive fields in a JSON byte slice.
func (m *Masker) MaskJSON(data []byte) ([]byte, error) {
	var obj map[string]any
	if err := json.Unmarshal(data, &obj); err != nil {
		return nil, err
	}

	m.maskAny(obj)
	return json.Marshal(obj)
}

func (m *Masker) maskAny(obj map[string]any) {
	for key, val := range obj {
		switch v := val.(type) {
		case string:
			obj[key] = m.MaskValue(key, v)
		case map[string]any:
			m.maskAny(v)
		case []any:
			for _, item := range v {
				if nested, ok := item.(map[string]any); ok {
					m.maskAny(nested)
				}
			}
		}
	}
}
