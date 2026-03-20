package storage

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"sync"
	"time"
)

// MockService provides an in-memory storage implementation for testing.
type MockService struct {
	objects map[string]map[string][]byte // bucket -> key -> data
	buckets map[string]bool
	mu      sync.RWMutex
}

// NewMockService creates a new mock storage.
func NewMockService() *MockService {
	return &MockService{
		objects: make(map[string]map[string][]byte),
		buckets: make(map[string]bool),
	}
}

func (m *MockService) MakeBucket(ctx context.Context, bucket string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.buckets[bucket] = true
	if m.objects[bucket] == nil {
		m.objects[bucket] = make(map[string][]byte)
	}
	return nil
}

func (m *MockService) PutObject(ctx context.Context, bucket, key string, reader io.Reader, size int64, contentType string) (ObjectInfo, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if !m.buckets[bucket] {
		return ObjectInfo{}, fmt.Errorf("bucket does not exist")
	}

	data, err := io.ReadAll(reader)
	if err != nil {
		return ObjectInfo{}, err
	}

	m.objects[bucket][key] = data

	return ObjectInfo{
		Key:          key,
		Size:         int64(len(data)),
		ContentType:  contentType,
		LastModified: time.Now(),
	}, nil
}

func (m *MockService) GetObject(ctx context.Context, bucket, key string) (io.ReadCloser, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if !m.buckets[bucket] {
		return nil, fmt.Errorf("bucket does not exist")
	}

	data, ok := m.objects[bucket][key]
	if !ok {
		return nil, fmt.Errorf("object not found")
	}

	return io.NopCloser(bytes.NewReader(data)), nil
}

func (m *MockService) DeleteObject(ctx context.Context, bucket, key string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if !m.buckets[bucket] {
		return fmt.Errorf("bucket does not exist")
	}

	delete(m.objects[bucket], key)
	return nil
}

func (m *MockService) PresignedPutObject(ctx context.Context, bucket, key string, expires time.Duration) (string, error) {
	return fmt.Sprintf("https://mock-storage/%s/%s?upload=true&exp=%.0f", bucket, key, expires.Seconds()), nil
}

func (m *MockService) PresignedGetObject(ctx context.Context, bucket, key string, expires time.Duration) (string, error) {
	return fmt.Sprintf("https://mock-storage/%s/%s?download=true&exp=%.0f", bucket, key, expires.Seconds()), nil
}

// Helper for tests
func (m *MockService) ObjectCount(bucket string) int {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return len(m.objects[bucket])
}
