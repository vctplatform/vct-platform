package store

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"sort"
	"strings"
	"sync"

	"vct-platform/backend/internal/apierror"
)

type RejectedItem struct {
	Item   any    `json:"item"`
	Reason string `json:"reason"`
}

type ImportReport struct {
	Imported [][]byte       `json:"imported"`
	Rejected []RejectedItem `json:"rejected"`
}

type Store struct {
	mu       sync.RWMutex
	entities map[string]map[string][]byte
}

func NewStore() *Store {
	seed := SeedData()
	byteSeed := make(map[string]map[string][]byte)
	for e, bucket := range seed {
		byteSeed[e] = make(map[string][]byte)
		for k, v := range bucket {
			b, _ := json.Marshal(v)
			byteSeed[e][k] = b
		}
	}
	return &Store{entities: byteSeed}
}

func (s *Store) Close() error {
	return nil
}

func (s *Store) EnsureEntity(entity string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, exists := s.entities[entity]; !exists {
		s.entities[entity] = make(map[string][]byte)
	}
}

func (s *Store) List(entity string) [][]byte {
	s.mu.RLock()
	defer s.mu.RUnlock()

	bucket := s.entities[entity]
	if bucket == nil {
		return [][]byte{}
	}

	// We need to sort by ID, so we extract keys, sort, then append
	keys := make([]string, 0, len(bucket))
	for k := range bucket {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	rows := make([][]byte, 0, len(keys))
	for _, k := range keys {
		// make a copy of the byte slice to avoid caller mutating the cache
		cp := make([]byte, len(bucket[k]))
		copy(cp, bucket[k])
		rows = append(rows, cp)
	}
	return rows
}

func (s *Store) GetByID(entity, id string) ([]byte, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	item, exists := s.entities[entity][id]
	if !exists {
		return nil, false
	}
	cp := make([]byte, len(item))
	copy(cp, item)
	return cp, true
}

func (s *Store) Create(entity string, item []byte) ([]byte, error) {
	id, err := requireIDBytes(item)
	if err != nil {
		return nil, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.entities[entity]; !exists {
		s.entities[entity] = make(map[string][]byte)
	}
	if _, exists := s.entities[entity][id]; exists {
		return nil, fmt.Errorf("%w: %s", apierror.ErrDuplicateID, id)
	}

	cp := make([]byte, len(item))
	copy(cp, item)
	s.entities[entity][id] = cp

	res := make([]byte, len(item))
	copy(res, item)
	return res, nil
}

func (s *Store) Update(entity, id string, patch []byte) ([]byte, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	bucket := s.entities[entity]
	if bucket == nil {
		return nil, apierror.ErrEntityNotFound
	}
	currentBytes, exists := bucket[id]
	if !exists {
		return nil, apierror.ErrNotFound
	}

	// Unmarshal current into map
	var next map[string]any
	if err := json.Unmarshal(currentBytes, &next); err != nil {
		return nil, err
	}

	// Unmarshal patch into map
	var patchMap map[string]any
	if err := json.Unmarshal(patch, &patchMap); err != nil {
		return nil, err
	}

	// Merge
	for key, value := range patchMap {
		if key == "id" {
			continue
		}
		next[key] = value
	}
	next["id"] = id

	// Marshal back
	mergedBytes, err := json.Marshal(next)
	if err != nil {
		return nil, err
	}

	bucket[id] = mergedBytes

	res := make([]byte, len(mergedBytes))
	copy(res, mergedBytes)
	return res, nil
}

func (s *Store) Delete(entity, id string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, exists := s.entities[entity]; !exists {
		return
	}
	delete(s.entities[entity], id)
}

func (s *Store) ReplaceAll(entity string, items [][]byte) ([][]byte, error) {
	next := make(map[string][]byte, len(items))
	for _, item := range items {
		id, err := requireIDBytes(item)
		if err != nil {
			return nil, err
		}
		cp := make([]byte, len(item))
		copy(cp, item)
		next[id] = cp
	}

	s.mu.Lock()
	s.entities[entity] = next
	s.mu.Unlock()

	return s.List(entity), nil
}

func (s *Store) Import(entity string, payload []any) ImportReport {
	report := ImportReport{
		Imported: make([][]byte, 0),
		Rejected: make([]RejectedItem, 0),
	}

	for _, item := range payload {
		mapped, ok := item.(map[string]any)
		if !ok {
			report.Rejected = append(report.Rejected, RejectedItem{Item: item, Reason: "invalid format"})
			continue
		}
		id, err := requireID(mapped)
		if err != nil {
			report.Rejected = append(report.Rejected, RejectedItem{Item: item, Reason: err.Error()})
			continue
		}

		b, err := json.Marshal(mapped)
		if err != nil {
			report.Rejected = append(report.Rejected, RejectedItem{Item: item, Reason: err.Error()})
			continue
		}

		s.mu.Lock()
		if _, exists := s.entities[entity]; !exists {
			s.entities[entity] = make(map[string][]byte)
		}
		s.entities[entity][id] = b
		s.mu.Unlock()

		report.Imported = append(report.Imported, b)
	}

	return report
}

func (s *Store) ExportJSON(entity string) (string, error) {
	// Reconstruct the JSON array manually for performance
	s.mu.RLock()
	bucket := s.entities[entity]
	s.mu.RUnlock()

	if bucket == nil || len(bucket) == 0 {
		return "[]", nil
	}

	keys := make([]string, 0, len(bucket))
	for k := range bucket {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	var sb strings.Builder
	sb.WriteString("[\n")
	for i, k := range keys {
		sb.Write(bucket[k])
		if i < len(keys)-1 {
			sb.WriteString(",\n")
		} else {
			sb.WriteString("\n")
		}
	}
	sb.WriteString("]")

	return sb.String(), nil
}

func (s *Store) ExportCSV(entity string) (string, error) {
	s.mu.RLock()
	bucket := s.entities[entity]
	s.mu.RUnlock()

	if bucket == nil || len(bucket) == 0 {
		return "", nil
	}

	keys := make([]string, 0, len(bucket))
	for k := range bucket {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	// Sample first item to get headers
	var firstItem map[string]any
	if err := json.Unmarshal(bucket[keys[0]], &firstItem); err != nil {
		return "", err
	}
	headers := sortedKeys(firstItem)

	builder := &strings.Builder{}
	writer := csv.NewWriter(builder)
	if err := writer.Write(headers); err != nil {
		return "", err
	}

	for _, k := range keys {
		var row map[string]any
		if err := json.Unmarshal(bucket[k], &row); err != nil {
			continue
		}
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
		return "", apierror.ErrMissingID
	}
	id, ok := value.(string)
	if !ok || strings.TrimSpace(id) == "" {
		return "", apierror.ErrInvalidID
	}
	return strings.TrimSpace(id), nil
}

func requireIDBytes(payload []byte) (string, error) {
	var probe struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(payload, &probe); err != nil {
		return "", err
	}
	if probe.ID == "" {
		return "", apierror.ErrMissingID
	}
	return strings.TrimSpace(probe.ID), nil
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
