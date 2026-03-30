package database

import (
	"context"
	"database/sql"
	"fmt"
	
	"vct-platform/backend/internal/auth"
)

// WithRLS is the self-hosted Supabase equivalent for enforcing Row-Level Security.
// It starts a transaction, injects the current user's ID and Role into the transaction's
// local configuration (acting like PostgREST context injection), executes the provided 
// function, and commits.
// 
// If the function returns an error, the transaction is rolled back.
func WithRLS(ctx context.Context, db *sql.DB, principal *auth.Principal, fn func(tx *sql.Tx) error) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("RLS tx begin failed: %w", err)
	}
	
	defer func() {
		_ = tx.Rollback() // Safe to call even if committed
	}()

	// Inject Supabase-like JWT claims into Postgres session variables dynamically.
	// Using SET LOCAL ensures the variables are cleared when the transaction ends, 
	// preventing connection pool pollution.
	if principal != nil {
		// Set app.current_user
		_, err = tx.ExecContext(ctx, "SET LOCAL app.current_user = $1", principal.User.ID)
		if err != nil {
			return fmt.Errorf("RLS init failed for user: %w", err)
		}
		
		// Set app.current_role
		_, err = tx.ExecContext(ctx, "SET LOCAL app.current_role = $1", string(principal.User.Role))
		if err != nil {
			return fmt.Errorf("RLS init failed for role: %w", err)
		}
	} else {
		// Public anonymous access
		_, err = tx.ExecContext(ctx, "SET LOCAL app.current_role = 'anon'")
		if err != nil {
			return fmt.Errorf("RLS init failed for anon: %w", err)
		}
	}

	// Execute application logic within the secured transaction boundary
	if err := fn(tx); err != nil {
		return err // Rollback will happen in defer
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("RLS tx commit failed: %w", err)
	}

	return nil
}
