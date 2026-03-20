// Package jobqueue provides an in-process async job queue with
// worker pool, retry with exponential backoff, and dead letter queue.
package jobqueue

import (
	"context"
	"fmt"
	"log/slog"
	"math"
	"sync"
	"time"
)

// JobStatus represents the lifecycle state of a job.
type JobStatus string

const (
	StatusPending   JobStatus = "pending"
	StatusRunning   JobStatus = "running"
	StatusCompleted JobStatus = "completed"
	StatusFailed    JobStatus = "failed"
	StatusRetrying  JobStatus = "retrying"
	StatusDead      JobStatus = "dead" // exhausted retries
)

// Job represents a unit of async work.
type Job struct {
	ID        string                 `json:"id"`
	Type      string                 `json:"type"`
	Payload   map[string]interface{} `json:"payload"`
	Status    JobStatus              `json:"status"`
	Attempts  int                    `json:"attempts"`
	MaxRetry  int                    `json:"max_retry"`
	Error     string                 `json:"error,omitempty"`
	CreatedAt time.Time              `json:"created_at"`
	StartedAt *time.Time             `json:"started_at,omitempty"`
	DoneAt    *time.Time             `json:"done_at,omitempty"`
	NextRetry *time.Time             `json:"next_retry,omitempty"`
}

// Handler processes a specific job type.
type Handler func(ctx context.Context, job *Job) error

// Config holds queue configuration.
type Config struct {
	Workers       int           // Number of concurrent workers
	QueueSize     int           // Max pending jobs in queue
	MaxRetry      int           // Default max retries per job
	RetryBaseWait time.Duration // Base wait before first retry
	RetryMaxWait  time.Duration // Max wait between retries
	ShutdownWait  time.Duration // Grace period on shutdown
}

// DefaultConfig returns sensible defaults.
func DefaultConfig() Config {
	return Config{
		Workers:       4,
		QueueSize:     1000,
		MaxRetry:      3,
		RetryBaseWait: 1 * time.Second,
		RetryMaxWait:  5 * time.Minute,
		ShutdownWait:  30 * time.Second,
	}
}

// Queue manages job submission and processing.
type Queue struct {
	cfg      Config
	handlers map[string]Handler
	pending  chan *Job
	dead     []*Job
	jobs     map[string]*Job
	logger   *slog.Logger
	wg       sync.WaitGroup
	mu       sync.RWMutex
	cancel   context.CancelFunc
	idFunc   func() string
}

// New creates a job queue.
func New(cfg Config, logger *slog.Logger, idFunc func() string) *Queue {
	return &Queue{
		cfg:      cfg,
		handlers: make(map[string]Handler),
		pending:  make(chan *Job, cfg.QueueSize),
		dead:     make([]*Job, 0),
		jobs:     make(map[string]*Job),
		logger:   logger.With(slog.String("component", "jobqueue")),
		idFunc:   idFunc,
	}
}

// Register adds a handler for a job type.
func (q *Queue) Register(jobType string, handler Handler) {
	q.handlers[jobType] = handler
}

// Submit enqueues a new job. Returns the job ID.
func (q *Queue) Submit(jobType string, payload map[string]interface{}) (string, error) {
	if _, ok := q.handlers[jobType]; !ok {
		return "", fmt.Errorf("no handler registered for job type %q", jobType)
	}

	job := &Job{
		ID:        q.idFunc(),
		Type:      jobType,
		Payload:   payload,
		Status:    StatusPending,
		MaxRetry:  q.cfg.MaxRetry,
		CreatedAt: time.Now().UTC(),
	}

	q.mu.Lock()
	q.jobs[job.ID] = job
	q.mu.Unlock()

	select {
	case q.pending <- job:
		q.logger.Info("job submitted",
			slog.String("job_id", job.ID),
			slog.String("type", job.Type),
		)
		return job.ID, nil
	default:
		return "", fmt.Errorf("queue is full (max %d)", q.cfg.QueueSize)
	}
}

// Status returns a job's current status.
func (q *Queue) Status(jobID string) (*Job, error) {
	q.mu.RLock()
	defer q.mu.RUnlock()
	job, ok := q.jobs[jobID]
	if !ok {
		return nil, fmt.Errorf("job %q not found", jobID)
	}
	return job, nil
}

// DeadLetterQueue returns all dead (exhausted) jobs.
func (q *Queue) DeadLetterQueue() []*Job {
	q.mu.RLock()
	defer q.mu.RUnlock()
	result := make([]*Job, len(q.dead))
	copy(result, q.dead)
	return result
}

// Start launches the worker pool.
func (q *Queue) Start(ctx context.Context) {
	ctx, q.cancel = context.WithCancel(ctx)

	for i := 0; i < q.cfg.Workers; i++ {
		q.wg.Add(1)
		go q.worker(ctx, i)
	}

	q.logger.Info("job queue started",
		slog.Int("workers", q.cfg.Workers),
		slog.Int("queue_size", q.cfg.QueueSize),
	)
}

// Stop gracefully shuts down the queue.
func (q *Queue) Stop() {
	q.cancel()
	q.wg.Wait()
	q.logger.Info("job queue stopped")
}

// Pending returns the number of pending jobs.
func (q *Queue) Pending() int {
	return len(q.pending)
}

// ── Worker ───────────────────────────────

func (q *Queue) worker(ctx context.Context, id int) {
	defer q.wg.Done()
	logger := q.logger.With(slog.Int("worker", id))

	for {
		select {
		case <-ctx.Done():
			logger.Info("worker shutting down")
			return
		case job := <-q.pending:
			q.processJob(ctx, job, logger)
		}
	}
}

func (q *Queue) processJob(ctx context.Context, job *Job, logger *slog.Logger) {
	handler, ok := q.handlers[job.Type]
	if !ok {
		logger.Error("no handler for job type", slog.String("type", job.Type))
		return
	}

	now := time.Now()
	job.Status = StatusRunning
	job.StartedAt = &now
	job.Attempts++

	logger.Info("processing job",
		slog.String("job_id", job.ID),
		slog.String("type", job.Type),
		slog.Int("attempt", job.Attempts),
	)

	err := handler(ctx, job)

	doneAt := time.Now()
	if err == nil {
		job.Status = StatusCompleted
		job.DoneAt = &doneAt
		logger.Info("job completed",
			slog.String("job_id", job.ID),
			slog.String("duration", doneAt.Sub(now).String()),
		)
		return
	}

	job.Error = err.Error()
	logger.Warn("job failed",
		slog.String("job_id", job.ID),
		slog.String("error", err.Error()),
		slog.Int("attempt", job.Attempts),
	)

	// Retry or dead letter
	if job.Attempts >= job.MaxRetry {
		job.Status = StatusDead
		job.DoneAt = &doneAt
		q.mu.Lock()
		q.dead = append(q.dead, job)
		q.mu.Unlock()
		logger.Error("job sent to dead letter queue",
			slog.String("job_id", job.ID),
			slog.Int("attempts", job.Attempts),
		)
		return
	}

	// Exponential backoff
	wait := q.backoff(job.Attempts)
	nextRetry := time.Now().Add(wait)
	job.Status = StatusRetrying
	job.NextRetry = &nextRetry

	go func() {
		select {
		case <-time.After(wait):
			q.pending <- job
		case <-ctx.Done():
		}
	}()
}

func (q *Queue) backoff(attempt int) time.Duration {
	wait := time.Duration(float64(q.cfg.RetryBaseWait) * math.Pow(2, float64(attempt-1)))
	if wait > q.cfg.RetryMaxWait {
		wait = q.cfg.RetryMaxWait
	}
	return wait
}
