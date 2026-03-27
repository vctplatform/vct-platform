package worker

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"runtime/debug"
	"sync"
	"sync/atomic"
	"time"

	"github.com/nats-io/nats.go/jetstream"
	"vct-platform/backend/internal/apierror"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Background Worker Infrastructure
// Enhanced with structured logging, middleware, and exponential backoff.
// ═══════════════════════════════════════════════════════════════

// ── Task ─────────────────────────────────────────────────────

// TaskStatus represents the lifecycle of a task.
type TaskStatus string

const (
	TaskStatusPending  TaskStatus = "pending"
	TaskStatusRunning  TaskStatus = "running"
	TaskStatusDone     TaskStatus = "done"
	TaskStatusFailed   TaskStatus = "failed"
	TaskStatusRetrying TaskStatus = "retrying"
)

// Task represents a unit of background work.
type Task struct {
	ID          string         `json:"id"`
	Type        string         `json:"type"`
	Payload     map[string]any `json:"payload"`
	ScheduledAt time.Time      `json:"scheduled_at"`
	StartedAt   *time.Time     `json:"started_at,omitempty"`
	FinishedAt  *time.Time     `json:"finished_at,omitempty"`
	Status      TaskStatus     `json:"status"`
	Error       string         `json:"error,omitempty"`
	Retries     int            `json:"retries"`
	MaxRetries  int            `json:"max_retries"`
	Duration    time.Duration  `json:"duration,omitempty"`
}

// ── Task Handler ─────────────────────────────────────────────

// TaskHandler processes a specific type of task.
type TaskHandler interface {
	// TaskType returns the task type this handler processes.
	TaskType() string
	// Handle executes the task. Return nil on success, error to retry.
	Handle(ctx context.Context, payload map[string]any) error
}

// TaskMiddleware is a hook that wraps task processing.
// Call next(ctx) to continue the chain.
type TaskMiddleware func(ctx context.Context, task *Task, next func(context.Context) error) error

// ── Task Publisher ───────────────────────────────────────────

// Publisher defines the contract for enqueuing background tasks (ISP compliant).
type Publisher interface {
	Submit(ctx context.Context, task *Task) error
}

// NatsPublisher strictly publishes tasks to NATS JetStream without spinning up workers.
type NatsPublisher struct {
	js         jetstream.JetStream
	streamName string
}

// NewNatsPublisher creates a new NATS-backed task publisher.
func NewNatsPublisher(js jetstream.JetStream, streamName string) *NatsPublisher {
	if streamName == "" {
		streamName = "vct_worker_tasks"
	}
	return &NatsPublisher{js: js, streamName: streamName}
}

func (p *NatsPublisher) Submit(ctx context.Context, task *Task) error {
	if task.Status == "" {
		task.Status = TaskStatusPending
	}
	if task.ScheduledAt.IsZero() {
		task.ScheduledAt = time.Now()
	}

	payload, err := json.Marshal(task)
	if err != nil {
		return apierror.Wrap(err, "WORKER_500_ENCODE", "không thể mã hóa công việc")
	}

	subject := fmt.Sprintf("%s.%s", p.streamName, task.Type)
	_, err = p.js.Publish(ctx, subject, payload)
	if err != nil {
		return apierror.Wrap(err, "WORKER_500_PUBLISH", "không thể gửi công việc lên hàng đợi NATS")
	}
	return nil
}

// LogPublisher logs tasks instead of enqueuing them (for local dev without NATS).
type LogPublisher struct {
	logger *slog.Logger
}

// NewLogPublisher creates a local fallback publisher.
func NewLogPublisher(logger *slog.Logger) *LogPublisher {
	if logger == nil {
		logger = slog.Default()
	}
	return &LogPublisher{logger: logger}
}

func (p *LogPublisher) Submit(ctx context.Context, task *Task) error {
	p.logger.Info("Task published locally (NATS disabled)", 
		"task_type", task.Type, 
		"status", task.Status)
	return nil
}

