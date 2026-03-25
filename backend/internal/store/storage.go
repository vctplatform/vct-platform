package store

import "context"

type DataStore interface {
	EnsureEntity(entity string)
	List(entity string) [][]byte
	GetByID(entity, id string) ([]byte, bool)
	Create(entity string, item []byte) ([]byte, error)
	Update(entity, id string, patch []byte) ([]byte, error)
	Delete(entity, id string)
	ReplaceAll(entity string, items [][]byte) ([][]byte, error)
	Import(entity string, payload []any) ImportReport
	ExportJSON(entity string) (string, error)
	ExportCSV(entity string) (string, error)
	Close() error
}

// Transactional is implemented by stores that support ACID transactions.
// Callers should type-assert: if ts, ok := store.(Transactional); ok { ... }
type Transactional interface {
	// WithTransaction executes fn inside a database transaction.
	// If fn returns nil the transaction is committed; otherwise it is rolled back.
	WithTransaction(ctx context.Context, fn func(tx DataStore) error) error
}
