package store

import (
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"strings"
	"sync"
)

type RejectedItem struct {
	Item   any    `json:"item"`
	Reason string `json:"reason"`
}

type ImportReport struct {
	Imported []map[string]any `json:"imported"`
	Rejected []RejectedItem   `json:"rejected"`
}

type Store struct {
	mu       sync.RWMutex
	entities map[string]map[string]map[string]any
}

func NewStore() *Store {
	seed := SeedData()
	return &Store{entities: seed}
}

func (s *Store) Close() error {
	return nil
}

func (s *Store) EnsureEntity(entity string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, exists := s.entities[entity]; !exists {
		s.entities[entity] = make(map[string]map[string]any)
	}
}

func (s *Store) List(entity string) []map[string]any {
	s.mu.RLock()
	defer s.mu.RUnlock()

	bucket := s.entities[entity]
	if bucket == nil {
		return []map[string]any{}
	}

	rows := make([]map[string]any, 0, len(bucket))
	for _, item := range bucket {
		rows = append(rows, cloneMap(item))
	}
	sort.SliceStable(rows, func(i, j int) bool {
		left, _ := rows[i]["id"].(string)
		right, _ := rows[j]["id"].(string)
		return left < right
	})
	return rows
}

func (s *Store) GetByID(entity, id string) (map[string]any, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	item, exists := s.entities[entity][id]
	if !exists {
		return nil, false
	}
	return cloneMap(item), true
}

func (s *Store) Create(entity string, item map[string]any) (map[string]any, error) {
	id, err := requireID(item)
	if err != nil {
		return nil, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.entities[entity]; !exists {
		s.entities[entity] = make(map[string]map[string]any)
	}
	if _, exists := s.entities[entity][id]; exists {
		return nil, fmt.Errorf("id %s da ton tai", id)
	}

	s.entities[entity][id] = cloneMap(item)
	return cloneMap(item), nil
}

func (s *Store) Update(entity, id string, patch map[string]any) (map[string]any, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	bucket := s.entities[entity]
	if bucket == nil {
		return nil, errors.New("khong tim thay entity")
	}
	current, exists := bucket[id]
	if !exists {
		return nil, errors.New("khong tim thay ban ghi")
	}

	next := cloneMap(current)
	for key, value := range patch {
		if key == "id" {
			continue
		}
		next[key] = value
	}
	next["id"] = id
	bucket[id] = next

	return cloneMap(next), nil
}

func (s *Store) Delete(entity, id string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, exists := s.entities[entity]; !exists {
		return
	}
	delete(s.entities[entity], id)
}

func (s *Store) ReplaceAll(entity string, items []map[string]any) ([]map[string]any, error) {
	next := make(map[string]map[string]any, len(items))
	for _, item := range items {
		id, err := requireID(item)
		if err != nil {
			return nil, err
		}
		next[id] = cloneMap(item)
	}

	s.mu.Lock()
	s.entities[entity] = next
	s.mu.Unlock()

	return s.List(entity), nil
}

func (s *Store) Import(entity string, payload []any) ImportReport {
	report := ImportReport{
		Imported: make([]map[string]any, 0),
		Rejected: make([]RejectedItem, 0),
	}

	for _, item := range payload {
		mapped, ok := item.(map[string]any)
		if !ok {
			report.Rejected = append(report.Rejected, RejectedItem{Item: item, Reason: "dinh dang khong hop le"})
			continue
		}
		id, err := requireID(mapped)
		if err != nil {
			report.Rejected = append(report.Rejected, RejectedItem{Item: item, Reason: err.Error()})
			continue
		}

		s.mu.Lock()
		if _, exists := s.entities[entity]; !exists {
			s.entities[entity] = make(map[string]map[string]any)
		}
		cloned := cloneMap(mapped)
		s.entities[entity][id] = cloned
		s.mu.Unlock()

		report.Imported = append(report.Imported, cloneMap(cloned))
	}

	return report
}

func (s *Store) ExportJSON(entity string) (string, error) {
	rows := s.List(entity)
	body, err := json.MarshalIndent(rows, "", "  ")
	if err != nil {
		return "", err
	}
	return string(body), nil
}

func (s *Store) ExportCSV(entity string) (string, error) {
	rows := s.List(entity)
	if len(rows) == 0 {
		return "", nil
	}

	headers := sortedKeys(rows[0])
	builder := &strings.Builder{}
	writer := csv.NewWriter(builder)
	if err := writer.Write(headers); err != nil {
		return "", err
	}

	for _, row := range rows {
		record := make([]string, 0, len(headers))
		for _, key := range headers {
			record = append(record, stringifyValue(row[key]))
		}
		if err := writer.Write(record); err != nil {
			return "", err
		}
	}

	writer.Flush()
	if err := writer.Error(); err != nil {
		return "", err
	}
	return builder.String(), nil
}

func requireID(item map[string]any) (string, error) {
	value, exists := item["id"]
	if !exists {
		return "", errors.New("thieu truong id")
	}
	id, ok := value.(string)
	if !ok || strings.TrimSpace(id) == "" {
		return "", errors.New("id khong hop le")
	}
	return strings.TrimSpace(id), nil
}

func cloneMap(source map[string]any) map[string]any {
	body, err := json.Marshal(source)
	if err != nil {
		return map[string]any{}
	}
	var copied map[string]any
	if err := json.Unmarshal(body, &copied); err != nil {
		return map[string]any{}
	}
	return copied
}

func sortedKeys(source map[string]any) []string {
	keys := make([]string, 0, len(source))
	for key := range source {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	return keys
}

func stringifyValue(value any) string {
	switch typed := value.(type) {
	case string:
		return typed
	case nil:
		return ""
	default:
		bytes, err := json.Marshal(typed)
		if err != nil {
			return fmt.Sprintf("%v", typed)
		}
		text := string(bytes)
		text = strings.TrimPrefix(text, "\"")
		text = strings.TrimSuffix(text, "\"")
		return text
	}
}
