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
	result := make([]T, 0, len(raw))
	for _, b := range raw {
		var item T
		if err := json.Unmarshal(b, &item); err != nil {
			continue // skip malformed rows
		}
		result = append(result, item)
	}
	return result, nil
}

func (a *StoreAdapter[T]) GetByID(id string) (*T, error) {
	raw, ok := a.ds.GetByID(a.entityName, id)
	if !ok {
		return nil, fmt.Errorf("%s không tìm thấy: %s", a.entityName, id)
	}
	var result T
	if err := json.Unmarshal(raw, &result); err != nil {
		return nil, fmt.Errorf("deserialize error: %w", err)
	}
	return &result, nil
}

func (a *StoreAdapter[T]) Create(item T) (*T, error) {
	b, err := json.Marshal(item)
	if err != nil {
		return nil, fmt.Errorf("serialize error: %w", err)
	}
	created, err := a.ds.Create(a.entityName, b)
	if err != nil {
		return nil, err
	}
	var result T
	if err := json.Unmarshal(created, &result); err != nil {
		return nil, fmt.Errorf("deserialize error: %w", err)
	}
	return &result, nil
}

func (a *StoreAdapter[T]) Update(id string, patch any) (*T, error) {
	b, err := json.Marshal(patch)
	if err != nil {
		return nil, fmt.Errorf("serialize error: %w", err)
	}
	updated, err := a.ds.Update(a.entityName, id, b)
	if err != nil {
		return nil, err
	}
	var result T
	if err := json.Unmarshal(updated, &result); err != nil {
		return nil, fmt.Errorf("deserialize error: %w", err)
	}
	return &result, nil
}

func (a *StoreAdapter[T]) Delete(id string) error {
	a.ds.Delete(a.entityName, id)
	return nil
}