// ── Dispatcher ───────────────────────────────────────────────

// DispatcherConfig holds dispatcher settings.
type DispatcherConfig struct {
	WorkerCount    int           // number of parallel workers (default: 4)
	QueueSize      int           // buffered task queue capacity (default: 100)
	RetryDelay     time.Duration // base delay between retries (default: 5s)
	MaxRetryDelay  time.Duration // max retry delay cap (default: 5min)
	DefaultRetries int           // max retries for tasks (default: 3)
	NatsJS         jetstream.JetStream
	StreamName     string
}

// DefaultConfig returns sensible defaults.
func DefaultConfig() DispatcherConfig {
	return DispatcherConfig{
		WorkerCount:    4,
		QueueSize:      100,
		RetryDelay:     5 * time.Second,
		MaxRetryDelay:  5 * time.Minute,
		DefaultRetries: 3,
	}
}

// DispatcherStats holds typed dispatcher statistics.
type DispatcherStats struct {
	Running   bool  `json:"running"`
	Workers   int   `json:"workers"`
	QueueSize int   `json:"queue_size"`
	QueueCap  int   `json:"queue_cap"`
	Processed int64 `json:"processed"`
	Failed    int64 `json:"failed"`
	Retried   int64 `json:"retried"`
	Panics    int64 `json:"panics"`
	Handlers  int   `json:"handlers"`
}

// Dispatcher manages a pool of workers that process tasks from a queue.
type Dispatcher struct {
	mu         sync.RWMutex
	config     DispatcherConfig
	handlers   map[string]TaskHandler
	middleware []TaskMiddleware
	queue      chan taskWrapper
	wg         sync.WaitGroup
	ctx        context.Context
	cancel     context.CancelFunc
	running    bool
	processed  atomic.Int64
	failed     atomic.Int64
	retried    atomic.Int64
	panics     atomic.Int64
	logger     *slog.Logger
	ns         jetstream.Stream
	nc         jetstream.ConsumeContext
}

type taskWrapper struct {
	task *Task
	msg  jetstream.Msg
}

// NewDispatcher creates a new task dispatcher.
func NewDispatcher(config DispatcherConfig) *Dispatcher {
	if config.WorkerCount <= 0 {
		config.WorkerCount = 4
	}
	if config.QueueSize <= 0 {
		config.QueueSize = 100
	}
	if config.RetryDelay <= 0 {
		config.RetryDelay = 5 * time.Second
	}
	if config.MaxRetryDelay <= 0 {
		config.MaxRetryDelay = 5 * time.Minute
	}
	if config.DefaultRetries <= 0 {
		config.DefaultRetries = 3
	}
	if config.StreamName == "" {
		config.StreamName = "vct_worker_tasks"
	}

	ctx, cancel := context.WithCancel(context.Background())
	return &Dispatcher{
		config:   config,
		handlers: make(map[string]TaskHandler),
		queue:    make(chan taskWrapper, config.QueueSize),
		ctx:      ctx,
		cancel:   cancel,
		logger:   slog.Default().With("component", "worker"),
	}
}

// Register adds a handler for a specific task type.
func (d *Dispatcher) Register(handler TaskHandler) {
	d.mu.Lock()
	defer d.mu.Unlock()
	d.handlers[handler.TaskType()] = handler
	d.logger.Info("registered handler", "task_type", handler.TaskType())
}

// Use adds a middleware to the processing chain.
func (d *Dispatcher) Use(mw TaskMiddleware) {
	d.mu.Lock()
	defer d.mu.Unlock()
	d.middleware = append(d.middleware, mw)
}

