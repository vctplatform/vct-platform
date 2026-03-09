package adapter

import (
	"encoding/json"
	"fmt"

	"vct-platform/backend/internal/store"
)

// StoreAdapter wraps the untyped DataStore to provide typed CRUD for a single entity.
// This is a transitional adapter — will be replaced by sqlc-generated code.
type StoreAdapter[T any] struct {
	ds         store.DataStore
	entityName string
}

func NewStoreAdapter[T any](ds store.DataStore, entityName string) *StoreAdapter[T] {
	ds.EnsureEntity(entityName)
	return &StoreAdapter[T]{ds: ds, entityName: entityName}
}

func (a *StoreAdapter[T]) List() ([]T, error) {
	raw := a.ds.List(a.entityName)
	return mapSlice[T](raw)
}

func (a *StoreAdapter[T]) GetByID(id string) (*T, error) {
	raw, ok := a.ds.GetByID(a.entityName, id)
	if !ok {
		return nil, fmt.Errorf("%s không tìm thấy: %s", a.entityName, id)
	}
	return mapOne[T](raw)
}

func (a *StoreAdapter[T]) Create(item T) (*T, error) {
	raw, err := toMap(item)
	if err != nil {
		return nil, err
	}
	created, err := a.ds.Create(a.entityName, raw)
	if err != nil {
		return nil, err
	}
	return mapOne[T](created)
}

func (a *StoreAdapter[T]) Update(id string, patch map[string]interface{}) (*T, error) {
	updated, err := a.ds.Update(a.entityName, id, patch)
	if err != nil {
		return nil, err
	}
	return mapOne[T](updated)
}

func (a *StoreAdapter[T]) Delete(id string) error {
	a.ds.Delete(a.entityName, id)
	return nil
}

// ── Conversion helpers (JSON round-trip for now) ──────────────

func mapSlice[T any](raw []map[string]any) ([]T, error) {
	result := make([]T, 0, len(raw))
	for _, item := range raw {
		mapped, err := mapOne[T](item)
		if err != nil {
			continue // skip malformed rows
		}
		result = append(result, *mapped)
	}
	return result, nil
}

func mapOne[T any](raw map[string]any) (*T, error) {
	data, err := json.Marshal(raw)
	if err != nil {
		return nil, fmt.Errorf("serialize error: %w", err)
	}
	var result T
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("deserialize error: %w", err)
	}
	return &result, nil
}

func toMap(item any) (map[string]any, error) {
	data, err := json.Marshal(item)
	if err != nil {
		return nil, fmt.Errorf("serialize error: %w", err)
	}
	var result map[string]any
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("deserialize error: %w", err)
	}
	return result, nil
}
