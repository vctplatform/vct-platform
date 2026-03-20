// Package tracing provides lightweight distributed tracing with
// W3C Trace Context propagation, span management, and HTTP middleware.
package tracing

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"sync"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// Trace & Span — Core data structures
// ═══════════════════════════════════════════════════════════════

// TraceID is a 16-byte unique trace identifier.
type TraceID [16]byte

func (t TraceID) String() string { return hex.EncodeToString(t[:]) }

// SpanID is an 8-byte unique span identifier.
type SpanID [8]byte

func (s SpanID) String() string { return hex.EncodeToString(s[:]) }

// Span represents a single operation in a trace.
type Span struct {
	TraceID    TraceID                `json:"trace_id"`
	SpanID     SpanID                 `json:"span_id"`
	ParentID   SpanID                 `json:"parent_id,omitempty"`
	Name       string                 `json:"name"`
	Service    string                 `json:"service"`
	StartTime  time.Time              `json:"start_time"`
	EndTime    time.Time              `json:"end_time,omitempty"`
	Duration   time.Duration          `json:"duration,omitempty"`
	Status     SpanStatus             `json:"status"`
	Attributes map[string]string      `json:"attributes,omitempty"`
	Events     []SpanEvent            `json:"events,omitempty"`
	mu         sync.Mutex
}

// SpanStatus indicates span outcome.
type SpanStatus string

const (
	StatusOK    SpanStatus = "ok"
	StatusError SpanStatus = "error"
)

// SpanEvent is a timestamped annotation within a span.
type SpanEvent struct {
	Name string    `json:"name"`
	Time time.Time `json:"time"`
}

// SetAttribute adds a key-value attribute.
func (s *Span) SetAttribute(key, value string) {
	s.mu.Lock()
	if s.Attributes == nil {
		s.Attributes = make(map[string]string)
	}
	s.Attributes[key] = value
	s.mu.Unlock()
}

// AddEvent records a timestamped event.
func (s *Span) AddEvent(name string) {
	s.mu.Lock()
	s.Events = append(s.Events, SpanEvent{Name: name, Time: time.Now().UTC()})
	s.mu.Unlock()
}

// End completes the span.
func (s *Span) End() {
	s.mu.Lock()
	s.EndTime = time.Now().UTC()
	s.Duration = s.EndTime.Sub(s.StartTime)
	if s.Status == "" {
		s.Status = StatusOK
	}
	s.mu.Unlock()
}

// SetError marks the span as failed.
func (s *Span) SetError(err error) {
	s.mu.Lock()
	s.Status = StatusError
	if s.Attributes == nil {
		s.Attributes = make(map[string]string)
	}
	s.Attributes["error"] = err.Error()
	s.mu.Unlock()
}

// ═══════════════════════════════════════════════════════════════
// Tracer — Creates and manages spans
// ═══════════════════════════════════════════════════════════════

// Exporter receives completed spans.
type Exporter interface {
	Export(span *Span)
}

// Tracer creates spans and exports them.
type Tracer struct {
	service  string
	exporter Exporter
	logger   *slog.Logger
}

// NewTracer creates a tracer.
func NewTracer(service string, exporter Exporter, logger *slog.Logger) *Tracer {
	return &Tracer{
		service:  service,
		exporter: exporter,
		logger:   logger.With(slog.String("component", "tracer")),
	}
}

// StartSpan begins a new span, optionally as child of context span.
func (t *Tracer) StartSpan(ctx context.Context, name string) (context.Context, *Span) {
	span := &Span{
		Name:      name,
		Service:   t.service,
		StartTime: time.Now().UTC(),
	}

	// Inherit trace from parent
	if parent := SpanFromContext(ctx); parent != nil {
		span.TraceID = parent.TraceID
		span.ParentID = parent.SpanID
	} else {
		span.TraceID = newTraceID()
	}
	span.SpanID = newSpanID()

	return ContextWithSpan(ctx, span), span
}

// EndSpan completes a span and exports it.
func (t *Tracer) EndSpan(span *Span) {
	span.End()
	if t.exporter != nil {
		t.exporter.Export(span)
	}
}

// ═══════════════════════════════════════════════════════════════
// Context Propagation
// ═══════════════════════════════════════════════════════════════

type contextKey struct{}

// ContextWithSpan stores a span in context.
func ContextWithSpan(ctx context.Context, span *Span) context.Context {
	return context.WithValue(ctx, contextKey{}, span)
}

