package storage

import (
	"context"
	"io"
	"strings"
	"testing"
	"time"
)

func TestMockService_MakeBucket(t *testing.T) {
	svc := NewMockService()
	ctx := context.Background()

	err := svc.MakeBucket(ctx, "avatars")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if !svc.buckets["avatars"] {
		t.Errorf("expected bucket to be created")
	}
}

func TestMockService_PutAndGetObject(t *testing.T) {
	svc := NewMockService()
	ctx := context.Background()

	_ = svc.MakeBucket(ctx, "docs")

	content := "hello world"
	_, err := svc.PutObject(ctx, "docs", "test.txt", strings.NewReader(content), int64(len(content)), "text/plain")
	if err != nil {
		t.Fatalf("failed to put: %v", err)
	}

	if svc.ObjectCount("docs") != 1 {
		t.Errorf("expected 1 object, got %d", svc.ObjectCount("docs"))
	}

	rc, err := svc.GetObject(ctx, "docs", "test.txt")
	if err != nil {
		t.Fatalf("failed to get: %v", err)
	}
	defer rc.Close()

	data, err := io.ReadAll(rc)
	if err != nil {
		t.Fatal(err)
	}
	if string(data) != content {
		t.Errorf("expected %q, got %q", content, string(data))
	}
}

func TestMockService_DeleteObject(t *testing.T) {
	svc := NewMockService()
	ctx := context.Background()

	_ = svc.MakeBucket(ctx, "test-del")
	_, _ = svc.PutObject(ctx, "test-del", "x", strings.NewReader("data"), 4, "text/plain")

	err := svc.DeleteObject(ctx, "test-del", "x")
	if err != nil {
		t.Fatalf("failed to delete: %v", err)
	}

	if svc.ObjectCount("test-del") != 0 {
		t.Errorf("expected 0 objects, got %d", svc.ObjectCount("test-del"))
	}
}

func TestMockService_PresignedURLs(t *testing.T) {
	svc := NewMockService()
	ctx := context.Background()

	putURL, err := svc.PresignedPutObject(ctx, "bucket", "key", time.Hour)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(putURL, "upload=true") {
		t.Errorf("invalid put url: %s", putURL)
	}

	getURL, err := svc.PresignedGetObject(ctx, "bucket", "key", time.Hour)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(getURL, "download=true") {
		t.Errorf("invalid get url: %s", getURL)
	}
}

func TestMockService_Errors(t *testing.T) {
	svc := NewMockService()
	ctx := context.Background()

	// Put to non-existent bucket
	_, err := svc.PutObject(ctx, "no-bucket", "key", strings.NewReader(""), 0, "")
	if err == nil {
		t.Error("expected error for non-existent bucket")
	}

	// Get non-existent object
	_ = svc.MakeBucket(ctx, "b1")
	_, err = svc.GetObject(ctx, "b1", "not-found")
	if err == nil {
		t.Error("expected error for non-existent object")
	}
}
