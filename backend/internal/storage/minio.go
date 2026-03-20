package storage

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

// MinioConfig holds S3/MinIO connection details.
type MinioConfig struct {
	Endpoint        string // e.g., "s3.amazonaws.com" or "localhost:9000"
	AccessKeyID     string
	SecretAccessKey string
	UseSSL          bool
	Region          string
}

// MinioService implements Service using the MinIO Go SDK (S3 compatible).
type MinioService struct {
	client *minio.Client
	logger *slog.Logger
}

// NewMinioService creates a new MinIO/S3 storage service.
func NewMinioService(cfg MinioConfig, logger *slog.Logger) (*MinioService, error) {
	client, err := minio.New(cfg.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.AccessKeyID, cfg.SecretAccessKey, ""),
		Secure: cfg.UseSSL,
		Region: cfg.Region,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to init minio client: %w", err)
	}

	return &MinioService{
		client: client,
		logger: logger.With(slog.String("component", "storage_minio")),
	}, nil
}

// MakeBucket ensures a bucket exists.
func (s *MinioService) MakeBucket(ctx context.Context, bucket string) error {
	exists, err := s.client.BucketExists(ctx, bucket)
	if err != nil {
		return fmt.Errorf("failed to check bucket existence: %w", err)
	}

	if exists {
		return nil
	}

	err = s.client.MakeBucket(ctx, bucket, minio.MakeBucketOptions{})
	if err != nil {
		return fmt.Errorf("failed to create bucket %s: %w", bucket, err)
	}

	s.logger.Info("created new storage bucket", "bucket", bucket)
	return nil
}

// PutObject uploads a stream.
func (s *MinioService) PutObject(ctx context.Context, bucket, key string, reader io.Reader, size int64, contentType string) (ObjectInfo, error) {
	opts := minio.PutObjectOptions{
		ContentType: contentType,
	}

	info, err := s.client.PutObject(ctx, bucket, key, reader, size, opts)
	if err != nil {
		return ObjectInfo{}, fmt.Errorf("failed to put object: %w", err)
	}

	return ObjectInfo{
		Key:          info.Key,
		Size:         info.Size,
		ContentType:  contentType,
		LastModified: info.LastModified,
	}, nil
}

// GetObject retrieves a stream.
func (s *MinioService) GetObject(ctx context.Context, bucket, key string) (io.ReadCloser, error) {
	obj, err := s.client.GetObject(ctx, bucket, key, minio.GetObjectOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to get object: %w", err)
	}

	// Verify the object is actually readable (GetObject is lazy)
	_, err = obj.Stat()
	if err != nil {
		obj.Close()
		return nil, fmt.Errorf("object not found or inaccessible: %w", err)
	}

	return obj, nil
}

// DeleteObject removes a file.
func (s *MinioService) DeleteObject(ctx context.Context, bucket, key string) error {
	err := s.client.RemoveObject(ctx, bucket, key, minio.RemoveObjectOptions{})
	if err != nil {
		return fmt.Errorf("failed to delete object: %w", err)
	}
	return nil
}

// PresignedPutObject generates a secure upload URL.
func (s *MinioService) PresignedPutObject(ctx context.Context, bucket, key string, expires time.Duration) (string, error) {
	url, err := s.client.PresignedPutObject(ctx, bucket, key, expires)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned put url: %w", err)
	}
	return url.String(), nil
}

// PresignedGetObject generates a secure download URL.
func (s *MinioService) PresignedGetObject(ctx context.Context, bucket, key string, expires time.Duration) (string, error) {
	url, err := s.client.PresignedGetObject(ctx, bucket, key, expires, nil)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned get url: %w", err)
	}
	return url.String(), nil
}