// SpanFromContext extracts a span from context.
func SpanFromContext(ctx context.Context) *Span {
	if span, ok := ctx.Value(contextKey{}).(*Span); ok {
		return span
	}
	return nil
}

// ═══════════════════════════════════════════════════════════════
// W3C Trace Context — HTTP header propagation
// ═══════════════════════════════════════════════════════════════

const (
	traceparentHeader = "traceparent"
	tracestateHeader  = "tracestate"
)

// InjectHeaders writes W3C traceparent into outgoing HTTP headers.
func InjectHeaders(span *Span, headers http.Header) {
	// Format: 00-{trace_id}-{span_id}-{flags}
	tp := fmt.Sprintf("00-%s-%s-01", span.TraceID, span.SpanID)
	headers.Set(traceparentHeader, tp)
}

// ExtractHeaders reads W3C traceparent from incoming HTTP headers.
func ExtractHeaders(headers http.Header) (TraceID, SpanID, bool) {
	tp := headers.Get(traceparentHeader)
	if tp == "" {
		return TraceID{}, SpanID{}, false
	}

	parts := strings.Split(tp, "-")
	if len(parts) != 4 || parts[0] != "00" {
		return TraceID{}, SpanID{}, false
	}

	traceID, err1 := parseTraceID(parts[1])
	spanID, err2 := parseSpanID(parts[2])
	if err1 != nil || err2 != nil {
		return TraceID{}, SpanID{}, false
	}

	return traceID, spanID, true
}

// ═══════════════════════════════════════════════════════════════
// HTTP Middleware — Auto-trace all requests
// ═══════════════════════════════════════════════════════════════

// HTTPMiddleware creates spans for HTTP requests with W3C propagation.
func HTTPMiddleware(tracer *Tracer) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			spanName := r.Method + " " + r.URL.Path

			// Extract parent from incoming headers
			ctx := r.Context()
			if traceID, parentID, ok := ExtractHeaders(r.Header); ok {
				parentSpan := &Span{TraceID: traceID, SpanID: parentID}
				ctx = ContextWithSpan(ctx, parentSpan)
			}

			ctx, span := tracer.StartSpan(ctx, spanName)
			span.SetAttribute("http.method", r.Method)
			span.SetAttribute("http.url", r.URL.String())
			span.SetAttribute("http.user_agent", r.UserAgent())

			// Inject trace into response headers
			InjectHeaders(span, w.Header())

			next.ServeHTTP(w, r.WithContext(ctx))

			tracer.EndSpan(span)
		})
	}
}

// ═══════════════════════════════════════════════════════════════
// Memory Exporter — For testing and development
// ═══════════════════════════════════════════════════════════════

// MemoryExporter stores spans in memory.
type MemoryExporter struct {
	spans []*Span
	mu    sync.Mutex
}

// NewMemoryExporter creates a memory exporter.
func NewMemoryExporter() *MemoryExporter {
	return &MemoryExporter{}
}

// Export stores a span.
func (e *MemoryExporter) Export(span *Span) {
	e.mu.Lock()
	e.spans = append(e.spans, span)
	e.mu.Unlock()
}

// Spans returns all exported spans.
func (e *MemoryExporter) Spans() []*Span {
	e.mu.Lock()
	defer e.mu.Unlock()
	result := make([]*Span, len(e.spans))
	copy(result, e.spans)
	return result
}

// SpansJSON returns spans as JSON for debugging.
func (e *MemoryExporter) SpansJSON() string {
	b, _ := json.MarshalIndent(e.Spans(), "", "  ")
	return string(b)
}

// Reset clears all spans.
func (e *MemoryExporter) Reset() {
	e.mu.Lock()
	e.spans = nil
	e.mu.Unlock()
}

// ── Helpers ──────────────────────────────

func newTraceID() TraceID {
	var id TraceID
	rand.Read(id[:])
	return id
}

func newSpanID() SpanID {
	var id SpanID
	rand.Read(id[:])
	return id
}

func parseTraceID(s string) (TraceID, error) {
	b, err := hex.DecodeString(s)
	if err != nil || len(b) != 16 {
		return TraceID{}, fmt.Errorf("invalid trace ID: %s", s)
	}
	var id TraceID
	copy(id[:], b)
	return id, nil
}

func parseSpanID(s string) (SpanID, error) {
	b, err := hex.DecodeString(s)
	if err != nil || len(b) != 8 {
		return SpanID{}, fmt.Errorf("invalid span ID: %s", s)
	}
	var id SpanID
	copy(id[:], b)
	return id, nil
}
