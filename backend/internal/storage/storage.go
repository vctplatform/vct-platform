// Package storage provides an interface and S3-compatible implementation
// for file uploads, downloads, and presigned URLs.
package storage

import (
	"context"
	"io"
	"time"
)

// ObjectInfo contains metadata about a stored file.
type ObjectInfo struct {
	Key          string
	Size         int64
	ContentType  string
	LastModified time.Time
}

// Service defines a generic storage service interface.
type Service interface {
	// PutObject uploads a file to the specified bucket and key.
	PutObject(ctx context.Context, bucket, key string, reader io.Reader, size int64, contentType string) (ObjectInfo, error)

	// GetObject downloads a file. The caller must close the returned ReadCloser.
	GetObject(ctx context.Context, bucket, key string) (io.ReadCloser, error)

	// DeleteObject removes a file.
	DeleteObject(ctx context.Context, bucket, key string) error

	// PresignedPutObject generates a pre-signed URL for direct client-to-storage upload.
	PresignedPutObject(ctx context.Context, bucket, key string, expires time.Duration) (string, error)

	// PresignedGetObject generates a pre-signed URL for direct download.
	PresignedGetObject(ctx context.Context, bucket, key string, expires time.Duration) (string, error)

	// MakeBucket ensures a bucket exists, creating it if necessary.
	MakeBucket(ctx context.Context, bucket string) error
}