// Start launches the worker pool.
func (d *Dispatcher) Start() {
	d.mu.Lock()
	if d.running {
		d.mu.Unlock()
		return
	}
	d.running = true
	d.mu.Unlock()

	d.logger.Info("starting worker pool",
		"workers", d.config.WorkerCount,
		"queue_capacity", d.config.QueueSize,
	)

	if d.config.NatsJS != nil {
		stream, err := d.config.NatsJS.CreateOrUpdateStream(d.ctx, jetstream.StreamConfig{
			Name:      d.config.StreamName,
			Subjects:  []string{d.config.StreamName + ".*"},
			Retention: jetstream.WorkQueuePolicy,
		})
		if err != nil {
			d.logger.Error("failed to create NATS stream", "error", err)
			return
		}
		d.ns = stream

		cons, err := stream.CreateOrUpdateConsumer(d.ctx, jetstream.ConsumerConfig{
			Durable:       "vct_workers_group",
			AckPolicy:     jetstream.AckExplicitPolicy,
			MaxAckPending: d.config.QueueSize,
		})
		if err != nil {
			d.logger.Error("failed to create NATS consumer", "error", err)
			return
		}
		d.nc, _ = cons.Consume(func(msg jetstream.Msg) {
			var t Task
			if err := json.Unmarshal(msg.Data(), &t); err != nil {
				d.logger.Error("failed to decode task from NATS", "error", err)
				msg.Term()
				return
			}
			d.queue <- taskWrapper{task: &t, msg: msg}
		})
	}

	for i := 0; i < d.config.WorkerCount; i++ {
		d.wg.Add(1)
		go d.worker(i)
	}
}

// Stop gracefully shuts down the dispatcher.
func (d *Dispatcher) Stop() {
	d.mu.Lock()
	if !d.running {
		d.mu.Unlock()
		return
	}
	d.running = false
	d.mu.Unlock()

	if d.nc != nil {
		d.nc.Stop()
	}
	d.cancel()
	close(d.queue)
	d.wg.Wait()
	d.logger.Info("worker pool stopped",
		"processed", d.processed.Load(),
		"failed", d.failed.Load(),
		"retried", d.retried.Load(),
		"panics", d.panics.Load(),
	)
}

// Submit adds a task to the queue.
func (d *Dispatcher) Submit(task *Task) error {
	d.mu.RLock()
	if !d.running {
		d.mu.RUnlock()
		return apierror.New("WORKER_500_STOPPED", "bộ điều phối công việc không hoạt động")
	}
	_, hasHandler := d.handlers[task.Type]
	d.mu.RUnlock()

	if !hasHandler {
		return apierror.Newf("WORKER_404_HANDLER", "không tìm thấy bộ xử lý cho loại công việc: %s", task.Type)
	}

	if task.Status == "" {
		task.Status = TaskStatusPending
	}
	if task.MaxRetries == 0 {
		task.MaxRetries = d.config.DefaultRetries
	}
	if task.ScheduledAt.IsZero() {
		task.ScheduledAt = time.Now()
	}

	if d.config.NatsJS != nil {
		payload, err := json.Marshal(task)
		if err != nil {
			return apierror.Wrap(err, "WORKER_500_ENCODE", "không thể mã hóa công việc")
		}
		_, err = d.config.NatsJS.Publish(d.ctx, fmt.Sprintf("%s.%s", d.config.StreamName, task.Type), payload)
		if err != nil {
			return apierror.Wrap(err, "WORKER_500_PUBLISH", "không thể gửi công việc lên hàng đợi NATS")
		}
		return nil
	}

	select {
	case d.queue <- taskWrapper{task: task}:
		return nil
	default:
		return apierror.Newf("WORKER_429_FULL", "hàng đợi công việc đã đầy (sức chứa: %d)", d.config.QueueSize)
	}
}

// Stats returns current dispatcher statistics.
func (d *Dispatcher) Stats() DispatcherStats {
	d.mu.RLock()
	defer d.mu.RUnlock()
	return DispatcherStats{
		Running:   d.running,
		Workers:   d.config.WorkerCount,
		QueueSize: len(d.queue),
		QueueCap:  d.config.QueueSize,
		Processed: d.processed.Load(),
		Failed:    d.failed.Load(),
		Retried:   d.retried.Load(),
		Panics:    d.panics.Load(),
		Handlers:  len(d.handlers),
	}
}

