// Package template provides a template rendering engine with named template
// registry, layout inheritance, custom helper functions, and i18n support.
package template

import (
	"bytes"
	"html/template"
	"strings"
	"sync"
	"time"

	"vct-platform/backend/internal/apierror"
)

// ═══════════════════════════════════════════════════════════════
// Engine — Template registry and renderer
// ═══════════════════════════════════════════════════════════════

// Engine manages named templates with layouts and helper functions.
type Engine struct {
	templates map[string]*template.Template
	layouts   map[string]string
	helpers   template.FuncMap
	i18n      map[string]map[string]string // locale -> key -> value
	mu        sync.RWMutex
}

// New creates a template engine with default helpers.
func New() *Engine {
	e := &Engine{
		templates: make(map[string]*template.Template),
		layouts:   make(map[string]string),
		helpers:   make(template.FuncMap),
		i18n:      make(map[string]map[string]string),
	}
	e.registerDefaultHelpers()
	return e
}

func (e *Engine) registerDefaultHelpers() {
	e.helpers["upper"] = strings.ToUpper
	e.helpers["lower"] = strings.ToLower
	e.helpers["title"] = strings.Title
	e.helpers["trim"] = strings.TrimSpace
	e.helpers["contains"] = strings.Contains

	e.helpers["formatDate"] = func(t time.Time, layout string) string {
		return t.Format(layout)
	}
	e.helpers["now"] = func() time.Time {
		return time.Now()
	}
	e.helpers["year"] = func() int {
		return time.Now().Year()
	}

	e.helpers["join"] = func(items []string, sep string) string {
		return strings.Join(items, sep)
	}
	e.helpers["default"] = func(defaultVal, val string) string {
		if val == "" {
			return defaultVal
		}
		return val
	}
	e.helpers["safe"] = func(s string) template.HTML {
		return template.HTML(s)
	}
}

// ═══════════════════════════════════════════════════════════════
// Registration
// ═══════════════════════════════════════════════════════════════

// AddHelper registers a custom helper function.
func (e *Engine) AddHelper(name string, fn any) {
	e.mu.Lock()
	e.helpers[name] = fn
	e.mu.Unlock()
}

// AddLayout registers a named layout template.
func (e *Engine) AddLayout(name, content string) {
	e.mu.Lock()
	e.layouts[name] = content
	e.mu.Unlock()
}

// Register parses and stores a named template.
func (e *Engine) Register(name, content string) error {
	e.mu.Lock()
	defer e.mu.Unlock()

	tmpl, err := template.New(name).Funcs(e.helpers).Parse(content)
	if err != nil {
		return apierror.Wrap(err, "TEMPLATE_PARSE_ERR", "lỗi phân tích template")
	}
	e.templates[name] = tmpl
	return nil
}

// RegisterWithLayout parses a template that uses a layout.
func (e *Engine) RegisterWithLayout(name, layoutName, content string) error {
	e.mu.RLock()
	layout, ok := e.layouts[layoutName]
	e.mu.RUnlock()
	if !ok {
		return apierror.Newf("TEMPLATE_LAYOUT_404", "không tìm thấy layout %q", layoutName)
	}

	combined := strings.Replace(layout, "{{block \"content\" .}}{{end}}", content, 1)

	e.mu.Lock()
	defer e.mu.Unlock()

	tmpl, err := template.New(name).Funcs(e.helpers).Parse(combined)
	if err != nil {
		return apierror.Wrap(err, "TEMPLATE_PARSE_ERR", "lỗi phân tích template cùng layout")
	}
	e.templates[name] = tmpl
	return nil
}

// ═══════════════════════════════════════════════════════════════
// i18n
// ═══════════════════════════════════════════════════════════════

// AddTranslations registers translations for a locale.
func (e *Engine) AddTranslations(locale string, translations map[string]string) {
	e.mu.Lock()
	if e.i18n[locale] == nil {
		e.i18n[locale] = make(map[string]string)
	}
	for k, v := range translations {
		e.i18n[locale][k] = v
	}

	// Register/update the t() helper
	i18n := e.i18n
	e.helpers["t"] = func(locale, key string) string {
		if dict, ok := i18n[locale]; ok {
			if val, ok := dict[key]; ok {
				return val
			}
		}
		return key
	}
	e.mu.Unlock()
}

// ═══════════════════════════════════════════════════════════════
// Rendering
// ═══════════════════════════════════════════════════════════════

// Render executes a named template with the given data and returns the result.
func (e *Engine) Render(name string, data any) (string, error) {
	e.mu.RLock()
	tmpl, ok := e.templates[name]
	e.mu.RUnlock()

	if !ok {
		return "", apierror.Newf("TEMPLATE_404", "không tìm thấy template %q", name)
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", apierror.Wrap(err, "TEMPLATE_RENDER_ERR", "lỗi hiển thị template")
	}
	return buf.String(), nil
}

// RenderString parses and renders a one-off template string.
func (e *Engine) RenderString(content string, data any) (string, error) {
	e.mu.RLock()
	helpers := e.helpers
	e.mu.RUnlock()

	tmpl, err := template.New("inline").Funcs(helpers).Parse(content)
	if err != nil {
		return "", err
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", err
	}
	return buf.String(), nil
}

// Has checks if a template is registered.
func (e *Engine) Has(name string) bool {
	e.mu.RLock()
	_, ok := e.templates[name]
	e.mu.RUnlock()
	return ok
}

// List returns all registered template names.
func (e *Engine) List() []string {
	e.mu.RLock()
	defer e.mu.RUnlock()
	names := make([]string, 0, len(e.templates))
	for name := range e.templates {
		names = append(names, name)
	}
	return names
}
