package audit

import (
	"context"
	"fmt"
	"testing"
	"time"
)

var idCounter int

func testIDFunc() string {
	idCounter++
	return fmt.Sprintf("audit_%d", idCounter)
}

// memStore implements Store for testing.
type memStore struct {
	entries []Entry
}

func (m *memStore) Append(_ context.Context, entry Entry) error {
	m.entries = append(m.entries, entry)
	return nil
}

func (m *memStore) Query(_ context.Context, q Query) ([]Entry, int, error) {
	var results []Entry
	for _, e := range m.entries {
		if q.UserID != "" && e.UserID != q.UserID {
			continue
		}
		if q.Action != "" && e.Action != q.Action {
			continue
		}
		if q.Resource != "" && e.Resource != q.Resource {
			continue
		}
		results = append(results, e)
	}
	total := len(results)
	if q.Offset >= len(results) {
		return nil, total, nil
	}
	results = results[q.Offset:]
	if q.Limit > 0 && len(results) > q.Limit {
		results = results[:q.Limit]
	}
	return results, total, nil
}

func waitForEntries(store *memStore, n int) {
	for i := 0; i < 50; i++ {
		if len(store.entries) >= n {
			return
		}
		time.Sleep(10 * time.Millisecond)
	}
}

func TestService_Log(t *testing.T) {
	store := &memStore{}
	svc := NewService(store, testIDFunc)

	svc.Log(context.Background(), "user_1", "Nguyễn Văn A", "admin",
		ActionCreate, "tournament", "t_123", nil)

	waitForEntries(store, 1)

	if len(store.entries) != 1 {
		t.Fatalf("expected 1 entry, got %d", len(store.entries))
	}
	if store.entries[0].Action != ActionCreate {
		t.Errorf("expected create, got %s", store.entries[0].Action)
	}
}

func TestService_LogWithChanges(t *testing.T) {
	store := &memStore{}
	svc := NewService(store, testIDFunc)

	changes := map[string]Change{
		"belt":   {Before: "Nhất đẳng", After: "Nhị đẳng"},
		"weight": {Before: 65.0, After: 68.5},
	}
	svc.Log(context.Background(), "admin_1", "Admin", "super_admin",
		ActionUpdate, "athlete", "a_456", changes)

	waitForEntries(store, 1)

	if len(store.entries[0].Changes) != 2 {
		t.Errorf("expected 2 changes, got %d", len(store.entries[0].Changes))
	}
}

func TestService_Search_FilterByUser(t *testing.T) {
	store := &memStore{}
	svc := NewService(store, testIDFunc)

	svc.Log(nil, "user_1", "A", "user", ActionLogin, "session", "", nil)
	svc.Log(nil, "user_2", "B", "user", ActionLogin, "session", "", nil)
	svc.Log(nil, "user_1", "A", "user", ActionCreate, "tournament", "t1", nil)

	waitForEntries(store, 3)

	entries, total, _ := svc.Search(context.Background(), Query{UserID: "user_1"})
	if total != 2 {
		t.Errorf("expected total 2, got %d", total)
	}
	if len(entries) != 2 {
		t.Errorf("expected 2 entries, got %d", len(entries))
	}
}

func TestSlogAttrs(t *testing.T) {
	entry := Entry{
		ID: "test_1", UserID: "u1", Action: ActionDelete,
		Resource: "club", ResourceID: "c1", IPAddress: "1.2.3.4",
	}
	attrs := SlogAttrs(entry)
	if len(attrs) < 4 {
		t.Errorf("expected at least 4 attrs, got %d", len(attrs))
	}
}

func TestMarshalEntry(t *testing.T) {
	entry := Entry{ID: "test_1", UserID: "u1", Action: ActionExport, Resource: "athletes"}
	data, err := MarshalEntry(entry)
	if err != nil {
		t.Fatalf("marshal error: %v", err)
	}
	if len(data) == 0 {
		t.Error("expected non-empty JSON")
	}
}