// ── Worker Loop ──────────────────────────────────────────────

func (d *Dispatcher) worker(id int) {
	defer d.wg.Done()
	log := d.logger.With("worker_id", id)
	log.Info("worker started")

	for wrapper := range d.queue {
		if d.ctx.Err() != nil {
			return
		}
		d.process(log, wrapper)
	}
	log.Info("worker stopped")
}

func (d *Dispatcher) process(log *slog.Logger, wrapper taskWrapper) {
	task := wrapper.task

	// Panic recovery
	defer func() {
		if r := recover(); r != nil {
			d.panics.Add(1)
			d.failed.Add(1)
			task.Status = TaskStatusFailed
			task.Error = fmt.Sprintf("panic: %v", r)
			log.Error("task panicked",
				"task_id", task.ID,
				"task_type", task.Type,
				"panic", r,
				"stack", string(debug.Stack()),
			)
			if wrapper.msg != nil {
				wrapper.msg.Term()
			}
		}
	}()

	d.mu.RLock()
	handler, ok := d.handlers[task.Type]
	d.mu.RUnlock()

	if !ok {
		log.Warn("no handler for task", "task_id", task.ID, "task_type", task.Type)
		d.failed.Add(1)
		return
	}

	now := time.Now()
	task.StartedAt = &now
	task.Status = TaskStatusRunning

	log.Info("processing task",
		"task_id", task.ID,
		"task_type", task.Type,
		"attempt", task.Retries+1,
		"max_retries", task.MaxRetries,
	)

	// Build middleware chain
	execute := func(ctx context.Context) error {
		return handler.Handle(ctx, task.Payload)
	}

	d.mu.RLock()
	chain := make([]TaskMiddleware, len(d.middleware))
	copy(chain, d.middleware)
	d.mu.RUnlock()

	// Wrap in middleware (reverse order)
	for i := len(chain) - 1; i >= 0; i-- {
		mw := chain[i]
		next := execute
		execute = func(ctx context.Context) error {
			return mw(ctx, task, next)
		}
	}

	err := execute(d.ctx)
	finished := time.Now()
	task.FinishedAt = &finished
	task.Duration = finished.Sub(now)

	if err != nil {
		task.Error = err.Error()
		task.Retries++

		if task.Retries < task.MaxRetries {
			// Exponential backoff: base × 2^attempt, capped at MaxRetryDelay
			delay := d.config.RetryDelay * time.Duration(1<<uint(task.Retries-1))
			if delay > d.config.MaxRetryDelay {
				delay = d.config.MaxRetryDelay
			}

			log.Warn("task failed, scheduling retry",
				"task_id", task.ID,
				"task_type", task.Type,
				"attempt", task.Retries,
				"max_retries", task.MaxRetries,
				"retry_delay", delay,
				"error", err,
			)

			task.Status = TaskStatusRetrying
			task.Error = ""
			d.retried.Add(1)

			if wrapper.msg != nil {
				wrapper.msg.NakWithDelay(delay)
			} else {
				go func() {
					select {
					case <-time.After(delay):
						select {
						case d.queue <- wrapper:
						default:
							log.Warn("retry queue full", "task_id", task.ID)
						}
					case <-d.ctx.Done():
					}
				}()
			}
			return
		}

		task.Status = TaskStatusFailed
		log.Error("task FAILED permanently",
			"task_id", task.ID,
			"task_type", task.Type,
			"attempts", task.Retries,
			"error", err,
		)
		d.failed.Add(1)
		if wrapper.msg != nil {
			wrapper.msg.Ack()
		}
		return
	}

	task.Status = TaskStatusDone
	d.processed.Add(1)
	if wrapper.msg != nil {
		wrapper.msg.Ack()
	}
	log.Info("task completed",
		"task_id", task.ID,
		"task_type", task.Type,
		"duration", task.Duration,
	)
}
