package worker

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Background Worker Infrastructure
// ═══════════════════════════════════════════════════════════════

// ── Task ─────────────────────────────────────────────────────

// TaskStatus represents the lifecycle of a task.
type TaskStatus string

const (
	TaskStatusPending TaskStatus = "pending"
	TaskStatusRunning TaskStatus = "running"
	TaskStatusDone    TaskStatus = "done"
	TaskStatusFailed  TaskStatus = "failed"
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
}

// ── Task Handler ─────────────────────────────────────────────

// TaskHandler processes a specific type of task.
type TaskHandler interface {
	// TaskType returns the task type this handler processes.
	TaskType() string
	// Handle executes the task. Return nil on success, error to retry.
	Handle(ctx context.Context, payload map[string]any) error
}

// ── Dispatcher ───────────────────────────────────────────────

// DispatcherConfig holds dispatcher settings.
type DispatcherConfig struct {
	WorkerCount    int           // number of parallel workers (default: 4)
	QueueSize      int           // buffered task queue capacity (default: 100)
	RetryDelay     time.Duration // delay between retries (default: 5s)
	DefaultRetries int           // max retries for tasks (default: 3)
}

// DefaultConfig returns sensible defaults.
func DefaultConfig() DispatcherConfig {
	return DispatcherConfig{
		WorkerCount:    4,
		QueueSize:      100,
		RetryDelay:     5 * time.Second,
		DefaultRetries: 3,
	}
}

// Dispatcher manages a pool of workers that process tasks from a queue.
type Dispatcher struct {
	mu        sync.RWMutex
	config    DispatcherConfig
	handlers  map[string]TaskHandler
	queue     chan *Task
	wg        sync.WaitGroup
	ctx       context.Context
	cancel    context.CancelFunc
	running   bool
	processed int64
	failed    int64
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
	if config.DefaultRetries <= 0 {
		config.DefaultRetries = 3
	}

	ctx, cancel := context.WithCancel(context.Background())
	return &Dispatcher{
		config:   config,
		handlers: make(map[string]TaskHandler),
		queue:    make(chan *Task, config.QueueSize),
		ctx:      ctx,
		cancel:   cancel,
	}
}

// Register adds a handler for a specific task type.
func (d *Dispatcher) Register(handler TaskHandler) {
	d.mu.Lock()
	defer d.mu.Unlock()
	d.handlers[handler.TaskType()] = handler
	log.Printf("[worker] registered handler: %s", handler.TaskType())
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

	log.Printf("[worker] starting %d workers (queue capacity: %d)", d.config.WorkerCount, d.config.QueueSize)
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

	d.cancel()
	close(d.queue)
	d.wg.Wait()
	log.Printf("[worker] stopped — processed: %d, failed: %d", d.processed, d.failed)
}

// Submit adds a task to the queue.
func (d *Dispatcher) Submit(task *Task) error {
	d.mu.RLock()
	if !d.running {
		d.mu.RUnlock()
		return fmt.Errorf("dispatcher not running")
	}
	_, hasHandler := d.handlers[task.Type]
	d.mu.RUnlock()

	if !hasHandler {
		return fmt.Errorf("no handler registered for task type: %s", task.Type)
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

	select {
	case d.queue <- task:
		return nil
	default:
		return fmt.Errorf("task queue full (capacity: %d)", d.config.QueueSize)
	}
}

// Stats returns current dispatcher statistics.
func (d *Dispatcher) Stats() map[string]any {
	d.mu.RLock()
	defer d.mu.RUnlock()
	return map[string]any{
		"running":     d.running,
		"workers":     d.config.WorkerCount,
		"queue_size":  len(d.queue),
		"queue_cap":   d.config.QueueSize,
		"processed":   d.processed,
		"failed":      d.failed,
		"handlers":    len(d.handlers),
	}
}

// ── Worker Loop ──────────────────────────────────────────────

func (d *Dispatcher) worker(id int) {
	defer d.wg.Done()
	log.Printf("[worker-%d] started", id)

	for task := range d.queue {
		if d.ctx.Err() != nil {
			return
		}
		d.process(id, task)
	}
	log.Printf("[worker-%d] stopped", id)
}

func (d *Dispatcher) process(workerID int, task *Task) {
	d.mu.RLock()
	handler, ok := d.handlers[task.Type]
	d.mu.RUnlock()

	if !ok {
		log.Printf("[worker-%d] no handler for task %s (type: %s)", workerID, task.ID, task.Type)
		d.mu.Lock()
		d.failed++
		d.mu.Unlock()
		return
	}

	now := time.Now()
	task.StartedAt = &now
	task.Status = TaskStatusRunning

	log.Printf("[worker-%d] processing task %s (type: %s, attempt: %d/%d)",
		workerID, task.ID, task.Type, task.Retries+1, task.MaxRetries)

	err := handler.Handle(d.ctx, task.Payload)
	finished := time.Now()
	task.FinishedAt = &finished

	if err != nil {
		task.Error = err.Error()
		task.Retries++

		if task.Retries < task.MaxRetries {
			log.Printf("[worker-%d] task %s failed (attempt %d/%d): %v — retrying after %v",
				workerID, task.ID, task.Retries, task.MaxRetries, err, d.config.RetryDelay)
			task.Status = TaskStatusPending
			task.Error = ""

			// Retry with delay
			go func() {
				select {
				case <-time.After(d.config.RetryDelay):
					select {
					case d.queue <- task:
					default:
						log.Printf("[worker] retry queue full for task %s", task.ID)
					}
				case <-d.ctx.Done():
				}
			}()
			return
		}

		task.Status = TaskStatusFailed
		log.Printf("[worker-%d] task %s FAILED permanently: %v", workerID, task.ID, err)
		d.mu.Lock()
		d.failed++
		d.mu.Unlock()
		return
	}

	task.Status = TaskStatusDone
	d.mu.Lock()
	d.processed++
	d.mu.Unlock()
	log.Printf("[worker-%d] task %s completed in %v", workerID, task.ID, finished.Sub(now))
}
