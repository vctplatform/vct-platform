package tracing

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
)

func testLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelError}))
}

func TestStartSpan_NewTrace(t *testing.T) {
	exp := NewMemoryExporter()
	tracer := NewTracer("vct-api", exp, testLogger())

	ctx, span := tracer.StartSpan(context.Background(), "test-op")
	span.SetAttribute("key", "value")
	tracer.EndSpan(span)

	if span.TraceID.String() == strings.Repeat("0", 32) {
		t.Error("trace ID should be non-zero")
	}
	if span.Name != "test-op" {
		t.Errorf("expected name 'test-op', got %q", span.Name)
	}
	if span.Duration < 0 {
		t.Error("duration should be set after End")
	}
	if span.Status != StatusOK {
		t.Errorf("expected OK status, got %s", span.Status)
	}

	// Check context propagation
	fromCtx := SpanFromContext(ctx)
	if fromCtx == nil {
		t.Fatal("span should be in context")
	}
}

func TestStartSpan_ChildSpan(t *testing.T) {
	exp := NewMemoryExporter()
	tracer := NewTracer("vct-api", exp, testLogger())

	_, parentSpan := tracer.StartSpan(context.Background(), "parent")
	ctx := ContextWithSpan(context.Background(), parentSpan)
	_, childSpan := tracer.StartSpan(ctx, "child")

	if childSpan.TraceID != parentSpan.TraceID {
		t.Error("child should inherit parent's trace ID")
	}
	if childSpan.ParentID != parentSpan.SpanID {
		t.Error("child's parent ID should be parent's span ID")
	}
}

func TestSpan_SetError(t *testing.T) {
	exp := NewMemoryExporter()
	tracer := NewTracer("vct-api", exp, testLogger())

	_, span := tracer.StartSpan(context.Background(), "failing-op")
	span.SetError(errors.New("database connection refused"))
	tracer.EndSpan(span)

	if span.Status != StatusError {
		t.Error("status should be error")
	}
	if span.Attributes["error"] != "database connection refused" {
		t.Error("error attribute missing")
	}
}

func TestSpan_Events(t *testing.T) {
	exp := NewMemoryExporter()
	tracer := NewTracer("vct-api", exp, testLogger())

	_, span := tracer.StartSpan(context.Background(), "with-events")
	span.AddEvent("cache_miss")
	span.AddEvent("db_query")
	tracer.EndSpan(span)

	if len(span.Events) != 2 {
		t.Errorf("expected 2 events, got %d", len(span.Events))
	}
}

func TestW3C_InjectExtract(t *testing.T) {
	exp := NewMemoryExporter()
	tracer := NewTracer("vct-api", exp, testLogger())

	_, span := tracer.StartSpan(context.Background(), "test")
	headers := http.Header{}
	InjectHeaders(span, headers)

	tp := headers.Get("traceparent")
	if tp == "" {
		t.Fatal("traceparent header missing")
	}
	if !strings.HasPrefix(tp, "00-") {
		t.Errorf("expected 00- prefix, got %q", tp)
	}

	// Extract
	traceID, spanID, ok := ExtractHeaders(headers)
	if !ok {
		t.Fatal("extraction failed")
	}
	if traceID != span.TraceID {
		t.Error("trace ID mismatch after round-trip")
	}
	if spanID != span.SpanID {
		t.Error("span ID mismatch after round-trip")
	}
}

func TestExtractHeaders_Invalid(t *testing.T) {
	headers := http.Header{}
	headers.Set("traceparent", "invalid")
	_, _, ok := ExtractHeaders(headers)
	if ok {
		t.Error("should fail for invalid traceparent")
	}
}

func TestHTTPMiddleware(t *testing.T) {
	exp := NewMemoryExporter()
	tracer := NewTracer("vct-api", exp, testLogger())

	handler := HTTPMiddleware(tracer)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		span := SpanFromContext(r.Context())
		if span == nil {
			t.Error("span should be in request context")
		}
		w.WriteHeader(200)
	}))

	req := httptest.NewRequest("GET", "/api/v1/athletes", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	tp := rec.Header().Get("traceparent")
	if tp == "" {
		t.Error("response should have traceparent header")
	}

	spans := exp.Spans()
	if len(spans) != 1 {
		t.Fatalf("expected 1 span, got %d", len(spans))
	}
	if spans[0].Name != "GET /api/v1/athletes" {
		t.Errorf("expected span name 'GET /api/v1/athletes', got %q", spans[0].Name)
	}
}

func TestHTTPMiddleware_PropagatesParent(t *testing.T) {
	exp := NewMemoryExporter()
	tracer := NewTracer("vct-api", exp, testLogger())

	// Create a parent span and inject its traceparent
	_, parentSpan := tracer.StartSpan(context.Background(), "upstream")
	parentHeaders := http.Header{}
	InjectHeaders(parentSpan, parentHeaders)

	handler := HTTPMiddleware(tracer)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	}))

	req := httptest.NewRequest("GET", "/api/v1/athletes", nil)
	req.Header.Set("traceparent", parentHeaders.Get("traceparent"))
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	spans := exp.Spans()
	if len(spans) != 1 {
		t.Fatal("expected 1 span")
	}
	// Child should inherit parent's trace ID
	if spans[0].TraceID != parentSpan.TraceID {
		t.Error("child span should inherit upstream trace ID")
	}
}

func TestMemoryExporter_Reset(t *testing.T) {
	exp := NewMemoryExporter()
	exp.Export(&Span{Name: "test"})
	exp.Reset()
	if len(exp.Spans()) != 0 {
		t.Error("reset should clear spans")
	}
}
