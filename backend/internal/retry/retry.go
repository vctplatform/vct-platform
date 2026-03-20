// Package retry provides a configurable retry engine with exponential backoff,
// jitter, retryable error detection, and context-aware cancellation.
package retry

import (
	"context"
	"errors"
	"fmt"
	"math"
	"math/rand"
	"time"
)

// Policy defines retry behavior.
type Policy struct {
	// MaxAttempts is the total number of attempts (including the first one).
	MaxAttempts int
	// InitialDelay is the delay before the first retry.
	InitialDelay time.Duration
	// MaxDelay caps the backoff delay.
	MaxDelay time.Duration
	// Multiplier scales delay between retries (for exponential backoff).
	Multiplier float64
	// Jitter adds randomness to prevent thundering herd. Range [0.0, 1.0].
	Jitter float64
	// RetryIf is an optional predicate. If set, only errors returning true are retried.
	RetryIf func(err error) bool
}

// DefaultPolicy returns a sensible retry policy.
func DefaultPolicy() Policy {
	return Policy{
		MaxAttempts:  3,
		InitialDelay: 100 * time.Millisecond,
		MaxDelay:     5 * time.Second,
		Multiplier:   2.0,
		Jitter:       0.1,
	}
}

// LinearPolicy returns a policy with constant delay between retries.
func LinearPolicy(attempts int, delay time.Duration) Policy {
	return Policy{
		MaxAttempts:  attempts,
		InitialDelay: delay,
		MaxDelay:     delay,
		Multiplier:   1.0,
		Jitter:       0,
	}
}

// PermanentError wraps an error to indicate it should not be retried.
type PermanentError struct {
	Err error
}

func (e *PermanentError) Error() string { return e.Err.Error() }
func (e *PermanentError) Unwrap() error { return e.Err }

// Permanent marks an error as non-retryable.
func Permanent(err error) error {
	return &PermanentError{Err: err}
}

// Result contains the outcome of a retry execution.
type Result struct {
	Attempts int
	Err      error
	Duration time.Duration
}

// Do executes fn with the given retry policy, respecting context cancellation.
func Do(ctx context.Context, policy Policy, fn func(ctx context.Context) error) Result {
	if policy.MaxAttempts <= 0 {
		policy.MaxAttempts = 1
	}
	if policy.Multiplier <= 0 {
		policy.Multiplier = 1.0
	}

	start := time.Now()
	var lastErr error
	delay := policy.InitialDelay

	for attempt := 1; attempt <= policy.MaxAttempts; attempt++ {
		err := fn(ctx)
		if err == nil {
			return Result{Attempts: attempt, Duration: time.Since(start)}
		}

		lastErr = err

		// Check for permanent (non-retryable) error
		var permErr *PermanentError
		if errors.As(err, &permErr) {
			return Result{Attempts: attempt, Err: permErr.Err, Duration: time.Since(start)}
		}

		// Check RetryIf predicate
		if policy.RetryIf != nil && !policy.RetryIf(err) {
			return Result{Attempts: attempt, Err: err, Duration: time.Since(start)}
		}

		// Don't sleep after the last attempt
		if attempt == policy.MaxAttempts {
			break
		}

		// Calculate delay with jitter
		sleepDuration := delay
		if policy.Jitter > 0 {
			jitter := time.Duration(float64(delay) * policy.Jitter * (rand.Float64()*2 - 1))
			sleepDuration = delay + jitter
			if sleepDuration < 0 {
				sleepDuration = 0
			}
		}

		// Cap at max delay
		if sleepDuration > policy.MaxDelay {
			sleepDuration = policy.MaxDelay
		}

		// Wait or cancel
		select {
		case <-ctx.Done():
			return Result{
				Attempts: attempt,
				Err:      fmt.Errorf("retry cancelled: %w", ctx.Err()),
				Duration: time.Since(start),
			}
		case <-time.After(sleepDuration):
		}

		// Exponential backoff
		delay = time.Duration(float64(delay) * policy.Multiplier)
		if delay > policy.MaxDelay {
			delay = policy.MaxDelay
		}
	}

	return Result{
		Attempts: policy.MaxAttempts,
		Err:      fmt.Errorf("max retries (%d) exceeded: %w", policy.MaxAttempts, lastErr),
		Duration: time.Since(start),
	}
}

// DoSimple is a convenience wrapper using DefaultPolicy.
func DoSimple(ctx context.Context, fn func(ctx context.Context) error) error {
	result := Do(ctx, DefaultPolicy(), fn)
	return result.Err
}

// backoffDelay computes the delay for a given attempt (exported for testing).
func backoffDelay(attempt int, initial time.Duration, multiplier float64, maxDelay time.Duration) time.Duration {
	delay := time.Duration(float64(initial) * math.Pow(multiplier, float64(attempt-1)))
	if delay > maxDelay {
		delay = maxDelay
	}
	return delay
}
